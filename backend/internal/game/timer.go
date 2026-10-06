package game

import (
	"context"
	"log"
	"math"
	"sync"
	"time"
)

type Timer struct {
	Type      string
	duration  int
	remaining int
	isRunning bool
	deadline  time.Time
	mu        sync.RWMutex
	ctx       context.Context // Store the context
	cancel    context.CancelFunc
}

type TimerMessage struct {
	Type      string `json:"type"`
	Remaining int    `json:"remaining"`
}

func NewTimer(ctx context.Context, timerType string, duration int) *Timer {

	timerCtx, cancel := context.WithCancel(ctx)
	return &Timer{
		Type:      timerType,
		duration:  duration,
		remaining: duration,
		isRunning: false,
		ctx:       timerCtx, // Store the context
		cancel:    cancel,
	}

}

// A ticker wakes the timer; elapsed time comes from a monotonic deadline.
func (t *Timer) StartCountdown(onFinish func(), onCancel func()) <-chan int {
	t.mu.Lock()
	t.isRunning = true
	t.remaining = max(0, t.duration)
	t.deadline = time.Now().Add(time.Duration(t.remaining) * time.Second)
	initial := t.remaining
	t.mu.Unlock()
	ticks := make(chan int, 1)
	if t.ctx.Err() == nil {
		ticks <- initial
	}
	go func() {
		defer close(ticks)
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()
		for {
			if t.ctx.Err() != nil {
				t.mu.Lock()
				t.isRunning = false
				t.remaining = 0
				t.mu.Unlock()
				if onCancel != nil {
					onCancel()
				}
				return
			}
			t.mu.Lock()
			remaining := max(0, int(math.Ceil(time.Until(t.deadline).Seconds())))
			t.remaining = remaining
			finished := remaining == 0
			if finished {
				t.isRunning = false
			}
			t.mu.Unlock()
			if finished {
				if initial != 0 {
					select {
					case ticks <- 0:
					case <-t.ctx.Done():
						return
					}
				}
				if onFinish != nil {
					onFinish()
				}
				return
			}
			select {
			case <-t.ctx.Done():
				continue
			case <-ticker.C:
				t.mu.Lock()
				remaining = max(0, int(math.Ceil(time.Until(t.deadline).Seconds())))
				t.remaining = remaining
				t.mu.Unlock()
				if remaining > 0 {
					select {
					case ticks <- remaining:
					case <-t.ctx.Done():
					}
				}
			}
		}
	}()
	return ticks
}

func (t *Timer) Remaining() int {
	t.mu.RLock()
	defer t.mu.RUnlock()
	if !t.isRunning {
		return t.remaining
	}
	return max(0, int(math.Ceil(time.Until(t.deadline).Seconds())))
}

func (g *Game) CancelTimer(timerType string) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	if timer, exists := g.timers[timerType]; exists {
		log.Printf("Cancelling timer %s", timerType)
		timer.Cancel()
		delete(g.timers, timerType)

	}
}

func (t *Timer) Cancel() {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.cancel() // Also cancel a timer that has not begun its goroutine yet.
	t.isRunning = false
	t.remaining = 0
}

// Caller holds g.Mu when accessing the game timer map.
func (g *Game) GetRemainingTime(timerType string) int {
	if timer, exists := g.timers[timerType]; exists {
		return timer.Remaining()
	}
	return 0
}

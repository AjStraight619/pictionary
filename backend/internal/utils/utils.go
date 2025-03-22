package utils

import (
	"encoding/json"
	"time"
)

func CreateMessage(msgType string, payload interface{}) ([]byte, error) {
	message := map[string]interface{}{
		"type":    msgType,
		"payload": payload,
	}
	b, err := json.Marshal(message)
	return b, err
}

func Delay(delay time.Duration, fn func()) {
	go func() {
		time.Sleep(delay)
		fn()
	}()
}

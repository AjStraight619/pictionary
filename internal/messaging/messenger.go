package messaging

import e "github.com/Ajstraight619/pictionary-server/internal/events"

type Messenger interface {
	BroadcastMessage(message []byte)
	SendToPlayer(playerID string, message []byte)
	GameEventChannel() <-chan e.GameEvent
}

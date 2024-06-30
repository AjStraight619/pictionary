package db

import "time"

type SimpleGame struct {
	ID        string    `json:"id" gorm:"column:id"`
	Name      string    `json:"name" gorm:"column:name"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updatedAt"`
	Status    string    `json:"status" gorm:"column:status"`
}

type SimplePlayer struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

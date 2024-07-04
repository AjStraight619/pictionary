package db

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var dbInstance *gorm.DB

func GetDB(connStr string) (*gorm.DB, error) {

	if dbInstance == nil {
		var err error
		dbInstance, err = gorm.Open(postgres.Open(connStr), &gorm.Config{})
		if err != nil {
			return nil, err
		}
	}
	return dbInstance, nil
}

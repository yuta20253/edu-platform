// Package config は環境変数からアプリケーションの設定値を読み込みます。
package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config はアプリケーション全体で共有する設定値です。
type Config struct {
	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
	Port       string
	LogLevel   string
	AppEnv     string
}

// Load は環境変数から設定値を読み込みます。
func Load() (*Config, error) {
	dbPort, err := strconv.Atoi(os.Getenv("DB_PORT"))
	if err != nil {
		return nil, fmt.Errorf("DB_PORTの読み込みに失敗しました: %w", err)
	}

	return &Config{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     dbPort,
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		Port:       os.Getenv("PORT"),
		LogLevel:   os.Getenv("LOG_LEVEL"),
		AppEnv:     os.Getenv("APP_ENV"),
	}, nil
}

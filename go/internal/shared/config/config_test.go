package config

import (
	"testing"
)

type loadCase struct {
	name    string
	env     map[string]string
	want    Config
	wantErr bool
}

func validEnv() map[string]string {
	return map[string]string{
		"DB_HOST":     "db",
		"DB_PORT":     "3306",
		"DB_USER":     "root",
		"DB_PASSWORD": "password",
		"DB_NAME":     "myapp_development",
		"PORT":        "8080",
		"LOG_LEVEL":   "debug",
		"APP_ENV":     "development",
	}
}

func loadCases() []loadCase {
	return []loadCase{
		{
			name: "すべての環境変数が設定されていると読み込める",
			env:  validEnv(),
			want: Config{
				DBHost:     "db",
				DBPort:     3306,
				DBUser:     "root",
				DBPassword: "password",
				DBName:     "myapp_development",
				Port:       "8080",
				LogLevel:   "debug",
				AppEnv:     "development",
			},
		},
		{
			name:    "DB_PORTが数値でないとエラーになる",
			env:     withEnv(validEnv(), "DB_PORT", "abc"),
			wantErr: true,
		},
		{
			name:    "DB_PORTが未設定だとエラーになる",
			env:     withEnv(validEnv(), "DB_PORT", ""),
			wantErr: true,
		},
	}
}

func TestLoad(t *testing.T) {
	for _, tt := range loadCases() {
		t.Run(tt.name, func(t *testing.T) {
			for k, v := range tt.env {
				t.Setenv(k, v)
			}

			got, err := Load()
			if tt.wantErr {
				if err == nil {
					t.Fatalf("Load() error = nil, want error")
				}
				return
			}

			if err != nil {
				t.Fatalf("Load() error = %v, want nil", err)
			}

			if *got != tt.want {
				t.Errorf("Load() = %+v, want %+v", *got, tt.want)
			}
		})
	}
}

func withEnv(base map[string]string, key, value string) map[string]string {
	m := make(map[string]string, len(base))
	for k, v := range base {
		m[k] = v
	}

	m[key] = value

	return m
}

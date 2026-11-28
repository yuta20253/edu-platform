package password

import (
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestHash(t *testing.T) {
	const plain = "0123456789abcdef0123456789abcdef"

	first, err := Hash(plain)
	if err != nil {
		t.Fatalf("Hash() error = %v, want nil", err)
	}

	second, err := Hash(plain)
	if err != nil {
		t.Fatalf("Hash() error = %v, want nil", err)
	}

	if first == second {
		t.Errorf("同じ入力のハッシュが一致しました: %q", first)
	}

	for _, h := range []string{first, second} {
		if err := bcrypt.CompareHashAndPassword([]byte(h), []byte(plain)); err != nil {
			t.Errorf("CompareHashAndPassword(%q) error = %v, want nil", h, err)
		}

		cost, err := bcrypt.Cost([]byte(h))
		if err != nil || cost != 12 {
			t.Errorf("bcrypt.Cost(%q) = %d, %v, want 12, nil", h, cost, err)
		}

		if !strings.HasPrefix(h, "$2a$12$") {
			t.Errorf("ハッシュの形式 = %q, want $2a$12$ で始まる（Devise互換）", h)
		}
	}
}

func TestHash_DeviseCompatible(t *testing.T) {
	// Rails（Devise・bcrypt gem、stretches=12・pepperなし）で
	// BCrypt::Password.create("devise-compat-password", cost: 12) により生成したハッシュ
	const deviseHash = "$2a$12$O9tOBT.EE1bl3Wu.Wh5wEOQlXMQ1RTmtWdVNVnPgS7yVTGkzOsOIa"

	tests := []struct {
		name    string
		plain   string
		wantErr bool
	}{
		{name: "Deviseが生成したハッシュを正しいパスワードで検証できる",
			plain: "devise-compat-password"},
		{name: "誤ったパスワードは検証に失敗する", plain: "wrong", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := bcrypt.CompareHashAndPassword([]byte(deviseHash), []byte(tt.plain))
			if (err != nil) != tt.wantErr {
				t.Errorf("CompareHashAndPassword() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

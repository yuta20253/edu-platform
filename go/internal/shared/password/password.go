// Package password はパスワードのハッシュ化を提供します。
// Rails（Devise）の設定（stretches = 12・pepperなし）と互換のbcryptハッシュを生成し、
// Rails側・Go側のどちらで生成したハッシュも同じ方法で検証できるようにします。
package password

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// cost はbcryptのコストです。Rails（Devise）の config.stretches = 12 と同じ値にします。
const cost = 12

// Hash は平文のパスワードをbcryptでハッシュ化します。同じ入力でも毎回異なるハッシュになります。
func Hash(plain string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(plain), cost)
	if err != nil {
		return "", fmt.Errorf("パスワードのハッシュ化に失敗しました: %w", err)
	}

	return string(hashed), nil
}

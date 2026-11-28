package application

import (
	"errors"
	"testing"
)

func TestService_FindUserByEmail(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	active := mustInsertUser(t, db, userSeed{email: "taro@example.com", roleID: refs.roleIDs[1]})
	deactivated := mustInsertUser(t, db, userSeed{email: "old@example.com", roleID: refs.roleIDs[1],
		deactivated: true})

	tests := []struct {
		name      string
		email     string
		wantID    uint
		wantFound bool
	}{
		{name: "一致するユーザーを返す", email: "taro@example.com", wantID: active, wantFound: true},
		{name: "前後の空白を除去し小文字化して照合する", email: "  Taro@Example.COM \t",
			wantID: active, wantFound: true},
		{name: "無効化済みのユーザーも返す", email: "old@example.com", wantID: deactivated, wantFound: true},
		{name: "該当しなければ見つからない", email: "none@example.com"},
		{name: "形式が不正なら見つからない", email: "taro.example.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, found, err := svc.FindUserByEmail(t.Context(), tt.email)
			if err != nil {
				t.Fatalf("FindUserByEmail() error = %v, want nil", err)
			}

			if found != tt.wantFound || got.ID != tt.wantID {
				t.Errorf("FindUserByEmail(%q) = (id=%d, %v), want (id=%d, %v)",
					tt.email, got.ID, found, tt.wantID, tt.wantFound)
			}

			if found && got.Deactivated != (tt.wantID == deactivated) {
				t.Errorf("Deactivated = %v, want %v", got.Deactivated, tt.wantID == deactivated)
			}
		})
	}
}

func TestService_FindUserByEmail_Required(t *testing.T) {
	db, refs := setupTestDB(t)
	svc := newTestService(db, refs).svc

	for _, email := range []string{"", "   "} {
		_, found, err := svc.FindUserByEmail(t.Context(), email)
		if !errors.Is(err, ErrLookupEmailRequired) || found {
			t.Errorf("FindUserByEmail(%q) = %v, %v, want false, %v",
				email, found, err, ErrLookupEmailRequired)
		}
	}
}

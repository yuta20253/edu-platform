package pagination

import (
	"encoding/json"
	"testing"
)

func TestNewMeta(t *testing.T) {
	tests := []struct {
		name       string
		page       int
		perPage    int
		totalCount int64
		want       Meta
	}{
		{"割り切れる件数", 1, 10, 40, Meta{CurrentPage: 1, TotalPages: 4, TotalCount: 40, PerPage: 10}},
		{"端数があると切り上げる", 2, 10, 42, Meta{CurrentPage: 2, TotalPages: 5, TotalCount: 42, PerPage: 10}},
		{"1件だけでも1ページ", 1, 10, 1, Meta{CurrentPage: 1, TotalPages: 1, TotalCount: 1, PerPage: 10}},
		{"0件のときは1ページとする", 1, 10, 0, Meta{CurrentPage: 1, TotalPages: 1, TotalCount: 0, PerPage: 10}},
		{
			"総ページ数を超えるpageもそのまま返す", 9, 10, 15,
			Meta{CurrentPage: 9, TotalPages: 2, TotalCount: 15, PerPage: 10},
		},
		{
			"perPageが0以下でも1ページとして算出する", 1, 0, 5,
			Meta{CurrentPage: 1, TotalPages: 1, TotalCount: 5, PerPage: 0},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewMeta(tt.page, tt.perPage, tt.totalCount)
			if got != tt.want {
				t.Errorf("NewMeta(%d, %d, %d) = %+v, want %+v",
					tt.page, tt.perPage, tt.totalCount, got, tt.want)
			}
		})
	}
}

func TestMeta_JSON(t *testing.T) {
	got, err := json.Marshal(NewMeta(1, 10, 42))
	if err != nil {
		t.Fatalf("Marshal() error = %v, want nil", err)
	}

	want := `{"current_page":1,"total_pages":5,"total_count":42,"per_page":10}`
	if string(got) != want {
		t.Errorf("JSON = %s, want %s", got, want)
	}
}

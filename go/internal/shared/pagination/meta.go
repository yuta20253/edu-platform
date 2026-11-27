// Package pagination は一覧APIのレスポンスに含めるページネーションのメタ情報を提供します。
// GORMには依存しません。
package pagination

// Meta は一覧レスポンスの meta に含める、ページネーションの情報です。
type Meta struct {
	CurrentPage int `json:"current_page"`
	TotalPages  int `json:"total_pages"`
	TotalCount  int `json:"total_count"`
	PerPage     int `json:"per_page"`
}

// NewMeta は受け取った値から総ページ数を算出して Meta を返します。
// 総ページ数は ceil(totalCount / perPage) で、totalCount が0件のとき、
// および perPage が0以下のときは1ページとします。
func NewMeta(page, perPage int, totalCount int64) Meta {
	totalPages := 1
	if perPage > 0 && totalCount > 0 {
		totalPages = int((totalCount + int64(perPage) - 1) / int64(perPage))
	}

	return Meta{
		CurrentPage: page,
		TotalPages:  totalPages,
		TotalCount:  int(totalCount),
		PerPage:     perPage,
	}
}

// Package middleware はGinのミドルウェアのうち、全リクエストに共通するものを提供します。
package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// AccessLogger はリクエストごとにメソッド・パス・ステータス・処理時間を記録します。
// 最も外側のミドルウェアとして登録します。
func AccessLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		logger.InfoContext(c.Request.Context(), "request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
		)
	}
}

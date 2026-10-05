import "@testing-library/jest-dom";

// date-fns の format() 等はシステムのローカルタイムゾーンで変換するため、
// 実行環境依存で結果がぶれないようアプリの対象タイムゾーン(JST)に固定する。
process.env.TZ = "Asia/Tokyo";

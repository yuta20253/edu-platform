import { cookies } from "next/headers";
import { RailsFetchError, RailsUnauthorizedError } from "./railsError";

type RailsFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
};

type RailsFetchResult<T> = {
  status: number;
  data: T;
  setCookie: string | null;
};

/**
 * サーバ専用：Rails APIへ Cookie をforwardしてfetchする共通関数
 * - Cookieヘッダ生成をここに集約
 * - 401は専用例外で統一
 * - JSONパース失敗時も扱う
 */
export async function railsFetch<T = unknown>(
  path: string,
  opts: RailsFetchOptions = {},
): Promise<RailsFetchResult<T>> {
  const origin = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!origin) {
    throw new Error("API_URL is not set");
  }

  // Next.js に入ってきた Cookie を Rails へ forward
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(opts.headers ?? {}),
  };

  const response = await fetch(`${origin}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache ?? "no-store",
  });

  if (response.status === 401) {
    throw new RailsUnauthorizedError();
  }

  const setCookie = response.headers.get("set-cookie");

  // JSON前提だが、失敗しても落としすぎない
  let data: T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    data = (await response.json()) as T;
  } else {
    // JSONじゃない場合はテキストとして返す（デバッグ用）
    const text = await response.text();
    data = text as T;
  }

  if (!response.ok) {
    const bodyText =
      typeof data === "string" ? data : JSON.stringify(data).slice(0, 2000);
    throw new RailsFetchError(response.status, `Rails request failed: ${response.status}`, bodyText);
  }

  return { status: response.status, data, setCookie };
}

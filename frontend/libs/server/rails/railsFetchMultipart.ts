import { cookies } from "next/headers";
import { RailsFetchError, RailsUnauthorizedError } from "./railsError";

type RailsFetchMultipartResult<T> = {
  status: number;
  data: T;
  setCookie: string | null;
};

/**
 * サーバ専用：multipart/form-data を Rails API へ Cookie をforwardして送る共通関数
 * - railsFetch は JSON専用のため、ファイルアップロードにはこちらを使う
 * - FormData を渡すと fetch が Content-Type: multipart/form-data を自動付与する
 */
export async function railsFetchMultipart<T = unknown>(
  path: string,
  formData: FormData,
): Promise<RailsFetchMultipartResult<T>> {
  const origin = process.env.API_URL;
  if (!origin) {
    throw new Error("API_URL is not set");
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: formData,
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new RailsUnauthorizedError();
  }

  const setCookie = response.headers.get("set-cookie");

  let data: T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    data = (await response.json()) as T;
  } else {
    const text = await response.text();
    data = text as T;
  }

  if (!response.ok) {
    const bodyText =
      typeof data === "string" ? data : JSON.stringify(data).slice(0, 2000);
    throw new RailsFetchError(
      response.status,
      `Rails request failed: ${response.status}`,
      bodyText,
    );
  }

  return { status: response.status, data, setCookie };
}

import "server-only";
import { API_ORIGIN } from "./apiFetch";
import { MeUser } from "@/types/common/me";

// /me の取得に失敗した(401 以外)ことを表す。未ログインではなく障害として扱う。
// 本番ではメッセージが伏せられ digest だけが渡るので、サーバーのログとの突き合わせ用に
// HTTP ステータスを持たせる。
export class MeFetchError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "MeFetchError";
    this.status = status;
  }
}

// 契約: /me が 401 なら未ログイン(null)。それ以外の失敗は障害(MeFetchError。
// 通信失敗は fetch の例外のまま)。200 なら user。
export const getMeFromBackend = async (
  cookieHeader: string,
): Promise<MeUser | null> => {
  const response = await fetch(`${API_ORIGIN}/api/v1/me`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
      Acccept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new MeFetchError(
      response.status,
      `/api/v1/me の取得に失敗しました (status: ${response.status})`,
    );
  }

  const data = (await response.json().catch(() => undefined)) as
    | { user?: MeUser }
    | undefined;

  if (!data?.user) {
    throw new MeFetchError(
      response.status,
      "/api/v1/me のレスポンスが不正です",
    );
  }

  return data.user;
};

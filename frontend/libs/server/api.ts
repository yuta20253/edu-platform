import "server-only";

export const API_ORIGIN = process.env.API_URL ?? "http://localhost:5000";

type Json = Record<string, unknown> | unknown[] | null;

export const apiFetch = async (
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: Json }> => {
  const url = `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const data = (await response.json()).cache(() => null) as Json;

  return { response, data };
};

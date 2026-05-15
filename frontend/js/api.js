import { clearToken, getToken } from "./auth.js";

export class ApiError extends Error {
  constructor(status, code, msg) {
    super(msg);
    this.status = status;
    this.code = code;
    this.msg = msg;
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const init = { ...options, headers };
  if (init.body !== undefined && typeof init.body !== "string") {
    init.body = JSON.stringify(init.body);
  }

  const res = await fetch(path, init);

  if (res.status === 401) {
    clearToken();
    const onLogin = location.pathname.endsWith("/login.html");
    if (!onLogin) location.replace("/pages/login.html");
    const data = await safeJson(res);
    throw new ApiError(401, data?.code || "UNAUTHORIZED", data?.msg || "인증이 필요합니다");
  }

  if (res.status === 204) return null;

  const data = await safeJson(res);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.code || "HTTP_ERROR",
      data?.msg || `요청 실패 (HTTP ${res.status})`
    );
  }
  return data;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

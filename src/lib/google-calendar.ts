import { createSign } from "node:crypto";

/**
 * 서비스 계정으로 구글 캘린더에 접속. 서버에서만 쓴다.
 *
 * 구글 서비스 계정은 "출입증"이 아니라 "도장"이다.
 * 개인키로 서명한 쪽지(JWT)를 구글에 내밀면 1시간짜리 출입증(access token)을 내준다.
 * 라이브러리(googleapis)를 쓰지 않는 이유: 이 서명 한 번이면 끝이라 node 기본 crypto로 충분하다.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar";
const API = "https://www.googleapis.com/calendar/v3";

type ServiceAccount = { client_email: string; private_key: string };

function serviceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 없습니다 (Vercel 설정 확인)");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON 이 올바른 JSON이 아닙니다 (한 줄로 넣었는지 확인)");
  }
  const sa = parsed as Partial<ServiceAccount>;
  if (typeof sa.client_email !== "string" || typeof sa.private_key !== "string") {
    throw new Error("키 파일에 client_email 또는 private_key 가 없습니다");
  }
  return { client_email: sa.client_email, private_key: sa.private_key };
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

/** 출입증은 1시간짜리라 서버가 살아 있는 동안 재사용한다 */
let cached: { token: string; expiresAt: number } | null = null;

export async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const sa = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 };
  const body = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claim))}`;

  const signer = createSign("RSA-SHA256");
  signer.update(body);
  // 환경변수를 거치며 줄바꿈이 \n 글자로 바뀌어 있을 수 있어 되돌린다
  const jwt = `${body}.${signer.sign(sa.private_key.replace(/\\n/g, "\n"), "base64url")}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`구글 출입증 발급 실패: ${data.error_description ?? res.status}`);
  }
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cached.token;
}

/** 구글이 주는 일정 중 우리가 쓰는 칸만 */
export type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  status?: string;
  created?: string;
  updated?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
};

/** 한 캘린더의 일정 목록 (기간 지정, 반복 일정은 펼쳐서) */
export async function listEvents(calendarId: string, timeMin: string, timeMax: string): Promise<GoogleEvent[]> {
  const token = await accessToken();
  const out: GoogleEvent[] = [];
  let pageToken: string | undefined;

  do {
    const q = new URLSearchParams({
      timeMin, timeMax,
      singleEvents: "true", // 반복 일정을 하나씩 펼쳐서 받는다
      orderBy: "startTime",
      timeZone: "Asia/Seoul", // 시각을 한국 시간으로 받아야 글자를 그대로 잘라 쓸 수 있다
      maxResults: "250",
      fields: "nextPageToken,items(id,summary,description,status,created,updated,start,end)",
    });
    if (pageToken) q.set("pageToken", pageToken);

    const res = await fetch(`${API}/calendars/${encodeURIComponent(calendarId)}/events?${q}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      const why = body?.error?.message ?? `HTTP ${res.status}`;
      if (res.status === 404) throw new Error(`캘린더를 찾을 수 없습니다 (${calendarId}) — 서비스 계정에 공유했는지 확인하세요`);
      if (res.status === 403) throw new Error(`캘린더 접근이 거부됐습니다 (${calendarId}) — 공유 권한이 '일정 변경'인지 확인하세요: ${why}`);
      throw new Error(`구글 캘린더 읽기 실패 (${calendarId}): ${why}`);
    }
    const data = (await res.json()) as { items?: GoogleEvent[]; nextPageToken?: string };
    out.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return out;
}

async function write(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<Response> {
  const token = await accessToken();
  return fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

async function fail(res: Response, what: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  throw new Error(`${what} 실패: ${body?.error?.message ?? `HTTP ${res.status}`}`);
}

/** 일정 만들기 → 구글이 붙여준 일정 id를 돌려준다 */
export async function createEvent(calendarId: string, body: unknown): Promise<string> {
  const res = await write("POST", `/calendars/${encodeURIComponent(calendarId)}/events`, body);
  if (!res.ok) await fail(res, "구글 일정 만들기");
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("구글이 일정 id를 주지 않았습니다");
  return data.id;
}

/** 일정 고치기 (보낸 칸만 바뀐다) */
export async function patchEvent(calendarId: string, eventId: string, body: unknown): Promise<void> {
  const res = await write("PATCH", `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, body);
  if (!res.ok) await fail(res, "구글 일정 고치기");
}

/** 일정 지우기. 이미 없으면(410·404) 성공으로 친다 — 지우려던 결과는 같으므로 */
export async function deleteEvent(calendarId: string, eventId: string): Promise<void> {
  const res = await write("DELETE", `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`);
  if (!res.ok && res.status !== 404 && res.status !== 410) await fail(res, "구글 일정 지우기");
}

/** 서비스 계정이 실제로 접근 가능한지 확인용 — 설정 화면의 '연결 확인' 단추가 쓴다 */
export async function checkAccess(calendarId: string): Promise<{ ok: true; summary: string } | { ok: false; why: string }> {
  try {
    const token = await accessToken();
    const res = await fetch(`${API}/calendars/${encodeURIComponent(calendarId)}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      return { ok: false, why: body?.error?.message ?? `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { summary?: string };
    return { ok: true, summary: data.summary ?? calendarId };
  } catch (e) {
    return { ok: false, why: e instanceof Error ? e.message : String(e) };
  }
}

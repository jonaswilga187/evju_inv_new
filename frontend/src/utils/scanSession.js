const COOKIE_NAME = 'scan_session_id';
const MAX_AGE_SEC = 60 * 60; // 1 Stunde

export function setScanSessionId(sessionId) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax`;
}

export function getScanSessionId() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

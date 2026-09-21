/**
 * Where to land the user after auth when something sent them to sign-in first —
 * notably the OAuth consent screen at /.lovable/oauth/consent (MCP clients).
 *
 * Stored in sessionStorage so it survives the Google/SSO round-trip through
 * /auth/callback, which cannot receive extra query params.
 */
const KEY = "postAuthRedirect";

/** Only same-origin relative paths are ever honoured. */
export function isSafeRedirect(path: string | null | undefined): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//");
}

export function storePostAuthRedirect(path: string | null | undefined) {
  if (isSafeRedirect(path)) sessionStorage.setItem(KEY, path);
}

export function takePostAuthRedirect(): string | null {
  const value = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  return isSafeRedirect(value) ? value : null;
}

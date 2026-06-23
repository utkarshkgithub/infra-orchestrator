const SESSION_STORAGE_KEY = "hasSession";
const SESSION_RETURN_PARAM = "session";

export function hasSessionHint() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSessionHint() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures; the secure cookie remains the source of truth.
  }
}

export function clearSessionHint() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function readInitialSessionHint() {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  const returnedFromOAuth = url.searchParams.get(SESSION_RETURN_PARAM) === "1";

  if (returnedFromOAuth) {
    setSessionHint();
    url.searchParams.delete(SESSION_RETURN_PARAM);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    return true;
  }

  return hasSessionHint();
}

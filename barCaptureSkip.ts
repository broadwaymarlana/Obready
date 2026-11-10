export const BAR_CAPTURE_SKIP_KEY = "objection-ready:bar-capture-skipped";

export function isBarCaptureSkipped(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(BAR_CAPTURE_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function setBarCaptureSkipped(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BAR_CAPTURE_SKIP_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearBarCaptureSkipped(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BAR_CAPTURE_SKIP_KEY);
  } catch {
    // ignore
  }
}

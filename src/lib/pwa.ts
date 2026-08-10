export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag for "launched from home screen icon"
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

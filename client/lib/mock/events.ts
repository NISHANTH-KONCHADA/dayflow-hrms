/**
 * Minimal in-browser event bus standing in for the WebSocket broadcasts
 * described in docs/IMPLEMENTATION_PLAN.md (attendance:update, leave:update).
 * Any view showing attendance/leave data subscribes here so a check-in or
 * approval elsewhere updates it without a manual refetch.
 */
type MockEventName = "attendance:update" | "leave:update";

const bus = typeof window !== "undefined" ? new EventTarget() : null;

export function emitMockEvent(name: MockEventName): void {
  bus?.dispatchEvent(new Event(name));
}

export function subscribeMockEvent(name: MockEventName, handler: () => void): () => void {
  if (!bus) return () => {};
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
}

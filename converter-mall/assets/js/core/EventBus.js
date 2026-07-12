export class EventBusClass {
  #listeners = new Map();

  on(eventName, callback, { signal } = {}) {
    const event = String(eventName || "").trim();
    if (!event || typeof callback !== "function") return () => {};
    if (signal?.aborted) return () => {};
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(callback);
    const unsubscribe = () => this.off(event, callback);
    signal?.addEventListener("abort", unsubscribe, { once: true });
    return unsubscribe;
  }

  once(eventName, callback, options = {}) {
    let unsubscribe = () => {};
    unsubscribe = this.on(eventName, payload => {
      unsubscribe();
      callback(payload);
    }, options);
    return unsubscribe;
  }

  off(eventName, callback) {
    const event = String(eventName || "").trim();
    const listeners = this.#listeners.get(event);
    if (!listeners) return false;
    const removed = listeners.delete(callback);
    if (!listeners.size) this.#listeners.delete(event);
    return removed;
  }

  emit(eventName, payload = undefined) {
    const event = String(eventName || "").trim();
    const listeners = [...(this.#listeners.get(event) || [])];
    const errors = [];
    for (const callback of listeners) {
      try { callback(payload); } catch (error) { errors.push(error); }
    }
    if (errors.length && typeof console !== "undefined") console.error(`EventBus listener error: ${event}`, errors);
    return { delivered: listeners.length, errors };
  }

  async emitAsync(eventName, payload = undefined) {
    const event = String(eventName || "").trim();
    const listeners = [...(this.#listeners.get(event) || [])];
    const results = await Promise.allSettled(listeners.map(callback => callback(payload)));
    return { delivered: listeners.length, results };
  }

  clear(eventName = null) {
    if (eventName == null) this.#listeners.clear();
    else this.#listeners.delete(String(eventName));
  }

  listenerCount(eventName) { return this.#listeners.get(String(eventName))?.size || 0; }
  eventNames() { return [...this.#listeners.keys()]; }
}

export const EventBus = new EventBusClass();
if (typeof window !== "undefined") window.ConverterEventBus = EventBus;
export default EventBus;

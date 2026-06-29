/**
 * Puzzle Studio Ultimate
 * Version: v0.1.0
 *
 * EventBus
 * ----------
 * 중앙 이벤트 시스템.
 * 시스템 간 직접 의존성을 제거하고
 * Publish / Subscribe 구조를 제공한다.
 */

export default class EventBus {
    constructor() {
        this.events = new Map();
    }

    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }

        this.events.get(eventName).add(callback);
    }

    once(eventName, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(eventName, wrapper);
        };

        this.on(eventName, wrapper);
    }

    off(eventName, callback) {
        if (!this.events.has(eventName)) return;

        this.events.get(eventName).delete(callback);

        if (this.events.get(eventName).size === 0) {
            this.events.delete(eventName);
        }
    }

    emit(eventName, payload = null) {
        if (!this.events.has(eventName)) return;

        for (const callback of this.events.get(eventName)) {
            callback(payload);
        }
    }

    clear() {
        this.events.clear();
    }
}
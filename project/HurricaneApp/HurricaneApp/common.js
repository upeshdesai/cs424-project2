var common;
(function (common) {
    class LiteEvent {
        constructor() {
            this.handlers = [];
        }
        on(handler) {
            this.handlers.push(handler);
        }
        off(handler) {
            this.handlers = this.handlers.filter(h => h !== handler);
        }
        trigger(data) {
            if (this.handlers) {
                this.handlers.slice(0).forEach(h => h(data));
            }
        }
    }
    common.LiteEvent = LiteEvent;
})(common || (common = {}));
//# sourceMappingURL=common.js.map
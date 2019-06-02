function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import Debug from './debug.js';
export default class {
  constructor() {
    _defineProperty(this, "events", {});
  }

  on(event, callback = () => {}) {
    if (typeof event !== 'string') Debug.error(`Must provide an event string.`);
    this.events[event] = this.events[event] || [];
    if (typeof callback !== 'function') Debug.error(`Callback isn't a function,`);
    return new Promise(resolve => this.events[event].push(function () {
      callback(...arguments);
      resolve(...arguments);
    }));
  }

  emit(event, data) {
    if (typeof event !== 'string') Debug.error(`Must provide an event string.`);
    if (!this.events[event]) return false;

    for (const i of this.events[event]) i(...Array.from(arguments).splice(1, arguments.length));
  }

}
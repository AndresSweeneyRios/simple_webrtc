const Debug = require('./debug.js')

module.exports = context => {
    const events = {}

    context.on = (event, callback = () => {}) => {
        if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
        events[event] = events[event] || []
        if (typeof callback !== 'function') Debug.error(`Callback isn't a function,`)
        events[event].push(callback)
    }

    context.emit = (event, data = {}, spread = false) => {
        if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
        if (!events[event]) return false;
        if (spread) for (const i of events[event]) i(...data)
        else for (const i of events[event]) i(data)
    }

    return context;
}
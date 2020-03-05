import Debug from './debug.js'

export default () => {
    const events = []

    return {
        on ( event, callback = () => {} ) {
            if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
            events[event] = events[event] || []
            if (typeof callback !== 'function') Debug.error(`Callback isn't a function,`)
            
            return new Promise(resolve => events[event].push( (...args) => {
                callback(...args)
                resolve(...args)
            }))
        },

        emit ( event, ...args ) {
            if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
            if (!events[event]) return false
            for (const i of events[event]) i(...args)
        },
    }
}
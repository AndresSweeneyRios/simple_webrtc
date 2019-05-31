import Debug from './debug.js'

export default context => {
    const events = {}

    context.on = async (event, callback = () => {}) => {
        if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
        events[event] = events[event] || []
		if (typeof callback !== 'function') Debug.error(`Callback isn't a function,`)
		
        return await new Promise(resolve => events[event].push( data => {
			callback(data)
			resolve(data)
		}))
    }

    context.emit = async (event, data = {}, spread = false) => {
        if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
        if (!events[event]) return false
        if (spread) for (const i of events[event]) i(...data)
        else for (const i of events[event]) i(data)
    }

    return context;
}
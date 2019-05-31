import Debug from './debug.js'

export default class {
	events = {}
	
    on ( event, callback = () => {} ) {
        if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
        this.events[event] = this.events[event] || []
		if (typeof callback !== 'function') Debug.error(`Callback isn't a function,`)
		
        return new Promise(resolve => this.events[event].push( data => {
			callback(data)
			resolve(data)
		}))
    }

    emit ( event, data = {}, spread = false ) {
        if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
        if (!this.events[event]) return false
        if (spread) for (const i of this.events[event]) i(...data)
        else for (const i of this.events[event]) i(data)
    }
}
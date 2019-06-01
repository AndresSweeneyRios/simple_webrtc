import Debug from './debug.js'

export default class {
	events = {}
	
	// adds function to the designated event

    on ( event, callback = () => {} ) {
        if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
        this.events[event] = this.events[event] || []
		if (typeof callback !== 'function') Debug.error(`Callback isn't a function,`)
		
        return new Promise(resolve => this.events[event].push( function () {
			callback(...arguments)
			resolve(...arguments)
		}))
    }


	// iterates on event's functions defined with `on`
	// spreads all arguments except `event` into the function's parameters

    emit ( event ) {
        if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
		if (!this.events[event]) return false
        for (const i of this.events[event]) i(
			...Array.from(arguments).splice(1,arguments.length)
		)
    }
}
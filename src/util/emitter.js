import Debug from './debug.js'

export default class {
	events = {}
	
	// adds function to the designated event

    get on ( ) {
		const { events } = this

		return function ( event, callback = () => {} ) {
			if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
			events[event] = events[event] || []
			if (typeof callback !== 'function') Debug.error(`Callback isn't a function,`)
			
			return new Promise(resolve => events[event].push( function () {
				callback(...arguments)
				resolve(...arguments)
			}))
		}
	}


	// iterates on event's functions defined with `on`
	// spreads all arguments except `event` into the function's parameters

    get emit ( ) {
		const { events } = this

		return function ( event ) {
			if (typeof event !== 'string') Debug.error(`Must provide an event string.`)
			if (!events[event]) return false
			for (const i of events[event]) i(
				...Array.from(arguments).splice(1,arguments.length)
			)
		}
    }
}
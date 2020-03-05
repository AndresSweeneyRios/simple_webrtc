import { debug } from '../config.js'


// adds default styles to messages before logging

const parseMessage = (type, message, p1, p2, nameStyles = '') => {
    for (const i of Object.keys(debug.name.style)) 
        nameStyles += `${i}: ${debug.name.style[i]}; `
    
    console[type](`%c${debug.name.string} %c${message}`, nameStyles )
}


export default {
    log (message) {
		parseMessage('log', message) 
	},

	error (message) {
		parseMessage('error', message)
	},
	
	dir (message)  {
		parseMessage('dir', message)
	},

	warn (message) {
		parseMessage('warn', message)
	},


	// special styles to indicate a specific method being used

	code (code) {
		parseMessage(
			'error', 
			`${code}${typeof message === 'object' ? '' : '%c', ''}`, 
			'padding: 3px 7px; background-color: rgb(40,40,40); color: white;',
		)
	},

	table (message) {
		parseMessage('table', message)
	},
}
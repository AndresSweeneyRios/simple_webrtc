import { debug } from '../config.js'

const parseMessage = (type, message, p1, p2, nameStyles = '') => {
    for (const i of Object.keys(debug.name.style)) 
        nameStyles += `${i}: ${debug.name.style[i]}; `
    
    console[type](`%c${debug.name.string} %c${message}`, nameStyles, p1 || '', p2 || '' )
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

	code (code, message) {
		parseMessage(
			'error', 
			`${code}${typeof message === 'object' ? '' : '%c', ''}`, 
			'padding: 3px 7px; background-color: rgb(40,40,40); color: white;',
			typeof message === 'object' ? message : ''
		)
	},

	table (message) {
		parseMessage('table', message)
	}
}
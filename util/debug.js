import { debug } from '../config.js'

const parseMessage = (type, message, object, nameStyles = '', messageStyles = '') => {
    for (const i of Object.keys(debug.name.style)) 
        nameStyles += `${i}: ${debug.name.style[i]}; `

    for (const i of Object.keys(debug.message.style)) 
        messageStyles += `${i}: ${debug.message.style[i]}; `
    
    console[type](`%c${debug.name.string} %c${message}${ 
		typeof object === 'object' ? '\n\n%o' : ''
	}`, nameStyles, messageStyles, object || '')
}

export default {
    log (message, object) {
		parseMessage('log', message, object) 
	},

	error (message, object) {
		parseMessage('error', message, object)
	},
	
	dir (message, object)  {
		parseMessage('dir', message, object)
	},

	warn (message, object) {
		parseMessage('warn', message, object)
	},

	code (code, message) {
		parseMessage(
			'error', 
			`%c${code}%c${message}`, 
			'padding: 5px; background-color: rgb(40,40,40); color: white;'
		)
	},

	table (message, object) {
		parseMessage('table', message, object)
	}
}
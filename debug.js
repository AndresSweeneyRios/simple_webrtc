import {debug} from './config.js'

const parseMessage = (type, message, object, nameStyles = '', messageStyles = '') => {
    for (const i of Object.keys(debug.name.style)) 
        nameStyles += `${i}: ${debug.name.style[i]}; `

    for (const i of Object.keys(debug.message.style)) 
        messageStyles += `${i}: ${debug.message.style[i]}; `
    
    if (debug.active) console[type](`%c${debug.name.string} %c${message}${ object ? '\n\n%o' : ''}`, nameStyles, messageStyles, object || '')
}

const log = (message, object) => parseMessage('log', message, object)
const error =  (message, object) => parseMessage('error', message, object)
const dir =  (message, object) => parseMessage('dir', message, object)
const warn =  (message, object) => parseMessage('warn', message, object)

export default {
    log, error, dir, warn
}
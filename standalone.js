(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.simple_webrtc = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const debug = {
    name: {
        string: '[Simple WebRTC]',

        style: {
            color: '#ff69b4',
            'font-weight': '600'
        }
    },

    message: {
        style: {
            color: '#fff'
        }
    },

    active: true
}

module.exports = {
	debug
}
},{}],2:[function(require,module,exports){
const { debug } = require('./config.js')

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

module.exports = {
    log, error, dir, warn
}
},{"./config.js":1}],3:[function(require,module,exports){
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
},{"./debug.js":2}],4:[function(require,module,exports){
module.exports = require('./webrtc')
},{"./webrtc":5}],5:[function(require,module,exports){
const Emitter = require('./emitter.js')

module.exports = function () {
    Emitter(this)

    const peerConnection = new RTCPeerConnection()
    this.peerConnection = peerConnection;

    peerConnection.ondatachannel = event => {
        event.channel.onopen = () => this.emit('open')
        event.channel.onmessage = message => this.emit('message', JSON.parse(message.data))
        event.channel.onerror = error => this.emit('error', error)
    }

    const dataChannel = peerConnection.createDataChannel( "main", { reliable: true } );
    this.dataChannel = dataChannel

    peerConnection.onerror = event => this.emit('error', event)

    this.on('error', console.log)

    peerConnection.onicecandidate = event => { 
        if (event.candidate) this.emit('icecandidate', event.candidate)
    }

    peerConnection.ontrack = event => { 
        this.emit('track', event)
    }

    const setLocalDescription = offer =>
        peerConnection.setLocalDescription(new (RTCSessionDescription || wrtc.RTCSessionDescription)(offer))

    const setRemoteDescription = offer => 
        peerConnection.setRemoteDescription(new (RTCSessionDescription || wrtc.RTCSessionDescription)(offer))

    Object.assign(this, {
        setLocalDescription,
        setRemoteDescription
    })

    this.offer = () => new Promise ( (resolve, reject) => {
        peerConnection.createOffer(
            offer => {
                setLocalDescription(offer)
                resolve(offer)
            },

            reject
        )
    })

    this.answer = offer => new Promise ( (resolve, reject) => {
        setRemoteDescription(offer)
        peerConnection.createAnswer( 
            offer => {
                setLocalDescription(offer)
                resolve(offer)
            },

            reject
        )
    })

    this.addIceCandidate = candidates => {
        if (Array.isArray(candidates)) 
            for (const candidate of candidates) 
                peerConnection.addIceCandidate(new (RTCIceCandidate || wrtc.RTCIceCandidate)(candidate))
        else 
            peerConnection.addIceCandidate(new (RTCIceCandidate || wrtc.RTCIceCandidate)(candidates))
    }

	this.addTrack = (track, streams = []) => {
		if (!Array.isArray(streams)) streams = [streams]
		peerConnection.addTrack(track, ...streams)
	}

    this.send = data => dataChannel.send(JSON.stringify(data))
}
},{"./emitter.js":3}]},{},[4])(4)
});

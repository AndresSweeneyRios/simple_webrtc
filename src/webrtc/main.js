import Emitter from '../util/emitter.js'
import WebRTC from './webrtc.js'
import Debug from '../util/debug.js'

export default ( options ) => {
    const { emit, on } = Emitter()

	const peers = {}

	const config = {
		log: false,
		debug: false,
		peer: {
			json: true
        },
        ...options
    }

    if (config.debug) {
        on('error', (code, message) => {
            if (message) Debug.code(code,message)
            else Debug.error(code)
        })

        if (config.log) on('log', (message) => {
            Debug.log(message)
        })
    }

    const Peer = name => peers[name] = WebRTC({ on, emit, config })

    const Broadcast = ( ) => {
        for (const peer of Object.values(peers))
            peer.send(data)
    }

    return {
        emit,
        on,
        peers,
        Peer,
        Broadcast,
    }
}
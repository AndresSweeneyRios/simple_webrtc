import Emitter from './util/emitter.js'
import Peer from './webrtc/peer.js'
import Debug from './util/debug.js'

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

    const Broadcast = ( ) => {
        for (const peer of Object.values(peers))
            peer.send(data)
    }

    return {
        emit,
        on,
        peers,
        Broadcast,
        Peer (name = peers.length) {
            peers[name] = Peer({ emit, config })

            return peers[name]
        }
    }
}
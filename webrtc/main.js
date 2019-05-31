import Emitter from '../util/emitter.js'
import Debug from '../util/debug.js'
import PeerConnection from './peerconnection.js'

export default class extends Emitter {
	config
	peerConnection
	dataChannel

	config = {
		log: false,
		RTCPeerConnection: {
			json: true
		} 
	}

	constructor ( options ) {
		super()

		Object.assign(this.config, options)

		if (this.config.debug) {
			this.on('error', (code,message) => {
				if (message) Debug.code(code,message)
				else Debug.error(code)
			})

			if (this.config.log) this.on('log', (message) => {
				Debug.log(message)
			})
		}

		this.peerConnection = new PeerConnection(this.config.RTCPeerConnection, this)
		this.peerConnection.CreateDataChannel()

		this.datachannels = this.peerConnection.datachannels
	}

    async offer ( ) {
        return await new Promise ( (resolve, reject) => {
			this.peerConnection.createOffer(
				async offer => {
					this.peerConnection.SetLocalDescription(offer)

					await this.on('icecomplete')
					
					resolve({
						offer,
						candidates: this.peerConnection.candidates
					})
				},

				error => this.emit('error', 'offer', error)
			)
		})
    }

    async answer ({ offer, candidates } = { })  {
		if (!offer) {
			this.emit('error', 'answer', 'no offer provided')
			throw 'no offer provided'
		}

		this.peerConnection.SetRemoteDescription(offer)
		
		return await new Promise( resolve => 
			this.peerConnection.createAnswer( 
				async answer => {
					this.peerConnection.SetLocalDescription(answer)
					
					await this.on('icecomplete')
					
					resolve({
						answer,
						candidates: this.peerConnection.candidates
					})

					this.peerConnection.AddIceCandidate(candidates)
				},

				error => this.emit('error', 'answer', error)
			)
		)
	}
	
	async open ({ answer, candidates }) {
		if (!answer) {
			this.emit('error', 'open', 'no answer provided')
			throw 'no answer provided'
		}

		this.peerConnection.SetRemoteDescription(answer)

		this.peerConnection.AddIceCandidate(candidates)

		await this.on('open')

		return
	}

	broadcast ( data ) {
		this.peerConnection.Broadcast(data)
	}
}
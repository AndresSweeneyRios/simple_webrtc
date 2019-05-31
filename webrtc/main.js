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
		try {
			return await new Promise ( (resolve, reject) => {
				this.peerConnection.createOffer(
					async offer => {
						this.peerConnection.SetLocalDescription(offer)

						await this.on('icecomplete')
						
						resolve(
							JSON.stringify({
								offer,
								candidates: this.peerConnection.candidates
							})
						)
					},

					error => reject(error)
				)
			})
		} catch (error) {
			this.emit('error', 'offer', error)
		}
    }

    async answer ({ offer, candidates } = { })  {
		try {
			if (!offer) throw 'no offer provided'

			this.peerConnection.SetRemoteDescription(JSON.parse(offer))
			
			return await new Promise( (resolve, reject) => 
				this.peerConnection.createAnswer( 
					async answer => {
						this.peerConnection.SetLocalDescription(answer)
						
						await this.on('icecomplete')
						
						resolve(
							JSON.stringify({
								answer: answer,
								candidates: this.peerConnection.candidates
							})
						)

						this.peerConnection.AddIceCandidate(candidates)
					},

					error => reject(error)
				)
			)
		} catch (error) {
			this.emit('error', 'answer', error)
		}
	}
	
	async open ({ answer, candidates }) {
		try {
			if (!answer) throw 'no answer provided'

			this.peerConnection.SetRemoteDescription(JSON.parse(answer))

			this.peerConnection.AddIceCandidate(candidates)

			await this.on('open')

			return
		} catch (error) {
			this.emit('error', 'open', error)
		}
	}

	broadcast ( data ) {
		this.peerConnection.Broadcast(data)
	}
}
import Emitter from '../util/emitter.js'
import Debug from '../util/debug.js'
import PeerConnection from './peerconnection.js'
import UserMedia from './usermedia.js'

export default class extends Emitter {
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

		// assign user options to default config

		Object.assign(this.config, options)


		// enable debugging features

		if (this.config.debug) {
			this.on('error', (code,message) => {
				if (message) Debug.code(code,message)
				else Debug.error(code)
			})

			if (this.config.log) this.on('log', (message) => {
				Debug.log(message)
			})
		}


		// create new PeerConnection

		this.peerConnection = new PeerConnection(this.config.RTCPeerConnection, this)
		this.peerConnection.CreateDataChannel()

		this.datachannels = this.peerConnection.datachannels
	}


	// create offer (starting point)

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


	// create answer with offer

    async answer ( offerObject )  {
		try {
			if (!offerObject) throw 'no offer provided'

			const { offer, candidates } = JSON.parse(offerObject)

			this.peerConnection.SetRemoteDescription(offer)
			
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
	

	// establish connection with answer object

	async open ( answerObject ) {
		try {
			if (!answerObject) throw 'no answer provided'

			const { answer, candidates } = JSON.parse(answerObject)

			this.peerConnection.SetRemoteDescription(answer)

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


	// getter forwards config, emitter, and peer connection to UserMedia

	get media ( ) {
		return new UserMedia(this)
	}
}
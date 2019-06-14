import PeerConnection from './peerconnection.js'
import Emitter from '../util/emitter.js';

export default class extends Emitter {
	peerConnection
	dataChannel
	icecomplete = false

	constructor ({ config, emit, on }) {
		super()

		// create new PeerConnection

		this.peerConnection = new PeerConnection(config.peer, this)
		this.peerConnection.CreateDataChannel()

		this.datachannels = this.peerConnection.datachannels
		
		this.on('offer', async offer => {
			this.send(await this.answer(offer), false)
		})

		this.on('icecomplete', () => {
			this.icecomplete = true
		})

		on('media-negotiation', async () => {
			this.renegotiate()
		})

		on('addtrack', track => 
			this.emit('addtrack', track)
		)

		this.on('negotiationneeded', () =>
			emit('negotiationneeded')
		)

		this.on('log', message => {
			emit('log', message)
		})

		this.on('error', (code, message) => {
			emit('error', code, message)
		})

		;(async () => {
			await this.on('open')

			this.on('icecandidate', candidate => {
				if (candidate) this.send({
					candidate,
					type: 'icecandidate'
				}, true)
			})
		})()
	}


	// create offer (starting point)

    async offer ( ) {
		try {
			return await new Promise ( (resolve, reject) => {
				this.peerConnection.createOffer(
					async offer => {
						this.peerConnection.SetLocalDescription(offer)

						if (!this.icecomplete) await this.on('icecomplete')
						
						resolve(
							JSON.stringify({
								offer,
								candidates: this.peerConnection.candidates,
								type: 'offer'
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

			if (typeof offerObject === 'string') 
				offerObject = JSON.parse(offerObject)

			const { offer, candidates } = offerObject

			this.peerConnection.SetRemoteDescription(offer)
			
			return await new Promise( (resolve, reject) => 
				this.peerConnection.createAnswer( 
					async answer => {
						this.peerConnection.SetLocalDescription(answer)

						if (!this.icecomplete) await this.on('icecomplete')

						resolve(
							JSON.stringify({
								answer: answer,
								candidates: this.peerConnection.candidates,
								type: 'answer'
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
	
	async renegotiate ( ) {
		this.emit('log', 'renegotiating')
	
		const { offer } = JSON.parse(await this.offer())
		await this.peerConnection.SetLocalDescription(offer)

		this.send(
			JSON.stringify({
				type: 'offer',
				renegotiation: true,
				sdp: this.peerConnection.localDescription
			}), 

			false
		)
	}


	// establish connection with answer object

	async open ( answerObject ) {
		try {
			if (!answerObject) throw 'no answer provided'

			if (typeof answerObject === 'string') 
				answerObject = JSON.parse(answerObject)

			const { answer, candidates } = answerObject

			this.peerConnection.SetRemoteDescription(answer)

			this.peerConnection.AddIceCandidate(candidates)

			await this.on('open')

			return
		} catch (error) {
			this.emit('error', 'open', error)
		}
	}


	send ( data, json, channel = 0 ) {
		this.peerConnection.datachannels[channel].send(data, json)
	}
}
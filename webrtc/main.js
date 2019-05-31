import Emitter from '../util/emitter.js'
import Debug from '../util/debug.js'
import PeerConnection from './peerconnection.js'

const Config = (extension = {}) => (
	Object.assign({
		json: true,
		RTCPeerConnection: {
			json: true
		} 
	}, extension)
)

export default class extends Emitter {
	config
	peerConnection
	dataChannel

	constructor ( extension ) {
		super()

		this.config = Config( extension )

		this.on('error', Debug.error)

		this.peerConnection = new PeerConnection(this.config.RTCPeerConnection, this)
		this.peerConnection.CreateDataChannel()
	}

    async offer () {
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

				reject
			)
		})
    }

    async answer ({ offer, candidates }) {
		if (!offer) {
			reject('no offer provided')
			return Debug.code('answer', 'no offer provided')
		}

		this.peerConnection.setRemoteDescription(offer)
		
		return await new Promise( (resolve, reject) => 
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

				reject
			)
		)
	}
	
	async establish ({ answer, candidates }) {
		if (!answer) {
			Debug.code('answer', 'no offer provided')
			throw 'no offer provided'
		}

		this.peerConnection.SetRemoteDescription(answer)

		this.peerConnection.AddIceCandidate(candidates)

		return 
	}

	broadcast ( data ) {
		this.peerConnection.Broadcast(data)
	}
}
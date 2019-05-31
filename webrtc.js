import Emitter from './emitter.js'
import Debug from './debug.js'

export default function (
	extension = {}, 

	config = {
		json: true,
		RTCPeerConnection: {}
	}
) {
	Emitter(this)
	
	Object.assign(config, extension)

    const peerConnection = new RTCPeerConnection(config.RTCPeerConnection)
    this.peerConnection = peerConnection;

    peerConnection.ondatachannel = event => {
		event.channel.onopen = () => this.emit('open')
		
        event.channel.onmessage = message => this.emit(
			'message', 
			config.json 
				? JSON.parse(message.data)
				: message.data
		)

        event.channel.onerror = error => this.emit('error', error)
    }

    const dataChannel = peerConnection.createDataChannel( "main", { reliable: true } );
    this.dataChannel = dataChannel

    peerConnection.onerror = event => this.emit('error', event)

    this.on('error', console.log)

	const candidates = []

    peerConnection.onicecandidate = event => { 
		this.emit('icecandidate', event.candidate)

        if (event.candidate) {
			candidates.push(event.candidate)
		} else {
			// this.emit('icecomplete', event)
		}
	}

	peerConnection.onicegatheringstatechange = event => {
		if (event.target.iceGatheringState === 'complete') {
			this.emit('icecomplete', event)
		}
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
            async offer => {
				setLocalDescription(offer)

				await new Promise(resolve => this.on('icecomplete', resolve))
				
                resolve({
					offer,
					candidates
				})
            },

            reject
        )
    })

    this.answer = ({offer, candidates}) => new Promise ( (resolve, reject) => {
		if (!offer) {
			reject('no offer provided')
			return Debug.code('answer', 'no offer provided')
		}

		setRemoteDescription(offer)
		
        peerConnection.createAnswer( 
            async answer => {
				setLocalDescription(answer)
				
				await this.on('icecomplete')
				
                resolve({
					answer,
					candidates
				})
            },

            reject
        )
	})
	
	this.establish = async ({answer, candidates}) => {
		if (!answer) {
			Debug.code('answer', 'no offer provided')
			throw 'no offer provided'
		}

		this.addIceCandidate(candidates)

		return 
	}

    this.addIceCandidate = async candidates => {
		if (!candidates) {
			Debug.code('addIceCandidate', 'no candidate provided')
			throw 'no candidate(s) provided'
		}

        if (Array.isArray(candidates)) 
            for (const candidate of candidates) 
                peerConnection.addIceCandidate(new (RTCIceCandidate || wrtc.RTCIceCandidate)(candidate))
        else 
			peerConnection.addIceCandidate(new (RTCIceCandidate || wrtc.RTCIceCandidate)(candidates))
			
		return
    }

	this.addTrack = async (track, streams = []) => {
		if (!candidates) {
			Debug.code('addTrack', 'no track provided')
			throw 'no track provided'
		}

		if (!Array.isArray(streams)) streams = [streams]
		peerConnection.addTrack(track, ...streams)

		return
	}

    this.send = async data => {
		if (!data) {
			Debug.code('send', 'no data provided')
			throw 'no data provided'
		}

		dataChannel.send(JSON.stringify(data))

		return
	}
}
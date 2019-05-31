import Debug from '../util/debug.js'

export default class extends RTCPeerConnection {
	candidates = []
	datachannels = []

	constructor ( config, {events, emit} ) {
		super()

		this.events = events
		this.config = config
		this.emit = emit
	
		this.addEventListener('datachannel', event => {
			event.channel.onopen = () => this.emit('open')
			
			event.channel.onmessage = message => this.emit(
				'message', 
				
				this.config.json 
					? JSON.parse(message.data)
					: message.data
			)
	
			event.channel.onerror = error => this.emit('error', error)
		})
		
		this.addEventListener('error', event => {
			this.emit('error', event)
		})
		
		this.addEventListener('icecandidate', event => {
			this.emit('icecandidate', event.candidate)
	
			if (event.candidate) {
				this.candidates.push(event.candidate)
			}
		})
		
		this.addEventListener('icegatheringstatechange', event => {
			if (event.target.iceGatheringState === 'complete') {
				this.emit('icecomplete', event)
			}
		})
		
		this.addEventListener('track', event => { 
			this.emit('track', event)
		})
	}

    AddIceCandidate ( candidates ) {
		if (!candidates) {
			Debug.code('addIceCandidate', 'no candidate(s) provided')
			throw 'no candidate(s) provided'
		}

        if (Array.isArray(candidates)) 
            for (const candidate of candidates) 
                this.addIceCandidate(new RTCIceCandidate(candidate))
        else 
			this.addIceCandidate(new RTCIceCandidate(candidates))
    }

	AddTrack ( track, streams = [] ) {
		if (!candidates) {
			Debug.code('addTrack', 'no track provided')
			throw 'no track provided'
		}

		if (!Array.isArray(streams)) streams = [streams]
		this.peerConnection.addTrack(track, ...streams)
	}
	
	CreateDataChannel () {
		const DataChannel = this.createDataChannel( "main", { reliable: true } )

		const send = async ( data ) => {
			if (!data) {
				Debug.code('send', 'no data provided')
				throw 'no data provided'
			}
	
			DataChannel.send(
				this.config.json
					? JSON.stringify(data)
					: data
			)
	
			return
		}

		this.datachannels.push({
			DataChannel, send
		})

		return {
			DataChannel, send
		}
	}

    SetLocalDescription ( offer ) {
        this.setLocalDescription(
			new RTCSessionDescription(offer)
		)
	}

    SetRemoteDescription ( offer ) {
        this.setRemoteDescription(
			new RTCSessionDescription(offer)
		)
	}

	Broadcast (data) {
		for (const { send } of this.datachannels)
			send(data)
	}
}
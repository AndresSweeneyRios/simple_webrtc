export default class extends RTCPeerConnection {
	candidates = []
	datachannels = []

	constructor ( config, {events, emit} ) {
		super()

		this.events = events
		this.config = config
		this.emit = emit

		this.addEventListener('datachannel', event => {
			event.channel.onopen = () => {
				this.emit('open')
				this.emit('log', 'datachannel open')
			}
			
			event.channel.onmessage = message => this.emit(
				'message', 
				
				this.config.json 
					? JSON.parse(message.data)
					: message.data
			)
	
			event.channel.onerror = error => this.emit('error', 'DataChannel', error)
		})
		
		this.addEventListener('error', event => {
			this.emit('error', 'RTCPeerConnection', event)
		})
		
		this.addEventListener('icecandidate', event => {
			this.emit('icecandidate', event.candidate)
	
			if (event.candidate) {
				this.candidates.push(event.candidate)
			}

			this.emit('log', 'found ice candidate')
		})
		
		this.addEventListener('icegatheringstatechange', event => {
			if (event.target.iceGatheringState === 'complete') {
				this.emit('icecomplete', event)
				this.emit('log', 'ice gathering complete')
			}
		})
		
		this.addEventListener('track', event => { 
			this.emit('track', event)
		})
	
		this.emit('log', 'created peer')
	}

    AddIceCandidate ( candidates ) {
		if (!candidates) {
			this.emit('error', 'addIceCandidate', 'no candidate(s) provided')
			throw 'no candidate(s) provided'
		}

        if (Array.isArray(candidates)) 
            for (const candidate of candidates) 
                this.addIceCandidate(new RTCIceCandidate(candidate))
        else 
			this.addIceCandidate(new RTCIceCandidate(candidates))

		this.emit('log', 'added ice candidate(s)')
    }

	AddTrack ( track, streams = [] ) {
		if (!candidates) {
			this.emit('error', 'addTrack', 'no track provided')
			throw 'no track provided'
		}

		if (!Array.isArray(streams)) streams = [streams]
		this.peerConnection.addTrack(track, ...streams)

		this.emit('log', 'added track(s)')
	}
	
	CreateDataChannel () {
		const DataChannel = this.createDataChannel( "main", { reliable: true } )

		const send = async ( data ) => {
			if (!data) {
				this.emit('error', 'send', 'no data provided')
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

		this.emit('log', 'created data channel')

		return {
			DataChannel, send
		}
	}

    SetLocalDescription ( offer ) {
        this.setLocalDescription(
			new RTCSessionDescription(offer)
		)

		this.emit('log', 'set local description')
	}

    SetRemoteDescription ( offer ) {
        this.setRemoteDescription(
			new RTCSessionDescription(offer)
		)

		this.emit('log', 'set remote description')
	}

	Broadcast (data) {
		for (const { send } of this.datachannels)
			send(data)
	}
}
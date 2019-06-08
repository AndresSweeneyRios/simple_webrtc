export default class extends RTCPeerConnection {
	candidates = []
	datachannels = []

	constructor ( config, {events, emit} ) {
		super()

		Object.assign( this, { 
			config, events, emit 
		})

		this.addEventListener('datachannel', event => {

			// invoked when a connection has been established
			// at this point it is safe to communicate

			event.channel.onopen = () => {
				this.emit('open')
				this.emit('log', 'datachannel open')
			}
			

			// the receiving event for the `DataChannel.send` method

			event.channel.onmessage = message => this.emit(
				'message', 
				
				this.config.json 
					? JSON.parse(message.data)
					: message.data
			)
	
			event.channel.onerror = error => this.emit('error', 'PeerConnection.DataChannel', error)
		})
		
		this.addEventListener('error', event => {
			this.emit('error', 'PeerConnection', event)
		})
		
		this.addEventListener('icecandidate', event => {
			this.emit('icecandidate', event.candidate)
	
			if (event.candidate) {
				this.candidates.push(event.candidate)
			}

			this.emit('log', 'found ice candidate')
		})
		

		// once this event is emitted, the offer/answer methods will resolve
		// this allows offers/answers to be transceived in one string (per peer)
		
		this.addEventListener('icegatheringstatechange', event => {
			if (event.target.iceGatheringState === 'complete') {
				this.emit('icecomplete', event)
				this.emit('log', 'ice gathering complete')
			}
		})
		

		// receiving event for added media tracks

		this.ontrack = event => { 
			this.emit('track', event)
		}
	
		this.emit('log', 'created peer')

		
		this.addEventListener('negotiationneeded', event => {
			this.emit('negotiationneeded', event)
			this.emit('log', 'negotiation needed')
		})
	}


	// invoked by the `answer` and `open` methods
	// bulk/individually add ice candidates

    AddIceCandidate ( candidates ) {
		try {
			if (!candidates) throw 'no candidate(s) provided'

			if (Array.isArray(candidates)) 
				for (const candidate of candidates) 
					this.addIceCandidate(new RTCIceCandidate(candidate))
			else 
				this.addIceCandidate(new RTCIceCandidate(candidates))

			this.emit('log', 'added ice candidate(s)')
		} catch (error) {
			this.emit('error', 'PeerConnection.addIceCandidate', 'no candidate(s) provided')
		}
    }


	// add a media track (video, audio, canvas)
	// it is also used by the UserMedia class

	AddTrack ( track, streams = [] ) {
		try {
			if (!track) throw 'no track provided'

			if (!Array.isArray(streams)) streams = [streams]
			this.addTrack(track, ...streams)

			this.emit('log', 'added track(s)')
		} catch (error) {
			this.emit('error', 'PeerConnection.addTrack', error)
		}
	}
	

	// DataChannel creation, contains the `send` method
	// automatically stringifies content unless configured otherwise

	CreateDataChannel () {
		try {
			const DataChannel = this.createDataChannel( "main", { reliable: true } )

			const send = async ( data ) => {
				if (!data) throw 'no data provided'
		
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
		} catch (error) {
			this.emit('error', 'PeerConnection.CreateDataChannel', error)
		}
	}


	// local/remote descriptions take an offer/answer object

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
export default ({ emit, on, config }) => {
    const candidates = []
    const datachannels = []

    const PeerConnection = new RTCPeerConnection({
        iceServers: [
        //   {
        //     urls: "stun:stun.l.google.com:19302",
        //   },
        //   { urls: "turn:206.189.201.78:3478", username: "username", credential: "key" }
        //   {
        //     urls: "stun:stun3.l.google.com:19302",
        //   },
        ],
        sdpSemantics: "unified-plan"
    })

    const AddIceCandidate = candidates => {
        if (!candidates) return

        if (Array.isArray(candidates)) 
            for (const candidate of candidates) 
                candidate
                && candidate.candidate 
                && candidate.candidate.length > 0 
                && PeerConnection.addIceCandidate(new RTCIceCandidate(candidate))

        else 
            candidates
            && candidates.candidate 
            && candidates.candidate.length > 0 
            && PeerConnection.addIceCandidate(new RTCIceCandidate(candidates))

        emit('log', 'added ice candidate(s)')
    }

    const AddTrack = ( track, streams = [] ) => {
        if (!track) throw 'no track provided'

        if (!Array.isArray(streams)) streams = [streams]

        PeerConnection.addTrack(track, ...streams)

        emit('log', 'added track(s)')
    }
    
    const CreateDataChannel = () => {
        const DataChannel = PeerConnection.createDataChannel( "main", { reliable: true } )

        const send = async ( data, json = undefined ) => {
            if (!data) throw 'no data provided'

            DataChannel.send(
                ( json !== undefined ? json : config.json )
                    ? JSON.stringify(data)
                    : data
            )
        }

        datachannels.push({ DataChannel, send })

        emit('log', 'created data channel')

        return {
            DataChannel, 
            send
        }
    }


    const SetLocalDescription = async offer => {
        await PeerConnection.setLocalDescription(
            new RTCSessionDescription(offer)
        )

        emit('log', 'set local description')
    }

    const SetRemoteDescription = async offer => {
        await PeerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
        )

        emit('log', 'set remote description')
    }

    const Broadcast = data => {
        for (const { send } of datachannels) send(data)
    }

    PeerConnection.ondatachannel = event => {
        event.channel.onopen = () => {
            emit('open')
            emit('log', 'datachannel open')
        }

        event.channel.onmessage = async message => {
            const data = JSON.parse(message.data)

            if (data.renegotiation) {
                emit('log', 'renegotiation')

                await AddIceCandidate(data.candidates)

                await SetRemoteDescription(data.sdp)

                if (data.type === 'offer') {
                    emit('log', 'sending renegotiation answer')

                    const answer = await PeerConnection.createAnswer()

                    SetLocalDescription(answer)
            
                    datachannels[0].send(
                        JSON.stringify({
                            type: 'answer',
                            renegotiation: true,
                            sdp: answer
                        }), 
            
                        false
                    )
                }

                else emit('log', 'received renegotiation answer')

                return 
            } else if (data.type === 'icecandidate') {
                emit('log', 'received ice candidate')

                return AddIceCandidate(data.candidate)
            }

            emit(
                'message', 
                
                config.json 
                    ? JSON.parse(message.data)
                    : message.data
            )
        }
    }

    PeerConnection.onerror = event => emit('error', 'PeerConnection', event)
        
    PeerConnection.onicecandidate = event => {
        emit('icecandidate', event.candidate)
        candidates.push(event.candidate)
        emit('log', 'found ice candidate')
    }

    PeerConnection.onicegatheringstatechange = event => {
        if (event.target.iceGatheringState === 'complete') {
            emit('icecomplete', event)
            emit('log', 'ice gathering complete')
        }
    }

    PeerConnection.ontrack = event => { 
        emit('track', event)
    }

    PeerConnection.onnegotiationneeded = event => {
        emit('negotiationneeded', event)
        emit('log', 'negotiation needed')
    }

    on('addtrack', ({ track, streams }) => {
        AddTrack(track, ...streams)
    })

    return {
        AddIceCandidate,
        AddTrack,
        CreateDataChannel,
        SetLocalDescription,
        SetRemoteDescription,
        Broadcast,
        raw: PeerConnection,
        candidates,
        datachannels,
    }
}
import PeerConnection from './peerconnection.js'
import Emitter from '../util/emitter.js'
import UserMedia from './usermedia.js'

export default ({ emit: globalEmit, on: globalOn, config }) => {
    const { on, emit } = Emitter()

    let icecomplete = false

    const peerConnection = PeerConnection({ emit, on, config: config.peer })

    peerConnection.CreateDataChannel()

    const offer = async ( ) => {
        const offer = await peerConnection.raw.createOffer()

        peerConnection.SetLocalDescription(offer)

        if (!icecomplete) await on('icecomplete')
        
        const { candidates } = peerConnection

        return JSON.stringify({
            offer,
            candidates,
            type: 'offer'
        })
    }

    const answer = async offerObject => {
        if (!offerObject) throw 'no offer provided'

        const { offer, candidates } = JSON.parse(offerObject)

        peerConnection.SetRemoteDescription(offer)

        const answer = await peerConnection.raw.createAnswer()

        peerConnection.SetLocalDescription(answer)

        if (!icecomplete) await on('icecomplete')

        peerConnection.AddIceCandidate(candidates)

        return JSON.stringify({
            answer: answer,
            candidates: peerConnection.candidates,
            type: 'answer'
        })
    }
    
    const renegotiate = async ( ) => {
        emit('log', 'renegotiating')
        
        const { offer: newOffer, candidates } = JSON.parse(await offer())
	
		await peerConnection.SetLocalDescription(newOffer)

		send(
			JSON.stringify({
				type: 'offer',
				renegotiation: true,
                sdp: newOffer,
                candidates,
			}), 

			false
		)
    }
    
    const open = answerObject => {
        if (!answerObject) throw 'no answer provided'

        const { answer, candidates } = JSON.parse(answerObject)

        peerConnection.SetRemoteDescription(answer)

        peerConnection.AddIceCandidate(candidates)

        return on('open')
	}

    const send = ( data, json, channel = 0 ) => {
		peerConnection.datachannels[channel].send(data, json)
    }

    on('offer', async offer => send(await answer(offer), false))

    on('icecomplete', () => icecomplete = true)

    on('media-negotiation', async () => renegotiate())
    

    // TODO: test if this works without 'open' event

    on('open', () => {
        on('icecandidate', candidate => {
            if (candidate) send({
                candidate,
                type: 'icecandidate'
            }, true)
        })
    })

    //

    on('log', message => globalEmit('log', message))

    on('error', (code, message) => globalEmit('error', code, message))

    return {
        offer,
        answer, 
        renegotiate,
        open,
        send,
        on,
        emit,
        ...UserMedia({ emit, on, config }),
    }
}
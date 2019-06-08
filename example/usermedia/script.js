import SimpleWebRTC from '../scripts/webrtc/webrtc.js'

const config = { 
	debug: true,
	log: true
}

const local = new SimpleWebRTC(config)
const remote = new SimpleWebRTC(config)

const connect = async ( ) => {
	remote.peerConnection.ontrack = event => console.log(event)
	const offer = await local.offer()
	const answer = await remote.answer(offer)
	local.open(answer)
	await local.media.screen()
	local.on('negotiationneeded', console.log)
}

remote.on( 'message', ( data ) => {
	console.log( data ) // { message: 'Hello World!' }
})

window.local = local
window.remote = remote

connect()
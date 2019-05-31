import SimpleWebRTC from '../scripts/webrtc/main.js'

const local = new SimpleWebRTC({ debug: true })
const remote = new SimpleWebRTC({ debug: true })

const connect = async ( ) => {
	try {
		const offer = await local.offer()
		const answer = await remote.answer(offer)
	
		local.open(answer)
	} catch (error) {
		console.log('Something went wrong.', error)
	}
}

local.on( 'open', ( ) => {
	local.broadcast({ message: 'Hello World!' })
})

remote.on( 'message', ( data ) => {
	console.log( data ) // { message: 'Hello World!' }
})

connect()
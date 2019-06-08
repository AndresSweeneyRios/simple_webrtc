import SimpleWebRTC from '../scripts/webrtc/webrtc.js'

// in production these two peers would be on different machines
const local = new SimpleWebRTC({ debug: true })
const remote = new SimpleWebRTC({ debug: true })

const connect = async ( ) => {
	try {
		const offer = await local.offer()
	
		// send `offer` to remote peer
		const answer = await remote.answer(offer)
	
		// retrieve `answer` from remote peer
		local.open(answer)
	
		// events are all asynchronous
		await local.on('open')
		console.log('Opened!')
	} catch (error) {
		console.log('Something went wrong.', error)
	}
}

// a connection has been established
local.on( 'open', ( ) => {
	local.broadcast({ message: 'Hello World!' })
})

// data has been received
remote.on( 'message', ( data ) => {
	console.log( data ) // { message: 'Hello World!' }
})

connect()
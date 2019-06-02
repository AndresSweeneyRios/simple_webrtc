import SimpleWebRTC from '../scripts/webrtc/main.js'

const local = new SimpleWebRTC({ debug: true })
const remote = new SimpleWebRTC({ debug: true })

const connect = async ( ) => {
	try {
		const offer = await local.offer()
		const answer = await remote.answer(offer)

		local.open(answer)

		console.dir(await local.media.screen())
	} catch (error) {
		console.log('Something went wrong.', error)
	}
}

remote.on( 'message', ( data ) => {
	console.log( data ) // { message: 'Hello World!' }
})

connect()
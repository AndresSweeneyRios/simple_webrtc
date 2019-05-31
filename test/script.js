import SimpleWebRTC from './webrtc/main.js'

const local = new SimpleWebRTC()
const remote = new SimpleWebRTC()

const init = async () => {

	const offer = await local.offer()
	const answer = await remote.answer( offer )

	await local.establish( answer )
	
	local.on('open', () => local.broadcast({
		message: 'test'
	}))

	remote.on('message', message => console.log(message))

}

init()
import SimpleWebRTC from '../scripts/webrtc/main.js'

(async (local,remote) => {
	local.open(await remote.answer(await local.offer()))
	await local.on('open')
	remote.on('message', console.log) // { message: 'Hello World!' }
	local.broadcast({ message: 'Hello World!' })
})(new SimpleWebRTC(), new SimpleWebRTC())
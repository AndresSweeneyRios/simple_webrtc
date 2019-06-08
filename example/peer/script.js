import SimpleWebRTC from '../scripts/webrtc/main.js'

const { Peer, Broadcast, Media } = new SimpleWebRTC({ debug: true })

const local = Peer('local')
const remote = Peer('local')

const init = async () => {
	const offer = await local.offer()
	const answer = await remote.answer(offer)
	await local.open(answer)

	console.log('open')
}

init()
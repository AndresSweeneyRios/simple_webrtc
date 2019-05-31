import SimpleWebRTC from './webrtc.js'

const local = new SimpleWebRTC()
const remote = new SimpleWebRTC()

const init = async () => {
	const offer = await local.offer()
	const answer = await remote.answer(offer)

	console.log(offer.candidates, answer.candidates)

	await local.establish(answer)
}

init()
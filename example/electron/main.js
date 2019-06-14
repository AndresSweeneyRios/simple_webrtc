const {
	Peer, Broadcast
} = require('../../')('babel')

const local = Peer('local')
const remote = Peer('remote')

const init = async () => {
	const offer = await local.offer()
	const answer = await remote.answer(offer)
	await local.open(answer)

	local.on('message', console.log)

	Broadcast('hello world')
}

init()
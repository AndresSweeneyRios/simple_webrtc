import SimpleWebRTC from '../scripts/webrtc/main.js'

const $ = e => document.querySelector(e)

const { Peer, Broadcast, Media } = new SimpleWebRTC({ 
	debug: true, 
	log: true
})

const peer = Peer('local')

peer.on('track', event => {
	$('video').srcObject = event.streams[0]
	console.log(event, event.track, event.streams[0])
})

$('video').onclick = async event => {
	$('video').play()
	console.log('playing')
}

$('#offer').onclick = async () => 
	console.log(await peer.offer())

$('#answer').onclick = async () => 
	console.log(await peer.answer($('#answer-input').value))

$('#open').onclick = async () =>
	await peer.open($('#open-input').value)

$('#camera').onclick = () => Media.camera()

peer.on('message', console.log)

Object.assign(window, {
	peer, Broadcast, Media
})
import SimpleWebRTC from '../scripts/main.js'

const config = { 
	debug: true, 
	log: true
}

const peer = SimpleWebRTC(config).Peer()

peer.on('icecandidate', console.log)

peer.on('open', () => console.log('Open!'))

peer.on('message', console.log)

window.peer = peer
import SimpleWebRTC from '../scripts/main.js'

const $ = e => document.querySelector(e)

const config = { 
	debug: true, 
	log: true
}

const { Peer: LocalPeer } = SimpleWebRTC(config)
const { Peer: RemotePeer } = SimpleWebRTC(config)

const Local = LocalPeer('local')
const Remote = RemotePeer('local')

Remote.on('track', event => {
	$('video').srcObject = event.streams[0]
	console.log(event, event.track, event.streams[0])
})

// $('video').onclick = async event => {
// 	$('video').play()
// 	console.log('playing')
// }

$('#screen').onclick = () => Local.screen()

Object.assign(window, {
    LocalPeer, 
    RemotePeer,
})

Local.offer().then( async offer => {
    const answer = await Remote.answer(offer)

    Local.open(answer)

    await Local.on('open')

    console.log('Open!')

    Remote.on('message', console.log)
    
    Local.send('abcdefg')
})
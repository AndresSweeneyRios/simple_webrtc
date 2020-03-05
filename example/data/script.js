import SimpleWebRTC from '../scripts/webrtc/main.js'

const config = { 
	debug: true, 
	log: true
}

const Local = SimpleWebRTC(config).Peer()

const Remote = SimpleWebRTC(config).Peer()

Local.offer().then( async offer => {
    const answer = await Remote.answer(offer)

    Local.open(answer)

    await Local.on('open')

    console.log('Open!')

    Remote.on('message', console.log)
    
    Local.send('abcdefg')
})
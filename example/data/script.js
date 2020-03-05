import SimpleWebRTC from '../scripts/webrtc/main.js'

;(async () => {
    const Local = SimpleWebRTC().Peer()
    const Remote = SimpleWebRTC().Peer()

    const offer = await Local.offer()
    const answer = await Remote.answer(offer)
    Local.open(answer)

    await Local.on('open', () => console.log('Open!'))
    await Remote.on('open', () => console.log('Open!'))

    Remote.on('message', console.log)

    Local.send('abcdefg')
})()
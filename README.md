# Simple WebRTC
A WebRTC wrapper that aims to be the as short and concise as possible.<br>
***Please note: Simple WebRTC is still in development and should not be used in production environments.***
<br><br>


## installation (npm)

```bash
yarn add @andrewrivers/simple_webrtc
```

alternatively:

```bash
npm i --save @andrewrivers/simple_webrtc
```
<br>


## installation (es6)
Import `dist/browser/webrtc/main.js`. Standalone version not yet available.<br>
<br>


## usage
```ts
import SimpleWebRTC from '../scripts/webrtc/main.js'

const { Peer, Broadcast, Media } = new SimpleWebRTC({ 
	debug: true, // logs errors 
	log: true // logs events
})

const peer: WebRTC = Peer('local')

// get offer
const offer: string = await peer.offer()

// get answer
const answer: string = await peer.answer( offer )

// establish a connection
peer.open(answer)

// events
peer.on('open', () => ...)
peer.on('message', ( message: object | string | number ) => ...)
peer.on('error', ( error: Error ) => ...)
peer.on('close', () => ...)

// send
peer.send({ abc: "def"})
Broadcast("hello world")

// attach user media to SimpleWebRTC
const camera: MediaStream | void = Media.camera()
const microphone: MediaStream | void = Media.microphone()
const screenshare: MediaStream | void = Media.screen()

// listen for user media
peer.on('track', ({ streams } : { streams: MediaStream[] }) => {
    console.log( streams[0] )
})

```
<br>

## methods


### main

* `offer` creates an offer, this is the first step in establishing a connection
```ts
const offer: string = await peer.offer()
```
<br>

* `answer` creates an answer with `offer`, second step
```ts
const answer: string = await peer.answer(offer)
```
<br>

* `open` establishes a connection with `answer`
```ts
await peer.open(answer)
```
<br>

* `broadcast` sends data to all peers
```ts
const data: object | string | number = { message: 'Hello World!' }
Broadcast(data)
```
<br>


### media

The UserMedia class supports callbacks as well as asynchronous functions. Each has an `allow` and `block` parameter, which are invoked depending on a user's prompt result. [[MDN]](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) 

```ts
Media.microphone( 
    ( stream: MediaStream ) => ... , // allow
    ( ) => ... // block
)
```
<br>


* `Media.microphone` adds the user's microphone's audio to SimpleWebRTC and returns its MediaStream, if unavailable or blocked returns `null`
```ts
const stream: MediaStream | void = await Media.microphone()
```
<br>


* `Media.camera` adds the user's cameras's video to SimpleWebRTC and returns its MediaStream, if unavailable or blocked returns `null`
```ts
const stream: MediaStream | void = await Media.camera()
```
<br>


* `Media.screen` prompts the user for a display/window/tab (with audio when available) and adds the user's choice to SimpleWebRTC and returns its MediaStream, if unavailable or blocked returns `null`
```ts
const stream: MediaStream | void = await Media.screen()
```
<br>

* `Media.custom` uses custom constraints [[MDN]](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints) to add the resulting MediaStream to SimpleWebRTC and returns its MediaStream, if unavailable or blocked returns `null`

```ts
const stream: MediaStream | void = await Media.custom({
   video: true,  // default `false`
   audio: false, // default `false`
   screen: false // default `false`
})
```
callback syntax for `media.custom`:
```ts
Media.custom( constraints, allow, block )
```
<br>


## events

All events return `async` functions, so all events can be used in combination with `await`. 
```js
await peer.on('open')
```
Note that many of these events have no practical reason to be used this way, it is only for consistency and flexibility that it is provided.<br>
<br>


* `open`  a connection has been established, following `Peer.open()`
```ts
peer.on('open', () => {
    /* connection established, can transceive data */
})
```
<br>


* `message` data has been received, either by `Peer.broadcast()` or `DataChannel.send()`
```ts
peer.on('message', ( data: any ) => {
    /* if config.json is true, data will be parsed already */
})
```
<br>


* `icecandidate` ICE candidate has been found, handled internally and can be ignored
```ts
peer.on('icecandidate', ( candidate: RTCIceCandidate ) => ... )
```
<br>


* `track` track has been added via `media` [[MDN]](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack)
```ts
peer.on('track', ({ streams } : { streams: MediaStream[] }) => ... )
```
<br>


* `error` handled by `config.debug`
```ts
peer.on('error', ( method: string, message: string ) => ... )
```
<br>


* `log` handled by `config.log`
```ts
peer.on('log', ( message: string ) => ... )
```
<br>
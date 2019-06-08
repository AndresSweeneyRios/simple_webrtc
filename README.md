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
```js
import SimpleWebRTC from '../scripts/webrtc/main.js'

const config = {
    debug: true, // logs all errors, default `false`
    log: true, // logs all events, default `false`
    
    peer: {
        json: true // stringifies and parses data automatically, default `true`
    }
}

const Peer = () =>  new SimpleWebRTC(config)

// in production these two peers would be on different machines
const local = Peer()
const remote = Peer()

const connect = async ( ) => {
    try {
        // create `offer`
        const offer = await local.offer()
        
        // send `offer` to remote peer
        const answer = await remote.answer(offer)

        // retrieve `answer` from remote peer
        local.open(answer)

        // events are all asynchronous
        await local.on('open')
        console.log('Opened!')
    } catch (error) {
        console.log('Something went wrong.', error)
    }
}

// a connection has been established
local.on( 'open', () => {
    local.broadcast({ message: 'Hello World!' })
})

// data has been received
remote.on( 'message', ( data ) => {
    console.log( data ) // { message: 'Hello World!' }
})

connect()
```
<br>

## methods


### main

* `offer` creates an offer, this is the first step in establishing a connection
```ts
const offer: string = await Peer.offer()
```
<br>

* `answer` creates an answer with `offer`, second step
```ts
const answer: string = await Peer.answer(offer)
```
<br>

* `open` establishes a connection with `answer`
```ts
await Peer.answer(answer)
```
<br>

* `broadcast` sends data to all peers
```ts
const data: any = { message: 'Hello World!' }
Peer.broadcast(data)
```
<br>


### media

The UserMedia class supports callbacks as well as asynchronous functions. Each has an `allow` and `block` parameter, which are invoked depending on a user's prompt result. [[MDN]](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) 

```ts
Peer.media.microphone( 
    ( stream: MediaStream ) => ... , // allow
    ( ) => ... // block
)
```
<br>


* `media.microphone` adds the user's microphone's audio to PeerConnection and returns its MediaStream, if unavailable or blocked returns `null`
```ts
const stream: MediaStream | void = await Peer.media.microphone()
```
<br>


* `media.camera` adds the user's cameras's audio to PeerConnection and returns its MediaStream, if unavailable or blocked returns `null`
```ts
const stream: MediaStream | void = await Peer.media.camera()
```
<br>


* `media.screen` prompts the user for a display/window/tab (with audio when available) and adds the user's choice to PeerConnection and returns its MediaStream, if unavailable or blocked returns `null`
```ts
const stream: MediaStream | void = await Peer.media.microphone()
```
<br>

* `media.custom` uses custom constraints [[MDN]](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints) to add the resulting MediaStream to PeerConnection and returns its MediaStream, if unavailable or blocked returns `null`

```ts
const stream: MediaStream | void = await Peer.media.custom({
   video: true,  // default `false`
   audio: false, // default `false`
   screen: false // default `false`
})
```
callback syntax for `media.custom`:
```ts
Peer.media.custom( constraints, allow, block )
```
<br>


## events

All events return `async` functions, so all events can be used in combination with `await`. 
```js
await Peer.on('open')
```
Note that many of these events have no practical reason to be used this way, it is only for consistency and flexibility that it is provided.<br>
<br>


* `open`  a connection has been established, following `Peer.open()`
```ts
Peer.on('open', () => {
    /* connection established, can transceive data */
})
```
<br>


* `message` data has been received, either by `Peer.broadcast()` or `DataChannel.send()`
```ts
Peer.on('message', ( data: any ) => {
    /* if config.json is true, data will be parsed already */
})
```
<br>


* `icecandidate` ICE candidate has been found, handled internally and can be ignored
```ts
Peer.on('icecandidate', ( candidate: RTCIceCandidate ) => ... )
```
<br>


* `track` track has been added via `media` [[MDN]](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack)<br>
<br>


* `error` handled by `config.debug`
```ts
Peer.on('error', ( method: string, message: string ) => ... )
```
<br>


* `log` handled by `config.log`
```ts
Peer.on('log', ( message: string ) => ... )
```
<br>
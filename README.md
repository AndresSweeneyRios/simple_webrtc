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
Import `dist/browser/webrtc/main.js`. Standalone version not yet available<br>
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
Peer.on('message', ( data ) => {
    /* if config.json is true, data will be parsed already */
})
```
<br>


* `error` handled by `config.debug`
```ts
Peer.on('error', ( string method, string message ) => ... )
```
<br>


* `log` handled by `config.log`
```ts
Peer.on('log', ( string message ) => ... )
```
<br>


<br><br>



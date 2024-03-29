import { defaultConfig, Config } from "./config"
import { Logger } from "./log"

const DATA_CHANNEL_LABEL = "DATA"

/**
 * Generic event passed to a signaling server to simplify the tradeoff.
 */
export interface Signal {
  type: 'offer' | 'answer' | 'candidates'
  candidates?: RTCIceCandidate[]
  description?: RTCSessionDescriptionInit
}

/**
 * SerializedSignal is used for type constraints.
 * It's just a string.
 */
export type SerializedSignal = string

const serializeSignal = (signal: Signal): SerializedSignal => {
  return JSON.stringify(signal)
}

const deserializeSignal = (serializeSignal: SerializedSignal): Signal => {
  return JSON.parse(serializeSignal)
}

/**
 * All the logic for connecting over WebRTC and processing signals.
 * 
 * @param configOverride Any custom configuration goes here
 */
export const Peer = (configOverride: Partial<Config>) => {
  // Config
  const config: Config = {
    ...defaultConfig,
    ...configOverride,
  
    rtc: {
      ...defaultConfig.rtc,
      ...configOverride?.rtc
    }
  }

  // Helpers
  /**
   * Starting point for any connection. This will create a data channel and generate an offer signal.
   */
  const createOffer = async () => {
    logger.log('Creating data channel...')
    
    const newDataChannel = peerConnection.createDataChannel(DATA_CHANNEL_LABEL)

    initDataChannel(newDataChannel)

    logger.log('Creating offer...')

    const description = await peerConnection.createOffer()

    const offerSignal: Signal = {
      type: 'offer',
      description,
    }

    const offerSerializedSignal = serializeSignal(offerSignal)

    logger.log("Generated offer signal", offerSignal)

    await peerConnection.setLocalDescription(description)

    config.onSignal(offerSerializedSignal)
  }

  /**
   * Parses an offer signal and generates an answer signal.
   */
  const receiveOfferCreateAnswer = async (signal: Signal) => {
    logger.log('Processing offer...')

    if (signal.description === undefined) {
      logger.error(new Error("signal.description is null"))

      return
    }
    
    peerConnection.setRemoteDescription(signal.description)

    logger.log('Creating answer...')

    const description = await peerConnection.createAnswer()

    const answerSignal: Signal = {
      type: 'answer',
      description, 
    }

    const answerSerializedSignal = serializeSignal(answerSignal)

    await peerConnection.setLocalDescription(description)

    logger.log("Generated answer signal", answerSignal)

    config.onSignal(answerSerializedSignal)

    flushCandidates()
  }

  /**
   * Parses an answer signal, completing SDP signaling.
   */
  const receiveAnswer = async (signal: Signal) => {
    logger.log('Processing answer...')

    if (signal.description === undefined) {
      logger.error(new Error("signal.description is null"))

      return
    }

    await peerConnection.setRemoteDescription(signal.description)

    flushCandidates()
  }

  /**
   * Parses candidates signal to establish or reestablish a connection.
   */
  const receiveCandidates = async (signal: Signal) => {
    if (signal.candidates === undefined) {
      logger.error(new Error("signal.candidates is null"))

      return
    }

    remoteCandidates.push(...signal.candidates)

    flushCandidates()
  }

  /**
   * Deserializes and parses any signal, simplifying the connection process.
   */
  const receiveSignal = async (serializedSignal: SerializedSignal) => {
    const signal = deserializeSignal(serializedSignal)

    try {
      logger.log('Processing signal...')
  
      logger.log('Received signal:', signal.type)

      switch (signal.type) {
        case 'offer': {
          receiveOfferCreateAnswer(signal)

          break
        }
  
        case 'answer': {
          receiveAnswer(signal)

          break
        }

        case 'candidates': {
          receiveCandidates(signal)

          break
        }
      }
    } catch (error) {
      logger.error(new Error('Failed to process signal'), signal.type)
    }
  }

  /**
   * Send a message over the current data channel. Will queue messages if the connection is lost.
   */
  const sendMessage = async (value: string | Blob | ArrayBuffer | ArrayBufferView) => {
    try {
      if (dataChannel === null || dataChannel.readyState !== 'open') {
        await onOpen()
      }
  
      dataChannel?.send(value as any)
    } catch (error) {
      logger.log(error)
    }
  }

  /**
   * Promisified version of {@link RTCPeerConnection}.onicegatheringstatechange, only resolving on complete.
   */
  const onIceGatheringCompleted = () => new Promise<void>(resolve => {
    if (peerConnection.iceGatheringState === 'complete') {
      resolve()

      return
    }

    const icegatheringstatechange = () => {
      if (peerConnection.iceGatheringState === 'complete') {
        peerConnection.removeEventListener('icegatheringstatechange', icegatheringstatechange)

        resolve()
      }
    }

    peerConnection.addEventListener('icegatheringstatechange', icegatheringstatechange)
  })

  /**
   * Promisified version of {@link RTCDataChannel}.onopen.
   */
  const onOpen = () => new Promise<void>(resolve => {
    if (dataChannel?.readyState === 'open') {
      resolve()

      return
    }

    const open = () => {
      peerConnection.removeEventListener('SWRTC_datachannel_open', open)

      resolve()
    }

    peerConnection.addEventListener('SWRTC_datachannel_open', open)
  })

  // Peer Connection
  const peerConnection = new RTCPeerConnection(config.rtc)

  peerConnection.addEventListener('negotiationneeded', (event) => {
    logger.log('peerconnection', 'negotiationneeded', event)
  })

  peerConnection.addEventListener('connectionstatechange', () => {
    logger.log('peerconnection', 'connectionstatechange', peerConnection.connectionState)
  })

  peerConnection.addEventListener('datachannel', (event) => {
    logger.log('peerconnection', 'datachannel', event)

    initDataChannel(event.channel)
  })

  peerConnection.addEventListener('signalingstatechange', () => {
    logger.log('peerconnection', 'signalingstatechange', peerConnection.signalingState)

    flushCandidates()
  })

  peerConnection.addEventListener('icecandidate', ({ candidate }: RTCPeerConnectionIceEvent) => {
    logger.log('peerconnection', 'icecandidate', candidate)

    if (candidate !== null) {
      localCandidates.push(candidate)
    } else {
      // Finished gathering candidates
    }

    flushCandidates()
  })

  peerConnection.addEventListener('icecandidateerror', (event) => {
    if (!(event instanceof RTCPeerConnectionIceErrorEvent)) {
      logger.error('icecandidateerror', "unknown event type")

      return
    }

    if (event.errorCode === 701 && config.suppressIce701) {
      return
    }

    logger.error('peerconnection', new Error('icecandidateerror'), event)
  })

  peerConnection.addEventListener('iceconnectionstatechange', () => {
    logger.log('peerconnection', 'icegatheringstatechange', peerConnection.iceGatheringState)
  })

  peerConnection.addEventListener('icegatheringstatechange', () => {
    logger.log('peerconnection', 'iceconnectionstatechange', peerConnection.iceConnectionState)
  })

  peerConnection.addEventListener('SWRTC_datachannel_open', () => {
    logger.log('peerconnection', 'SWRTC_datachannel_open')
  })

  // Data Channel
  let dataChannel: RTCDataChannel | null = null

  /**
   * Creates shared reference to data channel and subscribes to its events.
   * 
   * Will dispatch a special event to {@link peerConnection} for {@link onOpen}.
   */
  const initDataChannel = (newDataChannel: RTCDataChannel) => {
    dataChannel = newDataChannel

    newDataChannel.addEventListener('message', (event) => {
      logger.log('datachannel', 'message', event)
  
      config.onMessage(event.data)
    })
  
    newDataChannel.addEventListener('error', (event) => {
      logger.error('datachannel', 'error', event)
    })
  
    newDataChannel.addEventListener('open', () => {
      logger.log('datachannel', 'open')

      peerConnection.dispatchEvent(new Event('SWRTC_datachannel_open'))
    })

    newDataChannel.addEventListener('close', () => {
      logger.log('datachannel', 'close')

      config.onDisconnect()
    })
  }

  // Init
  const logger = Logger(config.onLog, config.onError)
  
  const localCandidates: RTCIceCandidate[] = []
  const remoteCandidates: RTCIceCandidate[] = []

  /**
   * Signals all outgoing candidates and adds all incoming candidates. 
   */
  const flushCandidates = () => {
    if (localCandidates.length > 0) {
      config.onSignal(serializeSignal({
        type: 'candidates',
        candidates: localCandidates
      }))

      localCandidates.length = 0
    }

    if (remoteCandidates.length > 0) {
      for (const candidate of remoteCandidates) {
        peerConnection.addIceCandidate(candidate)
      }

      remoteCandidates.length = 0
    }
  }

  // Just in case it's not caught by one of our events
  setInterval(flushCandidates, 50)

  // Cleanup
  const disconnect = () => {
    dataChannel?.close()
    peerConnection.close()
  }
  
  return {
    onOpen,
    createOffer,
    receiveSignal,
    sendMessage,
    disconnect,

    advanced: {
      getPeerConnection: () => peerConnection,
      getDataChannel: () => dataChannel,
      onIceGatheringCompleted,
      onOpen,
      createOffer,
      receiveOfferCreateAnswer,
      receiveAnswer,
      receiveCandidates,
      receiveSignal,
      sendMessage,
    }
  }
}

import type { LogHandler } from "./log"
import type { SerializedSignal } from "./peerConnection"

export interface Config {
  /**
   * Standard configuration for {@link RTCPeerConnection}.
   */
  rtc: RTCConfiguration

  /**
   * Emits verbose logs. Hidden by default.
   */
  onLog: LogHandler

  /**
   * There's already an error logger built in, but subscribe to this if you would like to use custom error handler.
   */
  onError: LogHandler

  /**
   * Emits messages from {@link RTCDataChannel}.
   */
  onMessage: (message: string | Blob | ArrayBuffer | ArrayBufferView) => void

  /**
   * Required. Emits signals to pass to your signaling server.
   */
  onSignal: (signal: SerializedSignal) => void

  /**
   * Fired when the peer loses connection.
   */
  onDisconnect: () => void

  /**
   * From MDN: "Error 701 indicates that none of the ICE candidates were able to successfully make contact with the STUN or TURN server."
   * 
   * This is basically inevitable, so you probably want to set this to "true".
   */
  suppressIce701: boolean
}

export const defaultConfig: Config = {
  rtc: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],

    iceTransportPolicy: "all",
  },

  suppressIce701: true,

  onLog () {},

  onError (...args) {
    console.trace(...args)
  },

  onMessage () {},

  onSignal () { 
    throw new Error("Can't connect: onSignal hasn't been configured") 
  },

  onDisconnect () {},
}

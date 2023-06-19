import type { LogHandler } from "./log"
import type { SerializedSignal } from "./peerConnection"

export interface Config  {
  rtc: RTCConfiguration
  onLog: LogHandler
  onError: LogHandler
  onMessage: (message: string | Blob | ArrayBuffer | ArrayBufferView) => void
  onSignal: (signal: SerializedSignal) => void
  suppressIce701: boolean
}

export const config: Config = {
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

  onLog: () => {},

  onError: console.trace,

  onMessage: () => {},

  onSignal: () => { 
    throw new Error("can't connect: onSignal hasn't been configured") 
  },

  suppressIce701: true
}

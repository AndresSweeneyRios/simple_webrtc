/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import ReactDOM from 'react-dom/client'

import { Peer } from "../../src"

const host = Peer({
  onLog(...args: any[]) {
    console.log('[H]', ...args)
  },

  onSignal(signal) {
    // This is where you would connect to a signaling server
    // It passes over all offers, answers, and ICE candidates as a string
    client.receiveSignal(signal)
  },

  onMessage(message) {
    console.log('[H]', message)
  }
})

const client = Peer({
  onLog(...args: any[]) {
    console.log('[C]', ...args)
  },

  onSignal(signal) {
    host.receiveSignal(signal)
  },

  onMessage(message) {
    console.log('[C]', message)
  }
})

host.createOffer().catch(console.error)

host.sendMessage('hello client')
client.sendMessage('hello host')

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
  </React.StrictMode>,
)

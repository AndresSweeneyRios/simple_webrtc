function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import Emitter from '../util/emitter.js';
import WebRTC from './webrtc.js';
import UserMedia from './usermedia.js';
import Debug from '../util/debug.js';
export default class extends Emitter {
  constructor(options) {
    super(); // assign user options to default config

    _defineProperty(this, "peers", {});

    _defineProperty(this, "config", {
      log: false,
      debug: false,
      peer: {
        json: true
      }
    });

    _defineProperty(this, "Peer", name => {
      return this.peers[name] = new WebRTC(this);
    });

    Object.assign(this.config, options); // enable debugging features

    if (this.config.debug) {
      this.on('error', (code, message) => {
        if (message) Debug.code(code, message);else Debug.error(code);
      });
      if (this.config.log) this.on('log', message => {
        Debug.log(message);
      });
    }
  }

  get Broadcast() {
    const {
      peers
    } = this;
    return data => {
      for (const peer of Object.values(peers)) peer.send(data);
    };
  } // getter forwards emitter to UserMedia


  get Media() {
    return new UserMedia(this);
  }

}
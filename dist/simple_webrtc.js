export const debug = {
  name: {
    string: '[Simple WebRTC]',
    style: {
      color: '#ff69b4',
      'font-weight': '600'
    }
  },
  message: {
    style: {
      color: '#fff'
    }
  }
};
import { debug } from '../config.js'; // adds default styles to messages before logging

const parseMessage = (type, message, p1, p2, nameStyles = '') => {
  for (const i of Object.keys(debug.name.style)) nameStyles += `${i}: ${debug.name.style[i]}; `;

  console[type](`%c${debug.name.string} %c${message}`, nameStyles, p1 || '', p2 || '');
};

export default new class {
  log(message) {
    parseMessage('log', message);
  }

  error(message) {
    parseMessage('error', message);
  }

  dir(message) {
    parseMessage('dir', message);
  }

  warn(message) {
    parseMessage('warn', message);
  } // special styles to indicate a specific method being used


  code(code, message) {
    parseMessage('error', `${code}${(typeof message === 'object' ? '' : '%c', '')}`, 'padding: 3px 7px; background-color: rgb(40,40,40); color: white;', message);
  }

  table(message) {
    parseMessage('table', message);
  }

}();
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import Debug from './debug.js';
export default class {
  constructor() {
    _defineProperty(this, "events", {});
  }

  // adds function to the designated event
  get on() {
    const {
      events
    } = this;
    return function (event, callback = () => {}) {
      if (typeof event !== 'string') Debug.error(`Must provide an event string.`);
      events[event] = events[event] || [];
      if (typeof callback !== 'function') Debug.error(`Callback isn't a function,`);
      return new Promise(resolve => events[event].push(function () {
        callback(...arguments);
        resolve(...arguments);
      }));
    };
  } // iterates on event's functions defined with `on`
  // spreads all arguments except `event` into the function's parameters


  get emit() {
    const {
      events
    } = this;
    return function (event) {
      if (typeof event !== 'string') Debug.error(`Must provide an event string.`);
      if (!events[event]) return false;

      for (const i of events[event]) i(...Array.from(arguments).splice(1, arguments.length));
    };
  }

}
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
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

export default class extends RTCPeerConnection {
  constructor(config, {
    emit,
    on
  }) {
    super();

    _defineProperty(this, "candidates", []);

    _defineProperty(this, "datachannels", []);

    Object.assign(this, {
      config,
      emit,
      on
    });
    this.addEventListener('datachannel', event => {
      // invoked when a connection has been established
      // at this point it is safe to communicate
      event.channel.onopen = () => {
        this.emit('open');
        this.emit('log', 'datachannel open');
      }; // the receiving event for the `DataChannel.send` method


      event.channel.onmessage = async message => {
        try {
          const data = JSON.parse(message.data);

          if (data.renegotiation) {
            this.emit('log', 'renegotiation');
            this.SetRemoteDescription(data.sdp);

            if (data.type === 'offer') {
              emit('log', 'sending renegotiation answer');
              const answer = await this.createAnswer();
              await this.SetLocalDescription(answer);
              this.datachannels[0].send(JSON.stringify({
                type: 'answer',
                renegotiation: true,
                sdp: this.localDescription
              }), false);
            } else emit('log', 'received renegotiation answer');

            return;
          }

          if (data.type === 'icecandidate') {
            this.emit('log', 'received ice candidate');
            return this.AddIceCandidate(data.candidate);
          }
        } catch {}

        this.emit('message', this.config.json ? JSON.parse(message.data) : message.data);
      };

      event.channel.onerror = error => this.emit('error', 'PeerConnection.DataChannel', error);
    });
    this.addEventListener('error', event => {
      this.emit('error', 'PeerConnection', event);
    });
    this.addEventListener('icecandidate', event => {
      if (event.candidate) {
        this.emit('icecandidate', event.candidate);
        this.candidates.push(event.candidate);
        this.emit('log', 'found ice candidate');
      }
    }); // once this event is emitted, the offer/answer methods will resolve
    // this allows offers/answers to be transceived in one string (per peer)

    this.addEventListener('icegatheringstatechange', event => {
      if (event.target.iceGatheringState === 'complete') {
        this.emit('icecomplete', event);
        this.emit('log', 'ice gathering complete');
      }
    }); // receiving event for added media tracks

    this.ontrack = event => {
      this.emit('track', event);
    };

    this.emit('log', 'created peer');
    this.addEventListener('negotiationneeded', event => {
      this.emit('negotiationneeded', event);
      this.emit('log', 'negotiation needed');
    });
    this.on('addtrack', ({
      track,
      streams
    }) => {
      this.AddTrack(track, ...streams);
    });
  } // invoked by the `answer` and `open` methods
  // bulk/individually add ice candidates


  AddIceCandidate(candidates) {
    try {
      if (!candidates) throw 'no candidate(s) provided';
      if (Array.isArray(candidates)) for (const candidate of candidates) this.addIceCandidate(new RTCIceCandidate(candidate));else this.addIceCandidate(new RTCIceCandidate(candidates));
      this.emit('log', 'added ice candidate(s)');
    } catch (error) {
      this.emit('error', 'PeerConnection.addIceCandidate', 'no candidate(s) provided');
    }
  } // add a media track (video, audio, canvas)
  // it is also used by the UserMedia class


  AddTrack(track, streams = []) {
    try {
      if (!track) throw 'no track provided';
      if (!Array.isArray(streams)) streams = [streams];
      this.addTrack(track, ...streams);
      this.emit('log', 'added track(s)');
    } catch (error) {
      this.emit('error', 'PeerConnection.addTrack', error);
    }
  } // DataChannel creation, contains the `send` method
  // automatically stringifies content unless configured otherwise


  CreateDataChannel() {
    try {
      const DataChannel = this.createDataChannel("main", {
        reliable: true
      });

      const send = async (data, json = undefined) => {
        if (!data) throw 'no data provided';
        DataChannel.send((json !== undefined ? json : this.config.json) ? JSON.stringify(data) : data);
        return;
      };

      this.datachannels.push({
        DataChannel,
        send
      });
      this.emit('log', 'created data channel');
      return {
        DataChannel,
        send
      };
    } catch (error) {
      this.emit('error', 'PeerConnection.CreateDataChannel', error);
    }
  } // local/remote descriptions take an offer/answer object


  async SetLocalDescription(offer) {
    await this.setLocalDescription(new RTCSessionDescription(offer));
    this.emit('log', 'set local description');
    return;
  }

  async SetRemoteDescription(offer) {
    await this.setRemoteDescription(new RTCSessionDescription(offer));
    this.emit('log', 'set remote description');
    return;
  }

  Broadcast(data) {
    for (const {
      send
    } of this.datachannels) send(data);
  }

}
export default class {
  constructor({
    emit,
    on
  }) {
    Object.assign(this, {
      emit,
      on
    });
  }

  async GetMedia({
    video,
    audio,
    screen
  } = {
    video: false,
    audio: false
  }, allow, block) {
    try {
      const media = screen ? await navigator.mediaDevices.getDisplayMedia({
        audio,
        video
      }) : await navigator.mediaDevices.getUserMedia({
        audio,
        video
      });

      for (const track of media.getTracks()) {
        this.emit('addtrack', {
          track,
          streams: [media]
        });
      }

      await this.on('negotiationneeded');
      this.emit('media-negotiation');
      if (allow) if (typeof allow === 'function') allow(media);else throw '`allow` is not of type `function`';
      return media;
    } catch (error) {
      if (!error.name || ['NotAllowedError', 'AbortError', 'NotFoundError', 'SecurityError'].indexOf(error.name) < 0) {
        throw error;
      }

      this.emit('error', 'media.GetMedia', 'unable to access requested media');
      if (block) if (typeof block === 'function') block();else throw '`block` is not of type `function`';
      return null;
    }
  }

  async microphone(allow, block) {
    try {
      return await this.GetMedia({
        audio: true
      }, allow, block);
    } catch (error) {
      this.emit('error', 'media.microphone', error);
    }
  }

  async camera(allow, block) {
    try {
      return await this.GetMedia({
        video: true
      }, allow, block);
    } catch (error) {
      this.emit('error', 'media.camera', error);
    }
  }

  async screen(allow, block) {
    try {
      return await this.GetMedia({
        video: true,
        audio: true,
        screen: true
      }, allow, block);
    } catch (error) {
      this.emit('error', 'media.screen', error);
    }
  }

  async custom(constraints, allow, block) {
    try {
      return await this.GetMedia(constraints, allow, block);
    } catch (error) {
      this.emit('error', 'media.custom');
    }
  }

}
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import PeerConnection from './peerconnection.js';
import Emitter from '../util/emitter.js';
export default class extends Emitter {
  constructor({
    config,
    emit,
    on
  }) {
    super(); // create new PeerConnection

    _defineProperty(this, "peerConnection", void 0);

    _defineProperty(this, "dataChannel", void 0);

    _defineProperty(this, "icecomplete", false);

    this.peerConnection = new PeerConnection(config.peer, this);
    this.peerConnection.CreateDataChannel();
    this.datachannels = this.peerConnection.datachannels;
    this.on('offer', async offer => {
      this.send((await this.answer(offer)), false);
    });
    this.on('icecomplete', () => {
      this.icecomplete = true;
    });
    on('media-negotiation', async () => {
      this.renegotiate();
    });
    on('addtrack', track => this.emit('addtrack', track));
    this.on('negotiationneeded', () => emit('negotiationneeded'));
    this.on('log', message => {
      emit('log', message);
    });
    this.on('error', (code, message) => {
      emit('error', code, message);
    });

    (async () => {
      await this.on('open');
      this.on('icecandidate', candidate => {
        if (candidate) this.send({
          candidate,
          type: 'icecandidate'
        }, true);
      });
    })();
  } // create offer (starting point)


  async offer() {
    try {
      return await new Promise((resolve, reject) => {
        this.peerConnection.createOffer(async offer => {
          this.peerConnection.SetLocalDescription(offer);
          if (!this.icecomplete) await this.on('icecomplete');
          resolve(JSON.stringify({
            offer,
            candidates: this.peerConnection.candidates,
            type: 'offer'
          }));
        }, error => reject(error));
      });
    } catch (error) {
      this.emit('error', 'offer', error);
    }
  } // create answer with offer


  async answer(offerObject) {
    try {
      if (!offerObject) throw 'no offer provided';
      if (typeof offerObject === 'string') offerObject = JSON.parse(offerObject);
      const {
        offer,
        candidates
      } = offerObject;
      this.peerConnection.SetRemoteDescription(offer);
      return await new Promise((resolve, reject) => this.peerConnection.createAnswer(async answer => {
        this.peerConnection.SetLocalDescription(answer);
        if (!this.icecomplete) await this.on('icecomplete');
        resolve(JSON.stringify({
          answer: answer,
          candidates: this.peerConnection.candidates,
          type: 'answer'
        }));
        this.peerConnection.AddIceCandidate(candidates);
      }, error => reject(error)));
    } catch (error) {
      this.emit('error', 'answer', error);
    }
  }

  async renegotiate() {
    this.emit('log', 'renegotiating');
    const {
      offer
    } = JSON.parse((await this.offer()));
    await this.peerConnection.SetLocalDescription(offer);
    this.send(JSON.stringify({
      type: 'offer',
      renegotiation: true,
      sdp: this.peerConnection.localDescription
    }), false);
  } // establish connection with answer object


  async open(answerObject) {
    try {
      if (!answerObject) throw 'no answer provided';
      if (typeof answerObject === 'string') answerObject = JSON.parse(answerObject);
      const {
        answer,
        candidates
      } = answerObject;
      this.peerConnection.SetRemoteDescription(answer);
      this.peerConnection.AddIceCandidate(candidates);
      await this.on('open');
      return;
    } catch (error) {
      this.emit('error', 'open', error);
    }
  }

  send(data, json, channel = 0) {
    this.peerConnection.datachannels[channel].send(data, json);
  }

}

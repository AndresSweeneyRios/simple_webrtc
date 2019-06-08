export default class {
	constructor ({ events, emit }) {
		Object.assign( this, { 
			events, emit
		})
	}

	async GetMedia ( { video, audio, screen } = { video: false, audio: false }, allow, block ) {
		try {
			const media = screen 
				? await navigator.mediaDevices.getDisplayMedia({ audio, video })
				: await navigator.mediaDevices.getUserMedia({ audio, video })

			if (allow) 
				if (typeof allow === 'function') allow(media)
				else throw '`allow` is not of type `function`'

			for (const track of media.getTracks())
				this.emit('addtrack', track)

			await this.on('media-open')

			return media
		} catch (error) {
			if (!error.name || [
				'NotAllowedError',
				'AbortError',
				'NotFoundError',
				'SecurityError'
			].indexOf(error.name) < 0) {
				throw error
			}

			this.emit('error', 'media.GetMedia', 'unable to access requested media')

			if (block) 
				if (typeof block === 'function') block()
				else throw '`block` is not of type `function`'

			return null
		}
	}

	async microphone ( allow, block ) {
		try {
			return await this.GetMedia({ audio: true }, allow, block)
		} catch (error) {
			this.emit('error', 'media.microphone', error)
		}
	}

	async camera ( allow, block ) {
		try {
			return await this.GetMedia({ video: true }, allow, block)
		} catch (error) {
			this.emit('error', 'media.camera', error)
		}
	}

	async screen ( allow, block ) {
		try {
			return await this.GetMedia({ video: true, audio: true, screen: true }, allow, block)
		} catch (error) {
			this.emit('error', 'media.screen', error)
		}
	}

	async custom ( constraints, allow, block ) {
		try {
			return await this.GetMedia(constraints, allow, block)
		} catch (error) {
			this.emit('error', 'media.custom', )
		}
	}
}
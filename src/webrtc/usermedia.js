export default ({ emit, on }) => {
	const GetMedia = async ( { video, audio, screen } = { video: false, audio: false }, allow, block ) => {
		try {
			const media = screen 
				? await navigator.mediaDevices.getDisplayMedia({ audio, video })
				: await navigator.mediaDevices.getUserMedia({ audio, video })

			for (const track of media.getTracks()) {
				emit('addtrack', {
					track,
					streams: [media]
				})
			}

			await on('negotiationneeded')
			emit('media-negotiation')

			if (allow) 
				if (typeof allow === 'function') allow(media)
				else throw '`allow` is not of type `function`'

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

			emit('error', 'media.GetMedia', 'unable to access requested media')

			if (block) 
				if (typeof block === 'function') block()
				else throw '`block` is not of type `function`'

			return null
		}
	}

	const microphone = async ( allow, block ) => {
		try {
			return await GetMedia({ audio: true }, allow, block)
		} catch (error) {
			emit('error', 'media.microphone', error)
		}
	}

	const camera = async ( allow, block ) => {
		try {
			return await GetMedia({ video: true }, allow, block)
		} catch (error) {
			emit('error', 'media.camera', error)
		}
	}

	const screen = async ( allow, block ) => {
		try {
			return await GetMedia({ video: true, audio: true, screen: true }, allow, block)
		} catch (error) {
			emit('error', 'media.screen', error)
		}
	}

	const custom = async ( constraints, allow, block ) => {
		try {
			return await GetMedia(constraints, allow, block)
		} catch (error) {
			emit('error', 'media.custom', )
		}
    }
    
    return {
        GetMedia,
        custom,
        screen,
        camera,
        microphone,
    }
}
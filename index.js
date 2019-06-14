module.exports = ( type = 'esm' ) => {
	if (type === 'esm') {
		require = require("esm")(module)
		return new new require('./src/webrtc/main').default
	}

	else if (type === 'babel') {
		return new require('./dist/browser/webrtc/main')
	}

	else {
		return new require('./src/webrtc/main')
	}
}
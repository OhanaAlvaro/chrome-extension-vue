let thumb = {
	fc: {},

	load: function(fc) {
		thumb.fc = fc
		thumb.hide_hbo_thumbnail()
	},

	hide_hbo_thumbnail: function() {
		console.log('[hide_hbo_thumbnail] Trying to activate')
		var target = document.querySelector('.vjs-mouse-display')

		if (!target) {
			setTimeout(thumb.hide_hbo_thumbnail, 2000)
			return
		}
		// create an observer instance
		let observer = new MutationObserver(function(mutation) {
			let time = target.dataset.currentTime.split(':')
			let s = 0
			if (time.length == 2) {
				s = time[0] * 60 + time[1] * 1 //mm:ss
			} else {
				s = time[0] * 60 * 60 + time[1] * 60 + time[2] * 1 // hh:mm:ss
			}
			let ba = thumb.fc.best_action(thumb.fc.scenes, s * 1000)
			if (ba.action) {
				console.log('hidding fc-hidden-thumbnail')
				document.body.classList.add('fc-hidden-thumbnail')
			} else {
				document.body.classList.remove('fc-hidden-thumbnail')
			}
		})
		// pass in the element you wanna watch as well as the options
		observer.observe(target, { attributes: true })
		console.log('[hide_hbo_thumbnail] Activated!')
	}
}


module.exports = thumb
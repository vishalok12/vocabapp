/*global require*/
'use strict';

require.config({
	shim: {
	bootstrap: {
		deps: ['jquery'],
		exports: 'jquery'
	},

	'perfect-scrollbar': ['jquery', 'jquery.mousewheel'],
	'jquery.mousewheel': ['jquery'],
	bootstrap_collapse: ['jquery'],
	bootstrap_dropdown: ['jquery']
	},
	paths: {
	jquery: '../bower_components/jquery/dist/jquery',
	backbone: '../bower_components/backbone/backbone',
	underscore: '../bower_components/underscore/underscore',
	bootstrap: '../bower_components/sass-bootstrap/dist/js/bootstrap',
	'perfect-scrollbar': 'vendor/perfect-scrollbar',
	'jquery.mousewheel': 'vendor/jquery.mousewheel',
	bootstrap_collapse: '../bower_components/sass-bootstrap/js/collapse',
	bootstrap_dropdown: '../bower_components/sass-bootstrap/js/dropdown',
	'drag-arrange': '../bower_components/jquery-dragarrange/drag-arrange'
	}
});

require([
	'routes/word'

], function (WordRouter) {
	// Remove # sign after facebook login
	if ( (location.hash == "#_=_" || location.href.slice(-1) == "#_=_") ) {
		removeHash();
	}

	// initialize routing
	var router = new WordRouter();

	function removeHash() {
		var scrollV, scrollH, loc = window.location;
		if (history && 'replaceState' in history) {
			history.replaceState('', document.title, loc.pathname + loc.search);
		} else {
			// Prevent scrolling by storing the page's current scroll offset
			scrollV = document.body.scrollTop;
			scrollH = document.body.scrollLeft;

			loc.hash = '';

			// Restore the scroll offset, should be flicker free
			document.body.scrollTop = scrollV;
			document.body.scrollLeft = scrollH;
		}
	}
});

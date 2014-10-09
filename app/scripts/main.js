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
	// initialize routing
	var router = new WordRouter();
});

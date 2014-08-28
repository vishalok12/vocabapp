/*global define*/

define([
	'jquery',
	'backbone'
], function ($, Backbone) {
	'use strict';

	var WordRouter = Backbone.Router.extend({
		routes: {
			'name/:name': 'getWordByName',
			'remembered': 'showRemembered',
			'all': 'showAll',
			'addword(/:word)': 'addWord',
			'play/:name': 'playGame',
			'*actions': 'showToRemember'
		},

		getWordByName: function(name) {
			alert("name: " + name);
		},

		showRemembered: function() {
			app.wordType = "remembered";
			if (app.dictionaryView) {
				app.dictionaryView.render();
			}
			app.navBarView.highlight('remembered');
			this.setCurrentView(app.dictionaryView);
		},

		showToRemember: function() {
			app.wordType = '';
			if (app.dictionaryView){
				app.dictionaryView.render();
			}
			this.setCurrentView(app.dictionaryView);
		},

		addWord: function(word) {
			// if (app.addWordView) {
			//     app.addWordView.render();
			// }
			app.navBarView.highlight('add-word');
			app.addWordView.setWord(word);
			this.setCurrentView(app.addWordView);

		},

		showAll: function() {
			app.wordType = 'all';
			if (app.dictionaryView) {
				app.dictionaryView.render();
			}
			app.navBarView.highlight('all');
			this.setCurrentView(app.dictionaryView);
		},

		playGame: function(name) {
			new app.GameView({
				type: name
			});
		},

		setCurrentView: function(currentView) {
			if (app.currentView) {
				app.currentView.$el.hide();
			}
			app.currentView = currentView;
			currentView.$el.show();
		}

	});

	return WordRouter;
});

/*global define*/

define([
	'jquery',
	'underscore',
	'backbone',
	'collections/dictionary',
	'views/word_view',
	'views/search_view',
	'templates'
], function ($, _, Backbone, DictionaryCollection, WordView, SearchView, JST) {
	'use strict';

	var DictionaryView = Backbone.View.extend({
		id: 'dictionary',

		initialize: function(options) {
			this.wordType = options ? options.wordType : '';
			this.$addWord = this.$el.find('.add-word');

			this.collections = options.collections;

			this.listenTo(this.collections, "add", this.addWord);
			this.listenTo(this.collections, "destroy", this.removeWord);
			this.listenTo(this.collections, "change:remembered", this.setWordDisplay);

			this.render();
		},

		render: function() {
			var filteredModels;

			if (this.wordType === 'all') {
				filteredModels = this.collections.models;
			} else {
				var remembered = this.wordType === "remembered" ? true : false;
				filteredModels = this.collections.where( {remembered: remembered} );
			}

			var wordViews = [];
			var $words = $('<div class="word-container">');
			filteredModels.map(function(word) {
				var wordView = new WordView({ model: word });
				$words.append( wordView.render().el );
				wordViews.push(wordView);
			}, this);

			this.$el.append($words);

			return this;
		},

		addWord: function(word) {
			this.renderWord(word);
			this.searchView.addWord( word.get('name') );
		},

		removeWord: function(word) {
			this.searchView.removeWord( word.get('name') );
		},

		setWordDisplay: function(wordModel, remembered) {
			if (this.wordType !== 'all') {
				// remove the view
				// for now, re-render whole dictionary view
				// TODO: render/remove only the affected word
				this.$el.empty();
				this.render();
			}
		},

		renderWord: function(word) {
			var wordView = new WordView({ model: word });
			var $wordContainer = this.$('.word-container');
			if (!$wordContainer.length) {
				$wordContainer = $('<div class="word-container">');
				this.$el.append($wordContainer);
			}
			$wordContainer.append( wordView.render().el );
		},

		editWord: function(model) {
			app.editWordView.render(model);
			$('#edit-word').show();
			// window.scrollTo(0,0);
		}

	});

	function flip(elem) {
		$(elem).css({
			'-webkit-transform': 'rotateY(90deg)',
			'-moz-transform': 'rotateY(90deg)'
		});
		$(elem).siblings().css({
			'-webkit-transform': 'rotateY(90deg)',
			'-moz-transform': 'rotateY(90deg)'
		});

		$(elem).one('transitionend', function() {
			$(elem).css({
				'-webkit-transform': 'rotateY(180deg)',
				'-moz-transform': 'rotateY(180deg)',
				'z-index': 0
			});
			$(elem).siblings().css({
				'-webkit-transform': 'rotateY(0deg)',
				'-moz-transform': 'rotateY(0deg)',
				'z-index': 1
			});
		});
	}

	function getMeaning(phrase, callback) {
		$.ajax({
			url: "http://glosbe.com/gapi/translate",
			crossDomain: true,
			dataType: "jsonp",
			data: {
				from: "eng",
				dest: "eng",
				format: "json",
				phrase: phrase,
				page: 1,
				pretty: true
			},
		}).done(function(data) {
			var meanings;
			if (data && data.result == "ok" && data.tuc) {
				meanings = _.pluck(data.tuc[0].meanings.slice(0,4), 'text');
			} else {
				meanings = '';
			}
			callback(meanings);
		}).fail(function() {
			callback('');
		});
	}

	return DictionaryView;
});

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

	window.app = window.app || {};

	var DictionaryView = Backbone.View.extend({
		el: '#dictionary',

		initialize: function(words) {
			// this.$dictionary = this.$el.find('#dictionary');
			this.$addWord = this.$el.find('.add-word');

			this.collections = new DictionaryCollection();
			this.collections.fetch();

			// create search view, words are still being fetched using ajax!!
			// that's why it's empty
			this.searchView = new SearchView();

			this.listenTo(this.collections, "add", this.addWord);
			this.listenTo(this.collections, "destroy", this.removeWord);
		},

		render: function(wordNames) {
			var filteredModels;

			this.$el.empty();
			if (app.wordType === 'all') {
				filteredModels = this.collections.models;
			} else {
				var remembered = app.wordType === "remembered" ? true : false;
				filteredModels = this.collections.where( {remembered: remembered} );
			}
			if (wordNames) {
				wordNames = wordNames.map(function(word) {
					return word.toLowerCase();
				});
				filteredModels = filteredModels.filter(function(model) {
					return wordNames.indexOf(model.get('name')) + 1;
				});
			}

			var wordViews = [];
			var $words = $('<div class="word-container">');
			filteredModels.map(function(word) {
				var wordView = new WordView({ model: word });
				$words.append( wordView.render().el );
				wordViews.push(wordView);
			}, this);

			this.$el.append($words);

			for (var i = 0; i < wordViews.length; i++) {
				wordViews[i].afterAppend();
			}

			// this.searchView.clear();
			hideOtherContainers();

			return this;
		},

		addWord: function(word) {
			this.renderWord(word);
			this.searchView.addWord( word.get('name') );
		},

		removeWord: function(word) {
			this.searchView.removeWord( word.get('name') );
		},

		renderWord: function(word) {
			var wordView = new WordView({ model: word });
			var $wordContainer = this.$('.word-container');
			if (!$wordContainer.length) {
				$wordContainer = $('<div class="word-container">');
				this.$el.append($wordContainer);
			}
			$wordContainer.append( wordView.render().el );
			wordView.afterAppend();
		},

		editWord: function(model) {
			app.editWordView.render(model);
			$('#edit-word').show();
			// window.scrollTo(0,0);
		},

		showAddWordMessage: function(keyword) {
			var messageTemplate = JST['app/scripts/templates/add_word_message.ejs'];
			this.$el.empty();
			this.$el.append(messageTemplate({keyword: keyword}));
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

	function hideOtherContainers() {
		$('#game-wrapper').hide();
		$('#wrapper').show();
		app.navBarView.showSearchBar();
	}


	return DictionaryView;
});

/*global define*/

define([
	'jquery',
	'backbone',
	'views/dictionary_view',
	'views/navbar_view',
	'views/add_word_view',
	'views/game_view',
	'views/notification_view',
	'views/edit_word_view',
	'views/search_view',
	'views/no_words_view',
	'collections/dictionary',

], function ($, Backbone, DictionaryView, NavBarView, AddWordView, GameView,
		NotificationView, EditWordView, SearchView, NoWordsView, DictionaryCollection) {
	'use strict';

	var WordRouter = Backbone.Router.extend({
		routes: {
			'': 'showUnRemembered',
			'remembered': 'showRemembered',
			'all': 'showAll',
			'addword(/:word)': 'addWord',
			'play/:name': 'playGame'
		},

		initialize: function() {
			var that = this;
			window.app = _.extend({}, Backbone.Events);

			new NavBarView({el: '#navigation'});
			new NotificationView({el: '#notification'});

			this.dictionaryCollection = new DictionaryCollection();

			// words are already present (global script in index.js)
			if (window.dictionaryWords) {
				this.dictionaryWords = $.extend(true, [], window.dictionaryWords.map(function(word) {
					// parse method for word model
					word.id = word._id;
					word.synonyms = word.synonyms ? word.synonyms.split(',') : [];
					return word;
				}));
				this.dictionaryCollection.reset(this.dictionaryWords);

				this.afterWordFetch();
			} else {
				this.dictionaryCollection.fetch({
					success: function() {
						that.afterWordFetch();
					}
				});
			}

			var savedScrollY;
			// event binding
			app.on('word:edit', function(wordModel) {
				// disable parent view from scroll
				$('#dictionary').css({
					'position': 'fixed'
				});
				$('html').addClass('blurry');

				var editWordView = new EditWordView({
					model: wordModel
				});

				// save scroll value
				savedScrollY = $(window).scrollTop();

				$('#wrapper').append(editWordView.$el);
			});

			app.on('edit:close', function() {
				$('#dictionary').css({
					'position': 'static'
				});
				$('html').removeClass('blurry');
				window.scrollTo(0, savedScrollY);
			});

			app.on('addword', function(word) {
				that.dictionaryCollection.create(word);
			});

			app.on('search:words', function(words, searchKey) {
				if (words.length) {
					var searchWordCollection = new DictionaryCollection;
					searchWordCollection.reset(
						that.dictionaryWords
						.filter(function(word) {
							return words.indexOf(word.name.toLowerCase()) !== -1;
						})
					);
					// render filtered words
					var dictionaryView = new DictionaryView({
						wordType: '',
						collections: searchWordCollection
					});

					that.setCurrentView(dictionaryView);

					$('#wrapper').append(dictionaryView.$el);
					app.trigger('word:append');
				} else {
					// show suggestion to add this search key as new word in list
					var addWordSuggestionView = new NoWordsView({
						keyword: searchKey
					});

					that.setCurrentView(addWordSuggestionView);
					$('#wrapper').append(addWordSuggestionView.$el);
				}
			});
		},

		showUnRemembered: function() {
			var dictionaryView = new DictionaryView({
				wordType: '',
				collections: this.dictionaryCollection
			});

			this.setCurrentView(dictionaryView);

			$('#wrapper').append(dictionaryView.$el);
			app.trigger('word:append');
		},

		showRemembered: function() {
			var dictionaryView = new DictionaryView({
				wordType: 'remembered',
				collections: this.dictionaryCollection
			});

			this.setCurrentView(dictionaryView);

			$('#wrapper').append(dictionaryView.$el);
			app.trigger('word:append');
		},

		showAll: function() {
			var dictionaryView = new DictionaryView({
				wordType: 'all',
				collections: this.dictionaryCollection
			});

			this.setCurrentView(dictionaryView);

			$('#wrapper').append(dictionaryView.$el);
			app.trigger('word:append');
		},

		addWord: function(word) {
			var addWordView = new AddWordView({
				word: word
			});

			this.setCurrentView(addWordView);

			$('#wrapper').append(addWordView.$el);
		},

		playGame: function(name) {
			var gameView = new GameView({
				type: name
			});

			this.setCurrentView(gameView);
			$('#wrapper').append(gameView.$el);
		},

		setCurrentView: function(currentView) {
			// remove previous view

			if (this.currentView) {
				this.currentView.close ? this.currentView.close() : this.currentView.remove();
			}

			this.currentView = currentView;
		},

		afterWordFetch: function() {
			Backbone.history.start();

			new SearchView({
				collections: this.dictionaryCollection
			});
		}

	});

	return WordRouter;
});

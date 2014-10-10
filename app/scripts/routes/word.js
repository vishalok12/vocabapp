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
	'views/no_words_view',
	'views/search_view',
	'collections/dictionary',

], function ($, Backbone, DictionaryView, NavBarView, AddWordView, GameView,
		NotificationView, EditWordView, NoWordsView, SearchView, DictionaryCollection) {
	'use strict';

	var WordRouter = Backbone.Router.extend({
		routes: {
			'': 'showUnRemembered',
			'remembered': 'showRemembered',
			'all': 'showAll',
			'addword(/:word)': 'addWord',
			'play/:name': 'playGame'
		},

		initialize: function(route) {
			// bind event for all routes
			// methods, which will be called on every page change
			this.on('route', function(routeEvent) {
				app.trigger('page:change');

				this.navBarView.highlight(routeEvent)

				if (routeEvent === 'addWord' || routeEvent === 'playGame') {
					// hide search view
					$('#search-container').hide();
				} else {
					// show search view
					$('#search-container').show();
				}
			});
			var that = this;
			window.app = _.extend({}, Backbone.Events);

			this.dictionaryCollection = new DictionaryCollection();

			// words are already present (global script in index.js)
			if (window.dictionaryWords) {
				var dictionaryWords = $.extend(true, [], window.dictionaryWords.map(function(word) {
					// parse method for word model
					word.id = word._id;
					word.synonyms = word.synonyms ? word.synonyms.split(',') : [];
					return word;
				}));
				this.dictionaryCollection.reset(dictionaryWords);

				this.afterWordFetch();
			} else {
				this.dictionaryCollection.fetch({
					success: function() {
						that.afterWordFetch();
					}
				});
			}

			var savedScrollY;
			// event bindings
			app.on('word:edit', function(wordModel) {
				// save scroll value
				savedScrollY = $(window).scrollTop();

				// disable parent view from scroll
				$('#wrapper').css({
					'overflow': 'hidden'
				});
				$('html').addClass('blurry');

				var editWordView = new EditWordView({
					model: wordModel
				});

				$('#wrapper').append(editWordView.$el);
				window.scrollTo(0,0);
			});

			app.on('edit:close', function() {
				$('#wrapper').css({
					'overflow': 'inherit'
				});
				$('html').removeClass('blurry');
				window.scrollTo(0, savedScrollY);
			});

			app.on('addword', function(word) {
				that.dictionaryCollection.create(word);
			});

			app.on('search:words', function(words, searchKey) {
				if (words.length) {
					var searchWordCollection = new DictionaryCollection(
						that.dictionaryCollection.filter(function(model) {
							return words.indexOf(model.get('name').toLowerCase()) !== -1;
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
				collections: this.dictionaryCollection.unremembered()
			});

			this.setCurrentView(dictionaryView);

			$('#wrapper').append(dictionaryView.$el);
			app.trigger('word:append');
		},

		showRemembered: function() {
			var dictionaryView = new DictionaryView({
				collections: this.dictionaryCollection.remembered()
			});

			this.setCurrentView(dictionaryView);

			$('#wrapper').append(dictionaryView.$el);
			app.trigger('word:append');
		},

		showAll: function() {
			var dictionaryView = new DictionaryView({
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
			this.navBarView = new NavBarView({
				el: '#navigation'
			});

			this.searchView = new SearchView({
				el: '#search-container',
				collections: this.dictionaryCollection
			});

			new NotificationView({el: '#notification'});

			Backbone.history.start();
		}

	});

	return WordRouter;
});

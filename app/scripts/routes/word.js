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
	'views/sort_type_view',
	'collections/dictionary',
	'models/userSetting'

], function ($, Backbone, DictionaryView, NavBarView, AddWordView, GameView,
		NotificationView, EditWordView, NoWordsView, SearchView, SortTypeView,
		DictionaryCollection, UserSetting) {
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
			var that = this;
			window.app = _.extend({}, Backbone.Events);

			window.settings.id = window.settings._id;
			this.settings = new UserSetting(window.settings);

			// bind sort_type change
			this.listenTo(this.settings, 'change:sort_type', this.repaint);

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
				// get word position
				if (that.dictionaryCollection.length) {
					var sortedCollection = that.dictionaryCollection.sortBy(function(model) {
						return model.get('position');
					});
					word.position = sortedCollection[sortedCollection.length - 1].get('position') + 10000;
				} else {
					word.position = 10000;
				}

				that.dictionaryCollection.create(word);
			});

			app.on('unauthorised', function(e) {
				if (e.status === 401) {
					// TODO: show notification, if not logged in before redirecting
					// unauthorised access, go to login page
					window.location = '/';
				}
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

			app.on('nav', function(pageType, options) {
				pageType = pageType.toLowerCase();

				switch(pageType) {
					case 'unremembered':
						that.showUnRemembered();
						that.navigate('/');
						break;

					case 'remembered':
						that.showRemembered();
						that.navigate('/remembered');
						break;

					case 'all':
						that.showAll();
						that.navigate('/all');
						break;

					case 'add word':
						var word = options ? options.word : '';
						that.addWord(word);
						if (word) {
							that.navigate('/addword/' + word);
						} else {
							that.navigate('/addword');
						}
						break;

					case 'loop':
						that.playGame();
						that.navigate('/play/loop');
				}

				that.onRouteChange(pageType);
			});
		},

		showUnRemembered: function() {
			var dictionaryCollection = this.dictionaryCollection.unremembered()
				.getSorted(this.settings.get('sort_type'));
			var dictionaryView = new DictionaryView({
				collections: dictionaryCollection,
				arrangeable: this.settings.get('sort_type') === 'custom'
			});

			this.setCurrentView(dictionaryView);

			$('#wrapper').append(dictionaryView.$el);
			if (this.settings.get('sort_type') === 'custom') {
				// bind cards for drag
				$('.word-card').arrangeable();
			}

			app.trigger('word:append');
		},

		showRemembered: function() {
			var dictionaryView = new DictionaryView({
				collections: this.dictionaryCollection.remembered().getSorted(this.settings.get('sort_type'))
			});

			this.setCurrentView(dictionaryView);

			$('#wrapper').append(dictionaryView.$el);
			app.trigger('word:append');
		},

		showAll: function() {
			var dictionaryView = new DictionaryView({
				collections: this.dictionaryCollection.getSorted(this.settings.get('sort_type'))
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
				el: '#navigation',
				guest: window.IS_GUEST
			});

			this.sortTypeView = new SortTypeView({
				el: '#sort-container',
				collections: this.dictionaryCollection,
				model: this.settings
			});

			this.searchView = new SearchView({
				el: '#search-container',
				collections: this.dictionaryCollection
			});

			new NotificationView({el: '#notification'});

			Backbone.history.start({ pushState: true });
		},

		onRouteChange: function(routeEvent) {
			app.trigger('page:change');

			if (routeEvent === 'add word' || routeEvent === 'loop') {
				// hide search view
				$('.bottom-nav').hide();
			} else {
				// show search view
				$('.bottom-nav').show();
			}
		},

		repaint: function(model, new_sort_type) {
			var collections = this.currentView.collections.getSorted(new_sort_type);

			var dictionaryView = new DictionaryView({
				collections: collections,
				arrangeable: new_sort_type === 'custom'
			});

			this.setCurrentView(dictionaryView);

			$('#wrapper').append(dictionaryView.$el);

			if (new_sort_type === 'custom') {
				// bind cards for drag
				$('.word-card').arrangeable();
			}
			app.trigger('word:append');
		}

	});

	return WordRouter;
});

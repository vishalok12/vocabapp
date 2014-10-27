/*global define*/

define([
	'jquery',
	'underscore',
	'backbone',
	'collections/dictionary',
	'views/word_view',
	'views/search_view',
	'templates'
], function ($, _, Backbone, DictionaryCollection, WordView, JST) {
	'use strict';

	var DictionaryView = Backbone.View.extend({
		id: 'dictionary',

		initialize: function(options) {
			this.$addWord = this.$el.find('.add-word');

			this.collections = options.collections;

			this.listenTo(this.collections, "add", this.addWord);

			this.wordViews = [];

			this.render();

			var that = this;
			if (options.arrangeable) {
				this.wordViews.map(function(wordView, index) {
					wordView.$el.on('dragarrange', function(e, data) {
						// TODO: shouldn't use word's selector here
						var newIndex = $('.word-card').index(this);

						// shift word view to new position
						var wordViewIndex = that.wordViews.indexOf(wordView);
						that.wordViews.splice(wordViewIndex, 1);
						that.wordViews.splice(newIndex, 0, wordView);

						// get new position value

						var prevCardPosition, nextCardPosition, currentCardPosition;

						if (newIndex > 0) {
							prevCardPosition = that.wordViews[newIndex - 1].model.get('position');
						} else {
							prevCardPosition = 0;
						}

						if (newIndex < that.wordViews.length - 1) {
							nextCardPosition = that.wordViews[newIndex + 1].model.get('position');
						}

						if (nextCardPosition) {
							currentCardPosition = (prevCardPosition + nextCardPosition) / 2;
						} else {
							currentCardPosition = prevCardPosition + 10000;
						}

						wordView.model.save({'position': currentCardPosition});
					});
				});
			}
		},

		render: function() {
			var $words = $();

			this.collections.models.map(function(word) {
				var wordView = new WordView({ model: word });
				$words = $words.add( wordView.render().el );
				this.wordViews.push(wordView);
			}, this);

			this.$el.append($words);

			return this;
		},

		addWord: function(word) {
			this.renderWord(word);
		},

		renderWord: function(word) {
			var wordView = new WordView({ model: word });

			this.$el.append(wordView.render().el);
			this.wordViews.push(wordView);
		},

		close: function() {
			_.each(this.wordViews, function(wordView) {
				typeof wordView.close === "function" ? wordView.close() : wordView.remove();
			});

			this.remove();
		}

	});

	return DictionaryView;
});

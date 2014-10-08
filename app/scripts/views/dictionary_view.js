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
			this.$addWord = this.$el.find('.add-word');

			this.collections = options.collections;

			this.listenTo(this.collections, "add", this.addWord);
			this.listenTo(this.collections, "destroy", this.removeWord);

			this.wordViews = [];

			this.render();
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
			this.searchView.addWord( word.get('name') );
		},

		removeWord: function(word) {
			this.searchView.removeWord( word.get('name') );
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

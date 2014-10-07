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

			this.render();
		},

		render: function() {
			var wordViews = [];
			var $words = $('<div class="word-container">');
			this.collections.models.map(function(word) {
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

		renderWord: function(word) {
			var wordView = new WordView({ model: word });
			var $wordContainer = this.$('.word-container');
			if (!$wordContainer.length) {
				$wordContainer = $('<div class="word-container">');
				this.$el.append($wordContainer);
			}
			$wordContainer.append( wordView.render().el );
		}

	});

	return DictionaryView;
});

/*global define*/

define([
	'jquery',
	'underscore',
	'backbone',
	'templates'
], function ($, _, Backbone, JST) {
	'use strict';

	var SearchView = Backbone.View.extend({
		el: '#nav-search',

		events: {
			'input #word-search': "filterWords"
		},

		initialize: function (options) {
			var wordCollection = options.collections;
			this.words = wordCollection.models.map(function(word) {
				return word.get('name').toLowerCase();
			});

			// Make Tree for words to search faster
			this.parseWordsToTree();

			// DOM variables
			this.$input = this.$el.find('#word-search');
		},

		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
		},

		parseWordsToTree: function() {
			var root = new Node();
			var word, node;
			var i, j;
			var words = this.words;

			for (i = 0; i < words.length; i++) {
				word = words[i].toLowerCase();
				node = root;
				for (j = 0; j < word.length; j++) {
					if (!node.next) {
						node.next = [];
					}
					// node.next[ word[j].charCodeAt() - 97 ] = new Node();
					node = node.setNextAtIndex( word[j].charCodeAt() - 97, i );
				}
				node.indexes.push(i);
			}

			this.root = root;
		},

		getMatchedWords: function(substring) {
			var i = 0;
			var root = this.root;
			var words = this.words;

			var node = root;
			var s = substring.toLowerCase();

			while (i < s.length && node) {
				node = node.next ? node.next[ s[i].charCodeAt() - 97 ] : null;
				i++;
			}

			if (node) return node.indexes.map(function(index) {
				return words[index];
			});
			return [];
		},

		addWord: function(word) {
			this.words.push(word);
			this.parseWordsToTree();
		},

		removeWord: function(word) {
			var words = this.words;
			words.splice( words.indexOf(word), 1 );
			this.parseWordsToTree();
		},

		// TODO: Use fuzzy search for better search results
		filterWords: function(e) {
			var searchKey = this.$input.val();
			var words = this.getMatchedWords(searchKey);

			app.trigger('search:words', words, searchKey);
		},

		clear: function() {
			this.$input.val('');
		}

	});

	function Node() {
		this.indexes = [];
		this.next = null;
	}

	Node.prototype.setNextAtIndex = function(i, id) {
		this.indexes.push(id);
		if ( !this.next ) {
			this.next = [];
		}
		if ( !this.next[i] ) {
			this.next[i] = new Node();
		}

		return this.next[i];
	};

	return SearchView;
});

define([
	'backbone',
	'models/word'

], function (Backbone, wordModel) {
	'use strict';

	var DictionaryCollection = Backbone.Collection.extend({
		url: 'api/words',
		model: wordModel,

		unremembered: function() {
			var filtered = this.filter(function(model) {
				return !model.get('remembered');
			});

			return new DictionaryCollection(filtered);
		},

		remembered: function() {
			var filtered = this.filter(function(model) {
				return model.get('remembered');
			});

			return new DictionaryCollection(filtered);
		},

		getSorted: function(sortType) {
			switch(sortType) {
				case 'alphabetic':
					return new DictionaryCollection(this.sortBy(function(model) {
						return model.get('name');
					}));

				case 'alphabetic-reverse':
					return new DictionaryCollection(this.sortBy(function(model) {
						return model.get('name');
					}).reverse());

				case 'recent-on-top':
					return new DictionaryCollection(this.sortBy(function(model) {
						return model.get('updated_at');
					}).reverse());

				case 'oldest-on-top':
					return new DictionaryCollection(this.sortBy(function(model) {
						return model.get('updated_at');
					}));

				case 'custom':
					return new DictionaryCollection(this.sortBy(function(model) {
						return model.get('position');
					}));

				default:
					return this;
			}
		}
	});

	return DictionaryCollection;
});

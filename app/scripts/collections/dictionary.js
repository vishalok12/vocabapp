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
		}
	});

	return DictionaryCollection;
});

/*global define*/

define([
	'backbone',
	'models/word',
	'localStorage'
], function (Backbone, wordModel) {
	'use strict';

	var DictionaryCollection = Backbone.Collection.extend({
		localStorage: new Backbone.LocalStorage('dictionary'),
		url: 'api/words',
		model: wordModel
	});

	return DictionaryCollection;
});

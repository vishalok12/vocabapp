define([
	'backbone'
], function (Backbone) {
	'use strict';

	var WordModel = Backbone.Model.extend({
		defaults: {
			remembered: false,
			synonyms: []
		},
		parse: function (response) {
			response.id = response._id;
			response.synonyms = response.synonyms ? response.synonyms instanceof Array ?
				response.synonyms : response.synonyms.split(',') : [];
			return response;
		},
		validate: function(attributes) {
			if (!attributes.name || !attributes.meaning) {
				return 'name and meaning both should be passed';
			}
		}
	});

	return WordModel;
});

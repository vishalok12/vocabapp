define([
	'jquery',
	'backbone',
	'templates',

], function ($, Backbone, JST) {
	'use strict';

	var NoWordsView = Backbone.View.extend({
		id: 'add-word-suggestion',
		template: JST['app/scripts/templates/add_word_message.ejs'],

		initialize: function(options) {
			this.render(options.keyword);
		},

		render: function(keyword) {
			this.$el.html( this.template({
				keyword: keyword
			}) );

			return this;
		}
	});

	return NoWordsView;
});

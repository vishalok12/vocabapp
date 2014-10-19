define([
	'jquery',
	'backbone',
	'templates',

], function ($, Backbone, JST) {
	'use strict';

	var NoWordsView = Backbone.View.extend({
		id: 'add-word-suggestion',
		template: JST['app/scripts/templates/add_word_message.ejs'],

		events: {
			'click a': "navigateLink"
		},

		initialize: function(options) {
			this.keyword = options.keyword;
			this.render(options.keyword);
		},

		render: function(keyword) {
			this.$el.html( this.template({
				keyword: keyword
			}) );

			return this;
		},

		navigateLink: function(e) {
			e.preventDefault();
			app.trigger('nav', 'add word', {word: this.keyword});
		}
	});

	return NoWordsView;
});

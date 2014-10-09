/*global define*/

define([
	'jquery',
	'backbone',
	'templates'
], function ($, Backbone, JST) {
	'use strict';

	var NotificationView = Backbone.View.extend({
		template: JST['app/scripts/templates/notification.ejs'],

		events: {
			'click .undo-action': "triggerUndo",
		},

		initialize: function() {
			this.listenTo(app, 'word:predelete', this.display);
			this.listenTo(app, 'word:delete', this.hide);

			this.hide();
		},

		render: function(text) {
			//this.el is what we defined in tagName. use $el to get access to jQuery html() function
			this.$el.html( this.template( {text: text} ) );

			return this;
		},

		triggerUndo: function() {
			app.trigger('notification:undo');

			this.hide();
		},

		display: function(text) {
			text = text ? text.slice(0,1).toUpperCase() + text.slice(1).toLowerCase() : '';
			var that = this;
			this.render('Deleting ' + text);

			this.$el.show();
		},

		hide: function() {
			this.$el.hide();
		}

	});

	return NotificationView;
});

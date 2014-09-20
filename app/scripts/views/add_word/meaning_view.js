define([
	'jquery',
	'backbone',
	'templates'
], function ($, Backbone, JST) {
	'use strict';

	var MeaningView = Backbone.View.extend({
		tagName: 'li',
		className: 'word-meaning',

		template: JST['app/scripts/templates/add_word/meaning.ejs'],

		events: {
			'click .stored-value': "editMeaning",
			'keydown .edit-value': "preventSpaceScroll",
			'keypress .edit-value': "updateMeaning",
			'blur .edit-value': "checkMeaning",
			'click .trash-icon': "deleteView"
		},

		initialize: function(opts) {
			this.render(opts);
			this.$storedValue = this.$el.find('.stored-value');
			this.$input = this.$el.find('.edit-value');
		},

		render: function(opts) {
			this.$el.html( this.template(opts) );

			return this;
		},

		getValue: function() {
			return this.$storedValue.text().trim();
		},

		editMeaning: function() {
		  this.$input.val(this.$storedValue.text());
		  this.$el.addClass('editing ds-no-drag');
		  this.$input.select();
		},

		preventSpaceScroll: function(e) {
			// prevent scroll-down from space
			if (e.keyCode === 32) {
				this.$input.val(this.$input.val() + " ");

				return false;
			}

		},

		updateMeaning: function(e) {
			var newValue = this.$input.val() + String.fromCharCode(e.keyCode);
			this.$storedValue.text(newValue);

			if (e.keyCode === 13) {
				this.showMeaning();
			}
		},

		showMeaning: function() {
			this.$el.removeClass('editing ds-no-drag');
		},

		deleteView: function() {
			this.remove();
			this.trigger("destroy", this);
		},

		checkMeaning: function() {
			if (!this.$input.val()) {
				this.deleteView();
			} else {
				this.showMeaning();
			}
		}
	});

	return MeaningView;
});

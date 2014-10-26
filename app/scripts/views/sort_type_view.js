/*global define*/

define([
	'jquery',
	'backbone',
	'templates'
], function ($, Backbone, JST) {
	'use strict';

	var sortTypes = {
		'recent-on-top': 'Sort By Recent On Top',
		'oldest-on-top': 'Sort By Oldest On Top',
		'alphabetic': 'Sort Alphabetically',
		'alphabetic-reverse': 'Sort Alphabetically Reversed',
		'custom': 'Custom (drag cards to arrange)'
	};

	var WordView = Backbone.View.extend({
		tagName: 'select',
		className: 'sort-by',
		template: JST['app/scripts/templates/sort_type.ejs'],

		events: {
			'change': 'setSortType'
		},

		initialize: function(options) {
			this.render();

			this.listenTo(this.model, "error", this.notifyError);
		},

		render: function(selectedSortType) {
			this.$el.html( this.template({
				selectedSortType: this.model.get('sort_type'),
				sortTypes: sortTypes
			}));

			return this;
		},

		setSortType: function(e) {
			var newSortType = e.target.value;
			this.model.set('sort_type', newSortType).save();
		},

		notifyError: function(model, error) {
			app.trigger('unauthorised', error);
		}
	});

	return WordView;
});

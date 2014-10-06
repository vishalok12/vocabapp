define([
	'jquery',
	'backbone',
	'views/add_word/meaning_view',
	'templates',
	'drag-arrange'
], function ($, Backbone, MeaningView, JST) {
	'use strict';

	var EditWordView = Backbone.View.extend({
		id: 'edit-word',

		template: JST['app/scripts/templates/edit_word.ejs'],

		events: {
			'click .save-btn': 'saveMeaning',
			'click .close-btn': 'close'
		},

		initialize: function() {
			this.render();
		},

		render: function() {
			this.meaningViews = [];

			var meanings = this.model.get('meaning').split(';').filter(function(meaning) {
				return meaning;
			});
			var meaningView;

			this.$el.html( this.template(this.model.toJSON()) );

			var i;
			for (i = 0; i < meanings.length; i++) {
				this.createNewMeaningInput(meanings[i]);
			}

			// TODO: should not use the child element here
			// make all the meanings draggable to change the order
			this.$('.word-meaning').arrangeable({
				dragSelector: '.drag-icon'
			});

			return this;
		},

		removeFromMeaningList: function(meaningView) {
			this.meaningViews.splice(this.meaningViews.indexOf(meaningView), 1);
		},

		createNewMeaningInput: function(meaning) {
			meaning = meaning || '';
			var meaningView = new MeaningView({meaning: meaning});
			this.$('.edit-meaning').append(meaningView.el);
			meaningView.on("destroy", this.removeFromMeaningList, this);
			this.meaningViews.push(meaningView);

			return meaningView;
		},

		createEmptyMeaningInput: function() {
			var meaningView = this.createNewMeaningInput('');
			meaningView.editMeaning();
		},

		saveMeaning: function() {
			var newMeaning = '';

			// TODO: get meaning from meaning view
			// currently sorting changes order of meaning view
			var $meanings = $('.word-meaning');
			for (var i = 0; i < $meanings.length; i++) {
				newMeaning += $meanings.eq(i).find('.stored-value').text() + ';';
			}

			this.model.set('meaning', newMeaning).save();

			this.close();
		},

		close: function() {
			app.trigger('edit:close');
			this.remove();
		}
	});

	return EditWordView;
});

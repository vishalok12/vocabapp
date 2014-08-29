define([
	'jquery',
	'backbone',
	'views/add_word/meaning_view',
	'templates'
], function ($, Backbone, MeaningView, JST) {
	'use strict';

	var savedScrollY;

	var EditWordView = Backbone.View.extend({
		el: '#edit-word',

		template: JST['app/scripts/templates/edit_word.ejs'],

		events: {
			'click .edit-btn': 'saveMeaning',
			'click .close-btn': 'close'
		},

		render: function(wordModel) {
			this.meaningViews = [];
			this.wordModel = wordModel;

			var meanings = wordModel.get('meaning').split(';').filter(function(meaning) {
				return meaning;
			});
			var meaningView;

			this.$el.html( this.template(wordModel.toJSON()) );

			var i;
			for (i = 0; i < meanings.length; i++) {
				this.createNewMeaningInput(meanings[i]);
			}

			// save scroll value
			savedScrollY = $(window).scrollTop();

			// disable parent view from scroll
			$('html').css('position', 'fixed');

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

			for (var i = 0; i < this.meaningViews.length; i++) {
				newMeaning += this.meaningViews[i].getValue() + ';';
			}

			this.wordModel.set('meaning', newMeaning).save();

			this.close();
		},

		close: function() {
			this.$el.hide();
			$('html').css('position', 'static');
			window.scrollTo(0, savedScrollY);
		}
	});

	return EditWordView;
});

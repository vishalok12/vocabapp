define([
	'jquery',
	'backbone',
	'views/add_word/meaning_view',
	'templates',
	'drag-arrange'
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
			$('#dictionary').css({
				'position': 'fixed'
			});
			$('html').addClass('blurry');

			// TODO: should not use the child element here
			// make all the meanings draggable to change the order
			$('.word-meaning').arrangeable({
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

			this.wordModel.set('meaning', newMeaning).save();

			this.close();
		},

		close: function() {
			this.$el.hide();
			$('#dictionary').css({
				'position': 'static'
			});
			$('html').removeClass('blurry');
			window.scrollTo(0, savedScrollY);
		}
	});

	return EditWordView;
});

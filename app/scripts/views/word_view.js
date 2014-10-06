/*global define*/

define([
	'jquery',
	'backbone',
	'templates',
	'perfect-scrollbar'
], function ($, Backbone, JST) {
	'use strict';

	var DELETE_TIME_GAP = 5000;

	var WordView = Backbone.View.extend({
		tagName: 'section',
		className: 'word-card',
		template: JST['app/scripts/templates/word.ejs'],

		events: {
			'click .front-face': "flip",
			'click .back-face': "flipBack",
			'click .remove': "showDeleteNotification",
			'click .done-mark': "toggleRemembered",
			'click .edit': "edit",
			'click .word label, .volume-icon': "pronounceWord",
			'transitionend .front-face': "performRestAnimation"
		},

		initialize: function() {
			console.log('initialize for model', this.model.get('name'));
			// this.listenTo(this.model, "add", this.render);
			this.listenTo(this.model, "change", this.render);
			this.audio = new Audio();
			// this.listenTo(this.model, "remove", this.remove);
			var that = this;
			app.once("word:append", function() {
				that.afterAppend()
			});
		},

		render: function() {
			this.$el.html( this.template( this.model.toJSON() ) );

			return this;
		},

		showDeleteNotification: function() {
			// trigger word before delete event

			app.trigger('word:predelete', this.model.get('name'));
			var that = this;

			this.deleteTimeoutId = setTimeout(function() {
				console.log('finally deleting word...');
				app.trigger('word:delete', that.model.get('name'));
				app.off('notification:undo');
				that.deleteWord();
			}, DELETE_TIME_GAP);

			app.on('notification:undo', function() {
				app.off('notification:undo');
				that.cancelDeleteAction();
			});

			this.$el.addClass('hide');

			return false;
		},

		cancelDeleteAction: function() {
			if (this.deleteTimeoutId) {
				clearTimeout(this.deleteTimeoutId);
				this.deleteTimeoutId = null;
				this.$el.removeClass('hide');
			}
		},

		deleteWord: function() {
			this.model.destroy();
			this.remove();
		},

		close: function() {
			this.stopListening();
		},

		toggleRemembered: function() {
			this.model.save({
				remembered: !this.model.get('remembered')
			});
			return false;
		},

		pronounceWord: function() {
			if (!this.audio.src) {
				this.audio.src = "https://ssl.gstatic.com/dictionary/static/sounds/de/0/" +
					this.model.get('name').toLowerCase() + ".mp3";
			}
			this.audio.play();

			return false;
		},

		flip: function() {
			this.animationType = "back";
			this.$el.find('.front-face').css({
				'-webkit-transform': 'rotateY(90deg)',
				'-moz-transform': 'rotateY(90deg)'
			});
			this.$el.find('.back-face').css({
				'-webkit-transform': 'rotateY(90deg)',
				'-moz-transform': 'rotateY(90deg)'
			});
		},

		flipBack: function() {
			this.animationType = "front";
			this.$el.find('.front-face').css({
				'-webkit-transform': 'rotateY(90deg)',
				'-moz-transform': 'rotateY(90deg)'
			});
			this.$el.find('.back-face').css({
				'-webkit-transform': 'rotateY(90deg)',
				'-moz-transform': 'rotateY(90deg)'
			});
		},

		performRestAnimation: function() {
			var frontFaceAngle, backFaceAngle;
			var zIndexFront, zIndexBack;

			if (this.animationType === "back") {
				frontFaceAngle = 180;
				backFaceAngle = 0;
				zIndexFront = 0;
				zIndexBack = 1;
			} else {
				frontFaceAngle = 0;
				backFaceAngle = 180;
				zIndexFront = 1;
				zIndexBack = 0;
			}

			this.$el.find('.front-face').css({
				'-webkit-transform': 'rotateY(' + frontFaceAngle + 'deg)',
				'-moz-transform': 'rotateY(' + frontFaceAngle + 'deg)',
				'z-index': zIndexFront
			});
			this.$el.find('.back-face').css({
				'-webkit-transform': 'rotateY(' + backFaceAngle + 'deg)',
				'-moz-transform': 'rotateY(' + backFaceAngle + 'deg)',
				'z-index': zIndexBack
			});
		},

		afterAppend: function() {
			this.$('.meaning').perfectScrollbar({
				wheelSpeed: 20,
				wheelPropagation: true,
				suppressScrollX: true
			});
		},

		edit: function() {
			// trigger word edit event
			app.trigger('word:edit', this.model);

			return false;
		}
	});

	return WordView;
});

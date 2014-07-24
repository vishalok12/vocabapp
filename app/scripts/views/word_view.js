/*global define*/

define([
    'jquery',
    'backbone',
    'templates',
    'perfect-scrollbar'
], function ($, Backbone, JST) {
    'use strict';

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
            'click .word label': "pronounceWord",
            'transitionend .front-face': "performRestAnimation"
        },

        initialize: function() {
            console.log('initialize for model', this.model.get('name'));
            // this.listenTo(this.model, "add", this.render);
            this.listenTo(this.model, "change", this.render);
            this.listenTo(app.notificationView, "undo:delete", this.cancelDeleteAction);
            this.audio = new Audio();
            this.deleteNotificationPeriod = 5000;
            // this.listenTo(this.model, "remove", this.remove);
        },

        render: function() {
            //this.el is what we defined in tagName. use $el to get access to jQuery html() function
            this.$el.html( this.template( this.model.toJSON() ) )
                            .toggleClass('hide', this.isHidden());

            return this;
        },

        showDeleteNotification: function() {
            console.log('show notification for undo action!!');
            app.notificationView.display('Deleted...', this.deleteNotificationPeriod);

            var that = this;

            this.deleteTimeoutId = setTimeout(function() {
                console.log('finally deleting word...');
                that.deleteWord();
            }, this.deleteNotificationPeriod);

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

        isHidden: function() {
            if (app.wordType === 'all') { return false; }
            var remembered = this.model.get('remembered');
            return (remembered && app.wordType !== "remembered") ||
                (!remembered && app.wordType === "remembered");
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
            this.$el.find('.meaning').perfectScrollbar({
                wheelSpeed: 20,
                wheelPropagation: true,
                suppressScrollX: true
            });
        },

        edit: function() {
            app.dictionaryView.editWord(this.model);
            
            return false;
        }
    });

    return WordView;
});

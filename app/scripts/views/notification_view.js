/*global define*/

define([
    'jquery',
    'backbone',
    'templates'
], function ($, Backbone, JST) {
    'use strict';

    var WordView = Backbone.View.extend({
        el: '#notification',

        template: JST['app/scripts/templates/notification.ejs'],

        events: {
            'click .undo-action': "undoAction",
        },

        render: function(text) {
            //this.el is what we defined in tagName. use $el to get access to jQuery html() function
            this.$el.html( this.template( {text: text} ) );

            return this;
        },

        undoAction: function() {
            console.log('trigger undo');
            this.trigger('undo:delete');
            this.hide();
            clearTimeout(this.hideTimeoutId);
        },

        display: function(text, period) {
            var that = this;
            this.render(text);

            this.$el.show();
            this.hideTimeoutId = setTimeout(function() {
                that.hide();
            }, period);
        },

        hide: function() {
            this.$el.hide();
        }

    });

    return WordView;
});

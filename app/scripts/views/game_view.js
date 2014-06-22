define([
    'jquery',
    'backbone',
    'collections/dictionary',
    'views/word_view',
    'templates'
], function ($, Backbone, DictionaryCollection, WordView, JST) {
    'use strict';

    var GameView = Backbone.View.extend({
        el: '#game-wrapper',

        events: {
            'click #lg-remembered': "markWordRemembered",
            'click #lg-not-remembered': "markWordNotRemembered",
            'click #lg-next': "showNextWord"
        },

        initialize: function(options) {
            this.collections = new DictionaryCollection();
            // this.collections.on('reset', this.render());
            var that = this;
            app.wordType = 'unremembered';
            this.collections.fetch({
                success: function() {
                    that.wordPool = that.collections.models.filter(function(model) {
                        return !model.get('remembered');
                    });
                    that.acceptAnswer(true);        // true when user can able to answer remembered/not remembered
                    that.nextWordPool = [];
                    if (!that.wordPool.length) {
                        alert('There must be a word to start game!!');
                    } else {
                        that.render();
                    }
                }
            });
            this.$loopGame = this.$el.find('.loop-game');
            this.currentIndex = 0;
            this.$wordContainer = this.$el.find('.word-container');
            this.$gameButtons = this.$el.find('.game-option');
            this.$nextButton = this.$el.find('#lg-next');
            hideOtherContainers();
        },

        render: function() {
            var currentWord = this.wordPool[this.currentIndex];
            if (this.wordView) {
                this.wordView.close();
            }
            this.wordView = new WordView( {model: currentWord} );

            this.$wordContainer.html( this.wordView.render().$el );

            this.acceptAnswer(true);

            return this;
        },

        /**
         * removes the word from the loop-game
         */
        markWordRemembered: function() {
            if (!this.acceptAnswer()) { return; }
            this.acceptAnswer(false);

            this.wordPool.shift();
            checkWordPool(this);
            this.showNextWord();
        },

        /**
         * move this word for the next loop
         */
        markWordNotRemembered: function() {
            if (!this.acceptAnswer()) { return; }
            this.acceptAnswer(false);
            
            this.nextWordPool.push(this.wordPool.shift());
            checkWordPool(this);
            this.wordView.flip();
        },

        /**
         *
         */
        showNextWord: function() {
            if (this.wordPool.length) {
                this.render();
            }
        },

        acceptAnswer: function(canAnswer) {
            if (canAnswer !== undefined) {
                this.canAnswer = canAnswer;
                this.$gameButtons.toggleClass('active', canAnswer);
                this.$nextButton.toggleClass('active', !canAnswer);
            } else {
                return this.canAnswer;
            }
        }

    });

    function checkWordPool(self) {
        if (!self.wordPool.length) {
            if (self.nextWordPool.length) {
                self.wordPool = self.nextWordPool;
                self.nextWordPool = [];
            } else {
                // Game finished
                alert('game finished');
            }
        }
    }

    function hideOtherContainers() {
        $('#wrapper').hide();
        $('#game-wrapper').show();
    }

    return GameView;
});

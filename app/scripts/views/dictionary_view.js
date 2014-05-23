/*global define*/

define([
    'jquery',
    'underscore',
    'backbone',
    'collections/dictionary',
    'views/word_view',
    'views/search_view',
    'templates'
], function ($, _, Backbone, DictionaryCollection, WordView, SearchView, JST) {
    'use strict';

    window.app = window.app || {};

    var DictionaryView = Backbone.View.extend({
        el: '#wrapper',

        events: {
            'click .add-word .front-face': "checkAndFlip",
            'keypress #name': "flipBack",
            'click .add-word .back': "flipFront",
            'click #new-word-btn': "getParams"
        },

        initialize: function(words) {
            this.$dictionary = this.$el.find('#dictionary');
            this.$addWord = this.$el.find('.add-word');
            
            this.collections = new DictionaryCollection();
            this.collections.fetch();

            this.searchView = new SearchView(this);

            this.listenTo(this.collections, "add", this.addWord);
            this.listenTo(this.collections, "destroy", this.removeWord);
            
            this.render();
        },

        render: function(wordNames) {
            var filteredModels;

            this.$dictionary.html('');
            if (app.wordType === 'all') {
                filteredModels = this.collections.models;
            } else {
                var remembered = app.wordType === "remembered" ? true : false;
                filteredModels = this.collections.where( {remembered: remembered} );
            }
            if (wordNames) {
                wordNames = wordNames.map(function(word) {
                    return word.toLowerCase();
                });
                filteredModels = filteredModels.filter(function(model) {
                    return wordNames.indexOf(model.get('name')) + 1;
                });
            }
            filteredModels.map(function(word) {
                this.renderWord(word);
            }, this);

            hideOtherContainers();

            return this;
        },

        addWord: function(word) {
            this.renderWord(word);
            this.searchView.addWord( word.get('name') );
        },

        removeWord: function(word) {
            this.searchView.removeWord( word.get('name') );
        },

        renderWord: function(word) {
            var wordView = new WordView({ model: word });
            this.$dictionary.append( wordView.render().el );
        },

        checkAndFlip: function(e) {
            var clickedElement = e.originalEvent.srcElement;
            var $input = $('#name');

            if ( $input.val().trim() === '' || clickedElement === $input[0] ) { return; }

            fetchMeaningAndFlip($input.val().trim());

            return false;
        },

        flipBack: function(e) {
            if ( e.keyCode === 13 ) {
                fetchMeaningAndFlip($('#name').val().trim());
            }
        },

        flipFront: function(e) {
            flip( $(e.currentTarget).parent() );

            $('#name').focus();

            return false;
        },

        getParams: function() {
            var wordName = $('#name').val().trim();
            var meaning = $('#meaning').val().trim();
            var synonyms = $('#synonyms').val()
                                         .replace(/\s+/g, '')
                                         .split(/,|;/)
                                         .filter(function(synonym) {
                                                return synonym !== '';
                                         });

            if (!wordName || !meaning) {
                return;
            }
            
            this.collections.create({
                name: wordName,
                meaning: meaning,
                synonyms: synonyms
            });

            $('#name').val('');
            $('#meaning').val('');
            $('#synonyms').val('');

            flip( $('.add-word .back-face') );
        }

    });

    function flip(elem) {
        $(elem).css({
            '-webkit-transform': 'rotateY(90deg)',
            '-moz-transform': 'rotateY(90deg)'
        });
        $(elem).siblings().css({
            '-webkit-transform': 'rotateY(90deg)',
            '-moz-transform': 'rotateY(90deg)'
        });

        $(elem).one('transitionend', function() {
            $(elem).css({
                '-webkit-transform': 'rotateY(180deg)',
                '-moz-transform': 'rotateY(180deg)',
                'z-index': 0
            });
            $(elem).siblings().css({
                '-webkit-transform': 'rotateY(0deg)',
                '-moz-transform': 'rotateY(0deg)',
                'z-index': 1
            });
        });
    }

    function fetchMeaningAndFlip(word) {
        $('.add-word .loading').removeClass('hidden');
        getMeaning(word, function(meaning) {
            $('.add-word .loading').addClass('hidden');
            $('#meaning').val(meaning);
            flip($('.add-word .front-face'));
            $('#meaning').focus();
        });
    }

    function getMeaning(phrase, callback) {
        $.ajax({
            url: "http://glosbe.com/gapi/translate",
            crossDomain: true,
            dataType: "jsonp",
            data: {
                from: "eng",
                dest: "eng",
                format: "json",
                phrase: phrase,
                page: 1,
                pretty: true
            },
        }).done(function(data) {
            var meanings;
            if (data && data.result == "ok" && data.tuc) {
                meanings = _.pluck(data.tuc[0].meanings.slice(0,4), 'text').join('; ');
            } else {
                meanings = '';
            }
            callback(meanings);
        }).always(function() {
            callback('');
        });
    }


    function hideOtherContainers() {
        $('#game-wrapper').hide();
        $('#wrapper').show();
    }


    return DictionaryView;
});

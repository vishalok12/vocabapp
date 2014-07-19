define([
    'jquery',
    'backbone',
    'views/add_word/meaning_view',
    'templates'
], function ($, Backbone, MeaningView, JST) {
    'use strict';

    var AddWordView = Backbone.View.extend({
        el: '#add-word',

        template: JST['app/scripts/templates/add_word.ejs'],

        events: {
            'click .front-face': "checkAndFlip",
            'keypress #name': "flipBack",
            'click .back': "flipFront",
            'click #new-word-btn': "getParams",
            'click .new-meaning-btn': "createEmptyMeaningInput"
        },

        initialize: function() {
            this.render();
            this.$meaningList = this.$('#meaning-list');
            this.$synonyms = this.$('#synonyms');
        },

        render: function() {
            this.$el.html( this.template() );

            return this;
        },

        checkAndFlip: function(e) {
            var clickedElement = e.originalEvent.srcElement;
            var $input = $('#name');

            if ( $input.val().trim() === '' || clickedElement === $input[0] ) { return; }

            this.fetchMeaningAndFlip($input.val().trim());

            return false;
        },

        flipBack: function(e) {
            if ( e.keyCode === 13 ) {
                this.fetchMeaningAndFlip($('#name').val().trim());
            }
        },

        flipFront: function(e) {
            flip( $(e.currentTarget).parent() );

            $('#name').focus();

            return false;
        },

        getParams: function() {
            var wordName = $('#name').val().trim();
            var meaning = '';
            this.meaningViews.map(function(meaningView) {
                var value = meaningView.getValue().trim();
                if (value) {
                    meaning += value + ";";
                }
            });
            var synonyms = $('#synonyms').val()
                                         .replace(/\s+/g, '')
                                         .split(/,|;/)
                                         .filter(function(synonym) {
                                                return synonym !== '';
                                         });

            if (!wordName || !meaning) {
                return;
            }
            
            app.dictionaryView.collections.create({
                name: wordName,
                meaning: meaning,
                synonyms: synonyms
            });

            $('#name').val('');
            $('#meaning').val('');
            $('#synonyms').val('');

            flip( this.$('.back-face') );

            _gaq.push(['_trackEvent', 'word', 'create', wordName]);
        },

        fetchMeaningAndFlip: function(word) {
            this.$('.loading').removeClass('hidden');
            var $meaningList = this.$meaningList;
            var that = this;
            $meaningList.empty();

            getMeaning(word, function(meanings, synonyms) {
                var meaningView;

                that.meaningViews = [];
                that.$('.loading').addClass('hidden');
                if (meanings.length) {
                    meanings.map(function(meaning) {
                        that.createNewMeaningInput(meaning);
                    });
                    that.$('.meaning-list-cont').perfectScrollbar({
                        wheelSpeed: 20,
                        wheelPropagation: true,
                        suppressScrollX: true
                    });
                } else {
                    that.createEmptyMeaningInput();
                }
                if (synonyms) {
                    that.$synonyms.val(synonyms.join(','));
                }
                flip(that.$('.front-face'));
            });
        },

        removeFromMeaningList: function(meaningView) {
            this.meaningViews.splice(this.meaningViews.indexOf(meaningView), 1);
        },

        createNewMeaningInput: function(meaning) {
            meaning = meaning || '';
            var meaningView = new MeaningView({meaning: meaning});
            this.$meaningList.append(meaningView.el);
            meaningView.on("destroy", this.removeFromMeaningList, this);
            this.meaningViews.push(meaningView);

            return meaningView;
        },

        createEmptyMeaningInput: function() {
            var meaningView = this.createNewMeaningInput('');
            meaningView.editMeaning();
        }
    });

    function getMeaning(phrase, callback) {
        $.ajax({
            url: "/api/meaning",
            data: {
                phrase: phrase
            },
        }).done(function(data) {
            var meanings, synonyms;
            
            if (data && data.result == "ok" && data.tuc) {
                meanings = _.pluck(
                    _.flatten(
                        _.filter(
                            _.pluck(data.tuc, 'meanings'), function(m) { return m; }
                        )
                    ).slice(0,4),
                    'text'
                );
                synonyms = _.pluck(
                    _.flatten(
                        _.filter(
                            _.pluck(data.tuc, 'phrase'), function(p) { return p; }
                        )
                    ).slice(0,3),
                    'text'
                );
            } else {
                meanings = [];
                synonyms = [];
            }
            callback(meanings, synonyms);
        }).fail(function() {
            callback([], []);
        });
    }

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


    return AddWordView;
});

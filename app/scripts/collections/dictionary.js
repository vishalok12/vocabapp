/*global define*/

define([
    'backbone',
    'models/word'
], function (Backbone, wordModel) {
    'use strict';

    var DictionaryCollection = Backbone.Collection.extend({
        url: 'api/words',
        model: wordModel
    });

    return DictionaryCollection;
});

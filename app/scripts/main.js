/*global require*/
'use strict';

require.config({
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },

        'perfect-scrollbar': ['jquery']
    },
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        backbone: '../bower_components/backbone/backbone',
        underscore: '../bower_components/underscore/underscore',
        bootstrap: '../bower_components/sass-bootstrap/dist/js/bootstrap',
        'perfect-scrollbar': 'vendor/perfect-scrollbar'
    }
});

// var app = app || {};

require([
    'backbone', 'views/dictionary_view', 'views/search_view', 'routes/word'
], function (Backbone, DictionaryView, SearchView, WordRouter) {
    new WordRouter();

    Backbone.history.start();

    app.dictionaryView = new DictionaryView();

});

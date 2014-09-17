/*global require*/
'use strict';

require.config({
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },

        'perfect-scrollbar': ['jquery', 'jquery.mousewheel'],
        'jquery.mousewheel': ['jquery'],
        bootstrap_collapse: ['jquery'],
        bootstrap_dropdown: ['jquery']
    },
    paths: {
        jquery: '../bower_components/jquery/dist/jquery',
        backbone: '../bower_components/backbone/backbone',
        underscore: '../bower_components/underscore/underscore',
        bootstrap: '../bower_components/sass-bootstrap/dist/js/bootstrap',
        'perfect-scrollbar': 'vendor/perfect-scrollbar',
        'jquery.mousewheel': 'vendor/jquery.mousewheel',
        bootstrap_collapse: '../bower_components/sass-bootstrap/js/collapse',
        bootstrap_dropdown: '../bower_components/sass-bootstrap/js/dropdown',
        'localStorage': 'vendor/backbone.localStorage'
    }
});

// var app = app || {};

require([
    'backbone',
    'views/dictionary_view',
    'views/navbar_view',
    'routes/word',
    'views/add_word_view',
    'views/game_view',
    'views/edit_word_view',
    'views/notification_view'
], function (Backbone, DictionaryView, NavBarView, WordRouter, AddWordView, GameView, EditWordView, NotificationView) {
    new WordRouter();

    app.navBarView = new NavBarView();

    app.dictionaryView = new DictionaryView();

    app.addWordView = new AddWordView();

    app.editWordView = new EditWordView();

    app.notificationView = new NotificationView();

    app.GameView = GameView;

    Backbone.history.start();
});

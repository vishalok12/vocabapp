define([
	'jquery',
	'backbone',
	'templates',
	'bootstrap_collapse',
	'bootstrap_dropdown'
], function ($, Backbone, JST) {
	'use strict';

	var NavBarView = Backbone.View.extend({
		template: JST['app/scripts/templates/navbar.ejs'],

		events: {
			'click .menu:not(".dropdown")': "makeCurrent"
		},

		initialize: function() {
			this.render();
			this.$target = this.$el.find('#navbar-collapse-1');
		},

		render: function() {
			this.$el.html( this.template() );

			return this;
		},

		makeCurrent: function(e) {
			this.$el.find('.menu').removeClass('active');
			$(e.currentTarget).addClass('active');
			this.$target.collapse('hide');
			_gaq.push(['_trackEvent', 'Navigation', 'click', e.currentTarget.textContent]);
		},

		highlight: function(nav) {
			console.log(nav);
			this.$('.menu').removeClass('active');
			switch(nav) {
				case 'showUnRemembered':
					this.$('.unremembered').addClass('active');
					break;
				case 'showRemembered':
					this.$('.remembered').addClass('active');
					break;
				case 'showAll':
					this.$('.all').addClass('active');
					break;
				case 'addWord':
					this.$('.add-new-word').addClass('active');
					break;
				case 'playGame':
					this.$('#play .menu').addClass('active');
					break;
				default:
					this.$('.' + nav).addClass('active');
					break;
			}
		}

	});

	return NavBarView;
});

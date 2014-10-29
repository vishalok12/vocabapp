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
			'click .menu:not(".dropdown,.logout,.signup")': "makeCurrent"
		},

		initialize: function(options) {
			this.render(options.guest);
			this.$target = this.$el.find('#navbar-collapse-1');
		},

		render: function(isGuest) {
			this.$el.html( this.template({ guest: isGuest }) );

			return this;
		},

		makeCurrent: function(e) {

			e.preventDefault();
			this.$el.find('.menu').removeClass('active');
			$(e.currentTarget).addClass('active');
			this.$target.collapse('hide');
			app.trigger('nav', this.$(e.currentTarget).find('a').text());

			_gaq.push(['_trackEvent', 'Navigation', 'click', e.currentTarget.textContent]);
		},

		highlight: function(nav) {
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

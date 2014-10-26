define([
	'backbone'
], function (Backbone) {
	'use strict';

	var UserSettingModel = Backbone.Model.extend({
		url: 'api/user-setting',
		parse: function (response) {
			response.id = response._id;
			return response;
		}
	});

	return UserSettingModel;
});

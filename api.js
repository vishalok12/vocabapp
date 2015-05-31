"use strict";

var https = require('https');
var dbModels = require('./schema');
var WordModel = dbModels.WordModel;
var UserModel = dbModels.UserModel;
var UserSettingModel = dbModels.UserSettingModel;
var app;

module.exports.setup = function(expressApp) {
	app = expressApp;

	setupRoutes(app);
};

function setupRoutes(app) {
	app.all('/api/*', function(request, response, next) {
		if (request.isAuthenticated()) {
			next();
		} else {
			response.send(401, 'Unauthorized');
		}
	});

	//Get a list of all words
	app.get('/api/words', function(request, response, next) {
		var userId;

		userId = request.user._id;

		return getWordsForUser(userId, function(err, words) {
			if (err) {
				return next(err);
			} else {
				return response.send(words);
			}
		});
	});

	// TODO: Handle deleted words too,
	// currenly new words and updated words will be sent only!!
	app.get('/api/updated-words/:lastUpdated', function(request, response, next) {
		var userId;

		userId = request.user._id;

		lastUpdated = parseInt(request.params.lastUpdated, 10);
		console.log(new Date(lastUpdated));

		return WordModel.find({
				'userId': userId,
				'updated_at': {'$gte': new Date(lastUpdated)} },
				'name meaning synonyms remembered position updated_at', function(err, words) {
			if (err) {
				return next(err);
			} else {
				return response.send(words);
			}
		});
	});

	//Insert a new word
	app.post('/api/words', function( request, response, next ) {
		console.log('create word');
		var currentTime = Date.now();
		var word = new WordModel({
			name: request.body.name,
			meaning: request.body.meaning,
			remembered: request.body.remembered,
			userId: request.user._id,
			synonyms: request.body.synonyms.toString(),
			position: request.body.position,
			created_at: currentTime,
			updated_at: currentTime
		});
		word.save( function( err ) {
			if( !err ) {
				return console.log( 'word updated' );
			} else {
				return next( err );
			}
		});
		return response.send( word );
	});

	//Update a word
	app.put('/api/words/:id', function( request, response, next ) {
		console.log( 'Updating word ' + request.body.name );
		return WordModel.findById( request.params.id, function( err, word ) {
			word.name = request.body.name;
			word.meaning = request.body.meaning;
			word.remembered = request.body.remembered;
			word.position = request.body.position;
			word.updated_at = Date.now();

			return word.save( function( err ) {
				if( !err ) {
					console.log( 'word updated' );
				} else {
					next( err );
				}
				return response.send( word );
			});
		});
	});

	//Delete a word
	app.delete('/api/words/:id', function( request, response, next ) {
		console.log( 'Deleting word with id: ' + request.params.id );
		return WordModel.findById( request.params.id, function( err, word ) {
			return word.remove( function( err ) {
				if( !err ) {
					console.log( 'word removed' );
					return response.send( '' );
				} else {
					next( err );
				}
			});
		});
	});

	app.put('/api/user-setting', function(request, response, next) {
		console.log('updating user setting with id', request.body.id);
		var currentTime = Date.now();
		UserSettingModel.findById(request.body.id, function(error, userSetting) {
			if (error) {
				return next(error);
			}

			userSetting.sort_type = request.body.sort_type;

			userSetting.save( function(err) {
				if (err) {
					return next(err);
				}

				console.log( 'user settings updated' );

				return response.send(userSetting);
			});
		});
	});

	app.get('/api/meaning', function(request, response, next) {
		var phrase = request.query.phrase;

		var httpsReq = https.get(
			'https://glosbe.com/gapi/translate?from=eng&dest=eng&format=json&phrase=' +
			phrase + '&pretty=true',
			function(res) {
				var str = '';

				console.log('response for meaning came with status code', res.statusCode);
				if (res.statusCode === 200) {
					res.on('data', function(chunk){
						//do something with chunk
						str += chunk;
					});

					res.on("end", function() {
						response.send(JSON.parse(str));
					});
				} else {
					next(new Error('error while fetching meaning'));
				}
			}
		);

		httpsReq.on('error', function(e) {
			next(new Error('error while fetching meaning', e.message));
		});
	});
}

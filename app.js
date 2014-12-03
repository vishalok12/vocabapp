// Module dependencies.
require('newrelic');

var application_root = __dirname,
	appDirectory = process.env.NODE_ENV === 'production' ? 'dist' : 'app',
	express = require( 'express' ), //Web framework
	path = require( 'path' ), //Utilities for dealing with file paths
	mongoose = require( 'mongoose' ), //MongoDB integration
	https = require('https'),
	qs = require('querystring'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	morgan = require('morgan');

//Create server
var app = express();
var unittest = process.argv.indexOf("--unittest") > -1;

// Configure server
app.configure( function() {
	app.use(morgan('common'));
	//parses request body and populates request.body
	app.use( express.bodyParser() );

	//checks request.body for HTTP method overrides
	app.use( express.methodOverride() );

	app.use( express.cookieParser() );

	app.use(express.session({
		secret: process.env.SESSION_SECRET || '1234567890QWERTY',
		cookie: { maxAge: 60 * 60 * 24 * 30 * 6 }	// 6 months session
	}));
	app.use(passport.initialize());
	app.use(passport.session());

	//perform route lookup based on url and HTTP method
	app.use( app.router );

	if (app.get('env') === 'production') {
		app.set('views', __dirname + '/server-dist/templates');
	} else {
		app.set('views', __dirname + '/server/templates');
	}
	app.engine('html', require('ejs').renderFile);

	if(app.get('env') == "development") {
		if (unittest) {
			app.use( express.static( path.join( application_root, 'test') ) );
		}

		app.use( express.static( path.join( application_root, '.tmp') ) );
		app.use( express.static( path.join( application_root, 'app') ) );
	}

	if (app.get('env') == "production") {
		//Where to serve static content
		app.use( express.static( path.join( application_root, 'dist') ) );
	}

	app.use(function( request, response ) {
		// var currentDirPath = application_root + '/' + appDirectory;
		if (!request.isAuthenticated()) {
			if (request.url === '/') {
				return response.render('homepage.html');
			} else {
				response.redirect('/');
			}
		} else {
			console.log('user id', request.user._id);
			// get the word list
			getWordsForUser(request.user._id, function(error, words) {
				if (error) {
					return next(error);
				}

				getUserSettings(request.user._id, function(error, settings) {
					if (error) {
						// 500 error
						return next(error);
					} else {
						return response.render('index.html', {
							dictionaryWords: words,
							settings: settings,
							guest: request.user.is_guest
						});
					}
				});
			});
		}
	});

	if (app.get('env') == "development") {
		// for 404 errors
		app.use(function(request, response) {
			// check if request accepts html
			if (request.accepts('html')) {
				response.send(404, '404.html');
				return;
			}

			// respond with json

			if (request.accepts('json')) {
				response.send({ error: 'Not found' });
				return;
			}

			// default to plain-text
			response.type('text').send('Not found');
		});

		//Show all errors in development
		app.use( express.errorHandler({ dumpExceptions: true, showStack: true }));
	}

	if (app.get('env') == "production") {
		app.use(function(request, response) {
			response.send(404, '404.html');
			return;
		});

		app.use( express.errorHandler());
	}
});

passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	UserModel.findOne( {_id: id}, function(err, user) {
		done(err, user);
	});
});

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '1507910726123739';
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'secret-should-not-be-disclosed';
var WEBSITE_URL = (app.get('env') === "production") ? "www.wordtray.com" : "localhost:9000";


// TODO: Don't create new user for existing guest account (as done in normal signup)
passport.use(new FacebookStrategy({
		clientID: FACEBOOK_APP_ID,
		clientSecret: FACEBOOK_APP_SECRET,
		callbackURL: "http://" + WEBSITE_URL + "/auth/facebook/callback",
		scope: ['email']
	},
	function(accessToken, refreshToken, profile, done) {
		console.log('profile', profile);
		var data = profile._json;

		UserModel.findOne( {auth_id: data.id}, function(err, oldUser) {
			if (err) {
				next(err);
			} else {
				if (oldUser) {
					// user already exist!!

					console.log('User email already exists!!');
					return done(null, oldUser);
				}

				var currentTime = Date.now();
				var user = new UserModel({
					first_name: data.first_name,
					last_name: data.last_name,
					auth_id: data.id,
					email: data.email,
					created_at: currentTime,
					updated_at: currentTime
				});

				user.save(function( err, user ) {

					if( !err ) {
							afterSignup(user._id, function() {
								return done(null, user);
							});
					} else {
						next(err);
					}
				});
			}
		});
	}
));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', { successRedirect: '/',
																			failureRedirect: '/login' }));

passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log('username', username);
		console.log('password', password);

		if (!username || !password) {
			return done(null, false, { message: 'username and Password are compulsory' });
		}

		username = username.trim();
		password = password.trim();

		UserModel.findOne( {email: username, password: password}, function(err, user) {
			if (!err) {
				console.log('user', user);
				if (user) {
					return done(null, user);
				} else {
					return done(err, false, { message: 'Invalid password' });
				}
			} else {
				return done(null, false, { message: 'Unknown user ' + username });
			}
		});
	}
));

// Routes
app.all('/api/*', function(request, response, next) {
	if (request.isAuthenticated()) {
		next();
	} else {
		response.send(401, 'Unauthorized');
	}
});

app.get('/login', function(request, response) {
	if (request.isAuthenticated()) {
		return response.redirect('/');
	}

	response.render('signin.html');
});

app.get('/logout', function(request, response) {
	request.logout();
	response.redirect('/');
});

app.get('/signup', function(request, response) {
	console.log(request.user);
	if (request.user && !request.user.is_guest) {
		return response.redirect('/');
	}

	// render signup page
	response.render('signup.html');
});

// signup

/**
 * Create session for guest access
 * All words will be accessed through client storage
 * From next time, user will be re-directed to that page instead of signup page
 * @param  {[type]} request
 * @param  {[type]} response
 */
app.post('/signup/guest', function(request, response, next) {
	// check if user already exists

	var currentTime = new Date();
	var user = new UserModel({
		first_name: 'Guest',
		last_name: 'Guest',
		is_guest: true,
		created_at: currentTime,
		updated_at: currentTime
	});

	user.save(function( err, user ) {
		if( !err ) {
			console.log('New Guest User has been created!');
			request.login(user, function(error) {
				if (error) { return next(error); }

				afterSignup(user._id, function() {
					return response.redirect('/');
				});

				return;
			});

		} else {
			next(err);
		}
	});
});

app.post('/signup', function(request, response, next) {
	var email = request.body.signup_email.trim();
	var password = request.body.signup_password;
	var firstName = request.body.firstName.trim();
	var lastName = request.body.lastName.trim();

	// check if user has a session with guest account
	// and if there is, no need to create new account
	// just update existing account
	if (request.user) {
		// update user
		var user = request.user;
		user.email = email;
		user.password = password;
		user.first_name = firstName;
		user.last_name = lastName;
		user.updated_at = new Date();
		user.is_guest = false;	// no more guest user

		user.save();

		return response.redirect('/');
	}

	// check if user already exists
	UserModel.findOne( {email: email}, function(err, oldUser) {
		if (err) {
			next(err);
		} else {
			if (oldUser) {
				// user already exist!!

				console.log('User email already exists!!');
				return response.redirect('/');
			}

			var currentTime = new Date();
			var user = new UserModel({
				first_name: firstName,
				last_name: lastName,
				email: email,
				password: password,
				is_guest: false,
				created_at: currentTime,
				updated_at: currentTime
			});

			user.save(function( err, user ) {
				if( !err ) {
					console.log('New User ', email, ' has been created!');
					request.login(user, function(error) {
						if (error) { return next(error); }

						afterSignup(user._id, function() {
							return response.redirect('/');
						});

						return;
					});

				} else {
					next(err);
				}
			});
		}
	});
});

// signin
app.post('/session',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login'
	})
);

//Connect to database
var mongoUri = process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://localhost/vocab_database';
mongoose.connect( mongoUri );

//Schemas
var Word = new mongoose.Schema({
	name: String,
	meaning: String,
	synonyms: String,
	remembered: Boolean,
	userId: String,
	position: Number,
	created_at: Date,
	updated_at: Date
});

var User = new mongoose.Schema({
	first_name: String,
	last_name: String,
	auth_id: String,
	email: String,
	password: String,
	is_guest: Boolean,
	created_at: Date,
	updated_at: Date
});

var UserSetting = new mongoose.Schema({
	userId: String,
	sort_type: String,
	created_at: Date,
	updated_at: Date
});

//Models
var WordModel = mongoose.model( 'Word', Word );
var UserModel = mongoose.model( 'User', User );
var UserSettingModel = mongoose.model( 'UserSetting', UserSetting);

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

//Insert a new word
app.post('/api/words', function( request, response, next ) {
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

function afterSignup(userId, callback) {
	var currentTime = Date.now();

	// create a sample word
	var word = new WordModel({
		name: 'Sample',
		meaning: 'A sample word meaning!!;' +
			'Add new words in your list;' +
			'On Navigation Bar, Click "Add Word" to insert a new word',
		remembered: false,
		userId: userId,
		synonyms: '',
		position: 10000,
		created_at: currentTime,
		updated_at: currentTime
	});
	word.save( function( error ) {
		if( error ) {
			console.log( 'Error occurred in creating sample word' );
		} else {
			// add default user settings
			var userSetting = new UserSettingModel({
				userId: userId,
				sort_type: 'recent-on-top',
				created_at: currentTime,
				updated_at: currentTime
			});

			userSetting.save(function(err) {
				if (err) {
					console.log('Error occurred in creating default settings');
				} else if (typeof callback === "function") {
					callback();
				}
			});
		}
	});
}

function getWordsForUser(userId, callback) {
	WordModel.find({ 'userId': userId },
			'name meaning synonyms remembered position updated_at', function(err, words) {
		if( !err ) {
			return callback(null, words);
		} else {
			return callback(err);
		}
	});
}

function getUserSettings(userId, callback) {
	UserSettingModel.find({ 'userId': userId }, function(error, settings) {
		if (error) {
			return callback(error);
		} else {
			return callback(null, settings[0]);
		}
	});
}

//Start server
var port = process.env.PORT || 9000;

app.listen( port, function() {
	console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});


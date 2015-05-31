// Module dependencies.
require('newrelic');

var application_root = __dirname,
	appDirectory = process.env.NODE_ENV === 'production' ? 'dist' : 'app',
	express = require( 'express' ), //Web framework
	path = require( 'path' ), //Utilities for dealing with file paths
	qs = require('querystring'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	morgan = require('morgan'),
	cors = require('cors');

if (process.env.REDISTOGO_URL) {
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	var client = require("redis").createClient(rtg.port, rtg.hostname);

	client.auth(rtg.auth.split(":")[1]);
} else {
	var client = require("redis").createClient();
}
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

//Create server
var app = express();
var unittest = process.argv.indexOf("--unittest") > -1;

var dbModels = require('./schema');
var WordModel = dbModels.WordModel;
var UserModel = dbModels.UserModel;
var UserSettingModel = dbModels.UserSettingModel;

// Configure server
app.configure( function() {
	app.use(morgan('common'));

	//parses request body and populates request.body
	app.use( express.bodyParser() );

	//checks request.body for HTTP method overrides
	app.use( express.methodOverride() );

	app.use( express.cookieParser() );

	app.use(session({
		store: new RedisStore({
			client: client,
			host: 'localhost',
			port: 6379,
			ttl: 60 * 60 * 24 * 30 * 6 // 6 months session
		}),
		secret: process.env.SESSION_SECRET || '1234567890QWERTY'
		// cookie: { maxAge: 60 * 60 * 24 * 30 * 6 }	// 6 months session
	}));

	app.use(passport.initialize());
	app.use(passport.session());

	app.use(cors());

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

require('./api').setup(app);

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

module.exports = app;

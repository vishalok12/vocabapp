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

	app.use(express.session({secret: process.env.SESSION_SECRET || '1234567890QWERTY'}));
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
			// get the word list
			getWordsForUser(request.user._id, function(error, words) {
				if (error) {
					// 500 error
					return next(error);
				} else {
					return response.render('index.html', {
						dictionaryWords: words
					});
				}
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

passport.use(new LocalStrategy(
	function(username, password, done) {
		console.log('username', username);
		console.log('password', password);

		if (!username || !password) {
			return done(null, false, { message: 'username and Password are compulsory' });
		}

		username = username.trim();
		password = password.trim();

		UserModel.findOne( {email: username}, function(err, user) {
			if (!err) {
				if (user && user.password === password) {
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

// signup
app.post('/signup', function(request, response, next) {
	var email = request.body.email.trim();
	var password = request.body.password;
	var firstName = request.body.firstName.trim();
	var lastName = request.body.lastName.trim();

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

			var user = new UserModel({
				first_name: firstName,
				last_name: lastName,
				email: email,
				password: password
			});

			user.save(function( err, user ) {
				if( !err ) {
					console.log('New User ', email, ' has been created!');
					request.login(user, function(error) {
						if (error) { return next(error); }

						afterSignup(user._id);

						return response.redirect('/');
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
	userId: String
});

var User = new mongoose.Schema({
	first_name: String,
	last_name: String,
	email: String,
	password: String
});

//Models
var WordModel = mongoose.model( 'Word', Word );
var UserModel = mongoose.model( 'User', User );

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
	var word = new WordModel({
		name: request.body.name,
		meaning: request.body.meaning,
		remembered: request.body.remembered,
		userId: request.user._id,
		synonyms: request.body.synonyms.toString()
	});
	word.save( function( err ) {
		if( !err ) {
			return console.log( 'created' );
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

app.get('/api/meaning', function(request, response, next) {
	var phrase = request.query.phrase;

	console.log('Getting meaning for phrase:', phrase);

	https.get(
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
});

function afterSignup(userId) {
	// create a sample word
	var word = new WordModel({
		name: 'Sample',
		meaning: 'A sample word meaning!!;' +
			'Add new words in your list;' +
			'On Navigation Bar, Click "Add Word" to insert a new word',
		remembered: false,
		userId: userId,
		synonyms: ''
	});
	word.save( function( error ) {
		if( error ) {
			console.log( 'Error occurred in creating sample word' );
		}
	});
}

function getWordsForUser(userId, callback) {
	WordModel.find({ 'userId': userId },
			'name meaning synonyms remembered', function(err, words) {
		if( !err ) {
			return callback(null, words);
		} else {
			return callback(err);
		}
	});
}

//Start server
var port = process.env.PORT || 9000;

app.listen( port, function() {
	console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});


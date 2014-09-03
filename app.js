// Module dependencies.
var application_root = __dirname,
	express = require( 'express' ), //Web framework
	path = require( 'path' ), //Utilities for dealing with file paths
	mongoose = require( 'mongoose' ), //MongoDB integration
	dispatcher = require('./server/lib/dispatcher.js'), //require custom dispatcher
	http = require('http'),
	qs = require('querystring');

//Create server
var app = express();
var unittest = process.argv.indexOf("--unittest") > -1;

// Configure server
app.configure( function() {
	//parses request body and populates request.body
	app.use( express.bodyParser() );

	//checks request.body for HTTP method overrides
	app.use( express.methodOverride() );

	app.use( express.cookieParser() );

	app.use(express.session({secret: '1234567890QWERTY'}));

	//perform route lookup based on url and HTTP method
	app.use( app.router );

	// app.set('views', __dirname + '/views');
	app.engine('html', require('ejs').renderFile);

	if(app.get('env') == "development") {
		app.use( express.static( path.join( application_root, '.tmp') ) );

		if (unittest) {
			app.use( express.static( path.join( application_root, 'test') ) );
		}
	}


	if (app.get('env') == "development") {
		//Where to serve static content
		app.use( express.static( path.join( application_root, 'app') ) );

		// for 404 errors
		app.use(function(request, response) {
			// check if request accepts html
			if (request.accepts('html')) {
				response.send(404, application_root + '/app/404.html');
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
		//Where to serve static content
		app.use( express.static( path.join( application_root, 'dist') ) );

		app.use(function(request, response) {
			response.render(application_root + '/dist/404.html');
		});

		app.use( express.errorHandler());
	}
});

// Routes
app.get( '/', function( request, response ) {
	//dispatch our request
	dispatcher.dispatch(request, response);
});

app.get('/login', function(request, response) {
	var dir;
	if (process.env.NODE_ENV === 'production') {
		dir = 'dist';
	} else {
		dir = 'app';
	}

	response.render(application_root + '/' + dir + '/signin.html');
});

app.get('/logout', function(request, response) {
	response.cookie('userid', null, { maxAge: -1 });

	response.redirect('/');
});

// signup
app.post('/signup', function(request, response) {
	request.session.userId = '';
	var user = new UserModel({
		first_name: request.body.firstName,
		last_name: request.body.lastName,
		email: request.body.email,
		password: request.body.password
	});
	user.save( function( err, user ) {
		if( !err ) {
			response.cookie('userid', user._id, { maxAge: 5 * 24 * 60 * 60 * 1000 });
			request.session.userId = user._id;
			response.redirect('/');

			// create a sample word
			var word = new WordModel({
				name: 'Sample',
				meaning: 'A sample word meaning!!;' +
					'Add new words in your list;' +
					'On Navigation Bar, Click "Add Word" to insert a new word',
				remembered: false,
				userId: user._id,
				synonyms: ''
			});
			word.save( function( error ) {
				if( !error ) {
					return console.log( 'created a sample word!!!' );
				} else {
					return console.log( error );
				}
			});

			return console.log( 'created' );
		} else {
			return console.log( err );
		}
	});
});

// signin
app.post('/session', function(request, response) {
	var email = request.body.userName;
	var password = request.body.password;
	console.log('email: ' + email);
	console.log('password: ' + password);

	if (!email || !password) {
		console.log('some values not filled!!');
		response.redirect('/');
	} else {
		email = email.trim();
		password = password.trim();
	}

	UserModel.findOne( {email: email}, function(err, userDetails) {
		console.log(err);
		console.log(userDetails);
		if( !err ) {
			if (userDetails && userDetails.password === password) {
				console.log('matched');
				response.cookie('userid', userDetails._id, { maxAge: 5 * 24 * 60 * 60 * 1000 });
				request.session.userId = userDetails._id;
				response.redirect('/');
			} else {
				console.log('unmatched');

				response.redirect('/');
			}
		} else {
			return console.log( err );
		}
	});
});

// api signin
app.post('/api/session', function(request, response) {
	var email = request.body.userName;
	var password = request.body.password;

	UserModel.findOne( {email: email}, function(err, userDetails) {
		console.log(userDetails);
		if( !err ) {
			if (userDetails.password === password) {
				response.set({'Content-Type': 'application/json'});
				// response.send(callback + "({userId: \"" + userDetails._id + "\"})");
				response.send({userId: userDetails._id});
			} else {
				console.log('unmatched');
				response.status(404).send({error: 'not found'});
			}
		} else {
			return console.log( err );
		}
	});
});

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
app.get( '/api/words', function( request, response ) {
	console.log('session: ' + JSON.stringify(request.session));
	console.log('sessionId: ' + request.session.userId);
	var userId;

	if (request.session && request.session.userId) {
		userId = request.session.userId;
	} else if (request.query.userId) {
		userId = request.query.userId;
	} else {
		console.log("user id is missing!");
	}

	return WordModel.find( { 'userId': request.session.userId }, 'name meaning synonyms remembered', function( err, words ) {
		if( !err ) {
			return response.send( words );
		} else {
			return console.log( err );
		}
	});
});

//Insert a new word
app.post( '/api/words', function( request, response ) {
	var word = new WordModel({
		name: request.body.name,
		meaning: request.body.meaning,
		remembered: request.body.remembered,
		userId: request.session.userId,
		synonyms: request.body.synonyms.toString()
	});
	word.save( function( err ) {
		if( !err ) {
			return console.log( 'created' );
		} else {
			return console.log( err );
		}
	});
	return response.send( word );
});

//Update a word
app.put( '/api/words/:id', function( request, response ) {
	console.log( 'Updating word ' + request.body.name );
	return WordModel.findById( request.params.id, function( err, word ) {
		word.name = request.body.name;
		word.meaning = request.body.meaning;
		word.remembered = request.body.remembered;

		return word.save( function( err ) {
			if( !err ) {
				console.log( 'word updated' );
			} else {
				console.log( err );
			}
			return response.send( word );
		});
	});
});

//Delete a word
app.delete( '/api/words/:id', function( request, response ) {
	console.log( 'Deleting word with id: ' + request.params.id );
	return WordModel.findById( request.params.id, function( err, word ) {
		return word.remove( function( err ) {
			if( !err ) {
				console.log( 'word removed' );
				return response.send( '' );
			} else {
				console.log( err );
			}
		});
	});
});

app.get('/api/meaning', function(request, response, next) {
	var phrase = request.query.phrase;

	http.get(
		'http://glosbe.com/gapi/translate?from=eng&dest=eng&format=json&phrase=' +
		phrase + '&pretty=true',
		function(res) {
			var str = '';
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

	// req.on('error', function(e) {
	//   console.log('problem with request: ' + e.message);
	// });

	// // write data to request body
	// req.write(data);
	// req.end();
});

//Start server
var port = process.env.PORT || 9000;

app.listen( port, function() {
	console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});


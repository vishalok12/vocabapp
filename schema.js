var mongoose = require('mongoose'); //MongoDB integration

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
module.exports = {
	WordModel: mongoose.model( 'Word', Word ),
	UserModel: mongoose.model( 'User', User ),
	UserSettingModel: mongoose.model( 'UserSetting', UserSetting)
};

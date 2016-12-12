// Creating the blueprint for our 'User' model.

var mongoose = require('mongoose');
// Crypto is a native node module for hashing passwords.
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
    username: {type: String, lowercase: true, unique: true},
    hash: String,
    salt: String
});

// Hashes and sets password of user.
UserSchema.model.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

// Hashes inputted password and checks to see if it matches the hash stored in the user object.
UserSchema.model.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

    return this.hash === hash;
};

// Generates a JSON Web Token. Used for authentication and to define user 'status' (i.e their privileges).
UserSchema.methods.generateJWT = function() {
    // Sets expiration date to 60 days.
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        _id: this._id,
        username: this.username,
        exp: parseInt(exp.getTime() / 1000)
    }, 'SECRET');
};

mongoose.model('User', UserSchema);

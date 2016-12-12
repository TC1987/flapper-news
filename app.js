// Framework for simplifying our backend and allowing us to use an MVC architecture for organizing our code.
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var passport = require('passport');

// Mongoose models.
require('./models/Posts');
require('./models/Comments');
require('./models/Users');

require('./config/passport');

// To connect our app to our local Mongo database.
mongoose.connect('mongodb://localhost/news');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// Set up out view engine to Embedded Javascript.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

// Gotta read our data somehow. Used for pulling information from our forms.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Defines where our static files will live.
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// Route paths which have been moved to a separate file for modularity.
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

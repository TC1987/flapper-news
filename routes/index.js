var express = require('express');
// In this file we're actually not using whatever is returned from express after invoking it (which we've been storing in a variable
// called 'app'). We're simply using express.Router to define routes for a specific path. This method allows us to modularize our routes in app.js.
var router = express.Router();

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

var passport = require('passport');
var jwt = require('express-jwt');

// Middleware used for authenticating JWTokens.
var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });

router.get('/posts', function(req, res, next) {
    console.log(next);
    Post.find(function(err, posts) {
        if (err) {
            return next(err);
        }

        res.json(posts);
    })
})

// By adding our variable 'auth', we're requiring that the user be authenticated before
// trying to create a new post.
router.post('/posts', auth, function(req, res, next) {
    var post = new Post(req.body);
    post.author = req.payload.username;

    post.save(function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    })
})

// Super cool function that allows you to load a specific post by inspecting whether
// the route path has a 'post' parameter.
// Although not necessary, keeps our code DRY.
router.param('post', function(req, res, next, id) {
    var query = Post.findById(id);

    query.exec(function(err, post) {
        if (err) {
            return next(err);
        };

        if (!post) {
            return next(new Error('can\'t find post'));
        }

        req.post = post;
        return next();
    })
})

// Note that all of these paths that have the parameter :post, the post actually gets
// retrieved from our router.param('post') path.

// To get a specific post and its comments.
router.get('/posts/:post', function(req, res) {
    req.post.populate('comments', function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    })
})

// To upvote a post.
router.put('/posts/:post/upvote', auth, function(req, res, next) {
    req.post.upvote(function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    })
})

// To add a new comment to a post.
router.post('/posts/:post/comments', auth, function(req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author = req.payload.username;

    comment.save(function(err, comment) {
        if (err) {
            return next(err);
        }

        req.post.comments.push(comment);
        req.post.save(function(err, post) {
            if (err) {
                return next(err);
            }

            res.json(comment);
        })
    })
});

// Same as above for :post params, checks to see if :comment is passed as a parameter and if it
// is, retrieves that comment for the paths below.
router.param('comment', function(req, res, next, id) {
    var query = Comment.findById(id);

    query.exec(function(err, comment) {
        if (err) {
            return next(err);
        };

        if (!comment) {
            return next(new Error('can\'t find comment'));
        }

        req.comment = comment;
        return next();
    })
})

// To upvote a comment.
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
    req.comment.upvote(function(err, comment) {
        if (err) {
            return next(err);
        }

        res.json(comment);
    })
})

router.post('/register', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'Please fill out all fields.' });
    };

    var user = new User();

    user.username = req.body.username;
    // Calls the setPassword method on UserSchema that will set the salt and hash
    // properties on the user object.
    user.setPassword(req.body.password);

    user.save(function(err) {
        if (err) {
            return next(err);
        };

        return res.json({ token: user.generateJWT() });
    });
});

router.post('/login', function(req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'Please fill out all fields.' });
    };

    // Uses LocalStrategy that was defined to validate user.
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        };

        if (user) {
            return res.json({ token: user.generateJWT() });
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

module.exports = router;

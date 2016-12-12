var express = require('express');
// In this file we're actually not using whatever is returned from express after invoking it (which we've been storing in a variable
// called 'app'). We're simply using express.Router to define routes for a specific path. This method allows us to modularize our routes in app.js.
var router = express.Router();

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

router.get('/posts', function(req, res, next) {
    console.log(next);
    Post.find(function(err, posts) {
        if (err) {
            return next(err);
        }

        res.json(posts);
    })
})

router.post('/posts', function(req, res, next) {
    var post = new Post(req.body);

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
router.put('/posts/:post/upvote', function(req, res, next) {
    req.post.upvote(function(err, post) {
        if (err) {
            return next(err);
        }

        res.json(post);
    })
})

// To add a new comment to a post.
router.post('/posts/:post/comments', function(req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;

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
router.put('/posts/:post/comments/:comment/upvote', function(req, res, next) {
    req.comment.upvote(function(err, comment) {
        if (err) {
            return next(err);
        }

        res.json(comment);
    })
})

module.exports = router;

var app = angular.module('flapperNews', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider', function($state, $url) {
    $state
        .state('home', {
            url: '/home',
            templateUrl: '/home.html',
            controller: 'MainCtrl',
            // Resolve just makes sure to execute the included functions when
            // the current state is entered (in this case, '/home').
            resolve: {
                allPosts: ['posts', function(posts) {
                    return posts.getAll();
                }]
            }
        })
        .state('posts', {
            url: '/posts/:id',
            templateUrl: '/posts.html',
            controller: 'PostsCtrl',
            resolve: {
                // Dependency injection. Injecting $stateParams and posts service.
                // The state only finishes loading after the post with comments has
                // been returned i.e this is not asynchronous.
                post: ['$stateParams', 'posts', function($stateParams, posts) {
                    return posts.get($stateParams.id);
                }]
            }
        });

    // Default state if url does not match.
    $url.otherwise('home');
}
]);

app.controller('MainCtrl', ['$scope', 'posts', function($scope, posts) {
    // Posts get to the home page through the posts service being injected into
    // this controller.
    $scope.posts = posts.posts;

    $scope.addPost = function() {
        if (!$scope.title || $scope.title === '') {
            return;
        };

        // Creates post. Remember that 'posts' is a service that is
        // injected into 'MainCtrl'.
        posts.create({
            title: $scope.title,
            link: $scope.link
        });

        // Reset input fields.
        $scope.title = '';
        $scope.link = '';

        // Was being used in the beginning of the project just to add posts
        // into an array. Mainly testing purposes.
        // $scope.posts.push({
        //     title: $scope.title,
        //     link: $scope.link,
        //     upvotes: 0,
        //     comments: [
        //         {author: 'Joe', body: 'Cool post!', upvotes: 0},
        //         {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
        //     ]
        // });
        // $scope.title = '';
        // $scope.link = '';
    };

    $scope.incrementUpvotes = function(post) {
        posts.upvote(post);
    };
}]);

app.controller('PostsCtrl', ['$scope', '$stateParams', 'posts', 'post', function($scope, $stateParams, posts, post) {
    $scope.post = post;

    $scope.addComment = function() {
        if ($scope.body === '') {
            return;
        };

        posts.addComment(post._id, {
            body: $scope.body,
            author: 'user'
        }).success(function(comment) {
            $scope.post.comments.push(comment);
        });

        $scope.body = '';

        $scope.incrementUpvotes = function(comment) {
            posts.upvoteComment(post, comment);
        }
    }
}]);

app.factory('posts', ['$http', function($http) {
    var o = {
        posts: []
    };

    // Gets all posts from DB.
    o.getAll = function() {
        return $http.get('/posts').success(function(data) {
            console.log(data);
            angular.copy(data, o.posts);
            // angular.copy "deep copies" an object (first parameter) and stores
            // it inside the second parameter (if provided, else you would be
            // instantiating a variable to angular.copy). What angular.copy does is
            // creates a new object independent of the object being copied so that if
            // a property changes in either of the two objects, the other will not be
            // affected.
        });
    };

    // Creates a new post.
    o.create = function(post) {
        // Second argument in the .post method is the new post we're adding to the database.
        return $http.post('/posts', post).success(function(data) {
            o.posts.push(data);
        });
    };

    o.upvote = function(post) {
        return $http.put('/posts/' + post._id + '/upvote').success(function(data) {
            console.log(post);
            post.upvotes += 1;
        });
    };

    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res) {
            return res.data;
        })
    };

    o.addComment = function(id, comment) {
        return $http.post('/posts/' + id + '/comments', comment);
    };

    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').success(function(data) {
            comment.upvotes += 1;
        });
    };

    return o;
}]);

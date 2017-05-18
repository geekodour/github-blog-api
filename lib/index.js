'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var API_URL = "https://api.github.com";

var blog = function () {
    // this `blog` will have all the needed methods related
    // to the github api and a typical text blog
    function blog(options) {
        var _this = this;

        _classCallCheck(this, blog);

        this.settings = Object.assign({
            author: {},
            repo: '',
            blogUrl: API_URL + '/repos/' + options.author + '/' + options.repo + '/issues'
        }, options);

        // fetch author information on init
        (0, _isomorphicFetch2.default)(API_URL + '/users/' + options.author).then(function (response) {
            if (response.status != 200) {
                console.log("something bad happned");
            }
            return response.json();
        }).then(function (author) {
            _this.settings.author = { name: author.name };
        }).catch(function (e) {
            console.log(e);
        });
    }

    _createClass(blog, [{
        key: 'getBlogAuthor',
        value: function getBlogAuthor() {
            return this.settings.author;
        }
    }, {
        key: 'fetchBlogPosts',
        value: function fetchBlogPosts() {
            // usage: app.getBlogPosts().then(posts=>console.log(posts))
            return (0, _isomorphicFetch2.default)(this.settings.blogUrl).then(function (response) {
                if (response.status != 200) {
                    console.log("something bad happned");
                }
                return response.json();
            }).then(function (posts) {
                return posts.map(function (post) {
                    return {
                        body: post.body,
                        id: post.number,
                        title: post.title,
                        date: post.created_at
                    };
                });
            }).catch(function (e) {
                console.log(e);
            });
        }
    }, {
        key: 'fetchBlogPost',
        value: function fetchBlogPost(postId) {
            return (0, _isomorphicFetch2.default)(this.settings.blogUrl + ('/' + postId)).then(function (response) {
                if (response.status != 200) {
                    console.log("something bad happned");
                }
                return response.json();
            }).then(function (post) {
                return {
                    title: post.title,
                    id: post.number,
                    labels: post.labels,
                    comments: post.comments,
                    date: post.created_at,
                    body: post.body
                };
            }).catch(function (e) {
                console.log(e);
            });
        }
    }, {
        key: 'fetchBlogPostComments',
        value: function fetchBlogPostComments(postId) {
            return (0, _isomorphicFetch2.default)(this.settings.blogUrl + ('/' + postId + '/comments')).then(function (response) {
                if (response.status != 200) {
                    console.log("something bad happned");
                }
                return response.json();
            }).then(function (post) {
                return post;
            }).catch(function (e) {
                console.log(e);
            });
        }
    }]);

    return blog;
}();

module.exports = function (opts) {
    return new blog(opts);
};
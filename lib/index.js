'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

var _parseLinkHeader = require('parse-link-header');

var _parseLinkHeader2 = _interopRequireDefault(_parseLinkHeader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var API_URL = "https://api.github.com";

var blog = function () {

  // blog({username:'myusername',repo:'myreponame'})

  function blog(options) {
    _classCallCheck(this, blog);

    if (!(options.username && options.repo)) {
      throw "Need username and repo to create blog. Please provide.";
    }
    this.settings = {
      username: options.username || '',
      repo: options.repo || '',
      posts: {
        per_page: 10,
        cur_page: 1,
        last_reached: false,
        next_page_url: ''
      },
      comments: {
        per_page: 10,
        cur_page: 1,
        last_reached: false,
        next_page_url: ''
      },
      blogUrl: API_URL + '/repos/' + options.username + '/' + options.repo + '/issues'
    };
  }

  _createClass(blog, [{
    key: 'setPost',
    value: function setPost(postObj) {
      this.settings.posts = Object.assign(this.settings.posts, postObj);
    }
  }, {
    key: 'fetchBlogPosts',
    value: function fetchBlogPosts() {
      var _this = this;

      var fetchUrl = this.settings.posts.next_page_url || this.settings.blogUrl + '?per_page=' + this.settings.posts.per_page + '&page=' + this.settings.posts.cur_page + '&creator=' + this.settings.username;

      return (0, _isomorphicFetch2.default)(fetchUrl).then(function (response) {
        if (response.status != 200) {
          throw 'API did not respond properly';
        }
        // NOTE: maybe Object.assign the pageHeader object to posts object
        var pageHeader = (0, _parseLinkHeader2.default)(response.headers._headers.link[0]);
        if (pageHeader.last) {
          _this.settings.posts.cur_page = pageHeader.next.page;
          _this.settings.posts.next_page_url = pageHeader.next.url;
        } else {
          _this.settings.posts.last_reached = true;
          return [];
          // after the last_reached is set to true, `fetchBlogPosts` will be returning
          // the last request, stop calling `fetchBlogPosts` by checking last_reached
          // from external block
        }
        return response.json();
      }).then(function (posts) {
        /*if(this.settings.posts.last_reached){
          return [];
        }*/
        return posts.map(function (post) {
          return {
            body: post.body,
            html: (0, _marked2.default)(post.body),
            id: post.number,
            title: post.title,
            date: post.created_at,
            labels: post.labels,
            comments_no: post.comments
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
          body: post.body,
          html: (0, _marked2.default)(post.body)
        };
      }).then(function (e) {
        return e;
      }).catch(function (e) {
        console.log(e);
      });
    }
  }, {
    key: 'fetchBlogPostComments',
    value: function fetchBlogPostComments(postId) {
      var fetchUrl = this.settings.comments.next_page_url || this.settings.blogUrl + '/' + postId + '/comments?per_page=' + this.settings.posts.per_page + '&page=' + this.settings.posts.cur_page;
      return (0, _isomorphicFetch2.default)(fetchUrl).then(function (response) {
        if (response.status != 200) {
          console.log(response.headers);

          console.log("something bad happned");
        }
        return response.json();
      }).then(function (comments) {
        return comments.map(function (comment) {
          return {
            id: comment.id,
            user: {
              username: comment.user.login,
              avatar_url: comment.user.avatar_url
            },
            body: comment.body,
            created_at: comment.created_at,
            html: (0, _marked2.default)(comment.body)
          };
        });
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
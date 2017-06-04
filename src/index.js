import fetch from 'isomorphic-fetch';
import marked from 'marked';
import linkHeaderParse from 'parse-link-header';

const API_URL = 'https://api.github.com';

/*
The methods and properties inside the blog object are as follows:
* `blog.settings` : this is the state container of the blog
* `setPost` and `setComment` : to update the `posts` and `comments` objects inside `blog.settings`
* `fetchAllLabels` : fetch all labels in the blog - does not contain the issue count **[Need help]**
* `fetchBlogPosts` : fetches blog posts based on the `posts` object, takes `labels[]` as argument
* `fetchBlogPost` : fetches a single blog post, takes `issueId/postId` as argument
* `fetchBlogPostComments` : fetches comments based on the `comments` object, takes `issueId/postId` as argument

## Note on `fetchBlogPosts` usage:
If `fetchBlogPosts` does not return all results in one page/response, repeated calls to `fetchBlogPosts` will be returning
next results, once all results are done `blog.settings.posts.last_reached` will be set to `true` and an empty[] will
be resolved by the promise.
library user should manually update `blog.settings.posts.last_reached` to `false` with `setPost({last_reached:false, next_page_url:''})`
if `fetchBlogPosts` has to be called again after once being called completely.

The same idea applies for `fetchBlogPostComments`. please see code to know how it is implemented.
it does not have a `last_reached` so, just specifying other `postId` is enough.
*/

class Blog {

        // Blog({username:'myusername',repo:'myreponame',author:'myusername'})

        constructor(options) {
          if (!(options.username && options.repo && options.author)) {
              throw new TypeError('Provide a username and repository to create a blog');
          }
          this.settings = {
                username: options.username || '',
                repo: options.repo || '',
                author: options.author || '',
                posts: {
                  per_page: 10,
                  last_reached: false,
                  next_page_url: ''
                },
                comments: {
                  per_page: 10,
                  cur_post: null,
                  done_posts: [],
                  next_page_url: ''
                },
                repoUrl: `${API_URL}/repos/${options.username}/${options.repo}`,
                blogUrl: `${API_URL}/repos/${options.username}/${options.repo}/issues`
          };
        }

        setPost(postObj) {
                this.settings.posts = Object.assign(this.settings.posts, postObj);
        }
        setComment(commentObj) {
                this.settings.comments = Object.assign(this.settings.comments, commentObj);
        }

        fetchAllLabels() {
          return fetch(`${this.settings.repoUrl}/labels?per_page=90`)
              .then(response => {
                  if (response.status !== 200) {
                          return Promise.reject(new Error('api responded unexpectedly'));
                  }
                  return response.json();
              })
              .then(labels => {
                      return labels.map(label => {
                                  return {
                                  id: label.id,
                                  name: label.name,
                                  color: label.color
                                  };
                      });
              })
              .catch(err => {
                     if (err) {
                        err = err.message;
                     }
                     throw err;
              });
        }

        fetchBlogPosts(labels = []) {
          // need a cleaner and DRY way to write this function
          // it still works
          if (this.settings.posts.last_reached) {
                  return Promise.resolve([]);
          }
          let fetchUrl =
                this.settings.posts.next_page_url || `${this.settings.blogUrl}?per_page=${this.settings.posts.per_page}&page=1&creator=${this.settings.author}&labels=${labels.join(',')}`;

          return fetch(fetchUrl)
              .then(response => {
                  if (response.status !== 200) {
                          return Promise.reject(new Error('api responded unexpectedly'));
                  }

                  if (response.headers.has('link')) {
                    // responses having a 'link' header
                    let pageHeader = linkHeaderParse(response.headers.get('link'));

                    //if (pageHeader.hasOwnProperty('next')) {
                    if (Object.prototype.hasOwnProperty.call(pageHeader, 'next')) {
                        this.settings.posts.next_page_url = pageHeader.next.url;
                    } else {
                        // response not having 'next' in 'link' header(last page
                        this.settings.posts.next_page_url = '';
                        this.settings.posts.last_reached = true;
                    }
                  } else {
                    // responses which have all posts in one page
                    this.settings.posts.next_page_url = '';
                    this.settings.posts.last_reached = true;
                  }

                  return response.json();
              })
              .then(posts => {
                      return posts.map(post => {
                                  return {
                                  body: post.body,
                                  html: marked(post.body),
                                  id: post.number,
                                  title: post.title,
                                  date: post.created_at,
                                  labels: post.labels,
                                  comments_no: post.comments
                                  };
                      });
              })
              .catch(err => {
                if (err) {
                    err = err.message;
                }
                throw err;
              });
        }

        fetchBlogPost(postId) {
          return fetch(this.settings.blogUrl + `/${postId}`)
              .then(response => {
                  if (response.status !== 200) {
                          return Promise.reject(new Error('api responded unexpectedly'));
                  }
                  return response.json();
              })
              .then(post => {
                 return {
                         title: post.title,
                         id: post.number,
                         labels: post.labels,
                         comments: post.comments,
                         date: post.created_at,
                         body: post.body,
                         html: marked(post.body)
                        };
              })
              .catch(err => {
                if (err) {
                    err = err.message;
                }
                throw err;
              });
        }

        fetchBlogPostComments(postId) {
            // if `comments.done_posts` has the postId, no need to fetch
            if (this.settings.comments.done_posts.indexOf(postId) !== -1) {
                return Promise.resolve([]);
            }
            // manually set comments.next_page_url to an empty string
            // // // so that fetchUrl starts from page 1
            else if (postId !== this.settings.comments.cur_post) {
                this.settings.comments.next_page_url = '';
            }

          // update comments.cur_post to postId
          this.settings.comments.cur_post = postId;

          let fetchUrl =
                  this.settings.comments.next_page_url || `${this.settings.blogUrl}/${postId}/comments?per_page=${this.settings.comments.per_page}&page=1`;

          return fetch(fetchUrl)
              .then(response => {
                  if (response.status !== 200) {
                          return Promise.reject(new Error('api responded unexpectedly'));
                  }

                  if (response.headers.has('link')) {
                    // responses having a 'link' header
                    let pageHeader = linkHeaderParse(response.headers.get('link'));

                    //if (pageHeader.hasOwnProperty('next')) {
                    if (Object.prototype.hasOwnProperty.call(pageHeader, 'next')) {
                        this.settings.comments.next_page_url = pageHeader.next.url;
                    }
                    else {
                        // response not having 'next' in 'link' header(last page)
                        this.settings.comments.next_page_url = '';
                        this.settings.comments.done_posts = [...this.settings.comments.done_posts, postId];
                    }
                  }
                  else {
                    // responses which have all comments in one page
                    this.settings.comments.next_page_url = '';
                    this.settings.comments.done_posts = [...this.settings.comments.done_posts, postId];
                  }

                  return response.json();
              })
              .then(comments => {
                      return comments.map(comment => {
                        return {
                          id: comment.id,
                          user: {
                                  username: comment.user.login,
                                  avatar_url: comment.user.avatar_url
                          },
                          body: comment.body,
                          created_at: comment.created_at,
                          html: marked(comment.body)
                        };
                      });
              })
              .catch(err => {
                if (err) {
                    err = err.message;
                }
                throw err;
              });
        }

        createPost(postObj, PERSONAL_ACCESS_TOKEN) {
                if (!(postObj && PERSONAL_ACCESS_TOKEN)) {
                    throw new TypeError('Provide PostObject and AUTH_TOKEN to create posts');
                }

                // I am keeping it to gitpushblog repo untill API is done
                // don't want to post issues to other repos as of now
                // when developing
                return fetch(`${API_URL}/repos/geekodour/gitpushblog/issues`, {
                           method: 'post',
                           headers: new Headers({
                               'Content-Type': 'application/json',
                               'Authorization': 'Basic ' + PERSONAL_ACCESS_TOKEN
                           }),
                           body: JSON.stringify(postObj)
                        })
                        .then(response => response.json())
                        .then(response => response)
                        .catch(err => {
                            if (err) {
                                err = err.message;
                            }
                            throw err;
                        });
        }
}

module.exports = opts => {
	return new Blog(opts);
};

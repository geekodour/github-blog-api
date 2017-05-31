import fetch from 'isomorphic-fetch';
import marked from 'marked';
import linkHeaderParse from 'parse-link-header';

const API_URL = "https://api.github.com";

/*
 * The methods and properties inside the blog object are as follows:
 * 1. settings: this is the state container of the blog
 * 2. setPost and setComment: to update the posts and comments objects inside settings
 * 3. fetchAllLabels: fetch all labels in the blog - does not contain count [need help]
 * 4. fetchBlogPosts: fetches blog posts based on the posts object, takes labels[] as argument
 * 5. fetchBlogPost: fetches a single blog post, takes issueId/postId as argument
 * 6. fetchBlogPostComments: fetches comments based on the comments object, takes issueId/postId as argument
 *
 * Note on `fetchBlogPosts` usage:
 * ------------------------------
 * If `fetchBlogPosts` does not return all results in one page/response, repeated calls to `fetchBlogPosts` will be returning
 * next results, once all results are done `blog.settings.posts.last_reached` will be set to `true` and an empty[] will
 * be returned by the promise.
 * library user should manually update `blog.settings.posts.last_reached` to false with setPost({last_reached:false})
 * if `fetchBlogPosts` has to be called again after once being called completely.
 *
 * The same idea applies for `fetchBlogPostComments`. please see code to know how it is implemented.
 * it does not have a `last_reached` so, just specifying other `postId` is enough.
 * */

class blog {

        // blog({username:'myusername',repo:'myreponame'})

        constructor(options) {
          if(!(options.username && options.repo)){
              throw "Need username and repo to create blog. Please provide.";
          }
          this.settings = {
                username: options.username || '',
                repo: options.repo || '',
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

        setPost(postObj){
                this.settings.posts = Object.assign(this.settings.posts,postObj);
        }
        setComment(commentObj){
                this.settings.comments = Object.assign(this.settings.comments,commentObj);
        }

        fetchAllLabels() {
          return fetch(`${this.settings.repoUrl}/labels?per_page=90`)
              .then((response)=>{
                  if (response.status != 200) {
                          throw 'API did not respond properly';
                  }
                  return response.json();
              })
              .then((labels)=>{
                      return labels.map((label)=>{
                                  return {
                                  id: label.id,
                                  name: label.name,
                                  color: label.color
                                  }
                      });
              })
              .catch(function(e){
                  console.log(e);
              });
        }

        fetchBlogPosts(labels=[]) {
          // need a cleaner and DRY way to write this function
          // it still works
          if(this.settings.posts.last_reached){
                  return Promise.resolve([]);
          }
          let fetchUrl =
                this.settings.posts.next_page_url
                || `${this.settings.blogUrl}?per_page=${this.settings.posts.per_page}&page=1&creator=${this.settings.username}&labels=${labels.join(',')}`;

          return fetch(fetchUrl)
              .then((response)=>{
                  if (response.status != 200) {
                          throw 'API did not respond properly';
                  }

                  if(response.headers._headers.hasOwnProperty('link')){
                    // other links will fall in this
                    let pageHeader = linkHeaderParse(response.headers._headers.link[0]);
                    if(pageHeader.hasOwnProperty('next')){
                        this.settings.posts.next_page_url = pageHeader.next.url;
                    }
                    else {
                        // the last page will fall in this
                        this.settings.posts.next_page_url = '';
                        this.settings.posts.last_reached = true;
                    }
                  }
                  else{
                    // links which have all posts in one page will fall in this
                    this.settings.posts.next_page_url = '';
                    this.settings.posts.last_reached = true;
                  }
                  return response.json();
              })
              .then((posts)=>{
                      return posts.map((post)=>{
                                  return {
                                  body: post.body,
                                  html: marked(post.body),
                                  id: post.number,
                                  title: post.title,
                                  date: post.created_at,
                                  labels: post.labels,
                                  comments_no: post.comments
                                  }
                      });
              })
              .catch(function(e){
                  console.log(e.message);
              });
        }

        fetchBlogPost(postId) {
          return fetch(this.settings.blogUrl+`/${postId}`)
              .then(function(response) {
                  if (response.status != 200) {
                          console.log("something bad happned");
                  }
                  return response.json();
              })
              .then((post)=>{
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
              .then(e=>{
                return e;
              })
              .catch(function(e){
                  console.log(e);
              });
        }

        fetchBlogPostComments(postId) {
          if(this.settings.comments.done_posts.indexOf(postId) !== -1)
          {
                  return Promise.resolve([]);
          }
          else if(postId !== this.settings.comments.cur_post){
                  this.settings.comments.next_page_url = '';
          }
          this.settings.comments.cur_post = postId;

          let fetchUrl = this.settings.comments.next_page_url || `${this.settings.blogUrl}/${postId}/comments?per_page=${this.settings.comments.per_page}&page=1`;
          return fetch(fetchUrl)
              .then((response)=>{
                  if (response.status != 200) {
                          throw "API responded unexpectedly";
                  }

                  if(response.headers._headers.hasOwnProperty('link')){
                    // other links will fall in this
                    let pageHeader = linkHeaderParse(response.headers._headers.link[0]);
                    if(pageHeader.hasOwnProperty('next')){
                        this.settings.comments.next_page_url = pageHeader.next.url;
                    }
                    else {
                        this.settings.comments.next_page_url = '';
                        this.settings.comments.done_posts = [...this.settings.comments.done_posts,postId];
                    }
                  }
                  else{
                    // links which have all posts in one page will fall in this
                    this.settings.comments.next_page_url = '';
                    this.settings.comments.done_posts = [...this.settings.comments.done_posts,postId];
                  }
                  return response.json();
              })
              .then(function(comments) {
                      return comments.map(comment=>{
                        return {
                          id: comment.id,
                          user: {
                                  username: comment.user.login,
                                  avatar_url: comment.user.avatar_url
                          },
                          body: comment.body,
                          created_at: comment.created_at,
                          html: marked(comment.body)
                        }
                      });
              })
              .catch(function(e){
                  console.log(e);
              });
        }
}

module.exports = function (opts) {
	return new blog(opts);
};

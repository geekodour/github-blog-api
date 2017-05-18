import fetch from 'isomorphic-fetch';

const API_URL = "https://api.github.com";

class blog {
        // this `blog` will have all the needed methods related
        // to the github api and a typical text blog
        constructor(options) {

          this.settings = Object.assign({
                author: {},
                repo: '',
                blogUrl: `${API_URL}/repos/${options.author}/${options.repo}/issues`
          },options)

          // fetch author information on init
          fetch(`${API_URL}/users/${options.author}`)
              .then(function(response) {
                  if (response.status != 200) {
                          console.log("something bad happned");
                  }
                  return response.json();
              })
              .then((author)=>{
                  this.settings.author = {name:author.name};
              })
              .catch(function(e){
                  console.log(e);
              });
        }

        getBlogAuthor() {
                return this.settings.author;
        }

        fetchBlogPosts() {
          // usage: app.getBlogPosts().then(posts=>console.log(posts))
          return fetch(this.settings.blogUrl)
              .then(function(response) {
                  if (response.status != 200) {
                          console.log("something bad happned");
                  }
                  return response.json();
              })
              .then((posts)=>{
                      return posts.map((post)=>{
                              return {
                              body: post.body,
                              id: post.number,
                              title: post.title,
                              date: post.created_at
                              }
                      });
              })
              .catch(function(e){
                  console.log(e);
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
              .then(function(post) {
                      return {
                       title: post.title,
                       id: post.number,
                       labels: post.labels,
                       comments: post.comments,
                       date: post.created_at,
                       body: post.body
                      };
              })
              .catch(function(e){
                  console.log(e);
              });
        }

        fetchBlogPostComments(postId) {
          return fetch(this.settings.blogUrl+`/${postId}/comments`)
              .then(function(response) {
                  if (response.status != 200) {
                          console.log("something bad happned");
                  }
                  return response.json();
              })
              .then(function(post) {
                      return post;
              })
              .catch(function(e){
                  console.log(e);
              });
        }
}

module.exports = function (opts) {
	return new blog(opts);
};

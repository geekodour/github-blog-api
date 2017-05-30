import fetch from 'isomorphic-fetch';
import marked from 'marked';
import linkHeaderParse from 'parse-link-header';

const API_URL = "https://api.github.com";

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
                blogUrl: `${API_URL}/repos/${options.username}/${options.repo}/issues`
          };
        }

        setPost(postObj){
                this.settings.posts = Object.assign(this.settings.posts,postObj);
        }

        fetchBlogPosts() {
          let fetchUrl = this.settings.posts.next_page_url || `${this.settings.blogUrl}?per_page=${this.settings.posts.per_page}&page=${this.settings.posts.cur_page}&creator=${this.settings.username}`;

          return fetch(fetchUrl)
              .then((response)=>{
                  if (response.status != 200) {
                          throw 'API did not respond properly';
                  }
                  // NOTE: maybe Object.assign the pageHeader object to posts object
                  let pageHeader = linkHeaderParse(response.headers._headers.link[0]);
                  if(pageHeader.last){
                    this.settings.posts.cur_page = pageHeader.next.page;
                    this.settings.posts.next_page_url = pageHeader.next.url;
                  }
                  else{
                    this.settings.posts.last_reached = true;
                    return [];
                    // after the last_reached is set to true, `fetchBlogPosts` will be returning
                    // the last request, stop calling `fetchBlogPosts` by checking last_reached
                    // from external block
                  }
                  return response.json();
              })
              .then((posts)=>{
                      /*if(this.settings.posts.last_reached){
                        return [];
                      }*/
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
                let fetchUrl = this.settings.comments.next_page_url || `${this.settings.blogUrl}/${postId}/comments?per_page=${this.settings.posts.per_page}&page=${this.settings.posts.cur_page}`;
          return fetch(fetchUrl)
              .then(function(response) {
                  if (response.status != 200) {
                          console.log(response.headers);

                          console.log("something bad happned");
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

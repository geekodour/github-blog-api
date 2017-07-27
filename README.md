## github-blog-api [![Build Status](https://travis-ci.org/geekodour/github-blog-api.svg?branch=master)](https://travis-ci.org/geekodour/github-blog-api)
### readme is not uptodate, will update soon - 27th July

> A github api wrapper exposing endpoints for a blog

### What is the `github-blog-api`?

This API wrapper enables you to run a blog using the GitHub API.
It uses `github issues` as __`posts`__ and `issue labels` as __`tags`__ and `GitHub comments` as __`comments`__
very conviently.

You can easily make a fully client-side blog using this API, but I made this
as a helper library for a [`gitpushblog`](https://github.com/geekodour/gitpushblog)(static github blog generator),
so some API endpoints might seem a bit odd but it should work fine for a fully client-side blog.


## Installation

Install github-api-wrapper using npm, it works same on both node and the browser

```
$ npm install --save github-blog-api
```

## Usage

### Basic Usage

```javascript
// ES5: var blog = require('github-blog-api');
import blog from 'github-blog-api';

let lazyblog = blog({username:'geekodour',repo:'gitpushblog',author:'geekodour'});

// set custom per_page, default is 10
lazyblog.setPost({per_page:5});

// get blogposts with per_page set to 5
// subsequent calls to fetchBlogPosts will result in next pages
lazyblog.fetchBlogPosts()
        .then(posts=>{console.log(posts)})
        .catch(err=>{console.log(err)});
// OUTPUTS: 5 posts of page 1

lazyblog.fetchBlogPosts()
        .then(posts=>{console.log(posts)})
        .catch(err=>{console.log(err)});
// OUTPUTS: 5 posts of page 2 if exists else prints []

// fetching comments with issueId
lazyblog.fetchBlogPostComments(2)
        .then(comments=>{console.log(comments)})
        .catch(err=>{console.log(err)});
```

### Calling fetchBlogPosts multiple times

```javascript
// manually setting last_reached to false to do another fetchBlogPosts call
// you need to do this only if you need to do a new fetchBlogPosts after or inbetween
// calling the last fetchBlogPosts

// NOTE: setPost method is synchronous so use it with caution when using with fetchBlogPosts

lazyblog.setPost({last_reached:false, next_page_url:''});

lazyblog.fetchBlogPosts(['bug'])
        .then(posts=>{console.log(posts)})
        .catch(err=>{console.log(err)});
```

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

## Contribute
- run `npm run build` to babelify the src files into lib

## Todo
- [ ] to add comment wrapper: auth + firebase setup

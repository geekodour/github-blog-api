var gitblog = require('../../lib/index.js');

var blog = gitblog({
	username: 'lukego',
	repo: 'blog',
	author: 'lukego'
});

blog.setPost({
	per_page: 3
});

blog.fetchBlogPosts().then(e => console.log(e));
blog.fetchBlogPostComments(2).then(e => console.log(e));

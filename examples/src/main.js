var gitblog = require('../../lib/index.js');

var blog = gitblog({
	username: 'lukego',
	repo: 'blog',
	author: 'lukego'
});

var rougeBlog = gitblog({
    username: 'lukegoo', // intentional mistake
	repo: 'blog',
	author: 'lukego'
});

blog.setPost({
	per_page: 3
});

// example of normal fetch
blog.fetchBlogPosts()
        .then(e => console.log(e))
        .catch(err => console.log(err));

// example of exception handle
rougeBlog.fetchBlogPosts()
        .then(e => console.log(e))
        .catch(err => console.log(err));

// comment fetch example
blog.fetchBlogPostComments(2).then(e => console.log(e));

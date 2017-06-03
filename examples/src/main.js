var gitblog = require('../../lib/index.js');
var blog = gitblog({username:'lukego',repo:'blog',author:'lukego'});
blog.setPost({per_page:80});
blog.fetchBlogPosts().then(e=>console.log(e));
blog.fetchAllLabels().then(e=>console.log(e));

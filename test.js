import test from 'ava';
import blog from './lib/index';

let testBlog = blog({username: 'lukego', author: 'lukego', repo: 'blog'});

test('fetchBlog', async t => {
	const blog = testBlog.fetchBlogPosts().then(r => r);
	t.is(await (blog), await (blog));
});

test('setPost', async t => {
	const post = testBlog.setPost({per_page: 3});
	t.is(await (post), await (post));
});

test('blogComments', async t => {
	const comments = testBlog.fetchBlogPostComments(2).then(r => r);
	t.is(await (comments), await (comments));
});

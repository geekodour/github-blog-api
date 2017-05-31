import test from 'ava';
import blog from './lib/index';

let testBlog = blog({username:'geekodour',repo:'gitpushblog'});


test('bar', async t => {
    const bar = testBlog.fetchBlogPosts().then(r=>r)
    console.log(await bar);
        //t.is(await bar, 'bar');
});

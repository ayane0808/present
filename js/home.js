import { getPosts, getCurrentUser } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const posts = await getPosts();
  console.log('posts:', posts);

  // 3日前の日時を作る
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // 3日以内の投稿だけ
  const recentPosts = posts.filter(post => {
    return new Date(post.created_at) >= threeDaysAgo;
  });

  console.log('3日以内:', recentPosts.length);

  const user = await getCurrentUser();

  document.getElementById('home-count').textContent =
    posts.length + '件の口コミ';

  const g = document.getElementById('home-greeting');
  if (user) {
    g.textContent = `👋 ${user.name}さん、いらっしゃいませ！`;
    g.style.display = 'inline-block';
  } else {
    g.style.display = 'none';
  }

  document.getElementById('home-posts').innerHTML = posts
    .slice(0, 8)
    .map(renderPostCard)
    .join('');
});

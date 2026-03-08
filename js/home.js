import { getPosts, getCurrentUser  } from './supabase.js';
document.addEventListener('DOMContentLoaded', async () => {
  const posts = await getPosts();
  console.log('posts:', posts);
  console.log('件数:', posts.length);
  const user = await getCurrentUser();//ログインしてるユーザ

  document.getElementById('home-count').textContent =
    posts.length + '件の口コミ';

  const g = document.getElementById('home-greeting');
  if (user) {
    // ログインしてる場合
    g.textContent = `👋 ${user.email}さん、いらっしゃいませ！`;
    g.style.display = 'inline-block';
  } else {
    // ログインしていない場合
    g.style.display = 'none';
  }

  document.getElementById('home-posts').innerHTML = posts
    .slice(0, 8)
    .map(renderPostCard)
    .join('');
});

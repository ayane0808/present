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

  const user = getCurrentUser();

  document.getElementById('home-count').textContent =
      recentPosts.length + '件の口コミ';

  const g = document.getElementById('home-greeting');

  if (user) {
    g.textContent = `👋 ${user.name}さん、いらっしゃいませ！`;
    g.style.display = 'inline-block';
  } else {
    g.style.display = 'none';
  }

  document.getElementById('home-posts').innerHTML = recentPosts
      .slice(0, 8)
      .map(renderPostCard)
      .join('');
});

function renderPostCard(post) {
  const imgBlock = post.image
      ? `<div class="card-img-wrap"><img class="card-img" src="${post.image}" alt="${post.product_name}"></div>`
      : `<div class="card-no-img">🎁</div>`;

  const urlBlock = post.url
      ? `<a href="${post.url}" target="_blank" rel="noopener noreferrer" class="card-link">🔗 商品ページを見る</a>`
      : '';

  return `<div class="post-card">
    ${imgBlock}
    <div class="card-body">
      <div class="card-product">🎁 ${post.product_name}</div>
      <p class="card-review">"${post.review}"</p>
      <div class="card-price">¥${post.price?.toLocaleString() ?? '—'}</div>
      ${urlBlock}
    </div>
  </div>`;
}
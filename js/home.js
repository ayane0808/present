document.addEventListener('DOMContentLoaded', () => {
  const posts = getPosts();
  const user = getUsers();

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

import { addPost, getCategories, getScenes, getRelations } from './supabase.js';
import { showToast, RELATION_ICONS } from './utils.js';

let newPost = { category: '', scene: '', relation: '' };

function buildPostChips(containerId, items, key, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items
    .map((item) => {
      const cls = type === 'purple' ? 'chip-purple' : 'chip';
      const icon =
        type === 'purple' ? `<span>${RELATION_ICONS[item] || ''}</span>` : '';
      const active = newPost[key] === item ? 'active' : '';
      return `<button class="${cls} ${active}" onclick="togglePostChip('${key}','${item}','${containerId}')">${icon}${item}</button>`;
    })
    .join('');
}

window.togglePostChip = function (key, val, containerId) {
  newPost[key] = newPost[key] === val ? '' : val;
  buildPostChips(
    containerId,
    key === 'category' ? CATEGORIES : key === 'scene' ? SCENES : RELATIONS,
    key,
    key === 'relation' ? 'purple' : 'red',
  );
};

window.handlePost = function () {
  const user = getUsers();
  if (!user) {
    showToast('投稿するにはログインが必要です', 'error');
    return;
  }

  const productName = document.getElementById('post-product').value.trim();
  const review = document.getElementById('post-review').value.trim();
  const url = document.getElementById('post-url').value.trim();
  const price = document.getElementById('post-price').value.trim();

  if (!productName || !review) {
    showToast('商品名とレビューは必須です', 'error');
    return;
  }

  const finalPost = {
    id: Date.now(),
    productName,
    review,
    url,
    category: newPost.category,
    scene: newPost.scene,
    relation: newPost.relation,
    price: price ? Number(price) : null,
    age: user.age,
    gender: user.gender,
    author: user.id,
  };

  addPost(finalPost); // supabase.jsの関数で保存
  showToast('投稿しました！🌸 ありがとうございます！');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1500);
};

document.addEventListener('DOMContentLoaded', () => {
  const user = getUsers();
  document.getElementById('post-login-warn').style.display = user
    ? 'none'
    : 'block';

  buildPostChips('post-chips-category', CATEGORIES, 'category', 'red');
  buildPostChips('post-chips-scene', SCENES, 'scene', 'red');
  buildPostChips('post-chips-relation', RELATIONS, 'relation', 'purple');
});

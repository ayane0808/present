let newPost = { category: '', scene: '', relation: '' };
let postCategories = [];
let postScenes = [];
let postRelations = [];

function getStoredUser() {
  if (typeof getUser === 'function') {
    return getUser();
  }
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function getPageUser() {
  const localUser = getStoredUser();
  if (localUser) return localUser;

  try {
    const { getCurrentUser } = await import('./supabase.js');
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    return {
      id: currentUser.id,
      age: currentUser.user_metadata?.age || '',
      gender: currentUser.user_metadata?.gender || '',
    };
  } catch {
    return null;
  }
}

const postRelationIcons =
  typeof RELATION_ICONS !== 'undefined' ? RELATION_ICONS : {};

function normalizeOptionRows(rows, fallbackField) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) =>
      row?.name ??
      row?.label ??
      row?.title ??
      row?.category_name ??
      row?.scene_name ??
      row?.relation_name ??
      row?.[fallbackField] ??
      '',
    )
    .filter((v) => typeof v === 'string' && v.trim().length > 0);
}

function getPostItemsByKey(key) {
  if (key === 'category') return postCategories;
  if (key === 'scene') return postScenes;
  return postRelations;
}

async function loadPostChipData() {
  try {
    const { getCategories, getScenes, getRelations } = await import('./supabase.js');
    const [categories, scenes, relations] = await Promise.all([
      getCategories(),
      getScenes(),
      getRelations(),
    ]);

    postCategories = normalizeOptionRows(categories, 'category');
    postScenes = normalizeOptionRows(scenes, 'scene');
    postRelations = normalizeOptionRows(relations, 'relation');
  } catch (error) {
    console.error('Failed to load post chip data from Supabase:', error);
  }

  // 既存データがある場合のフォールバック
  if (!postCategories.length && typeof CATEGORIES !== 'undefined') {
    postCategories = CATEGORIES;
  }
  if (!postScenes.length && typeof SCENES !== 'undefined') {
    postScenes = SCENES;
  }
  if (!postRelations.length && typeof RELATIONS !== 'undefined') {
    postRelations = RELATIONS;
  }
}

function buildPostChips(containerId, items, key, type) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items
    .map((item) => {
      const cls = type === 'purple' ? 'chip-purple' : 'chip';
      const icon =
        type === 'purple' ? `<span>${postRelationIcons[item] || ''}</span>` : '';
      const active = newPost[key] === item ? 'active' : '';
      return `<button class="${cls} ${active}" onclick="togglePostChip('${key}','${item}','${containerId}')">${icon}${item}</button>`;
    })
    .join('');
}

window.togglePostChip = function (key, val, containerId) {
  newPost[key] = newPost[key] === val ? '' : val;
  buildPostChips(
    containerId,
    getPostItemsByKey(key),
    key,
    key === 'relation' ? 'purple' : 'red',
  );
};

window.handlePost = async function () {
  const user = await getPageUser();
  if (!user) {
    showToast('投稿するにはログインが必要です', 'error');
    return;
  }

  const productName = document.getElementById('post-product').value.trim();
  const review = document.getElementById('post-review').value.trim();
  const url = document.getElementById('post-url').value.trim();

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
    age: user.age,
    gender: user.gender,
    likes: 0,
    author: user.id,
  };

  const { addPost } = await import('./supabase.js');
  await addPost(finalPost); // supabase.jsの関数で保存
  showToast('投稿しました！🌸 ありがとうございます！');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1500);
};

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getPageUser();
  document.getElementById('post-login-warn').style.display = user
    ? 'none'
    : 'block';

  await loadPostChipData();

  buildPostChips('post-chips-category', postCategories, 'category', 'red');
  buildPostChips('post-chips-scene', postScenes, 'scene', 'red');
  buildPostChips('post-chips-relation', postRelations, 'relation', 'purple');
});

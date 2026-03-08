let newPost = { category: '', scene: '', relation: '' };
let postCategories = [];
let postScenes = [];
let postRelations = [];
let categoryNameToId = {};
let sceneNameToId = {};
let relationNameToId = {};

function notify(message, type = 'success') {
  if (typeof showToast === 'function') {
    showToast(message, type);
    return;
  }
  console[type === 'error' ? 'error' : 'log'](message);
}

function resolvePostUserId(user) {
  if (!user?.id) return null;
  return user.id;
}

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

    categoryNameToId = Object.fromEntries(
      (categories || [])
        .map((row) => [row?.category_name, row?.id])
        .filter(([name, id]) => !!name && Number.isInteger(id)),
    );
    sceneNameToId = Object.fromEntries(
      (scenes || [])
        .map((row) => [row?.scene_name, row?.id])
        .filter(([name, id]) => !!name && Number.isInteger(id)),
    );
    relationNameToId = Object.fromEntries(
      (relations || [])
        .map((row) => [row?.relation_name, row?.id])
        .filter(([name, id]) => !!name && Number.isInteger(id)),
    );
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
    notify('投稿するにはログインが必要です', 'error');
    return;
  }

  const productName = document.getElementById('post-product').value.trim();
  const review = document.getElementById('post-review').value.trim();
  const url = document.getElementById('post-url').value.trim();

  if (!productName || !review) {
    notify('商品名とレビューは必須です', 'error');
    return;
  }

  const postUserId = resolvePostUserId(user);
  if (!postUserId) {
    notify('ユーザー情報の取得に失敗しました', 'error');
    return;
  }

  const finalPost = {
    product_name: productName,
    review,
    url,
    category_id: categoryNameToId[newPost.category] ?? null,
    scene_id: sceneNameToId[newPost.scene] ?? null,
    relation_id: relationNameToId[newPost.relation] ?? null,
    user_id: postUserId,
  };

  const { supab } = await import('./supabase.js');
  const { error } = await supab
    .from('posts')
    .insert([finalPost])
    .select('id')
    .single();

  if (error) {
    notify(`投稿に失敗しました: ${error.message}`, 'error');
    return;
  }
  notify('投稿しました！🌸 ありがとうございます！');
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

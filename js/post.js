import { getCategories, getScenes, getRelations, supab } from './supabase.js';
import { showToast, RELATION_ICONS } from './utils.js';

let newPost = { category: '', scene: '', relation: '' };
let postCategories = [];
let postScenes = [];
let postRelations = [];
let categoryNameToId = {};
let sceneNameToId = {};
let relationNameToId = {};
let editPostId = null;

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
      age: currentUser.user_metadata?.age ?? currentUser.age ?? '',
      gender: currentUser.user_metadata?.gender ?? currentUser.gender ?? '',
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
        .map((row) => [row?.category_name ?? row?.name, row?.id])
        .filter(([name, id]) => !!name && Number.isInteger(id)),
    );
    sceneNameToId = Object.fromEntries(
      (scenes || [])
        .map((row) => [row?.scene_name ?? row?.name, row?.id])
        .filter(([name, id]) => !!name && Number.isInteger(id)),
    );
    relationNameToId = Object.fromEntries(
      (relations || [])
        .map((row) => [row?.relation_name ?? row?.name, row?.id])
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
    product_name: productName,
    review,
    url,
    category_id: categoryNameToId[newPost.category] ?? null,
    scene_id: sceneNameToId[newPost.scene] ?? null,
    relation_id: relationNameToId[newPost.relation] ?? null,
    price: price ? Number(price) : null,
    user_id: user.id,
  };

  if (editPostId) {
    // 編集（UPDATE）処理
    const { error } = await supab.from('posts').update(finalPost).eq('id', editPostId);
    if (error) {
      showToast(`更新に失敗しました: ${error.message}`, 'error');
      return;
    }
    showToast('編集を保存しました！🌸');
  } else {
    // 新規投稿（INSERT）処理
    const { error } = await supab.from('posts').insert([finalPost]);
    if (error) {
      showToast(`投稿に失敗しました: ${error.message}`, 'error');
      return;
    }
    showToast('投稿しました！🌸 ありがとうございます！');
  }
  setTimeout(() => {
    // 投稿後はホーム、編集後はマイページ
    window.location.href = editPostId ? 'auth.html' : 'index.html';
  }, 1500);
};

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getPageUser();
  document.getElementById('post-login-warn').style.display = user
    ? 'none'
    : 'block';

  await loadPostChipData();

  // 編集モードの判定とデータの読み込み
  const params = new URLSearchParams(window.location.search);
  editPostId = params.get('edit');

  if (editPostId) {
    // 見出しとボタンの文字を「編集」用に変える
    document.querySelector('.section-title').textContent = '口コミを編集';
    document.querySelector('.btn-primary.full').textContent = '🌸 編集を保存する';

    // 対象の投稿データをデータベースから取得
    const { data: post } = await supab.from('posts').select('*').eq('id', editPostId).single();
    
    if (post) {
      // フォームに文字を埋める
      document.getElementById('post-product').value = post.product_name || '';
      document.getElementById('post-price').value = post.price || '';
      document.getElementById('post-review').value = post.review || '';
      document.getElementById('post-url').value = post.url || '';

      // IDからカテゴリ名などを逆引きしてチップを選択状態にする
      const catName = Object.keys(categoryNameToId).find(k => categoryNameToId[k] === post.category_id);
      const sceneName = Object.keys(sceneNameToId).find(k => sceneNameToId[k] === post.scene_id);
      const relName = Object.keys(relationNameToId).find(k => relationNameToId[k] === post.relation_id);

      if (catName) newPost.category = catName;
      if (sceneName) newPost.scene = sceneName;
      if (relName) newPost.relation = relName;
    }
  }

  buildPostChips('post-chips-category', postCategories, 'category', 'red');
  buildPostChips('post-chips-scene', postScenes, 'scene', 'red');
  buildPostChips('post-chips-relation', postRelations, 'relation', 'purple');
});

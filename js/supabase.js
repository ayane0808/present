// ===== 共通データ・定数 =====
const CATEGORIES = [
  'ファッション',
  'コスメ・美容',
  'グルメ・食べ物',
  '体験・レジャー',
  'インテリア',
  'テクノロジー',
  'スポーツ・アウトドア',
  '本・音楽',
  'ペット用品',
  'その他',
];
const SCENES = [
  '誕生日',
  'クリスマス',
  'バレンタイン',
  'ホワイトデー',
  '母の日',
  '父の日',
  '結婚祝い',
  '出産祝い',
  '卒業祝い',
  '入学祝い',
  '就職祝い',
  'その他',
];
const RELATIONS = [
  '恋人',
  '友人',
  '父',
  '母',
  '兄弟・姉妹',
  '先輩・上司',
  '同僚',
  '子ども',
  '祖父母',
  'その他',
];
const RELATION_ICONS = {
  恋人: '💑',
  友人: '👫',
  父: '👨',
  母: '👩',
  '兄弟・姉妹': '👦',
  '先輩・上司': '👔',
  同僚: '🤝',
  子ども: '🧒',
  祖父母: '👴',
  その他: '🎁',
};

// ===== 疑似DB (localStorage) 初期化 =====
const INITIAL_POSTS = [
  {
    id: 1,
    productName: 'バルミューダ トースター',
    category: 'インテリア',
    scene: '結婚祝い',
    relation: '友人',
    review:
      '友人へのプレゼントに。見た目がスタイリッシュで喜ばれました！毎日使ってくれているそうで最高の選択でした。',
    age: '30代',
    gender: '女性',
    likes: 42,
    author: 'saki_k',
    url: 'https://www.balmuda.com/jp/toaster',
    imageUrl:
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80',
  },
  {
    id: 2,
    productName: '一保堂の抹茶セット',
    category: 'グルメ・食べ物',
    scene: '母の日',
    relation: '母',
    review:
      '母が抹茶好きなので。高級感があって喜んでもらえました。パッケージも美しくてギフトにぴったり。',
    age: '50代',
    gender: '女性',
    likes: 38,
    author: 'taro_m',
    url: 'https://www.ippodo-tea.co.jp',
    imageUrl:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  },
  {
    id: 3,
    productName: 'Apple AirPods Pro',
    category: 'テクノロジー',
    scene: '誕生日',
    relation: '恋人',
    review:
      'ずっと欲しがっていたので。ノイズキャンセリングが最高と感動してくれました。少し高いけど価値あり！',
    age: '20代',
    gender: '男性',
    likes: 67,
    author: 'yuki_t',
    url: 'https://www.apple.com/jp/airpods-pro/',
    imageUrl:
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80',
  },
];

if (!localStorage.getItem('gf_posts')) {
  localStorage.setItem('gf_posts', JSON.stringify(INITIAL_POSTS));
}
if (!localStorage.getItem('gf_liked')) {
  localStorage.setItem('gf_liked', JSON.stringify([]));
}

// ===== 疑似DB アクセス関数 =====
// ⚠️ Supabase導入時はここを非同期(async)通信に書き換える
function getPosts() {
  return JSON.parse(localStorage.getItem('gf_posts')) || [];
}
function addPost(post) {
  const posts = getPosts();
  posts.unshift(post); // 先頭に追加
  localStorage.setItem('gf_posts', JSON.stringify(posts));
}
function getUser() {
  const user = localStorage.getItem('gf_user');
  return user ? JSON.parse(user) : null;
}
function setUser(user) {
  if (user) localStorage.setItem('gf_user', JSON.stringify(user));
  else localStorage.removeItem('gf_user');
}
function getLikedPosts() {
  return JSON.parse(localStorage.getItem('gf_liked')) || [];
}
function saveLikedPost(id) {
  const liked = getLikedPosts();
  if (!liked.includes(id)) {
    liked.push(id);
    localStorage.setItem('gf_liked', JSON.stringify(liked));
  }
}

// ===== 共通UI関数 =====
function toggleDrawer() {
  document.getElementById('mobile-drawer').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}
function closeDrawer() {
  document.getElementById('mobile-drawer').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background =
    type === 'error'
      ? 'linear-gradient(135deg,#e74c3c,#c0392b)'
      : 'linear-gradient(135deg,#5BAD8F,#7ECBA6)';
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.display = 'none';
  }, 2800);
}

// 共通の投稿カード生成
function renderPostCard(post) {
  const liked = getLikedPosts().includes(post.id);
  const imgBlock = post.imageUrl
    ? `<div class="card-img-wrap"><img class="card-img" src="${post.imageUrl}" alt="${post.productName}" onerror="this.parentElement.style.display='none'"><div class="card-img-overlay"></div></div>`
    : `<div class="card-no-img">🎁</div>`;
  const urlBlock = post.url
    ? `<a href="${post.url}" target="_blank" rel="noopener noreferrer" class="card-link">🔗 商品ページを見る</a>`
    : '';
  const tags = [
    post.category ? `<span class="tag tag-cat">${post.category}</span>` : '',
    post.scene ? `<span class="tag tag-scene">${post.scene}</span>` : '',
    post.relation
      ? `<span class="tag tag-rel">${RELATION_ICONS[post.relation] || '🎁'} ${post.relation}へ</span>`
      : '',
    post.age
      ? `<span class="tag tag-age">${post.age} · ${post.gender}</span>`
      : '',
  ].join('');

  return `<div class="post-card">
    ${imgBlock}
    <div class="card-body">
      <div class="card-product">🎁 ${post.productName}</div>
      <div class="card-tags">${tags}</div>
      <p class="card-review">"${post.review}"</p>
      ${urlBlock}
      <div class="card-footer">
        <div class="card-author">by @${post.author}</div>
        <button class="like-btn ${liked ? 'liked' : ''}" onclick="handleLike(${post.id}, this)">❤️ ${post.likes}</button>
      </div>
    </div>
  </div>`;
}

// いいね処理（全ページ共通）
window.handleLike = function (id, btnElement) {
  if (getLikedPosts().includes(id)) return;
  saveLikedPost(id);

  // DB(localStorage)の更新
  const posts = getPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index !== -1) {
    posts[index].likes++;
    localStorage.setItem('gf_posts', JSON.stringify(posts));
    btnElement.classList.add('liked');
    btnElement.innerHTML = `❤️ ${posts[index].likes}`;
  }
};

// ナビゲーションのアクティブ状態を設定
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  let page = 'home';
  if (currentPath.includes('search')) page = 'search';
  if (currentPath.includes('post')) page = 'post';
  if (currentPath.includes('auth')) page = 'auth';

  document.querySelectorAll('[data-page]').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });
});

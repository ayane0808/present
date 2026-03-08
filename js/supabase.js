const supabaseUrl = 'https://ecugpnzlyuzhntablaog.supabase.co';
const supabaseAnonKey = 'sb_publishable_uRyuJ85gTZMjhLrPe_hAhw_4gLArWO6';

const supab = supabase.createClient(supabaseUrl, supabaseAnonKey);

// postsを取得
async function getPosts() {
  const { data, error } = await supab.from('posts').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// usersを取得
async function getUsers() {
  const { data, error } = await supab.from('users').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// categoriesを取得
async function getCategories() {
  const { data, error } = await supab.from('categories').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// scenesを取得
async function getScenes() {
  const { data, error } = await supab.from('scenes').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// relationsを取得
async function getRelations() {
  const { data, error } = await supab.from('relations').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
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
  const imgBlock = post.imageUrl
    ? `<div class="card-img-wrap"><img class="card-img" src="${post.imageUrl}" alt="${post.productName}" onerror="this.parentElement.style.display='none'"><div class="card-img-overlay"></div></div>`
    : `<div class="card-no-img">🎁</div>`;
  const urlBlock = post.url
    ? `<a href="${post.url}" target="_blank" rel="noopener noreferrer" class="card-link">🔗 商品ページを見る</a>`
    : '';
  const priceHtml = post.price 
    ? `<div class="card-price">💰 ¥${Number(post.price).toLocaleString()}</div>` 
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
      ${priceHtml}
      <div class="card-tags">${tags}</div>
      <p class="card-review">"${post.review}"</p>
      ${urlBlock}
      <div class="card-footer">
        <div class="card-author">by @${post.author}</div>
      </div>
    </div>
  </div>`;
}

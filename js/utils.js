export const RELATION_ICONS = { '恋人': '💕', '友人': '🤝', '父': '👨', '母': '👩', '兄弟・姉妹': '👫', '先輩・上司': '🧑🏻‍💼','同僚': '💼', '子ども': '🧒🏻','祖父母': '👴🏻', 'その他': '✨'};

// ===== 共通UI関数 =====
// HTMLのonclickから直接呼ばれるものは window に登録する
window.toggleDrawer = function() {
  document.getElementById('mobile-drawer').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}
window.closeDrawer = function() {
  document.getElementById('mobile-drawer').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}


let toastTimer;


export function showToast(msg, type = 'success') {
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
// onclick等で呼ばれる可能性も考慮してwindowにも登録
window.showToast = showToast;


function formatAge(age) {
  if (!age) return '';
  if (age <= 9) return '9歳以下';
  if (age >= 60) return '60歳以上';
  return age + '代';
}
window.formatAge = formatAge;



// 共通の投稿カード生成
export function renderPostCard(post) {
  const imgBlock = post.image
    ? `<div class="card-img-wrap"><img class="card-img" src="${post.image}" alt="${post.product_name}" onerror="this.parentElement.style.display='none'"><div class="card-img-overlay"></div></div>`
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
      <div class="card-product">🎁 ${post.product_name}</div>
      ${priceHtml}
      <div class="card-tags">${tags}</div>
      <p class="card-review">"${post.review}"</p>
      ${urlBlock}
    </div>
  </div>`;
}

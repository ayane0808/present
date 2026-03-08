import { getPosts, getCategories, getScenes, getRelations } from './supabase.js';
import { showToast, renderPostCard, RELATION_ICONS } from './utils.js';

let CATEGORIES = [];
let SCENES = [];
let RELATIONS = [];

let searchConditions = {
  age: '',
  gender: '',
  relation: '',
  scene: '',
  category: '',
};
let searchMode = 'button';
let chatMessages = [
  {
    role: 'ai',
    text: 'こんにちは！プレゼント選びのお手伝いをします🌸\n\nどなたへ、どんな場面のプレゼントをお探しですか？',
  },
];
let aiLoading = false;
let cachedAiApiKey = null;

async function getAiApiKey() {
  if (cachedAiApiKey) return cachedAiApiKey;

  const { getApiKey } = await import('./supabase.js');
  const key = await getApiKey('gemini');

  if (!key) {
    throw new Error('APIキーが見つかりません（APIkey.name = gemini）');
  }

  cachedAiApiKey = key;
  return key;
}

function toName(row, keys) {
  if (!row) return '';
  for (const key of keys) {
    if (typeof row[key] === 'string' && row[key].trim()) return row[key].trim();
  }
  return '';
}

function extractBudgetRange(text) {
  const matches = [...text.matchAll(/(\d[\d,]*)\s*円/g)].map((m) =>
    Number(String(m[1]).replace(/,/g, '')),
  );
  if (!matches.length) return null;

  if (matches.length >= 2) {
    const sorted = matches.slice(0, 2).sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[1] };
  }

  const value = matches[0];
  if (/以上|から/.test(text)) return { min: value, max: Infinity };
  if (/以下|以内|まで/.test(text)) return { min: 0, max: value };
  return { min: 0, max: value };
}

function normalizePostsForAi(posts, categoryMap, sceneMap, relationMap) {
  return (posts || []).map((post) => ({
    productName: post.product_name ?? post.productName ?? '商品名不明',
    review: post.review ?? '',
    price: post.price == null || post.price === '' ? null : Number(post.price),
    category: post.category ?? categoryMap.get(post.category_id) ?? '',
    scene: post.scene ?? sceneMap.get(post.scene_id) ?? '',
    relation: post.relation ?? relationMap.get(post.relation_id) ?? '',
    createdAt: post.created_at ?? '',
  }));
}

function rankPostsForPrompt(posts, userMsg) {
  const budget = extractBudgetRange(userMsg);
  const text = userMsg.toLowerCase();

  const scored = posts.map((post) => {
    let score = 0;

    if (post.category && text.includes(post.category.toLowerCase())) score += 3;
    if (post.scene && text.includes(post.scene.toLowerCase())) score += 3;
    if (post.relation && text.includes(post.relation.toLowerCase())) score += 3;
    if (post.productName && text.includes(post.productName.toLowerCase())) score += 2;

    if (budget && post.price != null) {
      const inRange = post.price >= budget.min && post.price <= budget.max;
      score += inRange ? 4 : -2;
    }

    return { post, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return String(b.post.createdAt).localeCompare(String(a.post.createdAt));
  });

  const top = scored.slice(0, 5).map((v) => v.post);
  return top.length ? top : posts.slice(0, 5);
}

function buildPostContext(posts) {
  if (!posts.length) return '参考にできる投稿データは見つかりませんでした。';

  return posts
    .map((post, idx) => {
      const price = post.price == null || Number.isNaN(post.price)
        ? '価格不明'
        : `¥${post.price.toLocaleString()}`;
      return `${idx + 1}. 商品: ${post.productName} / 価格: ${price} / カテゴリ: ${post.category || '不明'} / シーン: ${post.scene || '不明'} / 関係: ${post.relation || '不明'} / 口コミ: ${post.review || 'なし'}`;
    })
    .join('\n');
}

function buildDbSectionForUser(posts, userMsg) {
  if (!posts.length) return '【みんなのもらって嬉しいギフト】\n- 相談内容に近い投稿データが見つかりませんでした。';

  const text = userMsg.toLowerCase();
  const budget = extractBudgetRange(userMsg);

  const lines = posts.slice(0, 3).map((post) => {
    const hasPrice = post.price != null && !Number.isNaN(post.price);
    const pricePart = hasPrice ? `（¥${post.price.toLocaleString()}）` : '';

    const reasons = [];
    if (post.scene && text.includes(post.scene.toLowerCase())) reasons.push(`シーン「${post.scene}」に一致`);
    if (post.relation && text.includes(post.relation.toLowerCase())) reasons.push(`関係「${post.relation}」に一致`);
    if (post.category && text.includes(post.category.toLowerCase())) reasons.push(`カテゴリ「${post.category}」に一致`);
    if (budget && post.price != null && post.price >= budget.min && post.price <= budget.max) {
      reasons.push('予算帯に近い');
    }

    const shortReview = (post.review || '口コミなし').slice(0, 42);
    const reasonText = reasons.length ? reasons.join('・') : '口コミ評価が参考になる';
    return `- ${post.productName}${pricePart}がおすすめです。理由: ${reasonText}。口コミ: ${shortReview}${post.review && post.review.length > 42 ? '...' : ''}`;
  });

  return `【みんなのもらって嬉しいギフト】\n${lines.join('\n')}`;
}

window.setSearchMode = function(mode) {
  searchMode = mode;
  document.getElementById('search-button-mode').style.display =
    mode === 'button' ? 'block' : 'none';
  document.getElementById('search-ai-mode').style.display =
    mode === 'ai' ? 'block' : 'none';
  document
    .getElementById('tab-button')
    .classList.toggle('active', mode === 'button');
  document.getElementById('tab-ai').classList.toggle('active', mode === 'ai');
  if (mode === 'ai') renderChat();
}

// チップの構築と選択ロジック
function refreshSearchChips() {
  buildChips('chips-relation', RELATIONS, 'relation', searchConditions);
  buildChips('chips-scene', SCENES, 'scene', searchConditions);
  buildChips('chips-category', CATEGORIES, 'category', searchConditions);
}

function buildChips(containerId, items, key, stateObj) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items
    .map((item) => {
      const isPurple = key === 'relation';
      const cls = isPurple ? 'chip-purple' : 'chip';
      const icon = isPurple ? `<span>${RELATION_ICONS[item] || ''}</span>` : '';
      const active = stateObj[key] === item ? 'active' : '';
      return `<button class="${cls} ${active}" onclick="toggleSearchCondition('${key}','${item}')">${icon}${item}</button>`;
    })
    .join('');
}

window.toggleSearchCondition = function (key, val) {
  searchConditions[key] = searchConditions[key] === val ? '' : val;
  refreshSearchChips();
};

// 検索実行
window.handleSearch = async function () {
  searchConditions.age = document.getElementById('filter-age').value;
  searchConditions.gender = document.getElementById('filter-gender').value;

  // スライダーの価格を取得
  const slider = document.getElementById('price-slider');
  let minPrice = 0;
  let maxPrice = 50000;
  if (slider && slider.noUiSlider) {
    const values = slider.noUiSlider.get();
    minPrice = Math.round(values[0]);
    maxPrice = Math.round(values[1]);
  }
  // DBから投稿をすべて取得
  const allPosts = await getPosts();
  // 条件に合うものだけを残す
  const filtered = allPosts.filter((p) => {
    if (searchConditions.age && p.age !== searchConditions.age) return false;
    if (
      searchConditions.gender &&
      searchConditions.gender !== 'どちらでも' &&
      p.gender !== searchConditions.gender &&
      p.gender !== 'どちらでも'
    )
      return false;
    if (searchConditions.relation && p.relation !== searchConditions.relation)
      return false;
    if (searchConditions.scene && p.scene !== searchConditions.scene)
      return false;
    if (searchConditions.category && p.category !== searchConditions.category)
      return false;
    // 価格の絞り込み
    const postPrice = p.price ? Number(p.price) : 0;
    if (postPrice < minPrice) return false;
    // maxPriceが50000の場合は「5万円以上」も含める仕様にする
    if (maxPrice < 50000 && postPrice > maxPrice) return false;
    return true;
  });

  const searchResults = filtered.length > 0 ? filtered : [];
  const area = document.getElementById('search-results-area');

  if (searchResults.length > 0) {
    area.innerHTML = `
      <div class="results-panel-title">🎁 検索結果 <span class="results-count-badge">${searchResults.length}件</span></div>
      <div class="posts-grid">${searchResults.map(renderPostCard).join('')}</div>`;
  } else {
    area.innerHTML = `
      <div class="empty-state">
        <div class="es-icon">😢</div>
        <div class="es-title">見つかりませんでした</div>
        <div class="es-sub">条件を変えてもう一度お試しください。</div>
      </div>`;
  }
};

// AIチャット機能
function renderChat() {
  const box = document.getElementById('chat-box');
  if (!box) return;
  box.innerHTML = chatMessages
    .map(
      (m) => `
    <div class="chat-msg ${m.role === 'user' ? 'user' : ''}">
      <div class="chat-bubble ${m.role === 'ai' ? 'ai' : 'user'}">${m.text}</div>
    </div>`,
    )
    .join('');
  box.scrollTop = box.scrollHeight;
}

window.handleChatSend = async function () {
  const input = document.getElementById('chat-input');
  const userMsg = input.value.trim();
  if (!userMsg || aiLoading) return;
  
  input.value = '';
  chatMessages.push({ role: 'user', text: userMsg });
  aiLoading = true;
  document.getElementById('chat-send-btn').disabled = true;
  renderChat();

  const box = document.getElementById('chat-box');
  const td = document.createElement('div');
  td.className = 'typing-dots';
  td.innerHTML =
    '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  box.appendChild(td);
  box.scrollTop = box.scrollHeight;

  try {
    const [apiKey, posts, categories, scenes, relations] = await Promise.all([
      getAiApiKey(),
      getPosts(),
      getCategories(),
      getScenes(),
      getRelations(),
    ]);

    const categoryMap = new Map(
      (categories || [])
        .map((row) => [row?.id, toName(row, ['category_name', 'name', 'label'])])
        .filter(([id, name]) => id != null && !!name),
    );
    const sceneMap = new Map(
      (scenes || [])
        .map((row) => [row?.id, toName(row, ['scene_name', 'name', 'label'])])
        .filter(([id, name]) => id != null && !!name),
    );
    const relationMap = new Map(
      (relations || [])
        .map((row) => [row?.id, toName(row, ['relation_name', 'name', 'label'])])
        .filter(([id, name]) => id != null && !!name),
    );

    const normalizedPosts = normalizePostsForAi(
      posts,
      categoryMap,
      sceneMap,
      relationMap,
    );
    const rankedPosts = rankPostsForPrompt(normalizedPosts, userMsg);
    const postContext = buildPostContext(rankedPosts);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `あなたはプレゼント選びのアドバイザーです。ユーザーの要望に基づいて、適切なプレゼントのアドバイスを日本語で行ってください。\n\n以下はこのサービス内の実際の投稿データです。できるだけこの情報を優先して提案してください。\n${postContext}\n\nユーザーからの相談：「${userMsg}」\n\n出力は「AIからの提案」だけを2〜3個、箇条書きで返してください。先頭に見出しや前置きは不要です。`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const aiText =
      result.candidates?.[0]?.content?.parts?.[0]?.text ||
      '申し訳ありません。返答を生成できませんでした。';

    const dbSection = buildDbSectionForUser(rankedPosts, userMsg);
    const finalText = `${dbSection}\n\n【AIからの提案】\n${aiText}`;

    chatMessages.push({
      role: 'ai',
      text: finalText,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    chatMessages.push({
      role: 'ai',
      text: `申し訳ありません。エラーが発生しました：${error.message}`,
    });
    showToast('AIとの通信に失敗しました', 'error');
  } finally {
    aiLoading = false;
    document.getElementById('chat-send-btn').disabled = false;
    renderChat();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. DBから一気に3つのデータを取得する
    const [catData, sceneData, relData] = await Promise.all([
      getCategories(),
      getScenes(),
      getRelations()
    ]);

    // ログ用
    console.log("カテゴリのデータ:", catData);
    console.log("シーンのデータ:", sceneData);
    console.log("関係性のデータ:", relData);

    // 2. 取得したデータから「名前」だけを取り出して配列にする
    CATEGORIES = catData.map(d => d.category_name);
    SCENES = sceneData.map(d => d.scene_name);
    RELATIONS = relData.map(d => d.relation_name);

    // 3. データが入った状態でチップを描画
    refreshSearchChips();

  } catch (error) {
    console.error("データの取得に失敗しました:", error);
    showToast("データの読み込みに失敗しました", "error");
  }

  // noUiSliderの初期化
  const slider = document.getElementById('price-slider');
  if (slider) {
    noUiSlider.create(slider, {
      start: [0, 50000],
      connect: true,
      step: 1000, // 1000円刻み
      range: {
        'min': 0,
        'max': 50000
      }
    });

    const priceValue = document.getElementById('price-value');
    
    slider.noUiSlider.on('update', function (values, handle) {
      const min = Math.round(values[0]).toLocaleString();
      const max = Math.round(values[1]);
      const maxStr = max >= 50000 ? max.toLocaleString() + '以上' : max.toLocaleString();
      priceValue.innerText = `¥${min} - ¥${maxStr}`;
    });
  }
});

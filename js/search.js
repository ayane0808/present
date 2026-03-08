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

function setSearchMode(mode) {
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
window.handleSearch = function () {
  searchConditions.age = document.getElementById('filter-age').value;
  searchConditions.gender = document.getElementById('filter-gender').value;

  const allPosts = getPosts();
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
    const apiKey = await getAiApiKey();
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
                  text: `あなたはプレゼント選びのアドバイザーです。ユーザーの要望に基づいて、適切なプレゼントのアドバイスを日本語で行ってください。\n\nユーザーからの相談：「${userMsg}」\n\nアドバイスは簡潔に（100字程度）、具体的なプレゼント提案を含めてください。`,
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

    chatMessages.push({
      role: 'ai',
      text: aiText,
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

document.addEventListener('DOMContentLoaded', refreshSearchChips);

import { showToast } from './utils.js';

let authMode = 'login';

window.setAuthMode = function(mode) {
  authMode = mode;
  document.getElementById('auth-tab-login').classList.toggle('active', mode==='login');
  document.getElementById('auth-tab-register').classList.toggle('active', mode==='register');
  document.getElementById('register-fields').style.display = mode==='register' ? 'block' : 'none';
  document.getElementById('auth-title').textContent = mode==='login' ? 'ログイン' : 'アカウント作成';
  document.getElementById('auth-demo-hint').style.display = mode==='login' ? 'block' : 'none';
  document.getElementById('auth-submit-btn').textContent = mode==='login' ? 'ログイン' : 'アカウントを作成';
}

window.handleAuth = function() {
  const id = document.getElementById('auth-id').value.trim();
  const password = document.getElementById('auth-password').value;
  
  if (authMode === 'login') {
    if (id === 'demo' && password === 'demo') {
      setUser({ id: 'demo', name: 'デモユーザー', age: '30代', gender: '女性' });
      showToast('いらっしゃいませ！ログインしました 🌸');
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } else {
      showToast('IDまたはパスワードが違います', 'error');
    }
  } else {
    const name = document.getElementById('auth-name').value.trim();
    const age = document.getElementById('auth-age').value;
    const gender = document.getElementById('auth-gender').value;
    if(!id || !password || !name) { showToast('全項目を入力してください', 'error'); return; }
    
    setUser({ id, name, age, gender });
    showToast('アカウントを作成しました！ようこそ🎊');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  }
}

window.handleLogout = function() {
  setUser(null);
  showToast('またのお越しをお待ちしております 🌸');
  renderAccount();
}

function renderAccount() {
  const user = getUser();
  const li = document.getElementById('account-logged-in');
  const au = document.getElementById('account-auth');
  
  if (user) {
    li.style.display = 'block'; au.style.display = 'none';
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-sub').textContent = user.age + ' · ' + user.gender;
    document.getElementById('profile-id').textContent = '@' + user.id;
  } else {
    li.style.display = 'none'; au.style.display = 'block';
  }
}

document.addEventListener("DOMContentLoaded", renderAccount);
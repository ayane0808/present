import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ecugpnzlyuzhntablaog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdWdwbnpseXV6aG50YWJsYW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjUxMDIsImV4cCI6MjA4ODQ0MTEwMn0.KjOHqHu6xnCoOHRaoTMMkbL6PIOVY4nEVVUW-NRZaD8';

export const supab = createClient(supabaseUrl, supabaseAnonKey);

// postsを取得
export async function getPosts() {
  const { data, error } = await supab.from('posts').select('*');
  if (error) { console.error(error); return []; }
  return data;
}

// postを1件追加
export async function addPost(post) {
  const { data, error } = await supab.from('posts').insert([post]);
  if (error) { console.error(error); return null; }
  return data;
}

// categoriesを取得
export async function getCategories() {
  const { data, error } = await supab.from('categories').select('*');
  if (error) { console.error(error); return []; }
  return data;
}

// scenesを取得
export async function getScenes() {
  const { data, error } = await supab.from('scenes').select('*');
  if (error) { console.error(error); return []; }
  return data;
}

// relationsを取得
export async function getRelations() {
  const { data, error } = await supab.from('relations').select('*');
  if (error) { console.error(error); return []; }
  return data;
}

// 新規登録（usersテーブルに直接insert）
export async function signUp(id, password, age, gender, name) {
  const { data, error } = await supab.from('users').insert([{
    id,
    password,
    age: parseInt(age),
    gender: parseInt(gender),
    name
  }]);
  if (error) { console.error('登録エラー:', error.message); return null; }

  const user = { id, age: parseInt(age), gender: parseInt(gender), name };
  localStorage.setItem('gf_user', JSON.stringify(user)); // ← ログイン状態にする
  return user;
}

// getCurrentUser → localStorageから取得に変更
export function getCurrentUser() {
  const user = localStorage.getItem('gf_user');
  return user ? JSON.parse(user) : null;
}

// signOut → localStorageを削除
export function signOut() {
  localStorage.removeItem('gf_user');
}

// signIn成功後にlocalStorageに保存するよう変更
export async function signIn(id, password) {
  const { data, error } = await supab.from('users')
      .select('*')
      .eq('id', id)
      .eq('password', password)
      .single();
  if (error || !data) { console.error('ログインエラー'); return null; }
  localStorage.setItem('gf_user', JSON.stringify(data)); // ← 追加
  return data;
}

// APIキーを取得
export async function getApiKey(name) {
  const { data, error } = await supab.from('APIkey').select('key').eq('name', name).single();
  if (error) {
    console.error('Failed to fetch API key:', error);
    return null;
  }
  return data?.key || null;
}


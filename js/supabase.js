import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ecugpnzlyuzhntablaog.supabase.co';
const supabaseAnonKey = 'sb_publishable_uRyuJ85gTZMjhLrPe_hAhw_4gLArWO6';

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

// ログイン中ユーザーを取得
export async function getCurrentUser() {
  const { data: { user } } = await supab.auth.getUser();
  return user;
}

// ログイン
export async function signIn(email, password) {
  const { data, error } = await supab.auth.signInWithPassword({ email, password });
  if (error) { console.error(error); return null; }
  return data.user;
}

// ログアウト
export async function signOut() {
  const {error} = await supab.auth.signOut();
  if (error) console.error(error);
}
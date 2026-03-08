import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ecugpnzlyuzhntablaog.supabase.co';
const supabaseAnonKey = 'sb_publishable_uRyuJ85gTZMjhLrPe_hAhw_4gLArWO6';

export const supab = createClient(supabaseUrl, supabaseAnonKey);

// postsを取得
export async function getPosts() {
  const { data, error } = await supab.from('posts').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// usersを取得
export async function getUsers() {
  const { data, error } = await supab.from('users').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// categoriesを取得
export async function getCategories() {
  const { data, error } = await supab.from('categories').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// scenesを取得
export async function getScenes() {
  const { data, error } = await supab.from('scenes').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

// relationsを取得
export async function getRelations() {
  const { data, error } = await supab.from('relations').select('*');
  if (error) {
    console.error(error);
    return [];
  }
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

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

// APIキーを取得
async function getApiKey(name) {
  const { data, error } = await supab.from('APIkey').select('key').eq('name', name);
  if (error) {
    console.error('Failed to fetch API key:', error);
    return null;
  }
  if (!data || data.length === 0) {
    return null;
  }
  return data[0].key || null;
}

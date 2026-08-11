import { supabase, isSupabaseConfigured } from './supabase';
import { PromptHistoryItem } from '../types';

const LOCAL_STORAGE_KEY = 'schrodinger_prompt_history';

// Default initial sample prompt history items for immediate user preview
const DEFAULT_SAMPLE_HISTORY: PromptHistoryItem[] = [
  {
    id: 'sample_1',
    prompt: 'Editorial magazine fashion portrait in monochrome high contrast lighting',
    aspectRatio: '1:1',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    source: 'gemini',
    isFavorite: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'sample_2',
    prompt: '3D architectural blueprint render of an obsidian library with warm interior spotlighting',
    aspectRatio: '16:9',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    source: 'gemini',
    isFavorite: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'sample_3',
    prompt: 'Minimalist typography artwork with serif headlines on vintage cream paper canvas',
    aspectRatio: '9:16',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    source: 'gemini',
    isFavorite: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export async function fetchPromptHistory(userId?: string): Promise<PromptHistoryItem[]> {
  // If Supabase is configured and connected, try fetching from table `prompt_history`
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('prompt_history').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          prompt: d.prompt,
          aspectRatio: d.aspect_ratio || '1:1',
          imageUrl: d.image_url,
          source: d.source || 'gemini',
          isFavorite: d.is_favorite || false,
          createdAt: d.created_at
        }));
      }
    } catch (e) {
      console.warn('Supabase prompt_history fetch fallback to local:', e);
    }
  }

  // Fallback to local storage
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_HISTORY));
    return DEFAULT_SAMPLE_HISTORY;
  }
  try {
    const items: PromptHistoryItem[] = JSON.parse(stored);
    return items;
  } catch (e) {
    return DEFAULT_SAMPLE_HISTORY;
  }
}

export async function addPromptHistoryItem(
  item: Omit<PromptHistoryItem, 'id' | 'createdAt'>,
  userId?: string
): Promise<PromptHistoryItem> {
  const resolvedUserId = userId || 'guest';
  const newItem: PromptHistoryItem = {
    ...item,
    id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: resolvedUserId,
    isFavorite: false,
    createdAt: new Date().toISOString()
  };

  // 1. Save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('prompt_history').insert({
        id: newItem.id,
        user_id: resolvedUserId,
        prompt: item.prompt,
        aspect_ratio: item.aspectRatio,
        image_url: item.imageUrl,
        source: item.source,
        is_favorite: false,
        created_at: newItem.createdAt
      });
    } catch (e) {
      console.warn('Supabase prompt history insert notice:', e);
    }
  }

  // 2. Save to localStorage
  const existing = await fetchPromptHistory(userId);
  const updated = [newItem, ...existing];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

  return newItem;
}

export async function toggleFavoritePrompt(id: string, userId?: string): Promise<PromptHistoryItem[]> {
  const current = await fetchPromptHistory(userId);
  const updated = current.map((item) => {
    if (item.id === id) {
      const isFav = !item.isFavorite;
      if (isSupabaseConfigured && supabase && id.startsWith('ph_')) {
        supabase.from('prompt_history').update({ is_favorite: isFav }).eq('id', id).then();
      }
      return { ...item, isFavorite: isFav };
    }
    return item;
  });

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deletePromptHistoryItem(id: string, userId?: string): Promise<PromptHistoryItem[]> {
  const current = await fetchPromptHistory(userId);
  const updated = current.filter((item) => item.id !== id);

  if (isSupabaseConfigured && supabase && id.startsWith('ph_')) {
    supabase.from('prompt_history').delete().eq('id', id).then();
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearAllPromptHistory(userId?: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      if (userId) {
        await supabase.from('prompt_history').delete().eq('user_id', userId);
      }
    } catch (e) {
      // ignore
    }
  }
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

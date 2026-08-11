export interface ToolItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  category: string;
  icon: string;
}

export interface ContentRow {
  id: string;
  date: string;
  platform: 'YouTube' | 'Instagram' | 'X (Twitter)' | 'TikTok';
  theme: string;
  snippet: string;
  status: 'Drafted' | 'Approved' | 'Scheduled';
}

export interface N8nWorkflow {
  id: string;
  name: string;
  status: 'active' | 'paused';
  lastRun: string;
  executionsCount: number;
  webhookPath: string;
}

export interface WeatherInfo {
  city: string;
  tempC: number;
  tempF: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  forecast: Array<{
    day: string;
    tempC: number;
    tempF: number;
    condition: string;
  }>;
}

export interface RoutineItem {
  time: string;
  activity: string;
  category: 'Strategy' | 'Creation' | 'Editing' | 'Analytics' | 'Rest';
  description: string;
}

export interface CreatorRoutine {
  niche: string;
  frequency: string;
  hoursPerDay: string;
  summary: string;
  items: RoutineItem[];
}

export interface ScriptSection {
  heading: string;
  narration: string;
  direction: string;
}

export interface GeneratedScript {
  title: string;
  hook: string;
  sections: ScriptSection[];
  outro: string;
}

export interface PromptHistoryItem {
  id: string;
  userId?: string;
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16';
  imageUrl: string;
  source: string;
  isFavorite?: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: 'supabase' | 'email' | 'google' | 'github' | 'guest';
}

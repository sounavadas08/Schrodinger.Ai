-- Create prompt_history table
CREATE TABLE IF NOT EXISTS prompt_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    aspect_ratio TEXT DEFAULT '1:1',
    image_url TEXT NOT NULL,
    source TEXT DEFAULT 'gemini',
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) but allow all operations for development/testing
-- (In production, restrict using auth.uid() matching user_id)
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development
CREATE POLICY "Enable read access for all users" ON prompt_history
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON prompt_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON prompt_history
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON prompt_history
    FOR DELETE USING (true);

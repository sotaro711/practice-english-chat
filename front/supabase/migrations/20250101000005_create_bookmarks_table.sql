-- Create bookmarks table for storing user's saved learning content
-- Note: This references messages directly as per the DB design document
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- Create indexes for better performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_message_id ON bookmarks(message_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own bookmarks
CREATE POLICY "Users can access their own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

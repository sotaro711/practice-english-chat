-- Create ai_suggestions table for storing AI-generated English expression suggestions
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  english_text TEXT NOT NULL,
  japanese_translation TEXT NOT NULL,
  suggestion_order INTEGER NOT NULL CHECK (suggestion_order BETWEEN 1 AND 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, suggestion_order)
);

-- Create indexes for better performance
CREATE INDEX idx_ai_suggestions_message_id ON ai_suggestions(message_id);

-- Enable Row Level Security
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access suggestions in their own conversations
CREATE POLICY "Users can access suggestions in their conversations" ON ai_suggestions
  FOR ALL USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

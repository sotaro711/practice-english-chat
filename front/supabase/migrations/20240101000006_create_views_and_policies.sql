-- Create view for bookmark listing with related information
CREATE OR REPLACE VIEW user_bookmarks_view AS
SELECT
  b.id as bookmark_id,
  b.user_id,
  b.created_at as bookmarked_at,
  s.id as suggestion_id,
  s.english_text,
  s.japanese_translation,
  s.suggestion_order,
  m.id as message_id,
  c.id as conversation_id,
  c.title as conversation_title
FROM bookmarks b
JOIN ai_suggestions s ON b.ai_suggestion_id = s.id
JOIN messages m ON s.message_id = m.id
JOIN conversations c ON m.conversation_id = c.id
ORDER BY b.created_at DESC;

-- Enable RLS on the view
ALTER VIEW user_bookmarks_view OWNER TO postgres;

-- Grant necessary permissions
GRANT SELECT ON user_bookmarks_view TO authenticated;
GRANT SELECT ON user_bookmarks_view TO anon;

-- Note: RLS policies are applied to the underlying tables (bookmarks, ai_suggestions, messages, conversations)
-- The view will automatically respect the RLS policies of the underlying tables

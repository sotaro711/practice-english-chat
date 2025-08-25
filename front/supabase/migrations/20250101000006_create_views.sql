-- Create user_bookmarks_view for displaying bookmark list with message details
-- This view joins bookmarks with messages and conversations to provide comprehensive bookmark information
CREATE OR REPLACE VIEW user_bookmarks_view AS
SELECT
  b.id as bookmark_id,
  b.user_id,
  b.created_at as bookmarked_at,
  m.id as message_id,
  m.content as message_content,
  m.role as message_role,
  c.id as conversation_id,
  c.title as conversation_title
FROM bookmarks b
JOIN messages m ON b.message_id = m.id
JOIN conversations c ON m.conversation_id = c.id
ORDER BY b.created_at DESC;

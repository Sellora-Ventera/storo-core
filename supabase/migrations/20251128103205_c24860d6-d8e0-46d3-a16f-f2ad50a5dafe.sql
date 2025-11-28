-- Update all blog posts to ensure proper paragraph spacing
-- Replace single line breaks between paragraphs with double line breaks
UPDATE blog_posts
SET content = regexp_replace(
  regexp_replace(
    content,
    E'([^\\n])\\n([^\\n#*-])',  -- Single line break between text (not headers/lists)
    E'\\1\n\n\\2',
    'g'
  ),
  E'\\n{3,}',  -- Replace 3+ newlines with just 2
  E'\n\n',
  'g'
),
updated_at = now()
WHERE content IS NOT NULL;
-- Create content table
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blog', 'analysis', 'recommendation')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'rejected')),
  scheduled_publish_date TIMESTAMP WITH TIME ZONE,
  published_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content analytics table
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  engagement INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for content status
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);

-- Create index for content type
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);

-- Create index for scheduled publish date
CREATE INDEX IF NOT EXISTS idx_content_scheduled_publish_date ON content(scheduled_publish_date);

-- Create index for published date
CREATE INDEX IF NOT EXISTS idx_content_published_date ON content(published_date);

-- Create index for content analytics content_id
CREATE INDEX IF NOT EXISTS idx_content_analytics_content_id ON content_analytics(content_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for content table
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for content_analytics table
CREATE TRIGGER update_content_analytics_updated_at
  BEFORE UPDATE ON content_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all content
CREATE POLICY "Allow authenticated users to read content"
  ON content FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to read all content analytics
CREATE POLICY "Allow authenticated users to read content analytics"
  ON content_analytics FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to manage content
CREATE POLICY "Allow service role to manage content"
  ON content FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to manage content analytics
CREATE POLICY "Allow service role to manage content analytics"
  ON content_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 
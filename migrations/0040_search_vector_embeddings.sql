-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings table for semantic search
CREATE TABLE IF NOT EXISTS search_embeddings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR NOT NULL,
  content_hash VARCHAR NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON search_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Index for entity lookup
CREATE INDEX IF NOT EXISTS idx_embeddings_entity ON search_embeddings (entity_type, entity_id);

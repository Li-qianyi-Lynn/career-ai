import fs from 'fs'
import OpenAI from 'openai'
import path from 'path'

export type DocChunk = {
  id: string
  file: string
  text: string
  embedding?: number[]
}

const EMBEDDINGS_PATH = path.join(process.cwd(), 'knowledge-base', 'embeddings.json')
const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'knowledge-base')

/** Split markdown by sections (## or ###) into chunks, with source file name */
export function chunkMarkdown(content: string, filename: string): { file: string; text: string }[] {
  const chunks: { file: string; text: string }[] = []
  const sections = content.split(/(?=^#{2,3}\s)/m).filter(Boolean)

  for (const section of sections) {
    const trimmed = section.trim()
    if (trimmed.length < 20) continue
    chunks.push({ file: filename, text: trimmed })
  }

  if (chunks.length === 0 && content.trim().length >= 20) {
    chunks.push({ file: filename, text: content.trim() })
  }
  return chunks
}

/** Load all .md files from knowledge-base and return chunked items */
export function loadAndChunkKnowledgeBase(): { file: string; text: string }[] {
  const allChunks: { file: string; text: string }[] = []
  const files = fs.readdirSync(KNOWLEDGE_BASE_DIR)

  for (const file of files) {
    if (!file.endsWith('.md') || file === 'embeddings.json') continue
    const filePath = path.join(KNOWLEDGE_BASE_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const chunks = chunkMarkdown(content, file)
    allChunks.push(...chunks)
  }
  return allChunks
}

/** Load pre-computed embeddings from disk */
export function loadEmbeddings(): DocChunk[] {
  try {
    const raw = fs.readFileSync(EMBEDDINGS_PATH, 'utf-8')
    const data = JSON.parse(raw) as DocChunk[]
    if (!Array.isArray(data) || data.some((d) => !d.embedding)) return []
    return data
  } catch {
    return []
  }
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/** Get embedding for a single text using OpenAI */
export async function embedText(text: string, openai: OpenAI): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return res.data[0].embedding
}

/** Retrieve top-k most relevant chunks for a query (uses pre-computed embeddings) */
export async function retrieve(
  query: string,
  options: { topK?: number; openai: OpenAI }
): Promise<DocChunk[]> {
  const { topK = 6, openai } = options
  const chunks = loadEmbeddings()
  if (chunks.length === 0) return []

  const queryEmbedding = await embedText(query, openai)
  const withScore = chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(chunk.embedding!, queryEmbedding),
  }))
  withScore.sort((a, b) => b.score - a.score)
  return withScore.slice(0, topK).map((x) => x.chunk)
}

/** Build context string from retrieved chunks for the system prompt */
export function buildContextFromChunks(chunks: DocChunk[]): string {
  const byFile = new Map<string, string[]>()
  for (const c of chunks) {
    if (!byFile.has(c.file)) byFile.set(c.file, [])
    byFile.get(c.file)!.push(c.text)
  }
  const parts: string[] = []
  for (const [file, texts] of Array.from(byFile.entries())) {
    parts.push(`\n\n## ${file}\n${texts.join('\n\n')}`)
  }
  return parts.join('')
}

/** Fallback: full knowledge base as before (when RAG not configured) */
export function loadFullKnowledgeBase(): string {
  let knowledgeContent = ''
  try {
    const files = fs.readdirSync(KNOWLEDGE_BASE_DIR)
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(KNOWLEDGE_BASE_DIR, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        knowledgeContent += `\n\n## ${file}\n${content}`
      }
    }
  } catch (error) {
    console.error('Error loading knowledge base:', error)
  }
  return knowledgeContent
}

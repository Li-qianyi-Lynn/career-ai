/**
 * Generate embeddings for knowledge-base markdown files and save to knowledge-base/embeddings.json
 * Run: npm run generate-embeddings
 * Requires OPENAI_API_KEY in .env.local or environment.
 */

import path from 'path'
import { config } from 'dotenv'
import fs from 'fs'

// Load .env.local from project root (npm run sets cwd to root)
config({ path: path.join(process.cwd(), '.env.local') })

import OpenAI from 'openai'
import {
  loadAndChunkKnowledgeBase,
  embedText,
  type DocChunk,
} from '../lib/rag'

const EMBEDDINGS_PATH = path.join(process.cwd(), 'knowledge-base', 'embeddings.json')

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY. Set it in .env.local or environment.')
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey })
  const chunks = loadAndChunkKnowledgeBase()
  console.log(`Chunked ${chunks.length} sections from knowledge-base.`)

  const docChunks: DocChunk[] = []
  for (let i = 0; i < chunks.length; i++) {
    const { file, text } = chunks[i]
    const embedding = await embedText(text, openai)
    docChunks.push({
      id: `${file}-${i}`,
      file,
      text,
      embedding,
    })
    console.log(`  Embedded ${i + 1}/${chunks.length}: ${file}`)
  }

  fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(docChunks, null, 0), 'utf-8')
  console.log(`Wrote ${docChunks.length} embeddings to knowledge-base/embeddings.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

# Knowledge Base

Markdown files in this directory are used by the chat API to answer questions about Rise2gether and career development.

## RAG (Retrieval-Augmented Generation)

The project uses **RAG** for semantic search: only the document chunks most relevant to the user’s question are injected into the model context, instead of loading the full knowledge base every time. This saves tokens and improves answer accuracy.

### How to use

1. **Install dependencies** (includes `openai` and `tsx`):
   ```bash
   npm install
   ```

2. **Configure environment variables**  
   Add your OpenAI API key to `.env.local` (used for generating embeddings and query-time retrieval):
   ```
   OPENAI_API_KEY=sk-...
   ```

3. **Generate embeddings**  
   After adding, removing, or editing any `.md` file in this directory, run from the project root:
   ```bash
   npm run generate-embeddings
   ```  
   This creates `embeddings.json` in this directory (containing vectors for each chunk). The chat API reads it for retrieval.

4. **Deployment**  
   - If you commit and deploy `embeddings.json`, you don’t need to run `generate-embeddings` in production; set `OPENAI_API_KEY` in the deployment environment for retrieval to work.  
   - If you don’t commit `embeddings.json`, run `npm run generate-embeddings` in CI or locally before deploying, or run it once on the deployed instance after deploy.

### When RAG is not enabled

If `OPENAI_API_KEY` is not set or `embeddings.json` has not been generated, the chat API falls back to loading all `.md` content under `knowledge-base/`, so the app still works.

# Rise2gether AI Chatbot

Rise2gether Career Development AI Chatbot MVP

## Features

- 🤖 Intelligent conversations powered by Claude API
- 📚 Accurate answers based on knowledge base (no fabricated information)
- 💬 Modern chat interface
- 🎯 Focused on Rise2gether and career development questions

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Anthropic Claude API
- Custom CSS

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file and add your Claude API Key:

```env
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Knowledge Base

Knowledge base documents are located in the `knowledge-base/` directory, currently including:

- `rise2gether-info.md` - Rise2gether basic information

You can add more documents at any time to expand the knowledge base.

## Project Structure

```
career-chatbot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # Claude API calls
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/
│   └── ChatInterface.tsx     # Chat interface component
├── knowledge-base/           # Knowledge base documents
│   
└── package.json
```

## Usage

1. After starting the application, enter your questions in the chat interface
2. The AI Career Coach will answer questions about Rise2gether and career development based on the knowledge base
3. If the knowledge base doesn't contain relevant information, the AI will honestly inform you

## Notes

- Make sure to set the correct `ANTHROPIC_API_KEY` environment variable
- Knowledge base documents use Markdown format
- AI only answers based on knowledge base content and will not fabricate information

## Next Steps

- [ ] Add more knowledge base documents (guest speaker content, etc.)
- [ ] Implement vector database for improved retrieval accuracy
- [ ] Add conversation history persistence
- [ ] Optimize mobile experience
- [ ] Add streaming responses

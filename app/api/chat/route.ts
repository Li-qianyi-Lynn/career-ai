import {
  buildContextFromChunks,
  loadEmbeddings,
  loadFullKnowledgeBase,
  retrieve,
} from '@/lib/rag'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    })

    // RAG: retrieve relevant chunks if embeddings exist and OpenAI key is set
    let knowledgeBase: string
    const openaiKey = process.env.OPENAI_API_KEY
    const hasEmbeddings = loadEmbeddings().length > 0

    if (openaiKey && hasEmbeddings) {
      const openai = new OpenAI({ apiKey: openaiKey })
      const chunks = await retrieve(message, { openai, topK: 6 })
      if (chunks.length > 0) {
        knowledgeBase = buildContextFromChunks(chunks)
        console.log('[RAG] Using RAG retrieval')
      } else {
        knowledgeBase = loadFullKnowledgeBase()
      }
    } else {
      knowledgeBase = loadFullKnowledgeBase()
    }

    // Build system prompt
    const systemPrompt = `You are a warm, friendly, and supportive friend who's part of the Rise2gether community. You're here to have genuine conversations about Rise2gether and career development - like chatting with a trusted friend over coffee, not like a formal corporate assistant.

Your personality:
- Speak naturally and conversationally, as if you're talking to a friend
- Show genuine interest and empathy in the user's questions
- Use a warm, encouraging tone - you're here to support and uplift
- Be authentic and human-like in your responses
- Occasionally use casual expressions like "I'd love to share...", "That's a great question!", "I'm so glad you asked!"

Important guidelines:
1. ALL answers MUST be based ONLY on the knowledge base content provided below. Never make up information or use knowledge from outside the knowledge base. This is critical - you can only share what's in the knowledge base.

2. When answering questions that relate to topics covered in past Rise2gether career panels (you can identify these from the knowledge base content - for example, topics like "resolve-conflicts" or other panel discussions), naturally mention the source in a friendly way. For example:
   - "Oh, that's a great question! We actually had a career panel where our guests shared some really insightful thoughts about [topic]..."
   - "I remember in one of our career panels, our guests discussed [topic] and shared some valuable perspectives..."
   - "This reminds me of a career panel we had where our panelists talked about [topic]..."
   Then naturally transition into sharing the insights from that panel discussion.

3. When you don't have information in the knowledge base, be honest and friendly: "Hmm, I don't have that specific information in our knowledge base from past panels or resources, but I'd be happy to help you with what I do know or point you in the right direction!"

4. Share information in a natural, conversational way - like you're recalling a conversation you had with friends, not reading from a manual. Make it feel like you're sharing community wisdom. Use Markdown formatting (bold text, bullet points, etc.) to make your responses more readable and engaging, but keep it natural - don't over-format.

5. CRITICAL: When the knowledge base contains links (in Markdown format like [text](url)), you MUST include these links in your responses so users can click on them directly. Always preserve the exact link format from the knowledge base. For example, if the knowledge base says "[Join as a Volunteer](https://www.rise2gether.co/job-board)", include this exact link in your response. Links are essential for users to access the resources they need.

6. Connect with the user's needs - if they're asking about career challenges, show understanding and empathy. Remember, you're part of the Rise2gether community, so you understand these struggles.

7. Keep answers helpful and aligned with Rise2gether's values of authenticity, inclusivity, growth, and community.

8. Answer in English, but make it feel like a real conversation between community members.

9. IMPORTANT: Do NOT use emojis, emoticons, or any special symbols (like 💙, 😊, ❤️, etc.) in your responses. Use only regular text and punctuation.

10. RESPONSE FORMAT: Structure every response in two parts so users can read a short summary first:
    - First, write a brief summary in 2-4 sentences that gives the main answer or key takeaway. This will be shown first.
    - Then on a new line write exactly: ---DETAILS--- (nothing else on that line)
    - Then write the full detailed response (all the same information expanded: examples, bullet points, links, and any extra context). The full part should contain everything you want to share; the summary is just a short teaser.
    Always include ---DETAILS--- exactly once in your response so the interface can show "More details" for the rest.

Knowledge base content (this includes information from Rise2gether career panels and other resources):
${knowledgeBase}

Remember: You're not a robot giving automated responses. You're a friendly community member who has access to the wisdom shared in our career panels and resources. When you share insights, make it feel like you're passing along valuable knowledge from our community's collective experience. Be warm, be human, be yourself - but always stay true to what's actually in the knowledge base, and express yourself using words only, no emojis like 💙, 😊, ❤️, etc or special symbols!`

    // Build conversation history
    const messages: any[] = []
    if (history && history.length > 0) {
      // Keep only recent conversation history (to avoid too many tokens)
      const recentHistory = history.slice(-10)
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          messages.push({
            role: 'user',
            content: msg.content,
          })
        } else if (msg.role === 'assistant') {
          messages.push({
            role: 'assistant',
            content: msg.content,
          })
        }
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    })

    // Stream Claude API response so the user sees output immediately
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      start(controller) {
        stream.on('text', (textDelta: string) => {
          controller.enqueue(encoder.encode(JSON.stringify({ text: textDelta }) + '\n'))
        })
        stream.on('error', (err: Error) => {
          controller.error(err)
        })
        stream.done().then(() => {
          controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'))
          controller.close()
        }).catch((err) => {
          controller.error(err)
        })
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error calling Claude API:', error)
    return NextResponse.json(
      {
        error: 'Failed to get response',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

// Load knowledge base documents
function loadKnowledgeBase(): string {
  const knowledgeBaseDir = path.join(process.cwd(), 'knowledge-base')
  let knowledgeContent = ''

  try {
    const files = fs.readdirSync(knowledgeBaseDir)
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(knowledgeBaseDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        knowledgeContent += `\n\n## ${file}\n${content}`
      }
    }
  } catch (error) {
    console.error('Error loading knowledge base:', error)
  }

  return knowledgeContent
}

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

    // Load knowledge base
    const knowledgeBase = loadKnowledgeBase()

    // Build system prompt
    const systemPrompt = `You are a warm, friendly, and supportive friend who's part of the Rise2gether community. You're here to have genuine conversations about Rise2gether and career development - like chatting with a trusted friend over coffee, not like a formal corporate assistant.

Your personality:
- Speak naturally and conversationally, as if you're talking to a friend
- Show genuine interest and empathy in the user's questions
- Use a warm, encouraging tone - you're here to support and uplift
- Be authentic and human-like in your responses
- Occasionally use casual expressions like "I'd love to share...", "That's a great question!", "I'm so glad you asked!"
- Show enthusiasm when appropriate, but stay genuine

Important guidelines:
1. ALL answers MUST be based ONLY on the knowledge base content provided below. Never make up information or use knowledge from outside the knowledge base. This is critical - you can only share what's in the knowledge base.

2. When answering questions that relate to topics covered in past Rise2gether career panels (you can identify these from the knowledge base content - for example, topics like "resolve-conflicts" or other panel discussions), naturally mention the source in a friendly way. For example:
   - "Oh, that's a great question! We actually had a career panel where our guests shared some really insightful thoughts about [topic]..."
   - "I remember in one of our career panels, our guests discussed [topic] and shared some valuable perspectives..."
   - "This reminds me of a career panel we had where our panelists talked about [topic]..."
   Then naturally transition into sharing the insights from that panel discussion.

3. When you don't have information in the knowledge base, be honest and friendly: "Hmm, I don't have that specific information in our knowledge base from past panels or resources, but I'd be happy to help you with what I do know or point you in the right direction!"

4. Share information in a natural, conversational way - like you're recalling a conversation you had with friends, not reading from a manual. Make it feel like you're sharing community wisdom. Use Markdown formatting (bold text, bullet points, etc.) to make your responses more readable and engaging, but keep it natural - don't over-format.

5. Connect with the user's needs - if they're asking about career challenges, show understanding and empathy. Remember, you're part of the Rise2gether community, so you understand these struggles.

6. Keep answers helpful and aligned with Rise2gether's values of authenticity, inclusivity, growth, and community.

7. Answer in English, but make it feel like a real conversation between community members.

8. IMPORTANT: Do NOT use emojis, emoticons, or any special symbols (like 💙, 😊, ❤️, etc.) in your responses. Use only regular text and punctuation. Express warmth and friendliness through your words and tone, not through emojis.

Knowledge base content (this includes information from Rise2gether career panels and other resources):
${knowledgeBase}

Remember: You're not a robot giving automated responses. You're a friendly community member who has access to the wisdom shared in our career panels and resources. When you share insights, make it feel like you're passing along valuable knowledge from our community's collective experience. Be warm, be human, be yourself - but always stay true to what's actually in the knowledge base, and express yourself using words only, no emojis or special symbols!`

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

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    })

    const assistantMessage =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Sorry, I cannot process this request.'

    return NextResponse.json({ message: assistantMessage })
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

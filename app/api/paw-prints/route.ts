import { PawPrint, PAW_PRINT_TYPES } from '@/lib/paw-prints'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

const TABLE = 'paw_prints'

function rowToPawPrint(row: {
  id: string
  type: string
  content: string
  nickname: string | null
  created_at: string
}): PawPrint {
  return {
    id: row.id,
    type: row.type as PawPrint['type'],
    content: row.content,
    nickname: row.nickname ?? undefined,
    createdAt: row.created_at,
  }
}

/** GET: Fetch all paw prints, newest first */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, type, content, nickname, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    const list = (data ?? []).map(rowToPawPrint)
    return NextResponse.json(list)
  } catch (e) {
    console.error('paw-prints GET', e)
    return NextResponse.json(
      { error: 'Failed to load paw prints' },
      { status: 500 }
    )
  }
}

/** POST: Create a new paw print */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, content, nickname } = body

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Please write something before leaving a paw print.' },
        { status: 400 }
      )
    }
    if (!PAW_PRINT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Please choose a paw print type.' },
        { status: 400 }
      )
    }

    const row = {
      type,
      content: content.trim().slice(0, 2000),
      nickname:
        typeof nickname === 'string' && nickname.trim()
          ? nickname.trim().slice(0, 32)
          : null,
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('id, type, content, nickname, created_at')
      .single()

    if (error) throw error
    return NextResponse.json(rowToPawPrint(data))
  } catch (e) {
    console.error('paw-prints POST', e)
    return NextResponse.json(
      { error: 'Failed to save paw print' },
      { status: 500 }
    )
  }
}

'use client'

import { useState, useRef, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <div className="container">
      <ChatInterface />
    </div>
  )
}

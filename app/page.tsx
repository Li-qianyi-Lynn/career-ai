'use client'

import ChatInterface from '@/components/ChatInterface'
import PawPrints from '@/components/PawPrints'

export default function Home() {
  return (
    <div className="container">
      <ChatInterface />
      <PawPrints />
    </div>
  )
}

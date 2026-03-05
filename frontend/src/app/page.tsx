'use client';

import React, { useState } from 'react';
import Shell from '@/components/layout/Shell';
import Chat from '@/components/views/Chat';
import Library from '@/components/views/Library';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'library'>('chat');

  return (
    <Shell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'chat' ? <Chat /> : <Library />}
    </Shell>
  );
}

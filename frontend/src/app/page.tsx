'use client';

import React, { useState, useEffect } from 'react';
import Shell from '@/components/layout/Shell';
import Chat from '@/components/views/Chat';
import Library from '@/components/views/Library';
import { generateChatTitle } from '@/utils/api';

export interface Message {
    id: string;
    text: string;
    role: 'user' | 'ai';
    timestamp: number;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

export default function Home() {
    const [activeTab, setActiveTab] = useState<'chat' | 'library'>('chat');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sidequest_sessions');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSessions(parsed);
                if (parsed.length > 0) {
                    setActiveSessionId(parsed[0].id);
                }
            } catch (e) {
                console.error("Failed parsing sessions", e);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('sidequest_sessions', JSON.stringify(sessions));
        }
    }, [sessions, isLoaded]);

    const handleNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            updatedAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setActiveTab('chat');
    };

    const handleUpdateMessages = (sessionId: string, newMessages: Message[]) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                // Auto-title on first user message
                if (s.messages.length === 0 && newMessages.length > 0 && newMessages[0].role === 'user') {
                    
                    // Fetch real AI title asynchronously
                    generateChatTitle(newMessages[0].text)
                        .then(aiTitle => {
                            setSessions(currSessions => currSessions.map(session => 
                                session.id === sessionId ? { ...session, title: aiTitle } : session
                            ));
                        })
                        .catch(err => console.error("Error generating title:", err));

                    // Sync fallback while loading
                    const tempTitle = newMessages[0].text.substring(0, 30) + '...';
                    return { ...s, messages: newMessages, title: tempTitle, updatedAt: Date.now() };
                }
                
                return { ...s, messages: newMessages, updatedAt: Date.now() };
            }
            return s;
        }));
    };

    const activeSession = sessions.find(s => s.id === activeSessionId) || null;

    return (
        <Shell 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={(id) => { setActiveSessionId(id); setActiveTab('chat'); }}
            onNewChat={handleNewChat}
        >
            <div style={{ display: activeTab === 'chat' ? 'contents' : 'none' }}>
                <Chat 
                    onOpenLibrary={() => setActiveTab('library')} 
                    session={activeSession}
                    onUpdateMessages={(messages) => activeSessionId && handleUpdateMessages(activeSessionId, messages)}
                />
            </div>
            <div style={{ display: activeTab === 'library' ? 'contents' : 'none' }}>
                <Library />
            </div>
        </Shell>
    );
}

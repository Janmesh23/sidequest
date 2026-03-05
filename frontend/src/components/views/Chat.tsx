'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Chat.module.css';
import {
    Send,
    User,
    Sparkles,
    Quote,
    Search,
    MessageSquareOff
} from 'lucide-react';
import { queryDocument } from '@/utils/api';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    citations?: { source: string; page?: number }[];
}

export default function Chat() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const userId = (session?.user as any)?.id || "user_1";

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping || !session) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await queryDocument(userMessage.text, userId);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: response.answer,
                citations: response.citations || []
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            console.error(err);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: "I'm sorry, I encountered an error while processing your request. Please ensure you have uploaded documents and try again.",
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={styles.chatContainer}>
            {messages.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className="glass" style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)',
                        marginBottom: '16px'
                    }}>
                        <Sparkles size={32} />
                    </div>
                    <h2>How can I help you today, {session?.user?.name || 'Friend'}?</h2>
                    <p>Ask a question about your uploaded documents to get started.</p>
                </div>
            ) : (
                <div className={styles.messages} ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={styles.message}>
                            <div className={`${styles.avatar} ${msg.role === 'user' ? styles.userAvatar : styles.aiAvatar}`}>
                                {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
                            </div>
                            <div className={styles.messageContent}>
                                <span className={styles.author}>
                                    {msg.role === 'user' ? 'You' : 'SideQuest AI'}
                                </span>
                                <div className={styles.markdownWrapper}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className={styles.message}>
                            <div className={`${styles.avatar} ${styles.aiAvatar}`}>
                                <Sparkles size={18} />
                            </div>
                            <div className={styles.messageContent}>
                                <span className={styles.author}>SideQuest AI</span>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                    <span className="dot-typing"></span>
                                    <span className="dot-typing"></span>
                                    <span className="dot-typing"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={styles.inputArea}>
                <div className={`${styles.inputWrapper} glass`}>
                    <textarea
                        className={styles.input}
                        placeholder="Ask a question..."
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: '12px'
                }}>
                    SideQuest can make mistakes. Verify important information.
                </p>
            </div>
        </div>
    );
}

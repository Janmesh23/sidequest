'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Chat.module.css';
import {
    Send,
    User,
    Zap,
    PlusCircle,
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

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Morning";
        if (hour < 18) return "Afternoon";
        return "Evening";
    };

    return (
        <div className={styles.chatContainer}>
            {messages.length === 0 ? (
                <div className={styles.emptyState}>
                    <h1 className={styles.greeting}>
                        {getTimeGreeting()}, {session?.user?.name || 'Friend'}
                    </h1>

                    <div className={styles.inputArea} style={{ width: '100%', maxWidth: '640px' }}>
                        <div className={styles.inputWrapper}>
                            <textarea
                                className={styles.input}
                                placeholder="How can I help you today?"
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
                            <div className={styles.inputControls}>
                                <div className={styles.ctrlGroup}>
                                    <div className={styles.iconBtn} title="Upload context">
                                        <PlusCircle size={18} />
                                    </div>
                                    <div className={styles.modelSelector}>
                                        <Zap size={14} />
                                        <span>SideQuest Sonnet 1.0</span>
                                        <Quote size={12} style={{ opacity: 0.5 }} />
                                    </div>
                                </div>
                                <button
                                    className={styles.sendBtn}
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isTyping}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                            {['Code', 'Learn', 'Write', 'Analyze'].map(tag => (
                                <div key={tag} className={styles.modelSelector} style={{ borderRadius: '8px', padding: '6px 12px' }}>
                                    <span style={{ fontSize: '13px' }}>{tag}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.messages} ref={scrollRef}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={styles.message}>
                                <div className={styles.avatar}>
                                    {msg.role === 'user' ? <User size={20} /> : <Zap size={20} />}
                                </div>
                                <div className={styles.messageContent}>
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
                                <div className={styles.avatar}>
                                    <Zap size={20} />
                                </div>
                                <div className={styles.messageContent}>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                        <span className="dot-typing"></span>
                                        <span className="dot-typing"></span>
                                        <span className="dot-typing"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.inputArea} style={{ paddingBottom: '32px' }}>
                        <div className={styles.inputWrapper}>
                            <textarea
                                className={styles.input}
                                placeholder="Reply to SideQuest..."
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
                            <div className={styles.inputControls}>
                                <div className={styles.ctrlGroup}>
                                    <div className={styles.iconBtn}>
                                        <PlusCircle size={18} />
                                    </div>
                                    <div className={styles.modelSelector}>
                                        <span>Sonnet v1</span>
                                    </div>
                                </div>
                                <button
                                    className={styles.sendBtn}
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isTyping}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

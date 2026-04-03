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

import { ChatSession, Message } from '@/app/page';

interface ChatProps {
    onOpenLibrary: () => void;
    session: ChatSession | null;
    onUpdateMessages: (messages: Message[]) => void;
}

export default function Chat({ onOpenLibrary, session, onUpdateMessages }: ChatProps) {
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { data: sessionAuth } = useSession();
    const userId = (sessionAuth?.user as any)?.id || "user_1";
    
    // We bind local messages reference to the session prop so it updates automatically
    const messages = session?.messages || [];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping || !session) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue.trim(),
            timestamp: Date.now()
        };

        // Create updated list
        const updatedMessages = [...messages, newMessage];
        onUpdateMessages(updatedMessages);
        setInputValue('');
        
        setIsTyping(true);

        try {
            const response = await queryDocument(newMessage.text, userId);
            
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.answer,
                role: 'ai',
                timestamp: Date.now()
            };
            
            onUpdateMessages([...updatedMessages, aiMessage]);
        } catch (error) {
            console.error("Query failed", error);
            
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I ran into an error connecting to the intelligence server. Please try again or check your backend connection.",
                role: 'ai',
                timestamp: Date.now()
            };
            onUpdateMessages([...updatedMessages, errorMessage]);
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
            <div className={styles.messages} ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h1 className={styles.greeting}>
                            {getTimeGreeting()}, {sessionAuth?.user?.name || 'Friend'}
                        </h1>
                    </div>
                ) : (
                    <div className={styles.messageThread}>
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
                            <div className={styles.iconBtn} title="Upload context" onClick={onOpenLibrary} style={{ cursor: 'pointer' }}>
                                <PlusCircle size={18} />
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
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import styles from './Shell.module.css';
import {
    PlusCircle,
    MessageSquare,
    Library,
    Settings,
    FileText,
    CloudUpload,
    Search,
    Zap,
    User
} from 'lucide-react';
import { getDocuments, DocumentStatus } from '@/utils/api';
import { signOut, useSession } from 'next-auth/react';

import { ChatSession } from '@/app/page';

interface ShellProps {
    children: React.ReactNode;
    activeTab: 'chat' | 'library';
    onTabChange: (tab: 'chat' | 'library') => void;
    sessions?: ChatSession[];
    activeSessionId?: string | null;
    onSelectSession?: (id: string) => void;
    onNewChat?: () => void;
}

export default function Shell({ 
    children, 
    activeTab, 
    onTabChange,
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat
}: ShellProps) {
    const { data: session, status } = useSession();
    const [documents, setDocuments] = useState<DocumentStatus[]>([]);
    const userId = (session?.user as any)?.id;

    useEffect(() => {
        if (status !== 'authenticated' || !userId) return;

        const fetchDocs = async () => {
            try {
                const data = await getDocuments(userId);
                setDocuments(data);
            } catch (err) {
                console.error('Failed to fetch documents', err);
            }
        };

        fetchDocs();
        const interval = setInterval(fetchDocs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [status, userId]);

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login', redirect: true });
    };

    return (
        <div className={styles.shell}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Zap size={18} />
                    </div>
                    <span>SideQuest</span>
                </div>

                <nav className={styles.navSection}>
                    {onNewChat && (
                        <div className={styles.navItem} onClick={onNewChat} title="New Chat">
                            <PlusCircle size={20} />
                            <span>New Chat</span>
                        </div>
                    )}
                    <div
                        className={`${styles.navItem} ${activeTab === 'chat' ? styles.navItemActive : ''}`}
                        onClick={() => onTabChange('chat')}
                        title="Chat Workspace"
                    >
                        <MessageSquare size={20} />
                        <span>Chat Workspace</span>
                    </div>
                    <div
                        className={`${styles.navItem} ${activeTab === 'library' ? styles.navItemActive : ''}`}
                        onClick={() => onTabChange('library')}
                        title="Library"
                    >
                        <Library size={20} />
                        <span>Library</span>
                    </div>
                </nav>

                {sessions && sessions.length > 0 && (
                    <div className={styles.docList} style={{ marginTop: '24px' }}>
                        <div className={styles.sectionHeading}>Recent</div>
                        {sessions.map(s => (
                            <div 
                                key={s.id} 
                                className={`${styles.docItem} ${s.id === activeSessionId ? styles.activeDoc : ''}`}
                                onClick={() => onSelectSession && onSelectSession(s.id)}
                            >
                                <MessageSquare size={16} />
                                <span>{s.title}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.navSection} style={{ marginTop: 'auto' }}>
                    <div className={styles.navItem} onClick={handleLogout} title="Logout">
                        <Settings size={20} />
                        <span>Settings</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.searchBar}>
                        {/* Search placeholder */}
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        {/* Moved 'Add Context' to Chat input bar (+) icon */}
                    </div>
                </header>

                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}

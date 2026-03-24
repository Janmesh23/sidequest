'use client';

import React, { useEffect, useState } from 'react';
import styles from './Shell.module.css';
import {
    PlusCircle,
    MessageSquare,
    Library,
    LogOut,
    FileText,
    CloudUpload,
    Search,
    Zap,
    User
} from 'lucide-react';
import { getDocuments, DocumentStatus } from '@/utils/api';
import { signOut, useSession } from 'next-auth/react';

interface ShellProps {
    children: React.ReactNode;
    activeTab: 'chat' | 'library';
    onTabChange: (tab: 'chat' | 'library') => void;
}

export default function Shell({ children, activeTab, onTabChange }: ShellProps) {
    const { data: session, status } = useSession();
    const [documents, setDocuments] = useState<DocumentStatus[]>([]);
    const token = (session?.user as any)?.accessToken;

    useEffect(() => {
        if (status === 'authenticated' && !token) {
            // Force logout if they have a stale session cookie missing the new accessToken
            console.error("Stale session detected: Missing accessToken. Forcing logout.");
            signOut({ callbackUrl: '/login', redirect: true });
            return;
        }

        if (status !== 'authenticated' || !token) return;

        const fetchDocs = async () => {
            try {
                const data = await getDocuments(token);
                setDocuments(data);
            } catch (err) {
                console.error('Failed to fetch documents', err);
            }
        };

        fetchDocs();
        const interval = setInterval(fetchDocs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [status, token]);

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
                </div>

                <nav className={styles.navSection}>
                    <div
                        className={`${styles.navItem} ${activeTab === 'chat' ? styles.navItemActive : ''}`}
                        onClick={() => onTabChange('chat')}
                        title="Chat"
                    >
                        <MessageSquare size={20} />
                    </div>
                    <div
                        className={`${styles.navItem} ${activeTab === 'library' ? styles.navItemActive : ''}`}
                        onClick={() => onTabChange('library')}
                        title="Library"
                    >
                        <Library size={20} />
                    </div>
                </nav>

                <div className={styles.docList}>
                    {documents.slice(0, 5).map((doc) => (
                        <div key={doc.id} className={styles.docItem} title={doc.filename}>
                            <FileText size={18} />
                        </div>
                    ))}
                </div>

                <div className={styles.navSection} style={{ marginTop: 'auto' }}>
                    <div className={styles.navItem} title={session?.user?.name || "User"}>
                        <User size={20} />
                    </div>
                    <div className={styles.navItem} onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
                        <button style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 500,
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: '1px solid var(--border-primary)'
                        }} onClick={() => onTabChange('library')}>
                            <CloudUpload size={14} />
                            Add Context
                        </button>
                    </div>
                </header>

                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}

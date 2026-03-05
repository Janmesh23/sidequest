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

interface ShellProps {
    children: React.ReactNode;
    activeTab: 'chat' | 'library';
    onTabChange: (tab: 'chat' | 'library') => void;
}

export default function Shell({ children, activeTab, onTabChange }: ShellProps) {
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
                        <Zap size={20} fill="white" />
                    </div>
                    <span className="font-display">SideQuest</span>
                </div>

                <nav className={styles.navSection}>
                    <div
                        className={`${styles.navItem} ${activeTab === 'chat' ? styles.navItemActive : ''}`}
                        onClick={() => onTabChange('chat')}
                    >
                        <MessageSquare size={18} />
                        <span>Chat</span>
                    </div>
                    <div
                        className={`${styles.navItem} ${activeTab === 'library' ? styles.navItemActive : ''}`}
                        onClick={() => onTabChange('library')}
                    >
                        <Library size={18} />
                        <span>Library</span>
                    </div>
                </nav>

                <div className={styles.docList}>
                    <h3 className={styles.docSectionTitle}>Recent Documents</h3>
                    {documents.map((doc) => (
                        <div key={doc.id} className={styles.docItem} title={doc.filename}>
                            <div className={`${styles.statusDot} ${doc.status === 'ready' ? styles.statusReady :
                                doc.status.includes('failed') ? styles.statusFailed :
                                    styles.statusProcessing
                                }`} />
                            <FileText size={14} />
                            <span>{doc.filename}</span>
                        </div>
                    ))}
                    {documents.length === 0 && (
                        <div className={styles.docItem} style={{ fontStyle: 'italic', cursor: 'default' }}>
                            {status === 'loading' ? "Loading..." : "No documents yet"}
                        </div>
                    )}
                </div>

                <div className={styles.navSection} style={{ marginTop: 'auto' }}>
                    <div className={styles.navItem} style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '16px', borderRadius: 0, cursor: 'default' }}>
                        <div className={styles.logoIcon} style={{ width: '32px', height: '32px' }}>
                            <User size={16} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{session?.user?.name || (status === 'authenticated' ? "Authenticated" : "Guest")}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{session?.user?.email || (status === 'loading' ? "Loading session..." : "Not signed in")}</span>
                        </div>
                    </div>
                    <div className={styles.navItem} onClick={handleLogout}>
                        <Settings size={18} />
                        <span>Logout</span>
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
                        <button className="glass" style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: '1px solid var(--border-primary)'
                        }} onClick={() => onTabChange('library')}>
                            <CloudUpload size={16} />
                            Upload
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

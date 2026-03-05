'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './Library.module.css';
import {
    CloudUpload,
    FileText,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument, DocumentStatus } from '@/utils/api';
import { useSession } from 'next-auth/react';

export default function Library() {
    const { data: session } = useSession();
    const [documents, setDocuments] = useState<DocumentStatus[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const userId = (session?.user as any)?.id || "user_1";

    const fetchDocs = async () => {
        if (!session) return;
        try {
            const data = await getDocuments(userId);
            setDocuments(data);
        } catch (err) {
            console.error('Failed to fetch', err);
        }
    };

    useEffect(() => {
        fetchDocs();
        const interval = setInterval(fetchDocs, 3000);
        return () => clearInterval(interval);
    }, [session, userId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !session) return;

        setIsUploading(true);
        try {
            await uploadDocument(file, userId);
            await fetchDocs();
        } catch (err) {
            alert('Upload failed. Check console for details.');
            console.error(err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await deleteDocument(id, userId);
            await fetchDocs();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.library}>
            <header className={styles.titleSection}>
                <h1 className={styles.title}>Document Library</h1>
                <p className={styles.subtitle}>Upload and manage your knowledge base</p>
            </header>

            <div
                className={styles.uploadArea}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.docx"
                />
                <div className={`${styles.uploadIcon} ${isUploading ? 'pulse-glow' : ''}`}>
                    <CloudUpload size={48} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, fontSize: '18px' }}>
                        {isUploading ? 'Processing Document...' : 'Click to upload a document'}
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                        Supports PDF, DOCX, and Text files
                    </p>
                </div>
            </div>

            <div className={styles.grid}>
                {documents.map((doc) => (
                    <div key={doc.id} className={`${styles.card} glass-card animate-fade-in`}>
                        <div className={styles.deleteBtn} onClick={() => handleDelete(doc.id)}>
                            <Trash2 size={16} />
                        </div>

                        <div className={styles.cardHeader}>
                            <div className={styles.docIcon}>
                                <FileText size={20} />
                            </div>
                        </div>

                        <div>
                            <h3 className={styles.cardTitle}>{doc.filename}</h3>
                            <p className={styles.cardMeta}>
                                Added {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className={styles.cardStatus} style={{
                            color: doc.status === 'ready' ? '#10b981' :
                                doc.status.includes('failed') ? '#ef4444' : '#f59e0b'
                        }}>
                            {doc.status === 'ready' ? (
                                <>
                                    <CheckCircle2 size={16} />
                                    <span>Ready ({doc.total_chunks} chunks)</span>
                                </>
                            ) : doc.status.includes('failed') ? (
                                <>
                                    <AlertCircle size={16} />
                                    <span>Failed</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={16} className="rotate" />
                                    <span>{doc.status}...</span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

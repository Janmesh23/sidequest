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
    const token = (session?.user as any)?.accessToken || "";

    const fetchDocs = async () => {
        if (!session || !token) return;
        try {
            const data = await getDocuments(token);
            setDocuments(data);
        } catch (err) {
            console.error('Failed to fetch', err);
        }
    };

    useEffect(() => {
        fetchDocs();
        const interval = setInterval(fetchDocs, 3000);
        return () => clearInterval(interval);
    }, [session, token]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !session) return;

        setIsUploading(true);
        try {
            await uploadDocument(file, token);
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
            await deleteDocument(id, token);
            await fetchDocs();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.library}>
            <header className={styles.titleSection}>
                <h1 className={styles.title}>Knowledge Base</h1>
                <p className={styles.subtitle}>Upload and source control your document context.</p>
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
                <div className={styles.uploadIcon}>
                    <CloudUpload size={24} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 500, fontSize: '15px' }}>
                        {isUploading ? 'Ingesting contextual data...' : 'Click to add document source'}
                    </p>
                </div>
            </div>

            <div className={styles.grid}>
                {documents.map((doc) => (
                    <div key={doc.id} className={`${styles.card} animate-fade-in`}>
                        <div className={styles.deleteBtn} onClick={() => handleDelete(doc.id)} title="Remove source">
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
                                Indexed on {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className={styles.cardStatus} style={{
                            color: doc.status === 'ready' ? 'var(--text-primary)' :
                                doc.status.includes('failed') ? '#ef4444' : 'var(--text-muted)'
                        }}>
                            {doc.status === 'ready' ? (
                                <>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                    <span>Ready • {doc.total_chunks} index fragments</span>
                                </>
                            ) : doc.status.includes('failed') ? (
                                <>
                                    <AlertCircle size={14} />
                                    <span>Ingestion Failed</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={14} className="rotate" />
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

'use client';

import React, { useState } from 'react';
import styles from './login.module.css';
import { Zap } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`${styles.loginCard} animate-fade-in`}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Zap size={32} />
                    </div>
                    <div>
                        <h1 className={styles.title}>SideQuest</h1>
                        <p className={styles.subtitle}>Intelligence for your document context.</p>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? 'Entering...' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.footer}>
                    New to SideQuest? <span className={styles.link}>Create an account</span>
                </p>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
                    Tip: Use <code style={{ color: 'var(--accent-secondary)' }}>test@example.com</code> / <code style={{ color: 'var(--accent-secondary)' }}>password123</code>
                </div>
            </div>
        </div>
    );
}

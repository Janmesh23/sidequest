'use client';

import React, { useState } from 'react';
import styles from '../login/login.module.css';
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            
            // Call the FastAPI /register endpoint
            await axios.post(`${backendUrl}/register`, {
                email,
                password,
                name
            });

            setSuccess('Account created successfully! Redirecting to login...');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
            
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.orb1}></div>
            <div className={styles.orb2}></div>
            
            <div className={`${styles.loginCard} animate-fade-in`}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Zap size={32} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h1 className={styles.title}>Join SideQuest</h1>
                        <p className={styles.subtitle}>Unlock your automated document intelligence.</p>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.error} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{success}</div>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Full Name</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Alex Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={!!success}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={!!success}
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
                            disabled={!!success}
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={loading || !!success}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Already have an account? <Link href="/login" className={styles.link}>Sign in instead</Link>
                </p>
            </div>
        </div>
    );
}

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import * as jose from 'jose';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
                    const response = await fetch(`${backendUrl}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: credentials?.email, 
                            password: credentials?.password 
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // returned user must have id, email, name mapped
                        return {
                            id: data.user.id,
                            name: data.user.name || data.user.email.split('@')[0],
                            email: data.user.email
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Login authorization error:", error);
                    return null;
                }
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLoginPage = nextUrl.pathname.startsWith("/login");
            const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");

            if (isApiAuthRoute) return true;

            if (isOnLoginPage) {
                if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
                return true;
            }

            return isLoggedIn; // Returns false to redirect to login if not logged in
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                // Sign standard JWT for FastAPI backend using the AUTH_SECRET
                const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback_secret_for_dev_only_12345");
                const alg = 'HS256';
                token.accessToken = await new jose.SignJWT({ sub: user.id, email: user.email })
                    .setProtectedHeader({ alg })
                    .setExpirationTime('24h')
                    .sign(secret);
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.AUTH_SECRET,
    trustHost: true,
});

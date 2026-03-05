import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // This is a placeholder for actual user validation.
                // In a real app, you'd check this against a database.
                if (credentials?.email === "test@example.com" && credentials?.password === "password123") {
                    return { id: "user_1", name: "Janmesh", email: "test@example.com" };
                }
                return null;
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
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
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

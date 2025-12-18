import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from '@/app/lib/prisma';
import { z } from 'zod';

// Minimal schema for login validation
const loginSchema = z.object({
    // Flexible schema for login (email or username)
    identifier: z.string(),
    password: z.string().min(1), // Allow short passwords for this specific request (5102 is len 4)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                identifier: {},
                password: {},
            },
            authorize: async (credentials) => {
                const { identifier, password } = await loginSchema.parseAsync(credentials);

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: identifier as string },
                            { username: identifier as string }
                        ]
                    },
                });

                if (!user) return null;

                // Check if user is suspended
                if (user.role === 'SUSPENDED') {
                    throw new Error('Your account has been suspended.');
                }

                const passwordsMatch = await compare(
                    password as string,
                    user.password
                );

                if (passwordsMatch) return user;
                throw new Error('Invalid password.');
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                // @ts-expect-error: Extending Session user type with custom properties
                session.user.role = token.role;
            }
            return session;
        },
        async jwt({ token }) {
            if (!token.role) {
                const user = await prisma.user.findUnique({
                    where: { id: token.sub },
                });
                if (user) {
                    token.role = user.role;
                }
            }
            return token;
        }
    }
});

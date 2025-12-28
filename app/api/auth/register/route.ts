import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/app/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, name } = registerSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        const hashedPassword = await hash(password, 10);

        // Generate Username: user_ + timestamp last 4 digits + random 2 digits
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.floor(10 + Math.random() * 90); // 2 digit random
        const username = `user_${timestamp}${random}`;

        const user = await prisma.user.create({
            data: {
                email,
                name,
                username, // Add generated username
                password: hashedPassword,
                balance: 0.0,
            },
        });

        return NextResponse.json({
            user: {
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: 500 }
        );
    }
}

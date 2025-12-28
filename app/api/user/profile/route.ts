import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Fetch Full Profile
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                email: true,
                phone: true,
                address: true,
                bio: true,
                gender: true,
                username: true,
                balance: true,
                createdAt: true,
                avatarSalt: true,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// PATCH: Update Profile
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { name, phone, address, bio, gender, currentPassword, newPassword, avatarSalt } = body;

        // Password Update Logic
        if (currentPassword && newPassword) {
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (!user || !user.password) throw new Error('User not found');

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড ভুল' }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: session.user.id },
                data: { password: hashedPassword }
            });

            return NextResponse.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে আপডেট হয়েছে' });
        }

        // Profile Info Update Logic
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                phone,
                address,
                bio,
                gender,
                avatarSalt
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error('Profile update failed:', error);
        return NextResponse.json({ error: 'আপডেট ব্যর্থ হয়েছে' }, { status: 500 });
    }
}

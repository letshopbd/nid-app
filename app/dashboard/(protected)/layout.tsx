import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/prisma';
import SuspendedView from '../SuspendedView';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (user?.status === 'SUSPENDED') {
        const whatsappSetting = await prisma.systemSetting.findUnique({
            where: { key: 'support_whatsapp' }
        });
        return <SuspendedView whatsappNumber={whatsappSetting?.value || undefined} />;
    }

    return <>{children}</>;
}

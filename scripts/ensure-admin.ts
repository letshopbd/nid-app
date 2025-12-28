
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await hash('admin', 12);
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password,
            role: 'ADMIN',
            status: 'ACTIVE'
        },
        create: {
            username: 'admin',
            email: 'admin@example.com',
            password,
            role: 'ADMIN',
            status: 'ACTIVE',
            name: 'Admin User'
        },
    });
    console.log({ user });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

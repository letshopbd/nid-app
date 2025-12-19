
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Turning server ON...');

    // Set Status to ON
    await prisma.systemSetting.upsert({
        where: { key: 'server_status' },
        update: { value: 'ON' },
        create: { key: 'server_status', value: 'ON' }
    });

    // Clear maintenance flags
    await prisma.systemSetting.deleteMany({
        where: {
            key: { in: ['maintenance_pending_status', 'maintenance_trigger_time', 'maintenance_start_time'] }
        }
    });

    console.log('Server is now LIVE (ON). Maintenance cleared.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

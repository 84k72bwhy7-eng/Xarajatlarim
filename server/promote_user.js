import { PrismaClient } from '@prisma/client';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Iltimos, email manzilini kiriting: node promote_user.js email@example.com');
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'SUPERADMIN' },
        });
        console.log(`✅ Muvaffaqiyatli! ${user.name} (${user.email}) endi SUPERADMIN.`);
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        if (error.code === 'P2025') {
            console.error('Bunday emailga ega foydalanuvchi topilmadi.');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = 'amonov5991@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { categories: true }
    });

    if (!user) {
        console.log('User not found:', email);
        const allUsers = await prisma.user.findMany({ select: { email: true } });
        console.log('Available users:', allUsers.map(u => u.email));
        return;
    }

    console.log(`User: ${user.name} (${user.id})`);
    console.log(`Role: ${user.role}`);
    console.log(`Total Categories: ${user.categories.length}`);
    console.log('Categories:', JSON.stringify(user.categories.slice(0, 5), null, 2), user.categories.length > 5 ? '...' : '');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

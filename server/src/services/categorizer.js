import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Tranzaksiya tavsifini avtomatik kategoriyalash
 * 
 * Strategy:
 * 1. Keyword-based matching (default fallback)
 * 2. OpenAI API integration (agar key mavjud bo'lsa)
 */

// Keyword map — tavsif bo'yicha kategoriyani aniqlash
const KEYWORD_MAP = {
    // Oziq-ovqat
    'oziq': 'Oziq-ovqat', 'ovqat': 'Oziq-ovqat', 'restoran': 'Oziq-ovqat',
    'kafe': 'Oziq-ovqat', 'market': 'Oziq-ovqat', 'dokon': 'Oziq-ovqat', "do'kon": 'Oziq-ovqat',
    'non': 'Oziq-ovqat', 'bozor': 'Oziq-ovqat', 'tushlik': 'Oziq-ovqat',
    'kechki': 'Oziq-ovqat', 'choy': 'Oziq-ovqat', 'kofe': 'Oziq-ovqat',
    'burger': 'Oziq-ovqat', 'pizza': 'Oziq-ovqat', 'palov': 'Oziq-ovqat',

    // Transport
    'taksi': 'Transport', 'benzin': 'Transport', 'avtobus': 'Transport',
    'metro': 'Transport', 'yandex': 'Transport', 'uber': 'Transport',
    'mashina': 'Transport', 'avto': 'Transport',

    // Uy-joy
    'ijara': 'Uy-joy', 'kvartira': 'Uy-joy', 'uy': 'Uy-joy',
    'remont': 'Uy-joy', 'mebel': 'Uy-joy',

    // Sog'liq
    'dorixona': 'Sog\'liq', 'shifoxona': 'Sog\'liq', 'vrach': 'Sog\'liq',
    'dori': 'Sog\'liq', 'apteka': 'Sog\'liq', 'klinika': 'Sog\'liq',

    // Kiyim
    'kiyim': 'Kiyim', 'poyafzal': 'Kiyim', 'krossovka': 'Kiyim',
    'ko\'ylak': 'Kiyim', 'shim': 'Kiyim',

    // Ta'lim
    'kurs': 'Ta\'lim', 'kitob': 'Ta\'lim', 'talim': 'Ta\'lim',
    'darslik': 'Ta\'lim', 'repetitor': 'Ta\'lim', 'udemy': 'Ta\'lim',

    // Ko'ngil ochar
    'kino': 'Ko\'ngil ochar', 'teatr': 'Ko\'ngil ochar', 'oyin': 'Ko\'ngil ochar',
    'sport': 'Ko\'ngil ochar', 'fitnes': 'Ko\'ngil ochar',

    // Kommunal
    'gaz': 'Kommunal', 'suv': 'Kommunal', 'elektr': 'Kommunal',
    'tok': 'Kommunal', 'kommunal': 'Kommunal',

    // Internet
    'internet': 'Internet', 'telefon': 'Internet', 'mobil': 'Internet',
    'beeline': 'Internet', 'ucell': 'Internet', 'uzmobile': 'Internet',

    // Income
    'maosh': 'Maosh', 'oylik': 'Maosh', 'ish haqi': 'Maosh',
    'freelance': 'Freelance', 'loyiha': 'Freelance', 'buyurtma': 'Freelance',
};

/**
 * Keyword-based avtomatik kategoriyalash
 */
async function autoCategorize(userId, description, transactionType) {
    if (!description) return null;

    const lowerDesc = description.toLowerCase();

    // Keyword matchingni sinash
    for (const [keyword, categoryName] of Object.entries(KEYWORD_MAP)) {
        if (lowerDesc.includes(keyword)) {
            // Foydalanuvchining o'z kategoriyasini topish
            const category = await prisma.category.findFirst({
                where: {
                    userId,
                    name: categoryName,
                    type: transactionType === 'INCOME' ? 'INCOME' : 'EXPENSE',
                },
            });
            if (category) return category.id;
        }
    }

    return null;
}

export { autoCategorize };

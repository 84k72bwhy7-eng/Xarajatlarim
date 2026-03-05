import axios from 'axios';

// Odiy xotira keshi
// Cache ko'rinishi: { timestamp: Number, rates: { "USD": 12850.00, "EUR": ... } }
let ratesCache = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 soat

/**
 * Markaziy bankdan barcha kurslarni olish (kesh bilan)
 */
export async function getDetailedRates() {
    const now = Date.now();
    if (ratesCache && (now - ratesCache.timestamp < CACHE_DURATION_MS)) {
        return ratesCache.rates;
    }

    try {
        const response = await axios.get('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
        const data = response.data;

        const rates = {};
        data.forEach(item => {
            rates[item.Ccy] = parseFloat(item.Rate);
        });

        // Keshni yangilash
        ratesCache = {
            timestamp: now,
            rates: rates
        };

        return rates;
    } catch (error) {
        console.error('CBU API Error:', error.message);
        // Xato bo'lsa va kesh bo'lsa, eskisini qaytaramiz
        if (ratesCache) {
            return ratesCache.rates;
        }
        throw new Error('Valyuta kurslarini olishda xatolik yuz berdi');
    }
}

/**
 * Ma'lum bir valyuta uchun 1 birligining UZS dagi qiymatini olish
 * @param {string} currencyCode Masalan: "USD", "EUR"
 */
export async function getExchangeRate(currencyCode = 'USD') {
    if (currencyCode === 'UZS') return 1;

    const rates = await getDetailedRates();
    const rate = rates[currencyCode];

    if (!rate) {
        throw new Error(`Valyuta kursi topilmadi: ${currencyCode}`);
    }

    return rate;
}

/**
 * Qiymatni UZS ga o'girish
 * @param {number} amount Asl miqdor
 * @param {string} currency Asl valyuta (UZS, USD, ...)
 */
export async function convertToUZS(amount, currency) {
    if (currency === 'UZS' || !currency) return amount;

    const rate = await getExchangeRate(currency);
    return amount * rate;
}

/**
 * Qiymatni UZS dan boshqa valyutaga o'girish
 * @param {number} amountInUZS UZS dagi miqdor
 * @param {string} targetCurrency Mo'ljal valyuta (USD, ...)
 */
export async function convertFromUZS(amountInUZS, targetCurrency) {
    if (targetCurrency === 'UZS' || !targetCurrency) return amountInUZS;

    const rate = await getExchangeRate(targetCurrency);
    return amountInUZS / rate;
}

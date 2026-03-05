import { getExchangeRate, convertToUZS, convertFromUZS } from './src/services/currency.js';

async function test() {
    try {
        const usdRate = await getExchangeRate('USD');
        console.log(`1 USD = ${usdRate} UZS`);

        const inUzs = await convertToUZS(100, 'USD');
        console.log(`$100 = ${inUzs} UZS`);

        const inUsd = await convertFromUZS(1285000, 'USD');
        console.log(`1,285,000 UZS = $${inUsd}`);
    } catch (e) {
        console.error("Test failed:", e);
    }
}
test();

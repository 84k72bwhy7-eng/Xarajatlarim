// Default kategoriyalar tarjimasi
// BD da o'zbek tilida saqlangan - frontend da til bo'yicha ko'rsatamiz

export const CATEGORY_TRANSLATIONS = {
    // O'zbek → Rus tarjimasi
    'Oziq-ovqat': 'Продукты питания',
    'Transport': 'Транспорт',
    'Kommunal xizmatlar': 'Коммунальные услуги',
    'Kiyim-kechak': 'Одежда',
    'Sog\'liq': 'Здоровье',
    'O\'yin-kulgi': 'Развлечения',
    'Elektron qurilmalar': 'Электроника',
    'Sport': 'Спорт',
    'Sayohat': 'Путешествия',
    'Ta\'lim': 'Образование',
    'Uy-joy': 'Жильё',
    'Uy jihozlari': 'Мебель и быт',
    'Sovg\'a': 'Подарки',
    'Boshqa': 'Прочее',
    // Daromad kategoriyalari
    'Maosh': 'Зарплата',
    'Qo\'shimcha daromad': 'Дополнительный доход',
    'Investitsiya': 'Инвестиции',
    'Biznes': 'Бизнес',
    'Ijara': 'Аренда (доход)',
    'Transfer': 'Перевод',
};

/**
 * Kategoriya nomini tanlangan til bo'yicha qaytaradi
 * @param {string} name - O'zbek tilidagi kategoriya nomi
 * @param {string} lang - Tanlangan til ('uz' | 'ru')
 * @returns {string}
 */
export function getCategoryName(name, lang) {
    if (lang === 'ru' && CATEGORY_TRANSLATIONS[name]) {
        return CATEGORY_TRANSLATIONS[name];
    }
    return name;
}

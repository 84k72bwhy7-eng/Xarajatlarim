// Default kategoriyalar tarjimasi
// BD da o'zbek tilida saqlangan - frontend da til bo'yicha ko'rsatamiz

export const CATEGORY_TRANSLATIONS = {
    // ===== XARAJAT kategoriyalari =====
    'Oziq-ovqat': 'Продукты питания',
    'Transport': 'Транспорт',
    'Kommunal xizmatlar': 'Коммунальные услуги',
    'Kommunal': 'Коммунальные услуги',
    'Kiyim-kechak': 'Одежда',
    'Kiyim': 'Одежда',
    "Sog'liq": 'Здоровье',
    "Sog`liq": 'Здоровье',
    "O'yin-kulgi": 'Развлечения',
    "Ko'ngil ochar": 'Развлечения',
    "Ko`ngil ochar": 'Развлечения',
    'Elektron qurilmalar': 'Электроника',
    'Elektronika': 'Электроника',
    'Sport': 'Спорт',
    'Sayohat': 'Путешествия',
    "Ta'lim": 'Образование',
    "Ta`lim": 'Образование',
    'Uy-joy': 'Жильё',
    'Uy jihozlari': 'Мебель и быт',
    "Sovg'a": 'Подарки',
    'Boshqa': 'Прочее',
    'Restoran': 'Ресторан',
    'Kafé': 'Кафе',
    'Ichimlik': 'Напитки',
    'Do\'kon': 'Магазин',
    'Dorixona': 'Аптека',
    'Shifokor': 'Врач',
    'Uy ijarasi': 'Аренда жилья',
    'Benzin': 'Бензин',
    'Taksi': 'Такси',

    // ===== DAROMAD kategoriyalari =====
    'Maosh': 'Зарплата',
    "Qo'shimcha daromad": 'Дополнительный доход',
    'Boshqa daromad': 'Прочие доходы',
    'Investitsiya': 'Инвестиции',
    'Biznes': 'Бизнес',
    'Ijara': 'Аренда (доход)',
    'Freelance': 'Фриланс',
    'Internet': 'Интернет',
    'Transfer': 'Перевод',
};

/**
 * Kategoriya nomini tanlangan til bo'yicha qaytaradi
 * @param {string} name - O'zbek tilidagi kategoriya nomi
 * @param {string} lang - Tanlangan til ('uz' | 'ru')
 * @returns {string}
 */
export function getCategoryName(name, lang) {
    if (!name) return '';
    if (lang === 'ru') {
        return CATEGORY_TRANSLATIONS[name] || name;
    }
    return name;
}

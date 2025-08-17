/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {    

    // @TODO: Расчет выручки от операции

    const discount = 1 - (purchase.discount / 100);    

    return purchase.sale_price * purchase.quantity * discount;
   
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {

    // @TODO: Расчет бонуса от позиции в рейтинге

    if(index === 0){
        return seller.profit / 100 * 15;
    } else if (index === 1) {
        return seller.profit / 100 * 10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return seller.profit / 100 * 5;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    if(!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }
    
    // @TODO: Проверка наличия опций
    
    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue
        || !calculateBonus
        || typeof calculateRevenue !== "function"
        || typeof calculateBonus !== "function"
    ) {
        throw new Error('Не пройдена проверка наличия опций');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((result, seller) => ({
        ...result,
        [seller.id]: seller
    }), {});

    const productIndex = data.products.reduce((result, product) => ({
        ...result,
        [product.sku]: product
    }), {});

    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж
        seller.sales_count += 1;

        // Увеличить общую сумму всех продаж
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            
            let cost = product.purchase_price * item.quantity;

            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue(item);

            // Посчитать прибыль: выручка минус себестоимость

            const profit = revenue - cost;

            // Увеличить общую накопленную прибыль (profit) у продавца

            seller.profit += profit;

                // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            
            // По артикулу товара увеличить его проданное количество у продавца

            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования

    // Формируем топ-10 товаров
    // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller); // Считаем бонус
        seller.products_sold = Object.entries(seller.products_sold).map(([sku, quantity]) =>
            ({sku: sku, quantity: quantity}));
        seller.products_sold.sort((a, b) => b.quantity - a.quantity);
        seller.top_products = seller.products_sold.slice(0, 10);            
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    
    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
    }));    
}

console.log(analyzeSalesData(data, { calculateRevenue: calculateSimpleRevenue, calculateBonus: calculateBonusByProfit }));
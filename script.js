// Конфигурация API
const API_URL = 'https://script.google.com/macros/s/AKfycbyP2snrlM9i_yuy4sLSkBLC4d6Eoa5QbCFUa9FMfOTDFGYXTMdI3NmehmizCzxVK5vw8A/exec';

// Глобальные переменные
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена, запускаем загрузку товаров...');
    loadProducts();
    updateCartCount();
    setupEventListeners();
});

// Загрузка товаров из API
async function loadProducts() {
    try {
        const loadingElement = document.querySelector('.loading');
        loadingElement.textContent = 'Загрузка товаров...';
        
        console.log('Загружаем данные из:', API_URL);
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Получены данные:', data);
        
        if (data.products) {
            products = data.products;
            displayProducts(products);
        } else {
            products = Array.isArray(data) ? data : [];
            displayProducts(products);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        document.querySelector('.loading').textContent = 'Ошибка загрузки товаров';
    }
}

// Отображение товаров
function displayProducts(productsToShow) {
    const grid = document.getElementById('products-grid');
    
    if (productsToShow.length === 0) {
        grid.innerHTML = '<div class="no-products">Товары не найдены</div>';
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => {
        const price = parseInt(product.price) || 0;
        const stock = parseInt(product.stock) || 0;
        const isOutOfStock = stock <= 0;
        
        // Умные изображения по категориям
        const imageUrl = getProductImage(product.category, product.name);
        
        return `
        <div class="product-card" data-category="${product.category || ''}">
            <img src="${imageUrl}" 
                 alt="${product.name || 'Товар'}" 
                 class="product-image">
            <h3 class="product-name">${product.name || 'Без названия'}</h3>
            <div class="product-price">${price.toLocaleString()} руб.</div>
            <div class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
                ${isOutOfStock ? 'Нет в наличии' : `В наличии: ${stock} шт.`}
            </div>
            <button class="add-to-cart" 
                    onclick="addToCart('${product.id}')" 
                    ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Нет в наличии' : 'В корзину'}
            </button>
        </div>
        `;
    }).join('');
}

// Функция для генерации изображений по категориям
function getProductImage(category, productName) {
    const colors = {
        smartphones: '4A90E2',
        laptops: '50E3C2',
        audio: 'B8E986',
        other: 'BD10E0'
    };
    
    const color = colors[category] || 'AAAAAA';
    const text = productName ? encodeURIComponent(productName.split(' ')[0]) : 'Товар';
    
    return `https://via.placeholder.com/300x200/${color}/FFFFFF?text=${text}`;
}

// Сохранение корзины в localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Обновление счетчика корзины
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 1rem;
        border-radius: 5px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Фильтрация по категориям
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            filterProducts(category);
        });
    });
    
    // Открытие/закрытие корзины
    document.querySelector('.cart-icon').addEventListener('click', openCart);
    document.querySelector('.close-cart').addEventListener('click', closeCart);
    
    // Закрытие корзины по клику вне области
    document.getElementById('cart-modal').addEventListener('click', function(e) {
        if (e.target === this) closeCart();
    });
}

// Фильтрация товаров
function filterProducts(category) {
    if (category === 'all') {
        displayProducts(products);
    } else {
        const filteredProducts = products.filter(product => product.category === category);
        displayProducts(filteredProducts);
    }
}

// В функции loadProducts() после получения данных добавьте:
console.log('ДАННЫЕ ИЗ API:', data);
console.log('ПЕРВЫЙ ТОВАР:', data.products[0]);

// Открытие корзины
function openCart() {
    const modal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <div>${item.price} руб. × ${item.quantity}</div>
            </div>
            <div class="cart-item-actions">
                <button onclick="changeQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity('${item.id}', 1)">+</button>
                <button onclick="removeFromCart('${item.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = total.toLocaleString();
    
    modal.style.display = 'block';
}

// Закрытие корзины
function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

// Изменение количества товара
function changeQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > item.maxStock) {
        alert('Недостаточно товара на складе');
        return;
    }
    
    item.quantity = newQuantity;
    saveCart();
    updateCartCount();
    openCart();
}

// Удаление из корзины
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    openCart();
    
    if (cart.length === 0) {
        closeCart();
    }
}

// Функция для тестирования API
async function testAPI() {
    try {
        console.log('=== ТЕСТИРУЕМ API ===');
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log('✅ API работает! Данные:', data);
        alert('API работает! Проверьте консоль для деталей.');
    } catch (error) {
        console.error('❌ Ошибка API:', error);
        alert('Ошибка API: ' + error.message);
    }
}

// Функция для проверки данных товаров
function checkProductsData() {
    console.log('=== ПРОВЕРКА ДАННЫХ ТОВАРОВ ===');
    console.log('Всего товаров:', products.length);
    
    products.forEach((product, index) => {
        console.log(`Товар ${index}:`, {
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            status: product.status,
            id: product.id
        });
    });
    
    alert(`Проверьте консоль! Товаров: ${products.length}`);
}
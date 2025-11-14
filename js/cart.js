const cart = {
    CART_KEY: 'prostroy_cart',

    init() {
        this.updateCartDisplay();
    },
    
    getCart() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return [];
        
        const cartJSON = localStorage.getItem(`${this.CART_KEY}_${currentUser}`);
        return cartJSON ? JSON.parse(cartJSON) : [];
    },
    
    saveCart(cartItems) {
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            localStorage.setItem(`${this.CART_KEY}_${currentUser}`, JSON.stringify(cartItems));
            this.updateCartDisplay();
        }
    },
    
    // ОБНОВЛЕНО: Добавлен параметр type
    addToCart(productName, price, type = 'material') {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            auth.showAuth();
            return;
        }
        
        const cartItems = this.getCart();
        cartItems.push({
            name: productName,
            price: price,
            id: Date.now(),
            type: type,
            date: new Date().toISOString()
        });
        
        this.saveCart(cartItems);
        this.showNotification(`"${productName}" добавлен в корзину!`, 'success');
    },
    
    updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        
        if (!cartItemsContainer || !cartTotalElement) return;
        
        const cartItems = this.getCart();
        
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-primary);">Корзина пуста</p>';
            cartTotalElement.textContent = 'Итого: ₽0';
            return;
        }
        
        let total = 0;
        cartItemsContainer.innerHTML = '';
        
        cartItems.forEach((item, index) => {
            total += item.price;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.style.display = 'flex';
            cartItem.style.justifyContent = 'space-between';
            cartItem.style.alignItems = 'center';
            cartItem.style.padding = '10px';
            cartItem.style.borderBottom = '1px solid var(--accent-primary)';
            
            cartItem.innerHTML = `
                <div>
                    <div>${item.name}</div>
                    <div style="color: var(--accent-primary);">₽${item.price.toLocaleString()}</div>
                    ${item.type ? `<div style="font-size: 12px; color: var(--text-secondary);">${item.type === 'material' ? '📦 Материал' : '🏠 Модуль'}</div>` : ''}
                </div>
                <button onclick="cart.removeFromCart(${index})" style="background: #ff6633; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Удалить</button>
            `;
            
            cartItemsContainer.appendChild(cartItem);
        });
        
        cartTotalElement.textContent = `Итого: ₽${total.toLocaleString()}`;
    },
    
    removeFromCart(index) {
        const cartItems = this.getCart();
        cartItems.splice(index, 1);
        this.saveCart(cartItems);
        this.showNotification('Товар удален из корзины', 'info');
    },
    
    clearCart() {
        if (confirm('Очистить всю корзину?')) {
            this.saveCart([]);
            this.showNotification('Корзина очищена', 'info');
        }
    },
    
    checkout() {
        const cartItems = this.getCart();
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            auth.showAuth();
            return;
        }
        
        if (cartItems.length === 0) {
            this.showNotification('Корзина пуста', 'info');
            return;
        }
        
        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        
        if (confirm(`Оформить заказ на сумму ₽${total.toLocaleString()}?`)) {
            // Сохраняем заказ в историю
            this.saveOrder(cartItems, total);
            this.saveCart([]);
            this.showNotification('Заказ успешно оформлен!', 'success');
        }
    },

    saveOrder(items, total) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        const order = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: [...items],
            total: total,
            status: 'pending'
        };

        // Сохраняем в историю заказов
        const orders = this.getOrders();
        orders.push(order);
        localStorage.setItem(`prostroy_orders_${currentUser}`, JSON.stringify(orders));
    },

    getOrders() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return [];
        
        const ordersJSON = localStorage.getItem(`prostroy_orders_${currentUser}`);
        return ordersJSON ? JSON.parse(ordersJSON) : [];
    },

    // Новый метод для добавления модулей в корзину
    addModuleToCart(module) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            auth.showAuth();
            return;
        }
        
        const cartItems = this.getCart();
        cartItems.push({
            name: module.name,
            price: module.price,
            id: module.id,
            type: 'module',
            date: new Date().toISOString(),
            moduleData: module // Сохраняем полные данные модуля
        });
        
        this.saveCart(cartItems);
        this.showNotification(`"${module.name}" добавлен в корзину!`, 'success');
    },

    // НОВЫЙ МЕТОД: Показ уведомлений
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'info' ? '#2196F3' : '#ff6633'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: bold;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
};
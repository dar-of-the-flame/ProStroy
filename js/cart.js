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
    
    addToCart(productName, price) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            auth.showAuth();
            alert('Для добавления товаров в корзину необходимо войти в систему');
            return;
        }
        
        const cartItems = this.getCart();
        cartItems.push({
            name: productName,
            price: price,
            id: Date.now()
        });
        
        this.saveCart(cartItems);
        alert(`Товар "${productName}" добавлен в корзину!`);
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
    },
    
    clearCart() {
        if (confirm('Очистить всю корзину?')) {
            this.saveCart([]);
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
            alert('Корзина пуста!');
            return;
        }
        
        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        
        if (confirm(`Оформить заказ на сумму ₽${total.toLocaleString()}?`)) {
            alert(`Заказ оформлен! Спасибо, ${currentUser}! Номер вашего заказа: #${Date.now()}`);
            this.saveCart([]);
        }
    }
};
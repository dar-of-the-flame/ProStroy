const profile = {
    init() {
        if (!auth.getCurrentUser()) {
            window.location.href = 'index.html';
            return;
        }
        this.loadProfile();
        this.setupEventListeners();
    },

    loadProfile() {
        const currentUser = auth.getCurrentUser();
        const cartItems = cart.getCart();
        const orders = cart.getOrders();
        
        const profileContent = document.getElementById('profile-content');
        if (!profileContent) return;

        // Разделяем корзину на материалы и модули
        const materials = cartItems.filter(item => item.type === 'material');
        const modules = cartItems.filter(item => item.type === 'module');
        const totalCart = cartItems.reduce((sum, item) => sum + item.price, 0);

        // Разделяем заказы на оплаченные и неоплаченные
        const pendingOrders = orders.filter(order => order.status === 'pending');
        const completedOrders = orders.filter(order => order.status === 'completed');

        profileContent.innerHTML = `
            <div class="profile-header">
                <h2>Профиль пользователя: ${currentUser}</h2>
                <button id="logoutBtn" class="auth-btn" style="background: #ff6633;">Выйти</button>
            </div>

            <div class="profile-sections">
                <!-- Общая корзина -->
                <div class="profile-section">
                    <h3>🛒 Общая корзина</h3>
                    <div class="cart-summary">
                        <div class="cart-stats">
                            <div class="stat-item">
                                <span>Материалы:</span>
                                <strong>${materials.length} шт.</strong>
                            </div>
                            <div class="stat-item">
                                <span>Модули:</span>
                                <strong>${modules.length} шт.</strong>
                            </div>
                            <div class="stat-item total">
                                <span>Общая сумма:</span>
                                <strong>₽${totalCart.toLocaleString()}</strong>
                            </div>
                        </div>
                        
                        ${cartItems.length > 0 ? `
                            <div class="cart-items-detailed">
                                <h4>Детали корзины:</h4>
                                ${this.renderCartItems(cartItems)}
                            </div>
                            <div class="cart-actions">
                                <button class="auth-btn" onclick="cart.checkout()">Оформить все</button>
                                <button class="auth-btn" onclick="cart.clearCart()" style="background: #ff6633;">Очистить корзину</button>
                            </div>
                        ` : '<p class="empty-message">Корзина пуста</p>'}
                    </div>
                </div>

                <!-- Неоплаченные заказы -->
                <div class="profile-section">
                    <h3>⏳ Неоплаченные заказы</h3>
                    ${pendingOrders.length > 0 ? 
                        this.renderOrders(pendingOrders, true) : 
                        '<p class="empty-message">Нет неоплаченных заказов</p>'
                    }
                </div>

                <!-- История заказов -->
                <div class="profile-section">
                    <h3>📋 История заказов</h3>
                    ${completedOrders.length > 0 ? 
                        this.renderOrders(completedOrders, false) : 
                        '<p class="empty-message">История заказов пуста</p>'
                    }
                </div>
            </div>
        `;
    },

    renderCartItems(items) {
        return items.map(item => `
            <div class="cart-item-detailed">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-type ${item.type}">${item.type === 'material' ? '📦 Материал' : '🏠 Модуль'}</span>
                </div>
                <div class="item-price">₽${item.price.toLocaleString()}</div>
            </div>
        `).join('');
    },

    renderOrders(orders, showActions = false) {
        return orders.map(order => `
            <div class="order-card ${order.status}">
                <div class="order-header">
                    <div class="order-info">
                        <strong>Заказ #${order.id}</strong>
                        <span class="order-date">${new Date(order.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div class="order-total">₽${order.total.toLocaleString()}</div>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name}</span>
                            <span class="item-type-badge ${item.type}">${item.type}</span>
                            <span>₽${item.price.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>

                ${showActions ? `
                    <div class="order-actions">
                        <button class="auth-btn" onclick="profile.payOrder(${order.id})">💳 Оплатить</button>
                        <button class="auth-btn" onclick="profile.cancelOrder(${order.id})" style="background: #ff6633;">❌ Отменить</button>
                    </div>
                ` : `
                    <div class="order-status ${order.status}">
                        Статус: ${order.status === 'completed' ? '✅ Оплачен' : '⏳ Ожидает оплаты'}
                    </div>
                `}
            </div>
        `).join('');
    },

    payOrder(orderId) {
        const orders = cart.getOrders();
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = 'completed';
            localStorage.setItem(`prostroy_orders_${auth.getCurrentUser()}`, JSON.stringify(orders));
            this.loadProfile();
        }
    },

    cancelOrder(orderId) {
        if (confirm('Вы уверены, что хотите отменить этот заказ?')) {
            const orders = cart.getOrders();
            const filteredOrders = orders.filter(order => order.id !== orderId);
            localStorage.setItem(`prostroy_orders_${auth.getCurrentUser()}`, JSON.stringify(filteredOrders));
            this.loadProfile();
        }
    },

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Выйти из аккаунта?')) {
                    auth.setCurrentUser(null);
                    window.location.href = 'index.html';
                }
            });
        }
    }
};
const visualizer = {
    modulesData: [
        {
            id: 1,
            name: "Базовый модуль",
            price: 50000,
            width: 120,
            height: 80,
            depth: 60,
            textures: {
                front: "./img/дом1.jpg",
                back: "./img/дом1.jpg",
                left: "./img/дом1.jpg",
                right: "./img/дом1.jpg",
                top: "./img/дом1.jpg",
                bottom: "./img/дом1.jpg"
            }
        },
        {
            id: 2,
            name: "Узкий модуль",
            price: 35000,
            width: 80,
            height: 80,
            depth: 60,
            textures: {
                front: "./img/дом2.jpg",
                back: "./img/дом2.jpg",
                left: "./img/дом2.jpg",
                right: "./img/дом2.jpg",
                top: "./img/дом2.jpg",
                bottom: "./img/дом2.jpg"
            }
        },
        {
            id: 3,
            name: "Высокий модуль",
            price: 65000,
            width: 120,
            height: 160,
            depth: 60,
            textures: {
                front: "./img/дом3.jpg",
                back: "./img/дом3.jpg",
                left: "./img/дом3.jpg",
                right: "./img/дом3.jpg",
                top: "./img/дом3.jpg",
                bottom: "./img/дом3.jpg"
            }
        },
        {
            id: 4,
            name: "Широкий модуль",
            price: 80000,
            width: 200,
            height: 80,
            depth: 60,
            textures: {
                front: "./img/дом4.jpg",
                back: "./img/дом4.jpg",
                left: "./img/дом4.jpg",
                right: "./img/дом4.jpg",
                top: "./img/дом4.jpg",
                bottom: "./img/дом4.jpg"
            }
        }
    ],

    currentView: 'front',
    placedModules: [],
    cartItems: [],
    totalPrice: 0,
    selectedModule: null,
    moduleCounter: 0,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,

    init() {
        console.log('Initializing visualizer...');
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            console.log('User not authenticated');
            return;
        }
       
        this.renderModulesGrid();
        this.setupViewControls();
        this.setupVisualizationArea();
        this.setupActionButtons();
        this.updateCart();
       
        // Обработчик для кнопки оформления заказа
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const currentUser = auth.getCurrentUser();
                if (!currentUser) {
                    auth.showAuth();
                    return;
                }
               
                if (this.cartItems.length === 0) {
                    alert('Ваша корзина пуста!');
                    return;
                }
               
                alert(`Заказ оформлен! Итого: ₽${this.totalPrice.toLocaleString()}. Спасибо, ${currentUser}!`);
                this.clearAllModules();
            });
        }
       
        console.log('Visualizer initialized successfully');
    },

    renderModulesGrid() {
        const modulesGrid = document.getElementById('modulesGrid');
        if (!modulesGrid) {
            console.error('Modules grid container not found');
            return;
        }
       
        modulesGrid.innerHTML = '';
       
        this.modulesData.forEach(module => {
            const moduleElement = document.createElement('div');
            moduleElement.className = 'module-item';
            moduleElement.dataset.id = module.id;
           
            moduleElement.innerHTML = `
                <img src="${module.textures.front}" alt="${module.name}"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiMzN2RlZGUiLz48dGV4dCB4PSI2MCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk1vZHVsZSAkewB7bW9kdWxlLmlkfX08L3RleHQ+PC9zdmc+'">
                <div class="module-name">${module.name}</div>
                <div class="module-price">₽${module.price.toLocaleString()}</div>
            `;
           
            // Добавляем обработчик для мобильных устройств
            moduleElement.addEventListener('click', (e) => {
                e.preventDefault();
                this.addModuleToVisualization(module);
            });
           
            // Добавляем обработчик для тач-устройств
            moduleElement.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.addModuleToVisualization(module);
            });
           
            modulesGrid.appendChild(moduleElement);
        });
       
        console.log('Modules grid rendered with', this.modulesData.length, 'modules');
    },

    setupViewControls() {
        const viewButtons = document.querySelectorAll('.view-btn');
       
        viewButtons.forEach(button => {
            // Клик для десктопов
            button.addEventListener('click', () => {
                this.handleViewChange(button);
            });
           
            // Тач для мобильных
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleViewChange(button);
            });
        });
    },

    handleViewChange(button) {
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
       
        this.currentView = button.dataset.view;
        this.updateVisualization();
        console.log('View changed to:', this.currentView);
    },

    setupActionButtons() {
        const deleteBtn = document.getElementById('deleteSelected');
        const clearBtn = document.getElementById('clearAll');
       
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.selectedModule) {
                    this.removeModule(this.selectedModule.dataset.id);
                } else {
                    alert('Пожалуйста, выберите модуль для удаления');
                }
            });
           
            // Мобильная версия
            deleteBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.selectedModule) {
                    this.removeModule(this.selectedModule.dataset.id);
                } else {
                    alert('Пожалуйста, выберите модуль для удаления');
                }
            });
        }
       
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите удалить все модули?')) {
                    this.clearAllModules();
                }
            });
           
            // Мобильная версия
            clearBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (confirm('Вы уверены, что хотите удалить все модули?')) {
                    this.clearAllModules();
                }
            });
        }
    },

    setupVisualizationArea() {
        const container = document.getElementById('visualizationContainer');
        if (!container) {
            console.error('Visualization container not found');
            return;
        }
       
        // Обработчик клика для выделения модуля (десктоп)
        container.addEventListener('click', (e) => {
            this.handleModuleSelection(e);
        });
       
        // Обработчик тача для выделения модуля (мобильные)
        container.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleModuleSelection(e);
        });
       
        // Обработчики для перемещения модулей (десктоп)
        container.addEventListener('mousedown', (e) => this.startDragging(e));
        document.addEventListener('mousemove', (e) => this.dragModule(e));
        document.addEventListener('mouseup', () => this.stopDragging());
       
        // Обработчики для перемещения модулей (мобильные)
        container.addEventListener('touchstart', (e) => this.startTouchDragging(e), { passive: false });
        container.addEventListener('touchmove', (e) => this.touchDragModule(e), { passive: false });
        container.addEventListener('touchend', () => this.stopDragging());
       
        console.log('Visualization area setup complete');
    },

    handleModuleSelection(e) {
        const moduleElement = e.target.closest('.module');
        if (moduleElement) {
            document.querySelectorAll('.module').forEach(mod => {
                mod.classList.remove('selected');
            });
           
            moduleElement.classList.add('selected');
            this.selectedModule = moduleElement;
            console.log('Module selected:', moduleElement.dataset.id);
        } else {
            document.querySelectorAll('.module').forEach(mod => {
                mod.classList.remove('selected');
            });
            this.selectedModule = null;
        }
    },

    startDragging(e) {
        const moduleElement = e.target.closest('.module');
        if (!moduleElement) return;
       
        e.preventDefault();
        this.selectAndStartDrag(moduleElement, e.clientX, e.clientY);
    },

    startTouchDragging(e) {
        const moduleElement = e.target.closest('.module');
        if (!moduleElement) return;
       
        e.preventDefault();
        const touch = e.touches[0];
        this.selectAndStartDrag(moduleElement, touch.clientX, touch.clientY);
    },

    selectAndStartDrag(moduleElement, clientX, clientY) {
        document.querySelectorAll('.module').forEach(mod => {
            mod.classList.remove('selected');
        });
        moduleElement.classList.add('selected');
        this.selectedModule = moduleElement;
       
        this.isDragging = true;
        moduleElement.classList.add('dragging');
       
        const rect = moduleElement.getBoundingClientRect();
        this.dragOffsetX = clientX - rect.left;
        this.dragOffsetY = clientY - rect.top;
       
        console.log('Started dragging module:', moduleElement.dataset.id);
    },

    dragModule(e) {
        if (!this.isDragging || !this.selectedModule) return;
       
        e.preventDefault();
        this.updateModulePosition(e.clientX, e.clientY);
    },

    touchDragModule(e) {
        if (!this.isDragging || !this.selectedModule) return;
       
        e.preventDefault();
        const touch = e.touches[0];
        this.updateModulePosition(touch.clientX, touch.clientY);
    },

    updateModulePosition(clientX, clientY) {
        const container = document.getElementById('visualizationContainer');
        const containerRect = container.getBoundingClientRect();
       
        let newX = clientX - containerRect.left - this.dragOffsetX;
        let newY = clientY - containerRect.top - this.dragOffsetY;
       
        const moduleWidth = parseInt(this.selectedModule.style.width) || 120;
        const moduleHeight = parseInt(this.selectedModule.style.height) || 80;
       
        newX = Math.max(0, Math.min(newX, containerRect.width - moduleWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - moduleHeight));
       
        this.selectedModule.style.left = `${newX}px`;
        this.selectedModule.style.top = `${newY}px`;
       
        const moduleId = parseInt(this.selectedModule.dataset.id);
        const moduleIndex = this.placedModules.findIndex(m => m.id === moduleId);
        if (moduleIndex !== -1) {
            this.placedModules[moduleIndex].x = newX;
            this.placedModules[moduleIndex].y = newY;
        }
    },

    stopDragging() {
        if (this.isDragging && this.selectedModule) {
            this.selectedModule.classList.remove('dragging');
            this.isDragging = false;
            console.log('Stopped dragging module');
        }
    },

    addModuleToVisualization(moduleData) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            auth.showAuth();
            return;
        }
       
        this.moduleCounter++;
       
        const module = {
            id: this.moduleCounter,
            typeId: moduleData.id,
            name: moduleData.name,
            price: moduleData.price,
            x: 50 + (this.placedModules.length * 10),
            y: 50 + (this.placedModules.length * 10),
            width: moduleData.width,
            height: moduleData.height,
            depth: moduleData.depth,
            textures: moduleData.textures
        };
       
        this.placedModules.push(module);
        this.addToCart(module);
        this.updateVisualization();
       
        console.log('Module added to visualization:', module);
    },

    updateVisualization() {
        const container = document.getElementById('visualizationContainer');
        if (!container) {
            console.error('Visualization container not found');
            return;
        }
       
        container.innerHTML = '';
       
        this.placedModules.forEach(module => {
            const moduleElement = document.createElement('div');
            moduleElement.className = 'module';
            moduleElement.dataset.id = module.id;
           
            let width, height, texture;
           
            switch(this.currentView) {
                case 'front':
                    width = module.width;
                    height = module.height;
                    texture = module.textures.front;
                    break;
                case 'side':
                    width = module.depth;
                    height = module.height;
                    texture = module.textures.left;
                    break;
                case 'top':
                    width = module.width;
                    height = module.depth;
                    texture = module.textures.top;
                    break;
                default:
                    width = module.width;
                    height = module.height;
                    texture = module.textures.front;
            }
           
            moduleElement.style.width = `${width}px`;
            moduleElement.style.height = `${height}px`;
            moduleElement.style.left = `${module.x}px`;
            moduleElement.style.top = `${module.y}px`;
           
            // Добавляем атрибут для тач-устройств
            moduleElement.setAttribute('data-touch', 'true');
           
            const img = document.createElement('img');
            img.src = texture;
            img.alt = `${module.name} - ${this.currentView} view`;
            img.onerror = function() {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTIwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIGZpbGw9IiMzN2RlZGUiLz48dGV4dCB4PSI2MCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk1vZHVsZSAkewB7bW9kdWxlLmlkfX08L3RleHQ+PC9zdmc+';
            };
            moduleElement.appendChild(img);
           
            container.appendChild(moduleElement);
        });
       
        console.log('Visualization updated with', this.placedModules.length, 'modules');
    },

    removeModule(moduleId) {
        const moduleIndex = this.placedModules.findIndex(m => m.id == moduleId);
        if (moduleIndex !== -1) {
            const module = this.placedModules[moduleIndex];
            this.removeFromCart(module);
            this.placedModules.splice(moduleIndex, 1);
            this.updateVisualization();
            this.selectedModule = null;
            console.log('Module removed:', moduleId);
        }
    },

    clearAllModules() {
        this.placedModules = [];
        this.cartItems = [];
        this.totalPrice = 0;
        this.selectedModule = null;
        this.updateVisualization();
        this.updateCart();
        console.log('All modules cleared');
    },

    addToCart(module) {
        this.cartItems.push(module);
        this.totalPrice += module.price;
        this.updateCart();
        console.log('Module added to cart:', module.name);
    },

    removeFromCart(module) {
        const index = this.cartItems.findIndex(item => item.id === module.id);
        if (index !== -1) {
            this.cartItems.splice(index, 1);
            this.totalPrice -= module.price;
            this.updateCart();
            console.log('Module removed from cart:', module.name);
        }
    },

    updateCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
       
        if (!cartItemsContainer || !cartTotal) {
            console.error('Cart elements not found');
            return;
        }
       
        cartItemsContainer.innerHTML = '';
       
        if (this.cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p>Ваша корзина пуста</p>';
        } else {
            this.cartItems.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
               
                cartItemElement.innerHTML = `
                    <div>
                        <div>${item.name}</div>
                        <small>ID: ${item.id}</small>
                    </div>
                    <div>₽${item.price.toLocaleString()}</div>
                `;
               
                cartItemsContainer.appendChild(cartItemElement);
            });
        }
       
        cartTotal.textContent = `Итого: ₽${this.totalPrice.toLocaleString()}`;
        console.log('Cart updated, total:', this.totalPrice);
    }
};
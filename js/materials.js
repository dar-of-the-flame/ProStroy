const materials = {
    materialsData: [
        {
            id: 1,
            name: "Сосновая доска 1м×20см",
            price: 135000,
            category: "lumber",
            image: "img/доски.jpg",
            description: "Качественная сосновая доска для строительных работ",
            inStock: true,
            discount: 10
        },
        {
            id: 2,
            name: "Стеновые панели ПВХ",
            price: 89000,
            category: "finishing",
            image: "img/стенка.jpg",
            description: "Влагостойкие стеновые панели для внутренней отделки",
            inStock: true,
            discount: 5
        },
        {
            id: 3,
            name: "Декоративный камень",
            price: 156000,
            category: "finishing",
            image: "img/камень.jpg",
            description: "Искусственный декоративный камень для фасадных работ",
            inStock: true,
            discount: 0
        },
        {
            id: 4,
            name: "Облицовочный кирпич",
            price: 234000,
            category: "finishing",
            image: "img/кладка2.jpg",
            description: "Высококачественный облицовочный кирпич",
            inStock: true,
            discount: 15
        },
        {
            id: 5,
            name: "Брус 100×100 мм",
            price: 187000,
            category: "lumber",
            image: "img/доски.jpg",
            description: "Строительный брус из хвойных пород дерева",
            inStock: true,
            discount: 8
        },
        {
            id: 6,
            name: "Цемент М500",
            price: 45000,
            category: "foundation",
            image: "img/камень.jpg",
            description: "Цемент высшей марки для фундаментных работ",
            inStock: true,
            discount: 0
        },
        {
            id: 7,
            name: "Металлочерепица",
            price: 321000,
            category: "roofing",
            image: "img/стенка.jpg",
            description: "Профилированная металлочерепица с полимерным покрытием",
            inStock: false,
            discount: 12
        },
        {
            id: 8,
            name: "Минеральная вата",
            price: 67000,
            category: "insulation",
            image: "img/кладка2.jpg",
            description: "Теплоизоляционный материал для стен и перекрытий",
            inStock: true,
            discount: 5
        },
        {
            id: 9,
            name: "Гипсокартон влагостойкий",
            price: 78000,
            category: "finishing",
            image: "img/доски.jpg",
            description: "Влагостойкий гипсокартон для помещений с повышенной влажностью",
            inStock: true,
            discount: 7
        },
        {
            id: 10,
            name: "Пенополистирол",
            price: 54000,
            category: "insulation",
            image: "img/камень.jpg",
            description: "Экструдированный пенополистирол для утепления",
            inStock: true,
            discount: 3
        },
        {
            id: 11,
            name: "Фанера влагостойкая",
            price: 92000,
            category: "lumber",
            image: "img/кладка2.jpg",
            description: "Влагостойкая фанера для наружных работ",
            inStock: true,
            discount: 5
        },
        {
            id: 12,
            name: "Плитка керамическая",
            price: 123000,
            category: "finishing",
            image: "img/стенка.jpg",
            description: "Керамическая плитка для пола и стен",
            inStock: true,
            discount: 10
        }
    ],

    init() {
        if (!auth.getCurrentUser()) {
            console.log('Пользователь не авторизован, доступ к материалам закрыт');
            return;
        }
        
        this.loadMaterials();
        this.setupFilters();
        this.setupMobileOptimizations();
        cart.updateCartDisplay();
        
        console.log('Модуль материалов инициализирован');
    },

    setupMobileOptimizations() {
        // Улучшаем обработку касаний для карточек
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('touchend', (e) => {
                e.preventDefault();
            }, { passive: false });
        });

        // Улучшаем фильтры для мобильных
        const filterSelects = document.querySelectorAll('.filter-select, .search-box');
        filterSelects.forEach(select => {
            select.style.fontSize = '16px'; // Предотвращаем zoom на iOS
        });

        // Улучшаем кнопки для мобильных
        const buttons = document.querySelectorAll('.card__add, .auth-btn');
        buttons.forEach(button => {
            button.style.minHeight = '44px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
        });
    },

    loadMaterials() {
        const materialsGrid = document.getElementById('materials-grid');
        if (!materialsGrid) {
            console.error('Контейнер для материалов не найден');
            return;
        }
        
        materialsGrid.innerHTML = '';
        
        if (this.materialsData.length === 0) {
            materialsGrid.innerHTML = '<p style="text-align: center; color: var(--text-primary); padding: 40px;">Материалы временно недоступны</p>';
            return;
        }
        
        this.materialsData.forEach(material => {
            const materialCard = document.createElement('div');
            materialCard.className = 'card';
            materialCard.dataset.category = material.category;
            materialCard.dataset.price = material.price;
            materialCard.dataset.name = material.name.toLowerCase();
            materialCard.dataset.id = material.id;
            
            const discountPrice = material.discount > 0 ? 
                material.price * (1 - material.discount / 100) : 
                material.price;
            
            materialCard.innerHTML = `
                <div class="card__top">
                    <div class="card__image">
                        <img src="${material.image}" alt="${material.name}" loading="lazy" 
                             onerror="this.src='img/placeholder.jpg'; this.alt='Изображение недоступно'"/>
                    </div>
                    ${material.discount > 0 ? 
                        `<div class="card__label" style="background: #ff6633;">-${material.discount}%</div>` : ''}
                    ${!material.inStock ? 
                        `<div class="card__label" style="background: #666; left: ${material.discount > 0 ? '80px' : '10px'};">Нет в наличии</div>` : ''}
                </div>
                <div class="card__bottom">
                    <div class="card__prices">
                        ${material.discount > 0 ? 
                            `<div class="card__price card__price--discount">${Math.round(discountPrice).toLocaleString('ru-RU')}</div>
                             <div class="card__price card__price--common">${material.price.toLocaleString('ru-RU')}</div>` :
                            `<div class="card__price card__price--discount">${material.price.toLocaleString('ru-RU')}</div>`
                        }
                    </div>
                    <div class="card__title">
                        ${material.name}
                    </div>
                    <p class="material-description">${material.description}</p>
                    <button class="card__add material-add-btn" 
                            onclick="materials.addToCart(${material.id})" 
                            ${!material.inStock ? 'disabled' : ''}
                            data-material-id="${material.id}">
                        ${material.inStock ? '🛒 В корзину' : '❌ Нет в наличии'}
                    </button>
                </div>
            `;
            
            materialsGrid.appendChild(materialCard);
        });

        // Добавляем обработчики для мобильных устройств
        this.setupMaterialCardEvents();
    },

    setupMaterialCardEvents() {
        // Обработчики для улучшения UX на мобильных
        const addButtons = document.querySelectorAll('.material-add-btn');
        addButtons.forEach(button => {
            button.addEventListener('touchstart', function(e) {
                this.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', function(e) {
                this.style.transform = 'scale(1)';
            });
        });
    },

    setupFilters() {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const categoryTabs = document.querySelectorAll('.category-tab');
        const applyFiltersBtn = document.querySelector('.filter-controls .auth-btn');
        const resetFiltersBtn = document.querySelector('.filter-controls .auth-btn[style*="background: #ff6633"]');
        
        // Поиск
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 300);
            });
            
            searchInput.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            });
        }
        
        // Фильтр категорий
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        // Фильтр цен
        if (priceFilter) {
            priceFilter.addEventListener('change', () => this.applyFilters());
        }
        
        // Вкладки категорий
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const category = tab.dataset.category;
                if (categoryFilter) {
                    categoryFilter.value = category === 'all' ? '' : category;
                }
                this.applyFilters();
            });

            // Оптимизация для касаний
            tab.addEventListener('touchend', (e) => {
                e.preventDefault();
                tab.click();
            });
        });
        
        // Кнопка применения фильтров
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
            applyFiltersBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }
        
        // Кнопка сброса фильтров
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => this.resetFilters());
            resetFiltersBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.resetFilters();
            });
        }
    },

    applyFilters() {
        const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const priceFilter = document.getElementById('price-filter')?.value || '';
        const activeTab = document.querySelector('.category-tab.active');
        
        // Обновляем активную вкладку если выбран фильтр категории
        if (categoryFilter && activeTab && activeTab.dataset.category !== 'all') {
            if (activeTab.dataset.category !== categoryFilter) {
                document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
                const correspondingTab = document.querySelector(`.category-tab[data-category="${categoryFilter}"]`);
                if (correspondingTab) {
                    correspondingTab.classList.add('active');
                }
            }
        }
        
        const cards = document.querySelectorAll('.card');
        let visibleCount = 0;
        
        cards.forEach(card => {
            const name = card.dataset.name || '';
            const category = card.dataset.category || '';
            const price = parseInt(card.dataset.price) || 0;
            
            let matchesSearch = true;
            let matchesCategory = true;
            let matchesPrice = true;
            
            // Поиск по названию
            if (searchTerm) {
                matchesSearch = name.includes(searchTerm);
            }
            
            // Фильтр категории
            if (categoryFilter) {
                matchesCategory = category === categoryFilter;
            }
            
            // Фильтр цены
            if (priceFilter) {
                switch (priceFilter) {
                    case '0-50000':
                        matchesPrice = price <= 50000;
                        break;
                    case '50000-150000':
                        matchesPrice = price >= 50000 && price <= 150000;
                        break;
                    case '150000-300000':
                        matchesPrice = price >= 150000 && price <= 300000;
                        break;
                    case '300000+':
                        matchesPrice = price >= 300000;
                        break;
                }
            }
            
            if (matchesSearch && matchesCategory && matchesPrice) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Показываем сообщение если ничего не найдено
        this.showNoResultsMessage(visibleCount === 0);
    },

    showNoResultsMessage(show) {
        let messageElement = document.getElementById('no-results-message');
        
        if (show) {
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.id = 'no-results-message';
                messageElement.style.cssText = `
                    text-align: center;
                    padding: 40px;
                    color: var(--text-secondary);
                    font-size: 18px;
                    grid-column: 1 / -1;
                `;
                messageElement.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                    <h3>Материалы не найдены</h3>
                    <p>Попробуйте изменить параметры поиска или фильтры</p>
                    <button class="auth-btn" onclick="materials.resetFilters()" 
                            style="margin-top: 20px; background: var(--accent-primary);">
                        Сбросить фильтры
                    </button>
                `;
                
                const materialsGrid = document.getElementById('materials-grid');
                if (materialsGrid) {
                    materialsGrid.appendChild(messageElement);
                }
            }
        } else {
            if (messageElement) {
                messageElement.remove();
            }
        }
    },

    resetFilters() {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const categoryTabs = document.querySelectorAll('.category-tab');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (priceFilter) priceFilter.value = '';
        
        categoryTabs.forEach(tab => tab.classList.remove('active'));
        const allTab = document.querySelector('.category-tab[data-category="all"]');
        if (allTab) allTab.classList.add('active');
        
        this.applyFilters();
        
        // Показываем уведомление о сбросе
        this.showNotification('Фильтры сброшены', 'info');
    },

    addToCart(materialId) {
        // Проверяем авторизацию
        if (!auth.getCurrentUser()) {
            auth.showAuth();
            this.showNotification('Для добавления в корзину необходимо войти в систему', 'info');
            return;
        }
        
        const material = this.materialsData.find(m => m.id === materialId);
        if (!material) {
            this.showNotification('Материал не найден', 'error');
            return;
        }
        
        if (!material.inStock) {
            this.showNotification('Этот материал временно отсутствует в наличии', 'info');
            return;
        }
        
        const discountPrice = material.discount > 0 ? 
            material.price * (1 - material.discount / 100) : 
            material.price;
        
        // Добавляем в корзину с типом 'material'
        cart.addToCart(material.name, Math.round(discountPrice), 'material');
        
        // Визуальная обратная связь
        this.animateAddToCart(materialId);
        
        // Виброотклик на поддерживающих устройствах
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    },

    animateAddToCart(materialId) {
        const button = document.querySelector(`.material-add-btn[data-material-id="${materialId}"]`);
        if (button) {
            // Анимация кнопки
            button.style.transform = 'scale(0.9)';
            button.style.backgroundColor = '#4CAF50';
            button.innerHTML = '✅ Добавлено';
            
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.style.backgroundColor = '';
                button.innerHTML = '🛒 В корзину';
            }, 1000);
        }
    },

    showNotification(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#4CAF50' : 
                       type === 'error' ? '#ff6633' : '#2196F3';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: bold;
            max-width: 300px;
            word-wrap: break-word;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    },

    // Дополнительные методы для управления материалами
    getMaterialById(id) {
        return this.materialsData.find(material => material.id === id);
    },

    getMaterialsByCategory(category) {
        return this.materialsData.filter(material => material.category === category);
    },

    getAvailableMaterials() {
        return this.materialsData.filter(material => material.inStock);
    },

    getDiscountedMaterials() {
        return this.materialsData.filter(material => material.discount > 0 && material.inStock);
    },

    // Метод для обновления данных материалов (может быть полезен для админки)
    updateMaterialStock(materialId, inStock) {
        const material = this.getMaterialById(materialId);
        if (material) {
            material.inStock = inStock;
            this.loadMaterials(); // Перезагружаем отображение
            return true;
        }
        return false;
    }
};

// Глобальные функции для удобства
window.addToCart = (materialId) => materials.addToCart(materialId);
window.resetMaterialFilters = () => materials.resetFilters();
window.applyMaterialFilters = () => materials.applyFilters();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Небольшая задержка для инициализации после auth
    setTimeout(() => {
        if (document.getElementById('materials-grid')) {
            materials.init();
        }
    }, 100);
});
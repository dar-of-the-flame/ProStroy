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
        }
    ],

    init() {
        if (!auth.getCurrentUser()) return;
        
        this.loadMaterials();
        this.setupFilters();
        cart.updateCartDisplay();
    },

    loadMaterials() {
        const materialsGrid = document.getElementById('materials-grid');
        if (!materialsGrid) return;
        
        materialsGrid.innerHTML = '';
        
        this.materialsData.forEach(material => {
            const materialCard = document.createElement('div');
            materialCard.className = 'card';
            materialCard.dataset.category = material.category;
            materialCard.dataset.price = material.price;
            materialCard.dataset.name = material.name.toLowerCase();
const discountPrice = material.discount > 0 ? 
                material.price * (1 - material.discount / 100) : 
                material.price;
            
            materialCard.innerHTML = `
                <div class="card__top">
                    <a href="#" class="card__image">
                        <img src="${material.image}" alt="${material.name}"/>
                    </a>
                    ${material.discount > 0 ? <div class="card__label">-${material.discount}%</div> : ''}
                    ${!material.inStock ? <div class="card__label" style="background: #ff6633;">Нет в наличии</div> : ''}
                </div>
                <div class="card__bottom">
                    <div class="card__prices">
                        ${material.discount > 0 ? 
                            `<div class="cardprice cardprice--discount">${Math.round(discountPrice).toLocaleString()}</div>
                             <div class="cardprice cardprice--common">${material.price.toLocaleString()}</div> `:
                            `<div class="cardprice cardprice--discount">${material.price.toLocaleString()}</div>`
                        }
                    </div>
                    <a href="#" class="card__title">
                        ${material.name}
                    </a>
                    <p style="color: #ccc; font-size: 14px; margin: 10px 0;">${material.description}</p>
                    <button class="card__add" 
                            onclick="materials.addToCart(${material.id})" 
                            ${!material.inStock ? 'disabled style="background: #666;"' : ''}>
                        ${material.inStock ? 'В корзину' : 'Нет в наличии'}
                    </button>
                </div>
            `;
            
            materialsGrid.appendChild(materialCard);
        });
    },

    setupFilters() {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const categoryTabs = document.querySelectorAll('.category-tab');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (priceFilter) {
            priceFilter.addEventListener('change', () => this.applyFilters());
        }
        
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
        });
    },

    applyFilters() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const priceFilter = document.getElementById('price-filter')?.value || '';
        
        const cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            const name = card.dataset.name;
            const category = card.dataset.category;
            const price = parseInt(card.dataset.price);
            
            let matchesSearch = name.includes(searchTerm);
            let matchesCategory = !categoryFilter || category === categoryFilter;
            let matchesPrice = true;
if (priceFilter) {
                if (priceFilter === '0-50000') {
                    matchesPrice = price <= 50000;
                } else if (priceFilter === '50000-150000') {
                    matchesPrice = price >= 50000 && price <= 150000;
                } else if (priceFilter === '150000-300000') {
                    matchesPrice = price >= 150000 && price <= 300000;
                } else if (priceFilter === '300000+') {
                    matchesPrice = price >= 300000;
                }
            }
            
            if (matchesSearch && matchesCategory && matchesPrice) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
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
        
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.display = 'block';
        });
    },

    addToCart(materialId) {
        const material = this.materialsData.find(m => m.id === materialId);
        if (!material) return;
        
        const discountPrice = material.discount > 0 ? 
            material.price * (1 - material.discount / 100) : 
            material.price;
        
        cart.addToCart(material.name, Math.round(discountPrice));
    }
};
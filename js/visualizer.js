// visualizer.js - с 3D режимом
class Visualizer {
    constructor() {
        this.modules = [
            {
                id: 1,
                name: "Базовый модуль",
                price: 50000,
                width: 2,    // в метрах для 3D
                height: 2.5,
                depth: 3,
                color: "#8B4513"
            },
            {
                id: 2,
                name: "Узкий модуль",
                price: 35000,
                width: 1.5,
                height: 2.5,
                depth: 3,
                color: "#708090"
            },
            {
                id: 3,
                name: "Высокий модуль",
                price: 65000,
                width: 2,
                height: 3.5,
                depth: 3,
                color: "#2F4F4F"
            },
            {
                id: 4,
                name: "Широкий модуль",
                price: 80000,
                width: 3,
                height: 2.5,
                depth: 3,
                color: "#87CEEB"
            }
        ];

        this.placedModules = [];
        this.selectedModule = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.mode = '2D'; // '2D' или '3D'
       
        // 3D переменные
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.threeDObjects = [];
       
        this.init();
    }

    init() {
        console.log('Initializing visualizer...');
       
        if (!auth.getCurrentUser()) {
            console.log('User not authenticated');
            return;
        }

        this.renderModuleList();
        this.setupEventListeners();
        this.setupModeControls();
        this.updateCart();
    }

    setupModeControls() {
        const mode2D = document.getElementById('mode2D');
        const mode3D = document.getElementById('mode3D');
       
        if (mode2D) {
            mode2D.addEventListener('click', () => this.switchMode('2D'));
        }
       
        if (mode3D) {
            mode3D.addEventListener('click', () => this.switchMode('3D'));
        }
    }

    switchMode(newMode) {
        if (this.mode === newMode) return;
       
        this.mode = newMode;
       
        const container2D = document.getElementById('visualizationContainer');
        const container3D = document.getElementById('visualization3DContainer');
       
        if (newMode === '3D') {
            container2D.style.display = 'none';
            container3D.style.display = 'block';
            this.init3D();
            this.render3D();
        } else {
            container2D.style.display = 'block';
            container3D.style.display = 'none';
            this.update2D();
        }
       
        // Обновляем активные кнопки
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`mode${newMode}`).classList.add('active');
    }

    init3D() {
        const container = document.getElementById('visualization3DContainer');
        if (!container) return;

        // Создаем сцену
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x343434);

        // Создаем камеру
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(10, 8, 10);
        this.camera.lookAt(0, 0, 0);

        // Создаем рендерер
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // Добавляем освещение
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);

        // Добавляем сетку пола
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);

        // Добавляем оси координат
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Обработчик изменения размера
        window.addEventListener('resize', () => this.onWindowResize());
    }

    render3D() {
        // Очищаем старые объекты
        this.threeDObjects.forEach(obj => this.scene.remove(obj));
        this.threeDObjects = [];

        // Создаем 3D объекты для каждого модуля
        this.placedModules.forEach(module => {
            const geometry = new THREE.BoxGeometry(module.width, module.height, module.depth);
            const material = new THREE.MeshLambertMaterial({
                color: module.color,
                transparent: true,
                opacity: 0.9
            });
           
            const cube = new THREE.Mesh(geometry, material);
           
            // Позиционируем модуль
            cube.position.x = module.x * 0.1; // Масштабируем для 3D
            cube.position.y = module.height / 2; // Ставим на "пол"
            cube.position.z = module.y * 0.1;
           
            cube.userData = { moduleId: module.id };
           
            this.scene.add(cube);
            this.threeDObjects.push(cube);
        });

        this.animate3D();
    }

    animate3D() {
        requestAnimationFrame(() => this.animate3D());
       
        // Медленно вращаем камеру вокруг сцены
        if (this.camera) {
            const time = Date.now() * 0.0005;
            this.camera.position.x = Math.cos(time) * 15;
            this.camera.position.z = Math.sin(time) * 15;
            this.camera.lookAt(0, 0, 0);
        }
       
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
       
        const container = document.getElementById('visualization3DContainer');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    renderModuleList() {
        const grid = document.getElementById('modulesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.modules.forEach(module => {
            const div = document.createElement('div');
            div.className = 'module-item';
            div.innerHTML = `
                <div class="module-preview" style="background: ${module.color}; height: 60px; border-radius: 4px;"></div>
                <div class="module-name">${module.name}</div>
                <div class="module-price">₽${module.price.toLocaleString()}</div>
            `;
           
            div.addEventListener('click', () => this.addModule(module));
            grid.appendChild(div);
        });
    }

    setupEventListeners() {
        const container = document.getElementById('visualizationContainer');
        if (!container) return;

        // Выделение модуля
        container.addEventListener('click', (e) => {
            const module = e.target.closest('.module');
            if (module) {
                this.selectModule(module);
            } else {
                this.deselectModule();
            }
        });

        // Перемещение модулей (только в 2D)
        container.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());

        // Кнопки управления
        const deleteBtn = document.getElementById('deleteSelected');
        const clearBtn = document.getElementById('clearAll');
       
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteSelected());
        }
       
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }
    }

    addModule(moduleData) {
        const module = {
            id: Date.now(),
            typeId: moduleData.id,
            name: moduleData.name,
            price: moduleData.price,
            width: moduleData.width,
            height: moduleData.height,
            depth: moduleData.depth,
            x: 50 + Math.random() * 300,
            y: 50 + Math.random() * 200,
            color: moduleData.color
        };

        this.placedModules.push(module);
       
        if (this.mode === '2D') {
            this.renderModule2D(module);
        } else {
            this.render3D();
        }
       
        this.addToCart(module);
    }

    renderModule2D(module) {
        const container = document.getElementById('visualizationContainer');
        if (!container) return;

        const div = document.createElement('div');
        div.className = 'module';
        div.dataset.id = module.id;
       
        div.style.width = module.width * 40 + 'px'; // Масштабируем для 2D
        div.style.height = module.height * 40 + 'px';
        div.style.left = module.x + 'px';
        div.style.top = module.y + 'px';
        div.style.backgroundColor = module.color;
        div.style.border = '2px solid #37dede';

        // Добавляем тень для объема
        div.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';

        container.appendChild(div);
    }

    update2D() {
        const container = document.getElementById('visualizationContainer');
        if (!container) return;

        container.innerHTML = '';
        this.placedModules.forEach(module => this.renderModule2D(module));
    }

    selectModule(moduleElement) {
        document.querySelectorAll('.module').forEach(m => {
            m.classList.remove('selected');
        });
       
        moduleElement.classList.add('selected');
        this.selectedModule = moduleElement;
    }

    deselectModule() {
        document.querySelectorAll('.module').forEach(m => {
            m.classList.remove('selected');
        });
        this.selectedModule = null;
    }

    startDrag(e) {
        if (this.mode !== '2D') return;
       
        const module = e.target.closest('.module');
        if (!module) return;

        e.preventDefault();
        this.selectModule(module);
       
        this.isDragging = true;
        module.classList.add('dragging');

        const rect = module.getBoundingClientRect();
        const container = document.getElementById('visualizationContainer');
        const containerRect = container.getBoundingClientRect();
       
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
    }

    drag(e) {
        if (!this.isDragging || !this.selectedModule || this.mode !== '2D') return;

        const container = document.getElementById('visualizationContainer');
        const containerRect = container.getBoundingClientRect();
       
        let newX = e.clientX - containerRect.left - this.dragOffset.x;
        let newY = e.clientY - containerRect.top - this.dragOffset.y;

        // Границы контейнера
        const moduleWidth = parseInt(this.selectedModule.style.width);
        const moduleHeight = parseInt(this.selectedModule.style.height);
       
        newX = Math.max(0, Math.min(newX, containerRect.width - moduleWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - moduleHeight));

        // Обновляем позицию
        this.selectedModule.style.left = newX + 'px';
        this.selectedModule.style.top = newY + 'px';

        // Обновляем данные модуля
        const moduleId = parseInt(this.selectedModule.dataset.id);
        const module = this.placedModules.find(m => m.id === moduleId);
        if (module) {
            module.x = newX;
            module.y = newY;
        }
    }

    stopDrag() {
        if (this.isDragging && this.selectedModule) {
            this.selectedModule.classList.remove('dragging');
            this.isDragging = false;
        }
    }

    deleteSelected() {
        if (!this.selectedModule) {
            alert('Выберите модуль для удаления');
            return;
        }

        const moduleId = parseInt(this.selectedModule.dataset.id);
        this.removeModule(moduleId);
    }

    removeModule(moduleId) {
        const moduleIndex = this.placedModules.findIndex(m => m.id === moduleId);
        if (moduleIndex !== -1) {
            const module = this.placedModules[moduleIndex];
            this.placedModules.splice(moduleIndex, 1);
            this.removeFromCart(module);
        }

        if (this.mode === '2D') {
            const moduleElement = document.querySelector(`.module[data-id="${moduleId}"]`);
            if (moduleElement) {
                moduleElement.remove();
            }
        } else {
            this.render3D();
        }

        this.selectedModule = null;
    }

    clearAll() {
        if (!confirm('Удалить все модули?')) return;

        this.placedModules = [];
        this.cartItems = [];
        this.totalPrice = 0;
       
        if (this.mode === '2D') {
            const container = document.getElementById('visualizationContainer');
            if (container) {
                container.innerHTML = '';
            }
        } else {
            this.render3D();
        }
       
        this.updateCart();
    }

    addToCart(module) {
        if (!this.cartItems) this.cartItems = [];
        if (!this.totalPrice) this.totalPrice = 0;
       
        this.cartItems.push(module);
        this.totalPrice += module.price;
        this.updateCart();
    }

    removeFromCart(module) {
        if (!this.cartItems) return;
       
        const index = this.cartItems.findIndex(item => item.id === module.id);
        if (index !== -1) {
            this.cartItems.splice(index, 1);
            this.totalPrice -= module.price;
            this.updateCart();
        }
    }

    updateCart() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
       
        if (!cartItems || !cartTotal) return;

        if (!this.cartItems || this.cartItems.length === 0) {
            cartItems.innerHTML = '<p>Корзина пуста</p>';
            cartTotal.textContent = 'Итого: ₽0';
        } else {
            cartItems.innerHTML = '';
            this.cartItems.forEach(item => {
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div>${item.name}</div>
                    <div>₽${item.price.toLocaleString()}</div>
                `;
                cartItems.appendChild(div);
            });
           
            cartTotal.textContent = `Итого: ₽${this.totalPrice.toLocaleString()}`;
        }
    }

    checkout() {
        if (!this.cartItems || this.cartItems.length === 0) {
            alert('Корзина пуста!');
            return;
        }
       
        const user = auth.getCurrentUser();
        if (!user) {
            auth.showAuth();
            return;
        }
       
        if (confirm(`Оформить заказ на сумму ₽${this.totalPrice.toLocaleString()}?`)) {
            alert(`Заказ оформлен! Спасибо, ${user}!`);
            this.clearAll();
        }
    }
}

// Создаем глобальный экземпляр
const visualizer = new Visualizer();
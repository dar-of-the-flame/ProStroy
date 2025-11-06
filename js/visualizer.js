// visualizer.js - исправленная версия с работающим управлением и исправлением размещения
class Visualizer {
    constructor() {
        this.modules = [
            {
                id: 1,
                name: "Базовый модуль",
                price: 50000,
                width: 4,
                height: 2.5,
                depth: 6,
                color: "#8B4513"
            },
            {
                id: 2,
                name: "Узкий модуль",
                price: 35000,
                width: 3,
                height: 2.5,
                depth: 6,
                color: "#708090"
            },
            {
                id: 3,
                name: "Высокий модуль",
                price: 65000,
                width: 4,
                height: 3.5,
                depth: 6,
                color: "#2F4F4F"
            },
            {
                id: 4,
                name: "Широкий модуль",
                price: 80000,
                width: 6,
                height: 2.5,
                depth: 6,
                color: "#87CEEB"
            }
        ];

        this.placedModules = [];
        this.selectedModule = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.mode = '2D';
       
        // 3D переменные
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.threeDObjects = new Map();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragging3D = null;
        
        // Управление модулем
        this.moduleControls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            moveUp: false,
            moveDown: false,
            speed: 1.0
        };
        
        // Система соединения блоков
        this.snapDistance = 0.5;
        this.gridSize = 1;
       
        this.cartItems = [];
        this.totalPrice = 0;

        // Определяем тип устройства
        this.isMobile = this.detectMobile();
        this.keyboardEnabled = true;

        this.init();
    }

    // Определение мобильного устройства
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth < 768;
    }

    init() {
        console.log('Initializing visualizer...');
        console.log('Mobile device:', this.isMobile);
       
        if (!auth.getCurrentUser()) {
            console.log('User not authenticated');
            return;
        }

        this.renderModuleList();
        this.setupEventListeners();
        this.setupModeControls();
        this.setupKeyboardControls();
        
        // Создаем мобильные кнопки только для мобильных устройств
        if (this.isMobile) {
            this.createMobileControls();
        }
        
        this.updateCart();
    }

    createMobileControls() {
        const container = document.getElementById('visualization3DContainer');
        if (!container) return;

        // Создаем элементы управления для мобильных устройств
        const controlsHTML = `
            <div class="mobile-controls" id="mobileControls" style="display: none;">
                <div class="movement-controls">
                    <div class="control-row">
                        <button class="mobile-btn up" data-action="up">↑</button>
                    </div>
                    <div class="control-row">
                        <button class="mobile-btn left" data-action="left">←</button>
                        <button class="mobile-btn down" data-action="down">↓</button>
                        <button class="mobile-btn right" data-action="right">→</button>
                    </div>
                </div>
                <div class="vertical-controls">
                    <button class="mobile-btn elevate" data-action="elevate">↑ Высота</button>
                    <button class="mobile-btn lower" data-action="lower">↓ Высота</button>
                </div>
                <div class="action-controls">
                    <button class="mobile-btn select" data-action="select">Выбрать</button>
                    <button class="mobile-btn delete" data-action="delete">Удалить</button>
                    <button class="mobile-btn rotate" data-action="rotate">Повернуть</button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', controlsHTML);
        this.setupMobileEventListeners();
    }

    setupMobileEventListeners() {
        const mobileControls = document.getElementById('mobileControls');
        if (!mobileControls) return;

        mobileControls.addEventListener('touchstart', (e) => {
            const button = e.target.closest('.mobile-btn');
            if (!button) return;

            e.preventDefault();
            const action = button.dataset.action;
            this.handleMobileAction(action, true);
        });

        mobileControls.addEventListener('touchend', (e) => {
            const button = e.target.closest('.mobile-btn');
            if (!button) return;

            e.preventDefault();
            const action = button.dataset.action;
            this.handleMobileAction(action, false);
        });

        mobileControls.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleMobileAction(action, isActive) {
        switch(action) {
            case 'up':
                this.mobileControls.forward = isActive;
                break;
            case 'down':
                this.mobileControls.backward = isActive;
                break;
            case 'left':
                this.mobileControls.left = isActive;
                break;
            case 'right':
                this.mobileControls.right = isActive;
                break;
            case 'elevate':
                this.mobileControls.up = isActive;
                break;
            case 'lower':
                this.mobileControls.down = isActive;
                break;
            case 'select':
                if (isActive) this.selectNearestModule();
                break;
            case 'delete':
                if (isActive) this.deleteSelected();
                break;
            case 'rotate':
                if (isActive) this.rotateSelectedModule();
                break;
        }
    }

    selectNearestModule() {
        if (!this.camera || !this.scene) return;

        let nearestModule = null;
        let minDistance = Infinity;

        this.placedModules.forEach(module => {
            const mesh = this.threeDObjects.get(module.id);
            if (mesh) {
                const distance = mesh.position.distanceTo(this.camera.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestModule = mesh;
                }
            }
        });

        if (nearestModule) {
            this.selectModule3D(nearestModule);
        }
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.keyboardEnabled || this.mode !== '3D' || !this.selectedModule) return;

            switch(e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moduleControls.moveForward = true;
                    e.preventDefault();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moduleControls.moveBackward = true;
                    e.preventDefault();
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moduleControls.moveLeft = true;
                    e.preventDefault();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moduleControls.moveRight = true;
                    e.preventDefault();
                    break;
                case 'KeyQ':
                case 'PageUp':
                    this.moduleControls.moveUp = true;
                    e.preventDefault();
                    break;
                case 'KeyE':
                case 'PageDown':
                    this.moduleControls.moveDown = true;
                    e.preventDefault();
                    break;
                case 'KeyR': // Поворот модуля
                    this.rotateSelectedModule();
                    e.preventDefault();
                    break;
                case 'Delete':
                case 'Backspace':
                    this.deleteSelected();
                    e.preventDefault();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!this.keyboardEnabled) return;

            switch(e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moduleControls.moveForward = false;
                    e.preventDefault();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moduleControls.moveBackward = false;
                    e.preventDefault();
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moduleControls.moveLeft = false;
                    e.preventDefault();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moduleControls.moveRight = false;
                    e.preventDefault();
                    break;
                case 'KeyQ':
                case 'PageUp':
                    this.moduleControls.moveUp = false;
                    e.preventDefault();
                    break;
                case 'KeyE':
                case 'PageDown':
                    this.moduleControls.moveDown = false;
                    e.preventDefault();
                    break;
            }
        });

        // Включаем/выключаем клавиатурное управление при фокусе
        document.addEventListener('focus', () => {
            this.keyboardEnabled = true;
        });

        document.addEventListener('blur', () => {
            this.keyboardEnabled = false;
            // Сбрасываем все состояния управления при потере фокуса
            Object.keys(this.moduleControls).forEach(key => {
                if (key !== 'speed') this.moduleControls[key] = false;
            });
        });
    }

    updateModuleFromControls() {
        if (!this.selectedModule || this.mode !== '3D') return;

        const moduleId = this.selectedModule.userData.moduleId;
        const module = this.placedModules.find(m => m.id === moduleId);
        if (!module) return;

        let newX = module.x3D;
        let newZ = module.z3D;
        let newY = module.y3D;

        // Обработка клавиатурного управления
        if (this.moduleControls.moveForward) newZ -= this.moduleControls.speed;
        if (this.moduleControls.moveBackward) newZ += this.moduleControls.speed;
        if (this.moduleControls.moveLeft) newX -= this.moduleControls.speed;
        if (this.moduleControls.moveRight) newX += this.moduleControls.speed;
        if (this.moduleControls.moveUp) newY += this.moduleControls.speed;
        if (this.moduleControls.moveDown) newY = Math.max(0, newY - this.moduleControls.speed);

        // Обработка мобильного управления
        if (this.isMobile) {
            if (this.mobileControls.forward) newZ -= this.moduleControls.speed;
            if (this.mobileControls.backward) newZ += this.moduleControls.speed;
            if (this.mobileControls.left) newX -= this.moduleControls.speed;
            if (this.mobileControls.right) newX += this.moduleControls.speed;
            if (this.mobileControls.up) newY += this.moduleControls.speed;
            if (this.mobileControls.down) newY = Math.max(0, newY - this.moduleControls.speed);
        }

        // Применяем сетку
        const gridPosition = this.snapToGrid(new THREE.Vector3(newX, newY, newZ));
        
        // Проверяем коллизии только если позиция изменилась
        if (newX !== module.x3D || newZ !== module.z3D || newY !== module.y3D) {
            const finalPosition = this.checkCollisionsAndSnap(module, gridPosition);

            if (finalPosition) {
                module.x3D = finalPosition.x;
                module.z3D = finalPosition.z;
                module.y3D = finalPosition.y;
                this.updateModulePosition(module);
            }
        }
    }

    rotateSelectedModule() {
        if (!this.selectedModule) {
            console.log('No module selected for rotation');
            return;
        }
        
        const moduleId = this.selectedModule.userData.moduleId;
        const module = this.placedModules.find(m => m.id === moduleId);
        
        if (module) {
            console.log('Rotating module:', module.name);
            // Меняем ширину и глубину местами для поворота
            const tempWidth = module.width;
            module.width = module.depth;
            module.depth = tempWidth;
            
            // Обновляем 3D объект
            this.updateModuleGeometry(module);
        } else {
            console.log('Module not found for rotation');
        }
    }

    updateModuleGeometry(module) {
        const mesh = this.threeDObjects.get(module.id);
        if (mesh) {
            // Удаляем старую геометрию
            this.scene.remove(mesh);
            
            // Создаем новую геометрию с обновленными размерами
            const geometry = new THREE.BoxGeometry(module.width, module.height, module.depth);
            const material = new THREE.MeshLambertMaterial({
                color: module.color,
                transparent: true,
                opacity: 0.9
            });
            
            const newMesh = new THREE.Mesh(geometry, material);
            newMesh.position.set(module.x3D, module.y3D + module.height / 2, module.z3D);
            newMesh.userData = { moduleId: module.id };
            
            this.scene.add(newMesh);
            this.threeDObjects.set(module.id, newMesh);
            
            // Обновляем выделение
            if (this.selectedModule && this.selectedModule.userData.moduleId === module.id) {
                this.selectedModule = newMesh;
                this.selectModule3D(newMesh);
            }
            
            console.log('Module geometry updated');
        }
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
        const modeHint = document.getElementById('modeHint');
        const mobileControls = document.getElementById('mobileControls');
       
        if (newMode === '3D') {
            container2D.style.display = 'none';
            container3D.style.display = 'block';
            if (mobileControls && this.isMobile) mobileControls.style.display = 'flex';
            this.init3D();
            this.render3D();
            if (modeHint) modeHint.textContent = '🎮 Управление: WASD/Стрелки - перемещение модуля, Q/E - высота, R - поворот, Мышь - камера';
        } else {
            container2D.style.display = 'block';
            container3D.style.display = 'none';
            if (mobileControls) mobileControls.style.display = 'none';
            this.update2D();
            if (modeHint) modeHint.textContent = '📐 2D режим: Перетаскивайте модули для перемещения';
        }
       
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`mode${newMode}`).classList.add('active');
    }

    init3D() {
        const container = document.getElementById('visualization3DContainer');
        if (!container) return;

        if (this.renderer && container.contains(this.renderer.domElement)) {
            container.removeChild(this.renderer.domElement);
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x343434);

        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(25, 20, 25);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Освещение
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);

        // Сетка с увеличенным размером
        const gridHelper = new THREE.GridHelper(200, 50, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        this.setup3DControls();
        this.setup3DEventListeners();

        window.addEventListener('resize', () => this.onWindowResize());
        
        this.animate3D();
    }

    setup3DControls() {
        if (!this.camera || !this.renderer) return;
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.0;
        this.controls.enablePan = true;
        this.controls.panSpeed = 0.8;
        this.controls.autoRotate = false;
    }

    setup3DEventListeners() {
        const container = document.getElementById('visualization3DContainer');
        if (!container) return;

        container.addEventListener('mousedown', (e) => this.on3DMouseDown(e));
        container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    on3DMouseDown(e) {
        if (!this.scene || !this.camera) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(Array.from(this.threeDObjects.values()));

        if (intersects.length > 0) {
            const object = intersects[0].object;
            this.selectModule3D(object);
            e.preventDefault();
        } else {
            this.deselectModule3D();
        }
    }

    snapToGrid(position) {
        return new THREE.Vector3(
            Math.round(position.x / this.gridSize) * this.gridSize,
            Math.round(position.y / this.gridSize) * this.gridSize,
            Math.round(position.z / this.gridSize) * this.gridSize
        );
    }

    // Упрощенная проверка коллизий
    checkCollisionsAndSnap(currentModule, newPosition) {
        // Если нет других модулей, сразу возвращаем позицию
        if (this.placedModules.length <= 1) {
            return newPosition;
        }

        // Создаем временный bounding box для проверки коллизий
        const tempBox = new THREE.Box3();
        const tempSize = new THREE.Vector3(currentModule.width, currentModule.height, currentModule.depth);
        const tempCenter = newPosition.clone();
        tempCenter.y += currentModule.height / 2;
        
        tempBox.setFromCenterAndSize(tempCenter, tempSize);

        let hasCollision = false;

        // Проверяем коллизии со всеми другими модулями
        for (const otherModule of this.placedModules) {
            if (otherModule.id === currentModule.id) continue;

            const otherMesh = this.threeDObjects.get(otherModule.id);
            if (!otherMesh) continue;

            // Создаем bounding box для другого модуля
            const otherBox = new THREE.Box3().setFromObject(otherMesh);

            // Проверяем пересечение
            if (tempBox.intersectsBox(otherBox)) {
                hasCollision = true;
                break;
            }
        }

        // Если есть коллизия, возвращаем null (нельзя переместить)
        if (hasCollision) {
            return null;
        }

        // Иначе возвращаем позицию
        return newPosition;
    }

    // Упрощенная функция для поиска свободного места
    findFreePosition(moduleData) {
        // Если нет других модулей, возвращаем позицию по умолчанию
        if (this.placedModules.length === 0) {
            return new THREE.Vector3(0, 0, 0);
        }

        // Пробуем несколько позиций вокруг центра
        const positions = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(5, 0, 0),
            new THREE.Vector3(-5, 0, 0),
            new THREE.Vector3(0, 0, 5),
            new THREE.Vector3(0, 0, -5),
            new THREE.Vector3(5, 0, 5),
            new THREE.Vector3(-5, 0, -5),
            new THREE.Vector3(10, 0, 0),
            new THREE.Vector3(0, 5, 0)
        ];

        for (const position of positions) {
            const testModule = {
                id: -1,
                width: moduleData.width,
                height: moduleData.height,
                depth: moduleData.depth
            };

            if (!this.checkCollisionsAndSnap(testModule, position)) {
                return position;
            }
        }

        // Если все позиции заняты, возвращаем позицию по умолчанию
        return new THREE.Vector3(0, 10, 0);
    }

    selectModule3D(object) {
        this.threeDObjects.forEach((mesh, moduleId) => {
            mesh.material.emissive.setHex(0x000000);
        });
        
        object.material.emissive.setHex(0x333333);
        this.selectedModule = object;
        
        console.log('Module selected:', object.userData.moduleId);
    }

    deselectModule3D() {
        this.threeDObjects.forEach((mesh, moduleId) => {
            mesh.material.emissive.setHex(0x000000);
        });
        this.selectedModule = null;
    }

    sync2DFrom3D(module) {
        const scale = 2;
        module.x2D = (module.x3D * scale) + 200;
        module.y2D = (module.z3D * scale) + 150;
        
        this.update2D();
    }

    render3D() {
        if (!this.scene) return;

        this.threeDObjects.forEach((mesh, moduleId) => {
            this.scene.remove(mesh);
        });
        this.threeDObjects.clear();

        this.placedModules.forEach(module => {
            const geometry = new THREE.BoxGeometry(module.width, module.height, module.depth);
            const material = new THREE.MeshLambertMaterial({
                color: module.color,
                transparent: true,
                opacity: 0.9
            });
           
            const cube = new THREE.Mesh(geometry, material);
           
            // Убедимся, что позиции инициализированы
            if (module.x3D === undefined) {
                module.x3D = 0;
                module.z3D = 0;
                module.y3D = 0;
            }
            
            cube.position.set(module.x3D, module.y3D + module.height / 2, module.z3D);
            cube.userData = { moduleId: module.id };
           
            this.scene.add(cube);
            this.threeDObjects.set(module.id, cube);
        });

        this.animate3D();
    }

    animate3D() {
        requestAnimationFrame(() => this.animate3D());
       
        this.updateModuleFromControls();
       
        if (this.controls) {
            this.controls.update();
        }
       
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    updateModulePosition(module) {
        const mesh = this.threeDObjects.get(module.id);
        if (mesh) {
            mesh.position.set(module.x3D, module.y3D + module.height / 2, module.z3D);
            this.sync2DFrom3D(module);
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

        container.addEventListener('click', (e) => {
            const module = e.target.closest('.module');
            if (module) {
                this.selectModule(module);
            } else {
                this.deselectModule();
            }
        });

        this.setupDragAndDrop();
        this.setupControlButtons();
    }

    setupControlButtons() {
        const deleteBtn = document.getElementById('deleteSelected');
        const clearBtn = document.getElementById('clearAll');
       
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteSelected());
        }
       
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }
    }

    setupDragAndDrop() {
        const container = document.getElementById('visualizationContainer');
        if (!container) return;

        let dragModule = null;
        let startX = 0, startY = 0;
        let originalX = 0, originalY = 0;

        container.addEventListener('mousedown', (e) => {
            if (this.mode !== '2D') return;
            
            const module = e.target.closest('.module');
            if (!module) return;

            e.preventDefault();
            this.selectModule(module);
            dragModule = module;

            const rect = module.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
           
            startX = e.clientX;
            startY = e.clientY;
            originalX = parseInt(module.style.left) || 0;
            originalY = parseInt(module.style.top) || 0;

            module.classList.add('dragging');
            module.style.transition = 'none';
            module.style.zIndex = '1000';
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragModule || this.mode !== '2D') return;

            const containerRect = container.getBoundingClientRect();
           
            let newX = originalX + (e.clientX - startX);
            let newY = originalY + (e.clientY - startY);

            const moduleWidth = dragModule.offsetWidth;
            const moduleHeight = dragModule.offsetHeight;
           
            newX = Math.max(0, Math.min(newX, containerRect.width - moduleWidth));
            newY = Math.max(0, Math.min(newY, containerRect.height - moduleHeight));

            dragModule.style.left = newX + 'px';
            dragModule.style.top = newY + 'px';

            const moduleId = parseInt(dragModule.dataset.id);
            const module = this.placedModules.find(m => m.id === moduleId);
            if (module) {
                module.x2D = newX;
                module.y2D = newY;
                module.x3D = (newX - 200) / 2;
                module.z3D = (newY - 150) / 2;
            }
        });

        document.addEventListener('mouseup', () => {
            if (dragModule) {
                dragModule.classList.remove('dragging');
                dragModule.style.transition = 'all 0.3s ease';
                dragModule.style.zIndex = '';
                dragModule = null;
            }
        });
    }

    // Упрощенный метод добавления модуля
    addModule(moduleData) {
        console.log('Adding module in mode:', this.mode);

        const module = {
            id: Date.now(),
            typeId: moduleData.id,
            name: moduleData.name,
            price: moduleData.price,
            width: moduleData.width,
            height: moduleData.height,
            depth: moduleData.depth,
            x2D: 50,
            y2D: 50,
            x3D: 0,
            y3D: 0,
            z3D: 0,
            color: moduleData.color
        };

        if (this.mode === '3D') {
            // Для 3D режима находим свободную позицию
            const freePosition = this.findFreePosition(moduleData);
            module.x3D = freePosition.x;
            module.y3D = freePosition.y;
            module.z3D = freePosition.z;
            
            console.log('Placing module at 3D position:', freePosition);
        }

        this.placedModules.push(module);
       
        if (this.mode === '2D') {
            this.renderModule2D(module);
        } else {
            this.render3D();
            // Выбираем новый модуль для удобства управления
            const newMesh = this.threeDObjects.get(module.id);
            if (newMesh) {
                this.selectModule3D(newMesh);
            }
        }
       
        this.addToCart(module);
        console.log('Module added successfully');
    }

    renderModule2D(module) {
        const container = document.getElementById('visualizationContainer');
        if (!container) return;

        const div = document.createElement('div');
        div.className = 'module draggable';
        div.dataset.id = module.id;
       
        div.style.width = module.width * 20 + 'px';
        div.style.height = module.depth * 20 + 'px';
        div.style.left = module.x2D + 'px';
        div.style.top = module.y2D + 'px';
        div.style.backgroundColor = module.color;
        div.style.border = '2px solid #37dede';
        div.style.borderRadius = '4px';
        div.style.cursor = 'move';
        div.style.position = 'absolute';
        div.style.transition = 'all 0.3s ease';
        div.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.3)';

        div.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                       color: white; font-size: 12px; font-weight: bold; text-align: center; 
                       text-shadow: 1px 1px 2px rgba(0,0,0,0.7); pointer-events: none;">
                ${module.name}<br>${module.width}m × ${module.depth}m
            </div>
        `;

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

    deleteSelected() {
        if (!this.selectedModule) {
            alert('Выберите модуль для удаления');
            return;
        }

        let moduleId;
        if (this.mode === '2D') {
            moduleId = parseInt(this.selectedModule.dataset.id);
        } else {
            moduleId = this.selectedModule.userData.moduleId;
        }
        
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
            const mesh = this.threeDObjects.get(moduleId);
            if (mesh) {
                this.scene.remove(mesh);
                this.threeDObjects.delete(moduleId);
            }
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
            this.threeDObjects.forEach((mesh, moduleId) => {
                this.scene.remove(mesh);
            });
            this.threeDObjects.clear();
        }
       
        this.updateCart();
    }

    addToCart(module) {
        this.cartItems.push(module);
        this.totalPrice += module.price;
        this.updateCart();
    }

    removeFromCart(module) {
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
        const moduleCount = document.getElementById('moduleCount');
        const totalArea = document.getElementById('totalArea');
        const projectCost = document.getElementById('projectCost');
       
        if (!cartItems || !cartTotal) return;

        if (moduleCount) {
            moduleCount.textContent = this.placedModules.length;
        }
        
        if (totalArea) {
            const area = this.placedModules.reduce((sum, module) => 
                sum + (module.width * module.depth), 0
            );
            totalArea.textContent = area.toFixed(1);
        }
        
        if (projectCost) {
            projectCost.textContent = this.totalPrice.toLocaleString();
        }

        if (this.cartItems.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Корзина пуста</p>';
            cartTotal.textContent = 'Итого: ₽0';
        } else {
            cartItems.innerHTML = '';
            this.cartItems.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div>
                        <div style="font-weight: bold;">${item.name}</div>
                        <div style="color: var(--accent-primary);">₽${item.price.toLocaleString()}</div>
                    </div>
                    <button class="remove-btn" onclick="visualizer.removeFromCartByIndex(${index})">Удалить</button>
                `;
                cartItems.appendChild(div);
            });
           
            cartTotal.textContent = `Итого: ₽${this.totalPrice.toLocaleString()}`;
        }
    }

    removeFromCartByIndex(index) {
        if (index >= 0 && index < this.cartItems.length) {
            const module = this.cartItems[index];
            this.removeFromCart(module);
            this.removeModule(module.id);
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
            alert(`Заказ оформлен! Спасибо, ${user}!\nНомер заказа: #${Date.now()}`);
            this.clearAll();
        }
    }

    saveProject() {
        const user = auth.getCurrentUser();
        if (!user) {
            auth.showAuth();
            return;
        }

        const projectData = {
            modules: this.placedModules,
            cartItems: this.cartItems,
            totalPrice: this.totalPrice,
            timestamp: new Date().toISOString()
        };

        const projectKey = `prostroy_project_${user}_${Date.now()}`;
        localStorage.setItem(projectKey, JSON.stringify(projectData));
        
        alert('Проект успешно сохранен!');
    }
}

const visualizer = new Visualizer();
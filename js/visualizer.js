// visualizer.js
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
        
        // Проверяем доступность Three.js
        if (typeof THREE !== 'undefined') {
            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();
        } else {
            this.raycaster = null;
            this.mouse = null;
            console.warn('Three.js не загружен, 3D функциональность будет ограничена');
        }
        
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
        
        // Система коллизий и соединений
        this.collisionEnabled = true;
        this.snapEnabled = true;
        this.snapDistance = 0.1;
        this.gridSize = 1;
        this.snapCandidates = [];
        this.connectionIndicators = [];
        
        // Отладка и хитбоксы
        this.hitboxHelpers = [];
        this.showHitboxes = false;
        this.debugMode = false;

        this.isMobile = this.detectMobile();
        this.keyboardEnabled = true;

        // Мобильное управление
        this.mobileControls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };

        this.init();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth < 768;
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
        this.setupKeyboardControls();
        this.setupControlButtons();
        this.setupMobileControls();
        
        this.updateCart();
    }

    // Компактное мобильное управление ПОД областью визуализации
    setupMobileControls() {
        if (!this.isMobile) return;

        const visualizationArea = document.querySelector('.visualization-area');
        if (!visualizationArea) return;

        // Создаем компактные кнопки управления ПОД областью визуализации
        const mobileControlsHTML = `
            <div class="mobile-controls-below">
                <div class="mobile-controls-compact-below">
                    <div class="mobile-controls-row-below">
                        <button class="mobile-btn-compact-below" id="mobileUp">↑</button>
                    </div>
                    <div class="mobile-controls-row-below">
                        <button class="mobile-btn-compact-below" id="mobileLeft">←</button>
                        <button class="mobile-btn-compact-below" id="mobileDown">↓</button>
                        <button class="mobile-btn-compact-below" id="mobileRight">→</button>
                    </div>
                    <div class="mobile-controls-row-below">
                        <button class="mobile-btn-compact-below mobile-btn-alt-below" id="mobileRotate">↻</button>
                        <button class="mobile-btn-compact-below mobile-btn-alt-below" id="mobileDelete">×</button>
                    </div>
                </div>
                <div class="mobile-info-panel-below">
                    <div class="mobile-info-text-below">
                        <strong>Управление:</strong> Стрелки - движение, ↻ - поворот, × - удалить
                    </div>
                    <div class="mobile-info-text-below">
                        <strong>Режимы:</strong> C - коллизии, V - присоединение
                    </div>
                </div>
            </div>
        `;

        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = 'mobile-controls-wrapper-below';
        controlsWrapper.innerHTML = mobileControlsHTML;
        
        // Вставляем ПОД областью визуализации, но перед visualization-hint
        const visualizationHint = visualizationArea.querySelector('.visualization-hint');
        if (visualizationHint) {
            visualizationArea.insertBefore(controlsWrapper, visualizationHint);
        } else {
            visualizationArea.appendChild(controlsWrapper);
        }

        // Назначаем обработчики
        this.setupMobileButton('mobileUp', 'forward');
        this.setupMobileButton('mobileDown', 'backward');
        this.setupMobileButton('mobileLeft', 'left');
        this.setupMobileButton('mobileRight', 'right');
        this.setupMobileActionButton('mobileRotate', () => this.rotateSelectedModule());
        this.setupMobileActionButton('mobileDelete', () => this.deleteSelected());

        // Скрываем по умолчанию, покажем только в 3D режиме
        controlsWrapper.style.display = 'none';
        this.mobileControlsWrapper = controlsWrapper;
    }

    setupMobileButton(buttonId, control) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const startAction = () => {
            this.mobileControls[control] = true;
        };

        const endAction = () => {
            this.mobileControls[control] = false;
        };

        // Обработчики для касаний
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startAction();
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            endAction();
        });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            endAction();
        });

        // Обработчики для мыши (на всякий случай)
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startAction();
        });

        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            endAction();
        });

        button.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            endAction();
        });
    }

    setupMobileActionButton(buttonId, action) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const handleAction = (e) => {
            e.preventDefault();
            action();
        };

        button.addEventListener('touchstart', handleAction, { passive: false });
        button.addEventListener('mousedown', handleAction);
    }

    // Обновляем управление для мобильных устройств
    updateMobileControls() {
        if (!this.isMobile || !this.selectedModule || this.mode !== '3D') {
            return;
        }

        const moduleId = this.selectedModule.userData.moduleId;
        const module = this.placedModules.find(m => m.id === moduleId);
        if (!module) return;

        let moved = false;
        let newX = module.x3D;
        let newZ = module.z3D;
        let newY = module.y3D;

        // Обрабатываем мобильное управление
        if (this.mobileControls.forward) {
            newZ -= this.moduleControls.speed;
            moved = true;
        }
        if (this.mobileControls.backward) {
            newZ += this.moduleControls.speed;
            moved = true;
        }
        if (this.mobileControls.left) {
            newX -= this.moduleControls.speed;
            moved = true;
        }
        if (this.mobileControls.right) {
            newX += this.moduleControls.speed;
            moved = true;
        }

        if (moved) {
            // Применяем сетку
            newX = Math.round(newX / this.gridSize) * this.gridSize;
            newZ = Math.round(newZ / this.gridSize) * this.gridSize;

            // Проверяем коллизии
            if (this.collisionEnabled && this.checkCollision(module, newX, newY, newZ)) {
                return;
            }

            // Применяем систему присоединения
            if (this.snapEnabled) {
                const snapResult = this.findSnapPosition(module, newX, newY, newZ);
                if (snapResult) {
                    newX = snapResult.x;
                    newY = snapResult.y;
                    newZ = snapResult.z;
                }
            }

            // Обновляем позицию
            module.x3D = newX;
            module.z3D = newZ;
            module.y3D = newY;
            
            this.updateModulePosition(module);
        }
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (this.mode !== '3D' || !this.selectedModule) return;

            console.log('Key pressed:', e.code);
            
            switch(e.code) {
                case 'KeyW':
                    this.moduleControls.moveForward = true;
                    e.preventDefault();
                    break;
                case 'KeyS':
                    this.moduleControls.moveBackward = true;
                    e.preventDefault();
                    break;
                case 'KeyA':
                    this.moduleControls.moveLeft = true;
                    e.preventDefault();
                    break;
                case 'KeyD':
                    this.moduleControls.moveRight = true;
                    e.preventDefault();
                    break;
                case 'KeyQ':
                    this.moduleControls.moveUp = true;
                    e.preventDefault();
                    break;
                case 'KeyE':
                    this.moduleControls.moveDown = true;
                    e.preventDefault();
                    break;
                case 'KeyR':
                    this.rotateSelectedModule();
                    e.preventDefault();
                    break;
                case 'Delete':
                case 'Backspace':
                    this.deleteSelected();
                    e.preventDefault();
                    break;
                case 'KeyC':
                    this.toggleCollisions();
                    e.preventDefault();
                    break;
                case 'KeyV':
                    this.toggleSnap();
                    e.preventDefault();
                    break;
                case 'KeyH':
                    this.toggleHitboxVisualization();
                    e.preventDefault();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.mode !== '3D') return;

            switch(e.code) {
                case 'KeyW':
                    this.moduleControls.moveForward = false;
                    break;
                case 'KeyS':
                    this.moduleControls.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moduleControls.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moduleControls.moveRight = false;
                    break;
                case 'KeyQ':
                    this.moduleControls.moveUp = false;
                    break;
                case 'KeyE':
                    this.moduleControls.moveDown = false;
                    break;
            }
        });
    }

    updateModuleFromControls() {
        if (!this.selectedModule || this.mode !== '3D') {
            return;
        }

        const moduleId = this.selectedModule.userData.moduleId;
        const module = this.placedModules.find(m => m.id === moduleId);
        if (!module) return;

        let moved = false;
        let newX = module.x3D;
        let newZ = module.z3D;
        let newY = module.y3D;

        // Сохраняем оригинальную позицию
        const originalX = newX;
        const originalZ = newZ;
        const originalY = newY;

        // Простое перемещение
        if (this.moduleControls.moveForward) {
            newZ -= this.moduleControls.speed;
            moved = true;
        }
        if (this.moduleControls.moveBackward) {
            newZ += this.moduleControls.speed;
            moved = true;
        }
        if (this.moduleControls.moveLeft) {
            newX -= this.moduleControls.speed;
            moved = true;
        }
        if (this.moduleControls.moveRight) {
            newX += this.moduleControls.speed;
            moved = true;
        }
        if (this.moduleControls.moveUp) {
            newY += this.moduleControls.speed;
            moved = true;
        }
        if (this.moduleControls.moveDown) {
            newY = Math.max(0, newY - this.moduleControls.speed);
            moved = true;
        }

        if (moved) {
            // Применяем сетку
            newX = Math.round(newX / this.gridSize) * this.gridSize;
            newZ = Math.round(newZ / this.gridSize) * this.gridSize;
            newY = Math.round(newY / this.gridSize) * this.gridSize;

            // Проверяем коллизии
            if (this.collisionEnabled && this.checkCollision(module, newX, newY, newZ)) {
                console.log('Collision detected! Movement blocked.');
                return;
            }

            // Применяем систему присоединения
            if (this.snapEnabled) {
                const snapResult = this.findSnapPosition(module, newX, newY, newZ);
                if (snapResult) {
                    newX = snapResult.x;
                    newY = snapResult.y;
                    newZ = snapResult.z;
                    console.log('Module snapped to position:', newX, newY, newZ);
                }
            }

            // Обновляем позицию
            module.x3D = newX;
            module.z3D = newZ;
            module.y3D = newY;
            
            this.updateModulePosition(module);
        }
    }

    // Обновленная функция проверки коллизий с уменьшенными хитбоксами
    checkCollision(currentModule, newX, newY, newZ) {
        const hitboxReduction = 0.05; // Уменьшение на 5 см с каждой стороны
        
        const currentBox = {
            minX: newX - (currentModule.width / 2) + hitboxReduction,
            maxX: newX + (currentModule.width / 2) - hitboxReduction,
            minY: newY + hitboxReduction,
            maxY: newY + currentModule.height - hitboxReduction,
            minZ: newZ - (currentModule.depth / 2) + hitboxReduction,
            maxZ: newZ + (currentModule.depth / 2) - hitboxReduction
        };

        for (const otherModule of this.placedModules) {
            if (otherModule.id === currentModule.id) continue;

            const otherBox = {
                minX: otherModule.x3D - (otherModule.width / 2) + hitboxReduction,
                maxX: otherModule.x3D + (otherModule.width / 2) - hitboxReduction,
                minY: otherModule.y3D + hitboxReduction,
                maxY: otherModule.y3D + otherModule.height - hitboxReduction,
                minZ: otherModule.z3D - (otherModule.depth / 2) + hitboxReduction,
                maxZ: otherModule.z3D + (otherModule.depth / 2) - hitboxReduction
            };

            // Проверяем пересечение по всем осям с небольшим допуском
            const collisionX = currentBox.maxX >= otherBox.minX && currentBox.minX <= otherBox.maxX;
            const collisionY = currentBox.maxY >= otherBox.minY && currentBox.minY <= otherBox.maxY;
            const collisionZ = currentBox.maxZ >= otherBox.minZ && currentBox.minZ <= otherBox.maxZ;

            if (collisionX && collisionY && collisionZ) {
                console.log(`Collision with module ${otherModule.id}`);
                return true;
            }
        }

        return false;
    }

    // Функция для визуализации хитбоксов
    createHitboxVisualization() {
        if (!this.scene || typeof THREE === 'undefined') return;
        
        // Удаляем старые визуализации хитбоксов
        if (this.hitboxHelpers && this.hitboxHelpers.length > 0) {
            this.hitboxHelpers.forEach(helper => this.scene.remove(helper));
            this.hitboxHelpers = [];
        }
        
        this.hitboxHelpers = [];
        
        this.placedModules.forEach(module => {
            const hitboxReduction = 0.05;
            const width = module.width - (hitboxReduction * 2);
            const height = module.height - (hitboxReduction * 2);
            const depth = module.depth - (hitboxReduction * 2);
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            
            const hitbox = new THREE.Mesh(geometry, material);
            hitbox.position.set(
                module.x3D,
                module.y3D + module.height / 2,
                module.z3D
            );
            
            this.scene.add(hitbox);
            this.hitboxHelpers.push(hitbox);
        });
    }

    // Переключение отображения хитбоксов
    toggleHitboxVisualization() {
        this.showHitboxes = !this.showHitboxes;
        if (this.showHitboxes) {
            this.createHitboxVisualization();
            console.log('Hitboxes visualization enabled');
        } else if (this.hitboxHelpers) {
            this.hitboxHelpers.forEach(helper => this.scene.remove(helper));
            this.hitboxHelpers = [];
            console.log('Hitboxes visualization disabled');
        }
        return this.showHitboxes;
    }

    // Улучшенная система присоединения блоков
    findSnapPosition(currentModule, newX, newY, newZ) {
        if (!this.snapEnabled) return null;

        const hitboxReduction = 0.05;
        
        const currentBox = {
            minX: newX - (currentModule.width / 2) + hitboxReduction,
            maxX: newX + (currentModule.width / 2) - hitboxReduction,
            minY: newY + hitboxReduction,
            maxY: newY + currentModule.height - hitboxReduction,
            minZ: newZ - (currentModule.depth / 2) + hitboxReduction,
            maxZ: newZ + (currentModule.depth / 2) - hitboxReduction
        };

        let bestSnap = null;
        let minDistance = this.snapDistance;

        // Очищаем предыдущие кандидаты
        this.snapCandidates = [];

        for (const otherModule of this.placedModules) {
            if (otherModule.id === currentModule.id) continue;

            const otherBox = {
                minX: otherModule.x3D - (otherModule.width / 2) + hitboxReduction,
                maxX: otherModule.x3D + (otherModule.width / 2) - hitboxReduction,
                minY: otherModule.y3D + hitboxReduction,
                maxY: otherModule.y3D + otherModule.height - hitboxReduction,
                minZ: otherModule.z3D - (otherModule.depth / 2) + hitboxReduction,
                maxZ: otherModule.z3D + (otherModule.depth / 2) - hitboxReduction
            };

            // Проверяем все возможные соединения с точным соприкосновением
            const connections = [
                // X-axis connections - точное соприкосновение
                { 
                    axis: 'x', 
                    currentPos: currentBox.maxX, 
                    otherPos: otherBox.minX,
                    offset: { x: otherBox.minX - (currentModule.width / 2) + hitboxReduction, y: newY, z: newZ },
                    face: 'right'
                },
                { 
                    axis: 'x', 
                    currentPos: currentBox.minX, 
                    otherPos: otherBox.maxX,
                    offset: { x: otherBox.maxX + (currentModule.width / 2) - hitboxReduction, y: newY, z: newZ },
                    face: 'left'
                },
                // Y-axis connections - точное соприкосновение
                { 
                    axis: 'y', 
                    currentPos: currentBox.maxY, 
                    otherPos: otherBox.minY,
                    offset: { x: newX, y: otherBox.minY - currentModule.height + hitboxReduction, z: newZ },
                    face: 'top'
                },
                { 
                    axis: 'y', 
                    currentPos: currentBox.minY, 
                    otherPos: otherBox.maxY,
                    offset: { x: newX, y: otherBox.maxY - hitboxReduction, z: newZ },
                    face: 'bottom'
                },
                // Z-axis connections - точное соприкосновение
                { 
                    axis: 'z', 
                    currentPos: currentBox.maxZ, 
                    otherPos: otherBox.minZ,
                    offset: { x: newX, y: newY, z: otherBox.minZ - (currentModule.depth / 2) + hitboxReduction },
                    face: 'front'
                },
                { 
                    axis: 'z', 
                    currentPos: currentBox.minZ, 
                    otherPos: otherBox.maxZ,
                    offset: { x: newX, y: newY, z: otherBox.maxZ + (currentModule.depth / 2) - hitboxReduction },
                    face: 'back'
                }
            ];

            for (const connection of connections) {
                const distance = Math.abs(connection.currentPos - connection.otherPos);
                
                if (distance <= minDistance) {
                    // Проверяем перекрытие по другим осям с небольшим допуском
                    let overlap = false;
                    
                    if (connection.axis === 'x') {
                        const yOverlap = currentBox.minY <= otherBox.maxY && currentBox.maxY >= otherBox.minY;
                        const zOverlap = currentBox.minZ <= otherBox.maxZ && currentBox.maxZ >= otherBox.minZ;
                        overlap = yOverlap && zOverlap;
                    } else if (connection.axis === 'y') {
                        const xOverlap = currentBox.minX <= otherBox.maxX && currentBox.maxX >= otherBox.minX;
                        const zOverlap = currentBox.minZ <= otherBox.maxZ && currentBox.maxZ >= otherBox.minZ;
                        overlap = xOverlap && zOverlap;
                    } else if (connection.axis === 'z') {
                        const xOverlap = currentBox.minX <= otherBox.maxX && currentBox.maxX >= otherBox.minX;
                        const yOverlap = currentBox.minY <= otherBox.maxY && currentBox.maxY >= otherBox.minY;
                        overlap = xOverlap && yOverlap;
                    }

                    if (overlap) {
                        this.snapCandidates.push({
                            module: otherModule,
                            connection: connection,
                            distance: distance
                        });

                        if (distance < minDistance) {
                            minDistance = distance;
                            bestSnap = connection.offset;
                        }
                    }
                }
            }
        }

        return bestSnap;
    }

    // Создание индикаторов соединений
    createConnectionIndicators() {
        if (!this.scene || typeof THREE === 'undefined') return;
        
        // Удаляем старые индикаторы
        this.connectionIndicators.forEach(indicator => {
            this.scene.remove(indicator);
        });
        this.connectionIndicators = [];

        // Создаем новые индикаторы для кандидатов соединения
        this.snapCandidates.forEach(candidate => {
            const connection = candidate.connection;
            const otherModule = candidate.module;
            
            let geometry, position, rotation;
            
            switch(connection.face) {
                case 'right':
                    geometry = new THREE.PlaneGeometry(otherModule.width, otherModule.height);
                    position = new THREE.Vector3(
                        otherModule.x3D - otherModule.width / 2,
                        otherModule.y3D + otherModule.height / 2,
                        otherModule.z3D
                    );
                    rotation = new THREE.Euler(0, Math.PI / 2, 0);
                    break;
                case 'left':
                    geometry = new THREE.PlaneGeometry(otherModule.width, otherModule.height);
                    position = new THREE.Vector3(
                        otherModule.x3D + otherModule.width / 2,
                        otherModule.y3D + otherModule.height / 2,
                        otherModule.z3D
                    );
                    rotation = new THREE.Euler(0, -Math.PI / 2, 0);
                    break;
                case 'top':
                    geometry = new THREE.PlaneGeometry(otherModule.width, otherModule.depth);
                    position = new THREE.Vector3(
                        otherModule.x3D,
                        otherModule.y3D + otherModule.height,
                        otherModule.z3D
                    );
                    rotation = new THREE.Euler(-Math.PI / 2, 0, 0);
                    break;
                case 'bottom':
                    geometry = new THREE.PlaneGeometry(otherModule.width, otherModule.depth);
                    position = new THREE.Vector3(
                        otherModule.x3D,
                        otherModule.y3D,
                        otherModule.z3D
                    );
                    rotation = new THREE.Euler(Math.PI / 2, 0, 0);
                    break;
                case 'front':
                    geometry = new THREE.PlaneGeometry(otherModule.width, otherModule.height);
                    position = new THREE.Vector3(
                        otherModule.x3D,
                        otherModule.y3D + otherModule.height / 2,
                        otherModule.z3D - otherModule.depth / 2
                    );
                    rotation = new THREE.Euler(0, Math.PI, 0);
                    break;
                case 'back':
                    geometry = new THREE.PlaneGeometry(otherModule.width, otherModule.height);
                    position = new THREE.Vector3(
                        otherModule.x3D,
                        otherModule.y3D + otherModule.height / 2,
                        otherModule.z3D + otherModule.depth / 2
                    );
                    rotation = new THREE.Euler(0, 0, 0);
                    break;
            }

            const material = new THREE.MeshBasicMaterial({
                color: 0x00FF00,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });

            const indicator = new THREE.Mesh(geometry, material);
            indicator.position.copy(position);
            indicator.rotation.copy(rotation);
            
            this.scene.add(indicator);
            this.connectionIndicators.push(indicator);
        });
    }

    // Функция поиска свободной позиции
    findFreePosition(moduleData) {
        if (this.placedModules.length === 0) {
            return { x: 0, y: 0, z: 0 };
        }

        const maxAttempts = 50;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            for (let layer = 0; layer < attempt; layer++) {
                const radius = layer * 6;
                const angleStep = Math.PI * 2 / Math.max(1, layer * 4);
                
                for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    
                    for (let height = 0; height <= 10; height += 3) {
                        const position = { x, y: height, z };
                        
                        const testModule = {
                            id: -1,
                            width: moduleData.width,
                            height: moduleData.height,
                            depth: moduleData.depth,
                            x3D: position.x,
                            y3D: position.y,
                            z3D: position.z
                        };

                        if (!this.checkCollision(testModule, position.x, position.y, position.z)) {
                            return position;
                        }
                    }
                }
            }
        }

        return { x: 0, y: 20, z: 0 };
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
            const tempWidth = module.width;
            module.width = module.depth;
            module.depth = tempWidth;
            
            this.updateModuleGeometry(module);
        }
    }

    updateModuleGeometry(module) {
        const mesh = this.threeDObjects.get(module.id);
        if (mesh && this.scene && typeof THREE !== 'undefined') {
            this.scene.remove(mesh);
            
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
            
            if (this.selectedModule && this.selectedModule.userData.moduleId === module.id) {
                this.selectedModule = newMesh;
                this.selectModule3D(newMesh);
            }
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
       
        if (newMode === '3D') {
            container2D.style.display = 'none';
            container3D.style.display = 'block';
            this.init3D();
            this.render3D();
            
            // Показываем мобильное управление только на мобильных устройствах
            if (this.isMobile && this.mobileControlsWrapper) {
                this.mobileControlsWrapper.style.display = 'block';
            }
            
            if (modeHint) {
                if (this.isMobile) {
                    modeHint.textContent = '📱 Режим 3D: Используйте кнопки управления ниже';
                } else {
                    modeHint.textContent = '🎮 Управление: WASD - перемещение, Q/E - высота, R - поворот, Delete - удалить, C - коллизии, V - присоединение, H - хитбоксы';
                }
            }
            
            container3D.setAttribute('tabindex', '0');
            container3D.focus();
        } else {
            container2D.style.display = 'block';
            container3D.style.display = 'none';
            this.update2D();
            
            // Скрываем мобильное управление в 2D режиме
            if (this.mobileControlsWrapper) {
                this.mobileControlsWrapper.style.display = 'none';
            }
            
            if (modeHint) modeHint.textContent = '📐 2D режим: Перетаскивайте модули для перемещения';
        }
       
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`mode${newMode}`).classList.add('active');
    }

    init3D() {
        const container = document.getElementById('visualization3DContainer');
        if (!container || typeof THREE === 'undefined') return;

        if (this.renderer) {
            this.renderer.dispose();
            if (container.contains(this.renderer.domElement)) {
                container.removeChild(this.renderer.domElement);
            }
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x343434);

        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(15, 10, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);

        const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        this.setup3DControls();
        this.setup3DEventListeners();

        window.addEventListener('resize', () => this.onWindowResize());
        
        this.animate3D();
    }

    setup3DControls() {
        if (!this.camera || !this.renderer || typeof THREE === 'undefined') return;
        
        // Проверяем наличие OrbitControls
        if (typeof THREE.OrbitControls === 'undefined') {
            console.warn('OrbitControls не доступны');
            return;
        }
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setup3DEventListeners() {
        const container = document.getElementById('visualization3DContainer');
        if (!container) return;

        container.addEventListener('click', (e) => this.on3DClick(e));
        
        container.addEventListener('focus', () => {
            console.log('3D container focused');
            this.keyboardEnabled = true;
        });
        
        container.addEventListener('blur', () => {
            console.log('3D container blurred');
            this.keyboardEnabled = false;
        });
    }

    on3DClick(e) {
        if (!this.scene || !this.camera || !this.raycaster) return;

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

    selectModule3D(object) {
        this.threeDObjects.forEach((mesh) => {
            mesh.material.emissive.setHex(0x000000);
        });
        
        object.material.emissive.setHex(0xFFA500);
        this.selectedModule = object;
        
        console.log('Module selected:', object.userData.moduleId);
        
        const container = document.getElementById('visualization3DContainer');
        if (container) {
            container.focus();
        }
    }

    deselectModule3D() {
        this.threeDObjects.forEach((mesh) => {
            mesh.material.emissive.setHex(0x000000);
        });
        this.selectedModule = null;
    }

    render3D() {
        if (!this.scene || typeof THREE === 'undefined') return;

        this.threeDObjects.forEach((mesh) => {
            this.scene.remove(mesh);
        });
        this.threeDObjects.clear();

        this.placedModules.forEach(module => {
            const geometry = new THREE.BoxGeometry(module.width, module.height, module.depth);
            
            const hasCollision = this.checkCollision(module, module.x3D, module.y3D, module.z3D);
            
            const material = new THREE.MeshLambertMaterial({
                color: hasCollision ? 0xFF0000 : module.color,
                transparent: true,
                opacity: hasCollision ? 0.7 : 0.9
            });
           
            const cube = new THREE.Mesh(geometry, material);
           
            if (module.x3D === undefined) module.x3D = 0;
            if (module.z3D === undefined) module.z3D = 0;
            if (module.y3D === undefined) module.y3D = 0;
            
            cube.position.set(module.x3D, module.y3D + module.height / 2, module.z3D);
            cube.userData = { moduleId: module.id };
           
            this.scene.add(cube);
            this.threeDObjects.set(module.id, cube);
        });

        // Создаем индикаторы соединений
        this.createConnectionIndicators();

        // Обновляем визуализацию хитбоксов если включена
        if (this.showHitboxes) {
            this.createHitboxVisualization();
        }

        if (this.selectedModule) {
            const selectedMesh = this.threeDObjects.get(this.selectedModule.userData.moduleId);
            if (selectedMesh) {
                this.selectModule3D(selectedMesh);
            }
        }
    }

    animate3D() {
        requestAnimationFrame(() => this.animate3D());
       
        this.updateModuleFromControls();
        this.updateMobileControls();
       
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
            
            // Обновляем визуализацию хитбоксов если они включены
            if (this.showHitboxes) {
                this.createHitboxVisualization();
            }
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
       
        const container = document.getElementById('visualization3DContainer');
        if (container) {
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        }
    }

    toggleCollisions() {
        this.collisionEnabled = !this.collisionEnabled;
        console.log(`Collisions ${this.collisionEnabled ? 'enabled' : 'disabled'}`);
        this.render3D();
        return this.collisionEnabled;
    }

    toggleSnap() {
        this.snapEnabled = !this.snapEnabled;
        console.log(`Snap ${this.snapEnabled ? 'enabled' : 'disabled'}`);
        
        // Очищаем индикаторы при выключении
        if (!this.snapEnabled) {
            this.connectionIndicators.forEach(indicator => {
                if (this.scene) this.scene.remove(indicator);
            });
            this.connectionIndicators = [];
            this.snapCandidates = [];
        }
        
        return this.snapEnabled;
    }

    setupControlButtons() {
        const deleteBtn = document.getElementById('deleteSelected');
        const clearBtn = document.getElementById('clearAll');
        const toggleHitboxesBtn = document.getElementById('toggleHitboxes');
        const debugCollisionsBtn = document.getElementById('debugCollisions');
       
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteSelected());
        }
       
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }
        
        if (toggleHitboxesBtn) {
            toggleHitboxesBtn.addEventListener('click', () => this.toggleHitboxVisualization());
        }
        
        if (debugCollisionsBtn) {
            debugCollisionsBtn.addEventListener('click', () => {
                this.collisionEnabled = !this.collisionEnabled;
                console.log(`Collisions ${this.collisionEnabled ? 'enabled' : 'disabled'}`);
                this.render3D();
            });
        }
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

            startX = e.clientX;
            startY = e.clientY;
            originalX = parseInt(module.style.left) || 0;
            originalY = parseInt(module.style.top) || 0;

            module.classList.add('dragging');
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
            }
        });

        document.addEventListener('mouseup', () => {
            if (dragModule) {
                dragModule.classList.remove('dragging');
                dragModule.style.zIndex = '';
                dragModule = null;
            }
        });
    }

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
            const freePosition = this.findFreePosition(moduleData);
            module.x3D = freePosition.x;
            module.y3D = freePosition.y;
            module.z3D = freePosition.z;

            if (this.collisionEnabled && this.checkCollision(module, module.x3D, module.y3D, module.z3D)) {
                const alternativePosition = this.findAlternativePosition(moduleData);
                module.x3D = alternativePosition.x;
                module.y3D = alternativePosition.y;
                module.z3D = alternativePosition.z;
            }
        }

        this.placedModules.push(module);
       
        if (this.mode === '2D') {
            this.renderModule2D(module);
        } else {
            this.render3D();
            const newMesh = this.threeDObjects.get(module.id);
            if (newMesh) {
                this.selectModule3D(newMesh);
            }
        }
       
        // Добавляем модуль в общую корзину
        cart.addModuleToCart(module);
        this.updateCart();
    }

    findAlternativePosition(moduleData) {
        let height = 0;
        let foundPosition = false;
        let position = { x: 0, y: 0, z: 0 };

        while (!foundPosition && height < 50) {
            position = { 
                x: (Math.random() - 0.5) * 20, 
                y: height, 
                z: (Math.random() - 0.5) * 20 
            };

            const testModule = {
                id: -1,
                width: moduleData.width,
                height: moduleData.height,
                depth: moduleData.depth,
                x3D: position.x,
                y3D: position.y,
                z3D: position.z
            };

            if (!this.checkCollision(testModule, position.x, position.y, position.z)) {
                foundPosition = true;
            } else {
                height += 3;
            }
        }

        return position;
    }

    renderModule2D(module) {
        const container = document.getElementById('visualizationContainer');
        if (!container) return;

        const div = document.createElement('div');
        div.className = 'module';
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
            m.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.3)';
        });
       
        moduleElement.classList.add('selected');
        moduleElement.style.boxShadow = '0 0 15px 5px rgba(255, 165, 0, 0.8)';
        this.selectedModule = moduleElement;
    }

    deselectModule() {
        document.querySelectorAll('.module').forEach(m => {
            m.classList.remove('selected');
            m.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.3)';
        });
        this.selectedModule = null;
    }

    deleteSelected() {
        if (!this.selectedModule) {
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
            if (mesh && this.scene) {
                this.scene.remove(mesh);
                this.threeDObjects.delete(moduleId);
            }
        }

        this.selectedModule = null;
        this.updateCart();
    }

    removeFromCart(module) {
        const cartItems = cart.getCart();
        const index = cartItems.findIndex(item => item.id === module.id && item.type === 'module');
        if (index !== -1) {
            cart.removeFromCart(index);
        }
    }

    clearAll() {
        if (!confirm('Удалить все модули?')) return;

        // Удаляем только модули из корзины
        const cartItems = cart.getCart();
        const materials = cartItems.filter(item => item.type !== 'module');
        cart.saveCart(materials);

        this.placedModules = [];
       
        if (this.mode === '2D') {
            const container = document.getElementById('visualizationContainer');
            if (container) {
                container.innerHTML = '';
            }
        } else {
            this.threeDObjects.forEach((mesh) => {
                if (this.scene) this.scene.remove(mesh);
            });
            this.threeDObjects.clear();
            
            // Очищаем хитбоксы
            if (this.hitboxHelpers && this.scene) {
                this.hitboxHelpers.forEach(helper => this.scene.remove(helper));
                this.hitboxHelpers = [];
            }
        }
       
        this.updateCart();
    }

    updateCart() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const moduleCount = document.getElementById('moduleCount');
        const totalArea = document.getElementById('totalArea');
        const projectCost = document.getElementById('projectCost');
       
        if (!cartItems || !cartTotal) return;

        // Получаем модули из общей корзины
        const allCartItems = cart.getCart();
        const moduleItems = allCartItems.filter(item => item.type === 'module');
        
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
            const modulesCost = moduleItems.reduce((sum, item) => sum + item.price, 0);
            projectCost.textContent = modulesCost.toLocaleString();
        }

        if (moduleItems.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Корзина пуста</p>';
            cartTotal.textContent = 'Итого: ₽0';
        } else {
            cartItems.innerHTML = '';
            moduleItems.forEach((item, index) => {
                const allItems = cart.getCart();
                const globalIndex = allItems.findIndex(cartItem => cartItem.id === item.id && cartItem.type === 'module');
                
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div>
                        <div style="font-weight: bold;">${item.name}</div>
                        <div style="color: var(--accent-primary);">₽${item.price.toLocaleString()}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Модуль</div>
                    </div>
                    <button class="remove-btn" onclick="visualizer.removeFromCartByIndex(${globalIndex})">Удалить</button>
                `;
                cartItems.appendChild(div);
            });
           
            const total = moduleItems.reduce((sum, item) => sum + item.price, 0);
            cartTotal.textContent = `Итого: ₽${total.toLocaleString()}`;
        }
    }

    removeFromCartByIndex(index) {
        const cartItems = cart.getCart();
        if (index >= 0 && index < cartItems.length) {
            const item = cartItems[index];
            cart.removeFromCart(index);
            
            // Удаляем модуль из сцены если это модуль
            if (item.type === 'module') {
                this.removeModule(item.id);
            }
        }
    }

    checkout() {
        const moduleItems = cart.getCart().filter(item => item.type === 'module');
        
        if (moduleItems.length === 0) {
            return;
        }
       
        const user = auth.getCurrentUser();
        if (!user) {
            auth.showAuth();
            return;
        }
       
        const total = moduleItems.reduce((sum, item) => sum + item.price, 0);
        
        if (confirm(`Оформить заказ на сумму ₽${total.toLocaleString()}?`)) {
            // Сохраняем заказ
            const allItems = cart.getCart();
            cart.saveOrder(allItems, total);
            
            // Удаляем только модули из корзины
            const materials = allItems.filter(item => item.type !== 'module');
            cart.saveCart(materials);
            
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
            timestamp: new Date().toISOString()
        };

        const projectKey = `prostroy_project_${user}_${Date.now()}`;
        localStorage.setItem(projectKey, JSON.stringify(projectData));
    }
}

const visualizer = new Visualizer();

// Глобальные функции для отладки
window.toggleCollisions = () => visualizer.toggleCollisions();
window.toggleSnap = () => visualizer.toggleSnap();
window.toggleHitboxVisualization = () => visualizer.toggleHitboxVisualization();
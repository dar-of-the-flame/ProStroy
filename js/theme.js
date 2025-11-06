// js/theme.js
const themeManager = {
    STORAGE_KEY: 'prostroy_theme',
    
    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.preloadImages(); // Предзагрузка изображений
    },
    
    loadTheme() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
        this.setTheme(savedTheme);
    },
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateToggleButton(theme);
        this.updateHeroBackground(theme);
    },
    
    updateToggleButton(theme) {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
            toggleBtn.title = theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему';
        }
    },
    
    updateHeroBackground(theme) {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        // Добавляем класс для плавного перехода
        heroSection.classList.add('theme-transition');
        
        // Убираем класс после завершения перехода
        setTimeout(() => {
            heroSection.classList.remove('theme-transition');
        }, 500);
    },
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },
    
    preloadImages() {
        // Предзагрузка фоновых изображений для плавной смены
        const darkImage = new Image();
        darkImage.src = './img/glav.jpg';
        
        const lightImage = new Image();
        lightImage.src = './img/glav-light.jpg';
        
        // Обработчики для отслеживания загрузки изображений
        darkImage.onload = () => console.log('Dark theme background loaded');
        lightImage.onload = () => console.log('Light theme background loaded');
        darkImage.onerror = () => console.warn('Dark theme background failed to load');
        lightImage.onerror = () => console.warn('Light theme background failed to load');
    },
    
    setupEventListeners() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
        
        // Обработчик для системных предпочтений темы
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem(this.STORAGE_KEY)) {
                    this.setTheme(e.matches ? 'light' : 'dark');
                }
            });
        }
    }
};

// Мобильное меню
const mobileMenu = {
    init() {
        this.setupMobileMenu();
    },
    
    setupMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const menu = document.getElementById('mobileMenu');
        const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
        const mobileAuthLink = document.getElementById('mobile-auth-link');
        
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            });
            
            // Закрытие меню при клике на ссылку
            menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    menu.classList.remove('active');
                    toggle.classList.remove('active');
                });
            });
        }
        
        if (mobileThemeToggle) {
            mobileThemeToggle.addEventListener('click', () => {
                themeManager.toggleTheme();
            });
        }
        
        if (mobileAuthLink) {
            mobileAuthLink.addEventListener('click', (e) => {
                e.preventDefault();
                auth.showAuth();
                menu.classList.remove('active');
                toggle.classList.remove('active');
            });
        }
    }
};

// Обновим инициализацию в themeManager
themeManager.init = function() {
    this.loadTheme();
    this.setupEventListeners();
    this.preloadImages();
    mobileMenu.init(); // Инициализируем мобильное меню
};
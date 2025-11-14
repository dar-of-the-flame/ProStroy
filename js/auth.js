const auth = {
    USERS_KEY: 'prostroy_users',

    // Проверка поддержки localStorage
    isLocalStorageSupported: function() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.error('localStorage не поддерживается:', e);
            return false;
        }
    },

    setupMaterialsAccess: function() {
        const materialsLinks = document.querySelectorAll('#materials-link, #materials-link-footer');
        materialsLinks.forEach(link => {
            if (link) {
                link.onclick = (e) => {
                    if (!this.getCurrentUser()) {
                        e.preventDefault();
                        this.showAuth();
                    }
                };
            }
        });
    },

    init() {
        if (!this.isLocalStorageSupported()) {
            console.error('localStorage не поддерживается браузером');
            this.showPublicContent();
            return;
        }

        this.updateAuthUI();
        this.setupEventListeners();
        this.setupMaterialsAccess();
        this.setupMobileMenu(); // ДОБАВЛЕНО: Инициализация мобильного меню
        
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            this.showProtectedContent();
        } else {
            this.showPublicContent();
        }
    },

    // НОВЫЙ МЕТОД: Настройка мобильного меню
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenu.classList.toggle('active');
                mobileMenuToggle.classList.toggle('active');
            });

            // Закрытие меню при клике вне его
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    mobileMenu.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            });

            // Закрытие меню при клике на ссылку
            const mobileLinks = mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                });
            });
        }
    },

    // ОБНОВЛЕННЫЙ МЕТОД: Обновление навигации
    updateNavigation() {
        const currentUser = this.getCurrentUser();
        const authLinks = document.querySelectorAll('#auth-link, #auth-link-footer, #mobile-auth-link');
        
        authLinks.forEach(link => {
            if (currentUser) {
                // Для десктопных ссылок
                if (link.id === 'auth-link' || link.id === 'auth-link-footer') {
                    link.innerHTML = `<a href="profile.html" style="color: inherit; text-decoration: none; display: block; padding: 10px;">${currentUser}</a>`;
                }
                // Для мобильной ссылки
                if (link.id === 'mobile-auth-link') {
                    link.innerHTML = `<a href="profile.html" style="color: inherit; text-decoration: none; display: block; padding: 15px 30px;">${currentUser}</a>`;
                }
                link.onclick = null;
            } else {
                if (link.id === 'auth-link' || link.id === 'auth-link-footer') {
                    link.innerHTML = '<a href="#" style="color: inherit; text-decoration: none; display: block; padding: 10px;">войти</a>';
                    link.onclick = (e) => {
                        e.preventDefault();
                        this.showAuth();
                    };
                }
                if (link.id === 'mobile-auth-link') {
                    link.innerHTML = '<a href="#" style="color: inherit; text-decoration: none; display: block; padding: 15px 30px;">войти</a>';
                    link.onclick = (e) => {
                        e.preventDefault();
                        this.showAuth();
                        // Закрываем мобильное меню после открытия авторизации
                        const mobileMenu = document.getElementById('mobileMenu');
                        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
                        if (mobileMenu) mobileMenu.classList.remove('active');
                        if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
                    };
                }
            }
        });
    },
    
    getUsers() {
        if (!this.isLocalStorageSupported()) return {};
        
        const usersJSON = localStorage.getItem(this.USERS_KEY);
        return usersJSON ? JSON.parse(usersJSON) : {};
    },
    
    saveUsers(users) {
        if (!this.isLocalStorageSupported()) return;
        
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },
    
    getCurrentUser() {
        if (!this.isLocalStorageSupported()) return null;
        
        return localStorage.getItem('currentUser');
    },
    
    setCurrentUser(username) {
        if (!this.isLocalStorageSupported()) return;
        
        if (username) {
            localStorage.setItem('currentUser', username);
            this.updateAuthUI();
            this.updateNavigation();
            this.showProtectedContent();
            
            // Обновляем визуализатор если он существует
            if (window.visualizer) {
                setTimeout(() => {
                    if (typeof visualizer.init === 'function') {
                        visualizer.init();
                    }
                }, 100);
            }
        } else {
            localStorage.removeItem('currentUser');
            this.updateAuthUI();
            this.updateNavigation();
            this.showPublicContent();
        }
    },
    
    updateAuthUI() {
        const currentUser = this.getCurrentUser();
        const authLinks = document.querySelectorAll('#auth-link, #auth-link-footer');
        
        if (currentUser) {
            authLinks.forEach(btn => {
                if (btn.tagName === 'A') {
                    btn.textContent = currentUser;
                    btn.href = 'profile.html';
                    btn.onclick = null;
                }
            });
        } else {
            authLinks.forEach(btn => {
                if (btn.tagName === 'A') {
                    btn.textContent = 'войти';
                    btn.href = '#';
                    btn.onclick = (e) => {
                        e.preventDefault();
                        this.showAuth();
                    };
                }
            });
        }
    },
    
    showPublicContent() {
        const publicContent = document.getElementById('public-content');
        const protectedContent = document.getElementById('protected-content');
        if (publicContent) publicContent.style.display = 'block';
        if (protectedContent) protectedContent.style.display = 'none';
    },
    
    showProtectedContent() {
        const publicContent = document.getElementById('public-content');
        const protectedContent = document.getElementById('protected-content');
        if (publicContent) publicContent.style.display = 'none';
        if (protectedContent) protectedContent.style.display = 'block';
    },
    
    showAuth() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Блокируем скролл
            this.showLoginForm();
        }
    },
    
    hideAuth() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
            document.body.style.overflow = ''; // Разблокируем скролл
        }
    },
    
    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        
        this.clearErrors();
        this.clearFormFields();
    },
    
    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        
        this.clearErrors();
        this.clearFormFields();
    },
    
    clearFormFields() {
        const fields = [
            'login-username', 'login-password',
            'register-username', 'register-password', 'register-password-confirm'
        ];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
    },
    
    clearErrors() {
        const errors = document.querySelectorAll('.error-message');
        errors.forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
    },
    
    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },
    
    handleRegister() {
        this.clearErrors();
        
        const username = document.getElementById('register-username')?.value.trim() || '';
        const password = document.getElementById('register-password')?.value || '';
        const passwordConfirm = document.getElementById('register-password-confirm')?.value || '';
        
        let hasErrors = false;
        
        if (!username) {
            this.showError('register-username-error', 'Введите имя пользователя');
            hasErrors = true;
        } else if (username.length < 3) {
            this.showError('register-username-error', 'Имя пользователя должно быть не менее 3 символов');
            hasErrors = true;
        }
        
        if (!password) {
            this.showError('register-password-error', 'Введите пароль');
            hasErrors = true;
        } else if (password.length < 6) {
            this.showError('register-password-error', 'Пароль должен быть не менее 6 символов');
            hasErrors = true;
        }
        
        if (!passwordConfirm) {
            this.showError('register-password-confirm-error', 'Подтвердите пароль');
            hasErrors = true;
        } else if (password !== passwordConfirm) {
            this.showError('register-password-confirm-error', 'Пароли не совпадают');
            hasErrors = true;
        }
        
        if (hasErrors) return;
        
        const users = this.getUsers();
        
        if (users[username]) {
            this.showError('register-username-error', 'Пользователь уже существует');
            return;
        }
        
        users[username] = password;
        this.saveUsers(users);
        
        this.setCurrentUser(username);
        this.hideAuth();
        
        this.showNotification('Регистрация успешна!', 'success');
    },
    
    handleLogin() {
        this.clearErrors();
        
        const username = document.getElementById('login-username')?.value.trim() || '';
        const password = document.getElementById('login-password')?.value || '';
        
        let hasErrors = false;
        
        if (!username) {
            this.showError('login-username-error', 'Введите имя пользователя');
            hasErrors = true;
        }
        
        if (!password) {
            this.showError('login-password-error', 'Введите пароль');
            hasErrors = true;
        }
        
        if (hasErrors) return;
        
        const users = this.getUsers();
        
        if (!users[username]) {
            this.showError('login-username-error', 'Пользователь не найден');
            return;
        }
        
        if (users[username] !== password) {
            this.showError('login-password-error', 'Неверный пароль');
            return;
        }
        
        this.setCurrentUser(username);
        this.hideAuth();
        
        this.showNotification(`Добро пожаловать, ${username}!`, 'success');
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: bold;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    },
    
    setupEventListeners() {
        const authLinkFooter = document.getElementById('auth-link-footer');
        if (authLinkFooter) {
            authLinkFooter.onclick = (e) => {
                e.preventDefault();
                this.showAuth();
            };
        }
        
        const materialsLinks = document.querySelectorAll('#materials-link, #materials-link-footer');
        materialsLinks.forEach(link => {
            if (link) {
                link.onclick = (e) => {
                    if (!this.getCurrentUser()) {
                        e.preventDefault();
                        this.showAuth();
                        this.showNotification('Для доступа к материалам необходимо войти в систему', 'info');
                    }
                };
            }
        });

        // Закрытие модального окна при клике вне его
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.onclick = (e) => {
                if (e.target === authModal) {
                    this.hideAuth();
                }
            };
        }

        // Обработка Enter в формах
        this.setupEnterKeyHandler();
        
        // Инициализация навигации
        this.updateNavigation();
    },

    setupEnterKeyHandler() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleRegister();
                }
            });
        }
    }
};

window.showAuthModal = () => auth.showAuth();
window.hideAuthModal = () => auth.hideAuth();
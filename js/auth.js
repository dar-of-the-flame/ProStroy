const auth = {
    USERS_KEY: 'prostroy_users',

    setupMaterialsAccess: function() {
        const materialsLinks = document.querySelectorAll('#materials-link, #materials-link-footer');
        materialsLinks.forEach(link => {
            if (link) {
                link.onclick = (e) => {
                    if (!this.getCurrentUser()) {
                        e.preventDefault();
                        this.showAuth();
                        alert('Для доступа к материалам необходимо войти в систему');
                    }
                };
            }
        });
    },

    init() {
        this.updateAuthUI();
        this.setupEventListeners();
        this.setupMaterialsAccess();
        
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            this.showProtectedContent();
        } else {
            this.showPublicContent();
        }
    },
    
    getUsers() {
        const usersJSON = localStorage.getItem(this.USERS_KEY);
        return usersJSON ? JSON.parse(usersJSON) : {};
    },
    
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },
    
    getCurrentUser() {
        return localStorage.getItem('currentUser');
    },
    
    setCurrentUser(username) {
        if (username) {
            localStorage.setItem('currentUser', username);
            this.updateAuthUI();
            this.showProtectedContent();
        } else {
            localStorage.removeItem('currentUser');
            this.updateAuthUI();
            this.showPublicContent();
        }
    },
    
    updateAuthUI() {
        const currentUser = this.getCurrentUser();
        const authLinks = document.querySelectorAll('#auth-link, #auth-link-footer');
        
        if (currentUser) {
            authLinks.forEach(btn => {
                btn.textContent = currentUser;
                btn.onclick = () => { 
                    if (confirm('Выйти из аккаунта?')) {
                        this.setCurrentUser(null);
                    }
                };
            });
        } else {
            authLinks.forEach(btn => {
                btn.textContent = 'войти';
                btn.onclick = () => this.showAuth();
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
        document.getElementById('authModal').style.display = 'block';
        this.showLoginForm();
    },
    
    hideAuth() {
        document.getElementById('authModal').style.display = 'none';
    },
    
    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        this.clearErrors();
    },
    
    showRegisterForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        this.clearErrors();
    },
    
    clearErrors() {
        const errors = document.querySelectorAll('.error-message');
        errors.forEach(error => {
            error.style.display = 'none';
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
        
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        
        if (!username) {
            this.showError('register-username-error', 'Введите имя пользователя');
            return;
        }
        
        if (username.length < 3) {
            this.showError('register-username-error', 'Имя пользователя должно быть не менее 3 символов');
            return;
        }
        
        if (!password) {
            this.showError('register-password-error', 'Введите пароль');
            return;
        }
        
        if (password.length < 6) {
            this.showError('register-password-error', 'Пароль должен быть не менее 6 символов');
            return;
        }
        
        if (!passwordConfirm) {
            this.showError('register-password-confirm-error', 'Подтвердите пароль');
            return;
        }
        
        if (password !== passwordConfirm) {
            this.showError('register-password-confirm-error', 'Пароли не совпадают');
            return;
        }
        
        const users = this.getUsers();
        
        if (users[username]) {
            this.showError('register-username-error', 'Пользователь уже существует');
            return;
        }
        
        users[username] = password;
        this.saveUsers(users);
        
        this.setCurrentUser(username);
        this.hideAuth();
        alert('Регистрация успешна!');
    },
    
    handleLogin() {
        this.clearErrors();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username) {
            this.showError('login-username-error', 'Введите имя пользователя');
            return;
        }
        
        if (!password) {
            this.showError('login-password-error', 'Введите пароль');
            return;
        }
        
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
    },
    
    setupEventListeners() {
        const authLinkFooter = document.getElementById('auth-link-footer');
        if (authLinkFooter) {
            authLinkFooter.onclick = document.getElementById('auth-link').onclick;
        }
        
        const materialsLinks = document.querySelectorAll('#materials-link, #materials-link-footer');
        materialsLinks.forEach(link => {
            if (link) {
                link.onclick = (e) => {
                    if (!this.getCurrentUser()) {
                        e.preventDefault();
                        this.showAuth();
                        alert('Для доступа к материалам необходимо войти в систему');
                    }
                };
            }
        });
    }
};
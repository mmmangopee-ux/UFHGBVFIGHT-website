// GBV Safe Corner - Professional JavaScript
// Mobile-optimized, accessible, and secure

class GBVSafeCorner {
    constructor() {
        this.domain = 'gbvsafecorner.org';
        this.currentLanguage = 'en';
        this.analyticsEnabled = !localStorage.getItem('analytics_optout');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeComponents();
        this.setupServiceWorker();
        this.trackPageView();
    }

    setupEventListeners() {
        // Mobile navigation toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Emergency bar show/hide
        const emergencyBar = document.getElementById('emergencyBar');
        if (emergencyBar) {
            setTimeout(() => {
                emergencyBar.classList.add('show');
            }, 1000);
        }

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Escape key to close modals and emergency exit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Quick exit with Ctrl + Q
            if (e.ctrlKey && e.key === 'q') {
                this.emergencyExit();
            }
        });

        // Smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    initializeComponents() {
        this.initializeLanguageSelector();
        this.initializeAnalytics();
        this.setupOfflineDetection();
    }

    initializeLanguageSelector() {
        const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
        this.changeLanguage(savedLanguage);
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
        this.applyTranslations();
        this.trackFeatureUse(`language_changed_${lang}`);
    }

    applyTranslations() {
        // This would be expanded with actual translation files
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            // Translation logic would go here
        });
    }

    // Emergency Functions
    emergencyExit() {
        // Clear all sensitive data
        this.clearSensitiveData();
        
        // Redirect to safe page
        window.location.href = 'https://www.google.com/search?q=weather';
    }

    clearSensitiveData() {
        // Clear form data
        document.querySelectorAll('input, textarea').forEach(element => {
            element.value = '';
        });
        
        // Clear sensitive storage
        const sensitiveKeys = [
            'safetyPlanProgress',
            'riskAssessmentData',
            'userLocation',
            'conversationHistory'
        ];
        
        sensitiveKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        
        // Clear recent browsing history for this site
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes(this.domain)) {
                        caches.delete(name);
                    }
                });
            });
        }
    }

    showEmergencyHelp() {
        this.openModal('emergencyModal');
        this.trackFeatureUse('emergency_help_opened');
    }

    callNumber(number) {
        window.location.href = `tel:${number}`;
        this.trackFeatureUse(`emergency_call_${number}`);
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Focus management for accessibility
            const firstFocusable = modal.querySelector('button, input, [tabindex]');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = 'auto';
    }

    // Analytics (Privacy-focused)
    initializeAnalytics() {
        if (!this.analyticsEnabled) return;
        
        // Basic page view tracking
        this.trackPageView();
        
        // Error tracking
        window.addEventListener('error', (e) => {
            this.trackError(e.error, 'global_error');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.trackError(e.reason, 'unhandled_rejection');
        });
    }

    trackPageView() {
        if (!this.analyticsEnabled) return;
        
        const pageData = {
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            domain: this.domain,
            language: this.currentLanguage
        };
        
        const views = JSON.parse(localStorage.getItem('page_views') || '[]');
        views.push(pageData);
        localStorage.setItem('page_views', JSON.stringify(views.slice(-50))); // Keep last 50
    }

    trackFeatureUse(feature) {
        if (!this.analyticsEnabled) return;
        
        const usage = JSON.parse(localStorage.getItem('feature_usage') || '{}');
        usage[feature] = (usage[feature] || 0) + 1;
        localStorage.setItem('feature_usage', JSON.stringify(usage));
    }

    trackError(error, context) {
        if (!this.analyticsEnabled) return;
        
        const errors = JSON.parse(localStorage.getItem('error_logs') || '[]');
        errors.push({
            error: error.toString(),
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        localStorage.setItem('error_logs', JSON.stringify(errors.slice(-20))); // Keep last 20
    }

    // Service Worker for PWA
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Offline Detection
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('You are currently offline. Some features may not work.', 'warning');
        });
    }

    // Notification System
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    z-index: 10000;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease;
                }
                .notification-success { border-left: 4px solid #27ae60; }
                .notification-warning { border-left: 4px solid #f39c12; }
                .notification-error { border-left: 4px solid #e74c3c; }
                .notification-content {
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    gap: 1rem;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    cursor: pointer;
                    color: #666;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility Functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    formatPhoneNumber(phone) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }

    // Security Functions
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.GBVApp = new GBVSafeCorner();
});

// Global functions for HTML onclick attributes
function emergencyExit() {
    if (window.GBVApp) {
        window.GBVApp.emergencyExit();
    }
}

function showEmergencyHelp() {
    if (window.GBVApp) {
        window.GBVApp.showEmergencyHelp();
    }
}

function callNumber(number) {
    if (window.GBVApp) {
        window.GBVApp.callNumber(number);
    }
}

function closeModal(modalId) {
    if (window.GBVApp) {
        window.GBVApp.closeModal(modalId);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GBVSafeCorner;
}

/* Door Restaurant - Complete JavaScript with Simplified Audio System */

// =============== SIMPLIFIED AUDIO SYSTEM ===============
class DoorAudio {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.volume = 0.3;
        this.isMobile = this.detectMobile();
        this.hasUserInteracted = false;
        this.isInitialized = false;
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }
    
    init() {
        if (this.isInitialized) {
            console.log('Door Audio - Already initialized, skipping...');
            return;
        }
        
        console.log('Door Audio System - Initializing...', this.isMobile ? 'Mobile detected' : 'Desktop detected');
        
        this.audio = document.getElementById('backgroundAudio');
        if (!this.audio) {
            console.warn('Background audio element not found');
            return;
        }
        
        this.audio.volume = this.volume;
        this.setupAudioEventListeners();
        this.startAudio();
        this.isInitialized = true;
    }
    
    startAudio() {
        if (!this.audio) return;
        
        console.log('Starting audio automatically...');
        
        // Start unmuted first for better UX
        this.audio.muted = false;
        
        this.audio.play()
            .then(() => {
                console.log('Audio started successfully');
                this.isPlaying = true;
                this.updateButtons();
            })
            .catch(error => {
                console.log('Audio autoplay prevented, trying muted:', error.message);
                // Try muted version for autoplay compliance
                this.audio.muted = true;
                return this.audio.play();
            })
            .then(() => {
                if (this.audio && this.audio.muted) {
                    console.log('Audio started muted - will unmute on first interaction');
                    this.isPlaying = true;
                    this.setupFirstInteractionUnmute();
                }
                this.updateButtons();
            })
            .catch(error => {
                console.log('Audio failed to start:', error.message);
                this.setupFirstInteractionStart();
                this.updateButtons();
            });
    }
    
    setupFirstInteractionUnmute() {
        const handleFirstInteraction = () => {
            if (this.audio && this.audio.muted) {
                this.audio.muted = false;
                this.hasUserInteracted = true;
                console.log('Audio unmuted on first interaction');
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
        };
        
        document.addEventListener('click', handleFirstInteraction, { once: true });
        document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    }
    
    setupFirstInteractionStart() {
        const handleFirstInteraction = () => {
            if (this.audio && this.audio.paused) {
                this.audio.muted = false;
                this.hasUserInteracted = true;
                this.audio.play()
                    .then(() => {
                        this.isPlaying = true;
                        this.updateButtons();
                        console.log('Audio started on first interaction');
                    })
                    .catch(console.log);
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
        };
        
        document.addEventListener('click', handleFirstInteraction, { once: true });
        document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    }
    
    setupAudioEventListeners() {
        if (!this.audio) return;
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updateButtons();
            console.log('Audio playing - Current time:', this.audio.currentTime);
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateButtons();
            console.log('Audio paused - Current time:', this.audio.currentTime);
        });
        
        this.audio.addEventListener('canplay', () => {
            console.log('Audio can play - Duration:', this.audio.duration);
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e, 'Error code:', this.audio.error?.code);
            this.isPlaying = false;
            this.updateButtons();
        });
        
        this.audio.addEventListener('ended', () => {
            console.log('Audio ended - restarting...');
            if (this.isPlaying) {
                this.audio.currentTime = 0;
                this.audio.play().catch(console.log);
            }
        });
    }
    
    toggle() {
        console.log('Audio toggle clicked - Current state:', this.isPlaying, 'Paused:', this.audio?.paused);
        
        if (this.isPlaying && this.audio && !this.audio.paused) {
            this.audio.pause();
        } else if (this.audio) {
            if (this.audio.muted) {
                this.audio.muted = false;
                this.hasUserInteracted = true;
            }
            this.audio.play().catch(console.log);
        }
    }
    
    updateButtons() {
        const buttons = document.querySelectorAll('.audio-toggle, .splash-audio-toggle');
        
        buttons.forEach(button => {
            const isActuallyPlaying = this.isPlaying && this.audio && !this.audio.paused;
            
            if (isActuallyPlaying) {
                button.innerHTML = '⏸';
                button.classList.add('playing');
                button.title = 'Pause Background Music';
                button.setAttribute('aria-label', 'Pause background music');
            } else {
                button.innerHTML = '♪';
                button.classList.remove('playing');
                button.title = 'Play Background Music';
                button.setAttribute('aria-label', 'Play background music');
                
                if (this.isMobile && !this.hasUserInteracted) {
                    button.title = 'Tap to start music';
                }
            }
        });
        
        console.log('Audio buttons updated - Playing:', this.isPlaying, 'Actually playing:', this.audio && !this.audio.paused);
    }
}

// =============== GLOBAL VARIABLES ===============
window.doorAudio = null;

// =============== DOCUMENT READY & INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Door - Initializing simplified system...');
    
    // Initialize audio system for auto-play
    window.doorAudio = new DoorAudio();
    
    initMobileMenu();
    initViewportHeight();
    initKeyboardNavigation();
    initAccessibilityFeatures();
    
    console.log('Door - Simplified system initialized!');
});

// =============== SPLASH PAGE FUNCTIONS ===============
function enterSite() {
    console.log('Entering site...');
    hideSplash();
}

function handleSplashKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        enterSite();
    }
}

function hideSplash() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (splashPage && mainSite) {
        splashPage.classList.add('hidden');
        mainSite.classList.add('active');
        
        setTimeout(() => {
            splashPage.style.display = 'none';
        }, 1200);
        
        console.log('Splash hidden, main site active');
    }
}

// =============== AUDIO FUNCTIONS ===============
function toggleAudio(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    console.log('Audio toggle function called');
    
    if (window.doorAudio) {
        window.doorAudio.toggle();
    } else {
        console.warn('Audio system not initialized');
    }
}

// =============== MOBILE MENU ===============
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const navLinks = document.getElementById('navLinks');
    
    if (!mobileMenuButton || !navLinks) return;
    
    console.log('Initializing mobile menu...');
    
    mobileMenuButton.addEventListener('click', toggleMobileMenu);
    
    // Close menu when clicking nav links
    const navLinkElements = navLinks.querySelectorAll('a');
    navLinkElements.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.classList.contains('active')) return;
        
        if (e.target.closest('.nav-container, .mobile-menu')) {
            return;
        }
        
        if (e.target.closest('input, textarea, select, button, [tabindex]')) {
            return;
        }
        
        closeMobileMenu();
    });
    
    // Close menu with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            closeMobileMenu();
            mobileMenuButton.focus();
        }
    });
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileMenuButton = document.querySelector('.mobile-menu');
    
    if (!navLinks || !mobileMenuButton) return;
    
    const isOpen = navLinks.classList.contains('active');
    
    if (isOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileMenuButton = document.querySelector('.mobile-menu');
    
    if (!navLinks || !mobileMenuButton) return;
    
    navLinks.classList.add('active');
    mobileMenuButton.classList.add('active');
    mobileMenuButton.setAttribute('aria-expanded', 'true');
    
    document.body.classList.add('menu-open');
    
    const firstLink = navLinks.querySelector('a');
    if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
    }
    
    console.log('Mobile menu opened');
}

function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileMenuButton = document.querySelector('.mobile-menu');
    
    if (!navLinks || !mobileMenuButton) return;
    
    navLinks.classList.remove('active');
    mobileMenuButton.classList.remove('active');
    mobileMenuButton.setAttribute('aria-expanded', 'false');
    
    document.body.classList.remove('menu-open');
    
    console.log('Mobile menu closed');
}

// =============== VIEWPORT HEIGHT OPTIMIZATION ===============
function initViewportHeight() {
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setViewportHeight();
    
    const debouncedSetViewportHeight = debounce(() => {
        setViewportHeight();
    }, 150);
    
    window.addEventListener('resize', debouncedSetViewportHeight);
    
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            setViewportHeight();
        }, 200);
    });
    
    console.log('Viewport height optimization initialized');
}

function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Spacebar to toggle audio (when not in form fields)
        if (e.key === ' ' && e.target === document.body) {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (!isMobileDevice || !document.activeElement || document.activeElement === document.body) {
                e.preventDefault();
                toggleAudio();
            }
        }
        
        // Mobile menu toggle
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mobile-menu')) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggleMobileMenu();
            }
        }
    });
    
    console.log('Keyboard navigation initialized');
}

function initAccessibilityFeatures() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                if (target.tabIndex === -1) {
                    target.tabIndex = -1;
                }
                target.focus();
            }
        });
    });
    
    // Skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector('#main-content') || document.querySelector('main');
            if (target) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    console.log('Accessibility features initialized');
}

// =============== UTILITY FUNCTIONS ===============
function goHome() {
    // Navigate to home or refresh
    window.location.href = 'index.html';
}

function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const context = this;
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// =============== iPhone-SPECIFIC INITIALIZATION ===============
function isIPhone() {
    return /iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

if (isIPhone()) {
    document.body.setAttribute('data-device', 'iphone');
    
    // iPhone viewport handling
    function setIPhoneViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setIPhoneViewportHeight();
    window.addEventListener('resize', setIPhoneViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setIPhoneViewportHeight, 100);
    });
    
    // iPhone-specific audio handling
    document.addEventListener('DOMContentLoaded', () => {
        const audio = document.getElementById('backgroundAudio');
        if (audio) {
            audio.setAttribute('webkit-playsinline', 'true');
            audio.setAttribute('playsinline', 'true');
            audio.playsInline = true;
            audio.load();
        }
    });
    
    console.log('iPhone-specific optimizations loaded');
}

// =============== ERROR HANDLING ===============
window.addEventListener('error', (e) => {
    console.error('Door - JavaScript error:', e.error);
    
    if (e.error.message.includes('audio') && window.doorAudio) {
        console.log('Attempting audio system recovery...');
        setTimeout(() => {
            try {
                window.doorAudio.updateButtons();
            } catch (recoveryError) {
                console.error('Audio recovery failed:', recoveryError);
            }
        }, 1000);
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Door - Unhandled promise rejection:', e.reason);
});

// =============== PERFORMANCE MONITORING ===============
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = Math.round(performance.now());
        console.log(`Door - Page loaded in ${loadTime}ms`);
        
        if (performance.navigation) {
            const navType = performance.navigation.type;
            const navTypes = ['navigate', 'reload', 'back_forward', 'reserved'];
            console.log(`Navigation type: ${navTypes[navType] || 'unknown'}`);
        }
    });
}

// =============== DEVELOPMENT HELPERS ===============
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('dev')) {
    
    console.log('Door - Development mode active');
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case 'a':
                    e.preventDefault();
                    toggleAudio();
                    console.log('Dev: Audio toggled');
                    break;
                case 's':
                    e.preventDefault();
                    hideSplash();
                    console.log('Dev: Splash hidden');
                    break;
                case 'r':
                    e.preventDefault();
                    console.log('Dev: Audio state reset');
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMobileMenu();
                    console.log('Dev: Mobile menu toggled');
                    break;
            }
        }
    });
    
    // Debug tools
    window.doorDebug = {
        audio: () => window.doorAudio,
        forceAudioStart: () => {
            if (window.doorAudio) {
                window.doorAudio.audio.muted = false;
                window.doorAudio.audio.play();
            }
        },
        toggleMobileMenu: () => toggleMobileMenu(),
        mobileMenuState: () => {
            const navLinks = document.getElementById('navLinks');
            return navLinks ? navLinks.classList.contains('active') : false;
        },
        hideSplash: () => hideSplash(),
        showSplash: () => {
            const splashPage = document.getElementById('splashPage');
            const mainSite = document.getElementById('mainSite');
            if (splashPage && mainSite) {
                splashPage.style.display = 'flex';
                splashPage.classList.remove('hidden');
                mainSite.classList.remove('active');
            }
        }
    };
    
    console.log('Dev tools available: window.doorDebug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
Door Restaurant - SIMPLIFIED IMAGE ENTRY
🖼️ IMAGE CLICK: Click the splash image to enter
🎵 AUTO AUDIO: Quietstorm plays automatically at launch
📱 MOBILE FRIENDLY: Touch-optimized for iPhone
🎵 AUDIO CONTROLS: Blue music button in top-right corner
⌨️ KEYBOARD: Spacebar toggles audio, Enter on splash enters site
🚀 PERFORMANCE: Optimized for smooth iPhone experience
🔧 DEV TOOLS: Available at window.doorDebug in development

Files Expected:
• /assets/splash.png - Main splash screen image
• /assets/audio/QUIETSTORM.mp3 - Background music
`);

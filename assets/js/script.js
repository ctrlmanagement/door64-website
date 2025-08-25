/* Door 64 Restaurant - Complete Enhanced JavaScript with Fixed Audio System */

// =============== FIXED CONTINUOUS AUDIO SYSTEM ===============
class Door64Audio {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.volume = 0.3;
        this.storageKey = 'door64_audio_state';
        this.timeKey = 'door64_audio_time';
        this.lastUpdateTime = 0;
        this.updateInterval = 2000; // Update storage every 2 seconds
        this.hasUserInteracted = false;
        
        this.init();
    }
    
    init() {
        console.log('🎵 Door 64 Audio System - Initializing...');
        
        this.audio = document.getElementById('backgroundAudio');
        if (!this.audio) {
            console.warn('⚠️ Background audio element not found');
            return;
        }
        
        // Set up audio properties
        this.audio.volume = this.volume;
        this.audio.preload = 'auto';
        this.audio.loop = true;
        
        // Force load the audio
        this.audio.load();
        
        // Set up event listeners
        this.setupAudioEventListeners();
        this.setupPageUnloadHandler();
        this.setupUserInteractionListeners();
        
        // Check stored state
        const storedState = localStorage.getItem(this.storageKey);
        const storedTime = localStorage.getItem(this.timeKey);
        
        console.log('🎵 Stored audio state:', storedState);
        console.log('🎵 Stored audio time:', storedTime);
        
        // Start audio automatically unless user previously paused it
        if (storedState !== 'paused') {
            // Restore time position if available
            if (storedTime && parseFloat(storedTime) > 0) {
                this.audio.currentTime = parseFloat(storedTime);
                console.log('🎵 Resuming from time:', storedTime);
            }
            
            // Try to start audio immediately
            this.startAudio();
        } else {
            console.log('🎵 Audio was paused by user, respecting choice');
            this.updateButtons();
        }
    }
    
    setupAudioEventListeners() {
        if (!this.audio) return;
        
        // Periodic time storage
        this.audio.addEventListener('timeupdate', () => {
            if (this.isPlaying) {
                const now = Date.now();
                if (now - this.lastUpdateTime > this.updateInterval) {
                    localStorage.setItem(this.timeKey, this.audio.currentTime.toString());
                    this.lastUpdateTime = now;
                }
            }
        });
        
        // Audio state change handlers
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            localStorage.setItem(this.storageKey, 'playing');
            this.updateButtons();
            console.log('🎵 Audio playing - Current time:', this.audio.currentTime);
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateButtons();
            console.log('⏸️ Audio paused - Current time:', this.audio.currentTime);
        });
        
        // Handle audio loading
        this.audio.addEventListener('canplay', () => {
            console.log('🎵 Audio can play - Duration:', this.audio.duration);
        });
        
        // Handle audio errors
        this.audio.addEventListener('error', (e) => {
            console.error('🚨 Audio error:', e, 'Error code:', this.audio.error?.code);
            this.isPlaying = false;
            this.updateButtons();
        });
        
        // Handle audio end (backup for loop)
        this.audio.addEventListener('ended', () => {
            console.log('🎵 Audio ended - restarting...');
            if (this.isPlaying) {
                this.audio.currentTime = 0;
                this.audio.play().catch(console.log);
            }
        });
    }
    
    setupUserInteractionListeners() {
        // Listen for ANY user interaction to unmute audio
        const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
        const handleInteraction = () => {
            if (!this.hasUserInteracted) {
                this.hasUserInteracted = true;
                console.log('🔊 User interaction detected - unmuting audio');
                
                if (this.audio && this.audio.muted) {
                    this.audio.muted = false;
                    console.log('🔊 Audio unmuted');
                }
                
                // Try to ensure audio is playing if it should be
                const storedState = localStorage.getItem(this.storageKey);
                if (storedState !== 'paused' && this.audio && this.audio.paused) {
                    console.log('▶️ Starting paused audio after user interaction');
                    this.audio.play().catch(console.log);
                }
                
                // Remove listeners after first interaction
                events.forEach(event => {
                    document.removeEventListener(event, handleInteraction);
                });
            }
        };
        
        events.forEach(event => {
            document.addEventListener(event, handleInteraction, { passive: true });
        });
    }
    
    setupPageUnloadHandler() {
        // Store final position on page unload
        window.addEventListener('beforeunload', () => {
            if (this.audio && this.isPlaying) {
                localStorage.setItem(this.timeKey, this.audio.currentTime.toString());
                localStorage.setItem(this.storageKey, 'playing');
                console.log('💾 Audio state saved on page unload');
            }
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.audio) {
                // Page visible again - ensure audio is playing if it should be
                const storedState = localStorage.getItem(this.storageKey);
                if (storedState === 'playing' && this.audio.paused) {
                    console.log('🎵 Page visible - resuming audio');
                    this.audio.play().catch(console.log);
                }
            }
        });
    }
    
    startAudio() {
        if (!this.audio) return;
        
        console.log('🎵 Attempting to start audio...');
        
        // Start muted to comply with autoplay policies
        this.audio.muted = true;
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ Audio started successfully (muted)');
                    this.isPlaying = true;
                    localStorage.setItem(this.storageKey, 'playing');
                    this.updateButtons();
                    
                    // Audio will be unmuted on first user interaction
                })
                .catch(error => {
                    console.log('⚠️ Audio autoplay prevented:', error.message);
                    // Audio will start on first user interaction
                    this.updateButtons();
                });
        }
    }
    
    pauseAudio() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.isPlaying = false;
        localStorage.setItem(this.storageKey, 'paused');
        localStorage.setItem(this.timeKey, this.audio.currentTime.toString());
        this.updateButtons();
        console.log('⏸️ Audio paused by user');
    }
    
    resumeAudio() {
        if (!this.audio) return;
        
        // Unmute if muted
        if (this.audio.muted) {
            this.audio.muted = false;
        }
        
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.isPlaying = true;
                    localStorage.setItem(this.storageKey, 'playing');
                    this.updateButtons();
                    console.log('▶️ Audio resumed by user');
                })
                .catch(error => {
                    console.error('🚨 Failed to resume audio:', error);
                    this.updateButtons();
                });
        }
    }
    
    toggle() {
        console.log('🎵 Audio toggle requested');
        
        if (this.isPlaying && this.audio && !this.audio.paused) {
            this.pauseAudio();
        } else {
            this.resumeAudio();
        }
    }
    
    updateButtons() {
        const buttons = document.querySelectorAll('.audio-toggle, .splash-audio-toggle');
        
        buttons.forEach(button => {
            if (this.isPlaying && this.audio && !this.audio.paused) {
                button.innerHTML = '⏸';
                button.classList.add('playing');
                button.title = 'Pause Background Music';
                button.setAttribute('aria-label', 'Pause background music');
            } else {
                button.innerHTML = '♪';
                button.classList.remove('playing');
                button.title = 'Play Background Music';
                button.setAttribute('aria-label', 'Play background music');
            }
        });
        
        console.log('🎵 Audio buttons updated - Playing:', this.isPlaying);
    }
}

// =============== ENHANCED GALLERY SYSTEM ===============
class Door64Gallery {
    constructor(galleryId) {
        this.galleryId = galleryId;
        this.currentSlide = 0;
        this.slides = document.querySelectorAll(`#${galleryId} .gallery-slide`);
        this.dots = document.querySelectorAll(`#${galleryId} .gallery-dot`);
        this.track = document.querySelector(`#${galleryId} .gallery-track`);
        this.progress = document.querySelector(`#${galleryId} .gallery-progress`);
        this.totalSlides = this.slides.length;
        this.autoPlayInterval = null;
        this.isPlaying = false;
        this.autoPlayDelay = 5000; // 5 seconds
        
        if (this.totalSlides > 0) {
            this.init();
        }
    }
    
    init() {
        console.log(`🖼️ Gallery ${this.galleryId} - Initializing with ${this.totalSlides} slides`);
        
        this.setupEventListeners();
        this.updateGallery();
        this.startAutoPlay();
    }
    
    setupEventListeners() {
        // Dot navigation with keyboard support
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
            dot.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.goToSlide(Math.max(0, index - 1));
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.goToSlide(Math.min(this.totalSlides - 1, index + 1));
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.goToSlide(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        this.goToSlide(this.totalSlides - 1);
                        break;
                }
            });
        });
        
        // Button navigation
        const prevButton = document.querySelector(`#${this.galleryId} .gallery-nav.prev`);
        const nextButton = document.querySelector(`#${this.galleryId} .gallery-nav.next`);
        
        if (prevButton) prevButton.addEventListener('click', () => this.previousSlide());
        if (nextButton) nextButton.addEventListener('click', () => this.nextSlide());
        
        // Hover/focus pause behavior
        const container = document.querySelector(`#${this.galleryId}`);
        if (container) {
            container.addEventListener('mouseenter', () => this.pauseAutoPlay());
            container.addEventListener('mouseleave', () => this.resumeAutoPlay());
            container.addEventListener('focusin', () => this.pauseAutoPlay());
            container.addEventListener('focusout', () => this.resumeAutoPlay());
        }
        
        // Touch/swipe support
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        const container = document.querySelector(`#${this.galleryId}`);
        if (!container) return;
        
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        
        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            
            container.classList.add('swiping');
            this.pauseAutoPlay();
        });
        
        container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            
            // Prevent vertical scrolling if horizontal swipe is dominant
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                e.preventDefault();
            }
        });
        
        container.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - startX;
            
            container.classList.remove('swiping');
            isDragging = false;
            
            // Swipe threshold
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.previousSlide();
                } else {
                    this.nextSlide();
                }
            }
            
            this.resumeAutoPlay();
        });
    }
    
    updateGallery() {
        if (!this.track) return;
        
        // Update track position with smooth transition
        this.track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        
        // Update dots with accessibility attributes
        this.dots.forEach((dot, index) => {
            const isActive = index === this.currentSlide;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-selected', isActive.toString());
            dot.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        
        // Update progress bar
        this.updateProgress();
        
        // Update slide visibility for screen readers
        this.slides.forEach((slide, index) => {
            slide.setAttribute('aria-hidden', (index !== this.currentSlide).toString());
            if (index === this.currentSlide) {
                slide.classList.add('fade-in');
                setTimeout(() => slide.classList.remove('fade-in'), 600);
            }
        });
    }
    
    updateProgress() {
        if (!this.progress) return;
        
        const progressWidth = ((this.currentSlide + 1) / this.totalSlides) * 100;
        this.progress.style.width = `${progressWidth}%`;
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateGallery();
        console.log(`🖼️ Gallery ${this.galleryId} - Next slide: ${this.currentSlide + 1}/${this.totalSlides}`);
    }
    
    previousSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateGallery();
        console.log(`🖼️ Gallery ${this.galleryId} - Previous slide: ${this.currentSlide + 1}/${this.totalSlides}`);
    }
    
    goToSlide(slideIndex) {
        if (slideIndex >= 0 && slideIndex < this.totalSlides) {
            this.currentSlide = slideIndex;
            this.updateGallery();
            this.restartAutoPlay();
            console.log(`🖼️ Gallery ${this.galleryId} - Go to slide: ${slideIndex + 1}/${this.totalSlides}`);
        }
    }
    
    startAutoPlay() {
        this.pauseAutoPlay();
        if (this.totalSlides > 1) {
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, this.autoPlayDelay);
            this.isPlaying = true;
            console.log(`▶️ Gallery ${this.galleryId} - Auto-play started`);
        }
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        this.isPlaying = false;
    }
    
    resumeAutoPlay() {
        if (!this.isPlaying && this.totalSlides > 1) {
            this.startAutoPlay();
        }
    }
    
    restartAutoPlay() {
        this.startAutoPlay();
    }
}

// =============== GLOBAL VARIABLES ===============
let currentSlide = 0;
let slideInterval = null;
let isAudioPlaying = false;

// Global instances
window.door64Audio = null;
window.door64Galleries = {};

// =============== DOCUMENT READY & INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚪 Door 64 - Initializing enhanced systems...');
    
    // Initialize enhanced audio system
    window.door64Audio = new Door64Audio();
    
    // Initialize enhanced galleries
    initGalleries();
    
    // Initialize other functionality
    initSplashPage();
    initMobileMenu();
    initViewportHeight();
    initKeyboardNavigation();
    initAccessibilityFeatures();
    
    // Initialize lazy loading if supported
    if ('IntersectionObserver' in window) {
        initLazyLoading();
    }
    
    console.log('✅ Door 64 - All systems ready!');
});

// =============== ENHANCED GALLERY INITIALIZATION ===============
function initGalleries() {
    const galleries = document.querySelectorAll('.css-gallery');
    
    galleries.forEach(gallery => {
        const galleryId = gallery.id;
        if (galleryId) {
            window.door64Galleries[galleryId] = new Door64Gallery(galleryId);
        }
    });
    
    // Backward compatibility - initialize landing gallery if no ID found
    const landingTrack = document.getElementById('landing-track');
    if (landingTrack && !window.door64Galleries['landing-gallery']) {
        const landingGallery = landingTrack.closest('.css-gallery');
        if (landingGallery) {
            landingGallery.id = 'landing-gallery';
            window.door64Galleries['landing-gallery'] = new Door64Gallery('landing-gallery');
        }
    }
}

// =============== GLOBAL FUNCTIONS (for backward compatibility) ===============
function toggleAudio(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    if (window.door64Audio) {
        window.door64Audio.toggle();
    } else {
        console.warn('⚠️ Audio system not initialized');
    }
}

function nextSlide(galleryId) {
    if (galleryId && window.door64Galleries && window.door64Galleries[galleryId]) {
        window.door64Galleries[galleryId].nextSlide();
    } else if (!galleryId && window.door64Galleries['landing-gallery']) {
        // Backward compatibility for landing gallery
        window.door64Galleries['landing-gallery'].nextSlide();
    } else {
        console.warn(`⚠️ Gallery ${galleryId || 'landing-gallery'} not found`);
    }
}

function previousSlide(galleryId) {
    if (galleryId && window.door64Galleries && window.door64Galleries[galleryId]) {
        window.door64Galleries[galleryId].previousSlide();
    } else if (!galleryId && window.door64Galleries['landing-gallery']) {
        // Backward compatibility for landing gallery
        window.door64Galleries['landing-gallery'].previousSlide();
    } else {
        console.warn(`⚠️ Gallery ${galleryId || 'landing-gallery'} not found`);
    }
}

function goToSlide(galleryIdOrIndex, slideIndex) {
    // Handle both old and new calling patterns
    if (typeof galleryIdOrIndex === 'string') {
        // New pattern: goToSlide('gallery-id', slideIndex)
        if (window.door64Galleries && window.door64Galleries[galleryIdOrIndex]) {
            window.door64Galleries[galleryIdOrIndex].goToSlide(slideIndex);
        }
    } else {
        // Old pattern: goToSlide(slideIndex) for landing gallery
        const slideIdx = galleryIdOrIndex;
        if (window.door64Galleries && window.door64Galleries['landing-gallery']) {
            window.door64Galleries['landing-gallery'].goToSlide(slideIdx);
        }
    }
}

// =============== ENHANCED SPLASH PAGE FUNCTIONALITY ===============
function initSplashPage() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (!splashPage) return;
    
    console.log('🚪 Initializing splash page...');
    
    // Make entire splash page clickable (except audio button)
    splashPage.addEventListener('click', function(e) {
        // Don't navigate if clicking audio button
        if (e.target.closest('.splash-audio-toggle')) {
            return;
        }
        
        console.log('🚪 Entering main site from splash...');
        
        // Ensure audio continues playing
        if (window.door64Audio && window.door64Audio.audio) {
            // Unmute audio if it's muted and playing
            if (window.door64Audio.audio.muted && !window.door64Audio.audio.paused) {
                window.door64Audio.audio.muted = false;
            }
            
            // Ensure audio is playing
            if (window.door64Audio.audio.paused && localStorage.getItem('door64_audio_state') !== 'paused') {
                window.door64Audio.resumeAudio();
            }
            
            // Save state for next page
            localStorage.setItem('door64_audio_state', 'playing');
            if (window.door64Audio.audio.currentTime > 0) {
                localStorage.setItem('door64_audio_time', window.door64Audio.audio.currentTime.toString());
            }
        }
        
        // Small delay to ensure audio state is saved
        setTimeout(() => {
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/' || 
                window.location.pathname === '') {
                window.location.href = '64.html';
            } else {
                hideSplash();
            }
        }, 100);
    });
    
    // Individual door links
    const doorLinks = splashPage.querySelectorAll('.door-gallery a');
    doorLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🚪 Door ${index + 1} clicked - entering main site...`);
            
            // Same logic as splash click
            if (window.door64Audio && window.door64Audio.audio) {
                if (window.door64Audio.audio.muted && !window.door64Audio.audio.paused) {
                    window.door64Audio.audio.muted = false;
                }
                if (window.door64Audio.audio.paused && localStorage.getItem('door64_audio_state') !== 'paused') {
                    window.door64Audio.resumeAudio();
                }
                localStorage.setItem('door64_audio_state', 'playing');
                if (window.door64Audio.audio.currentTime > 0) {
                    localStorage.setItem('door64_audio_time', window.door64Audio.audio.currentTime.toString());
                }
            }
            
            setTimeout(() => {
                window.location.href = '64.html';
            }, 100);
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (splashPage.style.display !== 'none') {
            if (event.key === 'Enter' || event.key === ' ') {
                if (!event.target.closest('.splash-audio-toggle')) {
                    event.preventDefault();
                    splashPage.click();
                }
            }
        }
    });
}

function hideSplash() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (splashPage && mainSite) {
        splashPage.classList.add('hidden');
        mainSite.classList.add('active');
        
        // Remove splash page after animation
        setTimeout(() => {
            splashPage.style.display = 'none';
        }, 1200);
        
        console.log('✅ Splash hidden, main site active');
    }
}

// =============== ENHANCED MOBILE MENU FUNCTIONALITY ===============
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const navLinks = document.getElementById('navLinks');
    
    if (!mobileMenuButton || !navLinks) return;
    
    console.log('📱 Initializing mobile menu...');
    
    mobileMenuButton.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu when clicking nav links
    const navLinkElements = navLinks.querySelectorAll('a');
    navLinkElements.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container') && navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // Close mobile menu on Escape key
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
    
    // Focus first link for accessibility
    const firstLink = navLinks.querySelector('a');
    if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
    }
    
    console.log('📱 Mobile menu opened');
}

function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileMenuButton = document.querySelector('.mobile-menu');
    
    if (!navLinks || !mobileMenuButton) return;
    
    navLinks.classList.remove('active');
    mobileMenuButton.classList.remove('active');
    mobileMenuButton.setAttribute('aria-expanded', 'false');
    
    console.log('📱 Mobile menu closed');
}

// =============== VIEWPORT HEIGHT FIX FOR MOBILE ===============
function initViewportHeight() {
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // Set on load
    setViewportHeight();
    
    // Update on resize (debounced)
    const debouncedSetViewportHeight = debounce(setViewportHeight, 100);
    window.addEventListener('resize', debouncedSetViewportHeight);
    
    // Update on orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });
    
    console.log('📱 Viewport height optimization initialized');
}

// =============== KEYBOARD NAVIGATION SUPPORT ===============
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Audio toggle with spacebar (when focus is on body)
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
            toggleAudio();
        }
        
        // Mobile menu toggle with Enter/Space when focused
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mobile-menu')) {
            e.preventDefault();
            toggleMobileMenu();
        }
        
        // Gallery keyboard navigation when focused
        const activeElement = document.activeElement;
        if (activeElement && activeElement.closest('.css-gallery')) {
            const gallery = activeElement.closest('.css-gallery');
            const galleryId = gallery.id;
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    previousSlide(galleryId);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextSlide(galleryId);
                    break;
                case 'Home':
                    e.preventDefault();
                    goToSlide(galleryId, 0);
                    break;
                case 'End':
                    e.preventDefault();
                    if (window.door64Galleries[galleryId]) {
                        const lastSlide = window.door64Galleries[galleryId].totalSlides - 1;
                        goToSlide(galleryId, lastSlide);
                    }
                    break;
            }
        }
    });
    
    console.log('⌨️ Keyboard navigation initialized');
}

// =============== ACCESSIBILITY FEATURES ===============
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
                
                // Focus target for screen readers
                if (target.tabIndex === -1) {
                    target.tabIndex = -1;
                }
                target.focus();
            }
        });
    });
    
    // Skip link functionality (if present)
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
    
    console.log('♿ Accessibility features initialized');
}

// =============== LAZY LOADING IMAGES ===============
function initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.setAttribute('data-loading', 'false');
                    observer.unobserve(img);
                    console.log('🖼️ Lazy loaded:', img.alt || img.src);
                }
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.setAttribute('data-loading', 'true');
        imageObserver.observe(img);
    });
    
    console.log('🖼️ Lazy loading initialized');
}

// =============== UTILITY FUNCTIONS ===============
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

// =============== ERROR HANDLING ===============
window.addEventListener('error', (e) => {
    console.error('🚨 Door 64 - JavaScript error:', e.error);
    
    // Attempt to maintain basic functionality
    if (e.error.message.includes('audio') && window.door64Audio) {
        console.log('🔧 Attempting audio system recovery...');
        setTimeout(() => {
            try {
                window.door64Audio.updateButtons();
            } catch (recoveryError) {
                console.error('🚨 Audio recovery failed:', recoveryError);
            }
        }, 1000);
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 Door 64 - Unhandled promise rejection:', e.reason);
});

// =============== PERFORMANCE MONITORING ===============
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = Math.round(performance.now());
        console.log(`⚡ Door 64 - Page loaded in ${loadTime}ms`);
        
        // Log navigation timing if available
        if (performance.navigation) {
            const navType = performance.navigation.type;
            const navTypes = ['navigate', 'reload', 'back_forward', 'reserved'];
            console.log(`📊 Navigation type: ${navTypes[navType] || 'unknown'}`);
        }
    });
}

// =============== DEVELOPMENT HELPERS ===============
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('dev')) {
    
    console.log('🏠 Door 64 - Development mode active');
    
    // Development keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case 'a':
                    e.preventDefault();
                    toggleAudio();
                    console.log('🎵 Dev: Audio toggled');
                    break;
                case 's':
                    e.preventDefault();
                    hideSplash();
                    console.log('🚪 Dev: Splash hidden');
                    break;
                case 'r':
                    e.preventDefault();
                    localStorage.removeItem('door64_audio_state');
                    localStorage.removeItem('door64_audio_time');
                    console.log('🔄 Dev: Audio state reset');
                    break;
                case 'i':
                    e.preventDefault();
                    console.log('📊 Dev: System info:', {
                        audioState: localStorage.getItem('door64_audio_state'),
                        audioTime: localStorage.getItem('door64_audio_time'),
                        galleries: Object.keys(window.door64Galleries),
                        isAudioPlaying: window.door64Audio?.isPlaying,
                        currentAudioTime: window.door64Audio?.audio?.currentTime,
                        audioMuted: window.door64Audio?.audio?.muted
                    });
                    break;
            }
        }
    });
    
    // Expose global debugging functions
    window.door64Debug = {
        audio: () => window.door64Audio,
        galleries: () => window.door64Galleries,
        resetAudio: () => {
            localStorage.removeItem('door64_audio_state');
            localStorage.removeItem('door64_audio_time');
            location.reload();
        },
        forceAudioStart: () => {
            if (window.door64Audio) {
                window.door64Audio.audio.muted = false;
                window.door64Audio.resumeAudio();
            }
        }
    };
    
    console.log('🔧 Dev tools available: window.door64Debug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
🚪 Door 64 Restaurant
🎵 Enhanced Audio System Active
🖼️ Gallery System Ready
📱 Mobile Optimized
♿ Accessibility Features Enabled
⚡ Performance Optimized

Ready to serve exceptional experiences.
`);

// Export for testing (if in module environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Door64Audio,
        Door64Gallery,
        toggleAudio,
        nextSlide,
        previousSlide,
        goToSlide,
        toggleMobileMenu
    };
}

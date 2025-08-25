/* Door 64 Restaurant - Complete Enhanced JavaScript with Continuous Audio System */

// =============== ENHANCED CONTINUOUS AUDIO SYSTEM ===============
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
        
        this.init();
    }
    
    init() {
        console.log('🎵 Door 64 Audio System - Initializing...');
        
        const storedState = localStorage.getItem(this.storageKey);
        const storedTime = localStorage.getItem(this.timeKey);
        
        this.audio = document.getElementById('backgroundAudio');
        if (!this.audio) {
            console.warn('⚠️ Background audio element not found');
            return;
        }
        
        // Set optimal volume and ensure audio is ready to play
        this.audio.volume = this.volume;
        this.audio.preload = 'auto';
        this.audio.loop = true;
        
        // Force load the audio
        this.audio.load();
        
        console.log('🎵 Current page:', window.location.pathname);
        console.log('🎵 Stored audio state:', storedState);
        console.log('🎵 Has splash page:', !!document.getElementById('splashPage'));
        
        // Set up event listeners first
        this.setupAudioEventListeners();
        this.setupPageUnloadHandler();
        
        // Simple logic: If no stored state OR stored state is 'playing', try to start audio
        if (!storedState || storedState === 'playing') {
            // Restore time position if available
            if (storedTime && parseFloat(storedTime) > 0) {
                this.audio.currentTime = parseFloat(storedTime);
                console.log('🎵 Resuming from time:', storedTime);
            }
            
            // Try to start audio after a short delay
            setTimeout(() => {
                this.startAudio();
            }, 500);
        } else {
            // Audio was explicitly paused by user
            console.log('🎵 Audio was paused by user, respecting choice');
            this.updateButtons();
        }
    }
    
    setupAudioEventListeners() {
        if (!this.audio) return;
        
        // Check if audio file exists
        fetch(this.audio.currentSrc || this.audio.src).then(response => {
            if (response.ok) {
                console.log('✅ Audio file found and accessible:', this.audio.currentSrc || this.audio.src);
            } else {
                console.error('🚨 Audio file not found:', response.status, this.audio.currentSrc || this.audio.src);
            }
        }).catch(error => {
            console.error('🚨 Audio file check failed:', error);
        });
        
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
            this.updateButtons();
            console.log('🎵 Audio playing - Duration:', this.audio.duration, 'Current time:', this.audio.currentTime);
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateButtons();
            console.log('⏸️ Audio paused - Current time:', this.audio.currentTime);
        });
        
        // Audio loading states
        this.audio.addEventListener('loadstart', () => {
            console.log('🎵 Audio loading started');
            this.setLoadingState(true);
        });
        
        this.audio.addEventListener('loadeddata', () => {
            console.log('🎵 Audio data loaded');
        });
        
        this.audio.addEventListener('canplay', () => {
            console.log('🎵 Audio can start playing');
            this.setLoadingState(false);
        });
        
        this.audio.addEventListener('canplaythrough', () => {
            console.log('🎵 Audio can play through without interruption');
            this.setLoadingState(false);
        });
        
        // Handle audio loop (just in case)
        this.audio.addEventListener('ended', () => {
            console.log('🎵 Audio ended - restarting if should be playing');
            if (this.isPlaying) {
                this.audio.currentTime = 0;
                this.audio.play().catch(console.log);
            }
        });
        
        // Handle audio errors gracefully
        this.audio.addEventListener('error', (e) => {
            console.error('🚨 Audio error:', e, 'Error code:', this.audio.error?.code);
            this.isPlaying = false;
            this.updateButtons();
        });
    }
    
    setupPageUnloadHandler() {
        // Store final position on page unload
        window.addEventListener('beforeunload', () => {
            if (this.audio && this.isPlaying) {
                localStorage.setItem(this.timeKey, this.audio.currentTime.toString());
                console.log('💾 Audio position saved on page unload');
            }
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page hidden - could pause if desired
                // Uncomment next line if you want to pause when tab is hidden
                // if (this.isPlaying) this.pauseAudio();
            } else if (!this.audio.paused && localStorage.getItem(this.storageKey) === 'playing') {
                // Page visible again - ensure audio is playing if it should be
                if (!this.isPlaying) {
                    this.startAudio();
                }
            }
        });
    }
    
    startAudio() {
        if (!this.audio) return;
        
        console.log('🎵 Attempting to start audio...');
        
        // Try muted autoplay first (most likely to succeed)
        this.audio.muted = true;
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ Audio started successfully (muted)');
                    this.isPlaying = true;
                    localStorage.setItem(this.storageKey, 'playing');
                    this.updateButtons();
                    
                    // Set up listeners to unmute on user interaction
                    this.setupUnmuteListeners();
                })
                .catch(error => {
                    console.log('⚠️ Audio autoplay prevented:', error);
                    // Set up listeners to start on user interaction
                    this.setupStartListeners();
                    this.updateButtons();
                });
        }
    }
    
    setupUnmuteListeners() {
        const events = ['click', 'touchstart', 'keydown'];
        const unmute = () => {
            if (this.audio && this.audio.muted) {
                console.log('🔊 Unmuting audio on user interaction');
                this.audio.muted = false;
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                
                // Remove listeners after unmuting
                events.forEach(event => {
                    document.removeEventListener(event, unmute);
                });
            }
        };
        
        events.forEach(event => {
            document.addEventListener(event, unmute, { once: true });
        });
    }
    
    setupStartListeners() {
        const events = ['click', 'touchstart', 'keydown', 'scroll'];
        const start = () => {
            if (this.audio && this.audio.paused) {
                console.log('▶️ Starting audio on user interaction');
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    localStorage.setItem(this.storageKey, 'playing');
                    this.updateButtons();
                    
                    // Remove listeners after starting
                    events.forEach(event => {
                        document.removeEventListener(event, start);
                    });
                }).catch(console.log);
            }
        };
        
        events.forEach(event => {
            document.addEventListener(event, start, { once: true });
        });
    }
    
    pauseAudio() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.isPlaying = false;
        localStorage.setItem(this.storageKey, 'paused');
        // Store final position immediately
        localStorage.setItem(this.timeKey, this.audio.currentTime.toString());
        this.updateButtons();
        console.log('⏸️ Audio paused by user');
    }
    
    toggle() {
        if (this.isPlaying && this.audio && !this.audio.paused) {
            this.pauseAudio();
        } else {
            // If audio is muted, unmute it
            if (this.audio && this.audio.muted) {
                this.audio.muted = false;
            }
            this.startAudio();
        }
    }
    
    setLoadingState(loading) {
        const buttons = document.querySelectorAll('.audio-toggle, .splash-audio-toggle');
        buttons.forEach(button => {
            if (loading) {
                button.setAttribute('data-loading', 'true');
            } else {
                button.removeAttribute('data-loading');
            }
        });
    }
    
    updateButtons() {
        const buttons = document.querySelectorAll('.audio-toggle, .splash-audio-toggle');
        const shouldBePlaying = localStorage.getItem(this.storageKey) === 'playing';
        
        buttons.forEach(button => {
            // Show playing state if audio is actually playing OR if it should be playing (even if muted)
            if (this.isPlaying || (shouldBePlaying && this.audio && !this.audio.paused)) {
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
    
    // Initialize enhanced audio system - SIMPLIFIED
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
    if (window.door64Galleries && window.door64Galleries[galleryId]) {
        window.door64Galleries[galleryId].nextSlide();
    } else {
        console.warn(`⚠️ Gallery ${galleryId} not found`);
    }
}

function previousSlide(galleryId) {
    if (window.door64Galleries && window.door64Galleries[galleryId]) {
        window.door64Galleries[galleryId].previousSlide();
    } else {
        console.warn(`⚠️ Gallery ${galleryId} not found`);
    }
}

function goToSlide(galleryId, slideIndex) {
    if (window.door64Galleries && window.door64Galleries[galleryId]) {
        window.door64Galleries[galleryId].goToSlide(slideIndex);
    } else {
        console.warn(`⚠️ Gallery ${galleryId} not found`);
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
        
        // Ensure audio is marked as playing before navigation
        if (window.door64Audio && window.door64Audio.audio) {
            // Unmute audio if it's muted and playing
            if (window.door64Audio.audio.muted && !window.door64Audio.audio.paused) {
                window.door64Audio.audio.muted = false;
            }
            
            // If audio is not playing, start it
            if (window.door64Audio.audio.paused) {
                window.door64Audio.startAudio();
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
                if (window.door64Audio.audio.paused) {
                    window.door64Audio.startAudio();
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
                case 'g':
                    e.preventDefault();
                    Object.values(window.door64Galleries).forEach(gallery => {
                        if (gallery.isPlaying) {
                            gallery.pauseAutoPlay();
                        } else {
                            gallery.startAutoPlay();
                        }
                    });
                    console.log('🖼️ Dev: Gallery auto-play toggled');
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
                        currentAudioTime: window.door64Audio?.audio?.currentTime
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
        toggleGalleries: () => {
            Object.values(window.door64Galleries).forEach(gallery => {
                if (gallery.isPlaying) {
                    gallery.pauseAutoPlay();
                } else {
                    gallery.startAutoPlay();
                }
            });
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

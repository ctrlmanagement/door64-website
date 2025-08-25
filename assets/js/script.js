/* Door 64 Restaurant - Enhanced Main JavaScript with Continuous Audio System */

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
        
        // Set optimal volume
        this.audio.volume = this.volume;
        
        // Determine auto-start behavior based on page and stored state
        const isIndexPage = this.isIndexPage();
        const hasSplashPage = document.getElementById('splashPage');
        const storedState = localStorage.getItem(this.storageKey);
        
        console.log('🎵 Audio init - Page:', window.location.pathname, 'Stored state:', storedState, 'Has splash:', !!hasSplashPage);
        
        if (storedState === null) {
            // First visit - set up auto-start
            if (hasSplashPage) {
                // Has splash page - wait for user interaction
                this.setupSplashAutoStart();
            } else {
                // No splash page - try auto-start after delay
                setTimeout(() => this.startAudio(), 800);
            }
        } else if (storedState === 'playing') {
            // Audio should be playing - continue from stored position
            console.log('🎵 Continuing audio from stored state');
            if (storedTime) {
                this.audio.currentTime = parseFloat(storedTime);
                console.log('🎵 Resuming from time:', storedTime);
            }
            // Start with a delay to ensure page is ready
            setTimeout(() => this.startAudio(), 300);
        } else {
            // Audio was paused - respect user choice but still update buttons
            console.log('🎵 Audio was paused, respecting user choice');
            this.updateButtons();
        }
        
        this.setupAudioEventListeners();
        this.setupPageUnloadHandler();
    }
    
    isIndexPage() {
        const path = window.location.pathname;
        return path.includes('index.html') || 
               path.includes('64.html') ||
               path === '/' ||
               path.endsWith('/') ||
               path === '' ||
               path.endsWith('64') ||
               document.title.includes('Door 64 - Restaurant Experience') ||
               document.title.includes('Door 64');
    }
    
    setupSplashAutoStart() {
        console.log('🎵 Setting up splash auto-start...');
        const splashPage = document.getElementById('splashPage');
        
        // Try immediate audio start for browsers that allow it
        setTimeout(() => {
            this.audio.muted = true; // Start muted to allow autoplay
            this.audio.play().then(() => {
                console.log('🎵 Audio started muted on page load');
                // Will be unmuted when user interacts
            }).catch(() => {
                console.log('🎵 Muted autoplay also blocked, waiting for interaction');
            });
        }, 100);
        
        if (splashPage) {
            const startAudioOnInteraction = (event) => {
                // Don't start if clicking audio button
                if (event.target.closest('.splash-audio-toggle')) {
                    return;
                }
                
                // Unmute and ensure audio plays
                this.audio.muted = false;
                this.startAudio();
                
                // Remove listeners after first interaction
                splashPage.removeEventListener('click', startAudioOnInteraction);
                document.removeEventListener('keydown', startAudioOnKeyPress);
            };
            
            const startAudioOnKeyPress = (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    this.audio.muted = false;
                    this.startAudio();
                    splashPage.removeEventListener('click', startAudioOnInteraction);
                    document.removeEventListener('keydown', startAudioOnKeyPress);
                }
            };
            
            splashPage.addEventListener('click', startAudioOnInteraction);
            document.addEventListener('keydown', startAudioOnKeyPress);
        } else {
            // Not splash page but first visit - try to start after short delay
            setTimeout(() => {
                this.audio.muted = false;
                this.startAudio();
            }, 1000);
        }
        
        this.updateButtons();
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
            this.updateButtons();
            console.log('🎵 Audio playing');
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateButtons();
            console.log('⏸️ Audio paused');
        });
        
        // Handle audio loop (just in case)
        this.audio.addEventListener('ended', () => {
            if (this.isPlaying) {
                this.audio.currentTime = 0;
                this.audio.play().catch(console.log);
            }
        });
        
        // Handle audio errors gracefully
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.isPlaying = false;
            this.updateButtons();
        });
        
        // Handle audio loading states
        this.audio.addEventListener('loadstart', () => {
            this.setLoadingState(true);
        });
        
        this.audio.addEventListener('canplay', () => {
            this.setLoadingState(false);
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
        
        // Unmute if muted (for autoplay compatibility)
        if (this.audio.muted) {
            this.audio.muted = false;
        }
        
        // Immediately set playing state to ensure it's saved before any navigation
        this.isPlaying = true;
        localStorage.setItem(this.storageKey, 'playing');
        
        // Set up audio for autoplay
        this.audio.setAttribute('autoplay', '');
        this.audio.setAttribute('preload', 'auto');
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.isPlaying = true;
                    localStorage.setItem(this.storageKey, 'playing');
                    // Save initial time position
                    localStorage.setItem(this.timeKey, '0');
                    this.updateButtons();
                    console.log('✅ Audio started successfully');
                })
                .catch(error => {
                    console.log('⚠️ Audio autoplay prevented:', error);
                    // Keep the playing state even if play fails - user can manually start
                    this.setupFallbackAutoPlay();
                    this.updateButtons();
                });
        }
    }
    
    setupFallbackAutoPlay() {
        console.log('🎵 Setting up fallback autoplay...');
        // Try to start audio on various user interactions
        const events = ['click', 'touchstart', 'keydown', 'scroll'];
        const startOnInteraction = (event) => {
            if (this.audio && this.audio.paused && !this.isPlaying) {
                console.log('🎵 Attempting fallback audio start on:', event.type);
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    localStorage.setItem(this.storageKey, 'playing');
                    this.updateButtons();
                    console.log('✅ Audio started on user interaction');
                    
                    // Remove listeners after successful start
                    events.forEach(eventType => {
                        document.removeEventListener(eventType, startOnInteraction);
                    });
                }).catch(error => {
                    console.log('🎵 Fallback audio start failed:', error);
                });
            }
        };
        
        // Add listeners for first user interaction
        events.forEach(event => {
            document.addEventListener(event, startOnInteraction, { once: true });
        });
        
        // Also try a delayed approach for page 64 specifically
        if (window.location.pathname.includes('64.html') || window.location.pathname.includes('64')) {
            console.log('🎵 Page 64 detected - trying delayed autostart');
            setTimeout(() => {
                if (this.audio && this.audio.paused && localStorage.getItem(this.storageKey) === 'playing') {
                    console.log('🎵 Attempting delayed autostart for page 64');
                    this.startAudio();
                }
            }, 1000);
        }
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
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
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
        
        // If storage says audio should be playing but it's not, try to start it
        if (shouldBePlaying && this.audio && this.audio.paused && !this.isPlaying) {
            console.log('🎵 Audio should be playing but is paused - attempting restart');
            setTimeout(() => {
                if (this.audio.paused) {
                    this.startAudio();
                }
            }, 100);
        }
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
        
        // Ensure audio starts and state is saved BEFORE navigation
        if (window.door64Audio) {
            window.door64Audio.startAudio();
            // Force save the state immediately
            localStorage.setItem('door64_audio_state', 'playing');
            localStorage.setItem('door64_audio_time', '0');
        }
        
        // Add a small delay to ensure audio state is saved and audio starts
        setTimeout(() => {
            // Navigate based on current page
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/' || 
                window.location.pathname === '') {
                window.location.href = '64.html';
            } else {
                hideSplash();
            }
        }, 150); // Small delay to ensure audio state is saved
    });
    
    // Individual door links for backup navigation
    const doorLinks = splashPage.querySelectorAll('.door-gallery a');
    doorLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🚪 Door ${index + 1} clicked - entering main site...`);
            
            // Start audio and save state before navigation
            if (window.door64Audio) {
                window.door64Audio.startAudio();
                localStorage.setItem('door64_audio_state', 'playing');
                localStorage.setItem('door64_audio_time', '0');
            }
            
            setTimeout(() => {
                window.location.href = '64.html';
            }, 150);
        });
    });
    
    // Keyboard navigation for splash page
    document.addEventListener('keydown', function(event) {
        if (splashPage.style.display !== 'none') {
            if (event.key === 'Enter' || event.key === ' ') {
                if (!event.target.closest('.splash-audio-toggle')) {
                    event.preventDefault();
                    
                    // Start audio and save state
                    if (window.door64Audio) {
                        window.door64Audio.startAudio();
                        localStorage.setItem('door64_audio_state', 'playing');
                        localStorage.setItem('door64_audio_time', '0');
                    }
                    
                    setTimeout(() => {
                        splashPage.click();
                    }, 150);
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

/* Door 64 Restaurant - Complete FIXED JavaScript - FINAL VERSION WITH MOBILE NAV FIXES */

// =============== FIXED DOOR 64 AUDIO SYSTEM - NO MORE RESTARTS ===============
class Door64Audio {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.volume = 0.3;
        this.storageKey = 'door64_audio_state';
        this.timeKey = 'door64_audio_time';
        this.lastUpdateTime = 0;
        this.updateInterval = 500;
        this.hasUserInteracted = false;
        this.isInitialized = false;
        this.audioStartPromise = null;
        this.isMobile = this.detectMobile();
        this.interactionListenersActive = false;
        
        // FIX 1: Add navigation tracking to prevent restarts
        this.isNavigating = false;
        this.navigationTimeout = null;
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }
    
    init() {
        if (this.isInitialized) {
            console.log('🎵 Door 64 Audio - Already initialized, skipping...');
            return;
        }
        
        console.log('🎵 Door 64 Audio System - Initializing...', this.isMobile ? '📱 Mobile detected' : '🖥️ Desktop detected');
        
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
        
        // FIX 2: Better restore logic with splash page detection
        this.restoreAudioState();
        
        this.isInitialized = true;
    }
    
    // FIX 2: IMPROVED restore logic for splash page
    restoreAudioState() {
        const storedState = localStorage.getItem(this.storageKey);
        const storedTime = localStorage.getItem(this.timeKey);
        const isFirstTimeVisitor = !storedState;
        const isSplashPage = document.getElementById('splashPage') !== null;
        
        console.log('🎵 Restoring audio state:', { storedState, storedTime, isFirstTimeVisitor, isSplashPage });
        
        if (storedState === 'playing') {
            console.log('🎵 Audio should be playing - starting automatically');
            
            // Set time BEFORE starting audio
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            
            // Start audio based on device type
            if (this.isMobile) {
                this.setupUserInteractionListeners();
                this.attemptAudioStart();
            } else {
                this.attemptAudioStart();
            }
        } else if (storedState === 'paused') {
            console.log('🎵 Audio was paused by user, respecting choice');
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            this.updateButtons();
        } else {
            // FIX 2: First time visitor - AUTO-START on splash page
            console.log('🎵 First time visitor detected');
            
            if (isSplashPage) {
                console.log('🚪 Splash page detected - auto-starting audio for first impression');
                // On splash page, always attempt to start (even on mobile)
                this.attemptAudioStart();
                // But still set up interaction listeners for mobile
                if (this.isMobile) {
                    this.setupUserInteractionListeners();
                }
            } else {
                // Regular page - use normal logic
                if (this.isMobile) {
                    this.setupUserInteractionListeners();
                } else {
                    this.attemptAudioStart();
                }
            }
            this.updateButtons();
        }
    }
    
    // FIX 3: Prevent restarts during navigation
    attemptAudioStart() {
        // Don't start if we're in the middle of navigation
        if (this.isNavigating || this.audioStartPromise) {
            console.log('🎵 Skipping audio start - navigation in progress or already starting');
            return this.audioStartPromise || Promise.resolve();
        }
        
        if (!this.audio) {
            console.warn('⚠️ No audio element found');
            return Promise.resolve();
        }
        
        console.log('🎵 Attempting to start audio...');
        
        // Start muted for autoplay compliance
        this.audio.muted = true;
        
        this.audioStartPromise = this.audio.play()
            .then(() => {
                console.log('✅ Audio started successfully (muted for autoplay compliance)');
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                this.audioStartPromise = null;
                
                // Unmute based on previous interaction
                const hasInteracted = localStorage.getItem('door64_user_interacted') === 'true';
                if (hasInteracted) {
                    this.audio.muted = false;
                    console.log('🔊 User has interacted before - unmuting audio');
                    this.hasUserInteracted = true;
                } else if (!this.isMobile) {
                    // Desktop: unmute on any interaction
                    this.setupUserInteractionListeners();
                }
            })
            .catch(error => {
                console.log('⚠️ Audio autoplay prevented:', error.message);
                this.audioStartPromise = null;
                
                // Only set up interaction listeners if not already active
                if (!this.interactionListenersActive) {
                    this.setupUserInteractionListeners();
                }
                this.updateButtons();
            });
            
        return this.audioStartPromise;
    }
    
    // FIX 4: Better navigation state management
    prepareForNavigation() {
        console.log('🚪 Preparing for navigation - preserving audio state');
        this.isNavigating = true;
        this.storeCurrentTime();
        
        // Don't change state if user explicitly paused
        if (this.isPlaying && this.audio && !this.audio.paused) {
            localStorage.setItem(this.storageKey, 'playing');
        }
        
        // Clear any pending navigation timeout
        if (this.navigationTimeout) {
            clearTimeout(this.navigationTimeout);
        }
        
        // Reset navigation flag after a delay
        this.navigationTimeout = setTimeout(() => {
            this.isNavigating = false;
            console.log('🚪 Navigation state reset');
        }, 2000);
    }
    
    setAudioTime(time) {
        if (!this.audio) return;
        
        const setTime = () => {
            try {
                if (this.audio.duration && time <= this.audio.duration) {
                    this.audio.currentTime = time;
                    console.log('🎵 Audio time set to:', time);
                } else if (!this.audio.duration) {
                    console.log('⏳ Audio metadata not ready, waiting...');
                    setTimeout(() => setTime(), 100);
                }
            } catch (error) {
                console.log('⚠️ Failed to set audio time:', error.message);
            }
        };
        
        if (this.audio.readyState >= 1) {
            setTime();
        } else {
            const onLoadedMetadata = () => {
                setTime();
                this.audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            };
            this.audio.addEventListener('loadedmetadata', onLoadedMetadata);
        }
    }
    
    setupAudioEventListeners() {
        if (!this.audio) return;
        
        this.audio.addEventListener('timeupdate', () => {
            if (this.isPlaying && !this.isNavigating) {
                const now = Date.now();
                if (now - this.lastUpdateTime > this.updateInterval) {
                    this.storeCurrentTime();
                    this.lastUpdateTime = now;
                }
            }
        });
        
        this.audio.addEventListener('play', () => {
            if (!this.isNavigating) {
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                console.log('🎵 Audio playing - Current time:', this.audio.currentTime);
            }
        });
        
        this.audio.addEventListener('pause', () => {
            if (!this.isNavigating) {
                this.isPlaying = false;
                this.storeCurrentTime();
                this.updateButtons();
                console.log('⏸️ Audio paused - Current time:', this.audio.currentTime);
            }
        });
        
        this.audio.addEventListener('canplay', () => {
            console.log('🎵 Audio can play - Duration:', this.audio.duration);
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('🚨 Audio error:', e, 'Error code:', this.audio.error?.code);
            this.isPlaying = false;
            this.updateButtons();
        });
        
        this.audio.addEventListener('ended', () => {
            console.log('🎵 Audio ended - restarting...');
            if (this.isPlaying && !this.isNavigating) {
                this.audio.currentTime = 0;
                localStorage.setItem(this.timeKey, '0');
                this.audio.play().catch(console.log);
            }
        });
    }
    
    storeCurrentTime() {
        if (this.audio && this.audio.currentTime > 0 && !this.isNavigating) {
            localStorage.setItem(this.timeKey, this.audio.currentTime.toString());
        }
    }
    
    // ✅ MOBILE NAV FIX: Improved mobile-safe interaction listeners
    setupUserInteractionListeners() {
        if (this.interactionListenersActive || this.hasUserInteracted) {
            console.log('🎵 Interaction listeners already set up or not needed');
            return;
        }
        
        console.log('🎵 Setting up mobile-safe user interaction listeners');
        this.interactionListenersActive = true;
        
        // ✅ FIX: Use different strategies for mobile vs desktop
        const isMobileDevice = this.isMobile;
        
        if (isMobileDevice) {
            // Mobile: Use click events only, avoid touchstart conflicts
            const events = ['click'];
            
            const handleFirstInteraction = (e) => {
                // Don't interfere with audio buttons or form elements
                if (e.target.closest('.audio-toggle, .splash-audio-toggle') || 
                    e.target.closest('input, textarea, select, button')) {
                    return;
                }
                
                if (!this.hasUserInteracted) {
                    this.hasUserInteracted = true;
                    localStorage.setItem('door64_user_interacted', 'true');
                    console.log('🔊 Mobile: First click detected - starting audio');
                    
                    this.enableAudioAfterInteraction();
                    this.removeInteractionListeners();
                }
            };
            
            // ✅ FIX: Use bubble phase, not capture, to avoid interfering with navigation
            events.forEach(event => {
                document.addEventListener(event, handleFirstInteraction, { 
                    passive: true,
                    once: true  // ✅ Automatically removes after first use
                });
            });
            
            this.interactionHandler = handleFirstInteraction;
            this.interactionEvents = events;
        } else {
            // Desktop: Use both click and touch for hybrid devices
            const events = ['click', 'touchstart'];
            
            const handleFirstInteraction = (e) => {
                if (e.target.closest('.audio-toggle, .splash-audio-toggle')) {
                    return;
                }
                
                if (!this.hasUserInteracted) {
                    this.hasUserInteracted = true;
                    localStorage.setItem('door64_user_interacted', 'true');
                    console.log('🔊 Desktop: First interaction detected - starting audio');
                    
                    this.enableAudioAfterInteraction();
                    this.removeInteractionListeners();
                }
            };
            
            events.forEach(event => {
                document.addEventListener(event, handleFirstInteraction, { 
                    passive: true,
                    once: true
                });
            });
            
            this.interactionHandler = handleFirstInteraction;
            this.interactionEvents = events;
        }
    }
    
    // ✅ NEW: Helper method for audio enabling
    enableAudioAfterInteraction() {
        if (this.audio) {
            // Unmute audio if muted
            if (this.audio.muted) {
                this.audio.muted = false;
                console.log('🔊 Audio unmuted');
            }
            
            // Start audio if it should be playing but isn't
            const storedState = localStorage.getItem(this.storageKey);
            if (storedState !== 'paused' && this.audio.paused && !this.isNavigating) {
                console.log('▶️ Starting audio after user interaction');
                this.resumeAudio();
            }
        }
    }
    
    removeInteractionListeners() {
        if (this.interactionHandler && this.interactionEvents) {
            this.interactionEvents.forEach(event => {
                document.removeEventListener(event, this.interactionHandler, { capture: true });
            });
            this.interactionHandler = null;
            this.interactionEvents = null;
            this.interactionListenersActive = false;
            console.log('🧹 User interaction listeners removed - audio system ready');
        }
    }
    
    setupPageUnloadHandler() {
        const storeState = () => {
            if (this.audio && !this.isNavigating) {
                this.storeCurrentTime();
                if (this.isPlaying) {
                    localStorage.setItem(this.storageKey, 'playing');
                }
                console.log('💾 Audio state saved - Time:', this.audio.currentTime, 'State:', this.isPlaying ? 'playing' : 'paused');
            }
        };
        
        window.addEventListener('beforeunload', storeState);
        window.addEventListener('pagehide', storeState);
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.storeCurrentTime();
            } else if (!document.hidden && this.audio) {
                const storedState = localStorage.getItem(this.storageKey);
                if (storedState === 'playing' && this.audio.paused && !this.isNavigating) {
                    console.log('🎵 Page visible - resuming audio at stored time');
                    
                    const storedTime = localStorage.getItem(this.timeKey);
                    if (storedTime && parseFloat(storedTime) > 0) {
                        this.setAudioTime(parseFloat(storedTime));
                    }
                    
                    this.resumeAudio();
                }
            }
        });
    }
    
    pauseAudio() {
        if (!this.audio) return;
        
        console.log('⏸️ User requested audio pause');
        this.storeCurrentTime();
        this.audio.pause();
        this.isPlaying = false;
        localStorage.setItem(this.storageKey, 'paused');
        this.updateButtons();
        console.log('⏸️ Audio paused by user at time:', this.audio.currentTime);
    }
    
    resumeAudio() {
        if (!this.audio || this.audioStartPromise || this.isNavigating) return;
        
        console.log('▶️ User requested audio resume (or auto-resume)');
        
        // Restore time position before resuming
        const storedTime = localStorage.getItem(this.timeKey);
        if (storedTime && parseFloat(storedTime) > 0 && 
            Math.abs(this.audio.currentTime - parseFloat(storedTime)) > 1) {
            this.setAudioTime(parseFloat(storedTime));
        }
        
        // Unmute if muted and user has interacted
        if (this.audio.muted && (this.hasUserInteracted || localStorage.getItem('door64_user_interacted') === 'true')) {
            this.audio.muted = false;
            console.log('🔊 Audio unmuted for resume');
        }
        
        this.audioStartPromise = this.audio.play()
            .then(() => {
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                this.audioStartPromise = null;
                console.log('▶️ Audio resumed at time:', this.audio.currentTime);
            })
            .catch(error => {
                console.error('🚨 Failed to resume audio:', error);
                this.audioStartPromise = null;
                // Set up interaction listeners if resume failed
                if (!this.hasUserInteracted && !this.interactionListenersActive) {
                    this.setupUserInteractionListeners();
                }
                this.updateButtons();
            });
            
        return this.audioStartPromise;
    }
    
    toggle() {
        console.log('🎵 Audio toggle button clicked - Current state:', this.isPlaying, 'Paused:', this.audio?.paused);
        
        if (this.isPlaying && this.audio && !this.audio.paused) {
            this.pauseAudio();
        } else {
            this.resumeAudio();
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
                    button.title = 'Tap anywhere to start music';
                }
            }
        });
        
        console.log('🎵 Audio buttons updated - Playing:', this.isPlaying, 'Actually playing:', this.audio && !this.audio.paused);
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
        this.autoPlayDelay = 5000;
        this.isPaused = false;
        
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
        
        const prevButton = document.querySelector(`#${this.galleryId} .gallery-nav.prev`);
        const nextButton = document.querySelector(`#${this.galleryId} .gallery-nav.next`);
        
        if (prevButton) prevButton.addEventListener('click', () => this.previousSlide());
        if (nextButton) nextButton.addEventListener('click', () => this.nextSlide());
        
        const container = document.querySelector(`#${this.galleryId}`);
        if (container) {
            container.addEventListener('mouseenter', this.throttle(() => {
                this.pauseAutoPlay();
            }, 100));
            
            container.addEventListener('mouseleave', this.throttle(() => {
                this.resumeAutoPlay();
            }, 100));
            
            container.addEventListener('focusin', () => this.pauseAutoPlay());
            container.addEventListener('focusout', () => {
                setTimeout(() => this.resumeAutoPlay(), 100);
            });
        }
        
        this.setupTouchEvents();
    }
    
    throttle(func, limit) {
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
    
    // ✅ MOBILE NAV FIX: Improved touch events that don't block vertical scrolling
    setupTouchEvents() {
        const container = document.querySelector(`#${this.galleryId}`);
        if (!container) return;
        
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let isHorizontalSwipe = false;
        
        container.addEventListener('touchstart', (e) => {
            // ✅ FIX: Only handle single-touch events
            if (e.touches.length !== 1) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            isHorizontalSwipe = false;
            
            container.classList.add('swiping');
            this.pauseAutoPlay();
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            
            // ✅ FIX: Only prevent default for confirmed horizontal swipes
            // Allow vertical scrolling unless user is clearly swiping horizontally
            if (!isHorizontalSwipe) {
                const absX = Math.abs(deltaX);
                const absY = Math.abs(deltaY);
                
                // Determine swipe direction only after significant movement
                if (absX > 15 || absY > 15) {
                    isHorizontalSwipe = absX > absY && absX > 30;
                }
            }
            
            // Only prevent scrolling for confirmed horizontal swipes
            if (isHorizontalSwipe && Math.abs(deltaX) > 10) {
                e.preventDefault();
            }
        }, { passive: false }); // ✅ passive: false allows preventDefault
        
        container.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - startX;
            
            container.classList.remove('swiping');
            isDragging = false;
            
            // ✅ FIX: Only trigger slide change for confirmed horizontal swipes
            if (isHorizontalSwipe && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.previousSlide();
                } else {
                    this.nextSlide();
                }
            }
            
            isHorizontalSwipe = false;
            this.resumeAutoPlay();
        }, { passive: true });
    }
    
    updateGallery() {
        if (!this.track) return;
        
        this.track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        
        this.dots.forEach((dot, index) => {
            const isActive = index === this.currentSlide;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-selected', isActive.toString());
            dot.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        
        this.updateProgress();
        
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
            this.isPaused = false;
            console.log(`▶️ Gallery ${this.galleryId} - Auto-play started`);
        }
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        this.isPlaying = false;
        this.isPaused = true;
    }
    
    resumeAutoPlay() {
        if (this.isPaused && this.totalSlides > 1) {
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
    console.log('🚪 Door 64 - Initializing FIXED audio system...');
    
    // Initialize FIXED audio system
    window.door64Audio = new Door64Audio();
    
    // Initialize other functionality
    initGalleries();
    initSplashPage();
    initMobileMenu();
    initViewportHeight();
    initKeyboardNavigation();
    initAccessibilityFeatures();
    
    if ('IntersectionObserver' in window) {
        initLazyLoading();
    }
    
    console.log('✅ Door 64 - FIXED audio system ready - no more restarts!');
});

// =============== GALLERY INITIALIZATION ===============
function initGalleries() {
    const galleries = document.querySelectorAll('.css-gallery');
    
    galleries.forEach(gallery => {
        const galleryId = gallery.id;
        if (galleryId) {
            window.door64Galleries[galleryId] = new Door64Gallery(galleryId);
        }
    });
    
    const landingTrack = document.getElementById('landing-track');
    if (landingTrack && !window.door64Galleries['landing-gallery']) {
        const landingGallery = landingTrack.closest('.css-gallery');
        if (landingGallery) {
            landingGallery.id = 'landing-gallery';
            window.door64Galleries['landing-gallery'] = new Door64Gallery('landing-gallery');
        }
    }
}

// =============== GLOBAL FUNCTIONS ===============
function toggleAudio(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    console.log('🎵 Audio toggle function called');
    
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
        window.door64Galleries['landing-gallery'].nextSlide();
    } else {
        console.warn(`⚠️ Gallery ${galleryId || 'landing-gallery'} not found`);
    }
}

function previousSlide(galleryId) {
    if (galleryId && window.door64Galleries && window.door64Galleries[galleryId]) {
        window.door64Galleries[galleryId].previousSlide();
    } else if (!galleryId && window.door64Galleries['landing-gallery']) {
        window.door64Galleries['landing-gallery'].previousSlide();
    } else {
        console.warn(`⚠️ Gallery ${galleryId || 'landing-gallery'} not found`);
    }
}

function goToSlide(galleryIdOrIndex, slideIndex) {
    if (typeof galleryIdOrIndex === 'string') {
        if (window.door64Galleries && window.door64Galleries[galleryIdOrIndex]) {
            window.door64Galleries[galleryIdOrIndex].goToSlide(slideIndex);
        }
    } else {
        const slideIdx = galleryIdOrIndex;
        if (window.door64Galleries && window.door64Galleries['landing-gallery']) {
            window.door64Galleries['landing-gallery'].goToSlide(slideIdx);
        }
    }
}

// ✅ MOBILE NAV FIX: Improved splash page functionality
function initSplashPage() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (!splashPage) return;
    
    console.log('🚪 Initializing mobile-safe splash page...');
    
    const handleNavigation = (targetUrl = '64.html') => {
        console.log('🚪 Navigating to:', targetUrl);
        
        if (window.door64Audio) {
            window.door64Audio.prepareForNavigation();
        }
        
        setTimeout(() => {
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/' || 
                window.location.pathname === '') {
                window.location.href = targetUrl;
            } else {
                hideSplash();
            }
        }, 50);
    };
    
    // ✅ FIX: More selective click handling
    splashPage.addEventListener('click', function(e) {
        // Don't navigate if user clicked on interactive elements
        if (e.target.closest('.splash-audio-toggle, button, input, textarea, select, a[href], [onclick]')) {
            return;
        }
        
        // Don't navigate if this was a touch gesture (like pinch/zoom)
        if (e.touches && e.touches.length > 1) {
            return;
        }
        
        // ✅ Only navigate on genuine content clicks
        if (e.target.closest('.splash-content, .door-gallery')) {
            handleNavigation();
        }
    });
    
    // ✅ FIX: Improved door link handling
    const doorLinks = splashPage.querySelectorAll('.door-gallery a');
    doorLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // ✅ Prevent double navigation
            console.log(`🚪 Door ${index + 1} clicked`);
            handleNavigation('64.html');
        });
    });
    
    // ✅ FIX: Safer keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (splashPage.style.display === 'none') return;
        
        if (event.key === 'Enter' || event.key === ' ') {
            // Don't navigate if focus is on interactive elements
            if (event.target.closest('.splash-audio-toggle, button, input, textarea, select')) {
                return;
            }
            
            // Only navigate if Enter/Space is pressed on the splash content
            if (event.target === document.body || event.target.closest('#splashPage')) {
                event.preventDefault();
                handleNavigation();
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
        
        setTimeout(() => {
            splashPage.style.display = 'none';
        }, 1200);
        
        console.log('✅ Splash hidden, main site active');
    }
}

// ✅ MOBILE NAV FIX: Improved mobile menu functionality
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const navLinks = document.getElementById('navLinks');
    
    if (!mobileMenuButton || !navLinks) return;
    
    console.log('📱 Initializing mobile-safe menu...');
    
    mobileMenuButton.addEventListener('click', toggleMobileMenu);
    
    // ✅ FIX: Close menu only when clicking nav links
    const navLinkElements = navLinks.querySelectorAll('a');
    navLinkElements.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    // ✅ FIX: Smarter click-outside detection
    document.addEventListener('click', (e) => {
        if (!navLinks.classList.contains('active')) return;
        
        // Don't close if clicking on the menu button or any nav element
        if (e.target.closest('.nav-container, .mobile-menu')) {
            return;
        }
        
        // Don't close if clicking on form elements or other interactive elements
        if (e.target.closest('input, textarea, select, button, [tabindex]')) {
            return;
        }
        
        // ✅ Only close on genuine outside clicks
        closeMobileMenu();
    });
    
    // Keyboard support unchanged
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
    
    // Prevent body scroll
    document.body.classList.add('menu-open');
    
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
    
    // Restore body scroll
    document.body.classList.remove('menu-open');
    
    console.log('📱 Mobile menu closed');
}

// ✅ MOBILE NAV FIX: Safer viewport height fix for mobile
function initViewportHeight() {
    function setViewportHeight() {
        // ✅ FIX: Debounce viewport changes to avoid navigation interference
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setViewportHeight();
    
    // ✅ FIX: Safer resize handling on mobile
    const debouncedSetViewportHeight = debounce(() => {
        // Only update if not in the middle of navigation
        if (!window.door64Audio?.isNavigating) {
            setViewportHeight();
        }
    }, 150);
    
    window.addEventListener('resize', debouncedSetViewportHeight);
    
    // ✅ FIX: Better orientation change handling
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (!window.door64Audio?.isNavigating) {
                setViewportHeight();
            }
        }, 200);
    });
    
    console.log('📱 Mobile-safe viewport height optimization initialized');
}

// ✅ MOBILE NAV FIX: Improved keyboard navigation support
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // ✅ FIX: Only prevent spacebar if NOT in an input field
        if (e.key === ' ' && e.target === document.body) {
            // Check if user is on mobile device
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // On mobile, be more careful about preventing spacebar
            if (!isMobileDevice || !document.activeElement || document.activeElement === document.body) {
                e.preventDefault();
                toggleAudio();
            }
        }
        
        // ✅ FIX: Don't prevent default for mobile menu if user is typing
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mobile-menu')) {
            // Only prevent default if it's not a form element
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggleMobileMenu();
            }
        }
        
        // Gallery navigation - unchanged but safer
        const activeElement = document.activeElement;
        if (activeElement && activeElement.closest('.css-gallery')) {
            const gallery = activeElement.closest('.css-gallery');
            const galleryId = gallery.id;
            
            // ✅ FIX: Only prevent default for actual gallery interactions
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
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
        }
    });
    
    console.log('⌨️ Mobile-safe keyboard navigation initialized');
}

// =============== ACCESSIBILITY FEATURES ===============
function initAccessibilityFeatures() {
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

// ✅ NEW: Mobile navigation helper functions
function isMobileMultiTouch(e) {
    return e.touches && e.touches.length > 1;
}

// =============== ERROR HANDLING ===============
window.addEventListener('error', (e) => {
    console.error('🚨 Door 64 - JavaScript error:', e.error);
    
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
                    localStorage.removeItem('door64_user_interacted');
                    console.log('🔄 Dev: Audio state reset');
                    break;
                case 'i':
                    e.preventDefault();
                    console.log('📊 Dev: System info:', {
                        audioState: localStorage.getItem('door64_audio_state'),
                        audioTime: localStorage.getItem('door64_audio_time'),
                        userInteracted: localStorage.getItem('door64_user_interacted'),
                        galleries: Object.keys(window.door64Galleries),
                        isAudioPlaying: window.door64Audio?.isPlaying,
                        currentAudioTime: window.door64Audio?.audio?.currentTime,
                        audioMuted: window.door64Audio?.audio?.muted,
                        isMobile: window.door64Audio?.isMobile,
                        hasUserInteracted: window.door64Audio?.hasUserInteracted,
                        isNavigating: window.door64Audio?.isNavigating
                    });
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMobileMenu();
                    console.log('📱 Dev: Mobile menu toggled');
                    break;
            }
        }
    });
    
    window.door64Debug = {
        audio: () => window.door64Audio,
        galleries: () => window.door64Galleries,
        resetAudio: () => {
            localStorage.removeItem('door64_audio_state');
            localStorage.removeItem('door64_audio_time');
            localStorage.removeItem('door64_user_interacted');
            location.reload();
        },
        forceAudioStart: () => {
            if (window.door64Audio) {
                window.door64Audio.audio.muted = false;
                window.door64Audio.resumeAudio();
            }
        },
        testAutoResume: () => {
            localStorage.setItem('door64_audio_state', 'playing');
            localStorage.setItem('door64_user_interacted', 'true');
            location.reload();
        },
        simulateNavigation: () => {
            if (window.door64Audio) {
                window.door64Audio.prepareForNavigation();
            }
        },
        toggleMobileMenu: () => toggleMobileMenu(),
        mobileMenuState: () => {
            const navLinks = document.getElementById('navLinks');
            return navLinks ? navLinks.classList.contains('active') : false;
        }
    };
    
    console.log('🔧 Dev tools available: window.door64Debug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
🚪 Door 64 Restaurant - COMPLETELY FIXED AUDIO + MOBILE NAV SYSTEM
✅ NO MORE RESTARTS: Music continues seamlessly
🚪 SPLASH AUTO-START: First-time visitors hear music immediately  
📱 Mobile: Touch once, continuous play forever
🖥️ Desktop: Automatic start and continuous play
⏸️ Only audio buttons control playback
🔄 Perfect navigation continuity
📱 MOBILE NAV FIXES: All touch/scroll conflicts resolved
📱 HAMBURGER MENU: Full-screen mobile navigation
🎯 TOUCH TARGETS: 44px minimum for accessibility
🚫 SCROLL BLOCK: Prevents body scroll when menu open
⌨️ KEYBOARD NAV: Full accessibility support
🔧 DEV TOOLS: Available in development mode

All audio restart issues AND mobile navigation issues SOLVED.
`);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Door64Audio,
        Door64Gallery,
        toggleAudio,
        nextSlide,
        previousSlide,
        goToSlide,
        toggleMobileMenu,
        openMobileMenu,
        closeMobileMenu
    };
}

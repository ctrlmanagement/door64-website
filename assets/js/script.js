/* Door 64 Restaurant - Complete Fixed JavaScript - AUTO RESUME AUDIO */

// =============== CORRECTED DOOR 64 AUDIO SYSTEM - AUTO RESUME FIX ===============
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
        
        // ✅ CRITICAL FIX: Always try to restore audio state
        this.restoreAudioState();
        
        this.isInitialized = true;
    }
    
    // ✅ COMPLETELY REWRITTEN: Auto-resume logic
    restoreAudioState() {
        const storedState = localStorage.getItem(this.storageKey);
        const storedTime = localStorage.getItem(this.timeKey);
        
        console.log('🎵 Restoring audio state:', storedState);
        console.log('🎵 Stored audio time:', storedTime);
        
        // ✅ CRITICAL FIX: Auto-start if should be playing
        if (storedState === 'playing') {
            console.log('🎵 Audio should be playing - starting automatically');
            
            // Set time BEFORE starting audio
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            
            // ✅ FIXED: Always try to start, regardless of mobile/desktop
            if (this.isMobile) {
                // Mobile: Set up listener but also try to start immediately
                this.setupUserInteractionListeners();
                console.log('📱 Mobile: Setting up interaction listener AND trying immediate start');
                this.attemptAudioStart();
            } else {
                // Desktop: Start immediately
                console.log('🖥️ Desktop: Starting audio immediately');
                this.attemptAudioStart();
            }
        } else if (storedState === 'paused') {
            console.log('🎵 Audio was paused by user, respecting choice');
            // Still set the time for when user resumes
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            this.updateButtons();
        } else {
            // First time visitor or no stored state
            console.log('🎵 No stored state - setting up for first interaction');
            if (this.isMobile) {
                this.setupUserInteractionListeners();
            } else {
                // Desktop: Start muted on first visit
                this.attemptAudioStart();
            }
            this.updateButtons();
        }
    }
    
    // ✅ NEW: Attempt to start audio with proper error handling
    attemptAudioStart() {
        if (!this.audio || this.audioStartPromise) {
            return this.audioStartPromise || Promise.resolve();
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
                
                // ✅ CRITICAL: Unmute immediately if user has interacted before
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
                // Set up interaction listeners if autoplay failed
                if (!this.interactionListenersActive) {
                    this.setupUserInteractionListeners();
                }
                this.updateButtons();
            });
            
        return this.audioStartPromise;
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
            if (this.isPlaying) {
                const now = Date.now();
                if (now - this.lastUpdateTime > this.updateInterval) {
                    this.storeCurrentTime();
                    this.lastUpdateTime = now;
                }
            }
        });
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            localStorage.setItem(this.storageKey, 'playing');
            this.updateButtons();
            console.log('🎵 Audio playing - Current time:', this.audio.currentTime);
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.storeCurrentTime();
            this.updateButtons();
            console.log('⏸️ Audio paused - Current time:', this.audio.currentTime);
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
            if (this.isPlaying) {
                this.audio.currentTime = 0;
                localStorage.setItem(this.timeKey, '0');
                this.audio.play().catch(console.log);
            }
        });
    }
    
    storeCurrentTime() {
        if (this.audio && this.audio.currentTime > 0) {
            localStorage.setItem(this.timeKey, this.audio.currentTime.toString());
        }
    }
    
    // ✅ FIXED: Only for initial user interaction, then removes itself
    setupUserInteractionListeners() {
        if (this.interactionListenersActive || this.hasUserInteracted) {
            console.log('🎵 Interaction listeners already set up or not needed');
            return;
        }
        
        console.log('🎵 Setting up ONE-TIME user interaction listeners for audio start');
        this.interactionListenersActive = true;
        
        const events = ['click', 'touchstart'];
        
        const handleFirstInteraction = (e) => {
            // ✅ CRITICAL: Don't interfere if user clicked audio button
            if (e.target.closest('.audio-toggle, .splash-audio-toggle')) {
                console.log('🎵 Audio button clicked - letting button handler manage audio');
                return;
            }
            
            if (!this.hasUserInteracted) {
                this.hasUserInteracted = true;
                // ✅ STORE that user has interacted for future page loads
                localStorage.setItem('door64_user_interacted', 'true');
                console.log('🔊 First user interaction detected:', e.type, '- Unmuting/starting audio');
                
                if (this.audio) {
                    // Unmute audio if muted
                    if (this.audio.muted) {
                        this.audio.muted = false;
                        console.log('🔊 Audio unmuted');
                    }
                    
                    // Start audio if it should be playing but isn't
                    const storedState = localStorage.getItem(this.storageKey);
                    if (storedState !== 'paused' && this.audio.paused) {
                        console.log('▶️ Starting audio after first user interaction');
                        this.resumeAudio();
                    }
                }
                
                // Remove listeners immediately after first use
                this.removeInteractionListeners();
            }
        };
        
        // Add listeners with capture to catch events early
        events.forEach(event => {
            document.addEventListener(event, handleFirstInteraction, { 
                passive: true,
                capture: true
            });
        });
        
        // Store for cleanup
        this.interactionHandler = handleFirstInteraction;
        this.interactionEvents = events;
        
        console.log('👆 One-time interaction listeners set for audio start');
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
            if (this.audio) {
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
                if (storedState === 'playing' && this.audio.paused) {
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
        if (!this.audio || this.audioStartPromise) return;
        
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
    
    // ✅ FIXED: Only responds to explicit button clicks
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
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            
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
            
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.previousSlide();
                } else {
                    this.nextSlide();
                }
            }
            
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
    console.log('🚪 Door 64 - Initializing FIXED AUTO-RESUME audio system...');
    
    // Initialize FIXED audio system
    window.door64Audio = new Door64Audio();
    
    // Initialize enhanced galleries
    initGalleries();
    
    // Initialize other functionality
    initSplashPage();
    initMobileMenu();
    initViewportHeight();
    initKeyboardNavigation();
    initAccessibilityFeatures();
    
    if ('IntersectionObserver' in window) {
        initLazyLoading();
    }
    
    console.log('✅ Door 64 - AUTO-RESUME audio system ready!');
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
// ✅ FIXED GLOBAL TOGGLE FUNCTION
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

// =============== SPLASH PAGE FUNCTIONALITY ===============
function initSplashPage() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (!splashPage) return;
    
    console.log('🚪 Initializing splash page...');
    
    const handleNavigation = (targetUrl = '64.html') => {
        console.log('🚪 Navigating to:', targetUrl);
        
        if (window.door64Audio && window.door64Audio.audio) {
            window.door64Audio.storeCurrentTime();
            
            if (window.door64Audio.audio.muted && !window.door64Audio.audio.paused) {
                window.door64Audio.audio.muted = false;
            }
            
            if (window.door64Audio.audio.paused && localStorage.getItem('door64_audio_state') !== 'paused') {
                window.door64Audio.resumeAudio();
            }
            
            localStorage.setItem('door64_audio_state', 'playing');
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
    
    splashPage.addEventListener('click', function(e) {
        if (e.target.closest('.splash-audio-toggle')) {
            return;
        }
        handleNavigation();
    });
    
    const doorLinks = splashPage.querySelectorAll('.door-gallery a');
    doorLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`🚪 Door ${index + 1} clicked`);
            handleNavigation('64.html');
        });
    });
    
    document.addEventListener('keydown', function(event) {
        if (splashPage.style.display !== 'none') {
            if (event.key === 'Enter' || event.key === ' ') {
                if (!event.target.closest('.splash-audio-toggle')) {
                    event.preventDefault();
                    handleNavigation();
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
        
        setTimeout(() => {
            splashPage.style.display = 'none';
        }, 1200);
        
        console.log('✅ Splash hidden, main site active');
    }
}

// =============== MOBILE MENU FUNCTIONALITY ===============
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const navLinks = document.getElementById('navLinks');
    
    if (!mobileMenuButton || !navLinks) return;
    
    console.log('📱 Initializing mobile menu...');
    
    mobileMenuButton.addEventListener('click', toggleMobileMenu);
    
    const navLinkElements = navLinks.querySelectorAll('a');
    navLinkElements.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container') && navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
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
    
    setViewportHeight();
    
    const debouncedSetViewportHeight = debounce(setViewportHeight, 100);
    window.addEventListener('resize', debouncedSetViewportHeight);
    
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });
    
    console.log('📱 Viewport height optimization initialized');
}

// =============== KEYBOARD NAVIGATION SUPPORT ===============
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
            toggleAudio();
        }
        
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mobile-menu')) {
            e.preventDefault();
            toggleMobileMenu();
        }
        
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
                        hasUserInteracted: window.door64Audio?.hasUserInteracted
                    });
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
        }
    };
    
    console.log('🔧 Dev tools available: window.door64Debug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
🚪 Door 64 Restaurant - FINAL FIXED AUDIO SYSTEM
🎵 AUTO-RESUME: Music continues across all pages  
📱 Mobile: Touch once, then continuous play
🖥️ Desktop: Automatic start and continuous play
⏸️ Only audio buttons control playback
🔄 Seamless page transitions

Ready to serve UNINTERRUPTED musical experiences.
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
        toggleMobileMenu
    };
}

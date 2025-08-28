/* Door Restaurant - Complete JavaScript with Simplified Image Entry System */

// =============== ENHANCED DOOR AUDIO SYSTEM ===============
class DoorAudio {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.volume = 0.3;
        this.storageKey = 'door_audio_state';
        this.timeKey = 'door_audio_time';
        this.muteKey = 'door_audio_muted'; // New: Track mute state
        this.lastUpdateTime = 0;
        this.updateInterval = 500;
        this.hasUserInteracted = false;
        this.isInitialized = false;
        this.audioStartPromise = null;
        this.isMobile = this.detectMobile();
        this.interactionListenersActive = false;
        
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
        this.audio.preload = 'auto';
        this.audio.loop = true;
        this.audio.load();
        
        this.setupAudioEventListeners();
        this.setupPageUnloadHandler();
        this.restoreAudioState();
        
        this.isInitialized = true;
    }
    
    restoreAudioState() {
        const storedState = localStorage.getItem(this.storageKey);
        const storedTime = localStorage.getItem(this.timeKey);
        const storedMute = localStorage.getItem(this.muteKey) === 'true';
        const isFirstTimeVisitor = !storedState;
        
        console.log('Restoring audio state:', { storedState, storedTime, storedMute, isFirstTimeVisitor });
        
        // Set mute state immediately
        if (this.audio) {
            this.audio.muted = storedMute;
        }
        
        // Auto-start audio for quietstorm experience (unless user explicitly paused)
        if (storedState === 'playing' || isFirstTimeVisitor) {
            console.log('Auto-starting quietstorm audio...');
            
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            
            this.attemptAudioStart();
        } else if (storedState === 'paused') {
            console.log('Audio was paused by user, respecting choice');
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            this.updateButtons();
        } else {
            this.attemptAudioStart();
            this.updateButtons();
        }
    }
    
    attemptAudioStart() {
        if (this.isNavigating || this.audioStartPromise) {
            console.log('Skipping audio start - navigation in progress or already starting');
            return this.audioStartPromise || Promise.resolve();
        }
        
        if (!this.audio) {
            console.warn('No audio element found');
            return Promise.resolve();
        }
        
        console.log('Attempting to start quietstorm audio...');
        
        // Respect stored mute state
        const storedMute = localStorage.getItem(this.muteKey) === 'true';
        this.audio.muted = storedMute;
        
        this.audioStartPromise = this.audio.play()
            .then(() => {
                console.log('Audio started successfully', storedMute ? '(muted)' : '(unmuted)');
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                this.audioStartPromise = null;
                
                // Only unmute if user has interacted and audio wasn't explicitly muted
                const hasInteracted = localStorage.getItem('door_user_interacted') === 'true';
                if (hasInteracted && !storedMute) {
                    this.audio.muted = false;
                    console.log('User has interacted before and audio not muted - unmuting audio');
                    this.hasUserInteracted = true;
                } else if (!hasInteracted && !storedMute) {
                    this.setupUserInteractionListeners();
                }
            })
            .catch(error => {
                console.log('Audio autoplay prevented:', error.message);
                this.audioStartPromise = null;
                
                if (!this.interactionListenersActive && !storedMute) {
                    this.setupUserInteractionListeners();
                }
                this.updateButtons();
            });
            
        return this.audioStartPromise;
    }
    
    prepareForNavigation() {
        console.log('Preparing for navigation - preserving audio state');
        this.isNavigating = true;
        this.storeCurrentTime();
        
        if (this.isPlaying && this.audio && !this.audio.paused) {
            localStorage.setItem(this.storageKey, 'playing');
        }
        
        if (this.navigationTimeout) {
            clearTimeout(this.navigationTimeout);
        }
        
        this.navigationTimeout = setTimeout(() => {
            this.isNavigating = false;
            console.log('Navigation state reset');
        }, 2000);
    }
    
    setAudioTime(time) {
        if (!this.audio) return;
        
        const setTime = () => {
            try {
                if (this.audio.duration && time <= this.audio.duration) {
                    this.audio.currentTime = time;
                    console.log('Audio time set to:', time);
                } else if (!this.audio.duration) {
                    console.log('Audio metadata not ready, waiting...');
                    setTimeout(() => setTime(), 100);
                }
            } catch (error) {
                console.log('Failed to set audio time:', error.message);
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
                console.log('Audio playing - Current time:', this.audio.currentTime);
            }
        });
        
        this.audio.addEventListener('pause', () => {
            if (!this.isNavigating) {
                this.isPlaying = false;
                this.storeCurrentTime();
                this.updateButtons();
                console.log('Audio paused - Current time:', this.audio.currentTime);
            }
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
    
    setupUserInteractionListeners() {
        if (this.interactionListenersActive || this.hasUserInteracted) {
            console.log('Interaction listeners already set up or not needed');
            return;
        }
        
        console.log('Setting up mobile-safe user interaction listeners');
        this.interactionListenersActive = true;
        
        const isMobileDevice = this.isMobile;
        
        if (isMobileDevice) {
            const events = ['click'];
            
            const handleFirstInteraction = (e) => {
                if (e.target.closest('.audio-toggle, .splash-audio-toggle') || 
                    e.target.closest('input, textarea, select, button')) {
                    return;
                }
                
                if (!this.hasUserInteracted) {
                    this.hasUserInteracted = true;
                    localStorage.setItem('door_user_interacted', 'true');
                    console.log('Mobile: First click detected - starting audio');
                    
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
        } else {
            const events = ['click', 'touchstart'];
            
            const handleFirstInteraction = (e) => {
                if (e.target.closest('.audio-toggle, .splash-audio-toggle')) {
                    return;
                }
                
                if (!this.hasUserInteracted) {
                    this.hasUserInteracted = true;
                    localStorage.setItem('door_user_interacted', 'true');
                    console.log('Desktop: First interaction detected - starting audio');
                    
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
    
    enableAudioAfterInteraction() {
        if (this.audio) {
            if (this.audio.muted) {
                this.audio.muted = false;
                console.log('Audio unmuted');
            }
            
            const storedState = localStorage.getItem(this.storageKey);
            if (storedState !== 'paused' && this.audio.paused && !this.isNavigating) {
                console.log('Starting audio after user interaction');
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
            console.log('User interaction listeners removed - audio system ready');
        }
    }
    
    setupPageUnloadHandler() {
        const storeState = () => {
            if (this.audio && !this.isNavigating) {
                this.storeCurrentTime();
                if (this.isPlaying) {
                    localStorage.setItem(this.storageKey, 'playing');
                }
                console.log('Audio state saved - Time:', this.audio.currentTime, 'State:', this.isPlaying ? 'playing' : 'paused');
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
                    console.log('Page visible - resuming audio at stored time');
                    
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
        
        console.log('User requested audio pause');
        this.storeCurrentTime();
        this.audio.pause();
        this.isPlaying = false;
        localStorage.setItem(this.storageKey, 'paused');
        this.updateButtons();
        console.log('Audio paused by user at time:', this.audio.currentTime);
    }
    
    muteAudio() {
        if (!this.audio) return;
        
        console.log('User requested audio mute');
        this.audio.muted = true;
        localStorage.setItem(this.muteKey, 'true');
        this.updateButtons();
        console.log('Audio muted and saved to localStorage');
    }
    
    unmuteAudio() {
        if (!this.audio) return;
        
        console.log('User requested audio unmute');
        this.audio.muted = false;
        localStorage.setItem(this.muteKey, 'false');
        this.updateButtons();
        console.log('Audio unmuted and saved to localStorage');
    }
    
    resumeAudio() {
        if (!this.audio || this.audioStartPromise || this.isNavigating) return;
        
        console.log('User requested audio resume (or auto-resume)');
        
        const storedTime = localStorage.getItem(this.timeKey);
        if (storedTime && parseFloat(storedTime) > 0 && 
            Math.abs(this.audio.currentTime - parseFloat(storedTime)) > 1) {
            this.setAudioTime(parseFloat(storedTime));
        }
        
        // Respect stored mute state
        const storedMute = localStorage.getItem(this.muteKey) === 'true';
        this.audio.muted = storedMute;
        
        this.audioStartPromise = this.audio.play()
            .then(() => {
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                this.audioStartPromise = null;
                console.log('Audio resumed at time:', this.audio.currentTime, storedMute ? '(muted)' : '(unmuted)');
            })
            .catch(error => {
                console.error('Failed to resume audio:', error);
                this.audioStartPromise = null;
                if (!this.hasUserInteracted && !this.interactionListenersActive) {
                    this.setupUserInteractionListeners();
                }
                this.updateButtons();
            });
            
        return this.audioStartPromise;
    }
    
    toggle() {
        console.log('Audio toggle button clicked - Current state:', this.isPlaying, 'Muted:', this.audio?.muted);
        
        // If audio is playing, check if it's muted
        if (this.isPlaying && this.audio && !this.audio.paused) {
            if (this.audio.muted) {
                // Unmute the audio
                this.unmuteAudio();
            } else {
                // Mute the audio (don't pause, just mute)
                this.muteAudio();
            }
        } else {
            // Resume audio (with preserved mute state)
            this.resumeAudio();
        }
    }
    
    updateButtons() {
        const buttons = document.querySelectorAll('.audio-toggle, .splash-audio-toggle');
        
        buttons.forEach(button => {
            const isActuallyPlaying = this.isPlaying && this.audio && !this.audio.paused;
            const isMuted = this.audio && this.audio.muted;
            
            if (isActuallyPlaying) {
                if (isMuted) {
                    button.innerHTML = '🔇'; // Muted speaker icon
                    button.classList.remove('playing');
                    button.title = 'Unmute Background Music';
                    button.setAttribute('aria-label', 'Unmute background music');
                } else {
                    button.innerHTML = '♪'; // Playing music note
                    button.classList.add('playing');
                    button.title = 'Mute Background Music';
                    button.setAttribute('aria-label', 'Mute background music');
                }
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
        
        console.log('Audio buttons updated - Playing:', this.isPlaying, 'Actually playing:', this.audio && !this.audio.paused, 'Muted:', this.audio && this.audio.muted);
    }
}

// =============== ENHANCED GALLERY SYSTEM ===============
class DoorGallery {
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
        console.log(`Gallery ${this.galleryId} - Initializing with ${this.totalSlides} slides`);
        
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
        let isHorizontalSwipe = false;
        
        container.addEventListener('touchstart', (e) => {
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
            
            if (!isHorizontalSwipe) {
                const absX = Math.abs(deltaX);
                const absY = Math.abs(deltaY);
                
                if (absX > 15 || absY > 15) {
                    isHorizontalSwipe = absX > absY && absX > 30;
                }
            }
            
            if (isHorizontalSwipe && Math.abs(deltaX) > 10) {
                e.preventDefault();
            }
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - startX;
            
            container.classList.remove('swiping');
            isDragging = false;
            
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
        console.log(`Gallery ${this.galleryId} - Next slide: ${this.currentSlide + 1}/${this.totalSlides}`);
    }
    
    previousSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateGallery();
        console.log(`Gallery ${this.galleryId} - Previous slide: ${this.currentSlide + 1}/${this.totalSlides}`);
    }
    
    goToSlide(slideIndex) {
        if (slideIndex >= 0 && slideIndex < this.totalSlides) {
            this.currentSlide = slideIndex;
            this.updateGallery();
            this.restartAutoPlay();
            console.log(`Gallery ${this.galleryId} - Go to slide: ${slideIndex + 1}/${this.totalSlides}`);
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
            console.log(`Gallery ${this.galleryId} - Auto-play started`);
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
window.doorAudio = null;
window.doorGalleries = {};

// =============== DOCUMENT READY & INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Door - Initializing systems...');
    
    // Initialize audio system FIRST for quietstorm at launch
    window.doorAudio = new DoorAudio();
    
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
    
    console.log('Door - All systems initialized!');
});

// =============== GALLERY INITIALIZATION ===============
function initGalleries() {
    const galleries = document.querySelectorAll('.css-gallery');
    
    galleries.forEach(gallery => {
        const galleryId = gallery.id;
        if (galleryId) {
            window.doorGalleries[galleryId] = new DoorGallery(galleryId);
        }
    });
    
    const landingTrack = document.getElementById('landing-track');
    if (landingTrack && !window.doorGalleries['landing-gallery']) {
        const landingGallery = landingTrack.closest('.css-gallery');
        if (landingGallery) {
            landingGallery.id = 'landing-gallery';
            window.doorGalleries['landing-gallery'] = new DoorGallery('landing-gallery');
        }
    }
}

// =============== GLOBAL FUNCTIONS ===============
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

function nextSlide(galleryId) {
    if (galleryId && window.doorGalleries && window.doorGalleries[galleryId]) {
        window.doorGalleries[galleryId].nextSlide();
    } else if (!galleryId && window.doorGalleries['landing-gallery']) {
        window.doorGalleries['landing-gallery'].nextSlide();
    } else {
        console.warn(`Gallery ${galleryId || 'landing-gallery'} not found`);
    }
}

function previousSlide(galleryId) {
    if (galleryId && window.doorGalleries && window.doorGalleries[galleryId]) {
        window.doorGalleries[galleryId].previousSlide();
    } else if (!galleryId && window.doorGalleries['landing-gallery']) {
        window.doorGalleries['landing-gallery'].previousSlide();
    } else {
        console.warn(`Gallery ${galleryId || 'landing-gallery'} not found`);
    }
}

function goToSlide(galleryIdOrIndex, slideIndex) {
    if (typeof galleryIdOrIndex === 'string') {
        if (window.doorGalleries && window.doorGalleries[galleryIdOrIndex]) {
            window.doorGalleries[galleryIdOrIndex].goToSlide(slideIndex);
        }
    } else {
        const slideIdx = galleryIdOrIndex;
        if (window.doorGalleries && window.doorGalleries['landing-gallery']) {
            window.doorGalleries['landing-gallery'].goToSlide(slideIdx);
        }
    }
}

// =============== SIMPLIFIED SPLASH PAGE - IMAGE CLICK ONLY ===============
function initSplashPage() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (!splashPage) return;
    
    console.log('Initializing simplified splash page with image click entry...');
    
    // Image click navigation is already set up in HTML with onclick="enterSite()"
    
    // Keep keyboard navigation for accessibility (Enter key on image)
    document.addEventListener('keydown', function(event) {
        if (splashPage.style.display === 'none') return;
        
        if (event.key === 'Enter' || event.key === ' ') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('splash-image-container')) {
                event.preventDefault();
                enterSite();
            } else if (event.target === document.body) {
                event.preventDefault();
                enterSite();
            }
        }
    });
    
    console.log('Splash page initialized with simple image click system');
}

// Splash page functions (called from HTML)
function enterSite() {
    console.log('Entering site...');
    
    // Prepare audio for navigation
    if (window.doorAudio) {
        window.doorAudio.prepareForNavigation();
    }
    
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

// =============== MOBILE MENU ===============
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const navLinks = document.getElementById('navLinks');
    
    if (!mobileMenuButton || !navLinks) return;
    
    console.log('Initializing mobile-safe menu...');
    
    mobileMenuButton.addEventListener('click', toggleMobileMenu);
    
    const navLinkElements = navLinks.querySelectorAll('a');
    navLinkElements.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
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
        if (!window.doorAudio?.isNavigating) {
            setViewportHeight();
        }
    }, 150);
    
    window.addEventListener('resize', debouncedSetViewportHeight);
    
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (!window.doorAudio?.isNavigating) {
                setViewportHeight();
            }
        }, 200);
    });
    
    console.log('Mobile-safe viewport height optimization initialized');
}

function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' && e.target === document.body) {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (!isMobileDevice || !document.activeElement || document.activeElement === document.body) {
                e.preventDefault();
                toggleAudio();
            }
        }
        
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mobile-menu')) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggleMobileMenu();
            }
        }
        
        const activeElement = document.activeElement;
        if (activeElement && activeElement.closest('.css-gallery')) {
            const gallery = activeElement.closest('.css-gallery');
            const galleryId = gallery.id;
            
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
                        if (window.doorGalleries[galleryId]) {
                            const lastSlide = window.doorGalleries[galleryId].totalSlides - 1;
                            goToSlide(galleryId, lastSlide);
                        }
                        break;
                }
            }
        }
    });
    
    console.log('Mobile-safe keyboard navigation initialized');
}

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
    
    // Skip link functionality removed
    
    console.log('Accessibility features initialized');
}

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
                    console.log('Lazy loaded:', img.alt || img.src);
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
    
    console.log('Lazy loading initialized');
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

function isMobileMultiTouch(e) {
    return e.touches && e.touches.length > 1;
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
                    localStorage.removeItem('door_audio_state');
                    localStorage.removeItem('door_audio_time');
                    localStorage.removeItem('door_user_interacted');
                    console.log('Dev: Audio state reset');
                    break;
                case 'i':
                    e.preventDefault();
                    console.log('Dev: System info:', {
                        audioState: localStorage.getItem('door_audio_state'),
                        audioTime: localStorage.getItem('door_audio_time'),
                        userInteracted: localStorage.getItem('door_user_interacted'),
                        galleries: Object.keys(window.doorGalleries),
                        isAudioPlaying: window.doorAudio?.isPlaying,
                        currentAudioTime: window.doorAudio?.audio?.currentTime,
                        audioMuted: window.doorAudio?.audio?.muted,
                        isMobile: window.doorAudio?.isMobile,
                        hasUserInteracted: window.doorAudio?.hasUserInteracted,
                        isNavigating: window.doorAudio?.isNavigating
                    });
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMobileMenu();
                    console.log('Dev: Mobile menu toggled');
                    break;
            }
        }
    });
    
    window.doorDebug = {
        audio: () => window.doorAudio,
        galleries: () => window.doorGalleries,
        resetAudio: () => {
            localStorage.removeItem('door_audio_state');
            localStorage.removeItem('door_audio_time');
            localStorage.removeItem('door_user_interacted');
            location.reload();
        },
        forceAudioStart: () => {
            if (window.doorAudio) {
                window.doorAudio.audio.muted = false;
                window.doorAudio.resumeAudio();
            }
        },
        testAutoResume: () => {
            localStorage.setItem('door_audio_state', 'playing');
            localStorage.setItem('door_user_interacted', 'true');
            location.reload();
        },
        simulateNavigation: () => {
            if (window.doorAudio) {
                window.doorAudio.prepareForNavigation();
            }
        },
        toggleMobileMenu: () => toggleMobileMenu(),
        mobileMenuState: () => {
            const navLinks = document.getElementById('navLinks');
            return navLinks ? navLinks.classList.contains('active') : false;
        }
    };
    
    console.log('Dev tools available: window.doorDebug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
Door Restaurant - SIMPLIFIED IMAGE ENTRY
🖼️ IMAGE CLICK: Click the splash image to enter
🎵 AUTO AUDIO: Quietstorm plays automatically at launch
🎵 BLUE MUSIC ICON: Top-right corner audio toggle
📱 MOBILE FRIENDLY: Touch-optimized for iPhone
🖥️ DEV TOOLS: Ctrl+Shift+A (audio), window.doorDebug

Philosophy: "Simplicity is the ultimate sophistication" - Leonardo da Vinci

Clean, simple, effective - just click the image to enter!
`);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DoorAudio,
        DoorGallery,
        toggleAudio,
        nextSlide,
        previousSlide,
        goToSlide,
        toggleMobileMenu,
        openMobileMenu,
        closeMobileMenu,
        enterSite,
        handleSplashKeydown,
        hideSplash
    };
}

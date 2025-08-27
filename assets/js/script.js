/* Door Restaurant - Complete JavaScript with Rotating Door Entry System */

// =============== ENHANCED DOOR AUDIO SYSTEM ===============
class DoorAudio {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.volume = 0.3;
        this.storageKey = 'door_audio_state';
        this.timeKey = 'door_audio_time';
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
        const isFirstTimeVisitor = !storedState;
        const isSplashPage = document.getElementById('splashPage') !== null;
        
        console.log('Restoring audio state:', { storedState, storedTime, isFirstTimeVisitor, isSplashPage });
        
        // Auto-start audio for quietstorm experience
        if (storedState === 'playing' || isFirstTimeVisitor) {
            console.log('Auto-starting quietstorm audio...');
            
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            
            if (this.isMobile) {
                this.setupUserInteractionListeners();
                this.attemptAudioStart();
            } else {
                this.attemptAudioStart();
            }
        } else if (storedState === 'paused') {
            console.log('Audio was paused by user, respecting choice');
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            this.updateButtons();
        } else {
            if (this.isMobile) {
                this.setupUserInteractionListeners();
            } else {
                this.attemptAudioStart();
            }
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
        
        this.audio.muted = true;
        
        this.audioStartPromise = this.audio.play()
            .then(() => {
                console.log('Audio started successfully (muted for autoplay compliance)');
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                this.audioStartPromise = null;
                
                const hasInteracted = localStorage.getItem('door_user_interacted') === 'true';
                if (hasInteracted) {
                    this.audio.muted = false;
                    console.log('User has interacted before - unmuting audio');
                    this.hasUserInteracted = true;
                } else if (!this.isMobile) {
                    this.setupUserInteractionListeners();
                }
            })
            .catch(error => {
                console.log('Audio autoplay prevented:', error.message);
                this.audioStartPromise = null;
                
                if (!this.interactionListenersActive) {
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
    
    resumeAudio() {
        if (!this.audio || this.audioStartPromise || this.isNavigating) return;
        
        console.log('User requested audio resume (or auto-resume)');
        
        const storedTime = localStorage.getItem(this.timeKey);
        if (storedTime && parseFloat(storedTime) > 0 && 
            Math.abs(this.audio.currentTime - parseFloat(storedTime)) > 1) {
            this.setAudioTime(parseFloat(storedTime));
        }
        
        if (this.audio.muted && (this.hasUserInteracted || localStorage.getItem('door_user_interacted') === 'true')) {
            this.audio.muted = false;
            console.log('Audio unmuted for resume');
        }
        
        this.audioStartPromise = this.audio.play()
            .then(() => {
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                this.audioStartPromise = null;
                console.log('Audio resumed at time:', this.audio.currentTime);
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
        console.log('Audio toggle button clicked - Current state:', this.isPlaying, 'Paused:', this.audio?.paused);
        
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
        
        console.log('Audio buttons updated - Playing:', this.isPlaying, 'Actually playing:', this.audio && !this.audio.paused);
    }
}

// =============== ROTATING DOOR ENTRY SYSTEM WITH RANDOM QUOTES ===============
class RotatingDoorEntry {
    constructor() {
        this.letters = ['D', 'O1', 'O2', 'R']; // Corresponding to the 4 door letters
        this.currentActiveIndex = -1;
        this.rotationInterval = null;
        this.rotationDelay = 3000; // 3 seconds between rotations
        this.doorLinks = [];
        this.isInitialized = false;
        this.attemptCount = 0; // Track failed attempts for auto-entry
        
        // Random quotes for wrong door clicks
        this.doorLockQuotes = [
            "I'm not locked out, I'm just testing the security system... unsuccessfully.",
            "The door is locked, but my Wi-Fi password is still 'password123' - priorities, people!",
            "Door is locked, but so is my motivation to find the right key.",
            "I have a key to every door... except the one I'm standing in front of right now.",
            "My door is very security-conscious. It doesn't even trust me, and I pay the rent!",
            "Door is locked, but my ability to make poor decisions remains wide open.",
            "Like a locksmith, except instead of opening doors, I just stand outside them looking confused.",
            "The definition of optimism: carrying only one key and hoping it's the right one.",
            "Door thinks it's Fort Knox, but really it's just keeping out someone who can't remember where they put their keys five minutes ago."
        ];
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        const splashPage = document.getElementById('splashPage');
        if (!splashPage) return;
        
        console.log('Initializing Rotating Door Entry System with Random Quotes...');
        
        // Get all door links
        this.doorLinks = Array.from(document.querySelectorAll('.door-gallery a'));
        
        if (this.doorLinks.length === 0) {
            console.warn('No door links found');
            return;
        }
        
        // Add click handlers to each door link
        this.setupDoorClickHandlers();
        
        // Start the rotation
        this.startRotation();
        
        // Set initial active letter
        this.rotateActiveLetter();
        
        this.isInitialized = true;
        console.log('Rotating Door Entry System initialized with random quotes');
    }
    
    setupDoorClickHandlers() {
        this.doorLinks.forEach((link, index) => {
            // Remove existing click handlers
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            this.doorLinks[index] = newLink;
            
            // Add new click handler
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Door clicked: ${this.letters[index]} (index: ${index})`);
                this.handleDoorClick(index);
            });
        });
        
        console.log('Door click handlers set up for', this.doorLinks.length, 'doors');
    }
    
    handleDoorClick(clickedIndex) {
        console.log(`Door ${this.letters[clickedIndex]} clicked (index: ${clickedIndex})`);
        console.log(`Active door index: ${this.currentActiveIndex}`);
        console.log(`Attempt count: ${this.attemptCount}`);
        
        if (clickedIndex === this.currentActiveIndex) {
            console.log('Correct door clicked! Access granted!');
            this.stopRotation();
            this.showAccessGranted();
        } else {
            console.log('Wrong door clicked! Showing random quote...');
            this.attemptCount++;
            
            if (this.attemptCount >= 3) {
                console.log('Third attempt reached - granting automatic access!');
                this.stopRotation();
                this.showAutoAccess();
            } else {
                this.showRandomQuote();
            }
        }
    }
    
    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.doorLockQuotes.length);
        return this.doorLockQuotes[randomIndex];
    }
    
    showAccessGranted() {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = 'ACCESS GRANTED';
            statusMessage.className = 'status-message granted';
            statusMessage.style.display = 'block';
            console.log('Showing ACCESS GRANTED message');
            
            setTimeout(() => {
                statusMessage.style.display = 'none';
                this.navigateToMainSite();
            }, 2000);
        } else {
            console.error('Status message element not found');
        }
    }
    
    showAutoAccess() {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = 'Welcome! The door recognizes your persistence.';
            statusMessage.className = 'status-message granted';
            statusMessage.style.display = 'block';
            console.log('Showing auto-access message after 3 attempts');
            
            setTimeout(() => {
                statusMessage.style.display = 'none';
                this.navigateToMainSite();
            }, 2500);
        } else {
            console.error('Status message element not found');
        }
    }
    
    showRandomQuote() {
        const quoteSection = document.getElementById('quoteResponses');
        const quoteText = document.getElementById('quoteText');
        
        if (quoteSection && quoteText) {
            const randomQuote = this.getRandomQuote();
            quoteText.textContent = randomQuote;
            quoteSection.style.display = 'block';
            quoteSection.className = 'quote-responses show';
            console.log('Showing random quote at bottom:', randomQuote);
            
            setTimeout(() => {
                quoteSection.style.display = 'none';
                quoteSection.className = 'quote-responses';
            }, 4000); // Show quotes longer since they're at the bottom
        } else {
            console.error('Quote section elements not found');
        }
    }
    
    // Kept for backwards compatibility with dev tools
    showDoorLocked() {
        this.showRandomQuote();
    }
    
    navigateToMainSite() {
        console.log('Navigating to main site...');
        
        // Prepare audio for navigation
        if (window.doorAudio) {
            window.doorAudio.prepareForNavigation();
        }
        
        // Navigate after a short delay
        setTimeout(() => {
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/' || 
                window.location.pathname === '') {
                // Remove the redirect to '64.html' since we removed "64" references
                this.hideSplash();
            } else {
                this.hideSplash();
            }
        }, 300);
    }
    
    hideSplash() {
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
    
    rotateActiveLetter() {
        // Remove active class from current door
        if (this.currentActiveIndex >= 0 && this.doorLinks[this.currentActiveIndex]) {
            this.doorLinks[this.currentActiveIndex].classList.remove('door-active');
        }
        
        // Select random new active door
        const newActiveIndex = Math.floor(Math.random() * this.letters.length);
        
        // Ensure we don't pick the same door twice in a row (unless there's only one door)
        if (this.letters.length > 1 && newActiveIndex === this.currentActiveIndex) {
            return this.rotateActiveLetter();
        }
        
        this.currentActiveIndex = newActiveIndex;
        
        // Add active class to new door
        if (this.doorLinks[this.currentActiveIndex]) {
            this.doorLinks[this.currentActiveIndex].classList.add('door-active');
        }
        
        console.log(`Active door rotated to: ${this.letters[this.currentActiveIndex]} (index: ${this.currentActiveIndex})`);
    }
    
    startRotation() {
        this.stopRotation(); // Clear any existing interval
        
        this.rotationInterval = setInterval(() => {
            this.rotateActiveLetter();
        }, this.rotationDelay);
        
        console.log(`Door rotation started (every ${this.rotationDelay}ms)`);
    }
    
    stopRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
            console.log('Door rotation stopped');
        }
    }
    
    // Public method to manually set rotation speed
    setRotationSpeed(milliseconds) {
        this.rotationDelay = milliseconds;
        if (this.rotationInterval) {
            this.startRotation(); // Restart with new speed
        }
    }
    
    // Reset attempts (for testing or restarting)
    resetAttempts() {
        this.attemptCount = 0;
        console.log('Attempt count reset to 0');
    }
    
    // Cleanup method
    destroy() {
        this.stopRotation();
        this.doorLinks.forEach(link => {
            link.classList.remove('door-active');
        });
        this.attemptCount = 0;
        this.isInitialized = false;
        console.log('Rotating Door Entry System destroyed');
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

// Global instances - renamed to remove "64" references
window.doorAudio = null;
window.doorGalleries = {};
window.rotatingDoorEntry = null;

// =============== DOCUMENT READY & INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Door - Initializing systems...');
    
    // Initialize audio system FIRST for quietstorm at launch
    window.doorAudio = new DoorAudio();
    
    // Initialize rotating door entry system
    window.rotatingDoorEntry = new RotatingDoorEntry();
    
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

// =============== UPDATED SPLASH PAGE - DOOR CLICK NAVIGATION ONLY ===============
function initSplashPage() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (!splashPage) return;
    
    console.log('Initializing splash page with rotating door entry...');
    
    // Only door clicks work - no general click navigation
    // The rotating door entry system handles all door click logic
    
    // Keep keyboard navigation for accessibility (Enter key on active door)
    document.addEventListener('keydown', function(event) {
        if (splashPage.style.display === 'none') return;
        
        if (event.key === 'Enter' && event.target === document.body) {
            // Simulate clicking the currently active door
            if (window.rotatingDoorEntry && window.rotatingDoorEntry.currentActiveIndex >= 0) {
                const activeIndex = window.rotatingDoorEntry.currentActiveIndex;
                window.rotatingDoorEntry.handleDoorClick(activeIndex);
            }
        }
    });
    
    console.log('Splash page initialized with rotating door entry system');
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
                case 'd':
                    e.preventDefault();
                    if (window.rotatingDoorEntry) {
                        if (window.rotatingDoorEntry.rotationInterval) {
                            window.rotatingDoorEntry.stopRotation();
                            console.log('Dev: Door rotation stopped');
                        } else {
                            window.rotatingDoorEntry.startRotation();
                            console.log('Dev: Door rotation started');
                        }
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    if (window.rotatingDoorEntry) {
                        window.rotatingDoorEntry.setRotationSpeed(1000); // Fast rotation
                        console.log('Dev: Fast door rotation (1 second)');
                    }
                    break;
                case 't':
                    e.preventDefault();
                    if (window.rotatingDoorEntry) {
                        window.rotatingDoorEntry.resetAttempts();
                        console.log('Dev: Attempt count reset');
                    }
                    break;
                case 'q':
                    e.preventDefault();
                    if (window.rotatingDoorEntry) {
                        window.rotatingDoorEntry.showRandomQuote();
                        console.log('Dev: Random quote shown');
                    }
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
                        isNavigating: window.doorAudio?.isNavigating,
                        activeDoorIndex: window.rotatingDoorEntry?.currentActiveIndex,
                        doorRotationActive: window.rotatingDoorEntry?.rotationInterval !== null,
                        attemptCount: window.rotatingDoorEntry?.attemptCount
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
        doorEntry: () => window.rotatingDoorEntry,
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
        },
        setDoorSpeed: (ms) => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.setRotationSpeed(ms);
                console.log(`Door rotation speed set to ${ms}ms`);
            }
        },
        stopDoors: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.stopRotation();
                console.log('Door rotation stopped');
            }
        },
        startDoors: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.startRotation();
                console.log('Door rotation started');
            }
        },
        showAccessGranted: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.showAccessGranted();
            }
        },
        showRandomQuote: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.showRandomQuote();
            }
        },
        resetAttempts: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.resetAttempts();
            }
        },
        getAttemptCount: () => {
            return window.rotatingDoorEntry?.attemptCount || 0;
        },
        testAutoAccess: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.attemptCount = 2; // Next click will trigger auto-access
                console.log('Dev: Set to trigger auto-access on next wrong click');
            }
        }
    };
    
    console.log('Dev tools available: window.doorDebug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
Door Restaurant - ENHANCED WITH RANDOM QUOTES & AUTO-ENTRY
✅ EMBOSSED LETTERS: White embossed styling like main logo
🎯 PULSATING DOORS: Active door pulsates every 3 seconds
🎲 RANDOM QUOTES: Humorous messages replace generic "locked" text
🚪 AUTO-ENTRY: Automatic access granted after 3 attempts
🎵 BLUE MUSIC ICON: Top-right corner with quietstorm auto-play
🔒 CLICK TO ENTER: Click the pulsating door to proceed
⌨️ KEYBOARD: Press Enter to click the active door
🔄 ROTATION SYSTEM: Automatic door switching with enhanced feedback
📱 MOBILE FRIENDLY: Touch-optimized door interactions
🎵 AUTO AUDIO: Quietstorm plays automatically at launch
🖥️ DEV TOOLS: Ctrl+Shift+Q (random quote), window.doorDebug

Philosophy: "Not every closed door is rejection" - Try 3 times for auto-access!

Random Quotes Include:
• "I'm not locked out, I'm just testing the security system... unsuccessfully."
• "Door is locked, but my Wi-Fi password is still 'password123' - priorities!"
• "Like a locksmith, except I just stand outside doors looking confused."
• And 6 more hilarious variations!
`);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DoorAudio,
        DoorGallery,
        RotatingDoorEntry,
        toggleAudio,
        nextSlide,
        previousSlide,
        goToSlide,
        toggleMobileMenu,
        openMobileMenu,
        closeMobileMenu
    };
}

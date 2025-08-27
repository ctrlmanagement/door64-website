/* Door Restaurant - Complete iPhone-Optimized JavaScript */

// =============== ENHANCED DOOR AUDIO SYSTEM FOR IPHONE ===============
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
        this.isIPhone = this.detectIPhone();
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
    
    detectIPhone() {
        return /iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    init() {
        if (this.isInitialized) {
            console.log('Door Audio - Already initialized, skipping...');
            return;
        }
        
        console.log('Door Audio System - Initializing...', 
                   this.isIPhone ? 'iPhone detected' : 
                   this.isMobile ? 'Mobile detected' : 'Desktop detected');
        
        this.audio = document.getElementById('backgroundAudio');
        if (!this.audio) {
            console.warn('Background audio element not found');
            return;
        }
        
        // iPhone-specific audio setup
        if (this.isIPhone) {
            this.audio.setAttribute('webkit-playsinline', 'true');
            this.audio.setAttribute('playsinline', 'true');
            this.audio.playsInline = true;
            this.audio.crossOrigin = 'anonymous';
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
        
        console.log('Restoring audio state:', { storedState, storedTime, isFirstTimeVisitor, isSplashPage, isIPhone: this.isIPhone });
        
        // Enhanced iPhone autoplay handling
        if (storedState === 'playing' || isFirstTimeVisitor) {
            console.log('Auto-starting quietstorm audio...');
            
            if (storedTime && parseFloat(storedTime) > 0) {
                this.setAudioTime(parseFloat(storedTime));
            }
            
            if (this.isIPhone) {
                // iPhone requires user interaction first
                this.setupUserInteractionListeners();
                this.attemptAudioStart();
            } else if (this.isMobile) {
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
            if (this.isIPhone || this.isMobile) {
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
        
        console.log('Attempting to start quietstorm audio...', this.isIPhone ? '(iPhone)' : '');
        
        // iPhone requires muted autoplay
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
                } else if (!this.isIPhone && !this.isMobile) {
                    this.setupUserInteractionListeners();
                }
            })
            .catch(error => {
                console.log('Audio autoplay prevented:', error.message, this.isIPhone ? '(iPhone restriction)' : '');
                this.audioStartPromise = null;
                
                if (!this.interactionListenersActive) {
                    this.setupUserInteractionListeners();
                }
                this.updateButtons();
            });
            
        return this.audioStartPromise;
    }
    
    setupUserInteractionListeners() {
        if (this.interactionListenersActive || this.hasUserInteracted) {
            console.log('Interaction listeners already set up or not needed');
            return;
        }
        
        console.log('Setting up iPhone-safe user interaction listeners');
        this.interactionListenersActive = true;
        
        // Enhanced iPhone interaction detection
        if (this.isIPhone) {
            const events = ['touchend', 'click'];
            
            const handleFirstInteraction = (e) => {
                // Skip audio/menu buttons
                if (e.target.closest('.audio-toggle, .splash-audio-toggle, .mobile-menu') || 
                    e.target.closest('input, textarea, select, button[type="button"], button[type="submit"]')) {
                    return;
                }
                
                if (!this.hasUserInteracted) {
                    this.hasUserInteracted = true;
                    localStorage.setItem('door_user_interacted', 'true');
                    console.log('iPhone: First interaction detected - starting audio');
                    
                    this.enableAudioAfterInteraction();
                    this.removeInteractionListeners();
                }
            };
            
            events.forEach(event => {
                document.addEventListener(event, handleFirstInteraction, { 
                    passive: true,
                    capture: false
                });
            });
            
            this.interactionHandler = handleFirstInteraction;
            this.interactionEvents = events;
        } else if (this.isMobile) {
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
                console.log('Audio unmuted', this.isIPhone ? '(iPhone)' : '');
            }
            
            const storedState = localStorage.getItem(this.storageKey);
            if (storedState !== 'paused' && this.audio.paused && !this.isNavigating) {
                console.log('Starting audio after user interaction', this.isIPhone ? '(iPhone)' : '');
                this.resumeAudio();
            }
        }
    }
    
    removeInteractionListeners() {
        if (this.interactionHandler && this.interactionEvents) {
            this.interactionEvents.forEach(event => {
                document.removeEventListener(event, this.interactionHandler, { capture: false });
            });
            this.interactionHandler = null;
            this.interactionEvents = null;
            this.interactionListenersActive = false;
            console.log('User interaction listeners removed - audio system ready');
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
            console.log('Audio can play - Duration:', this.audio.duration, this.isIPhone ? '(iPhone)' : '');
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e, 'Error code:', this.audio.error?.code, this.isIPhone ? '(iPhone)' : '');
            this.isPlaying = false;
            this.updateButtons();
        });
        
        this.audio.addEventListener('ended', () => {
            console.log('Audio ended - restarting...', this.isIPhone ? '(iPhone)' : '');
            if (this.isPlaying && !this.isNavigating) {
                this.audio.currentTime = 0;
                localStorage.setItem(this.timeKey, '0');
                this.audio.play().catch(console.log);
            }
        });
        
        // iPhone-specific audio event handling
        if (this.isIPhone) {
            this.audio.addEventListener('loadstart', () => {
                console.log('iPhone: Audio loading started');
            });
            
            this.audio.addEventListener('loadeddata', () => {
                console.log('iPhone: Audio data loaded');
            });
            
            this.audio.addEventListener('stalled', () => {
                console.log('iPhone: Audio stalled - attempting recovery');
                if (this.audio.readyState < 3) {
                    this.audio.load();
                }
            });
        }
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
                    console.log('Audio time set to:', time, this.isIPhone ? '(iPhone)' : '');
                } else if (!this.audio.duration) {
                    console.log('Audio metadata not ready, waiting...', this.isIPhone ? '(iPhone)' : '');
                    setTimeout(() => setTime(), this.isIPhone ? 200 : 100); // Longer wait for iPhone
                }
            } catch (error) {
                console.log('Failed to set audio time:', error.message, this.isIPhone ? '(iPhone)' : '');
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
    
    storeCurrentTime() {
        if (this.audio && this.audio.currentTime > 0 && !this.isNavigating) {
            localStorage.setItem(this.timeKey, this.audio.currentTime.toString());
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
        
        // iPhone-specific event handling
        if (this.isIPhone) {
            window.addEventListener('pagehide', storeState, { passive: true });
            window.addEventListener('beforeunload', storeState, { passive: true });
        } else {
            window.addEventListener('beforeunload', storeState);
            window.addEventListener('pagehide', storeState);
        }
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.storeCurrentTime();
            } else if (!document.hidden && this.audio) {
                const storedState = localStorage.getItem(this.storageKey);
                if (storedState === 'playing' && this.audio.paused && !this.isNavigating) {
                    console.log('Page visible - resuming audio at stored time', this.isIPhone ? '(iPhone)' : '');
                    
                    const storedTime = localStorage.getItem(this.timeKey);
                    if (storedTime && parseFloat(storedTime) > 0) {
                        this.setAudioTime(parseFloat(storedTime));
                    }
                    
                    // iPhone needs slight delay after visibility change
                    if (this.isIPhone) {
                        setTimeout(() => this.resumeAudio(), 300);
                    } else {
                        this.resumeAudio();
                    }
                }
            }
        }, { passive: true });
    }
    
    pauseAudio() {
        if (!this.audio) return;
        
        console.log('User requested audio pause', this.isIPhone ? '(iPhone)' : '');
        this.storeCurrentTime();
        this.audio.pause();
        this.isPlaying = false;
        localStorage.setItem(this.storageKey, 'paused');
        this.updateButtons();
        console.log('Audio paused by user at time:', this.audio.currentTime);
    }
    
    resumeAudio() {
        if (!this.audio || this.audioStartPromise || this.isNavigating) return;
        
        console.log('User requested audio resume (or auto-resume)', this.isIPhone ? '(iPhone)' : '');
        
        const storedTime = localStorage.getItem(this.timeKey);
        if (storedTime && parseFloat(storedTime) > 0 && 
            Math.abs(this.audio.currentTime - parseFloat(storedTime)) > 1) {
            this.setAudioTime(parseFloat(storedTime));
        }
        
        if (this.audio.muted && (this.hasUserInteracted || localStorage.getItem('door_user_interacted') === 'true')) {
            this.audio.muted = false;
            console.log('Audio unmuted for resume', this.isIPhone ? '(iPhone)' : '');
        }
        
        this.audioStartPromise = this.audio.play()
            .then(() => {
                this.isPlaying = true;
                localStorage.setItem(this.storageKey, 'playing');
                this.updateButtons();
                this.audioStartPromise = null;
                console.log('Audio resumed at time:', this.audio.currentTime, this.isIPhone ? '(iPhone)' : '');
            })
            .catch(error => {
                console.error('Failed to resume audio:', error, this.isIPhone ? '(iPhone)' : '');
                this.audioStartPromise = null;
                if (!this.hasUserInteracted && !this.interactionListenersActive) {
                    this.setupUserInteractionListeners();
                }
                this.updateButtons();
            });
            
        return this.audioStartPromise;
    }
    
    toggle() {
        console.log('Audio toggle button clicked - Current state:', this.isPlaying, 'Paused:', this.audio?.paused, this.isIPhone ? '(iPhone)' : '');
        
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
                
                if (this.isIPhone && !this.hasUserInteracted) {
                    button.title = 'Tap anywhere to start music';
                }
            }
        });
        
        console.log('Audio buttons updated - Playing:', this.isPlaying, 'Actually playing:', this.audio && !this.audio.paused);
    }
}

// =============== ENHANCED ROTATING DOOR ENTRY SYSTEM FOR IPHONE ===============
class RotatingDoorEntry {
    constructor() {
        this.letters = ['D', 'O1', 'O2', 'R'];
        this.currentActiveIndex = -1;
        this.rotationInterval = null;
        this.rotationDelay = 3000;
        this.doorLinks = [];
        this.isInitialized = false;
        this.attemptCount = 0;
        this.isIPhone = this.detectIPhone();
        this.isMobile = this.detectMobile();
        
        // Enhanced quotes for iPhone users
        this.doorLockQuotes = [
            "I'm not locked out, I'm just testing the security system... unsuccessfully.",
            "The door is locked, but my Wi-Fi password is still 'password123' - priorities, people!",
            "Door is locked, but so is my motivation to find the right key.",
            "I have a key to every door... except the one I'm standing in front of right now.",
            "My door is very security-conscious. It doesn't even trust me, and I pay the rent!",
            "Door is locked, but my ability to make poor decisions remains wide open.",
            "Like a locksmith, except instead of opening doors, I just stand outside them looking confused.",
            "The definition of optimism: carrying only one key and hoping it's the right one.",
            "Door thinks it's Fort Knox, but really it's just keeping out someone who can't remember where they put their keys five minutes ago.",
            "Even my iPhone unlocks faster than this door... and that's saying something!"
        ];
        
        this.init();
    }
    
    detectIPhone() {
        return /iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }
    
    init() {
        if (this.isInitialized) return;
        
        const splashPage = document.getElementById('splashPage');
        if (!splashPage) return;
        
        console.log('Initializing Enhanced Door Entry System - Mobile:', this.isMobile, 'iPhone:', this.isIPhone);
        
        // Get all door links
        this.doorLinks = Array.from(document.querySelectorAll('.door-gallery a'));
        
        if (this.doorLinks.length === 0) {
            console.warn('No door links found');
            return;
        }
        
        // Add iPhone-optimized click handlers
        this.setupDoorClickHandlers();
        
        // Start the rotation
        this.startRotation();
        
        // Set initial active letter
        this.rotateActiveLetter();
        
        // Ensure quote elements exist
        this.ensureQuoteElements();
        
        this.isInitialized = true;
        console.log('Enhanced Door Entry System initialized');
    }
    
    ensureQuoteElements() {
        let quoteSection = document.getElementById('quoteResponses');
        let quoteText = document.getElementById('quoteText');
        
        if (!quoteSection || !quoteText) {
            console.log('Creating missing quote elements for mobile...');
            
            if (!quoteSection) {
                quoteSection = document.createElement('div');
                quoteSection.id = 'quoteResponses';
                quoteSection.className = 'quote-responses';
                quoteSection.setAttribute('role', 'status');
                quoteSection.setAttribute('aria-live', 'polite');
                quoteSection.setAttribute('aria-atomic', 'true');
                document.body.appendChild(quoteSection);
            }
            
            if (!quoteText) {
                quoteText = document.createElement('div');
                quoteText.id = 'quoteText';
                quoteText.className = 'quote-text';
                quoteSection.appendChild(quoteText);
            }
            
            console.log('Quote elements created successfully');
        }
    }
    
    setupDoorClickHandlers() {
        console.log('Setting up enhanced door handlers - Mobile:', this.isMobile, 'iPhone:', this.isIPhone);
        
        this.doorLinks.forEach((link, index) => {
            // Remove existing click handlers
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            this.doorLinks[index] = newLink;
            
            // Universal click handler for all devices
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Door clicked (universal): ${this.letters[index]} (index: ${index})`);
                this.handleDoorClick(index);
            });
            
            // Enhanced mobile touch handlers
            if (this.isMobile) {
                let touchStartTime = 0;
                let touchStartY = 0;
                let touchStartX = 0;
                let touchMoved = false;
                
                newLink.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                    if (e.touches && e.touches[0]) {
                        touchStartY = e.touches[0].clientY;
                        touchStartX = e.touches[0].clientX;
                    }
                    touchMoved = false;
                    
                    // Visual feedback
                    newLink.style.transform = 'scale(0.95)';
                    console.log(`Touch start on door ${this.letters[index]}`);
                }, { passive: true });
                
                newLink.addEventListener('touchmove', (e) => {
                    if (e.touches && e.touches[0]) {
                        const currentY = e.touches[0].clientY;
                        const currentX = e.touches[0].clientX;
                        const moveY = Math.abs(currentY - touchStartY);
                        const moveX = Math.abs(currentX - touchStartX);
                        
                        if (moveY > 20 || moveX > 20) {
                            touchMoved = true;
                            newLink.style.transform = ''; // Remove scale
                        }
                    }
                }, { passive: true });
                
                newLink.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Reset visual feedback
                    setTimeout(() => {
                        newLink.style.transform = '';
                    }, 150);
                    
                    const touchDuration = Date.now() - touchStartTime;
                    
                    // Only trigger if it's a proper tap
                    if (!touchMoved && touchDuration < 800) {
                        console.log(`Mobile tap detected: Door ${this.letters[index]} (index: ${index})`);
                        this.handleDoorClick(index);
                    } else {
                        console.log(`Mobile tap ignored - moved: ${touchMoved}, duration: ${touchDuration}ms`);
                    }
                }, { passive: false });
            }
        });
        
        console.log('Enhanced door handlers set up for', this.doorLinks.length, 'doors');
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
            
            // iPhone-optimized timing
            setTimeout(() => {
                statusMessage.style.display = 'none';
                this.navigateToMainSite();
            }, this.isIPhone ? 2500 : 2000);
        }
    }
    
    showAutoAccess() {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = this.isIPhone ? 
                'Welcome! Your persistence is recognized.' : 
                'Welcome! The door recognizes your persistence.';
            statusMessage.className = 'status-message granted';
            statusMessage.style.display = 'block';
            console.log('Showing auto-access message after 3 attempts');
            
            setTimeout(() => {
                statusMessage.style.display = 'none';
                this.navigateToMainSite();
            }, this.isIPhone ? 3000 : 2500);
        }
    }
    
    showRandomQuote() {
        console.log('Enhanced showRandomQuote() called - Mobile:', this.isMobile, 'iPhone:', this.isIPhone);
        
        const quoteSection = document.getElementById('quoteResponses');
        const quoteText = document.getElementById('quoteText');
        
        console.log('Quote elements found:', {
            quoteSection: !!quoteSection,
            quoteText: !!quoteText,
            sectionDisplay: quoteSection?.style.display,
            sectionClass: quoteSection?.className
        });
        
        if (quoteSection && quoteText) {
            const randomQuote = this.getRandomQuote();
            console.log('Setting quote text to:', randomQuote);
            
            // Enhanced mobile quote display
            quoteText.textContent = randomQuote;
            quoteText.innerHTML = randomQuote; // Fallback
            
            // Force visibility with multiple approaches
            quoteSection.style.setProperty('display', 'block', 'important');
            quoteSection.style.setProperty('visibility', 'visible', 'important');
            quoteSection.style.setProperty('opacity', '1', 'important');
            quoteSection.style.setProperty('z-index', '99999', 'important');
            quoteSection.className = 'quote-responses show';
            
            // Mobile-specific positioning fixes
            if (this.isMobile) {
                quoteSection.style.setProperty('position', 'fixed', 'important');
                quoteSection.style.setProperty('bottom', '20px', 'important');
                quoteSection.style.setProperty('left', '15px', 'important');
                quoteSection.style.setProperty('right', '15px', 'important');
                quoteSection.style.setProperty('transform', 'translateZ(0)', 'important'); // Hardware acceleration
                quoteSection.style.setProperty('background', '#000000', 'important');
                quoteSection.style.setProperty('color', '#ffffff', 'important');
                quoteSection.style.setProperty('padding', '20px', 'important');
                quoteSection.style.setProperty('border-radius', '12px', 'important');
                quoteSection.style.setProperty('border', '2px solid #ffffff', 'important');
                quoteSection.style.setProperty('text-align', 'center', 'important');
                quoteSection.style.setProperty('font-size', '16px', 'important');
                quoteSection.style.setProperty('line-height', '1.4', 'important');
                quoteSection.style.setProperty('box-shadow', '0 5px 20px rgba(255, 255, 255, 0.4)', 'important');
                quoteSection.style.setProperty('font-family', 'Georgia, serif', 'important');
                
                // Force reflow on mobile
                quoteSection.offsetHeight;
            }
            
            console.log('Quote should now be visible:', {
                text: randomQuote,
                display: quoteSection.style.display,
                visibility: quoteSection.style.visibility,
                opacity: quoteSection.style.opacity,
                className: quoteSection.className,
                isMobile: this.isMobile
            });
            
            // Enhanced timeout with mobile consideration
            const displayDuration = this.isMobile ? 6000 : 4000; // Longer for mobile
            
            setTimeout(() => {
                console.log('Hiding quote after', displayDuration + 'ms');
                quoteSection.style.setProperty('display', 'none', 'important');
                quoteSection.style.setProperty('opacity', '0', 'important');
                quoteSection.className = 'quote-responses';
            }, displayDuration);
            
        } else {
            console.error('Quote elements not found - attempting to create them');
            this.ensureQuoteElements();
            // Try again after creating elements
            setTimeout(() => this.showRandomQuote(), 100);
        }
    }
    
    navigateToMainSite() {
        console.log('Navigating to main site...', this.isIPhone ? '(iPhone)' : '');
        
        // Prepare audio for navigation
        if (window.doorAudio) {
            window.doorAudio.prepareForNavigation();
        }
        
        // iPhone-optimized navigation timing
        setTimeout(() => {
            this.hideSplash();
        }, this.isIPhone ? 400 : 300);
    }
    
    hideSplash() {
        const splashPage = document.getElementById('splashPage');
        const mainSite = document.getElementById('mainSite');
        
        if (splashPage && mainSite) {
            splashPage.classList.add('hidden');
            mainSite.classList.add('active');
            
            setTimeout(() => {
                splashPage.style.display = 'none';
            }, this.isIPhone ? 1500 : 1200);
            
            console.log('Splash hidden, main site active', this.isIPhone ? '(iPhone)' : '');
        }
    }
    
    rotateActiveLetter() {
        // Remove active class from current door
        if (this.currentActiveIndex >= 0 && this.doorLinks[this.currentActiveIndex]) {
            this.doorLinks[this.currentActiveIndex].classList.remove('door-active');
        }
        
        // Select random new active door
        const newActiveIndex = Math.floor(Math.random() * this.letters.length);
        
        // Ensure we don't pick the same door twice in a row
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
        this.stopRotation();
        
        this.rotationInterval = setInterval(() => {
            this.rotateActiveLetter();
        }, this.rotationDelay);
        
        console.log(`Door rotation started (every ${this.rotationDelay}ms)`, this.isIPhone ? '(iPhone optimized)' : '');
    }
    
    stopRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
            console.log('Door rotation stopped');
        }
    }
    
    setRotationSpeed(milliseconds) {
        this.rotationDelay = milliseconds;
        if (this.rotationInterval) {
            this.startRotation();
        }
    }
    
    resetAttempts() {
        this.attemptCount = 0;
        console.log('Attempt count reset to 0');
    }
    
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

// =============== ENHANCED GALLERY SYSTEM FOR IPHONE ===============
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
        this.isIPhone = this.detectIPhone();
        
        if (this.totalSlides > 0) {
            this.init();
        }
    }
    
    detectIPhone() {
        return /iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    init() {
        console.log(`Gallery ${this.galleryId} - Initializing with ${this.totalSlides} slides`, this.isIPhone ? '(iPhone)' : '');
        
        this.setupEventListeners();
        this.updateGallery();
        this.startAutoPlay();
    }
    
    setupEventListeners() {
        // Enhanced dot navigation for iPhone
        this.dots.forEach((dot, index) => {
            // Convert spans to buttons for better iPhone accessibility
            if (dot.tagName !== 'BUTTON') {
                const button = document.createElement('button');
                button.className = dot.className;
                button.setAttribute('role', 'tab');
                button.setAttribute('aria-label', `Go to slide ${index + 1}`);
                button.setAttribute('type', 'button');
                if (dot.classList.contains('active')) {
                    button.setAttribute('aria-selected', 'true');
                    button.setAttribute('tabindex', '0');
                } else {
                    button.setAttribute('aria-selected', 'false');
                    button.setAttribute('tabindex', '-1');
                }
                
                button.addEventListener('click', () => this.goToSlide(index));
                dot.parentNode.replaceChild(button, dot);
                this.dots[index] = button;
            } else {
                dot.addEventListener('click', () => this.goToSlide(index));
            }
            
            this.dots[index].addEventListener('keydown', (e) => {
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
            // iPhone-optimized hover/focus handling
            if (!this.isIPhone) {
                container.addEventListener('mouseenter', this.throttle(() => {
                    this.pauseAutoPlay();
                }, 100));
                
                container.addEventListener('mouseleave', this.throttle(() => {
                    this.resumeAutoPlay();
                }, 100));
            }
            
            container.addEventListener('focusin', () => this.pauseAutoPlay());
            container.addEventListener('focusout', () => {
                setTimeout(() => this.resumeAutoPlay(), 100);
            });
        }
        
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        const container = document.querySelector(`#${this.galleryId}`);
        if (!container) return;
        
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let isDragging = false;
        let isHorizontalSwipe = false;
        
        // iPhone-optimized touch events
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
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
                
                // iPhone-optimized swipe detection
                if (absX > 20 || absY > 20) {
                    isHorizontalSwipe = absX > absY && absX > (this.isIPhone ? 40 : 30);
                }
            }
            
            if (isHorizontalSwipe && Math.abs(deltaX) > 15) {
                e.preventDefault();
            }
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - startX;
            const touchDuration = Date.now() - startTime;
            
            container.classList.remove('swiping');
            isDragging = false;
            
            // iPhone-optimized swipe thresholds
            const swipeThreshold = this.isIPhone ? 60 : 50;
            const maxSwipeTime = this.isIPhone ? 600 : 500;
            
            if (isHorizontalSwipe && 
                Math.abs(deltaX) > swipeThreshold && 
                touchDuration < maxSwipeTime) {
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
            // iPhone gets slightly longer autoplay delay
            const delay = this.isIPhone ? this.autoPlayDelay + 1000 : this.autoPlayDelay;
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, delay);
            this.isPlaying = true;
            this.isPaused = false;
            console.log(`Gallery ${this.galleryId} - Auto-play started`, this.isIPhone ? '(iPhone - extended delay)' : '');
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

// =============== IPHONE-OPTIMIZED MOBILE MENU CLASS ===============
class MobileMenu {
    constructor() {
        this.isOpen = false;
        this.isIPhone = this.detectIPhone();
        this.menuButton = null;
        this.navLinks = null;
        this.lastFocusedElement = null;
        
        this.init();
    }
    
    detectIPhone() {
        return /iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    init() {
        this.menuButton = document.querySelector('.mobile-menu');
        this.navLinks = document.getElementById('navLinks');
        
        if (!this.menuButton || !this.navLinks) return;
        
        console.log('Initializing iPhone-optimized mobile menu...');
        
        // Enhanced event listeners
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.setupClickOutsideHandler();
    }
    
    setupEventListeners() {
        // iPhone-optimized touch handling
        if (this.isIPhone) {
            let touchStartTime = 0;
            
            this.menuButton.addEventListener('touchstart', () => {
                touchStartTime = Date.now();
            }, { passive: true });
            
            this.menuButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                const touchDuration = Date.now() - touchStartTime;
                
                if (touchDuration < 300) { // Quick tap
                    this.toggle();
                }
            }, { passive: false });
        } else {
            this.menuButton.addEventListener('click', () => this.toggle());
        }
        
        // Close menu when clicking nav links
        const navLinkElements = this.navLinks.querySelectorAll('a');
        navLinkElements.forEach(link => {
            link.addEventListener('click', () => {
                this.close();
            });
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                this.menuButton.focus();
            }
            
            // iPhone-specific keyboard handling
            if (this.isIPhone && e.key === 'Enter' && e.target === this.menuButton) {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    setupClickOutsideHandler() {
        document.addEventListener('click', (e) => {
            if (!this.isOpen) return;
            
            if (e.target.closest('.nav-container, .mobile-menu')) {
                return;
            }
            
            if (e.target.closest('input, textarea, select, button, [tabindex]')) {
                return;
            }
            
            this.close();
        });
        
        // iPhone-specific touch outside handler
        if (this.isIPhone) {
            document.addEventListener('touchend', (e) => {
                if (!this.isOpen) return;
                
                if (e.target.closest('.nav-container, .mobile-menu, .nav-links')) {
                    return;
                }
                
                this.close();
            }, { passive: true });
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        if (this.isOpen) return;
        
        this.lastFocusedElement = document.activeElement;
        
        this.navLinks.classList.add('active');
        this.menuButton.classList.add('active');
        this.menuButton.setAttribute('aria-expanded', 'true');
        
        document.body.classList.add('menu-open');
        
        // iPhone-optimized focus management
        const firstLink = this.navLinks.querySelector('a');
        if (firstLink) {
            setTimeout(() => firstLink.focus(), this.isIPhone ? 200 : 100);
        }
        
        this.isOpen = true;
        console.log('Mobile menu opened', this.isIPhone ? '(iPhone)' : '');
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.navLinks.classList.remove('active');
        this.menuButton.classList.remove('active');
        this.menuButton.setAttribute('aria-expanded', 'false');
        
        document.body.classList.remove('menu-open');
        
        // Restore focus
        if (this.lastFocusedElement && this.lastFocusedElement.focus) {
            this.lastFocusedElement.focus();
        }
        
        this.isOpen = false;
        console.log('Mobile menu closed', this.isIPhone ? '(iPhone)' : '');
    }
}

// =============== IPHONE-OPTIMIZED VIEWPORT HANDLER ===============
class ViewportHandler {
    constructor() {
        this.isIPhone = this.detectIPhone();
        this.lastHeight = window.innerHeight;
        this.resizeTimeout = null;
        
        this.init();
    }
    
    detectIPhone() {
        return /iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    init() {
        console.log('Initializing iPhone-optimized viewport handler...');
        this.setViewportHeight();
        this.setupEventListeners();
    }
    
    setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        if (this.isIPhone) {
            // Additional iPhone-specific viewport handling
            const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top');
            const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom');
            
            console.log('iPhone viewport updated:', {
                vh: vh + 'px',
                height: window.innerHeight + 'px',
                safeAreaTop,
                safeAreaBottom
            });
        }
    }
    
    setupEventListeners() {
        const debouncedSetViewportHeight = this.debounce(() => {
            if (!window.doorAudio?.isNavigating) {
                this.setViewportHeight();
            }
        }, this.isIPhone ? 200 : 150);
        
        window.addEventListener('resize', debouncedSetViewportHeight);
        
        // iPhone-specific orientation change handling
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (!window.doorAudio?.isNavigating) {
                    this.setViewportHeight();
                }
            }, this.isIPhone ? 300 : 200);
        });
        
        // iPhone-specific viewport handling for keyboard
        if (this.isIPhone) {
            window.addEventListener('resize', () => {
                const currentHeight = window.innerHeight;
                const heightDifference = this.lastHeight - currentHeight;
                
                // Detect iPhone keyboard
                if (heightDifference > 150) {
                    document.body.classList.add('keyboard-open');
                } else if (heightDifference < -150) {
                    document.body.classList.remove('keyboard-open');
                }
                
                this.lastHeight = currentHeight;
            });
        }
    }
    
    debounce(func, wait, immediate) {
        return (...args) => {
            const context = this;
            const later = () => {
                this.resizeTimeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !this.resizeTimeout;
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
}

// =============== GLOBAL VARIABLES ===============
let currentSlide = 0;
let slideInterval = null;
let isAudioPlaying = false;

// Global instances
window.doorAudio = null;
window.doorGalleries = {};
window.rotatingDoorEntry = null;
window.mobileMenu = null;
window.viewportHandler = null;

// =============== DOCUMENT READY & INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Door - Initializing iPhone-optimized systems...');
    
    // Add mobile quote CSS
    addMobileQuoteCSS();
    
    // Initialize audio system FIRST for quietstorm at launch
    window.doorAudio = new DoorAudio();
    
    // Initialize rotating door entry system
    window.rotatingDoorEntry = new RotatingDoorEntry();
    
    // Initialize iPhone-optimized mobile menu
    window.mobileMenu = new MobileMenu();
    
    // Initialize viewport handler
    window.viewportHandler = new ViewportHandler();
    
    // Initialize other functionality
    initGalleries();
    initSplashPage();
    initKeyboardNavigation();
    initAccessibilityFeatures();
    initIPhoneOptimizations();
    
    if ('IntersectionObserver' in window) {
        initLazyLoading();
    }
    
    console.log('Door - All iPhone-optimized systems initialized!');
});

// =============== ADD MOBILE QUOTE CSS ===============
function addMobileQuoteCSS() {
    const mobileQuoteCSS = `
    /* Enhanced Mobile Quote Styles */
    @media (max-width: 768px) {
        .quote-responses {
            position: fixed !important;
            bottom: 20px !important;
            left: 15px !important;
            right: 15px !important;
            background: #000000 !important;
            color: #ffffff !important;
            padding: 20px !important;
            border-radius: 12px !important;
            border: 2px solid #ffffff !important;
            text-align: center !important;
            font-size: 16px !important;
            line-height: 1.4 !important;
            display: none !important;
            z-index: 99999 !important;
            box-shadow: 0 5px 20px rgba(255, 255, 255, 0.4) !important;
            font-family: 'Georgia', serif !important;
            margin: 0 !important;
            max-width: none !important;
            width: calc(100% - 30px) !important;
            transform: translateZ(0) !important;
            backface-visibility: hidden !important;
            -webkit-backface-visibility: hidden !important;
        }
        
        .quote-responses.show {
            display: block !important;
            animation: mobileQuoteFadeIn 0.4s ease-out !important;
        }
        
        @keyframes mobileQuoteFadeIn {
            0% {
                opacity: 0;
                transform: translateY(30px) translateZ(0) scale(0.9);
            }
            100% {
                opacity: 1;
                transform: translateY(0) translateZ(0) scale(1);
            }
        }
        
        .quote-text {
            font-style: italic !important;
            font-weight: normal !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #ffffff !important;
            font-size: 16px !important;
            line-height: 1.4 !important;
        }
    }
    `;

    // Apply mobile quote CSS
    if (!document.getElementById('mobile-quote-styles')) {
        const style = document.createElement('style');
        style.id = 'mobile-quote-styles';
        style.textContent = mobileQuoteCSS;
        document.head.appendChild(style);
        console.log('Mobile quote CSS added');
    }
}

// =============== IPHONE-SPECIFIC OPTIMIZATIONS ===============
function initIPhoneOptimizations() {
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (!isIPhone) return;
    
    console.log('Applying iPhone-specific optimizations...');
    
    // Prevent zoom on form focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type !== 'submit' && input.type !== 'button') {
            // Ensure font-size is at least 16px to prevent zoom
            const computedStyle = window.getComputedStyle(input);
            const fontSize = parseInt(computedStyle.fontSize);
            if (fontSize < 16) {
                input.style.fontSize = '18px';
            }
        }
    });
    
    // iPhone-specific scroll optimization
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Prevent iPhone bounce scroll on body
    document.body.addEventListener('touchmove', (e) => {
        if (e.target === document.body || e.target === document.documentElement) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // iPhone-specific audio button enhancement
    const audioButtons = document.querySelectorAll('.audio-toggle, .splash-audio-toggle');
    audioButtons.forEach(button => {
        button.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: true });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleAudio(e);
        }, { passive: false });
    });
    
    // Enhanced iPhone door interaction
    const doorLinks = document.querySelectorAll('.door-gallery a');
    doorLinks.forEach(link => {
        // Add visual feedback for iPhone
        link.addEventListener('touchstart', () => {
            link.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        link.addEventListener('touchend', () => {
            setTimeout(() => {
                link.style.transform = '';
            }, 150);
        }, { passive: true });
    });
    
    console.log('iPhone optimizations applied');
}

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

// =============== MOBILE MENU FUNCTIONS ===============
function toggleMobileMenu() {
    if (window.mobileMenu) {
        window.mobileMenu.toggle();
    } else {
        console.warn('Mobile menu system not initialized');
    }
}

function openMobileMenu() {
    if (window.mobileMenu) {
        window.mobileMenu.open();
    }
}

function closeMobileMenu() {
    if (window.mobileMenu) {
        window.mobileMenu.close();
    }
}

// =============== UPDATED SPLASH PAGE - iPhone Optimized ===============
function initSplashPage() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (!splashPage) return;
    
    console.log('Initializing iPhone-optimized splash page with rotating door entry...');
    
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // iPhone-specific splash optimizations
    if (isIPhone) {
        // Prevent default touch behaviors on splash
        splashPage.addEventListener('touchmove', (e) => {
            // Allow scrolling only within specific elements
            if (!e.target.closest('.nav-links, .quote-responses')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Enhanced iPhone gesture handling
        splashPage.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.door-gallery a, .splash-audio-toggle')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // Keyboard navigation for accessibility (Enter key on active door)
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
    
    console.log('iPhone-optimized splash page initialized');
}

function hideSplash() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (splashPage && mainSite) {
        splashPage.classList.add('hidden');
        mainSite.classList.add('active');
        
        const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        setTimeout(() => {
            splashPage.style.display = 'none';
        }, isIPhone ? 1500 : 1200);
        
        console.log('Splash hidden, main site active', isIPhone ? '(iPhone)' : '');
    }
}

// =============== ENHANCED KEYBOARD NAVIGATION FOR IPHONE ===============
function initKeyboardNavigation() {
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    document.addEventListener('keydown', (e) => {
        // iPhone-specific spacebar handling
        if (e.key === ' ' && e.target === document.body) {
            if (!isIPhone || !document.activeElement || document.activeElement === document.body) {
                e.preventDefault();
                toggleAudio();
            }
        }
        
        // Enhanced mobile menu keyboard support for iPhone
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mobile-menu')) {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggleMobileMenu();
            }
        }
        
        // Gallery keyboard navigation
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
    
    console.log('iPhone-optimized keyboard navigation initialized');
}

// =============== ENHANCED ACCESSIBILITY FOR IPHONE ===============
function initAccessibilityFeatures() {
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Enhanced anchor link behavior for iPhone
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
                
                // iPhone-specific focus handling
                if (isIPhone) {
                    setTimeout(() => target.focus(), 100);
                } else {
                    target.focus();
                }
            }
        });
    });
    
    // Enhanced skip link for iPhone
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
    
    // iPhone-specific accessibility enhancements
    if (isIPhone) {
        // Enhance button accessibility
        const buttons = document.querySelectorAll('button:not([aria-label]):not([title])');
        buttons.forEach(button => {
            if (button.textContent.trim()) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });
        
        // Enhanced focus management for iPhone
        document.addEventListener('focusin', (e) => {
            if (e.target.closest('.nav-links') && window.mobileMenu?.isOpen) {
                e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
    }
    
    console.log('iPhone-enhanced accessibility features initialized');
}

// =============== ENHANCED LAZY LOADING FOR IPHONE ===============
function initLazyLoading() {
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.setAttribute('data-loading', 'false');
                    observer.unobserve(img);
                    console.log('Lazy loaded:', img.alt || img.src, isIPhone ? '(iPhone)' : '');
                }
            }
        });
    }, {
        rootMargin: isIPhone ? '100px' : '50px' // Larger margin for iPhone
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.setAttribute('data-loading', 'true');
        imageObserver.observe(img);
    });
    
    console.log('iPhone-optimized lazy loading initialized');
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

function isMobileMultiTouch(e) {
    return e.touches && e.touches.length > 1;
}

function isIPhoneDevice() {
    return /iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// =============== ERROR HANDLING ===============
window.addEventListener('error', (e) => {
    const isIPhone = isIPhoneDevice();
    console.error('Door - JavaScript error:', e.error, isIPhone ? '(iPhone)' : '');
    
    if (e.error.message.includes('audio') && window.doorAudio) {
        console.log('Attempting audio system recovery...', isIPhone ? '(iPhone)' : '');
        setTimeout(() => {
            try {
                window.doorAudio.updateButtons();
            } catch (recoveryError) {
                console.error('Audio recovery failed:', recoveryError, isIPhone ? '(iPhone)' : '');
            }
        }, isIPhone ? 1500 : 1000);
    }
});

window.addEventListener('unhandledrejection', (e) => {
    const isIPhone = isIPhoneDevice();
    console.error('Door - Unhandled promise rejection:', e.reason, isIPhone ? '(iPhone)' : '');
});

// =============== PERFORMANCE MONITORING ===============
if ('performance' in window) {
    window.addEventListener('load', () => {
        const isIPhone = isIPhoneDevice();
        const loadTime = Math.round(performance.now());
        console.log(`Door - Page loaded in ${loadTime}ms`, isIPhone ? '(iPhone optimized)' : '');
        
        if (performance.navigation) {
            const navType = performance.navigation.type;
            const navTypes = ['navigate', 'reload', 'back_forward', 'reserved'];
            console.log(`Navigation type: ${navTypes[navType] || 'unknown'}`, isIPhone ? '(iPhone)' : '');
        }
        
        // iPhone-specific performance metrics
        if (isIPhone && 'memory' in performance) {
            console.log('iPhone memory usage:', {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
            });
        }
    });
}

// =============== IPHONE-ENHANCED DEVELOPMENT HELPERS ===============
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('dev')) {
    
    const isIPhone = isIPhoneDevice();
    console.log('Door - Development mode active', isIPhone ? '(iPhone detected)' : '');
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case 'a':
                    e.preventDefault();
                    toggleAudio();
                    console.log('Dev: Audio toggled', isIPhone ? '(iPhone)' : '');
                    break;
                case 's':
                    e.preventDefault();
                    hideSplash();
                    console.log('Dev: Splash hidden', isIPhone ? '(iPhone)' : '');
                    break;
                case 'r':
                    e.preventDefault();
                    localStorage.removeItem('door_audio_state');
                    localStorage.removeItem('door_audio_time');
                    localStorage.removeItem('door_user_interacted');
                    console.log('Dev: Audio state reset', isIPhone ? '(iPhone)' : '');
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
                        window.rotatingDoorEntry.setRotationSpeed(1000);
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
                    console.log('Dev: iPhone-optimized system info:', {
                        isIPhone: isIPhone,
                        deviceInfo: {
                            userAgent: navigator.userAgent,
                            platform: navigator.platform,
                            maxTouchPoints: navigator.maxTouchPoints,
                            viewport: {
                                width: window.innerWidth,
                                height: window.innerHeight
                            }
                        },
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
                        attemptCount: window.rotatingDoorEntry?.attemptCount,
                        mobileMenuOpen: window.mobileMenu?.isOpen
                    });
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMobileMenu();
                    console.log('Dev: Mobile menu toggled', isIPhone ? '(iPhone)' : '');
                    break;
                case 'v':
                    e.preventDefault();
                    if (window.viewportHandler) {
                        window.viewportHandler.setViewportHeight();
                        console.log('Dev: Viewport height refreshed', isIPhone ? '(iPhone)' : '');
                    }
                    break;
            }
        }
    });
    
    // iPhone-enhanced debug tools
    window.doorDebug = {
        audio: () => window.doorAudio,
        galleries: () => window.doorGalleries,
        doorEntry: () => window.rotatingDoorEntry,
        mobileMenu: () => window.mobileMenu,
        viewport: () => window.viewportHandler,
        isIPhone: () => isIPhone,
        deviceInfo: () => ({
            isIPhone: isIPhone,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            maxTouchPoints: navigator.maxTouchPoints,
            screen: {
                width: screen.width,
                height: screen.height,
                orientation: screen.orientation?.angle || 'unknown'
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                vh: getComputedStyle(document.documentElement).getPropertyValue('--vh')
            },
            safeAreas: {
                top: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top'),
                bottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom'),
                left: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-left'),
                right: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-right')
            }
        }),
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
        mobileMenuState: () => window.mobileMenu?.isOpen || false,
        setDoorSpeed: (ms) => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.setRotationSpeed(ms);
                console.log(`Door rotation speed set to ${ms}ms`);
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
        testAutoAccess: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.attemptCount = 2;
                console.log('Dev: Set to trigger auto-access on next wrong click');
            }
        },
        refreshViewport: () => {
            if (window.viewportHandler) {
                window.viewportHandler.setViewportHeight();
            }
        }
    };
    
    console.log('iPhone-enhanced dev tools available: window.doorDebug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
🍎 Door Restaurant - IPHONE OPTIMIZED WITH MOBILE QUOTES 🍎
✅ IPHONE SAFE AREAS: Dynamic Island + Home Indicator support
📱 TOUCH TARGETS: 44-48px minimum for all interactive elements  
🔤 TYPOGRAPHY: 18px body text, proper font hierarchy
🎵 AUDIO SYSTEM: iPhone autoplay policy compliant
🍔 MOBILE MENU: Enhanced 48px touch target with smooth overlay
🎯 DOOR SYSTEM: iPhone-optimized touch detection
🖼️ GALLERY: Enhanced swipe gestures for iPhone
⌨️ KEYBOARD: iPhone-compatible navigation
🎲 RANDOM QUOTES: Fixed mobile display + iPhone timing
🔄 VIEWPORT: Dynamic height handling for iPhone keyboards
📏 RESPONSIVE: iPhone 14/15 series optimized (390px-430px)
🎨 PERFORMANCE: Hardware acceleration for smooth iPhone experience

NEW: Mobile Quote System Fixed!
• Enhanced mobile device detection
• Improved touch event handling for door clicks
• Fallback creation of quote elements if missing  
• Mobile-specific quote display CSS
• Longer display duration on mobile (6 seconds vs 4)
• Force visibility with multiple CSS approaches
• Hardware acceleration for smooth animations

Dev Tools: Ctrl+Shift+V (viewport refresh), window.doorDebug.deviceInfo()
Philosophy: "Every iPhone deserves a beautiful experience" 📱✨
`);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DoorAudio,
        DoorGallery,
        RotatingDoorEntry,
        MobileMenu,
        ViewportHandler,
        toggleAudio,
        nextSlide,
        previousSlide,
        goToSlide,
        toggleMobileMenu,
        openMobileMenu,
        closeMobileMenu,
        isIPhoneDevice
    };
    }

// =============== MOBILE QUOTE FIX - ADDITIONAL ENHANCEMENT ===============

// Enhanced Mobile Device Detection
function isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const smallScreen = window.innerWidth <= 768;
    
    const isMobile = touchDevice || mobileUA || smallScreen;
    console.log('Mobile Detection:', { isMobile, touchDevice, mobileUA, smallScreen, width: window.innerWidth });
    return isMobile;
}

// Force Create Quote Elements for Mobile
function forceCreateQuoteElements() {
    console.log('Force creating quote elements for mobile...');
    
    // Remove existing elements
    const existing = document.getElementById('quoteResponses');
    if (existing) {
        existing.remove();
    }
    
    // Create new quote section
    const quoteSection = document.createElement('div');
    quoteSection.id = 'quoteResponses';
    quoteSection.className = 'quote-responses';
    quoteSection.setAttribute('role', 'status');
    quoteSection.setAttribute('aria-live', 'polite');
    quoteSection.setAttribute('aria-atomic', 'true');
    
    // Create quote text
    const quoteText = document.createElement('div');
    quoteText.id = 'quoteText';
    quoteText.className = 'quote-text';
    
    quoteSection.appendChild(quoteText);
    document.body.appendChild(quoteSection);
    
    console.log('Quote elements force-created:', {
        section: !!document.getElementById('quoteResponses'),
        text: !!document.getElementById('quoteText')
    });
    
    return { quoteSection, quoteText };
}

// Enhanced Mobile Quote CSS
function addMobileQuoteCSS() {
    const existingStyle = document.getElementById('mobile-quote-fix');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const css = `
    /* MOBILE QUOTE FIX - Override all existing styles */
    @media screen and (max-width: 768px) {
        .quote-responses {
            position: fixed !important;
            bottom: 30px !important;
            left: 20px !important;
            right: 20px !important;
            width: calc(100% - 40px) !important;
            max-width: calc(100% - 40px) !important;
            background: #000000 !important;
            color: #ffffff !important;
            padding: 25px !important;
            border-radius: 15px !important;
            border: 3px solid #ffffff !important;
            text-align: center !important;
            font-size: 18px !important;
            line-height: 1.5 !important;
            font-family: 'Georgia', serif !important;
            z-index: 999999 !important;
            display: none !important;
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.5) !important;
            margin: 0 !important;
            transform: translateZ(0) !important;
            backface-visibility: hidden !important;
            -webkit-backface-visibility: hidden !important;
            -webkit-transform: translateZ(0) !important;
        }
        
        .quote-responses.show {
            display: block !important;
            animation: mobileQuoteShow 0.5s ease-out forwards !important;
        }
        
        @keyframes mobileQuoteShow {
            0% {
                opacity: 0;
                transform: translateY(50px) translateZ(0) scale(0.8);
            }
            100% {
                opacity: 1;
                transform: translateY(0) translateZ(0) scale(1);
            }
        }
        
        .quote-text {
            font-style: italic !important;
            font-weight: normal !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #ffffff !important;
            font-size: 18px !important;
            line-height: 1.5 !important;
            font-family: 'Georgia', serif !important;
        }
    }
    
    /* Force visibility on all screen sizes */
    .quote-responses.force-show {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
    }
    `;
    
    const style = document.createElement('style');
    style.id = 'mobile-quote-fix';
    style.textContent = css;
    document.head.appendChild(style);
    console.log('Mobile quote CSS injected');
}

// Enhanced Mobile Quote Display Function
function showMobileQuote(quoteText) {
    console.log('showMobileQuote called with:', quoteText);
    
    const isMobile = isMobileDevice();
    console.log('Is mobile device:', isMobile);
    
    // Ensure quote elements exist
    let quoteSection = document.getElementById('quoteResponses');
    let quoteTextElement = document.getElementById('quoteText');
    
    if (!quoteSection || !quoteTextElement) {
        console.log('Quote elements missing - force creating...');
        const created = forceCreateQuoteElements();
        quoteSection = created.quoteSection;
        quoteTextElement = created.quoteText;
    }
    
    console.log('Quote elements found/created:', {
        section: !!quoteSection,
        text: !!quoteTextElement
    });
    
    if (quoteSection && quoteTextElement) {
        // Set the quote text
        quoteTextElement.textContent = quoteText;
        quoteTextElement.innerHTML = quoteText;
        
        // Reset all styles
        quoteSection.style.cssText = '';
        
        // Force mobile styles if mobile
        if (isMobile) {
            console.log('Applying mobile-specific quote styles...');
            
            quoteSection.style.setProperty('position', 'fixed', 'important');
            quoteSection.style.setProperty('bottom', '30px', 'important');
            quoteSection.style.setProperty('left', '20px', 'important');
            quoteSection.style.setProperty('right', '20px', 'important');
            quoteSection.style.setProperty('width', 'calc(100% - 40px)', 'important');
            quoteSection.style.setProperty('max-width', 'calc(100% - 40px)', 'important');
            quoteSection.style.setProperty('background', '#000000', 'important');
            quoteSection.style.setProperty('color', '#ffffff', 'important');
            quoteSection.style.setProperty('padding', '25px', 'important');
            quoteSection.style.setProperty('border-radius', '15px', 'important');
            quoteSection.style.setProperty('border', '3px solid #ffffff', 'important');
            quoteSection.style.setProperty('text-align', 'center', 'important');
            quoteSection.style.setProperty('font-size', '18px', 'important');
            quoteSection.style.setProperty('line-height', '1.5', 'important');
            quoteSection.style.setProperty('font-family', 'Georgia, serif', 'important');
            quoteSection.style.setProperty('z-index', '999999', 'important');
            quoteSection.style.setProperty('box-shadow', '0 8px 25px rgba(255, 255, 255, 0.5)', 'important');
            quoteSection.style.setProperty('margin', '0', 'important');
            quoteSection.style.setProperty('transform', 'translateZ(0)', 'important');
            quoteSection.style.setProperty('backface-visibility', 'hidden', 'important');
            quoteSection.style.setProperty('-webkit-backface-visibility', 'hidden', 'important');
        }
        
        // Show the quote
        quoteSection.style.setProperty('display', 'block', 'important');
        quoteSection.style.setProperty('opacity', '1', 'important');
        quoteSection.style.setProperty('visibility', 'visible', 'important');
        quoteSection.className = 'quote-responses show force-show';
        
        // Force reflow
        quoteSection.offsetHeight;
        
        console.log('Quote should now be visible:', {
            display: quoteSection.style.display,
            opacity: quoteSection.style.opacity,
            visibility: quoteSection.style.visibility,
            className: quoteSection.className,
            text: quoteTextElement.textContent
        });
        
        // Debug positioning
        const rect = quoteSection.getBoundingClientRect();
        console.log('Quote position:', {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height,
            inViewport: rect.bottom > 0 && rect.top < window.innerHeight
        });
        
        // Hide after delay
        const delay = isMobile ? 6000 : 4000;
        setTimeout(() => {
            console.log('Hiding quote after', delay + 'ms');
            quoteSection.style.setProperty('display', 'none', 'important');
            quoteSection.style.setProperty('opacity', '0', 'important');
            quoteSection.className = 'quote-responses';
        }, delay);
        
    } else {
        console.error('Failed to create or find quote elements');
    }
}

// Enhanced Door Click Handler
function enhancedHandleDoorClick(clickedIndex, currentActiveIndex, attemptCount, doorLockQuotes) {
    console.log(`Enhanced door click: ${clickedIndex}, active: ${currentActiveIndex}, attempts: ${attemptCount}`);
    
    if (clickedIndex === currentActiveIndex) {
        console.log('Correct door clicked! Access granted!');
        return { action: 'grant_access', newAttemptCount: attemptCount };
    } else {
        const newAttemptCount = attemptCount + 1;
        console.log(`Wrong door clicked! Attempt ${newAttemptCount}`);
        
        if (newAttemptCount >= 3) {
            console.log('Third attempt reached - granting automatic access!');
            return { action: 'auto_access', newAttemptCount };
        } else {
            // Show random quote
            const randomIndex = Math.floor(Math.random() * doorLockQuotes.length);
            const randomQuote = doorLockQuotes[randomIndex];
            console.log('Showing mobile quote:', randomQuote);
            
            showMobileQuote(randomQuote);
            return { action: 'show_quote', newAttemptCount, quote: randomQuote };
        }
    }
}

// Override the original RotatingDoorEntry's handleDoorClick method
function overrideDoorClickHandler() {
    if (window.rotatingDoorEntry) {
        const originalHandleDoorClick = window.rotatingDoorEntry.handleDoorClick.bind(window.rotatingDoorEntry);
        
        window.rotatingDoorEntry.handleDoorClick = function(clickedIndex) {
            console.log('Overridden handleDoorClick called:', clickedIndex);
            
            const result = enhancedHandleDoorClick(
                clickedIndex, 
                this.currentActiveIndex, 
                this.attemptCount, 
                this.doorLockQuotes
            );
            
            this.attemptCount = result.newAttemptCount;
            
            switch (result.action) {
                case 'grant_access':
                    this.stopRotation();
                    this.showAccessGranted();
                    break;
                case 'auto_access':
                    this.stopRotation();
                    this.showAutoAccess();
                    break;
                case 'show_quote':
                    // Quote already shown by enhancedHandleDoorClick
                    break;
            }
        };
        
        console.log('Door click handler overridden for mobile compatibility');
    }
}

// Enhanced Touch Event Setup for Mobile
function setupMobileTouchEvents() {
    const isMobile = isMobileDevice();
    if (!isMobile) return;
    
    console.log('Setting up enhanced mobile touch events...');
    
    const doorLinks = document.querySelectorAll('.door-gallery a');
    console.log('Found door links:', doorLinks.length);
    
    doorLinks.forEach((link, index) => {
        let touchStartTime = 0;
        let touchMoved = false;
        
        // Remove existing event listeners by cloning
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        // Add enhanced touch events
        newLink.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchMoved = false;
            console.log(`Touch start on door ${index}`);
            
            // Visual feedback
            newLink.style.transform = 'scale(0.9)';
            newLink.style.opacity = '0.8';
        }, { passive: true });
        
        newLink.addEventListener('touchmove', (e) => {
            touchMoved = true;
            newLink.style.transform = '';
            newLink.style.opacity = '';
        }, { passive: true });
        
        newLink.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Reset visual feedback
            newLink.style.transform = '';
            newLink.style.opacity = '';
            
            const touchDuration = Date.now() - touchStartTime;
            
            if (!touchMoved && touchDuration < 500) {
                console.log(`Mobile door tap confirmed: index ${index}`);
                
                // Directly trigger the door click handler
                if (window.rotatingDoorEntry) {
                    window.rotatingDoorEntry.handleDoorClick(index);
                } else {
                    console.error('rotatingDoorEntry not found');
                }
            } else {
                console.log(`Touch ignored - moved: ${touchMoved}, duration: ${touchDuration}ms`);
            }
        }, { passive: false });
        
        // Also add click handler as fallback
        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Click handler triggered for door ${index}`);
            
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.handleDoorClick(index);
            }
        });
    });
    
    console.log('Mobile touch events setup complete');
}

// Initialize Mobile Fix
function initMobileFix() {
    console.log('Initializing mobile quote fix...');
    
    // Add CSS
    addMobileQuoteCSS();
    
    // Force create quote elements
    forceCreateQuoteElements();
    
    // Setup enhanced touch events
    setupMobileTouchEvents();
    
    // Override door click handler
    setTimeout(() => {
        overrideDoorClickHandler();
    }, 500);
    
    console.log('Mobile quote fix initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileFix);
} else {
    initMobileFix();
}

// Also initialize after a delay to ensure everything is loaded
setTimeout(initMobileFix, 1000);

// Debug function for testing
window.testMobileQuote = function() {
    console.log('Testing mobile quote...');
    showMobileQuote("This is a test quote for mobile devices!");
};

// Export for console testing
window.mobileFix = {
    isMobileDevice,
    showMobileQuote,
    forceCreateQuoteElements,
    addMobileQuoteCSS,
    setupMobileTouchEvents,
    initMobileFix
};
}

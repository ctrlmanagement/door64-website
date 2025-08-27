/* Door Restaurant - Complete Mobile-Optimized JavaScript */

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

// =============== ENHANCED ROTATING DOOR ENTRY SYSTEM FOR ALL MOBILE DEVICES ===============
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
        this.quoteTimeout = null;
        
        // Enhanced quotes for all mobile users
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
            "Even my phone unlocks faster than this door... and that's saying something!"
        ];
        
        this.init();
    }
    
    detectIPhone() {
        return /iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
    
    // Add comprehensive mobile detection for all devices
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               window.matchMedia('(pointer: coarse)').matches;
    }
    
    // Enhanced initialization with mobile checks
    init() {
        if (this.isInitialized) return;
        
        const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
        console.log(`[${deviceType}] Initializing Rotating Door Entry System...`);
        
        const splashPage = document.getElementById('splashPage');
        if (!splashPage) {
            console.error(`[${deviceType}] No splash page found`);
            return;
        }
        
        // Get all door links
        this.doorLinks = Array.from(document.querySelectorAll('.door-gallery a'));
        
        if (this.doorLinks.length === 0) {
            console.warn(`[${deviceType}] No door links found`);
            return;
        }
        
        console.log(`[${deviceType}] Found ${this.doorLinks.length} door links`);
        
        // Check for required DOM elements
        const quoteSection = document.getElementById('quoteResponses');
        const quoteText = document.getElementById('quoteText');
        
        console.log(`[${deviceType}] DOM Check:`, {
            splashPage: !!splashPage,
            doorLinks: this.doorLinks.length,
            quoteSection: !!quoteSection,
            quoteText: !!quoteText,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio,
            touchSupport: 'ontouchstart' in window,
            userAgent: navigator.userAgent.substring(0, 50) + '...'
        });
        
        // Setup door click handlers
        this.setupDoorClickHandlers();
        
        // Start the rotation
        this.startRotation();
        
        // Set initial active letter
        this.rotateActiveLetter();
        
        this.isInitialized = true;
        console.log(`[${deviceType}] Rotating Door Entry System initialized successfully`);
    }
    
    // Updated setupDoorClickHandlers for all mobile devices
    setupDoorClickHandlers() {
        this.doorLinks.forEach((link, index) => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            this.doorLinks[index] = newLink;
            
            if (this.isMobile) {
                // Enhanced mobile touch handling for ALL mobile devices
                let touchStartTime = 0;
                let touchStartY = 0;
                let touchMoved = false;
                
                newLink.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                    touchStartY = e.touches[0].clientY;
                    touchMoved = false;
                    e.stopPropagation();
                }, { passive: true });
                
                newLink.addEventListener('touchmove', (e) => {
                    const touchEndY = e.touches[0].clientY;
                    const verticalMovement = Math.abs(touchEndY - touchStartY);
                    if (verticalMovement > 10) {
                        touchMoved = true;
                    }
                }, { passive: true });
                
                newLink.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const touchDuration = Date.now() - touchStartTime;
                    
                    // Only trigger if it's a quick tap without movement
                    if (touchDuration < 500 && !touchMoved) {
                        console.log(`Mobile: Door ${this.letters[index]} tapped (index: ${index})`);
                        this.handleDoorClick(index);
                    }
                }, { passive: false });
                
                // Also add click as fallback for mobile browsers that need it
                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Mobile fallback: Door ${this.letters[index]} clicked`);
                    this.handleDoorClick(index);
                });
                
            } else {
                // Desktop click handler
                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Desktop: Door clicked: ${this.letters[index]} (index: ${index})`);
                    this.handleDoorClick(index);
                });
            }
        });
        
        console.log('Door click handlers set up for', this.doorLinks.length, 'doors', 
                    this.isMobile ? '(Mobile optimized)' : '(Desktop)');
    }
    
    // Enhanced handleDoorClick with mobile debugging - UPDATED TO REMOVE showAutoAccess()
    handleDoorClick(clickedIndex) {
        const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
        
        console.log(`[${deviceType}] Door ${this.letters[clickedIndex]} clicked (index: ${clickedIndex})`);
        console.log(`[${deviceType}] Active door index: ${this.currentActiveIndex}`);
        console.log(`[${deviceType}] Attempt count: ${this.attemptCount}`);
        console.log(`[${deviceType}] Viewport: ${window.innerWidth}x${window.innerHeight}`);
        
        // Log DOM elements for mobile debugging
        if (this.isMobile) {
            const quoteSection = document.getElementById('quoteResponses');
            const quoteText = document.getElementById('quoteText');
            console.log('[Mobile] Quote elements found:', {
                quoteSection: !!quoteSection,
                quoteText: !!quoteText,
                quoteSectionVisible: quoteSection ? window.getComputedStyle(quoteSection).display : 'N/A',
                quoteSectionPosition: quoteSection ? quoteSection.getBoundingClientRect() : 'N/A'
            });
        }
        
        if (clickedIndex === this.currentActiveIndex) {
            console.log(`[${deviceType}] Correct door clicked! Access granted!`);
            this.stopRotation();
            this.showAccessGranted();
        } else {
            console.log(`[${deviceType}] Wrong door clicked! Showing random quote...`);
            this.attemptCount++;
            
            if (this.attemptCount >= 3) {
                console.log(`[${deviceType}] Third attempt reached - granting automatic access!`);
                this.stopRotation();
                // UPDATED: Use showAccessGranted() instead of showAutoAccess()
                this.showAccessGranted();
            } else {
                console.log(`[${deviceType}] Calling showRandomQuote()...`);
                this.showRandomQuote();
            }
        }
    }
    
    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.doorLockQuotes.length);
        return this.doorLockQuotes[randomIndex];
    }
    
    // ENHANCED showMobileMessage for mobile message fix
    showMobileMessage(message) {
        console.log('showMobileMessage called with:', message);
        
        // Remove any existing mobile message
        const existingMessage = document.getElementById('mobileStatusMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Clear any existing timeout
        if (this.quoteTimeout) {
            clearTimeout(this.quoteTimeout);
        }
        
        // Create mobile message element
        const mobileMessage = document.createElement('div');
        mobileMessage.id = 'mobileStatusMessage';
        mobileMessage.textContent = message;
        
        // ENHANCED mobile-specific styling - fixes positioning issues
        mobileMessage.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 2147483647 !important;
            background: #000000 !important;
            color: #ffffff !important;
            padding: 30px 35px !important;
            border-radius: 16px !important;
            font-size: 20px !important;
            font-family: Georgia, serif !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
            text-align: center !important;
            max-width: 85vw !important;
            min-width: 280px !important;
            min-height: 60px !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8) !important;
            border: 3px solid #ffffff !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            isolation: isolate !important;
            contain: layout style paint !important;
            animation: mobileMessageShow 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        `;
        
        // Add the animation keyframes
        if (!document.getElementById('mobileMessageStyles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'mobileMessageStyles';
            styleSheet.textContent = `
                @keyframes mobileMessageShow {
                    0% {
                        opacity: 0 !important;
                        transform: translate(-50%, -50%) scale(0.8) !important;
                    }
                    100% {
                        opacity: 1 !important;
                        transform: translate(-50%, -50%) scale(1) !important;
                    }
                }
                
                @keyframes mobileMessageHide {
                    0% {
                        opacity: 1 !important;
                        transform: translate(-50%, -50%) scale(1) !important;
                    }
                    100% {
                        opacity: 0 !important;
                        transform: translate(-50%, -50%) scale(0.9) !important;
                    }
                }
                
                #mobileStatusMessage {
                    font-feature-settings: "kern" 1, "liga" 1 !important;
                    text-rendering: optimizeLegibility !important;
                    -webkit-font-smoothing: antialiased !important;
                    -moz-osx-font-smoothing: grayscale !important;
                }
            `;
            document.head.appendChild(styleSheet);
        }
        
        // Add to body (not splash page) for better z-index control
        document.body.appendChild(mobileMessage);
        
        console.log('Mobile message added to body with enhanced positioning');
        
        // Force a reflow to ensure styles are applied
        mobileMessage.offsetHeight;
        
        // Auto-hide after timeout with enhanced animation
        this.quoteTimeout = setTimeout(() => {
            console.log('Hiding mobile message with animation');
            mobileMessage.style.animation = 'mobileMessageHide 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            
            setTimeout(() => {
                if (mobileMessage.parentNode) {
                    mobileMessage.remove();
                    console.log('Mobile message removed from DOM');
                }
            }, 400);
        }, this.isMobile ? 3500 : 2500);
        
        // Additional safety: ensure message is visible
        setTimeout(() => {
            if (mobileMessage.parentNode) {
                const computed = window.getComputedStyle(mobileMessage);
                console.log('Mobile message computed styles:', {
                    display: computed.display,
                    opacity: computed.opacity,
                    zIndex: computed.zIndex,
                    position: computed.position,
                    visibility: computed.visibility
                });
            }
        }, 100);
    }
    
    // Use statusMessage element for quotes (same as ACCESS GRANTED)
    showRandomQuote() {
        console.log('showRandomQuote() called - device type:', this.isMobile ? (this.isIPhone ? 'iPhone' : 'Mobile') : 'Desktop');
        
        if (this.isMobile) {
            // Mobile-specific implementation
            this.showMobileMessage(this.getRandomQuote());
        } else {
            // Desktop implementation
            let statusMessage = document.getElementById('statusMessage');
            
            if (!statusMessage) {
                statusMessage = this.createStatusMessageElement();
            }
            
            if (statusMessage) {
                const randomQuote = this.getRandomQuote();
                
                if (this.quoteTimeout) {
                    clearTimeout(this.quoteTimeout);
                }
                
                statusMessage.textContent = randomQuote;
                statusMessage.className = 'status-message granted';
                statusMessage.style.display = 'block';
                
                this.quoteTimeout = setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 2000);
            }
        }
    }
    
    // ENHANCED showAccessGranted method for both correct doors AND 3rd attempt
    showAccessGranted() {
        console.log('showAccessGranted() called - device type:', this.isMobile ? (this.isIPhone ? 'iPhone' : 'Mobile') : 'Desktop');
        
        if (this.isMobile) {
            // Enhanced mobile implementation
            this.showMobileMessage('ACCESS GRANTED');
            
            // Navigate to main site after mobile display time
            setTimeout(() => {
                this.navigateToMainSite();
            }, 3800);
        } else {
            // Desktop implementation
            let statusMessage = document.getElementById('statusMessage');
            
            if (!statusMessage) {
                statusMessage = this.createStatusMessageElement();
            }
            
            if (statusMessage) {
                statusMessage.textContent = 'ACCESS GRANTED';
                statusMessage.className = 'status-message granted';
                statusMessage.style.display = 'block';
                
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                    this.navigateToMainSite();
                }, 2000);
            }
        }
    }
    
    // Create statusMessage element if missing
    createStatusMessageElement() {
        console.log('Creating statusMessage element...');
        
        const splashPage = document.getElementById('splashPage');
        if (!splashPage) {
            console.error('No splash page found - cannot create statusMessage');
            return null;
        }
        
        const statusMessage = document.createElement('div');
        statusMessage.id = 'statusMessage';
        statusMessage.className = 'status-message';
        statusMessage.style.display = 'none';
        
        splashPage.appendChild(statusMessage);
        console.log('statusMessage element created and added to splash page');
        
        return statusMessage;
    }
    
    navigateToMainSite() {
        const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
        console.log(`[${deviceType}] Navigating to main site...`);
        
        // Prepare audio for navigation
        if (window.doorAudio) {
            window.doorAudio.prepareForNavigation();
        }
        
        // Mobile-optimized navigation timing
        setTimeout(() => {
            this.hideSplash();
        }, this.isMobile ? 500 : (this.isIPhone ? 400 : 300));
    }
    
    hideSplash() {
        const splashPage = document.getElementById('splashPage');
        const mainSite = document.getElementById('mainSite');
        
        if (splashPage && mainSite) {
            splashPage.classList.add('hidden');
            mainSite.classList.add('active');
            
            setTimeout(() => {
                splashPage.style.display = 'none';
            }, this.isMobile ? 1800 : (this.isIPhone ? 1500 : 1200));
            
            const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
            console.log(`[${deviceType}] Splash hidden, main site active`);
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
        
        const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
        console.log(`[${deviceType}] Active door rotated to: ${this.letters[this.currentActiveIndex]} (index: ${this.currentActiveIndex})`);
    }
    
    startRotation() {
        this.stopRotation();
        
        this.rotationInterval = setInterval(() => {
            this.rotateActiveLetter();
        }, this.rotationDelay);
        
        const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
        console.log(`[${deviceType}] Door rotation started (every ${this.rotationDelay}ms)`);
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
        
        // Clear any quote timeouts
        if (this.quoteTimeout) {
            clearTimeout(this.quoteTimeout);
            this.quoteTimeout = null;
        }
        
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
            
            if (e.target.closest('input, textarea, select, button[type="button"], button[type="submit"]')) {
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
    console.log('Door - Initializing mobile-optimized systems...');
    
    // Initialize audio system FIRST for quietstorm at launch
    window.doorAudio = new DoorAudio();
    
    // Initialize rotating door entry system
    window.rotatingDoorEntry = new RotatingDoorEntry();
    
    // Initialize mobile menu
    window.mobileMenu = new MobileMenu();
    
    // Initialize viewport handler
    window.viewportHandler = new ViewportHandler();
    
    // Initialize other functionality
    initGalleries();
    initSplashPage();
    initKeyboardNavigation();
    initAccessibilityFeatures();
    initMobileOptimizations();
    
    if ('IntersectionObserver' in window) {
        initLazyLoading();
    }
    
    console.log('Door - All mobile-optimized systems initialized!');
});

// =============== MOBILE-SPECIFIC OPTIMIZATIONS ===============
function initMobileOptimizations() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0);
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (!isMobile) return;
    
    console.log('Applying mobile-specific optimizations...', isIPhone ? '(iPhone)' : '');
    
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
    
    // Mobile-specific scroll optimization
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Prevent mobile bounce scroll on body
    document.body.addEventListener('touchmove', (e) => {
        if (e.target === document.body || e.target === document.documentElement) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Mobile-specific audio button enhancement
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
    
    // Enhanced mobile door interaction
    const doorLinks = document.querySelectorAll('.door-gallery a');
    doorLinks.forEach(link => {
        // Add visual feedback for mobile
        link.addEventListener('touchstart', () => {
            link.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        link.addEventListener('touchend', () => {
            setTimeout(() => {
                link.style.transform = '';
            }, 150);
        }, { passive: true });
    });
    
    console.log('Mobile optimizations applied', isIPhone ? '(iPhone)' : '');
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

// =============== UPDATED SPLASH PAGE - Mobile Optimized ===============
function initSplashPage() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (!splashPage) return;
    
    console.log('Initializing mobile-optimized splash page with rotating door entry...');
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0);
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Mobile-specific splash optimizations
    if (isMobile) {
        // Prevent default touch behaviors on splash
        splashPage.addEventListener('touchmove', (e) => {
            // Allow scrolling only within specific elements
            if (!e.target.closest('.nav-links, .quote-responses')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Enhanced mobile gesture handling
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
    
    console.log('Mobile-optimized splash page initialized', isMobile ? '(Mobile)' : '');
}

function hideSplash() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (splashPage && mainSite) {
        splashPage.classList.add('hidden');
        mainSite.classList.add('active');
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         ('ontouchstart' in window) ||
                         (navigator.maxTouchPoints > 0);
        const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        setTimeout(() => {
            splashPage.style.display = 'none';
        }, isMobile ? 1800 : (isIPhone ? 1500 : 1200));
        
        console.log('Splash hidden, main site active', isMobile ? '(Mobile)' : '');
    }
}

// =============== ENHANCED KEYBOARD NAVIGATION FOR MOBILE ===============
function initKeyboardNavigation() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0);
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    document.addEventListener('keydown', (e) => {
        // Mobile-specific spacebar handling
        if (e.key === ' ' && e.target === document.body) {
            if (!isMobile || !document.activeElement || document.activeElement === document.body) {
                e.preventDefault();
                toggleAudio();
            }
        }
        
        // Enhanced mobile menu keyboard support
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
    
    console.log('Mobile-optimized keyboard navigation initialized');
}

// =============== ENHANCED ACCESSIBILITY FOR MOBILE ===============
function initAccessibilityFeatures() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0);
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Enhanced anchor link behavior for mobile
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
                
                // Mobile-specific focus handling
                if (isMobile) {
                    setTimeout(() => target.focus(), 100);
                } else {
                    target.focus();
                }
            }
        });
    });
    
    // Enhanced skip link for mobile
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
    
    // Mobile-specific accessibility enhancements
    if (isMobile) {
        // Enhance button accessibility
        const buttons = document.querySelectorAll('button:not([aria-label]):not([title])');
        buttons.forEach(button => {
            if (button.textContent.trim()) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });
        
        // Enhanced focus management for mobile
        document.addEventListener('focusin', (e) => {
            if (e.target.closest('.nav-links') && window.mobileMenu?.isOpen) {
                e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
    }
    
    console.log('Mobile-enhanced accessibility features initialized');
}

// =============== ENHANCED LAZY LOADING FOR MOBILE ===============
function initLazyLoading() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0);
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
                    console.log('Lazy loaded:', img.alt || img.src, isMobile ? '(Mobile)' : '');
                }
            }
        });
    }, {
        rootMargin: isMobile ? '100px' : '50px' // Larger margin for mobile
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.setAttribute('data-loading', 'true');
        imageObserver.observe(img);
    });
    
    console.log('Mobile-optimized lazy loading initialized');
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

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
}

function isIPhoneDevice() {
    return /iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// =============== ERROR HANDLING ===============
window.addEventListener('error', (e) => {
    const isMobile = isMobileDevice();
    const isIPhone = isIPhoneDevice();
    console.error('Door - JavaScript error:', e.error, isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
    
    if (e.error.message.includes('audio') && window.doorAudio) {
        console.log('Attempting audio system recovery...', isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
        setTimeout(() => {
            try {
                window.doorAudio.updateButtons();
            } catch (recoveryError) {
                console.error('Audio recovery failed:', recoveryError, isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
            }
        }, isMobile ? 1500 : 1000);
    }
});

window.addEventListener('unhandledrejection', (e) => {
    const isMobile = isMobileDevice();
    const isIPhone = isIPhoneDevice();
    console.error('Door - Unhandled promise rejection:', e.reason, isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
});

// =============== PERFORMANCE MONITORING ===============
if ('performance' in window) {
    window.addEventListener('load', () => {
        const isMobile = isMobileDevice();
        const isIPhone = isIPhoneDevice();
        const loadTime = Math.round(performance.now());
        console.log(`Door - Page loaded in ${loadTime}ms`, isMobile ? (isIPhone ? '(iPhone optimized)' : '(Mobile optimized)') : '');
        
        if (performance.navigation) {
            const navType = performance.navigation.type;
            const navTypes = ['navigate', 'reload', 'back_forward', 'reserved'];
            console.log(`Navigation type: ${navTypes[navType] || 'unknown'}`, isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
        }
        
        // Mobile-specific performance metrics
        if (isMobile && 'memory' in performance) {
            console.log('Mobile memory usage:', {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
            });
        }
    });
}

// =============== MOBILE-ENHANCED DEVELOPMENT HELPERS ===============
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('dev')) {
    
    const isMobile = isMobileDevice();
    const isIPhone = isIPhoneDevice();
    console.log('Door - Development mode active', 
                isMobile ? (isIPhone ? '(iPhone detected)' : '(Mobile detected)') : '');
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case 'a':
                    e.preventDefault();
                    toggleAudio();
                    console.log('Dev: Audio toggled', isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
                    break;
                case 's':
                    e.preventDefault();
                    hideSplash();
                    console.log('Dev: Splash hidden', isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
                    break;
                case 'r':
                    e.preventDefault();
                    localStorage.removeItem('door_audio_state');
                    localStorage.removeItem('door_audio_time');
                    localStorage.removeItem('door_user_interacted');
                    console.log('Dev: Audio state reset', isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
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
                case 'q':
                    e.preventDefault();
                    if (window.rotatingDoorEntry) {
                        window.rotatingDoorEntry.showRandomQuote();
                        console.log('Dev: Random quote shown');
                    }
                    break;
                case 'i':
                    e.preventDefault();
                    console.log('Dev: Mobile-optimized system info:', {
                        isMobile: isMobile,
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
                    console.log('Dev: Mobile menu toggled', isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
                    break;
                case 'v':
                    e.preventDefault();
                    if (window.viewportHandler) {
                        window.viewportHandler.setViewportHeight();
                        console.log('Dev: Viewport height refreshed', isMobile ? (isIPhone ? '(iPhone)' : '(Mobile)') : '');
                    }
                    break;
            }
        }
    });
    
    // Mobile-enhanced debug tools
    window.doorDebug = {
        audio: () => window.doorAudio,
        galleries: () => window.doorGalleries,
        doorEntry: () => window.rotatingDoorEntry,
        mobileMenu: () => window.mobileMenu,
        viewport: () => window.viewportHandler,
        isMobile: () => isMobile,
        isIPhone: () => isIPhone,
        deviceInfo: () => ({
            isMobile: isMobile,
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
        testAudioResume: () => {
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
        refreshViewport: () => {
            if (window.viewportHandler) {
                window.viewportHandler.setViewportHeight();
            }
        },
        testMobileQuote: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.showRandomQuote();
                console.log('Mobile quote test triggered');
            }
        },
        testMobileAccess: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.showAccessGranted();
                console.log('Mobile access granted test triggered');
            }
        },
        testMobileMessage: (message = 'Test Message') => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.showMobileMessage(message);
                console.log('Custom mobile message test triggered:', message);
            }
        },
        checkMobileElements: () => {
            const elements = {
                splashPage: document.getElementById('splashPage'),
                statusMessage: document.getElementById('statusMessage'),
                mobileMessage: document.getElementById('mobileStatusMessage'),
                quoteResponses: document.getElementById('quoteResponses'),
                body: document.body
            };
            
            console.log('Mobile element check:', elements);
            
            Object.entries(elements).forEach(([key, element]) => {
                if (element) {
                    const styles = window.getComputedStyle(element);
                    console.log(`${key} computed styles:`, {
                        display: styles.display,
                        position: styles.position,
                        zIndex: styles.zIndex,
                        visibility: styles.visibility,
                        opacity: styles.opacity,
                        transform: styles.transform,
                        top: styles.top,
                        left: styles.left,
                        right: styles.right,
                        bottom: styles.bottom
                    });
                } else {
                    console.log(`${key}: Element not found`);
                }
            });
        },
        forceMobileMessage: (message = 'FORCE TEST') => {
            // Remove any existing messages
            document.querySelectorAll('#mobileStatusMessage').forEach(el => el.remove());
            
            // Create message with absolute priority
            const msg = document.createElement('div');
            msg.id = 'mobileStatusMessage';
            msg.textContent = message;
            msg.style.cssText = `
                position: fixed !important;
                top: 50vh !important;
                left: 50vw !important;
                transform: translate(-50%, -50%) !important;
                z-index: 9999999 !important;
                background: #ff0000 !important;
                color: #ffffff !important;
                padding: 40px !important;
                border-radius: 20px !important;
                font-size: 24px !important;
                font-weight: bold !important;
                border: 5px solid #ffffff !important;
                box-shadow: 0 0 50px rgba(255, 0, 0, 0.8) !important;
                font-family: Arial, sans-serif !important;
                text-align: center !important;
                min-width: 200px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: none !important;
                isolation: isolate !important;
            `;
            
            document.body.appendChild(msg);
            console.log('Force mobile message created');
            
            setTimeout(() => {
                if (msg.parentNode) {
                    msg.remove();
                    console.log('Force mobile message removed');
                }
            }, 3000);
        }
    };
    
    console.log('Mobile-enhanced dev tools available: window.doorDebug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
📱 Door Restaurant - ALL MOBILE DEVICES OPTIMIZED 📱
✅ MOBILE SUPPORT: Android, iPhone, iPad, and all touch devices
🎯 TOUCH TARGETS: 44-48px minimum for all interactive elements  
🔤 TYPOGRAPHY: 18px body text, proper font hierarchy
🎵 AUDIO SYSTEM: Mobile autoplay policy compliant
🍔 MOBILE MENU: Enhanced touch targets with smooth overlay
🎯 DOOR SYSTEM: Universal mobile touch detection
🖼️ GALLERY: Enhanced swipe gestures for all mobile devices
⌨️ KEYBOARD: Mobile-compatible navigation
🎲 RANDOM QUOTES: Mobile-specific timing and positioning
🔄 VIEWPORT: Dynamic height handling for mobile keyboards
📏 RESPONSIVE: Optimized for all mobile screen sizes
🎨 PERFORMANCE: Hardware acceleration for smooth mobile experience

Mobile Features:
• Universal mobile device detection (Android, iPhone, iPad, etc.)
• Enhanced touch event handling with fallback click events
• Improved quote display with mobile-specific styling
• Better touch target sizing and visual feedback
• Optimized timing for mobile interactions
• Enhanced swipe gesture recognition across all devices
• Improved form input handling (prevents zoom)
• Mobile-specific debugging and logging

UPDATED: showAutoAccess() method removed - uses showAccessGranted() for all access scenarios
Dev Tools: Ctrl+Shift+V (viewport refresh), window.doorDebug.deviceInfo()
Philosophy: "Every mobile device deserves a beautiful experience" 📱✨
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
        isMobileDevice,
        isIPhoneDevice
    };
}

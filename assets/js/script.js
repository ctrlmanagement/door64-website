/* Door Restaurant - Minimal Mobile-Optimized JavaScript */

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

// =============== MINIMAL ROTATING DOOR ENTRY SYSTEM ===============
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
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               window.matchMedia('(pointer: coarse)').matches;
    }
    
    init() {
        if (this.isInitialized) return;
        
        const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
        console.log(`[${deviceType}] Initializing Minimal Rotating Door Entry System...`);
        
        // Apply minimal page scaling first
        this.setupMinimalLayout();
        
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
        
        // Setup door click handlers
        this.setupDoorClickHandlers();
        
        // Start the rotation
        this.startRotation();
        
        // Set initial active letter
        this.rotateActiveLetter();
        
        this.isInitialized = true;
        console.log(`[${deviceType}] Minimal Rotating Door Entry System initialized successfully`);
    }
    
    setupMinimalLayout() {
        console.log('Setting up minimal splash page layout...');
        
        const splashPage = document.getElementById('splashPage');
        if (!splashPage) return;
        
        // Only remove skip links within the splash page
        const skipLinksInSplash = splashPage.querySelectorAll('.skip-link');
        skipLinksInSplash.forEach(link => link.remove());
        
        // Scale down and center only the splash page content
        splashPage.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 100vh !important;
            padding: 20px !important;
            box-sizing: border-box !important;
            overflow-y: auto !important;
            position: relative !important;
        `;
        
        // Scale and position door gallery (only within splash page)
        const doorGallery = splashPage.querySelector('.door-gallery');
        if (doorGallery) {
            doorGallery.style.cssText = `
                margin: 0 auto 30px auto !important;
                padding: 20px !important;
                max-width: 90vw !important;
                display: flex !important;
                justify-content: center !important;
                flex-wrap: wrap !important;
                gap: 10px !important;
            `;
            
            // Scale door links
            const doorLinks = doorGallery.querySelectorAll('a');
            doorLinks.forEach(link => {
                link.style.cssText = `
                    font-size: ${this.isMobile ? '3rem' : '4rem'} !important;
                    padding: ${this.isMobile ? '15px' : '20px'} !important;
                    margin: 5px !important;
                    min-width: ${this.isMobile ? '60px' : '80px'} !important;
                    min-height: ${this.isMobile ? '60px' : '80px'} !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.3s ease !important;
                `;
            });
        }
        
        // Position quote responses directly under doors (only within splash page)
        const quoteSection = splashPage.querySelector('#quoteResponses');
        if (quoteSection) {
            quoteSection.style.cssText = `
                position: relative !important;
                margin: 0 auto !important;
                padding: 20px !important;
                max-width: 90% !important;
                text-align: center !important;
                display: none !important;
                opacity: 0 !important;
                background: rgba(0, 0, 0, 0.9) !important;
                color: white !important;
                border-radius: 10px !important;
                font-size: ${this.isMobile ? '16px' : '18px'} !important;
                line-height: 1.4 !important;
                min-height: 60px !important;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
            `;
        }
        
        // Position audio toggle (only within splash page)
        const audioToggle = splashPage.querySelector('.splash-audio-toggle');
        if (audioToggle) {
            audioToggle.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                z-index: 10000 !important;
                font-size: ${this.isMobile ? '24px' : '28px'} !important;
                padding: ${this.isMobile ? '12px' : '15px'} !important;
                min-width: ${this.isMobile ? '48px' : '52px'} !important;
                min-height: ${this.isMobile ? '48px' : '52px'} !important;
                border-radius: 50% !important;
                background: rgba(0, 0, 0, 0.8) !important;
                color: white !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
            `;
        }
        
        // Style status messages (only within splash page)
        const statusMessage = splashPage.querySelector('#statusMessage');
        if (statusMessage) {
            statusMessage.style.cssText = `
                position: relative !important;
                margin: 20px auto !important;
                padding: 15px 25px !important;
                max-width: 90% !important;
                text-align: center !important;
                display: none !important;
                font-size: ${this.isMobile ? '18px' : '20px'} !important;
                font-weight: bold !important;
                border-radius: 8px !important;
                color: white !important;
                background: rgba(46, 125, 50, 0.9) !important;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
            `;
        }
        
        console.log('Minimal splash page layout setup complete');
    }
    
    setupDoorClickHandlers() {
        this.doorLinks.forEach((link, index) => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            this.doorLinks[index] = newLink;
            
            if (this.isMobile) {
                // Enhanced mobile touch handling
                let touchStartTime = 0;
                let touchMoved = false;
                
                newLink.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                    touchMoved = false;
                    e.stopPropagation();
                }, { passive: true });
                
                newLink.addEventListener('touchmove', (e) => {
                    touchMoved = true;
                }, { passive: true });
                
                newLink.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const touchDuration = Date.now() - touchStartTime;
                    
                    if (touchDuration < 500 && !touchMoved) {
                        console.log(`Mobile: Door ${this.letters[index]} tapped (index: ${index})`);
                        this.handleDoorClick(index);
                    }
                }, { passive: false });
                
                // Fallback click handler
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
    
    handleDoorClick(clickedIndex) {
        const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
        
        console.log(`[${deviceType}] Door ${this.letters[clickedIndex]} clicked (index: ${clickedIndex})`);
        console.log(`[${deviceType}] Active door index: ${this.currentActiveIndex}`);
        console.log(`[${deviceType}] Attempt count: ${this.attemptCount}`);
        
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
                this.showAutoAccess();
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
    
    // Reverted showRandomQuote method with simple positioning
    showRandomQuote() {
        console.log('showRandomQuote() called - looking for quote elements...');
        
        const quoteSection = document.getElementById('quoteResponses');
        const quoteText = document.getElementById('quoteText');
        
        if (quoteSection && quoteText) {
            const randomQuote = this.getRandomQuote();
            console.log('Setting quote text to:', randomQuote);
            
            // Clear any existing timeouts
            if (this.quoteTimeout) {
                clearTimeout(this.quoteTimeout);
            }
            
            // Set the text
            quoteText.textContent = randomQuote;
            
            // Simple show/hide with proper styling
            quoteSection.style.display = 'block';
            quoteSection.style.opacity = '1';
            quoteSection.className = 'quote-responses show';
            
            console.log('Quote should now be visible:', randomQuote);
            
            // Mobile gets longer display time for readability
            const displayTime = this.isMobile ? 6000 : 4000;
            
            this.quoteTimeout = setTimeout(() => {
                console.log('Hiding quote after timeout');
                
                quoteSection.style.transition = 'opacity 0.5s ease-out';
                quoteSection.style.opacity = '0';
                
                setTimeout(() => {
                    quoteSection.style.display = 'none';
                    quoteSection.className = 'quote-responses';
                }, 500);
            }, displayTime);
            
        } else {
            console.error('Quote section elements not found');
            // Create quote elements if they don't exist
            this.createQuoteElements();
        }
    }
    
    createQuoteElements() {
        console.log('Creating missing quote elements...');
        
        const splashPage = document.getElementById('splashPage');
        if (!splashPage) return;
        
        // Create quote section
        const quoteSection = document.createElement('div');
        quoteSection.id = 'quoteResponses';
        quoteSection.className = 'quote-responses';
        
        // Create quote text
        const quoteText = document.createElement('p');
        quoteText.id = 'quoteText';
        quoteText.className = 'quote-text';
        
        quoteSection.appendChild(quoteText);
        
        // Apply minimal layout styles
        quoteSection.style.cssText = `
            position: relative !important;
            margin: 30px auto 0 auto !important;
            padding: 20px !important;
            max-width: 90% !important;
            text-align: center !important;
            display: none !important;
            opacity: 0 !important;
            background: rgba(0, 0, 0, 0.9) !important;
            color: white !important;
            border-radius: 10px !important;
            font-size: ${this.isMobile ? '16px' : '18px'} !important;
            line-height: 1.4 !important;
            min-height: 60px !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
        `;
        
        splashPage.appendChild(quoteSection);
        
        // Try to show the quote again
        setTimeout(() => {
            this.showRandomQuote();
        }, 50);
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
            }, this.isMobile ? 2500 : 2000);
        }
    }
    
    showAutoAccess() {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = this.isMobile ? 
                'Welcome! Your persistence is recognized.' : 
                'Welcome! The door recognizes your persistence.';
            statusMessage.className = 'status-message granted';
            statusMessage.style.display = 'block';
            console.log('Showing auto-access message after 3 attempts');
            
            setTimeout(() => {
                statusMessage.style.display = 'none';
                this.navigateToMainSite();
            }, this.isMobile ? 3000 : 2500);
        }
    }
    
    navigateToMainSite() {
        const deviceType = this.isIPhone ? 'iPhone' : (this.isMobile ? 'Mobile' : 'Desktop');
        console.log(`[${deviceType}] Navigating to main site...`);
        
        // Prepare audio for navigation
        if (window.doorAudio) {
            window.doorAudio.prepareForNavigation();
        }
        
        setTimeout(() => {
            this.hideSplash();
        }, this.isMobile ? 500 : 300);
    }
    
    hideSplash() {
        const splashPage = document.getElementById('splashPage');
        const mainSite = document.getElementById('mainSite');
        
        if (splashPage && mainSite) {
            splashPage.classList.add('hidden');
            mainSite.classList.add('active');
            
            setTimeout(() => {
                splashPage.style.display = 'none';
            }, this.isMobile ? 1500 : 1200);
            
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
        console.log('Minimal Rotating Door Entry System destroyed');
    }
}

// =============== MINIMAL VIEWPORT HANDLER ===============
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
        console.log('Initializing minimal viewport handler...');
        this.setViewportHeight();
        this.setupEventListeners();
    }
    
    setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        if (this.isIPhone) {
            console.log('iPhone viewport updated:', {
                vh: vh + 'px',
                height: window.innerHeight + 'px'
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
window.doorAudio = null;
window.rotatingDoorEntry = null;
window.viewportHandler = null;

// =============== DOCUMENT READY & INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Door - Initializing minimal mobile-optimized systems...');
    
    // Initialize audio system
    window.doorAudio = new DoorAudio();
    
    // Initialize rotating door entry system (includes minimal layout setup)
    window.rotatingDoorEntry = new RotatingDoorEntry();
    
    // Initialize viewport handler
    window.viewportHandler = new ViewportHandler();
    
    console.log('Door - All minimal systems initialized!');
});

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

function hideSplash() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (splashPage && mainSite) {
        splashPage.classList.add('hidden');
        mainSite.classList.add('active');
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         ('ontouchstart' in window) ||
                         (navigator.maxTouchPoints > 0);
        
        setTimeout(() => {
            splashPage.style.display = 'none';
        }, isMobile ? 1500 : 1200);
        
        console.log('Splash hidden, main site active');
    }
}

// =============== UTILITY FUNCTIONS ===============
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
        }, isMobile ? 1000 : 500);
    }
});

// =============== DEVELOPMENT HELPERS ===============
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.includes('dev')) {
    
    const isMobile = isMobileDevice();
    const isIPhone = isIPhoneDevice();
    console.log('Door - Development mode active (Minimal Layout)', 
                isMobile ? (isIPhone ? '(iPhone detected)' : '(Mobile detected)') : '');
    
    // Simplified debug tools
    window.doorDebug = {
        audio: () => window.doorAudio,
        doorEntry: () => window.rotatingDoorEntry,
        viewport: () => window.viewportHandler,
        isMobile: () => isMobile,
        isIPhone: () => isIPhone,
        showQuote: () => {
            if (window.rotatingDoorEntry) {
                window.rotatingDoorEntry.showRandomQuote();
            }
        },
        skipToMain: () => hideSplash()
    };
    
    console.log('Minimal dev tools available: window.doorDebug');
}

// =============== CONSOLE BRANDING ===============
console.log(`
🚪 Door Restaurant - MINIMAL MOBILE LAYOUT 🚪
✨ FOCUSED DESIGN: Door letters, quotes, and music only
📱 MOBILE OPTIMIZED: All devices supported with minimal layout
🎯 NO SCROLL ISSUES: Quote appears directly under doors
🎵 CLEAN AUDIO: Fixed position music toggle
🔄 SCALED INTERFACE: Optimal sizing for all screens
⚡ PERFORMANCE: Minimal DOM manipulation for speed

Features:
• Minimal splash page with centered door letters
• Quote responses positioned directly under doors
• Fixed audio toggle in top-right corner
• Removed skip links and excess navigation
• Scaled elements for optimal mobile experience
• No absolute positioning issues

Philosophy: "Less is more - focus on the door experience" 🚪✨
`);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DoorAudio,
        RotatingDoorEntry,
        ViewportHandler,
        toggleAudio,
        isMobileDevice,
        isIPhoneDevice
    };
}

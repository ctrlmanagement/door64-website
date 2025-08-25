// Door 64 Restaurant - Updated JavaScript for New Door Design

// Global variables
let currentSlide = 0;
let slides = [];
let dots = [];
let totalSlides = 0;
let galleryTimer;

// Debug logging (remove in production)
const DEBUG = true;
function log(message) {
    if (DEBUG) {
        console.log(`[Door64] ${message}`);
    }
}

// Initialize viewport height fix immediately
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    log(`Viewport height set: ${vh}px`);
}

// Call immediately, before DOM loaded
setViewportHeight();

// Main initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    log('DOM Content Loaded - initializing Door 64 with new door design...');
    
    // Initialize viewport height fix for mobile
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // Initialize splash page
    initializeSplashPage();
    
    // Initialize navigation behavior
    initializeNavigation();
    
    // Initialize gallery
    initializeGallery();
    
    // Initialize other features
    initializeImageHandling();
    initializeKeyboardControls();
    initializeTouchGestures();
    
    log('All systems initialized with new door design');
});

// Splash page initialization
function initializeSplashPage() {
    const splash = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    log('Initializing splash page with new door design...');
    
    if (!splash) {
        log('ERROR: Splash page element not found!');
        return;
    }
    
    if (!mainSite) {
        log('ERROR: Main site element not found!');
        return;
    }
    
    log('Both splash and main site elements found');
    
    // Check for door gallery
    const doorGallery = splash.querySelector('.door-gallery');
    if (!doorGallery) {
        log('ERROR: Door gallery not found!');
    } else {
        log('Door gallery found with new design');
        
        // Count doors
        const doors = doorGallery.querySelectorAll('li');
        log(`Found ${doors.length} doors in the new gallery`);
    }
    
    // Ensure splash is visible and main site is hidden initially
    splash.style.display = 'flex';
    splash.style.opacity = '1';
    splash.style.transform = 'scale(1)';
    splash.style.pointerEvents = 'auto';
    splash.classList.remove('hidden');
    
    mainSite.style.display = 'none';
    mainSite.style.opacity = '0';
    mainSite.classList.remove('active');
    
    log('Initial splash page state set');
    
    // Function to transition to main site
    function enterMainSite() {
        log('Entering main site...');
        
        // Add transition class and start animation
        splash.classList.add('hidden');
        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.1)';
        splash.style.pointerEvents = 'none';
        
        // After animation, show main site
        setTimeout(function() {
            splash.style.display = 'none';
            mainSite.style.display = 'block';
            
            // Force reflow
            mainSite.offsetHeight;
            
            // Fade in main site
            requestAnimationFrame(function() {
                mainSite.style.opacity = '1';
                mainSite.classList.add('active');
                log('Main site transition complete');
            });
        }, 1200); // Match CSS transition duration
    }
    
    // Click event listener
    splash.addEventListener('click', function(e) {
        log('Splash page clicked');
        
        // Don't trigger if clicking on interactive elements or door links
        if (e.target.closest('.splash-audio-toggle') || 
            e.target.closest('button') ||
            (e.target.closest('a') && !e.target.closest('.door-gallery'))) {
            log('Clicked on interactive element - not entering main site');
            return;
        }
        
        // Special handling for door gallery - allow clicking on doors to enter
        if (e.target.closest('.door-gallery')) {
            log('Clicked on door gallery - entering main site');
        }
        
        enterMainSite();
    });
    
    // Touch event listener for mobile
    splash.addEventListener('touchend', function(e) {
        log('Splash page touched');
        
        // Don't trigger if touching interactive elements or door links
        if (e.target.closest('.splash-audio-toggle') || 
            e.target.closest('button') ||
            (e.target.closest('a') && !e.target.closest('.door-gallery'))) {
            log('Touched interactive element - not entering main site');
            return;
        }
        
        // Special handling for door gallery - allow touching doors to enter
        if (e.target.closest('.door-gallery')) {
            log('Touched door gallery - entering main site');
        }
        
        e.preventDefault();
        enterMainSite();
    });
    
    // Keyboard support
    document.addEventListener('keydown', function(e) {
        // Only if splash is currently visible
        if (splash.style.display !== 'none' && !splash.classList.contains('hidden')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                log(`Keyboard ${e.key} pressed - entering main site`);
                enterMainSite();
            }
        }
    });
    
    log('Splash page event listeners attached for new door design');
}

// Audio toggle function
function toggleAudio(event) {
    if (event) {
        event.stopPropagation();
    }
    
    const audio = document.getElementById('backgroundAudio');
    const button = event ? event.target : document.querySelector('.splash-audio-toggle, .audio-toggle');
    
    log('Audio toggle clicked');
    
    if (!audio) {
        log('Audio element not found');
        return;
    }
    
    if (!button) {
        log('Audio button not found');
        return;
    }
    
    if (audio.paused) {
        // Try to play audio
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                log('Audio started playing');
                button.innerHTML = '⏸';
                button.classList.add('playing');
            }).catch(error => {
                log('Audio play failed: ' + error.message);
                
                // Some browsers require user interaction first
                const playOnNextClick = function() {
                    audio.play().then(() => {
                        button.innerHTML = '⏸';
                        button.classList.add('playing');
                        log('Audio started after user interaction');
                    });
                    document.removeEventListener('click', playOnNextClick);
                };
                
                document.addEventListener('click', playOnNextClick);
            });
        }
    } else {
        audio.pause();
        log('Audio paused');
        button.innerHTML = '♪';
        button.classList.remove('playing');
    }
}

// Mobile menu toggle function
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (!navLinks || !mobileMenu) {
        log('Mobile menu elements not found');
        return;
    }
    
    const isActive = navLinks.classList.contains('active');
    log(`Mobile menu ${isActive ? 'closing' : 'opening'}`);
    
    navLinks.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    
    // Animate hamburger menu
    const spans = mobileMenu.querySelectorAll('span');
    if (!isActive) { // Opening menu
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else { // Closing menu
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
}

// Navigation initialization
function initializeNavigation() {
    log('Initializing navigation...');
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const navLinks = document.getElementById('navLinks');
        const mobileMenu = document.querySelector('.mobile-menu');
        const nav = document.querySelector('.nav');
        
        // If mobile menu is open and click is outside nav area
        if (navLinks && navLinks.classList.contains('active') && 
            nav && !nav.contains(event.target)) {
            toggleMobileMenu();
        }
    });

    // Handle navigation visibility on desktop
    handleNavVisibility();
    window.addEventListener('resize', handleNavVisibility);
    
    log('Navigation initialized');
}

// Handle navigation visibility on desktop
function handleNavVisibility() {
    const nav = document.querySelector('.nav');
    
    if (window.innerWidth > 768 && nav) {
        let mouseTimer;
        
        const showNav = function() {
            nav.classList.add('show-nav');
            clearTimeout(mouseTimer);
        };
        
        const hideNav = function(delay = 3000) {
            clearTimeout(mouseTimer);
            mouseTimer = setTimeout(function() {
                nav.classList.remove('show-nav');
            }, delay);
        };
        
        // Show nav on mouse movement
        document.addEventListener('mousemove', function() {
            showNav();
            hideNav(3000);
        });
        
        // Keep nav visible when hovering over it
        nav.addEventListener('mouseenter', showNav);
        nav.addEventListener('mouseleave', () => hideNav(1000));
    }
}

// Gallery functionality
function initializeGallery() {
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        slides = document.querySelectorAll('.gallery-slide');
        dots = document.querySelectorAll('.gallery-dot');
        totalSlides = slides.length;
        
        if (totalSlides > 0) {
            log(`Gallery initialized with ${totalSlides} slides`);
            updateGallery();
            startAutoAdvance();
        } else {
            log('No gallery slides found');
        }
    }, 100);
}

function updateGallery() {
    if (totalSlides === 0) return;
    
    const track = document.getElementById('landing-track');
    if (!track) {
        log('Gallery track not found');
        return;
    }
    
    // Update slide position
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update dots
    dots.forEach((dot, index) => {
        if (dot) {
            dot.classList.toggle('active', index === currentSlide);
        }
    });
    
    // Update progress bar
    const progress = document.querySelector('.gallery-progress');
    if (progress) {
        progress.style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
    }
}

function nextSlide() {
    if (totalSlides > 0) {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateGallery();
        restartAutoAdvance();
        log(`Gallery: moved to slide ${currentSlide + 1}/${totalSlides}`);
    }
}

function previousSlide() {
    if (totalSlides > 0) {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateGallery();
        restartAutoAdvance();
        log(`Gallery: moved to slide ${currentSlide + 1}/${totalSlides}`);
    }
}

function goToSlide(slideIndex) {
    if (slideIndex >= 0 && slideIndex < totalSlides) {
        currentSlide = slideIndex;
        updateGallery();
        restartAutoAdvance();
        log(`Gallery: jumped to slide ${currentSlide + 1}/${totalSlides}`);
    }
}

function startAutoAdvance() {
    clearInterval(galleryTimer);
    galleryTimer = setInterval(() => {
        if (totalSlides > 0) {
            nextSlide();
        }
    }, 5000);
}

function restartAutoAdvance() {
    startAutoAdvance();
}

// Image handling
function initializeImageHandling() {
    log('Initializing image handling...');
    
    // Preload critical images for new 4-door design
    const imageUrls = [
        // Door images for splash (4 doors instead of 6)
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?w=400&h=600&fit=crop',
        // Gallery images
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop'
    ];
    
    let loadedCount = 0;
    imageUrls.forEach((url, index) => {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            if (loadedCount === imageUrls.length) {
                log('All images preloaded successfully for new door design');
            }
        };
        img.onerror = () => log(`Failed to load image: ${url}`);
        img.src = url;
    });
    
    // Handle existing images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            log('Image failed to load: ' + this.src);
        });
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });
}

// Keyboard controls
function initializeKeyboardControls() {
    document.addEventListener('keydown', function(event) {
        // Escape key closes mobile menu
        if (event.key === 'Escape') {
            const navLinks = document.getElementById('navLinks');
            if (navLinks && navLinks.classList.contains('active')) {
                toggleMobileMenu();
            }
        }
        
        // Space bar toggles audio (when not in an input field)
        if (event.code === 'Space' && 
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
            event.preventDefault();
            const audioToggle = document.querySelector('.audio-toggle') || 
                               document.querySelector('.splash-audio-toggle');
            if (audioToggle) {
                toggleAudio({
                    target: audioToggle,
                    stopPropagation: () => {}
                });
            }
        }
        
        // Arrow keys for gallery navigation
        if (event.key === 'ArrowRight') {
            nextSlide();
        } else if (event.key === 'ArrowLeft') {
            previousSlide();
        }
        
        // Number keys for direct gallery navigation
        const num = parseInt(event.key);
        if (num >= 1 && num <= totalSlides) {
            goToSlide(num - 1);
        }
    });
    
    log('Keyboard controls initialized');
}

// Touch gestures
function initializeTouchGestures() {
    let touchStartY = 0;
    let touchStartX = 0;
    let isGalleryTouching = false;
    let galleryTouchStartX = 0;
    let isDoorTouching = false;

    // General touch handling
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        
        // Gallery specific touch
        if (e.target.closest('.gallery-container')) {
            isGalleryTouching = true;
            galleryTouchStartX = e.touches[0].clientX;
        }
        
        // Door gallery specific touch
        if (e.target.closest('.door-gallery')) {
            isDoorTouching = true;
            log('Door gallery touch started');
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        // Prevent pull-to-refresh on mobile
        if (window.scrollY === 0 && e.touches[0].clientY > touchStartY) {
            e.preventDefault();
        }
        
        // Don't prevent door gallery interactions
        if (isDoorTouching) {
            // Allow normal door interactions
            return;
        }
    }, { passive: false });

    // Gallery swipe handling
    document.addEventListener('touchend', function(e) {
        if (isGalleryTouching && e.target.closest('.gallery-container')) {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = galleryTouchStartX - touchEndX;
            
            // Minimum swipe distance
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    previousSlide();
                }
            }
            
            isGalleryTouching = false;
        }
        
        if (isDoorTouching) {
            isDoorTouching = false;
            log('Door gallery touch ended');
        }
    }, { passive: true });
    
    log('Touch gestures initialized for new door design');
}

// Smooth scrolling for internal links
document.addEventListener('DOMContentLoaded', function() {
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Page visibility changes
document.addEventListener('visibilitychange', function() {
    const audio = document.getElementById('backgroundAudio');
    if (audio && !audio.paused && document.hidden) {
        // Optionally pause audio when tab becomes hidden
        // audio.pause();
    }
});

// Page load complete
window.addEventListener('load', function() {
    log('Page fully loaded with new door design');
    
    // Check door gallery after full load
    const doorGallery = document.querySelector('.door-gallery');
    if (doorGallery) {
        const doors = doorGallery.querySelectorAll('li img');
        log(`Door gallery fully loaded with ${doors.length} door images`);
        
        // Check if images are loaded
        doors.forEach((img, index) => {
            if (img.complete) {
                log(`Door ${index + 1} image loaded successfully`);
            } else {
                log(`Door ${index + 1} image still loading...`);
            }
        });
    }
    
    // Performance monitoring
    if ('performance' in window) {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            log(`Page load time: ${pageLoadTime}ms`);
        }, 0);
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.message, 'at', e.filename, ':', e.lineno);
});

// Intersection Observer for lazy loading (future use)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            }
        });
    });
    
    // Observe all images with data-src attribute
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    });
}

// Console welcome message
console.log('%cDoor 64', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cWelcome to our digital experience with new door design', 'font-size: 14px; color: #666;');

// Export functions for global access (if needed)
window.toggleAudio = toggleAudio;
window.toggleMobileMenu = toggleMobileMenu;
window.nextSlide = nextSlide;
window.previousSlide = previousSlide;
window.goToSlide = goToSlide;

// Door 64 Restaurant - Corrected JavaScript
// Fixed splash page loading and initialization issues

console.log('🚪 Door 64 JavaScript Loading...');

// Viewport height fix for mobile browsers
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set viewport height immediately and on resize
setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// Global variables for gallery
let currentSlide = 0;
let slides = [];
let dots = [];
let totalSlides = 0;
let galleryTimer = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - initializing Door 64...');
    
    // Initialize splash page functionality
    initializeSplashPage();
    
    // Initialize navigation behavior
    initializeNavigation();
    
    // Initialize gallery
    initializeGallery();
    
    // Initialize other features
    initializeImageErrorHandling();
    initializeKeyboardControls();
    initializeTouchGestures();
    
    console.log('✅ Door 64 initialization complete');
});

// Initialize splash page functionality
function initializeSplashPage() {
    const splash = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    console.log('Splash element found:', !!splash);
    console.log('Main site element found:', !!mainSite);
    
    if (!splash || !mainSite) {
        console.error('❌ Critical elements not found!');
        // Fallback - show main site if splash is missing
        if (mainSite) {
            mainSite.style.display = 'block';
            mainSite.style.opacity = '1';
            mainSite.classList.add('active');
        }
        return;
    }
    
    // Ensure proper initial states
    splash.style.display = 'flex';
    splash.style.opacity = '1';
    splash.style.transform = 'scale(1)';
    splash.style.pointerEvents = 'auto';
    splash.classList.remove('hidden');
    
    mainSite.style.display = 'none';
    mainSite.style.opacity = '0';
    mainSite.classList.remove('active');
    
    console.log('✅ Splash page initialized - should be visible');
    
    // Function to transition to main site
    function enterMainSite() {
        console.log('🚪 Entering main site...');
        
        // Disable splash interactions
        splash.style.pointerEvents = 'none';
        splash.classList.add('hidden');
        
        // Animate splash out
        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.1)';
        
        // Show main site after animation
        setTimeout(function() {
            splash.style.display = 'none';
            mainSite.style.display = 'block';
            
            // Force reflow
            mainSite.offsetHeight;
            
            requestAnimationFrame(function() {
                mainSite.style.opacity = '1';
                mainSite.classList.add('active');
                console.log('✅ Main site is now visible');
            });
        }, 1000);
    }
    
    // Click event for splash page
    splash.addEventListener('click', function(e) {
        console.log('👆 Splash page clicked');
        
        // Don't trigger if clicking on audio button or door links
        if (e.target.closest('.splash-audio-toggle') || 
            e.target.closest('.splash-geometric a')) {
            console.log('🎵 Clicked on interactive element - not entering site');
            return;
        }
        
        enterMainSite();
    });
    
    // Touch event for mobile
    splash.addEventListener('touchend', function(e) {
        console.log('👆 Splash page touched');
        
        if (e.target.closest('.splash-audio-toggle') || 
            e.target.closest('.splash-geometric a')) {
            console.log('🎵 Touched interactive element - not entering site');
            return;
        }
        
        e.preventDefault();
        enterMainSite();
    });
    
    // Keyboard support
    document.addEventListener('keydown', function(e) {
        // Only if splash is currently visible
        if (splash.style.display !== 'none' && 
            (e.key === 'Enter' || e.key === ' ')) {
            console.log(`⌨️  ${e.key} pressed - entering main site`);
            e.preventDefault();
            enterMainSite();
        }
    });
}

// Audio toggle function
function toggleAudio(event) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }
    
    const audio = document.getElementById('backgroundAudio');
    const button = event ? event.target : document.querySelector('.audio-toggle, .splash-audio-toggle');
    
    console.log('🎵 Audio toggle clicked, audio element:', !!audio);
    
    if (!audio) {
        console.error('❌ Audio element not found');
        return;
    }
    
    if (!button) {
        console.error('❌ Audio button not found');
        return;
    }
    
    if (audio.paused) {
        // Try to play audio
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✅ Audio started playing');
                button.innerHTML = '⏸';
                button.classList.add('playing');
            }).catch(function(error) {
                console.log('⚠️  Audio play blocked by browser:', error.message);
                
                // Show user feedback for blocked audio
                showAudioBlockedMessage();
            });
        }
    } else {
        audio.pause();
        console.log('⏸ Audio paused');
        button.innerHTML = '♪';
        button.classList.remove('playing');
    }
}

// Show message when audio is blocked
function showAudioBlockedMessage() {
    // Create a temporary message
    const message = document.createElement('div');
    message.textContent = 'Click anywhere to enable audio';
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        pointer-events: none;
    `;
    
    document.body.appendChild(message);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
    
    // Try to play audio on next user interaction
    const tryPlayAudio = function() {
        const audio = document.getElementById('backgroundAudio');
        const button = document.querySelector('.audio-toggle, .splash-audio-toggle');
        
        if (audio && audio.paused) {
            audio.play().then(() => {
                if (button) {
                    button.innerHTML = '⏸';
                    button.classList.add('playing');
                }
                document.removeEventListener('click', tryPlayAudio);
                document.removeEventListener('touchend', tryPlayAudio);
            }).catch(console.log);
        }
    };
    
    document.addEventListener('click', tryPlayAudio, { once: true });
    document.addEventListener('touchend', tryPlayAudio, { once: true });
}

// Mobile menu toggle function
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (!navLinks || !mobileMenu) {
        console.error('❌ Mobile menu elements not found');
        return;
    }
    
    navLinks.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    
    console.log('📱 Mobile menu toggled:', navLinks.classList.contains('active'));
    
    // Animate hamburger menu
    const spans = mobileMenu.querySelectorAll('span');
    if (navLinks.classList.contains('active')) {
        // Transform to X
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
        // Transform back to hamburger
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
}

// Initialize navigation behavior
function initializeNavigation() {
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
    
    // Handle desktop navigation visibility
    handleNavVisibility();
    window.addEventListener('resize', handleNavVisibility);
}

// Handle navigation visibility on desktop
function handleNavVisibility() {
    const nav = document.querySelector('.nav');
    const mainSite = document.querySelector('.main-site');
    
    if (window.innerWidth > 768 && nav && mainSite) {
        let mouseTimer;
        
        // Show nav on mouse movement
        const showNavOnMove = function() {
            nav.classList.add('show-nav');
            clearTimeout(mouseTimer);
            
            mouseTimer = setTimeout(function() {
                nav.classList.remove('show-nav');
            }, 3000);
        };
        
        // Remove existing listeners to prevent duplicates
        document.removeEventListener('mousemove', showNavOnMove);
        document.addEventListener('mousemove', showNavOnMove);
        
        // Keep nav visible when hovering over it
        nav.addEventListener('mouseenter', function() {
            nav.classList.add('show-nav');
            clearTimeout(mouseTimer);
        });
        
        nav.addEventListener('mouseleave', function() {
            mouseTimer = setTimeout(function() {
                nav.classList.remove('show-nav');
            }, 1000);
        });
    }
}

// Initialize gallery functionality
function initializeGallery() {
    slides = document.querySelectorAll('.gallery-slide');
    dots = document.querySelectorAll('.gallery-dot');
    totalSlides = slides.length;
    
    if (totalSlides === 0) {
        console.log('ℹ️  No gallery slides found');
        return;
    }
    
    console.log(`🖼️  Gallery initialized with ${totalSlides} slides`);
    
    currentSlide = 0;
    updateGallery();
    startAutoAdvance();
}

function updateGallery() {
    if (totalSlides === 0) return;
    
    const track = document.getElementById('landing-track');
    if (!track) {
        console.error('❌ Gallery track not found');
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

function nextSlide(galleryId) {
    if (totalSlides > 0) {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateGallery();
        restartAutoAdvance();
    }
}

function previousSlide(galleryId) {
    if (totalSlides > 0) {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateGallery();
        restartAutoAdvance();
    }
}

function goToSlide(galleryId, slideIndex) {
    if (slideIndex >= 0 && slideIndex < totalSlides) {
        currentSlide = slideIndex;
        updateGallery();
        restartAutoAdvance();
    }
}

function startAutoAdvance() {
    if (galleryTimer) {
        clearInterval(galleryTimer);
    }
    
    galleryTimer = setInterval(() => {
        if (totalSlides > 0) {
            nextSlide('landing-gallery');
        }
    }, 5000);
}

function restartAutoAdvance() {
    startAutoAdvance();
}

// Initialize smooth scrolling for internal links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return; // Skip empty hash links
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize image error handling
function initializeImageErrorHandling() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            console.log('⚠️  Image failed to load:', this.src);
            
            // Add error class for styling
            this.classList.add('image-error');
            
            // Optional: Replace with placeholder
            // this.src = 'assets/images/placeholder.jpg';
        });
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.classList.add('image-loaded');
        });
    });
}

// Initialize keyboard controls
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
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) &&
            !event.target.contentEditable) {
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
        if (totalSlides > 0) {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                nextSlide('landing-gallery');
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                previousSlide('landing-gallery');
            }
        }
    });
}

// Initialize touch gestures
function initializeTouchGestures() {
    let touchStartY = 0;
    let touchStartX = 0;
    
    // Prevent pull-to-refresh
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        // Prevent pull-to-refresh on mobile
        if (window.scrollY === 0 && e.touches[0].clientY > touchStartY) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Gallery swipe support
    let isGalleryTouching = false;
    let galleryTouchStartX = 0;
    
    document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.gallery-container')) {
            isGalleryTouching = true;
            galleryTouchStartX = e.touches[0].clientX;
        }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        if (isGalleryTouching && e.target.closest('.gallery-container')) {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = galleryTouchStartX - touchEndX;
            
            // Minimum swipe distance
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide('landing-gallery');
                } else {
                    previousSlide('landing-gallery');
                }
            }
            
            isGalleryTouching = false;
        }
    }, { passive: true });
}

// Preload critical images
function preloadImages() {
    const imageUrls = [
        // Door images for splash
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1520637836862-4d197d17c50a?w=400&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571123618511-a7aa5b74ff42?w=400&h=600&fit=crop',
        // Gallery images
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop'
    ];
    
    console.log(`📸 Preloading ${imageUrls.length} images...`);
    
    let loadedCount = 0;
    
    imageUrls.forEach((url, index) => {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            console.log(`✅ Image ${loadedCount}/${imageUrls.length} loaded`);
        };
        img.onerror = () => {
            loadedCount++;
            console.log(`❌ Image ${loadedCount}/${imageUrls.length} failed`);
        };
        img.src = url;
    });
}

// Page visibility handling
document.addEventListener('visibilitychange', function() {
    const audio = document.getElementById('backgroundAudio');
    if (audio && !audio.paused && document.hidden) {
        // Optionally pause audio when tab becomes hidden
        // Uncomment the next line if you want this behavior
        // audio.pause();
    }
});

// Initialize everything when page loads
window.addEventListener('load', function() {
    console.log('🎉 Page fully loaded');
    preloadImages();
    initializeSmoothScrolling();
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('💥 JavaScript Error:', e.message, 'at', e.filename, 'line', e.lineno);
});

// Console branding
console.log('%cDoor 64', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cWelcome to our digital experience', 'font-size: 14px; color: #666;');

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`⚡ Page load time: ${pageLoadTime}ms`);
        }, 100);
    });
}

console.log('✅ Door 64 JavaScript loaded successfully');

/* Door 64 Restaurant - Main JavaScript */

// Global variables
let currentSlide = 0;
let slideInterval = null;
let isAudioPlaying = false;

// =============== DOCUMENT READY & INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    console.log('Door 64 - Initializing...');
    
    // Initialize all functionality
    initAudio();
    initSplashPage();
    initGallery();
    initMobileMenu();
    initViewportHeight();
    
    console.log('Door 64 - Ready!');
});

// =============== AUTO-PLAY AUDIO FUNCTIONALITY ===============
function initAudio() {
    const audio = document.getElementById('backgroundAudio');
    const splashAudioToggle = document.getElementById('splashAudioToggle');
    const audioToggle = document.querySelector('.audio-toggle');
    
    if (!audio) {
        console.warn('Background audio element not found');
        return;
    }
    
    // Attempt auto-play on page load
    setTimeout(() => {
        audio.play().then(() => {
            console.log('✅ QUIETSTORM auto-play started');
            isAudioPlaying = true;
            updateAudioButtons(true);
        }).catch((error) => {
            console.log('⚠️ Audio auto-play blocked by browser:', error);
            // Auto-play was blocked, will try on first user interaction
        });
    }, 500); // Small delay to ensure everything is loaded
    
    // Try to play on first user click if auto-play failed
    document.addEventListener('click', function playOnFirstClick() {
        if (audio.paused) {
            audio.play().then(() => {
                console.log('✅ QUIETSTORM started on first click');
                isAudioPlaying = true;
                updateAudioButtons(true);
            }).catch(console.log);
        }
        // Remove this listener after first click
        document.removeEventListener('click', playOnFirstClick);
    }, { once: true });
    
    // Audio event listeners
    audio.addEventListener('play', () => {
        isAudioPlaying = true;
        updateAudioButtons(true);
        console.log('🎵 Audio playing');
    });
    
    audio.addEventListener('pause', () => {
        isAudioPlaying = false;
        updateAudioButtons(false);
        console.log('⏸️ Audio paused');
    });
    
    // Handle audio errors
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        isAudioPlaying = false;
        updateAudioButtons(false);
    });
}

function toggleAudio(event) {
    if (event) {
        event.stopPropagation(); // Prevent splash page click
    }
    
    const audio = document.getElementById('backgroundAudio');
    if (!audio) return;
    
    if (audio.paused) {
        audio.play().then(() => {
            isAudioPlaying = true;
            updateAudioButtons(true);
            console.log('🎵 Audio started');
        }).catch((error) => {
            console.error('Failed to play audio:', error);
        });
    } else {
        audio.pause();
        isAudioPlaying = false;
        updateAudioButtons(false);
        console.log('⏸️ Audio stopped');
    }
}

function updateAudioButtons(playing) {
    const splashAudioToggle = document.getElementById('splashAudioToggle');
    const audioToggle = document.querySelector('.audio-toggle');
    
    if (splashAudioToggle) {
        if (playing) {
            splashAudioToggle.classList.add('playing');
        } else {
            splashAudioToggle.classList.remove('playing');
        }
    }
    
    if (audioToggle) {
        if (playing) {
            audioToggle.classList.add('playing');
        } else {
            audioToggle.classList.remove('playing');
        }
    }
}

// =============== SPLASH PAGE FUNCTIONALITY ===============
function initSplashPage() {
    const splashPage = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (!splashPage) return;
    
    // Make entire splash page clickable (except audio button)
    splashPage.addEventListener('click', function(e) {
        // Don't navigate if clicking audio button
        if (e.target.closest('.splash-audio-toggle')) {
            return;
        }
        
        console.log('🚪 Entering main site...');
        
        // Navigate to main site
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            // If we're on index.html, go to 64.html
            window.location.href = '64.html';
        } else {
            // Hide splash and show main site (for single page setup)
            hideSplash();
        }
    });
    
    // Individual door clicks for backup
    const doorLinks = splashPage.querySelectorAll('.door-gallery a');
    doorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚪 Door clicked - entering main site...');
            window.location.href = '64.html';
        });
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

// =============== GALLERY FUNCTIONALITY ===============
function initGallery() {
    const galleryTrack = document.getElementById('landing-track');
    const galleryDots = document.querySelectorAll('.gallery-dot');
    const prevButton = document.querySelector('.gallery-nav.prev');
    const nextButton = document.querySelector('.gallery-nav.next');
    
    if (!galleryTrack) return;
    
    const slides = galleryTrack.children;
    const totalSlides = slides.length;
    
    if (totalSlides === 0) return;
    
    // Initialize gallery
    updateGalleryPosition();
    updateGalleryDots();
    
    // Auto-play gallery
    startGalleryAutoPlay();
    
    // Dot navigation
    galleryDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Button navigation
    if (prevButton) {
        prevButton.addEventListener('click', previousSlide);
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', nextSlide);
    }
    
    // Pause auto-play on hover
    const gallery = document.querySelector('.css-gallery');
    if (gallery) {
        gallery.addEventListener('mouseenter', stopGalleryAutoPlay);
        gallery.addEventListener('mouseleave', startGalleryAutoPlay);
    }
    
    // Touch/swipe support
    initGalleryTouch();
}

function goToSlide(slideIndex) {
    const galleryTrack = document.getElementById('landing-track');
    if (!galleryTrack) return;
    
    const totalSlides = galleryTrack.children.length;
    currentSlide = Math.max(0, Math.min(slideIndex, totalSlides - 1));
    
    updateGalleryPosition();
    updateGalleryDots();
    updateGalleryProgress();
    
    // Restart auto-play timer
    startGalleryAutoPlay();
}

function nextSlide() {
    const galleryTrack = document.getElementById('landing-track');
    if (!galleryTrack) return;
    
    const totalSlides = galleryTrack.children.length;
    currentSlide = (currentSlide + 1) % totalSlides;
    
    updateGalleryPosition();
    updateGalleryDots();
    updateGalleryProgress();
}

function previousSlide() {
    const galleryTrack = document.getElementById('landing-track');
    if (!galleryTrack) return;
    
    const totalSlides = galleryTrack.children.length;
    currentSlide = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
    
    updateGalleryPosition();
    updateGalleryDots();
    updateGalleryProgress();
}

function updateGalleryPosition() {
    const galleryTrack = document.getElementById('landing-track');
    if (!galleryTrack) return;
    
    const translateX = -currentSlide * 100;
    galleryTrack.style.transform = `translateX(${translateX}%)`;
}

function updateGalleryDots() {
    const galleryDots = document.querySelectorAll('.gallery-dot');
    
    galleryDots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add('active');
            dot.setAttribute('aria-selected', 'true');
            dot.setAttribute('tabindex', '0');
        } else {
            dot.classList.remove('active');
            dot.setAttribute('aria-selected', 'false');
            dot.setAttribute('tabindex', '-1');
        }
    });
}

function updateGalleryProgress() {
    const progressBar = document.querySelector('.gallery-progress');
    if (progressBar) {
        // Reset animation
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        
        // Force reflow
        progressBar.offsetHeight;
        
        // Start animation
        progressBar.style.transition = 'width 4s linear';
        progressBar.style.width = '100%';
    }
}

function startGalleryAutoPlay() {
    stopGalleryAutoPlay();
    
    slideInterval = setInterval(() => {
        nextSlide();
    }, 4000);
    
    updateGalleryProgress();
}

function stopGalleryAutoPlay() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
    
    const progressBar = document.querySelector('.gallery-progress');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
}

// =============== TOUCH/SWIPE SUPPORT FOR GALLERY ===============
function initGalleryTouch() {
    const galleryContainer = document.querySelector('.gallery-container');
    if (!galleryContainer) return;
    
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    galleryContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        
        galleryContainer.classList.add('swiping');
        stopGalleryAutoPlay();
    });
    
    galleryContainer.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        // Prevent vertical scrolling if horizontal swipe is dominant
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault();
        }
    });
    
    galleryContainer.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const endX = e.changedTouches[0].clientX;
        const deltaX = endX - startX;
        
        galleryContainer.classList.remove('swiping');
        isDragging = false;
        
        // Swipe threshold
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                previousSlide();
            } else {
                nextSlide();
            }
        }
        
        startGalleryAutoPlay();
    });
}

// =============== MOBILE MENU FUNCTIONALITY ===============
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const navLinks = document.getElementById('navLinks');
    
    if (!mobileMenuButton || !navLinks) return;
    
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
        if (!e.target.closest('.nav-container')) {
            closeMobileMenu();
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
    mobileMenuButton.setAttribute('aria-expanded', 'true');
    
    // Animate hamburger to X
    const spans = mobileMenuButton.querySelectorAll('span');
    spans.forEach((span, index) => {
        if (index === 0) span.style.transform = 'rotate(45deg) translate(6px, 6px)';
        if (index === 1) span.style.opacity = '0';
        if (index === 2) span.style.transform = 'rotate(-45deg) translate(6px, -6px)';
    });
    
    console.log('📱 Mobile menu opened');
}

function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileMenuButton = document.querySelector('.mobile-menu');
    
    if (!navLinks || !mobileMenuButton) return;
    
    navLinks.classList.remove('active');
    mobileMenuButton.setAttribute('aria-expanded', 'false');
    
    // Reset hamburger animation
    const spans = mobileMenuButton.querySelectorAll('span');
    spans.forEach((span) => {
        span.style.transform = '';
        span.style.opacity = '';
    });
}

// =============== VIEWPORT HEIGHT FIX FOR MOBILE ===============
function initViewportHeight() {
    // Fix viewport height on mobile devices
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // Set on load
    setViewportHeight();
    
    // Update on resize
    window.addEventListener('resize', setViewportHeight);
    
    // Update on orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });
}

// =============== UTILITY FUNCTIONS ===============
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============== PAGE VISIBILITY API FOR AUDIO ===============
document.addEventListener('visibilitychange', () => {
    const audio = document.getElementById('backgroundAudio');
    if (!audio) return;
    
    if (document.hidden) {
        // Page is not visible, optionally pause audio
        // Uncomment the line below if you want to pause audio when tab is not visible
        // if (isAudioPlaying) audio.pause();
    } else {
        // Page is visible again, resume audio if it was playing
        if (isAudioPlaying && audio.paused) {
            audio.play().catch(console.log);
        }
    }
});

// =============== KEYBOARD NAVIGATION SUPPORT ===============
document.addEventListener('keydown', (e) => {
    // Gallery keyboard navigation
    const gallery = document.querySelector('.css-gallery');
    if (gallery && document.activeElement.closest('.css-gallery')) {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                previousSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                const galleryTrack = document.getElementById('landing-track');
                if (galleryTrack) {
                    goToSlide(galleryTrack.children.length - 1);
                }
                break;
        }
    }
    
    // Audio toggle with spacebar
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        toggleAudio();
    }
    
    // Mobile menu toggle with Enter/Space
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mobile-menu')) {
        e.preventDefault();
        toggleMobileMenu();
    }
});

// =============== SMOOTH SCROLLING ENHANCEMENT ===============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
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

// =============== PERFORMANCE OPTIMIZATIONS ===============
// Lazy load images when they come into view
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// =============== ERROR HANDLING ===============
window.addEventListener('error', (e) => {
    console.error('Door 64 - JavaScript error:', e.error);
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Door 64 - Unhandled promise rejection:', e.reason);
});

// =============== DEVELOPMENT HELPERS ===============
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🏠 Door 64 - Development mode active');
    
    // Development keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key) {
                case 'A':
                    e.preventDefault();
                    toggleAudio();
                    console.log('🎵 Dev: Audio toggled');
                    break;
                case 'S':
                    e.preventDefault();
                    hideSplash();
                    console.log('🚪 Dev: Splash hidden');
                    break;
                case 'G':
                    e.preventDefault();
                    if (slideInterval) {
                        stopGalleryAutoPlay();
                        console.log('⏸️ Dev: Gallery auto-play stopped');
                    } else {
                        startGalleryAutoPlay();
                        console.log('▶️ Dev: Gallery auto-play started');
                    }
                    break;
            }
        }
    });
}

console.log('🎵 Door 64 - Script loaded successfully');

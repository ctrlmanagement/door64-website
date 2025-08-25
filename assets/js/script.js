// Door 64 Restaurant - Complete JavaScript
// Door Plugin Splash + Original Landing Page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize viewport height fix for mobile
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // Simple splash page click to enter
    const splash = document.getElementById('splashPage');
    const mainSite = document.getElementById('mainSite');
    
    if (splash && mainSite) {
        // Click splash to enter main site
        splash.addEventListener('click', function(e) {
            // Don't trigger if clicking audio button or links
            if (e.target.closest('.splash-audio-toggle') || e.target.closest('a')) return;
            
            // Hide splash and show main site
            splash.style.opacity = '0';
            splash.style.transform = 'scale(1.1)';
            
            setTimeout(function() {
                splash.style.display = 'none';
                mainSite.style.display = 'block';
                mainSite.style.opacity = '1';
                mainSite.classList.add('active');
            }, 1000);
        });
        
        // Touch support for mobile
        splash.addEventListener('touchend', function(e) {
            if (e.target.closest('.splash-audio-toggle') || e.target.closest('a')) return;
            e.preventDefault();
            
            splash.style.opacity = '0';
            splash.style.transform = 'scale(1.1)';
            
            setTimeout(function() {
                splash.style.display = 'none';
                mainSite.style.display = 'block';
                mainSite.style.opacity = '1';
                mainSite.classList.add('active');
            }, 1000);
        });
    }

    // Initialize navigation behavior
    handleNavVisibility();
    window.addEventListener('resize', handleNavVisibility);
});

// Viewport height fix for mobile browsers
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Audio toggle function
function toggleAudio(event) {
    event.stopPropagation();
    const audio = document.getElementById('backgroundAudio');
    const button = event.target;
    
    if (audio) {
        if (audio.paused) {
            audio.play().catch(function(error) {
                console.log('Audio play failed:', error);
            });
            button.innerHTML = '⏸';
            button.classList.add('playing');
        } else {
            audio.pause();
            button.innerHTML = '♪';
            button.classList.remove('playing');
        }
    } else {
        console.log('Audio element not found');
    }
}

// Mobile menu toggle function
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (navLinks && mobileMenu) {
        navLinks.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        
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
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const navLinks = document.getElementById('navLinks');
    const mobileMenu = document.querySelector('.mobile-menu');
    const nav = document.querySelector('.nav');
    
    // If mobile menu is open and click is outside nav area
    if (navLinks && navLinks.classList.contains('active') && 
        !nav.contains(event.target)) {
        toggleMobileMenu();
    }
});

// Handle navigation visibility on desktop
function handleNavVisibility() {
    const nav = document.querySelector('.nav');
    const mainSite = document.querySelector('.main-site');
    
    if (window.innerWidth > 768 && nav && mainSite) {
        // Show nav on mouse movement
        let mouseTimer;
        
        document.addEventListener('mousemove', function() {
            nav.classList.add('show-nav');
            clearTimeout(mouseTimer);
            
            mouseTimer = setTimeout(function() {
                nav.classList.remove('show-nav');
            }, 3000);
        });
        
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

// Gallery functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.gallery-slide');
const dots = document.querySelectorAll('.gallery-dot');
const totalSlides = slides.length;

function updateGallery() {
    const track = document.getElementById('landing-track');
    if (track) {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // Update progress bar
        const progress = document.querySelector('.gallery-progress');
        if (progress) {
            progress.style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
        }
    }
}

function nextSlide(galleryId) {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateGallery();
}

function previousSlide(galleryId) {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateGallery();
}

function goToSlide(galleryId, slideIndex) {
    currentSlide = slideIndex;
    updateGallery();
}

// Auto-advance gallery
setInterval(() => {
    if (slides.length > 0) {
        nextSlide('landing-gallery');
    }
}, 5000);

// Smooth scrolling for internal links (if needed for future pages)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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

// Performance optimization - preload critical images
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
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// Preload images after page load
window.addEventListener('load', preloadImages);

// Error handling for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            console.log('Image failed to load:', this.src);
            // You can add fallback image logic here
            // this.src = 'path/to/fallback-image.jpg';
        });
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
    });
});

// Handle page visibility changes (pause audio when tab not visible)
document.addEventListener('visibilitychange', function() {
    const audio = document.getElementById('backgroundAudio');
    if (audio && !audio.paused && document.hidden) {
        // Optionally pause audio when tab becomes hidden
        // audio.pause();
    }
});

// Keyboard accessibility
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
        nextSlide('landing-gallery');
    } else if (event.key === 'ArrowLeft') {
        previousSlide('landing-gallery');
    }
});

// Touch gesture improvements for mobile
let touchStartY = 0;
let touchStartX = 0;

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

// Gallery touch/swipe support
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

// Intersection Observer for lazy loading (if needed for future content)
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
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Console welcome message
console.log('%cDoor 64', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cWelcome to our digital experience', 'font-size: 14px; color: #666;');

// Debug mode toggle (for development)
if (window.location.hash === '#debug') {
    document.body.classList.add('debug-mode');
    console.log('Debug mode enabled');
}

// Performance monitoring (optional)
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`Page load time: ${pageLoadTime}ms`);
        }, 0);
    });
}

// Service worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment when you have a service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}

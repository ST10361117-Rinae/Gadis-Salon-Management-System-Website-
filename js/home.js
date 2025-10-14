import { db } from './firebase-config.js';
import { collection, onSnapshot, query, limit } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const hairstylesGrid = document.getElementById('hairstyles-grid');
    const productsGrid = document.getElementById('products-grid');
    const parallaxBg = document.getElementById('parallax-bg');
    const parallaxFg = document.getElementById('parallax-fg');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    // --- 1. Navbar & Parallax Scroll Effects ---
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;

        // Navbar style change
        if (scrollPos > 50) {
            navbar.classList.add('scrolled');
            navbar.classList.remove('transparent');
        } else {
            navbar.classList.add('transparent');
            navbar.classList.remove('scrolled');
        }

        // Parallax scroll for layers
        if (parallaxBg) {
            // Move background slower
            parallaxBg.style.transform = `translateY(${scrollPos * 0.3}px)`;
        }
        if (parallaxFg) {
            // Move foreground a bit faster than background
             parallaxFg.style.transform = `translate(-50%, calc(-50% + ${scrollPos * 0.15}px))`;
        }
    });

    // --- 2. Mobile Menu Toggle ---
    mobileMenuToggle.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
    });

    // --- 3. Smooth Scrolling for ALL Nav Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Close mobile menu after clicking a link
            if (mobileNav.classList.contains('open')) {
                mobileNav.classList.remove('open');
            }
        });
    });
    
    // --- 4. Staggered Animation Observer ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                // Stagger the children
                entry.target.querySelectorAll('.product-card').forEach((card, index) => {
                    card.style.setProperty('--delay', `${index * 100}ms`);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    if (hairstylesGrid) observer.observe(hairstylesGrid);
    if (productsGrid) observer.observe(productsGrid);


    // --- 5. Fetch Data from Firestore ---
    function fetchAndDisplayItems(collectionName, gridElement, detailPage) {
        // Add the 'stagger-in' class for the observer to find
        gridElement.classList.add('stagger-in');

        const q = query(collection(db, collectionName), limit(4));
        onSnapshot(q, (snapshot) => {
            let html = '';
            snapshot.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                const price = item.price || item.variants?.[0]?.price || 'N/A';
                html += `
                    <a href="${detailPage}.html#${item.id}" class="product-card">
                        <img src="${item.imageUrl}" alt="${item.name}">
                        <div class="card-content">
                            <h3>${item.name}</h3>
                            <p>From R${price}</p>
                        </div>
                    </a>
                `;
            });
            gridElement.innerHTML = html;
        });
    }

    // --- Load the data ---
    fetchAndDisplayItems("hairstyles", hairstylesGrid, "hairstyle-detail");
    fetchAndDisplayItems("products", productsGrid, "product-detail");
});


import { auth, db } from './firebase-config.js';
import { collection, onSnapshot, query, limit, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const hairstylesGrid = document.getElementById('hairstyles-grid');
    const productsGrid = document.getElementById('products-grid');
    const cartButton = document.getElementById('cart-button');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const detailModalOverlay = document.getElementById('detail-modal-overlay');

    let currentUser = null;

    // --- 1. Authentication ---
    onAuthStateChanged(auth, user => {
        currentUser = user;
        updateUIAfterAuthStateChange();
        if (user) {
            listenForCartUpdates(user.uid);
        } else {
            // Clear cart UI if user logs out
        }
    });

    function updateUIAfterAuthStateChange() {
        const loginLink = document.getElementById('login-link');
        const profileLink = document.getElementById('profile-link');
        const logoutButton = document.getElementById('logout-button');
        if (currentUser) {
            loginLink.style.display = 'none';
            profileLink.style.display = 'block';
            logoutButton.style.display = 'block';
            profileLink.href = `profile.html#${currentUser.uid}`;
        } else {
            loginLink.style.display = 'block';
            profileLink.style.display = 'none';
            logoutButton.style.display = 'none';
        }
    }

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
    
    // --- 4. Intersection Observer for Fade-In Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('fade-in-up');
        observer.observe(section);
    });


    // --- 5. Fetch Data from Firestore ---
    function fetchAndDisplayItems(collectionName, gridElement, detailPagePrefix) {
        const q = query(collection(db, collectionName), limit(4));
        onSnapshot(q, (snapshot) => {
            let html = '';
            snapshot.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                const price = item.price || item.variants?.[0]?.price || 'N/A';
                const isSoldOut = item.variants ? item.variants.every(v => v.stock <= 0) : false;

                html += `
                    <div class="product-card" data-id="${item.id}" data-type="${collectionName}">
                        ${isSoldOut ? '<div class="sold-out-overlay">Sold Out</div>' : ''}
                        <img src="${item.imageUrl}" alt="${item.name}">
                        <div class="card-content">
                            <h3>${item.name}</h3>
                            <p>From R${price}</p>
                        </div>
                    </div>
                `;
            });
            gridElement.innerHTML = html;
        });
    }

    fetchAndDisplayItems("hairstyles", hairstylesGrid, "hairstyle");
    fetchAndDisplayItems("products", productsGrid, "product");

    // --- 4. Modal Logic (Details, Cart) ---
    function openModal(overlay) {
        overlay.style.display = 'flex';
        modalBackdrop.style.display = 'block';
    }
    function closeModal(overlay) {
        overlay.style.display = 'none';
        modalBackdrop.style.display = 'none';
    }
    
    // Event delegation for opening detail modals
    document.querySelector('main').addEventListener('click', async (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
            const itemId = card.dataset.id;
            const itemType = card.dataset.type; // 'hairstyles' or 'products'
            const docRef = doc(db, itemType, itemId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                renderDetailModal(docSnap.data(), itemType);
                openModal(detailModalOverlay);
            }
        }
    });

    function renderDetailModal(item, type) {
        const modalContent = detailModalOverlay.querySelector('.modal');
        if (type === 'products') {
            // Render product detail view with variants
            let variantsHtml = '';
            item.variants.forEach(v => { variantsHtml += `<option value="${v.size}">${v.size} - R${v.price}</option>`; });
            modalContent.innerHTML = `
                <div class="modal-body">
                     <img src="${item.imageUrl}" class="product-image">
                     <div class="product-info">
                         <h2>${item.name}</h2>
                         <select id="variant-selector">${variantsHtml}</select>
                         <button class="btn add-to-cart-btn" data-product-id="${item.id}">Add to Cart</button>
                     </div>
                </div>`;
        } else {
            // Render hairstyle detail view
             modalContent.innerHTML = `...`; // Similar structure for hairstyles
        }
    }
    
    cartButton.addEventListener('click', () => cartModal.classList.add('open'));
    closeCartBtn.addEventListener('click', () => cartModal.classList.remove('open'));
    
    // --- 5. Cart Functionality ---
    async function addToCart(productId, selectedSize) {
        // ... (Logic to add item to Firestore user's cart subcollection)
    }

    function listenForCartUpdates(uid) {
        // ... (onSnapshot for user's cart, call renderCart)
    }

    function renderCart(cartItems) {
        // ... (Build HTML for cart items and update cart total)
    }
    
    // Close modals when backdrop is clicked
    modalBackdrop.addEventListener('click', () => {
        closeModal(detailModalOverlay);
    });

});


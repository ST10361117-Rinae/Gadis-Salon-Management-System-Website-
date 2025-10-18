// --- 1. FIREBASE SETUP & MODULE IMPORTS ---
import { auth, db, functions, storage } from './firebase-config.js';
import { collection, onSnapshot, query, limit, doc, getDoc, updateDoc, setDoc, deleteDoc, addDoc, serverTimestamp, where, orderBy, writeBatch, getDocs, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-functions.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";


// --- 2. MAIN APPLICATION LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing home.js...");

    // --- NEW: AUTH REDIRECT ALERT FUNCTION ---
    function showAuthRedirectAlert(message) {
        if (document.querySelector('.auth-alert-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'auth-alert-overlay';

        const box = document.createElement('div');
        box.className = 'auth-alert-box';
        box.innerHTML = `<p>${message}</p><p class="redirect-text">Redirecting to login...</p>`;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // This ensures the element is in the DOM before we try to animate it
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2500);
    }


    // --- ELEMENT SELECTIONS ---
    const navbar = document.getElementById('navbar');
    const hairstylesGrid = document.getElementById('hairstyles-grid');
    const productsGrid = document.getElementById('products-grid');
    const cartButton = document.getElementById('cart-button');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartBadge = document.getElementById('cart-badge');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const detailModalOverlay = document.getElementById('detail-modal-overlay');
    const bookingModal = document.getElementById('booking-modal');
    const closeBookingBtn = document.getElementById('booking-modal-close-btn');
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    const notificationsButton = document.getElementById('notifications-button');
    const notificationsBadge = document.getElementById('notifications-badge');
    const myBookingsLink = document.getElementById('my-bookings-link');
    const myOrdersLink = document.getElementById('my-orders-link');
    const editProfileLink = document.getElementById('edit-profile-link');
    const myBookingsPanel = document.getElementById('my-bookings-panel');
    const myOrdersPanel = document.getElementById('my-orders-panel');
    const notificationsPanel = document.getElementById('notifications-panel');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const contactModal = document.getElementById('contact-modal');
    const bookingDetailModal = document.getElementById('booking-detail-modal');
    const logoutButton = document.getElementById('logout-button');
    const themeToggle = document.getElementById('theme-toggle');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const favButton = document.getElementById('fav-button');
    const favoritesModal = document.getElementById('favorites-modal');
    const closeFavoritesBtn = document.getElementById('close-favorites-btn');
    const favoritesItemsContainer = document.getElementById('favorites-items-container');
    const viewAllHairstylesBtn = document.getElementById('view-all-hairstyles');
    const viewAllProductsBtn = document.getElementById('view-all-products');
    const parallaxBg = document.getElementById('parallax-bg');
    const parallaxFg = document.getElementById('parallax-fg');
    const heroContent = document.getElementById('hero-content');


    let currentUser = null;
    let userFavorites = [];

    // --- 2.1. AUTHENTICATION & CORE UI ---
    onAuthStateChanged(auth, async user => {
        console.log("Auth state changed. User:", user ? user.uid : "Logged Out");
        currentUser = user;
        updateUIAfterAuthStateChange();
        if (user) {
            // CORRECTED: Welcome animation logic
            const justLoggedIn = sessionStorage.getItem('justLoggedIn');
            if (justLoggedIn === 'true') {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    console.log("Welcome animation triggered for:", userDoc.data().name);
                    showWelcomeAnimation(userDoc.data().name);
                    // Remove the flag so it doesn't run on refresh
                    sessionStorage.removeItem('justLoggedIn');
                }
            }

            listenForCartUpdates(user.uid);
            listenForFavoritesUpdates(user.uid);
            listenForMyBookings(user.uid);
            listenForMyOrders(user.uid);
            listenForNotifications(user.uid);
            editProfileLink.href = `#edit-profile/${user.uid}`;
        } else {
            renderCart([]); renderFavorites([]); renderMyBookings([]); renderMyOrders([]); renderNotifications([]);
        }
    });

    // Event listeners for profile dropdown links
    myBookingsLink.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(myBookingsPanel, true); });
    myOrdersLink.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(myOrdersPanel, true); });
    editProfileLink.addEventListener('click', (e) => { e.preventDefault(); openEditProfileModal(); });
    notificationsButton.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(notificationsPanel, true); });
    document.querySelector('a[href="#contact"]')?.addEventListener('click', (e) => { e.preventDefault(); openContactModal(); });


    function updateUIAfterAuthStateChange() {
        const authLinks = document.getElementById('auth-links');
        const userLinks = document.getElementById('user-links');
        if (currentUser) {
            authLinks.style.display = 'none';
            userLinks.style.display = 'block';
        } else {
            authLinks.style.display = 'block';
            userLinks.style.display = 'none';
        }
    }

    logoutButton.addEventListener('click', () => signOut(auth));

    profileButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevents the window click from closing it immediately
        profileDropdown.classList.toggle('open');
    });
    
    window.addEventListener('click', (e) => {
        if (profileButton && !profileButton.contains(e.target) && profileDropdown && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('open');
        }
    });

    themeToggle.addEventListener('change', () => {
        document.documentElement.classList.toggle('dark-mode', themeToggle.checked);
        localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
    });

    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-mode');
        themeToggle.checked = true;
    }

    // --- 2.2. ANIMATIONS, SCROLL & MOBILE MENU ---
     window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;
        if (navbar) {
            if (scrollPos > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        if (parallaxBg) parallaxBg.style.transform = `translateY(${scrollPos * 0.2}px)`;
        if (parallaxFg) parallaxFg.style.transform = `translateY(${scrollPos * 0.4}px)`;
        if (heroContent) {
             const parallaxTextBack = document.getElementById('parallax-text-back');
             const parallaxTextFront = document.getElementById('parallax-text-front');
             if(parallaxTextBack) parallaxTextBack.style.transform = `translateY(${scrollPos * 0.3}px)`;
             if(parallaxTextFront) parallaxTextFront.style.transform = `translateY(${scrollPos * 0.3}px)`;
             heroContent.style.transform = `translateY(calc(120px + ${scrollPos * 0.5}px))`;
        }
     });

    mobileMenuToggle.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
    });

    const navLinks = document.querySelector('.navbar-links');
    if (mobileNav && navLinks) {
        mobileNav.innerHTML = navLinks.innerHTML;
    }

    // Smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.length > 1 && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
                if (mobileNav.classList.contains('open')) {
                    mobileNav.classList.remove('open');
                }
            }
        });
    });

    // --- NEW: WELCOME ANIMATION FUNCTION ---
    function showWelcomeAnimation(userName) {
        const welcomeMessage = document.getElementById('welcome-message');
        if (!welcomeMessage) return;

        welcomeMessage.textContent = `Welcome, ${userName.split(' ')[0]}!`;
        // FIX: Use 'show' class to match the CSS for the animation
        welcomeMessage.classList.add('show');

        setTimeout(() => {
            // FIX: Use 'show' class to match the CSS for the animation
            welcomeMessage.classList.remove('show');
        }, 8000); // The message will be visible for 4 seconds
    }

    // --- NEW: RANDOM HERO IMAGE SETUP ---
    function setupRandomHeroImage() {
        const totalImages = 12;
        let allImageNumbers = Array.from({ length: totalImages }, (_, i) => i + 1);
        let seenNumbers = JSON.parse(localStorage.getItem('seenHeroImages')) || [];

        if (seenNumbers.length >= totalImages) {
            seenNumbers = []; // Reset if all images have been seen
        }

        let availableNumbers = allImageNumbers.filter(num => !seenNumbers.includes(num));
        if (availableNumbers.length === 0) {
            // This case handles if seenNumbers somehow has invalid data, we just reset.
            seenNumbers = [];
            availableNumbers = allImageNumbers;
        }

        const chosenNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        seenNumbers.push(chosenNumber);
        localStorage.setItem('seenHeroImages', JSON.stringify(seenNumbers));

        // Preload the foreground image to ensure it's ready before fading in
        const modelImage = new Image();
        modelImage.src = `images/model-foreground${chosenNumber}.png`;

        modelImage.onload = () => {
            if (parallaxBg) {
                parallaxBg.style.backgroundImage = `url('images/bg${chosenNumber}.jpg')`;
                parallaxBg.classList.add('fade-in');
            }
            if (parallaxFg) {
                parallaxFg.src = modelImage.src;
                parallaxFg.classList.add('fade-in');
            }
        };
    }
    setupRandomHeroImage();

    // --- 2.3. DATA FETCHING (Hairstyles & Products) ---
    function fetchAndDisplayItems(collectionName, gridElement, limitCount = 4) {
        if (!gridElement) return;
        let q = collection(db, collectionName);
        if (limitCount > 0) {
            q = query(q, limit(limitCount));
        }
        onSnapshot(q, (snapshot) => {
            let html = '';
            snapshot.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                const price = item.price || item.variants?.[0]?.price || 0;
                const isSoldOut = item.variants ? item.variants.every(v => v.stock <= 0) : false;
                html += `<div class="product-card ${isSoldOut ? 'sold-out' : ''}" data-id="${item.id}" data-type="${collectionName}">${isSoldOut ? '<div class="sold-out-overlay">Sold Out</div>' : ''}<img src="${item.imageUrl || 'https://placehold.co/400x400/F4DCD6/7C4F55?text=Style'}" alt="${item.name}"><div class="card-content"><h3>${item.name}</h3><p>From R${price.toFixed(2)}</p></div></div>`;
            });
            gridElement.innerHTML = html;
            
            // NEW: Add fade-in animation to newly loaded items
            gridElement.querySelectorAll('.product-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 100}ms`;
                card.classList.add('fade-in');
            });
        });
    }

    fetchAndDisplayItems("hairstyles", hairstylesGrid, 6);
    fetchAndDisplayItems("products", productsGrid, 6);

    viewAllHairstylesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fetchAndDisplayItems("hairstyles", hairstylesGrid, 0);
        e.target.parentElement.style.display = 'none';
    });
    viewAllProductsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fetchAndDisplayItems("products", productsGrid, 0);
        e.target.parentElement.style.display = 'none';
    });

    // --- 2.4. MODAL & OFF-CANVAS LOGIC ---
    function toggleOffCanvas(modal, show) {
        if (!modal) return; // Add a check to prevent errors if the modal element doesn't exist
        modalBackdrop.style.display = show ? 'block' : 'none';
        modal.classList.toggle('open', show);
        document.body.style.overflow = show ? 'hidden' : '';
    }

    function toggleDetailModal(show) {
        if (!detailModalOverlay || !modalBackdrop) return;
        detailModalOverlay.style.display = show ? 'flex' : 'none';
        modalBackdrop.style.display = show ? 'block' : 'none';
        document.body.style.overflow = show ? 'hidden' : '';
    }

    cartButton.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(cartModal, true); });
    closeCartBtn.addEventListener('click', () => toggleOffCanvas(cartModal, false));
    favButton.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(favoritesModal, true); });
    closeFavoritesBtn.addEventListener('click', () => toggleOffCanvas(favoritesModal, false));
    closeBookingBtn.addEventListener('click', () => toggleOffCanvas(bookingModal, false));

    modalBackdrop?.addEventListener('click', () => {
        toggleOffCanvas(cartModal, false);
        toggleOffCanvas(favoritesModal, false);
        toggleOffCanvas(bookingModal, false);
        toggleOffCanvas(myBookingsPanel, false);
        toggleOffCanvas(myOrdersPanel, false);
        toggleOffCanvas(notificationsPanel, false);
        toggleDetailModal(false);
        if (editProfileModal) editProfileModal.style.display = 'none';
        if(bookingDetailModal) bookingDetailModal.style.display = 'none';

    });
    
    // Close off-canvas panels with their specific buttons
    document.querySelectorAll('.close-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.closest('.off-canvas, .modal-overlay');
            if (panel) {
                 if (panel.classList.contains('off-canvas')) {
                    toggleOffCanvas(panel, false);
                 } else {
                    panel.style.display = 'none';
                    modalBackdrop.style.display = 'none';
                    document.body.style.overflow = '';
                 }
            }
        });
    });


    // --- 2.5. EVENT DELEGATION & MODAL RENDERING ---
    document.body.addEventListener('click', async (e) => {
        const card = e.target.closest('.product-card:not(.sold-out)');
        if (card) {
            const itemId = card.dataset.id;
            const itemType = card.dataset.type;
            const docRef = doc(db, itemType, itemId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                renderDetailModal({ id: docSnap.id, ...docSnap.data() }, itemType);
                toggleDetailModal(true);
            }
        }
        
        if (e.target.matches('.add-to-cart-btn')) {
            // FIX: Use custom alert and redirect if user is not logged in
            if (!currentUser) { 
                showAuthRedirectAlert("Please log in to add items to your cart.");
                return; 
            }
            const variantSelector = document.getElementById('variant-selector');
            if (variantSelector) {
                addToCart(e.target.dataset.productId, variantSelector.value);
            }
        }
        
        if (e.target.matches('.book-now-btn')) {
            // FIX: Use custom alert and redirect if user is not logged in
            if (!currentUser) { 
                showAuthRedirectAlert("Please log in to book an appointment.");
                return; 
            }
            const hairstyleId = e.target.dataset.hairstyleId;
            const hairstyleDoc = await getDoc(doc(db, "hairstyles", hairstyleId));
            if (hairstyleDoc.exists()) {
                openBookingModal({ id: hairstyleDoc.id, ...hairstyleDoc.data() });
            }
        }
        
        if (e.target.matches('.favorite-btn-modal') || e.target.closest('.favorite-btn-modal')) {
             // FIX: Use custom alert and redirect if user is not logged in
            if (!currentUser) { 
                showAuthRedirectAlert("Please log in to manage your favorites.");
                return; 
            }
            const button = e.target.closest('.favorite-btn-modal');
            toggleFavorite(button.dataset.id, button.dataset.type);
        }

        if (e.target.matches('.modal-close-btn')) {
            toggleDetailModal(false);
        }
    });

    function renderDetailModal(item, type) {
        if (!detailModalOverlay) return;
        const modalContent = detailModalOverlay.querySelector('.modal');
        const isFavorited = userFavorites.includes(item.id);
        let innerHtml = '';
        const favoriteButtonHtml = `<button class="favorite-btn-modal ${isFavorited ? 'favorited' : ''}" data-id="${item.id}" data-type="${type}"><i class="fas fa-heart"></i></button>`;
        const closeButtonHtml = `<button class="close-btn modal-close-btn">&times;</button>`;

        if (type === 'products') {
            let variantsHtml = '';
            item.variants.forEach(v => {
                variantsHtml += `<option value="${v.size}" ${v.stock <= 0 ? 'disabled' : ''}>${v.size} - R${v.price.toFixed(2)} ${v.stock <= 0 ? '(Out of Stock)' : ''}</option>`;
            });
            innerHtml = `${favoriteButtonHtml}${closeButtonHtml}<div class="modal-body"><img src="${item.imageUrl}" class="product-image" alt="${item.name}"><div class="product-info"><h2>${item.name}</h2><p>${item.description || ''}</p><select id="variant-selector">${variantsHtml}</select><button class="book-btn add-to-cart-btn" data-product-id="${item.id}">Add to Cart</button></div></div>`;
        } else if (type === 'hairstyles') {
            innerHtml = `${favoriteButtonHtml}${closeButtonHtml}<div class="modal-body"><img src="${item.imageUrl}" class="product-image" alt="${item.name}"><div class="product-info"><h2>${item.name}</h2><p>${item.description}</p><p><strong>Duration:</strong> ${item.durationHours} hours</p><h3>R${item.price.toFixed(2)}</h3><button class="book-btn book-now-btn" data-hairstyle-id="${item.id}">Book Now</button></div></div>`;
        }
        modalContent.innerHTML = innerHtml;
    }

    // --- 2.6. CART & FAVORITES FUNCTIONALITY ---
    async function addToCart(productId, selectedSize) {
        if (!currentUser) return;
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) return;

        const product = productSnap.data();
        const variant = product.variants.find(v => v.size === selectedSize);
        if (!variant || variant.stock <= 0) {
            alert("This item is out of stock.");
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const cart = userSnap.exists() && userSnap.data().cart ? userSnap.data().cart : [];
        const itemIndex = cart.findIndex(item => item.productId === productId && item.size === selectedSize);

        if (itemIndex > -1) {
            cart[itemIndex].quantity += 1;
        } else {
            cart.push({ productId, name: product.name, size: selectedSize, price: variant.price, quantity: 1, imageUrl: product.imageUrl });
        }

        await setDoc(userRef, { cart }, { merge: true });
        alert(`${product.name} added to cart!`);
        toggleDetailModal(false);
    }

    function listenForCartUpdates(uid) {
        onSnapshot(doc(db, 'users', uid), (docSnap) => {
            renderCart(docSnap.exists() ? docSnap.data().cart || [] : []);
        });
    }

    function renderCart(cartItems) {
        if (!cartItemsContainer || !cartBadge || !cartTotalPrice) return;

        console.log("Rendering cart with items:", cartItems);

        if (!cartItems || cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            cartBadge.style.display = 'none';
            cartTotalPrice.textContent = 'R0.00';
            return;
        }
        let totalItems = 0, totalPrice = 0;
        let cartHtml = '';
        cartItems.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;
            cartHtml += `<div class="cart-item" data-id="${item.productId}_${item.size}"><img src="${item.imageUrl}" class="cart-item-image"><div class="cart-item-details"><h4>${item.name}</h4><p>${item.size}</p><div class="quantity-selector"><button class="quantity-btn" data-action="decrease">-</button><span>${item.quantity}</span><button class="quantity-btn" data-action="increase">+</button></div></div><button class="remove-item-btn">&times;</button></div>`;
        });
        cartItemsContainer.innerHTML = cartHtml;
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'block';
        cartTotalPrice.textContent = `R${totalPrice.toFixed(2)}`;
    }
    
    cartItemsContainer?.addEventListener('click', (e) => {
        // --- DEBUGGING: Log cart interactions ---
        console.log("Cart interaction detected. Target:", e.target);
        const cartItemEl = e.target.closest('.cart-item');
        if (!cartItemEl) return;

        const [productId, size] = cartItemEl.dataset.id.split('_');
        console.log(`Item ID: ${productId}, Size: ${size}`);

        if (e.target.matches('.quantity-btn')) {
            const action = e.target.dataset.action;
            console.log(`Quantity button clicked. Action: ${action}`);
            updateCartQuantity(productId, size, action);
        }
        if (e.target.matches('.remove-item-btn')) {
            console.log('Remove button clicked.');
            removeFromCart(productId, size);
        }
    });

    async function updateCartQuantity(productId, size, action) {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw "Document does not exist!";
                }
                // Get a fresh copy of the cart, or an empty array
                const cart = userDoc.data().cart || [];
                const itemIndex = cart.findIndex(item => item.productId === productId && item.size === size);
    
                if (itemIndex > -1) {
                    if (action === 'increase') {
                        cart[itemIndex].quantity++;
                    } else if (action === 'decrease') {
                        cart[itemIndex].quantity--;
                    }
                    
                    // If quantity is zero or less, remove the item
                    if (cart[itemIndex].quantity <= 0) {
                        cart.splice(itemIndex, 1);
                    }
                    transaction.update(userRef, { cart: cart });
                }
            });
            console.log("Cart quantity updated successfully via transaction!");
        } catch (e) {
            console.error("Cart quantity transaction failed: ", e);
        }
    }

    async function removeFromCart(productId, size) {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw "Document does not exist!";
                }
                const cart = userDoc.data().cart || [];
                // Filter creates a new array without the matching item
                const updatedCart = cart.filter(item => !(item.productId === productId && item.size === size));
                
                // Only update if the cart has changed
                if (cart.length !== updatedCart.length) {
                     transaction.update(userRef, { cart: updatedCart });
                }
            });
            console.log("Item removed from cart successfully via transaction!");
        } catch(e) {
            console.error("Remove from cart transaction failed: ", e);
        }
    }

    function listenForFavoritesUpdates(uid) {
        onSnapshot(collection(db, 'users', uid, 'favorites'), (snapshot) => {
            userFavorites = snapshot.docs.map(doc => doc.id); 
            const favoriteItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFavorites(favoriteItems);
        });
    }
    
    function renderFavorites(items) {
        if (!items || items.length === 0) {
            favoritesItemsContainer.innerHTML = '<p>You have no favorite items yet.</p>';
            return;
        }
        let html = '';
        items.forEach(item => {
            let priceInfo = '';
            let actionButton = '';

            // Check if the item is a Product or a Hairstyle
            if (item.type === 'PRODUCT') {
                const firstVariant = item.variants?.[0];
                if (firstVariant) {
                    priceInfo = `<p>From R${firstVariant.price.toFixed(2)}</p>`;
                    actionButton = `<button class="action-btn fav-add-to-cart" data-id="${item.id}">Add to Cart</button>`;
                }
            } else if (item.type === 'HAIRSTYLE') {
                priceInfo = `<p>R${item.price.toFixed(2)}</p>`;
                actionButton = `<button class="action-btn fav-book-now" data-id="${item.id}">Book Now</button>`;
            }

            html += `
                <div class="favorite-item">
                    <img src="${item.imageUrl}" class="favorite-item-image" alt="${item.name}">
                    <div class="favorite-item-details">
                        <h4>${item.name}</h4>
                        ${priceInfo}
                        <div class="favorite-actions">
                            ${actionButton}
                            <button class="action-btn remove" data-id="${item.id}" data-type="${item.type.toLowerCase() === 'product' ? 'products' : 'hairstyles'}">Remove</button>
                        </div>
                    </div>
                </div>`;
        });
        favoritesItemsContainer.innerHTML = html;
    }
    
    async function toggleFavorite(itemId, itemType) {
        if (!currentUser) return;
        const favRef = doc(db, 'users', currentUser.uid, 'favorites', itemId);
        const modalFavBtn = document.querySelector(`.favorite-btn-modal[data-id="${itemId}"]`);

        if (userFavorites.includes(itemId)) {
            await deleteDoc(favRef);
            if (modalFavBtn) modalFavBtn.classList.remove('favorited');
        } else {
            const itemSnap = await getDoc(doc(db, itemType, itemId));
            if (itemSnap.exists()) {
                await setDoc(favRef, itemSnap.data());
                if (modalFavBtn) modalFavBtn.classList.add('favorited');
            }
        }
    }

    favoritesItemsContainer.addEventListener('click', async (e) => {
        const target = e.target;
        const favoriteItem = target.closest('.favorite-item');
        if (!favoriteItem && !target.matches('.action-btn')) return;

        if (target.matches('.remove')) {
            const itemId = target.dataset.id;
            const itemType = target.dataset.type;
            toggleFavorite(itemId, itemType);
        }

        if (target.matches('.fav-book-now')) {
            const hairstyleId = target.dataset.id;
            const hairstyleDoc = await getDoc(doc(db, "hairstyles", hairstyleId));
            if (hairstyleDoc.exists()) {
                openBookingModal({ id: hairstyleDoc.id, ...hairstyleDoc.data() });
                toggleOffCanvas(favoritesModal, false); // Close favorites panel
            }
        }

        if (target.matches('.fav-add-to-cart')) {
            const productId = target.dataset.id;
            const productDoc = await getDoc(doc(db, "products", productId));
            if (productDoc.exists()) {
                const firstVariant = productDoc.data().variants?.[0];
                if (firstVariant) {
                    addToCart(productId, firstVariant.size);
                    toggleOffCanvas(favoritesModal, false); // Close favorites panel
                }
            }
        }
    });

    // --- 2.7. BOOKING SYSTEM FUNCTIONALITY ---
    let currentBookingItem = null;
    let selectedBooking = { stylist: null, date: null, time: null };
    let currentDate = new Date(); // For tracking calendar month

    async function openBookingModal(hairstyle) {
        console.log("--- Opening Booking Modal ---");
        console.log("Hairstyle:", hairstyle.name);
        currentBookingItem = hairstyle;
        selectedBooking = { stylist: "Any Available", date: null, time: null };
        toggleDetailModal(false);

        const modalBody = document.getElementById('booking-modal-body');
        modalBody.innerHTML = '<p>Loading booking options...</p>';
        toggleOffCanvas(bookingModal, true);
        
        const stylistIds = hairstyle.availableStylistIds || [];
        const stylists = [];
        for (const id of stylistIds) {
            const stylistDoc = await getDoc(doc(db, "users", id));
            if (stylistDoc.exists()) stylists.push({ id: stylistDoc.id, ...stylistDoc.data() });
        }
        
        renderBookingUI(stylists);
        // Set today's date as the default selection
        const today = new Date();
        today.setHours(0,0,0,0);
        const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        selectedBooking.date = todayString;
        console.log("Default date selected:", selectedBooking.date);
        
        // Visually select today in the calendar and fetch times
        document.querySelector(`.date-day[data-date="${selectedBooking.date}"]`)?.classList.add('selected');
        handleBookingSelectionChange();
    }

    function renderBookingUI(stylists) {
        console.log("Rendering booking UI elements.");
        const modalBody = document.getElementById('booking-modal-body');
        const hairstyleInfoHtml = `<div class="booking-hairstyle-info"><h4>${currentBookingItem.name}</h4><p>Duration: ${currentBookingItem.durationHours} hours</p></div>`;

        let stylistsHtml = '<div class="stylist-selector" id="stylist-selector"><input type="radio" name="stylist" id="any-stylist" value="Any Available" checked><label for="any-stylist"><span>Any Available</span></label>';
        stylists.forEach(s => {
            stylistsHtml += `<input type="radio" name="stylist" id="stylist-${s.id}" value="${s.name}"><label for="stylist-${s.id}"><img src="${s.imageUrl || 'https://placehold.co/50x50/F4DCD6/7C4F55?text=S'}" alt="${s.name}"><span>${s.name}</span></label>`;
        });
        stylistsHtml += '</div>';
        
        const datePickerHtml = `<div class="date-picker-header"><button id="prev-month">&lt;</button><span id="current-month-year"></span><button id="next-month">&gt;</button></div><div class="date-grid" id="date-grid"></div>`;
        
        const paymentHtml = `<div class="payment-selector"><input type="radio" name="payment" id="radio-cash" value="cash" checked><label for="radio-cash">Pay with Cash</label><input type="radio" name="payment" id="radio-card" value="card" disabled><label for="radio-card">Pay with Card (Unavailable)</label></div>`;

        modalBody.innerHTML = `${hairstyleInfoHtml}<div class="booking-step"><h3>Select Stylist</h3>${stylistsHtml}</div><div class="booking-step"><h3>Select Date</h3>${datePickerHtml}</div><div class="booking-step"><h3>Available Times</h3><div id="time-slot-grid" class="time-slot-grid"></div></div><div class="booking-step"><h3>Payment Method</h3>${paymentHtml}</div><button id="confirm-booking-btn" class="btn book-btn" disabled>Confirm Booking</button>`;

        renderCalendar();
        addBookingEventListeners();
    }

    function addBookingEventListeners() {
        document.getElementById('stylist-selector').addEventListener('change', handleBookingSelectionChange);
        document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
        document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
        document.getElementById('date-grid').addEventListener('click', (e) => {
            const dayEl = e.target.closest('.date-day:not(.disabled)');
            if (!dayEl) return;
            document.querySelectorAll('.date-day.selected').forEach(d => d.classList.remove('selected'));
            dayEl.classList.add('selected');
            selectedBooking.date = dayEl.dataset.date;
            console.log(`Calendar date clicked. New selected date: ${selectedBooking.date}`);
            handleBookingSelectionChange();
        });
        document.getElementById('time-slot-grid').addEventListener('click', handleTimeSlotSelection);
        document.getElementById('confirm-booking-btn').addEventListener('click', confirmBooking);
    }

    function renderCalendar() {
        const dateGrid = document.getElementById('date-grid');
        const monthYearEl = document.getElementById('current-month-year');
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        dateGrid.innerHTML = '';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => { dateGrid.innerHTML += `<div class="day-name">${day}</div>`; });
        const firstDayOfMonth = new Date(year, month, 1);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) { dateGrid.innerHTML += '<div></div>'; }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const yearStr = date.getFullYear();
            const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
            const dayStr = date.getDate().toString().padStart(2, '0');
            const dateString = `${yearStr}-${monthStr}-${dayStr}`;
            
            const isPast = date < today;
            const isSelected = dateString === selectedBooking.date;
            dateGrid.innerHTML += `<div class="date-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateString}">${i}</div>`;
        }
    }
    
    async function handleBookingSelectionChange() {
        const selectedStylistEl = document.querySelector('input[name="stylist"]:checked');
        selectedBooking.stylist = selectedStylistEl ? selectedStylistEl.value : null;
        selectedBooking.time = null; // Reset time on any change

        const timeSlotGrid = document.getElementById('time-slot-grid');
        if (!selectedBooking.stylist || !selectedBooking.date) {
            timeSlotGrid.innerHTML = 'Please select a stylist and date.';
            return;
        }

        timeSlotGrid.innerHTML = '<p>Loading times...</p>';
        
        // FIX: Reverted date formatting. We will now send the clean 'YYYY-MM-DD' date string 
        // directly to the Firebase Function. This matches the format the Android app will now use.
        const dateToSend = selectedBooking.date;
        console.log(`Fetching slots for date string: "${dateToSend}"`);

        const getAvailableSlots = httpsCallable(functions, 'getAvailableSlots');
        try {
            // FIX: Pass the clean 'YYYY-MM-DD' date directly.
            const result = await getAvailableSlots({ stylistName: selectedBooking.stylist, date: dateToSend, hairstyleId: currentBookingItem.id });
            const availableSlots = new Set(result.data.slots || []);
            const hoursDoc = await getDoc(doc(db, "app_content", "salon_hours"));
            const allSlots = hoursDoc.data().time_slots || [];
            const occupiedSlots = new Set(allSlots.filter(slot => !availableSlots.has(slot)));

            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            if (selectedBooking.date === todayString) {
                const leadTimeHour = today.getHours() + 3;
                allSlots.forEach(slot => {
                    if (parseInt(slot.split(':')[0]) < leadTimeHour) occupiedSlots.add(slot);
                });
            }
            console.log("Occupied slots found:", Array.from(occupiedSlots));
            renderTimeSlots(allSlots, occupiedSlots);
        } catch (error) {
            console.error("Error fetching time slots:", error);
            timeSlotGrid.innerHTML = '<p>Could not load available times.</p>';
        }
        updateConfirmButtonState();
    }

    function renderTimeSlots(allSlots, occupiedSlots) {
        const timeSlotGrid = document.getElementById('time-slot-grid');
        if (!allSlots || allSlots.length === 0) {
            timeSlotGrid.innerHTML = '<p>No available times for this day.</p>'; return;
        }
        timeSlotGrid.innerHTML = allSlots.map(slot => {
            const isOccupied = occupiedSlots.has(slot);
            return `<button class="time-slot-btn" ${isOccupied ? 'disabled' : ''}>${slot}</button>`;
        }).join('');
    }
    
    
    function handleTimeSlotSelection(e) {
        if (e.target.matches('.time-slot-btn:not(:disabled)')) {
            document.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedBooking.time = e.target.textContent;
            updateConfirmButtonState();
        }
    }
    
    function updateConfirmButtonState() {
        const btn = document.getElementById('confirm-booking-btn');
        btn.disabled = !(selectedBooking.stylist && selectedBooking.date && selectedBooking.time);
    }

    async function confirmBooking() {
        if (!currentUser || !currentBookingItem || !selectedBooking.stylist || !selectedBooking.date || !selectedBooking.time) {
            return alert("Please complete all booking selections.");
        }
        
        // FIX: Reverted all date formatting here as well. The selectedBooking.date is already 'YYYY-MM-DD'.
        const dateToSave = selectedBooking.date;
        
        console.log(`--- Confirming Booking ---`);
        console.log(`Final Date String for Firestore: "${dateToSave}"`);
        
        const bookingData = {
            hairstyleId: currentBookingItem.id, serviceName: currentBookingItem.name, customerId: currentUser.uid,
            customerName: currentUser.displayName || 'Customer', stylistName: selectedBooking.stylist,
            // FIX: Save the clean 'YYYY-MM-DD' date string directly to Firestore.
            date: dateToSave, 
            time: selectedBooking.time, status: "Pending",
            timestamp: Date.now() 
        };

        try {
            await addDoc(collection(db, "bookings"), bookingData);
            alert("Booking successful! You will be notified once it's confirmed.");
            toggleOffCanvas(bookingModal, false);
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("Sorry, there was an error creating your booking.");
        }
    }

    // --- NEW: 2.8. PROFILE FEATURES (BOOKINGS, ORDERS, NOTIFICATIONS) ---
    function listenForMyBookings(uid) {
        const q = query(collection(db, "bookings"), where("customerId", "==", uid), orderBy("timestamp", "desc"));
        onSnapshot(q, (snapshot) => renderMyBookings(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    
    async function renderMyBookings(bookings) {
        const container = document.getElementById('my-bookings-container');
        if(!container) return;
        if (bookings.length === 0) { container.innerHTML = '<p>You have no bookings yet.</p>'; return; }
        
        // Use Promise.all to fetch all images in parallel for better performance
        const bookingCardsHtml = await Promise.all(bookings.map(async b => {
            const hairstyleDoc = await getDoc(doc(db, "hairstyles", b.hairstyleId));
            const imageUrl = hairstyleDoc.exists() ? hairstyleDoc.data().imageUrl : 'https://placehold.co/400x400/F4DCD6/7C4F55?text=Style';
            
            return `
                <div class="list-item-card with-image" data-booking-id="${b.id}">
                    <img src="${imageUrl}" alt="${b.serviceName}" class="item-card-image">
                    <div class="item-card-content">
                        <h4>${b.serviceName}</h4>
                        <p>With ${b.stylistName} on ${b.date} at ${b.time}</p>
                        <p>Status: <span class="status-badge status-${b.status.toLowerCase()}">${b.status}</span></p>
                    </div>
                </div>
            `;
        }));

        container.innerHTML = bookingCardsHtml.join('');
    }

    function listenForMyOrders(uid) {
        const q = query(collection(db, "product_orders"), where("customerId", "==", uid), orderBy("timestamp", "desc"));
        onSnapshot(q, (snapshot) => renderMyOrders(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
    }

    function renderMyOrders(orders) {
        const container = document.getElementById('my-orders-container');
        if (!container) return;
        if (orders.length === 0) { container.innerHTML = '<p>You have no past orders.</p>'; return; }
        container.innerHTML = orders.map(o => `
            <div class="list-item-card order-card" data-order-id="${o.id}">
                <h4>Order #${o.id.slice(-6)}</h4>
                <p>${o.items.length} item(s) - Total: R${o.totalPrice.toFixed(2)}</p>
                <p>Status: <span class="status-badge status-${o.status.toLowerCase().replace(/ /g, '-')}">${o.status}</span></p>
            </div>
        `).join('');
    }

       function listenForNotifications(uid) {
        // Listener for the badge count (only unread)
        const unreadQuery = query(collection(db, 'users', uid, 'notifications'), where("isRead", "==", false));
        onSnapshot(unreadQuery, (snapshot) => {
            if(!notificationsBadge) return;
            notificationsBadge.textContent = snapshot.size;
            notificationsBadge.style.display = snapshot.size > 0 ? 'flex' : 'none';
        });

        // Listener for rendering all notifications
        const fullQuery = query(collection(db, 'users', uid, 'notifications'), orderBy("timestamp", "desc"));
        onSnapshot(fullQuery, (snapshot) => renderNotifications(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    
   async function renderNotifications(notifications) {
         const container = document.getElementById('notifications-container');
         if (!container) return;

         // Add Clear All button if there are notifications
         const header = document.querySelector('#notifications-panel .off-canvas-header');
         let clearBtn = header.querySelector('#clear-all-notifications-btn');
         if (notifications.length > 0 && !clearBtn) {
             clearBtn = document.createElement('button');
             clearBtn.id = 'clear-all-notifications-btn';
             clearBtn.className = 'clear-all-btn';
             clearBtn.textContent = 'Clear All';
             header.appendChild(clearBtn);
         } else if (notifications.length === 0 && clearBtn) {
             clearBtn.remove();
         }

         if (notifications.length === 0) {
             container.innerHTML = '<p>You have no notifications.</p>';
             return;
         }
         
         container.innerHTML = notifications.map(n => `
             <div class="list-item-card notification-item ${n.isRead ? 'read' : ''}" data-notification-id="${n.id}" ${n.bookingId ? `data-booking-id="${n.bookingId}"` : ''}>
                 <div class="item-card-content">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                 </div>
                 <button class="remove-notification-btn" data-notification-id="${n.id}">&times;</button>
             </div>
          `).join('');
    }
    
    // Function to mark all notifications as read
    async function markNotificationsAsRead() {
        if (!currentUser) return;
        const unreadQuery = query(collection(db, 'users', currentUser.uid, 'notifications'), where("isRead", "==", false));
        const snapshot = await getDocs(unreadQuery);
        if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.docs.forEach(docSnap => {
                batch.update(docSnap.ref, { isRead: true });
            });
            await batch.commit();
        }
    }

    // Open notification panel and mark as read
    notificationsButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleOffCanvas(notificationsPanel, true);
        markNotificationsAsRead();
    });
    
    
    // Event delegation for My Bookings, Notifications, and removing notifications
    document.body.addEventListener('click', async (e) => {
        const bookingCard = e.target.closest('.list-item-card[data-booking-id]');
        const removeBtn = e.target.closest('.remove-notification-btn');
        const clearAllBtn = e.target.closest('#clear-all-notifications-btn');
        const orderCard = e.target.closest('.order-card[data-order-id]');

        // Handle removing a single notification
        if (removeBtn) {
            e.stopPropagation(); // Prevent the chat modal from opening
            const notificationId = removeBtn.dataset.notificationId;
            if (confirm('Are you sure you want to delete this notification?')) {
                await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', notificationId));
            }
        } 
        // Handle clearing all notifications
        else if (clearAllBtn) {
            if (confirm('Are you sure you want to clear all notifications?')) {
                const q = query(collection(db, 'users', currentUser.uid, 'notifications'));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const batch = writeBatch(db);
                    snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
                    await batch.commit();
                }
            }
        }
       else if (orderCard) {
            const orderId = orderCard.dataset.orderId;
            if (orderId) {
                openOrderDetailsModal(orderId);
            }
        }
        // Handle opening the chat modal from either a booking card or notification
        else if (bookingCard) {
            const bookingId = bookingCard.dataset.bookingId;
            if (bookingId) {
                openBookingDetailWithChat(bookingId);
                // If it was a notification, mark it as read instantly
                if (bookingCard.classList.contains('notification-item')) {
                     const notificationId = bookingCard.dataset.notificationId;
                     await updateDoc(doc(db, 'users', currentUser.uid, 'notifications', notificationId), { isRead: true });
                }
            }
        }
    });

    // --- REVISED: Chat System Implementation ---

    // Helper function to format Firestore timestamps into HH:MM format
    function formatTimestamp(fbTimestamp) {
        if (!fbTimestamp || !fbTimestamp.toDate) return '';
        const date = fbTimestamp.toDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Helper function to generate HTML for chat message status ticks
    function getStatusTicks(status) {
        switch (status) {
            case 'SENT':
                return '<span class="ticks"><i class="fas fa-check"></i></span>';
            case 'DELIVERED': // Backend logic for this can be added later
                return '<span class="ticks"><i class="fas fa-check-double"></i></span>';
            case 'READ':
                return '<span class="ticks read"><i class="fas fa-check-double"></i></span>';
            default:
                return '';
        }
    }
    
    // Function to mark previous messages from the current user as "Read"
    async function markBookingMessagesAsRead(bookingId) {
        if (!currentUser) return;
        const messagesRef = collection(db, "bookings", bookingId, "messages");
        const q = query(messagesRef, where("senderUid", "==", currentUser.uid), where("status", "!=", "READ"));
        
        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const batch = writeBatch(db);
                querySnapshot.forEach(docSnap => {
                    batch.update(docSnap.ref, { status: "READ" });
                });
                await batch.commit();
            }
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    }


    let unsubscribeChat;
    async function openBookingDetailWithChat(bookingId) {
        if (!bookingId) {
            console.error("openBookingDetailWithChat called with invalid bookingId.");
            return;
        }
        if(unsubscribeChat) unsubscribeChat(); 

        const modalBody = document.getElementById('booking-detail-body');
        const modalHeader = bookingDetailModal.querySelector('.modal-header h2');
        if (!modalBody || !modalHeader) return;
        
        modalBody.innerHTML = '<p>Loading details...</p>';
        toggleOffCanvas(myBookingsPanel, false); // Close side panels if open
        toggleOffCanvas(notificationsPanel, false);
        bookingDetailModal.style.display = 'flex'; // Use style.display for modal overlays
        modalBackdrop.style.display = 'block';

        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (!bookingDoc.exists()) { modalBody.innerHTML = '<p>Booking not found.</p>'; return; }
        const booking = bookingDoc.data();
        modalHeader.textContent = `Details for: ${booking.serviceName}`;

        const q = query(collection(db, "bookings", bookingId, "messages"), orderBy("timestamp"));

        unsubscribeChat = onSnapshot(q, (snapshot) => {
            // Auto-read logic: if the last message isn't from me, mark my previous ones as read
            const docs = snapshot.docs;
            if (docs.length > 0 && docs[docs.length - 1].data().senderUid !== currentUser.uid) {
                markBookingMessagesAsRead(bookingId);
            }

            let chatHtml = '<div class="chat-messages-container">';
            snapshot.forEach(messageDoc => {
                const message = messageDoc.data();
                const bubbleClass = message.senderUid === currentUser.uid ? 'customer' : 'stylist'; 
                chatHtml += `
                    <div class="chat-bubble ${bubbleClass}">
                        <div class="chat-sender-name">${message.senderName}</div>
                        <span class="message-text">${message.messageText}</span>
                        <div class="chat-footer">
                            <span class="chat-timestamp">${formatTimestamp(message.timestamp)}</span>
                            ${bubbleClass === 'customer' ? getStatusTicks(message.status) : ''}
                        </div>
                    </div>
                `;
            });
            chatHtml += '</div>';

            const inputHtml = (booking.status === "Confirmed") // FIX: Only allow chat if booking is confirmed
                ? `<form id="chat-form"><input type="text" placeholder="Type a message..." required><button type="submit" class="btn">Send</button></form>` 
                : '<p class="chat-disabled-notice">Chat is only available for confirmed bookings.</p>';
            
            modalBody.innerHTML = `
                <div class="booking-details-summary">
                    <p><strong>Stylist:</strong> ${booking.stylistName}</p>
                    <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></p>
                </div>
                ${chatHtml}
                ${inputHtml}
            `;

            const chatContainer = modalBody.querySelector('.chat-messages-container');
            if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;

            const chatForm = document.getElementById('chat-form');
            if (chatForm) {
                chatForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    sendMessage(bookingId, e.target.querySelector('input').value);
                    e.target.reset();
                });
            }
        });
    }

    async function sendMessage(bookingId, text) {
        if (!text.trim() || !currentUser) return;
        await addDoc(collection(db, "bookings", bookingId, "messages"), {
            bookingId: bookingId,
            senderUid: currentUser.uid,
            senderName: currentUser.displayName || "Customer",
            messageText: text,
            status: "SENT", // Initial status for read receipts
            timestamp: serverTimestamp()
        });
    }

     // --- NEW: Order Details Modal ---

    // Function to create the order details modal if it doesn't exist
    function createOrderDetailsModal() {
        if (document.getElementById('order-details-modal-overlay')) return;

        const modalHtml = `
            <div class="modal-overlay" id="order-details-modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 id="order-modal-title">Order Details</h2>
                        <button class="close-panel-btn">&times;</button>
                    </div>
                    <div class="modal-body" id="order-details-body">
                        <!-- Content will be injected here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add close functionality
        const overlay = document.getElementById('order-details-modal-overlay');
        overlay.querySelector('.close-panel-btn').addEventListener('click', () => {
            overlay.style.display = 'none';
            modalBackdrop.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    createOrderDetailsModal(); // Create the modal on page load

    async function openOrderDetailsModal(orderId) {
        const overlay = document.getElementById('order-details-modal-overlay');
        const modalBody = document.getElementById('order-details-body');
        if (!overlay || !modalBody) return;

        modalBody.innerHTML = '<p>Loading order details...</p>';
        overlay.style.display = 'flex';
        modalBackdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';

        const orderRef = doc(db, 'product_orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            modalBody.innerHTML = '<p>Order not found.</p>';
            return;
        }

        const order = orderSnap.data();
        document.getElementById('order-modal-title').textContent = `Order #${orderId.substring(0, 8)}`;
        
        let itemsHtml = order.items.map(item => `
            <div class="order-item">
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="order-item-details">
                    <strong>${item.name}</strong>
                    <span>Size: ${item.size}</span>
                    <span>Qty: ${item.quantity}</span>
                </div>
                <span class="order-item-price">R${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        let cancelBtnHtml = '';
        if (order.status === 'Pending Pickup') {
            cancelBtnHtml = `<button id="cancel-order-btn" class="btn-danger" data-order-id="${orderId}">Cancel Order</button>`;
        }
        
        modalBody.innerHTML = `
            <div class="order-details-summary">
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></p>
                <p><strong>Total:</strong> R${order.totalPrice.toFixed(2)}</p>
            </div>
            <h3>Items</h3>
            <div class="order-item-list">${itemsHtml}</div>
            <div class="modal-footer">${cancelBtnHtml}</div>
        `;

        const cancelBtn = document.getElementById('cancel-order-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
                    try {
                        await updateDoc(orderRef, { status: "Cancelled" });
                        alert("Order has been cancelled.");
                        overlay.style.display = 'none';
                        modalBackdrop.style.display = 'none';
                        document.body.style.overflow = '';
                    } catch (error) {
                        console.error("Error cancelling order:", error);
                        alert("Failed to cancel the order. Please try again.");
                    }
                }
            });
        }
    }

    async function openEditProfileModal() {
        if (!currentUser) return;
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
            alert("User data not found.");
            return;
        }
        const userData = userDoc.data();

        const modalBody = document.getElementById('edit-profile-body');
        modalBody.innerHTML = `
            <div class="profile-picture-uploader">
                <img src="${userData.imageUrl || 'https://placehold.co/120x120/F4DCD6/7C4F55?text=User'}" alt="Profile Picture" id="profile-picture-preview">
                <label for="profile-picture-input"><span>Change</span></label>
                <input type="file" id="profile-picture-input" accept="image/*" style="display: none;">
                ${userData.imageUrl ? '<button id="remove-picture-btn">Remove</button>' : ''}
            </div>
            <form id="edit-profile-form">
                <div class="form-group">
                    <label for="profile-name">Full Name</label>
                    <input type="text" id="profile-name" value="${userData.name}" required>
                </div>
                <div class="form-group">
                    <label for="profile-email">Email</label>
                    <input type="email" id="profile-email" value="${userData.email}" disabled>
                    <small>Email cannot be changed.</small>
                </div>
                <div class="form-group">
                    <label for="profile-phone">Phone Number</label>
                    <input type="tel" id="profile-phone" value="${userData.phone}" required pattern="[0-9]{10}">
                    <small>Format: 10 digits e.g., 0821234567</small>
                </div>
                <p id="profile-error-msg"></p>
                <button type="submit" class="book-btn" style="width: 100%;">Save Changes</button>
            </form>
        `;

        if (editProfileModal) editProfileModal.style.display = 'flex';
        modalBackdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Add event listeners for the new form
        document.getElementById('edit-profile-form').addEventListener('submit', handleProfileUpdate);
        document.getElementById('profile-picture-input').addEventListener('change', handleProfilePictureChange);
        document.getElementById('remove-picture-btn')?.addEventListener('click', handleProfilePictureRemove);
        document.getElementById('close-edit-profile-modal').addEventListener('click', () => {
            editProfileModal.style.display = 'none';
            modalBackdrop.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    function handleProfilePictureChange(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('profile-picture-preview').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    async function handleProfilePictureRemove() {
        if (!currentUser) return;
        if (!confirm("Are you sure you want to remove your profile picture?")) return;

        const userRef = doc(db, 'users', currentUser.uid);
        const picRef = ref(storage, `profile_pictures/${currentUser.uid}`);
        
        try {
            await deleteObject(picRef);
            await updateDoc(userRef, { imageUrl: "" });
            await updateProfile(currentUser, { photoURL: "" });
            document.getElementById('profile-picture-preview').src = 'https://placehold.co/120x120/F4DCD6/7C4F55?text=User';
            document.getElementById('remove-picture-btn').remove(); // Remove the button itself
            alert("Profile picture removed.");
        } catch (error) {
            console.error("Error removing profile picture:", error);
            if (error.code === 'storage/object-not-found') {
                // If it doesn't exist in storage, just update the database
                await updateDoc(userRef, { imageUrl: "" });
                alert("Profile picture removed.");
            } else {
                alert("Could not remove profile picture.");
            }
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        if (!currentUser) return;

        const name = document.getElementById('profile-name').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        const errorMsg = document.getElementById('profile-error-msg');
        const file = document.getElementById('profile-picture-input').files[0];

        if (!name || !phone) {
            errorMsg.textContent = "Please fill out all fields.";
            return;
        }
        if (!/^[0-9]{10}$/.test(phone)) {
            errorMsg.textContent = "Please enter a valid 10-digit phone number.";
            return;
        }
        errorMsg.textContent = "Saving...";

        try {
            let imageUrl;
            // If a new file is selected, upload it
            if (file) {
                const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
                const snapshot = await uploadBytes(storageRef, file);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            // Update Firestore user document
            const userRef = doc(db, "users", currentUser.uid);
            const dataToUpdate = { name, phone };
            if (imageUrl) {
                dataToUpdate.imageUrl = imageUrl;
            }
            await updateDoc(userRef, dataToUpdate);

            // Update Auth profile
            const authUpdateData = { displayName: name };
            if (imageUrl) {
                authUpdateData.photoURL = imageUrl;
            }
            await updateProfile(currentUser, authUpdateData);
            
            errorMsg.textContent = "";
            alert("Profile updated successfully!");
            if(editProfileModal) editProfileModal.style.display = 'none';
            if(modalBackdrop) modalBackdrop.style.display = 'none';
            document.body.style.overflow = '';

        } catch (error) {
            console.error("Error updating profile:", error);
            errorMsg.textContent = "Failed to update profile. Please try again.";
        }
    }

     function openContactModal() {
        contactModal.innerHTML = `
            <div class="modal">
                <div class="off-canvas-header">
                    <h2>Contact Us</h2>
                    <button class="close-panel-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>For support, please email us at <a href="mailto:support@gadissalon.com">support@gadissalon.com</a> or call us at (123) 456-7890.</p>
                </div>
            </div>
        `;
        contactModal.style.display = 'flex';
        modalBackdrop.style.display = 'block';
    }

     // --- FAQ ACCORDION ---
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const item = button.parentElement;
            const answer = button.nextElementSibling;
            if (item.classList.contains('active')) {
                item.classList.remove('active');
                answer.style.maxHeight = null;
            } else {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
 
    // --- All other functions (updateUIAfterAuthStateChange, logoutButton, profileButton, etc.) ---
    // Note: You would also add functions for openEditProfileModal, openContactModal, and their form handlers here.
});

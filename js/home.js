// --- 1. FIREBASE SETUP & MODULE IMPORTS ---
import { auth, db, functions, storage } from './firebase-config.js';
import { collection, onSnapshot, query, limit, doc, getDoc, updateDoc, setDoc, deleteDoc, addDoc, serverTimestamp, where, orderBy, writeBatch, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-functions.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// --- 2. MAIN APPLICATION LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing home.js...");

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

    // --- NEW PARALLAX ELEMENT SELECTIONS ---
    const parallaxBg = document.getElementById('parallax-bg');
    const parallaxTextBack = document.getElementById('parallax-text-back');
    const parallaxFg = document.getElementById('parallax-fg');
    const parallaxTextFront = document.getElementById('parallax-text-front');
    const heroContent = document.getElementById('hero-content');


    let currentUser = null;
    let userFavorites = [];

    // --- 2.1. AUTHENTICATION & CORE UI ---
    onAuthStateChanged(auth, user => {
        console.log("Auth state changed. User:", user ? user.uid : "Logged Out");
        currentUser = user;
        updateUIAfterAuthStateChange();
        if (user) {
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
    notificationsButton.addEventListener('click', (e) => { 
        e.preventDefault(); 
        toggleOffCanvas(notificationsPanel, true);
        // NEW: Mark notifications as read when the panel is opened.
        markNotificationsAsRead();
    });
    document.querySelector('a[href="#contact"]').addEventListener('click', (e) => { e.preventDefault(); openContactModal(); });


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
    
    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
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

        // Navbar logic
        if (scrollPos > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // New Parallax effect logic
        if (parallaxBg) parallaxBg.style.transform = `translateY(${scrollPos * 0.2}px)`;
        if (parallaxFg) parallaxFg.style.transform = `translateY(${scrollPos * 0.4}px)`;
        if (parallaxTextBack) parallaxTextBack.style.transform = `translateY(${scrollPos * 0.3}px)`;
        if (parallaxTextFront) parallaxTextFront.style.transform = `translateY(${scrollPos * 0.3}px)`;
        if (heroContent) heroContent.style.transform = `translateY(calc(120px + ${scrollPos * 0.5}px))`;
    });

    mobileMenuToggle.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
    });

    // Clone desktop links to mobile nav
    const navLinks = document.querySelector('.navbar-links');
    mobileNav.innerHTML = navLinks.innerHTML;

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

    // --- 2.3. DATA FETCHING (Hairstyles & Products) ---
    function fetchAndDisplayItems(collectionName, gridElement, limitCount = 4) {
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
        detailModalOverlay.style.display = show ? 'flex' : 'none';
        modalBackdrop.style.display = show ? 'block' : 'none';
        document.body.style.overflow = show ? 'hidden' : '';
    }

    cartButton.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(cartModal, true); });
    closeCartBtn.addEventListener('click', () => toggleOffCanvas(cartModal, false));
    favButton.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(favoritesModal, true); });
    closeFavoritesBtn.addEventListener('click', () => toggleOffCanvas(favoritesModal, false));
    closeBookingBtn.addEventListener('click', () => toggleOffCanvas(bookingModal, false));

    modalBackdrop.addEventListener('click', () => {
        toggleOffCanvas(cartModal, false);
        toggleOffCanvas(favoritesModal, false);
        toggleOffCanvas(bookingModal, false);
        toggleOffCanvas(notificationsPanel, false);
        toggleDetailModal(false);
        if (editProfileModal) editProfileModal.style.display = 'none';
        if (contactModal) contactModal.style.display = 'none';
        if (bookingDetailModal) bookingDetailModal.style.display = 'none';
    });

    // --- 2.5. EVENT DELEGATION & MODAL RENDERING ---
    document.body.addEventListener('click', async (e) => {
        if (e.target.matches('.close-panel-btn, .close-panel-btn *')) {
            const panelToClose = e.target.closest('.off-canvas, .modal-overlay');
            if (panelToClose) {
                modalBackdrop.click(); // Trigger the generic close logic
            }
        }
        
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
            if (!currentUser) { alert("Please log in to add items to your cart."); return; }
            const variantSelector = document.getElementById('variant-selector');
            if (variantSelector) {
                addToCart(e.target.dataset.productId, variantSelector.value);
            }
        }
        
        if (e.target.matches('.book-now-btn')) {
            if (!currentUser) { alert("Please log in to book an appointment."); return; }
            const hairstyleId = e.target.dataset.hairstyleId;
            const hairstyleDoc = await getDoc(doc(db, "hairstyles", hairstyleId));
            if (hairstyleDoc.exists()) {
                openBookingModal({ id: hairstyleDoc.id, ...hairstyleDoc.data() });
            }
        }
        
        if (e.target.matches('.favorite-btn-modal') || e.target.closest('.favorite-btn-modal')) {
            if (!currentUser) { alert("Please log in to manage your favorites."); return; }
            const button = e.target.closest('.favorite-btn-modal');
            toggleFavorite(button.dataset.id, button.dataset.type);
        }

        if (e.target.matches('.modal-close-btn')) {
            toggleDetailModal(false);
        }
    });

    function renderDetailModal(item, type) {
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
    
    cartItemsContainer.addEventListener('click', (e) => {
        const cartItemEl = e.target.closest('.cart-item');
        if (!cartItemEl) return;
        const [productId, size] = cartItemEl.dataset.id.split('_');
        if (e.target.matches('.quantity-btn')) updateCartQuantity(productId, size, e.target.dataset.action);
        if (e.target.matches('.remove-item-btn')) removeFromCart(productId, size);
    });

    async function updateCartQuantity(productId, size, action) {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) { console.error("User doc not found"); return; }
            
            const cart = userSnap.data().cart || [];
            const itemIndex = cart.findIndex(item => item.productId === productId && item.size === size);

            if (itemIndex > -1) {
                if (action === 'increase') {
                    cart[itemIndex].quantity++;
                } else if (action === 'decrease') {
                    cart[itemIndex].quantity--;
                }

                if (cart[itemIndex].quantity <= 0) {
                    cart.splice(itemIndex, 1);
                }
                await updateDoc(userRef, { cart: cart });
            }
        } catch (error) {
            console.error("Error updating cart quantity:", error);
        }
    }

    async function removeFromCart(productId, size) {
        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) { console.error("User doc not found"); return; }
            
            const cart = userSnap.data().cart || [];
            const updatedCart = cart.filter(item => !(item.productId === productId && item.size === size));
            
            await updateDoc(userRef, { cart: updatedCart });
        } catch (error) {
            console.error("Error removing from cart:", error);
        }
    }

    function listenForFavoritesUpdates(uid) {
        // This listener gets all documents from the user's 'favorites' subcollection
        onSnapshot(collection(db, 'users', uid, 'favorites'), (snapshot) => {
            userFavorites = snapshot.docs.map(doc => doc.id); // Update our cache of favorite IDs
            // Create a full array of favorite item objects
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
    
    // This function is now used by both the modal and the favorites panel
    async function toggleFavorite(itemId, itemType) {
        if (!currentUser) return;
        const favRef = doc(db, 'users', currentUser.uid, 'favorites', itemId);
        const modalFavBtn = document.querySelector(`.favorite-btn-modal[data-id="${itemId}"]`);

        if (userFavorites.includes(itemId)) {
            // Remove from favorites
            await deleteDoc(favRef);
            if (modalFavBtn) modalFavBtn.classList.remove('favorited');
        } else {
            // Add to favorites
            const itemSnap = await getDoc(doc(db, itemType, itemId));
            if (itemSnap.exists()) {
                // We store the full object so we can render it in the favorites list
                await setDoc(favRef, itemSnap.data());
                if (modalFavBtn) modalFavBtn.classList.add('favorited');
            }
        }
    }

    // --- EVENT DELEGATION FOR FAVORITES PANEL ---
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
    
    function renderMyBookings(bookings) {
        const container = document.getElementById('my-bookings-container');
        if (bookings.length === 0) { container.innerHTML = '<p>You have no bookings yet.</p>'; return; }
        container.innerHTML = bookings.map(b => `
            <div class="list-item-card" data-booking-id="${b.id}">
                <h4>${b.serviceName}</h4>
                <p>With ${b.stylistName} on ${b.date} at ${b.time}</p>
                <p>Status: ${b.status}</p>
            </div>
        `).join('');
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
            <div class="list-item-card">
                <h4>Order #${o.id.slice(-6)}</h4>
                <p>${o.items.length} item(s) - Total: R${o.totalPrice.toFixed(2)}</p>
                <p>Status: ${o.status}</p>
            </div>
        `).join('');
    }

    function listenForNotifications(uid) {
        const q = query(collection(db, 'users', uid, 'notifications'), where("isRead", "==", false));
        onSnapshot(q, (snapshot) => {
            notificationsBadge.textContent = snapshot.size;
            notificationsBadge.style.display = snapshot.size > 0 ? 'flex' : 'none';
        });
        const fullQuery = query(collection(db, 'users', uid, 'notifications'), orderBy("timestamp", "desc"));
        onSnapshot(fullQuery, (snapshot) => renderNotifications(snapshot.docs.map(d => d.data())));
    }
    
    function renderNotifications(notifications) {
         const container = document.getElementById('notifications-container');
         if (!container) return;
         if (notifications.length === 0) { container.innerHTML = '<p>You have no notifications.</p>'; return; }
         container.innerHTML = notifications.map(n => `
            <div class="list-item-card">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
            </div>
         `).join('');
    }
    
    // Event delegation for opening booking detail chat
    myBookingsPanel.addEventListener('click', (e) => {
        const card = e.target.closest('.list-item-card');
        if (card && card.dataset.bookingId) {
            openBookingDetailWithChat(card.dataset.bookingId);
        }
    });


    let unsubscribeChat;
    async function openBookingDetailWithChat(bookingId) {
        if(unsubscribeChat) unsubscribeChat(); // Stop listening to previous chat

        toggleOffCanvas(bookingDetailModal, true);
        const modalBody = document.getElementById('booking-detail-body');
        modalBody.innerHTML = '<p>Loading chat...</p>';

        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (!bookingDoc.exists()) { modalBody.innerHTML = '<p>Booking not found.</p>'; return; }
        const booking = bookingDoc.data();

        const q = query(collection(db, "bookings", bookingId, "messages"), orderBy("timestamp"));

        unsubscribeChat = onSnapshot(q, (snapshot) => {
            let chatHtml = '<div class="chat-messages-container">'; // Wrapper for messages
            snapshot.forEach(messageDoc => {
                const message = messageDoc.data();
                const bubbleClass = message.senderUid === currentUser.uid ? 'stylist' : 'customer'; // Re-using styles
                chatHtml += `<div class="chat-bubble ${bubbleClass}">${message.messageText}</div>`;
            });
            chatHtml += '</div>';

            const inputHtml = booking.status === "Confirmed" ? `<form id="chat-form"><input type="text" placeholder="Type a message..." required><button type="submit" class="btn">Send</button></form>` : '<p>Chat is disabled for this booking status.</p>';
            
            modalBody.innerHTML = chatHtml + inputHtml;

            // Add listener for the new form
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
            timestamp: serverTimestamp()
        });
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

    async function openEditProfileModal() {
        if (!currentUser) return;
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
                alert('User profile not found.');
                return;
            }
            const userData = userDocSnap.data();

            editProfileModal.innerHTML = `
                <div class="modal">
                    <div class="off-canvas-header">
                        <h2>Edit Profile</h2>
                        <button class="close-panel-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-profile-form" class="profile-form" data-image-removed="false">
                            <div class="profile-picture-uploader">
                                <label for="profile-picture-input">
                                    <img src="${userData.imageUrl || 'https://placehold.co/120x120/F4DCD6/7C4F55?text=User'}" alt="Profile Picture" id="profile-picture-preview">
                                    <div class="picture-overlay"><span>Change</span></div>
                                </label>
                                <input type="file" id="profile-picture-input" accept="image/*" style="display: none;">
                                <button type="button" id="remove-picture-btn">Remove</button>
                            </div>
                            <div class="form-group">
                                <label for="profile-name">Full Name</label>
                                <input type="text" id="profile-name" value="${userData.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="profile-phone">Phone Number</label>
                                <input type="tel" id="profile-phone" value="${userData.phone || ''}" required pattern="[0-9]{10}" title="Please enter a 10-digit phone number.">
                            </div>
                            <div class="form-group">
                                <label for="profile-email">Email Address</label>
                                <input type="email" id="profile-email" value="${userData.email || ''}" disabled>
                                <small>Email cannot be changed.</small>
                            </div>
                            <button type="submit" class="book-btn" style="width: 100%;">Save Changes</button>
                            <p id="profile-error-msg"></p>
                        </form>
                    </div>
                </div>
            `;
            editProfileModal.style.display = 'flex';
            modalBackdrop.style.display = 'block';

            // Listener for the remove picture button
            document.getElementById('remove-picture-btn').addEventListener('click', () => {
                document.getElementById('profile-picture-preview').src = 'https://placehold.co/120x120/F4DCD6/7C4F55?text=User';
                document.getElementById('profile-picture-input').value = ''; // Clear the file input
                document.getElementById('edit-profile-form').dataset.imageRemoved = 'true';
            });

            document.getElementById('profile-picture-input').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        document.getElementById('profile-picture-preview').src = event.target.result;
                        document.getElementById('edit-profile-form').dataset.imageRemoved = 'false'; // A new image overrides removal
                    };
                    reader.readAsDataURL(file);
                }
            });

            document.getElementById('edit-profile-form').addEventListener('submit', handleProfileUpdate);
        } catch (error) {
            console.error("Error opening profile modal:", error);
            alert('Could not load profile data.');
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        if (!currentUser) return;

        const nameInput = document.getElementById('profile-name');
        const phoneInput = document.getElementById('profile-phone');
        const fileInput = document.getElementById('profile-picture-input');
        const errorMsg = document.getElementById('profile-error-msg');
        const saveButton = e.target.querySelector('button[type="submit"]');
        const imageRemoved = e.target.dataset.imageRemoved === 'true';

        const newName = nameInput.value.trim();
        const newPhone = phoneInput.value.trim();
        const file = fileInput.files[0];
        
        // Validation
        if (!newName) {
            errorMsg.textContent = 'Name cannot be empty.';
            return;
        }
        if (!/^\d{10}$/.test(newPhone)) {
            errorMsg.textContent = 'Please enter a valid 10-digit phone number.';
            return;
        }
        errorMsg.textContent = '';
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';

        try {
            let downloadURL = null;
            if (file) {
                const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
                const uploadResult = await uploadBytes(storageRef, file);
                downloadURL = await getDownloadURL(uploadResult.ref);
            }

            const userDocRef = doc(db, 'users', currentUser.uid);
            const dataToUpdate = {
                name: newName,
                phone: newPhone,
            };

            if (imageRemoved) {
                dataToUpdate.imageUrl = '';
            } else if (downloadURL) {
                dataToUpdate.imageUrl = downloadURL;
            }

            await updateDoc(userDocRef, dataToUpdate);
            alert('Profile updated successfully!');
            modalBackdrop.click();
        } catch (error) {
            console.error("Error updating profile:", error);
            errorMsg.textContent = 'Failed to update profile. Please try again.';
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Changes';
        }
    }

    async function markNotificationsAsRead() {
        if (!currentUser) return;
        const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
        const q = query(notificationsRef, where("isRead", "==", false));
        
        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return; // No unread notifications to update
            }

            // Use a batch to update all docs at once for efficiency
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => {
                batch.update(doc.ref, { isRead: true });
            });
            await batch.commit();
            console.log(`${querySnapshot.size} notifications marked as read.`);
        } catch (error) {
            console.error("Error marking notifications as read: ", error);
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

 
    // --- All other functions (updateUIAfterAuthStateChange, logoutButton, profileButton, etc.) ---
    // Note: You would also add functions for openEditProfileModal, openContactModal, and their form handlers here.
});

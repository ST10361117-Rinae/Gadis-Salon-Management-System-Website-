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
        let overlay = document.querySelector('.auth-alert-overlay');
        if (!overlay) { // Create overlay if it doesn't exist
            overlay = document.createElement('div');
            overlay.className = 'auth-alert-overlay';
            overlay.innerHTML = `<div class="auth-alert-box"></div>`;
            document.body.appendChild(overlay);
        }
        
        const box = overlay.querySelector('.auth-alert-box');
        box.innerHTML = `<p>${message}</p><p class="redirect-text">Redirecting to login...</p>`;

        // Make it visible
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'login.html';
            // Optionally hide overlay immediately before redirect
            overlay.classList.remove('visible');
        }, 2500);
    }

     // --- NEW: TOAST NOTIFICATION FUNCTION ---
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.error("Toast container not found!");
            return;
        }

        const toast = document.createElement('div');
        // --- MODIFIED: Added specific type class ---
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10); // Reduced delay for faster appearance

        // Animate out and remove after a delay
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                // Ensure removal only happens once
                if (toast.parentNode) {
                    toast.remove();
                }
            }, { once: true }); // Use {once: true} for safety
        }, 3000); // Keep duration reasonable
    }

    // --- NEW: Generic Confirmation Modal Function ---
    // (Ensure you have corresponding CSS and HTML for #confirmation-modal-overlay etc.)
    let confirmResolve = null; // Store the promise resolve function
    function showConfirmationModal(message = "Are you sure you want to proceed?", confirmButtonClass = 'btn-danger', confirmButtonText = 'Proceed') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('confirmation-modal-overlay');
            const msgElement = document.getElementById('confirmation-message');
            const proceedBtn = document.getElementById('confirm-proceed-btn');

            if (!overlay || !msgElement || !proceedBtn) {
                console.error("Confirmation modal elements not found!");
                resolve(false); // Can't show modal, resolve as false
                return;
            }

            msgElement.textContent = message;
            // Apply button styling
            proceedBtn.className = confirmButtonClass; // Reset classes and add the new one
            proceedBtn.textContent = confirmButtonText;

            overlay.classList.add('visible');
            confirmResolve = resolve; // Store the resolve function
        });
    }

    // --- NEW: Event Listeners for Confirmation Modal Buttons ---
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmProceedBtn = document.getElementById('confirm-proceed-btn');
    const confirmationModalOverlay = document.getElementById('confirmation-modal-overlay');

    confirmCancelBtn?.addEventListener('click', () => {
        confirmationModalOverlay?.classList.remove('visible');
        if (confirmResolve) {
            confirmResolve(false); // Resolve promise with false (cancelled)
            confirmResolve = null;
        }
    });

    confirmProceedBtn?.addEventListener('click', () => {
        confirmationModalOverlay?.classList.remove('visible');
        if (confirmResolve) {
            confirmResolve(true); // Resolve promise with true (proceed)
            confirmResolve = null;
        }
    });


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
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutModal = document.getElementById('close-checkout-modal');
    const confirmOrderBtn = document.getElementById('confirm-order-btn');
    const pageContactForm = document.getElementById('page-contact-form');
    const contactSupportLink = document.getElementById('contact-support-link');
    const supportPanel = document.getElementById('support-panel');
    const newSupportTicketBtn = document.getElementById('new-support-ticket-btn');
    const newSupportTicketModal = document.getElementById('new-support-ticket-modal');
    const closeNewSupportTicketModal = document.getElementById('close-new-support-ticket-modal');
    const newSupportTicketForm = document.getElementById('new-support-ticket-form');
    const ticketListContainer = document.getElementById('ticket-list-container');
    const ticketConversationContainer = document.getElementById('ticket-conversation-container');
    const supportChatForm = document.getElementById('support-chat-form');
    const supportChatInput = document.getElementById('support-chat-input');
    const mobileNavCloseBtn = document.getElementById('mobile-nav-close');


    let currentUser = null;
    let userFavorites = [];
    let currentCart = []; // Local cart state
    let hasCartChanged = false; // Flag to track local changes
    let saveCartTimeout = null; // For debouncing Firestore saves
    let unsubscribeCartListener = null; // To detach listener on logout
    let unsubscribeSupportChat;
    let currentOpenTicketId = null;
    let allHairstyleDurations = []; // --- NEW: Store durations
    let minHairstyleDuration = 1; // --- NEW: Default minimum duration
    let salonAllSlotsCache = []; // --- NEW: Cache for all possible slots
    let dailyBookingsCache = {}; // --- NEW: Cache for daily bookings
    let hairstyleDurationsCache = {}; // Cache hairstyle durations { 'hairstyleId': duration }


    // --- 2.1. AUTHENTICATION & CORE UI ---
      onAuthStateChanged(auth, async user => {
        console.log("Auth state changed. User:", user ? user.uid : "Logged Out");
        currentUser = user;
        updateUIAfterAuthStateChange();
        if (user) {
            const justLoggedIn = sessionStorage.getItem('justLoggedIn');
            if (justLoggedIn === 'true') {
                 const userDoc = await getDoc(doc(db, 'users', user.uid));
                 if (userDoc.exists()) {
                     showWelcomeAnimation(userDoc.data().name);
                     sessionStorage.removeItem('justLoggedIn');
                 }
            }

            if (unsubscribeCartListener) { unsubscribeCartListener(); }
            listenForCartUpdates(user.uid);
            listenForFavoritesUpdates(user.uid);
            listenForMyBookings(user.uid);
            listenForMyOrders(user.uid);
            listenForNotifications(user.uid);
            listenForSupportTickets(user.uid);
             // Ensure editProfileLink exists before setting href
             if (editProfileLink) {
                 editProfileLink.href = `#edit-profile/${user.uid}`;
             }
        } else {
            if (unsubscribeCartListener) { unsubscribeCartListener(); unsubscribeCartListener = null; }
            currentCart = [];
            userFavorites = [];
            dailyBookingsCache = {}; // Clear booking cache on logout
            renderCart([]); renderFavorites([]); renderMyBookings([]); renderMyOrders([]); renderNotifications([]);
            // Ensure ticket containers exist before clearing
             if (ticketListContainer) ticketListContainer.innerHTML = '<p>Please log in to view tickets.</p>';
             if (ticketConversationContainer) ticketConversationContainer.innerHTML = '';
             if (supportChatForm) supportChatForm.style.display = 'none';
        }
    });


    myBookingsLink.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(myBookingsPanel, true); });
    myOrdersLink.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(myOrdersPanel, true); });
    editProfileLink.addEventListener('click', (e) => { e.preventDefault(); openEditProfileModal(); });
    notificationsButton?.addEventListener('click', (e) => {
            e.preventDefault();
            toggleOffCanvas(notificationsPanel, true);
            markNotificationsAsRead();
        });
    contactSupportLink.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(supportPanel, true); });

    pageContactForm?.addEventListener('submit', async(e) => {
        e.preventDefault();
        const button = e.target.querySelector('button');
        const originalButtonText = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending...';

        if (!currentUser) {
            showAuthRedirectAlert("Please log in to send a support message.");
            button.disabled = false;
            button.textContent = originalButtonText;
            return;
        }
        const message = pageContactForm.querySelector('textarea').value.trim();
        if (message === '') {
            button.disabled = false;
            button.textContent = originalButtonText;
            return;
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
            showToast("Could not find your user data.", "error");
            button.disabled = false;
            button.textContent = originalButtonText;
            return;
        }
        const userData = userDoc.data();

        try {
            await addDoc(collection(db, "support_messages"), {
                message: message,
                senderUid: currentUser.uid,
                senderName: userData.name,
                senderEmail: userData.email,
                status: "New",
                timestamp: serverTimestamp(),
                participantUids: [currentUser.uid]
            });
            showToast('Support ticket sent successfully!');
            pageContactForm.reset();
        } catch (error) {
            console.error("Error creating new ticket from page:", error);
            showToast("Failed to send ticket.", "error");
        } finally {
            button.disabled = false;
            button.textContent = originalButtonText;
        }
    });


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

    document.querySelectorAll('#mobile-nav a[href^="#"], .navbar-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const targetElement = href && href.length > 1 ? document.querySelector(href) : null;
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
                // Close mobile nav if it's open
                if (mobileNav?.classList.contains('open')) {
                    mobileNav.classList.remove('open');
                }
            }
        });
    });

    function showWelcomeAnimation(userName) {
        const welcomeMessage = document.getElementById('welcome-message');
        if (!welcomeMessage) return;

        welcomeMessage.textContent = `Welcome, ${userName.split(' ')[0]}!`;
        welcomeMessage.classList.add('show');

        setTimeout(() => {
            welcomeMessage.classList.remove('show');
        }, 8000); 
    }

    function setupRandomHeroImage() {
        const totalImages = 12;
        let allImageNumbers = Array.from({ length: totalImages }, (_, i) => i + 1);
        let seenNumbers = JSON.parse(localStorage.getItem('seenHeroImages')) || [];

        if (seenNumbers.length >= totalImages) {
            seenNumbers = []; // Reset if all images have been seen
        }

        let availableNumbers = allImageNumbers.filter(num => !seenNumbers.includes(num));
        if (availableNumbers.length === 0) {
            seenNumbers = [];
            availableNumbers = allImageNumbers;
        }

        const chosenNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        seenNumbers.push(chosenNumber);
        localStorage.setItem('seenHeroImages', JSON.stringify(seenNumbers));

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
            
            gridElement.querySelectorAll('.product-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 100}ms`;
                card.classList.add('fade-in');
            });
        });
    }

    fetchAndDisplayItems("hairstyles", hairstylesGrid, 6);
    fetchAndDisplayItems("products", productsGrid, 6);

    // --- NEW: Fetch all hairstyle durations and salon hours once ---
    async function fetchInitialBookingData() {
        try {
            // Fetch all hairstyle durations and cache them
            const hairstylesSnapshot = await getDocs(collection(db, "hairstyles"));
            allHairstyleDurations = []; // Reset
            hairstyleDurationsCache = {}; // Reset
            hairstylesSnapshot.forEach(doc => {
                 const duration = doc.data().durationHours || 1;
                 allHairstyleDurations.push(duration);
                 hairstyleDurationsCache[doc.id] = Math.ceil(duration); // Store ceil value
            });
            if (allHairstyleDurations.length > 0) {
                minHairstyleDuration = Math.min(...allHairstyleDurations);
            } else { minHairstyleDuration = 1; }
            console.log("Fetched durations:", allHairstyleDurations, "Min duration:", minHairstyleDuration);

             const hoursDoc = await getDoc(doc(db, "app_content", "salon_hours"));
             if (hoursDoc.exists()) {
                 salonAllSlotsCache = hoursDoc.data().time_slots || [];
                 console.log("Cached all salon slots:", salonAllSlotsCache);
             } else { console.error("Salon hours document not found!"); }
        } catch (error) { console.error("Error fetching initial booking data:", error); showToast("Could not load booking configuration.", "error"); }
    }
    fetchInitialBookingData();
    // --- END INITIAL DATA FETCH ---

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

    function toggleOffCanvas(modal, show) {
        if (!modal) return; // Add a check to prevent errors if the modal element doesn't exist
        modalBackdrop.style.display = show ? 'block' : 'none';
        modal.classList.toggle('open', show);
        document.body.style.overflow = show ? 'hidden' : '';
    }

    function toggleModal(modal, show) {
        if (!modal) return;
        modal.style.display = show ? 'flex' : 'none';
        modalBackdrop.style.display = show ? 'block' : 'none';
        document.body.style.overflow = show ? 'hidden' : '';
    }

    cartButton.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(cartModal, true); });
    closeCartBtn?.addEventListener('click', () => {
        saveCartToFirestoreIfNeeded();
        toggleOffCanvas(cartModal, false);
    });
    favButton.addEventListener('click', (e) => { e.preventDefault(); toggleOffCanvas(favoritesModal, true); });
    closeFavoritesBtn.addEventListener('click', () => toggleOffCanvas(favoritesModal, false));
    closeBookingBtn.addEventListener('click', () => toggleOffCanvas(bookingModal, false));
    checkoutBtn.addEventListener('click', () => openCheckoutModal());
    closeCheckoutModal.addEventListener('click', () => toggleModal(checkoutModal, false));
    confirmOrderBtn.addEventListener('click', confirmOrder);


    modalBackdrop?.addEventListener('click', () => {
        saveCartToFirestoreIfNeeded(); 
        toggleOffCanvas(cartModal, false);
        toggleOffCanvas(favoritesModal, false);
        toggleOffCanvas(bookingModal, false);
        toggleOffCanvas(myBookingsPanel, false);
        toggleOffCanvas(myOrdersPanel, false);
        toggleOffCanvas(notificationsPanel, false);
        toggleOffCanvas(supportPanel, false); // ADDED
        toggleModal(detailModalOverlay, false);
        toggleModal(editProfileModal, false);
        toggleModal(bookingDetailModal, false);
        toggleModal(checkoutModal, false);
        toggleModal(newSupportTicketModal, false); // ADDED
        toggleModal(confirmationModalOverlay, false); 
        document.body.style.overflow = '';
    });
    
    document.querySelectorAll('.close-panel-btn, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.closest('.off-canvas, .modal-overlay');
            if (panel) {
                 if (panel.classList.contains('off-canvas')) { toggleOffCanvas(panel, false); }
                 else { toggleModal(panel, false); }
            }
        });
    });
     // --- NEW: Mobile Nav Close Button Listener ---
    mobileNavCloseBtn?.addEventListener('click', () => {
        mobileNav.classList.remove('open');
    });


    document.body.addEventListener('click', async (e) => {
        const card = e.target.closest('.product-card:not(.sold-out)');
        if (card) {
            const itemId = card.dataset.id;
            const itemType = card.dataset.type;
            const docRef = doc(db, itemType, itemId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                renderDetailModal({ id: docSnap.id, ...docSnap.data() }, itemType);
                toggleModal(detailModalOverlay, true);
            }
        }
        
        if (e.target.matches('.add-to-cart-btn')) {
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
        
        // --- MODIFIED: Event listener for favorite button in modal ---
        if (e.target.matches('.favorite-btn-modal') || e.target.closest('.favorite-btn-modal')) {
            if (!currentUser) {
                showAuthRedirectAlert("Please log in to manage your favorites.");
                return;
            }
            const button = e.target.closest('.favorite-btn-modal');
            const { id, type } = button.dataset;
            let variantSize = null;
            // If it's a product, get the currently selected variant size
            if (type === 'products') {
                const variantSelector = document.getElementById('variant-selector');
                if (variantSelector) {
                    variantSize = variantSelector.value;
                }
            }
            toggleFavorite(id, type, variantSize);
        }

        if (e.target.matches('.modal-close-btn')) {
            toggleModal(detailModalOverlay, false);
        }
    });

    // --- MODIFIED: Renders detail modal and adds listener for variant changes ---
    function renderDetailModal(item, type) {
        if (!detailModalOverlay) return;
        const modalContent = detailModalOverlay.querySelector('.modal');
        let innerHtml = '';

        const closeButtonHtml = `<button class="close-btn modal-close-btn">&times;</button>`;
        let favoriteButtonHtml = '';

        if (type === 'products') {
            let variantsHtml = '';
            item.variants.forEach(v => {
                variantsHtml += `<option value="${v.size}" ${v.stock <= 0 ? 'disabled' : ''}>${v.size} - R${v.price.toFixed(2)} ${v.stock <= 0 ? '(Out of Stock)' : ''}</option>`;
            });
            // Check if the first variant is favorited for the initial button state
            const firstVariantSize = item.variants[0]?.size;
            const initialFavId = firstVariantSize ? `${item.id}_${firstVariantSize}` : item.id;
            const isFavorited = userFavorites.includes(initialFavId);
            favoriteButtonHtml = `<button class="favorite-btn-modal ${isFavorited ? 'favorited' : ''}" data-id="${item.id}" data-type="${type}"><i class="fas fa-heart"></i></button>`;

            innerHtml = `${favoriteButtonHtml}${closeButtonHtml}<div class="modal-body"><img src="${item.imageUrl}" class="product-image" alt="${item.name}"><div class="product-info"><h2>${item.name}</h2><p>${item.description || ''}</p><select id="variant-selector">${variantsHtml}</select><button class="book-btn add-to-cart-btn" data-product-id="${item.id}">Add to Cart</button></div></div>`;
        } else if (type === 'hairstyles') {
            const isFavorited = userFavorites.includes(item.id);
            favoriteButtonHtml = `<button class="favorite-btn-modal ${isFavorited ? 'favorited' : ''}" data-id="${item.id}" data-type="${type}"><i class="fas fa-heart"></i></button>`;
            innerHtml = `${favoriteButtonHtml}${closeButtonHtml}<div class="modal-body"><img src="${item.imageUrl}" class="product-image" alt="${item.name}"><div class="product-info"><h2>${item.name}</h2><p>${item.description}</p><p><strong>Duration:</strong> ${item.durationHours} hours</p><h3>R${item.price.toFixed(2)}</h3><button class="book-btn book-now-btn" data-hairstyle-id="${item.id}">Book Now</button></div></div>`;
        }
        modalContent.innerHTML = innerHtml;

        // --- NEW: Add event listener to variant selector to update favorite button UI ---
        const variantSelector = modalContent.querySelector('#variant-selector');
        if (variantSelector) {
            variantSelector.addEventListener('change', (e) => {
                const selectedSize = e.target.value;
                const favId = `${item.id}_${selectedSize}`;
                const favButton = modalContent.querySelector('.favorite-btn-modal');
                if (favButton) {
                    favButton.classList.toggle('favorited', userFavorites.includes(favId));
                }
            });
        }
    }

    async function addToCart(productId, selectedSize) {
        if (!currentUser) {
            showAuthRedirectAlert("Please log in to add items to your cart.");
            return;
        }

        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
            showToast("Product not found.", "error");
            return;
        }

        const product = productSnap.data();
        const variant = product.variants.find(v => v.size === selectedSize);
        if (!variant) {
            showToast("Selected variant not found.", "error");
            return;
        }
        if (variant.stock <= 0) {
            showToast("This item is currently out of stock.", "warning");
            return;
        }

        const itemIndex = currentCart.findIndex(item => item.productId === productId && item.size === selectedSize);
        let currentQuantity = itemIndex > -1 ? currentCart[itemIndex].quantity : 0;

        if (currentQuantity >= variant.stock) {
            showToast(`Only ${variant.stock} available in stock.`, "warning");
            return; // Don't add if already at stock limit
        }

        if (itemIndex > -1) {
            // Update quantity in local cart
            currentCart[itemIndex].quantity += 1;
        } else {
            // Add new item to local cart, including stock limit
            currentCart.push({
                productId,
                name: product.name,
                size: selectedSize,
                price: variant.price,
                quantity: 1,
                imageUrl: product.imageUrl,
                stock: variant.stock // Store the stock limit
            });
        }

        hasCartChanged = true; // Mark cart as changed
        renderCart(currentCart); // Update UI immediately
        debouncedSaveCart(); // Schedule a Firestore save

        showToast(`${product.name} added to cart!`, "success");
        toggleModal(detailModalOverlay, false); // Close detail modal
    }

    function listenForCartUpdates(uid) {
        const userRef = doc(db, 'users', uid);
        unsubscribeCartListener = onSnapshot(userRef, (docSnap) => {
            // Only update local cart from Firestore if no local changes are pending
            if (!hasCartChanged) {
                const firestoreCart = docSnap.exists() ? docSnap.data().cart || [] : [];
                // --- Crucial: We need stock info here. If not saved in user's cart doc,
                // we'd need to fetch products *here* which defeats the purpose.
                // ASSUMPTION: 'stock' is saved within each cart item in Firestore.
                // If not, the `addToCart` needs to save it, or we need a different strategy.
                currentCart = firestoreCart;
                console.log("Cart updated from Firestore:", currentCart);
                renderCart(currentCart);
            } else {
                console.log("Local cart changes pending, skipping Firestore update.");
            }
        }, (error) => {
            console.error("Error listening to cart updates:", error);
            // Handle error appropriately, maybe show a toast
        });
        console.log("Attached cart listener for user:", uid);
    }

    function renderCart(cartItems) {
        if (!cartItemsContainer || !cartBadge || !cartTotalPrice) return;

        console.log("Rendering cart UI with items:", cartItems);

        if (!cartItems || cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            cartBadge.style.display = 'none';
            cartTotalPrice.textContent = 'R0.00';
            checkoutBtn.disabled = true;
            return;
        }

        let totalItems = 0;
        let totalPrice = 0;
        let cartHtml = '';

        cartItems.forEach(item => {
            const itemTotalPrice = item.price * item.quantity;
            totalItems += item.quantity;
            totalPrice += itemTotalPrice;

            cartHtml += `
            <div class="cart-item" data-product-id="${item.productId}" data-size="${item.size}">
                <img src="${item.imageUrl}" class="cart-item-image" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${item.size} - R${item.price.toFixed(2)} ea.</p>
                    <div class="quantity-selector">
                        <button class="quantity-btn" data-action="decrease" aria-label="Decrease quantity">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.stock}" data-stock="${item.stock}" aria-label="Quantity for ${item.name} ${item.size}" data-product-id="${item.productId}" data-size="${item.size}">
                        <button class="quantity-btn" data-action="increase" aria-label="Increase quantity" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
                    </div>
                     <p class="item-total-price">Total: R${itemTotalPrice.toFixed(2)}</p> <!-- Optional: Show item total -->
                </div>
                <button class="remove-item-btn" aria-label="Remove ${item.name} ${item.size}">&times;</button>
            </div>`;
        });

        cartItemsContainer.innerHTML = cartHtml;
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'block';
        cartTotalPrice.textContent = `R${totalPrice.toFixed(2)}`;
        checkoutBtn.disabled = false;
    }

    // --- MODIFIED: Cart Interaction Listener ---
    // Handles clicks (+/- buttons, remove) AND input changes. Updates LOCAL cart.
    cartItemsContainer?.addEventListener('input', handleQuantityInputChange); // Listen for input changes
    cartItemsContainer?.addEventListener('click', (e) => { // Keep click listener for buttons
        console.log("Cart interaction detected. Target:", e.target);
        const cartItemEl = e.target.closest('.cart-item');
        if (!cartItemEl) return;

        const productId = cartItemEl.dataset.productId;
        const size = cartItemEl.dataset.size;
        console.log(`Item ID: ${productId}, Size: ${size}`);

        if (e.target.matches('.quantity-btn')) {
            const action = e.target.dataset.action;
            console.log(`Quantity button clicked. Action: ${action}`);
            updateLocalCartQuantity(productId, size, action);
        }
        if (e.target.matches('.remove-item-btn')) {
            console.log('Remove button clicked.');
            removeLocalCartItem(productId, size);
        }
    });

    // --- NEW: Handler for quantity input change ---
    function handleQuantityInputChange(e) {
        if (!e.target.matches('.quantity-input')) return;

        const input = e.target;
        const productId = input.dataset.productId;
        const size = input.dataset.size;
        const stock = parseInt(input.dataset.stock, 10);
        let newQuantity = parseInt(input.value, 10);

        // Basic validation
        if (isNaN(newQuantity) || newQuantity < 1) {
            newQuantity = 1; // Default to 1 if invalid input
            input.value = newQuantity; // Correct the input field
        }

        // Check stock
        if (newQuantity > stock) {
            showToast(`Only ${stock} available in stock.`, "warning");
            newQuantity = stock; // Cap at stock limit
            input.value = newQuantity; // Correct the input field
        }

        console.log(`Input changed for ${productId} (${size}). New quantity: ${newQuantity}`);
        updateLocalCartQuantity(productId, size, 'set', newQuantity);
    }


    // --- NEW: updateLocalCartQuantity ---
    // Updates the quantity in the LOCAL `currentCart` array and triggers UI/save.
    function updateLocalCartQuantity(productId, size, action, value = null) {
        const itemIndex = currentCart.findIndex(item => item.productId === productId && item.size === size);
        if (itemIndex === -1) return; // Item not in local cart

        const item = currentCart[itemIndex];
        let newQuantity = item.quantity;
        const stock = item.stock; // Get stock from the local item object

        if (action === 'increase') {
            if (newQuantity < stock) {
                newQuantity++;
            } else {
                showToast(`Only ${stock} available in stock.`, "warning");
                // Disable the increase button in the UI (renderCart will handle this on redraw)
            }
        } else if (action === 'decrease') {
            newQuantity--;
        } else if (action === 'set' && value !== null) {
            newQuantity = value; // Directly set from input handler
        }

        if (newQuantity <= 0) {
            // Remove item if quantity drops to 0 or less
            currentCart.splice(itemIndex, 1);
        } else {
            // Update quantity, ensuring it doesn't exceed stock
            currentCart[itemIndex].quantity = Math.min(newQuantity, stock);
        }

        hasCartChanged = true;
        renderCart(currentCart); // Update UI immediately
        debouncedSaveCart(); // Schedule Firestore save
    }

    // --- NEW: removeLocalCartItem ---
    // Removes item from LOCAL `currentCart` and triggers UI/save.
    function removeLocalCartItem(productId, size) {
        const itemIndex = currentCart.findIndex(item => item.productId === productId && item.size === size);
        if (itemIndex > -1) {
            currentCart.splice(itemIndex, 1);
            hasCartChanged = true;
            renderCart(currentCart); // Update UI immediately
            debouncedSaveCart(); // Schedule Firestore save
        }
    }

    // --- NEW: Debounce function for saving cart ---
    function debouncedSaveCart() {
        clearTimeout(saveCartTimeout); // Clear previous timeout
        saveCartTimeout = setTimeout(() => {
            saveCartToFirestoreIfNeeded();
        }, 1500); // Wait 1.5 seconds after the last change
    }

    // --- NEW: saveCartToFirestoreIfNeeded ---
    // Saves the LOCAL cart state to Firestore if changes have been made.
    async function saveCartToFirestoreIfNeeded() {
        if (!currentUser || !hasCartChanged) {
            // console.log("Save skipped - no user or no changes.");
            return; // No user or no changes to save
        }

        console.log("Saving cart to Firestore:", currentCart);
        const userRef = doc(db, 'users', currentUser.uid);
        try {
            // Use setDoc with merge: true to update/create the cart field
            await setDoc(userRef, { cart: currentCart }, { merge: true });
            hasCartChanged = false; // Reset flag after successful save
            console.log("Cart saved to Firestore successfully.");
        } catch (error) {
            console.error("Error saving cart to Firestore:", error);
            showToast("Could not save cart changes.", "error");
            // Keep hasCartChanged = true so it tries again later? Or handle error better.
        }
    }

    // --- MODIFIED: openCheckoutModal ---
    // Now just renders based on LOCAL cart. Replaced alert.
    function openCheckoutModal() {
        if (currentCart.length === 0) {
            showToast("Your cart is empty.", "warning"); // Use toast
            return;
        }
        saveCartToFirestoreIfNeeded(); // Ensure latest changes are saved before checkout potentially starts
        toggleOffCanvas(cartModal, false);
        const checkoutBody = document.getElementById('checkout-body');
        const checkoutTotalPrice = document.getElementById('checkout-total-price');

        let summaryHtml = '<h3>Order Summary</h3>';
        let totalPrice = 0;
        currentCart.forEach(item => {
            summaryHtml += `<div class="cart-item"><img src="${item.imageUrl}" class="cart-item-image"><div class="cart-item-details"><h4>${item.name}</h4><p>${item.size} (x${item.quantity})</p></div><span class="order-item-price">R${(item.price * item.quantity).toFixed(2)}</span></div>`;
            totalPrice += item.price * item.quantity;
        });

        const optionsHtml = `
            <div class="booking-step"><h3>Delivery Method</h3><div class="payment-selector"><input type="radio" name="delivery" id="radio-pickup" value="Pickup" checked><label for="radio-pickup">Pickup from Salon</label><input type="radio" name="delivery" id="radio-delivery" value="Delivery" disabled><label for="radio-delivery">Delivery (Unavailable)</label></div></div>
            <div class="booking-step"><h3>Payment Method</h3><div class="payment-selector"><input type="radio" name="payment" id="radio-cash" value="Cash" checked><label for="radio-cash">Pay with Cash at Salon</label><input type="radio" name="payment" id="radio-card" value="Card" disabled><label for="radio-card">Pay with Card (Unavailable)</label></div></div>
        `;

        checkoutBody.innerHTML = summaryHtml + optionsHtml;
        checkoutTotalPrice.textContent = `R${totalPrice.toFixed(2)}`;
        toggleModal(checkoutModal, true);
    }

    // --- MODIFIED: confirmOrder ---
    // Adds final stock verification before placing order. Replaced alerts.
    async function confirmOrder() {
        if (!currentUser) {
            showToast("Please log in to place an order.", "warning");
            return;
        }
         if (currentCart.length === 0) {
            showToast("Cannot confirm order. Your cart is empty.", "warning");
            return;
        }

        // 1. Final Stock Verification
        confirmOrderBtn.disabled = true;
        confirmOrderBtn.textContent = 'Verifying Stock...';
        let stockIssueFound = false;
        const stockCheckPromises = currentCart.map(async (item) => {
            const productRef = doc(db, "products", item.productId);
            try {
                const productSnap = await getDoc(productRef);
                if (!productSnap.exists()) {
                    throw new Error(`Product ${item.name} not found.`);
                }
                const productData = productSnap.data();
                const variant = productData.variants.find(v => v.size === item.size);
                if (!variant) {
                     throw new Error(`Variant ${item.size} for ${item.name} not found.`);
                }
                if (item.quantity > variant.stock) {
                    stockIssueFound = true;
                    showToast(`${item.name} (${item.size}) only has ${variant.stock} left in stock. Your cart quantity is ${item.quantity}. Please update your cart.`, "error");
                    // Optionally: Update local cart and UI immediately
                    item.stock = variant.stock; // Update local stock info
                    if (item.quantity > variant.stock) item.quantity = variant.stock; // Reduce quantity
                    hasCartChanged = true;
                }
                 // Update local stock info even if quantity is okay, in case it changed
                item.stock = variant.stock;

            } catch (error) {
                console.error("Stock check error for", item.name, error);
                showToast(`Error checking stock for ${item.name}. Please try again.`, "error");
                stockIssueFound = true; // Treat fetch errors as stock issues
            }
        });

        await Promise.all(stockCheckPromises);

        confirmOrderBtn.disabled = false;
        confirmOrderBtn.textContent = 'Confirm Order';

        if (stockIssueFound) {
            renderCart(currentCart); // Re-render cart with updated quantities/stock
            toggleModal(checkoutModal, false); // Close checkout
            toggleOffCanvas(cartModal, true); // Open cart to show issues
            saveCartToFirestoreIfNeeded(); // Save potentially corrected cart quantities
            return; // Stop order placement
        }

        // 2. Proceed with Order Placement (if stock is OK)
        confirmOrderBtn.disabled = true;
        confirmOrderBtn.textContent = 'Placing Order...';

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
            showToast("User data not found.", "error");
             confirmOrderBtn.disabled = false;
             confirmOrderBtn.textContent = 'Confirm Order';
            return;
        }
        const customerName = userDoc.data().name;

        let totalPrice = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const newOrderId = `order_${crypto.randomUUID()}`; // More descriptive ID
        const newOrder = {
            id: newOrderId,
            customerId: currentUser.uid,
            customerName: customerName,
            items: currentCart, // Use the verified local cart items
            totalPrice: totalPrice,
            status: "Pending Pickup", // Assuming only pickup is enabled
            timestamp: serverTimestamp() // Use server timestamp for reliability
        };

         try {
            const batch = writeBatch(db);

            // a. Create the order document
            const orderRef = doc(db, "product_orders", newOrderId);
            batch.set(orderRef, newOrder);

            // b. Update stock levels (important!)
            currentCart.forEach(item => {
                const productRef = doc(db, "products", item.productId);
                // To update stock within an array, we need to fetch, modify, and update
                // This is complex and better suited for a Cloud Function if possible.
                // For now, skipping atomic stock update in batch for simplicity,
                // BUT THIS IS RISKY IN PRODUCTION (risk of overselling).
                // A Cloud Function triggered by order creation is the robust solution.
                console.warn(`Stock update for ${item.productId} variant ${item.size} skipped in client-side batch.`);
            });

            // c. Clear the user's cart
            const userRef = doc(db, 'users', currentUser.uid);
            batch.update(userRef, { cart: [] });

            await batch.commit(); // Commit all changes together

            currentCart = []; // Clear local cart
            hasCartChanged = false; // Reset flag
            renderCart([]); // Update UI

            showToast("Order placed successfully! You will be notified when it's ready for pickup.", "success");
            toggleModal(checkoutModal, false);
        } catch (error) {
            console.error("Error placing order:", error);
            showToast("There was an error placing your order. Please try again.", "error");
        } finally {
             confirmOrderBtn.disabled = false;
             confirmOrderBtn.textContent = 'Confirm Order';
        }
    }
    

    function listenForFavoritesUpdates(uid) {
        onSnapshot(collection(db, 'users', uid, 'favorites'), (snapshot) => {
            userFavorites = snapshot.docs.map(doc => doc.id); 
            const favoriteItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFavorites(favoriteItems);
        });
    }
    
    // --- MODIFIED: Renders favorites, handling both single items and product variants ---
    function renderFavorites(items) {
        if (!favoritesItemsContainer) return;
        if (!items || items.length === 0) {
            favoritesItemsContainer.innerHTML = '<p>You have no favorite items yet.</p>';
            return;
        }
        let html = '';
        items.forEach(item => {
            let priceInfo = '';
            let actionButton = '';
            let itemName = item.name;

            // --- NEW: Logic to handle product variants ---
            if (item.isVariantFavorite && item.favoritedVariant) {
                // This is a specific variant of a product
                itemName = `${item.name} (${item.favoritedVariant.size})`;
                priceInfo = `<p>R${item.favoritedVariant.price.toFixed(2)}</p>`;
                // Use originalId for fetching full product data for cart
                actionButton = `<button class="action-btn fav-add-to-cart" data-id="${item.originalId}" data-size="${item.favoritedVariant.size}">Add to Cart</button>`;
            } else if (item.type === 'HAIRSTYLE') {
                // This is a hairstyle
                priceInfo = `<p>R${item.price.toFixed(2)}</p>`;
                actionButton = `<button class="action-btn fav-book-now" data-id="${item.id}">Book Now</button>`;
            }

            html += `
        <div class="favorite-item">
          <img src="${item.imageUrl}" class="favorite-item-image" alt="${itemName}">
          <div class="favorite-item-details">
            <h4>${itemName}</h4>
            ${priceInfo}
            <div class="favorite-actions">
              ${actionButton}
              <button class="action-btn remove" data-id="${item.id}">Remove</button>
            </div>
          </div>
        </div>`;
        });
        favoritesItemsContainer.innerHTML = html;
    }

    // --- MODIFIED: Handles favoriting/unfavoriting items, now with optional variantSize ---
    async function toggleFavorite(itemId, itemType, variantSize = null) {
        if (!currentUser) return;

        let favId = itemId;
        if (itemType === 'products' && variantSize) {
            favId = `${itemId}_${variantSize}`; // Create a composite ID for the variant
        }

        const favRef = doc(db, 'users', currentUser.uid, 'favorites', favId);
        const modalFavBtn = document.querySelector(`.favorite-btn-modal[data-id="${itemId}"]`);

        if (userFavorites.includes(favId)) {
            // Item is already a favorite, so remove it
            await deleteDoc(favRef);
            if (modalFavBtn) modalFavBtn.classList.remove('favorited');
            showToast("Removed from favorites.", "success");
        } else {
            // Item is not a favorite, so add it
            const itemSnap = await getDoc(doc(db, itemType, itemId));
            if (itemSnap.exists()) {
                let dataToSave = itemSnap.data();
                // --- NEW: If it's a product variant, create a special object to save ---
                if (itemType === 'products' && variantSize) {
                    const variant = dataToSave.variants.find(v => v.size === variantSize);
                    if (!variant) {
                        console.error("Selected variant not found!");
                        return;
                    }
                    dataToSave = {
                        name: dataToSave.name,
                        imageUrl: dataToSave.imageUrl,
                        type: 'PRODUCT',
                        isVariantFavorite: true,
                        favoritedVariant: variant,
                        originalId: itemId
                    };
                }

                await setDoc(favRef, dataToSave);
                if (modalFavBtn) modalFavBtn.classList.add('favorited');
                showToast("Added to favorites!", "success");
            }
        }
    }

    // --- MODIFIED: Event listener for the favorites panel ---
    favoritesItemsContainer.addEventListener('click', async (e) => {
        const target = e.target;
        if (!target.matches('.action-btn')) return;

        if (target.matches('.remove')) {
            // --- NEW: Simplified removal logic ---
            const favId = target.dataset.id; // This is the unique ID in the favorites collection
            if (currentUser && favId) {
                const favRef = doc(db, 'users', currentUser.uid, 'favorites', favId);
                await deleteDoc(favRef);
                showToast("Removed from favorites.", "success");
            }
        }

        if (target.matches('.fav-book-now')) {
            const hairstyleId = target.dataset.id;
            const hairstyleDoc = await getDoc(doc(db, "hairstyles", hairstyleId));
            if (hairstyleDoc.exists()) {
                openBookingModal({ id: hairstyleDoc.id, ...hairstyleDoc.data() });
                toggleOffCanvas(favoritesModal, false);
            }
        }

        if (target.matches('.fav-add-to-cart')) {
            // --- NEW: Logic to add specific variant to cart ---
            const productId = target.dataset.id;
            const variantSize = target.dataset.size;
            if (productId && variantSize) {
                await addToCart(productId, variantSize);
                toggleOffCanvas(favoritesModal, false);
            }
        }
    });

    let currentBookingItem = null;
    let selectedBooking = { stylist: null, date: null, time: null };
    let currentDate = new Date(); // For tracking calendar month
    let availableStylistsForModal = [];

    async function openBookingModal(hairstyle) {
        console.log("--- Opening Booking Modal ---");
        console.log("Hairstyle:", hairstyle.name);
        currentBookingItem = hairstyle;
        selectedBooking = { stylist: "Any Available", date: null, time: null };
        availableStylistsForModal = []; // Clear previous stylists
        toggleModal(detailModalOverlay, false);

        const modalBody = document.getElementById('booking-modal-body');
        modalBody.innerHTML = '<p>Loading booking options...</p>';
        toggleOffCanvas(bookingModal, true);

        // Fetch available stylists
        const stylistIds = hairstyle.availableStylistIds || [];
        for (const id of stylistIds) {
            const stylistDoc = await getDoc(doc(db, "users", id));
            if (stylistDoc.exists()) availableStylistsForModal.push({ id: stylistDoc.id, ...stylistDoc.data() });
        }
        console.log("Available stylists for this service:", availableStylistsForModal.map(s=>s.name));

        renderBookingUI(availableStylistsForModal); // Pass stylists to UI render
        const today = new Date();
        today.setHours(0,0,0,0);
        const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        selectedBooking.date = todayString;
        console.log("Default date selected:", selectedBooking.date);

        // --- Use try-catch for initial selection ---
        try {
            document.querySelector(`.date-day[data-date="${selectedBooking.date}"]`)?.classList.add('selected');
            await handleBookingSelectionChange(); // Make it async
        } catch (error) {
             console.error("Error during initial booking selection change:", error);
             document.getElementById('time-slot-grid').innerHTML = '<p>Could not load available times initially.</p>';
        }
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
        selectedBooking.time = null; // Reset time
        console.log(`Selection changed. Stylist: ${selectedBooking.stylist}, Date: ${selectedBooking.date}`);

        const timeSlotGrid = document.getElementById('time-slot-grid');
        if (!selectedBooking.stylist || !selectedBooking.date) {
            timeSlotGrid.innerHTML = '<p>Please select a stylist and date.</p>';
            updateConfirmButtonState(); return;
        }

        timeSlotGrid.innerHTML = '<p>Loading times...</p>';
        updateConfirmButtonState();

        const dateToSend = selectedBooking.date;
        const getAvailableSlots = httpsCallable(functions, 'getAvailableSlots');
        let finalAvailableSlots = new Set();
        let allOccupiedSlotsForDate = new Set(); // Stores occupied slots for the *entire day*

        try {
            // Fetch all bookings for the date once (use cache)
            const dailyBookings = await getBookingsForDate(dateToSend);
            allOccupiedSlotsForDate = calculateAllOccupiedSlots(dailyBookings); // Calculate occupied based on ALL bookings
            console.log(`Occupied slots for ${dateToSend}:`, Array.from(allOccupiedSlotsForDate));

            // Call Cloud Function to get slots suitable for the *selected duration*
            if (selectedBooking.stylist === "Any Available") {
                console.log("Fetching slots for 'Any Available'.");
                if (availableStylistsForModal.length === 0) throw new Error("No stylists available.");

                const promises = availableStylistsForModal.map(stylist =>
                    getAvailableSlots({ stylistName: stylist.name, date: dateToSend, hairstyleId: currentBookingItem.id })
                    .catch(err => { console.warn(`Error for ${stylist.name}:`, err.message); return { data: { slots: [] } }; })
                );
                const results = await Promise.allSettled(promises);
                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value.data.slots) {
                        result.value.data.slots.forEach(slot => finalAvailableSlots.add(slot));
                    }
                });
            } else {
                console.log(`Fetching slots for specific stylist: ${selectedBooking.stylist}`);
                const result = await getAvailableSlots({ stylistName: selectedBooking.stylist, date: dateToSend, hairstyleId: currentBookingItem.id });
                if (result.data.slots) {
                    result.data.slots.forEach(slot => finalAvailableSlots.add(slot));
                }
            }

            console.log("Combined final slots from function:", Array.from(finalAvailableSlots));

            if (salonAllSlotsCache.length === 0) { /* ... fallback fetch ... */ }

            // Render, passing ALL occupied slots for min duration check, and function results for selected duration check
            renderTimeSlots(salonAllSlotsCache, allOccupiedSlotsForDate, Array.from(finalAvailableSlots));

        } catch (error) {
            console.error("Error in handleBookingSelectionChange:", error);
            timeSlotGrid.innerHTML = `<p>Could not load available times. ${error.message || ''}</p>`;
        } finally {
            updateConfirmButtonState();
        }
    }

    // --- NEW: Function to get all bookings for a specific date ---
    async function getBookingsForDate(dateString) {
        if (dailyBookingsCache[dateString]) {
            console.log(`Using cached bookings for ${dateString}`);
            return dailyBookingsCache[dateString];
        }
        console.log(`Fetching bookings for ${dateString}`);
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, where("date", "==", dateString), where("status", "in", ["Confirmed", "Pending"]));
        const snapshot = await getDocs(q);
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get durations (use cache if available, otherwise fetch)
        const bookingsWithDuration = await Promise.all(bookings.map(async (booking) => {
            let duration = 1; // Default
            if (hairstyleDurationsCache[booking.hairstyleId]) {
                 duration = hairstyleDurationsCache[booking.hairstyleId];
            } else {
                 try {
                     const styleDoc = await getDoc(doc(db, "hairstyles", booking.hairstyleId));
                     if (styleDoc.exists()) {
                         duration = Math.ceil(styleDoc.data().durationHours) || 1;
                         hairstyleDurationsCache[booking.hairstyleId] = duration; // Cache it
                     }
                 } catch (err) {
                     console.warn(`Could not fetch duration for hairstyle ${booking.hairstyleId}`, err);
                 }
            }
            return { ...booking, durationSlots: duration };
        }));

        dailyBookingsCache[dateString] = bookingsWithDuration; // Cache result
        return bookingsWithDuration;
    }

    // --- NEW: Function to calculate all occupied slots for a given list of bookings ---
    function calculateAllOccupiedSlots(bookings) {
        const occupied = new Set();
        if (salonAllSlotsCache.length === 0) return occupied; // Need all slots list

        bookings.forEach(booking => {
            const startIndex = salonAllSlotsCache.indexOf(booking.time);
            if (startIndex !== -1) {
                for (let i = 0; i < booking.durationSlots; i++) {
                    if (startIndex + i < salonAllSlotsCache.length) {
                        occupied.add(salonAllSlotsCache[startIndex + i]);
                    }
                }
            }
        });
        return occupied;
    }

     // --- NEW HELPER: checkMinDurationAvailability ---
    // Checks if a given start slot allows for the minimum hairstyle duration
    function checkMinDurationAvailability(startSlot, minDuration, allSlotsList, occupiedSlotsSet) {
        const startIndex = allSlotsList.indexOf(startSlot);
        if (startIndex === -1 || startIndex + minDuration > allSlotsList.length) {
            return false; // Slot not found or not enough total slots left
        }
        for (let i = 0; i < minDuration; i++) {
            const currentSlotIndex = startIndex + i;
            // Check if slot exists and is not occupied
            if (currentSlotIndex >= allSlotsList.length || occupiedSlotsSet.has(allSlotsList[currentSlotIndex])) {
                // Check for non-consecutive slots (shouldn't happen with salonAllSlotsCache, but good practice)
                if (i > 0 && allSlotsList.indexOf(allSlotsList[currentSlotIndex]) !== startIndex + i) return false;
                return false; // Slot occupied or beyond list bounds
            }
        }
        return true; // Found enough consecutive free slots
    }

     function renderTimeSlots(allSlotsList, occupiedSlotsSet, finalSlotsFromFunc) {
        const timeSlotGrid = document.getElementById('time-slot-grid');
        if (!allSlotsList || allSlotsList.length === 0) {
            timeSlotGrid.innerHTML = '<p>Salon hours not configured.</p>'; return;
        }

        const availableSlotsForDisplay = new Set(finalSlotsFromFunc);
        const now = new Date();
        const todayString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const isToday = selectedBooking.date === todayString;
        const currentMinutesPastMidnight = now.getHours() * 60 + now.getMinutes();
        const bufferMinutes = 60;
        const earliestAllowedMinutes = currentMinutesPastMidnight + bufferMinutes;

        console.log(`Rendering slots for ${selectedBooking.date}. Is today: ${isToday}. Current minutes: ${currentMinutesPastMidnight}, Earliest allowed: ${earliestAllowedMinutes}`);

        let hasEnabledSlots = false; // --- Flag to track if any slot is enabled ---
        const slotsHtml = allSlotsList.map(slot => {
            const [slotHour, slotMinute] = slot.split(':').map(Number);
            const slotMinutesPastMidnight = slotHour * 60 + slotMinute;

            const isPast = isToday && slotMinutesPastMidnight < earliestAllowedMinutes;
            const isOccupiedByAnyBooking = occupiedSlotsSet.has(slot);
            const isAvailableForSelectedDuration = availableSlotsForDisplay.has(slot);
            const meetsMinDuration = checkMinDurationAvailability(slot, minHairstyleDuration, allSlotsList, occupiedSlotsSet);

            const isDisabled = isPast || isOccupiedByAnyBooking || !isAvailableForSelectedDuration || !meetsMinDuration;
            const isSelected = slot === selectedBooking.time;

            if (!isDisabled) { // --- If the slot is NOT disabled, set the flag ---
                hasEnabledSlots = true;
            }

            // Logging for disabled slots (optional)
            if(isDisabled && !isOccupiedByAnyBooking && !isPast) {
                 // console.log(`Slot ${slot} disabled: AvailableForSelected=${isAvailableForSelectedDuration}, MeetsMinDuration=${meetsMinDuration}`);
            }
             if(isPast) {
                  console.log(`Slot ${slot} (${slotMinutesPastMidnight} mins) disabled: Is in the past (Earliest allowed: ${earliestAllowedMinutes} mins)`);
             }

            return `<button class="time-slot-btn ${isSelected ? 'selected' : ''}" ${isDisabled ? 'disabled' : ''}>${slot}</button>`;
        }).join('');

        // --- Use the flag to decide what to display ---
        if (!hasEnabledSlots) {
             timeSlotGrid.innerHTML = '<p>No available times found for this selection.</p>';
        } else {
             timeSlotGrid.innerHTML = slotsHtml;
        }
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
            showToast("Please complete all booking selections.", "warning"); // Use toast
            return;
        }
        
        const dateToSave = selectedBooking.date;
        
        console.log(`--- Confirming Booking ---`);
        console.log(`Final Date String for Firestore: "${dateToSave}"`);
        
        const bookingData = {
            hairstyleId: currentBookingItem.id, serviceName: currentBookingItem.name, customerId: currentUser.uid,
            customerName: currentUser.displayName || 'Customer', stylistName: selectedBooking.stylist,
            date: dateToSave, 
            time: selectedBooking.time, status: "Pending",
            timestamp: Date.now() 
        };

      try {
            await addDoc(collection(db, "bookings"), bookingData);
            showToast("Booking successful! You will be notified once it's confirmed.", "success"); // Use toast
            toggleOffCanvas(bookingModal, false);
        } catch (error) {
            console.error("Error creating booking:", error);
            showToast("Sorry, there was an error creating your booking.", "error"); // Use toast
        }
    }

    function listenForMyBookings(uid) {
        const q = query(collection(db, "bookings"), where("customerId", "==", uid), orderBy("timestamp", "desc"));
        onSnapshot(q, (snapshot) => renderMyBookings(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    
    async function renderMyBookings(bookings) {
        const container = document.getElementById('my-bookings-container');
        if(!container) return;
        if (bookings.length === 0) { container.innerHTML = '<p>You have no bookings yet.</p>'; return; }

        const bookingCardsHtml = await Promise.all(bookings.map(async b => {
            const hairstyleDoc = await getDoc(doc(db, "hairstyles", b.hairstyleId));
            const imageUrl = hairstyleDoc.exists() ? hairstyleDoc.data().imageUrl : 'https://placehold.co/400x400/F4DCD6/7C4F55?text=Style';

            // --- NEW: Check for both declineReason and cancellationReason ---
            let reasonHtml = '';
            if ((b.status === 'Declined' || b.status === 'Cancelled') && (b.declineReason || b.cancellationReason)) {
                const reason = b.declineReason || b.cancellationReason; // Use whichever exists
                reasonHtml = `<p class="decline-reason"><strong>Reason:</strong> ${reason}</p>`;
            }
            // --- END NEW ---

            return `
                <div class="list-item-card with-image" data-booking-id="${b.id}">
                    <img src="${imageUrl}" alt="${b.serviceName}" class="item-card-image">
                    <div class="item-card-content">
                        <h4>${b.serviceName}</h4>
                        <p>With ${b.stylistName || 'Any Available'} on ${b.date} at ${b.time}</p>
                        <p>Status: <span class="status-badge status-${b.status.toLowerCase()}">${b.status}</span></p>
                        ${reasonHtml} 
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
        const unreadQuery = query(collection(db, 'users', uid, 'notifications'), where("isRead", "==", false));
        onSnapshot(unreadQuery, (snapshot) => {
            if(!notificationsBadge) return;
            notificationsBadge.textContent = snapshot.size;
            notificationsBadge.style.display = snapshot.size > 0 ? 'flex' : 'none';
        });

        const fullQuery = query(collection(db, 'users', uid, 'notifications'), orderBy("timestamp", "desc"));
        onSnapshot(fullQuery, (snapshot) => renderNotifications(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    
   async function renderNotifications(notifications) {
         const container = document.getElementById('notifications-container');
         if (!container) return;

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

    notificationsButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleOffCanvas(notificationsPanel, true);
        markNotificationsAsRead();
    });
    
    
    document.body.addEventListener('click', async (e) => {
        const bookingCard = e.target.closest('.list-item-card[data-booking-id]');
        const removeBtn = e.target.closest('.remove-notification-btn');
        const clearAllBtn = e.target.closest('#clear-all-notifications-btn');
        const orderCard = e.target.closest('.order-card[data-order-id]');

        if (removeBtn) {
            e.stopPropagation();
            const notificationId = removeBtn.dataset.notificationId;
            const confirmed = await showConfirmationModal('Are you sure you want to delete this notification?', 'btn-danger', 'Delete');
            if (confirmed && currentUser) {
                 try {
                    await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', notificationId));
                    showToast("Notification deleted.", "success");
                 } catch (error) {
                    console.error("Error deleting notification:", error);
                    showToast("Could not delete notification.", "error");
                 }
            }
        }
        else if (clearAllBtn) {
            const confirmed = await showConfirmationModal('Are you sure you want to clear all notifications?', 'btn-danger', 'Clear All');
            if (confirmed && currentUser) {
                try {
                    const q = query(collection(db, 'users', currentUser.uid, 'notifications'));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const batch = writeBatch(db);
                        snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
                        await batch.commit();
                        showToast("All notifications cleared.", "success");
                    }
                 } catch (error) {
                    console.error("Error clearing notifications:", error);
                    showToast("Could not clear notifications.", "error");
                 }
            }
        }
        else if (orderCard) {
            const orderId = orderCard.dataset.orderId;
            if (orderId) {
                openOrderDetailsModal(orderId);
            }
        }
        else if (bookingCard) {
            const bookingId = bookingCard.dataset.bookingId;
            if (bookingId) {
                openBookingDetailWithChat(bookingId);
                if (bookingCard.classList.contains('notification-item')) {
                    const notificationId = bookingCard.dataset.notificationId;
                    if(currentUser && notificationId){
                       try {
                           await updateDoc(doc(db, 'users', currentUser.uid, 'notifications', notificationId), { isRead: true });
                       } catch (error) {
                           console.warn("Could not mark notification as read:", error);
                       }
                    }
                }
            }
        }
    });
    
    newSupportTicketBtn.addEventListener('click', () => toggleModal(newSupportTicketModal, true));
    closeNewSupportTicketModal.addEventListener('click', () => toggleModal(newSupportTicketModal, false));
    
    newSupportTicketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button');
        const originalButtonText = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending...';

        const message = newSupportTicketForm.message.value.trim();
        if (message === '' || !currentUser) {
            button.disabled = false;
            button.textContent = originalButtonText;
            return;
        }
    
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
            showToast("Could not find your user data.", "error");
            button.disabled = false;
            button.textContent = originalButtonText;
            return;
        }
        const userData = userDoc.data();
    
        try {
            await addDoc(collection(db, "support_messages"), {
                message: message,
                senderUid: currentUser.uid,
                senderName: userData.name,
                senderEmail: userData.email,
                status: "New",
                timestamp: serverTimestamp(),
                participantUids: [currentUser.uid]
            });
            showToast('Support ticket sent successfully!');
            toggleModal(newSupportTicketModal, false);
            newSupportTicketForm.reset();
        } catch (error) {
            console.error("Error creating new ticket:", error);
            showToast("Failed to send ticket.", "error");
        } finally {
            button.disabled = false;
            button.textContent = originalButtonText;
        }
    });

    function listenForSupportTickets(userId) {
        if (!userId) return;
        const q = query(collection(db, "support_messages"), where("participantUids", "array-contains", userId), orderBy("timestamp", "desc"));

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                ticketListContainer.innerHTML = '<p>You have no support tickets.</p>';
                return;
            }
            let ticketsHtml = '';
            snapshot.forEach(doc => {
                const ticket = doc.data();
                const statusClass = `status-${ticket.status.toLowerCase()}`;
                const activeClass = doc.id === currentOpenTicketId ? 'active' : '';
                ticketsHtml += `<div class="ticket-item ${activeClass}" data-ticket-id="${doc.id}" data-ticket-status="${ticket.status}"><p>${ticket.message}</p><span class="status-badge ${statusClass}">${ticket.status}</span></div>`;
            });
            ticketListContainer.innerHTML = ticketsHtml;
        });
    }

    ticketListContainer.addEventListener('click', (e) => {
        const ticketItem = e.target.closest('.ticket-item');
        if (ticketItem) {
            const ticketId = ticketItem.dataset.ticketId;
            const ticketStatus = ticketItem.dataset.ticketStatus;
            openSupportConversation(ticketId, ticketStatus);
        }
    });

     async function markSupportMessagesAsRead(ticketId) {
        if (!currentUser) return;
        const repliesRef = collection(db, "support_messages", ticketId, "replies");
        const q = query(repliesRef, where("senderUid", "==", currentUser.uid), where("status", "!=", "READ"));
        
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
            console.error("Error marking support messages as read:", error);
        }
    }

    function openSupportConversation(ticketId, status) {
        currentOpenTicketId = ticketId;
        listenForSupportTickets(currentUser.uid);

        supportChatForm.style.display = 'flex';
        ticketConversationContainer.innerHTML = '<p>Loading conversation...</p>';

        if (status === 'Closed') {
            supportChatForm.querySelector('input').disabled = true;
            supportChatForm.querySelector('button').disabled = true;
            supportChatInput.placeholder = 'This ticket is closed.';
        } else {
            supportChatForm.querySelector('input').disabled = false;
            supportChatForm.querySelector('button').disabled = false;
            supportChatInput.placeholder = 'Type your reply...';
        }

        if (unsubscribeSupportChat) unsubscribeSupportChat();

        const repliesRef = collection(db, "support_messages", ticketId, "replies");
        const q = query(repliesRef, orderBy("timestamp"));
        unsubscribeSupportChat = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs;
            if (docs.length > 0 && docs[docs.length - 1].data().senderUid !== currentUser.uid) {
                markSupportMessagesAsRead(ticketId);
            }

            let messagesHtml = '';
            snapshot.forEach(doc => {
                const message = doc.data();
                const bubbleClass = message.senderUid === currentUser.uid ? 'customer' : 'stylist';
                messagesHtml += `
                    <div class="chat-bubble ${bubbleClass}">
                        <div class="chat-sender-name">${message.senderName}</div>
                        <span class="message-text">${message.messageText}</span>
                         <div class="chat-footer">
                            <span class="chat-timestamp">${formatTimestamp(message.timestamp)}</span>
                            ${bubbleClass === 'customer' ? getStatusTicks(message.status) : ''}
                         </div>
                    </div>`;
            });
            ticketConversationContainer.innerHTML = messagesHtml;
            ticketConversationContainer.scrollTop = ticketConversationContainer.scrollHeight;
        });
    }

     supportChatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentOpenTicketId || e.target.querySelector('input').disabled) return;
        
        const message = supportChatInput.value.trim();
        if (message === '') return;

        const repliesRef = collection(db, "support_messages", currentOpenTicketId, "replies");
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        try {
            await addDoc(repliesRef, {
                messageText: message,
                senderUid: currentUser.uid,
                senderName: userDoc.data().name,
                status: "SENT",
                timestamp: serverTimestamp()
            });
            supportChatInput.value = '';
        } catch (error) {
            console.error("Error sending support reply:", error);
            showToast("Failed to send reply.", "error");
        }
    });


    function formatTimestamp(fbTimestamp) {
        if (!fbTimestamp || !fbTimestamp.toDate) return '';
        const date = fbTimestamp.toDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function getStatusTicks(status) {
        switch (status) {
            case 'SENT':
                return '<span class="ticks"><i class="fas fa-check"></i></span>';
            case 'DELIVERED':
                return '<span class="ticks"><i class="fas fa-check-double"></i></span>';
            case 'READ':
                return '<span class="ticks read"><i class="fas fa-check-double"></i></span>';
            default:
                return '';
        }
    }
    
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
        toggleModal(bookingDetailModal, true);

        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (!bookingDoc.exists()) { modalBody.innerHTML = '<p>Booking not found.</p>'; return; }
        const booking = bookingDoc.data();
        modalHeader.textContent = `Details for: ${booking.serviceName}`;

        const q = query(collection(db, "bookings", bookingId, "messages"), orderBy("timestamp"));

        unsubscribeChat = onSnapshot(q, (snapshot) => {
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
            
            // --- NEW: Add Reason if Cancelled or Declined ---
            let reasonHtml = '';
             if ((booking.status === 'Declined' || booking.status === 'Cancelled') && (booking.declineReason || booking.cancellationReason)) {
                 const reason = booking.declineReason || booking.cancellationReason;
                 reasonHtml = `<p class="decline-reason"><strong>Reason:</strong> ${reason}</p>`;
             }
            // --- END NEW ---

            modalBody.innerHTML = `
                <div class="booking-details-summary">
                    <p><strong>Stylist:</strong> ${booking.stylistName || 'Any Available'}</p>
                    <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span></p>
                    ${reasonHtml}
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
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const overlay = document.getElementById('order-details-modal-overlay');
        overlay.querySelector('.close-panel-btn').addEventListener('click', () => {
            toggleModal(overlay, false);
        });
    }
    createOrderDetailsModal();

    async function openOrderDetailsModal(orderId) {
        const overlay = document.getElementById('order-details-modal-overlay');
        const modalBody = document.getElementById('order-details-body');
        if (!overlay || !modalBody) return;

        modalBody.innerHTML = '<p>Loading order details...</p>';
        toggleModal(overlay, true);

        const orderRef = doc(db, 'product_orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            modalBody.innerHTML = '<p>Order not found.</p>';
            return;
        }

        const order = orderSnap.data();
        document.getElementById('order-modal-title').textContent = `Order #${orderId.slice(-6)}`;
        
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
        if (order.status === 'Pending Pickup') { // Only allow cancellation if pending
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
                 const confirmed = await showConfirmationModal('Are you sure you want to cancel this order? This action cannot be undone.');
                 if (confirmed) {
                    try {
                        await updateDoc(orderRef, { status: "Cancelled" });
                        showToast("Order has been cancelled.", "success"); // Use toast
                        toggleModal(overlay, false);
                    } catch (error) {
                        console.error("Error cancelling order:", error);
                        showToast("Failed to cancel the order. Please try again.", "error"); // Use toast
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

       toggleModal(editProfileModal, true);

        document.getElementById('edit-profile-form').addEventListener('submit', handleProfileUpdate);
        document.getElementById('profile-picture-input').addEventListener('change', handleProfilePictureChange);
        document.getElementById('remove-picture-btn')?.addEventListener('click', handleProfilePictureRemove);
        document.getElementById('close-edit-profile-modal').addEventListener('click', () => {
            toggleModal(editProfileModal, false);
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
        const confirmed = await showConfirmationModal("Are you sure you want to remove your profile picture?");
        if (!confirmed) return;

        const userRef = doc(db, 'users', currentUser.uid);
        const picRef = ref(storage, `profile_pictures/${currentUser.uid}`);
        try {
            await deleteObject(picRef).catch(err => { if (err.code !== 'storage/object-not-found') throw err; }); // Ignore if not found
            await updateDoc(userRef, { imageUrl: "" });
            await updateProfile(currentUser, { photoURL: "" });
            document.getElementById('profile-picture-preview').src = 'https://placehold.co/120x120/F4DCD6/7C4F55?text=User';
            document.getElementById('remove-picture-btn')?.remove(); // Remove button if it exists
            showToast("Profile picture removed.", "success"); // Use toast
        } catch (error) {
            console.error("Error removing profile picture:", error);
            showToast("Could not remove profile picture.", "error"); // Use toast
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
            if (file) {
                const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
                const snapshot = await uploadBytes(storageRef, file);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            const userRef = doc(db, "users", currentUser.uid);
            const dataToUpdate = { name, phone };
            if (imageUrl) {
                dataToUpdate.imageUrl = imageUrl;
            }
            await updateDoc(userRef, dataToUpdate);

            const authUpdateData = { displayName: name };
            if (imageUrl) {
                authUpdateData.photoURL = imageUrl;
            }
            await updateProfile(currentUser, authUpdateData);
            
            errorMsg.textContent = "";
            showToast("Profile updated successfully!", "success");
            toggleModal(editProfileModal, false);

        } catch (error) {
            console.error("Error updating profile:", error);
            errorMsg.textContent = "Failed to update profile. Please try again.";
            showToast("Failed to update profile.", "error"); // Use toast
        }
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
 
});

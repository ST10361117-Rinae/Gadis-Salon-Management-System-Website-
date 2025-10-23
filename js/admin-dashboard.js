/**
 * This script handles all the interactive logic for the admin dashboard.
 */

// Import Firebase functions and your config
import { auth, db, storage } from './firebase-config.js';
import { collection, onSnapshot, doc, getDoc, updateDoc, setDoc, query, where, getDocs, deleteDoc, orderBy, addDoc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged,updateProfile  } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-functions.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";


document.addEventListener('DOMContentLoaded', () => {
    // Get all the necessary elements from the page
    const sidebar = document.querySelector('.sidebar');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const contentPages = document.querySelectorAll('.dashboard-page');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    // Get metric elements
    const metricBookings = document.getElementById('metric-bookings');
    const metricStylists = document.getElementById('metric-stylists');
    const metricCustomers = document.getElementById('metric-customers');
    const metricProducts = document.getElementById('metric-products');
    const metricLowStock = document.getElementById('metric-low-stock');
    const metricSoldOut = document.getElementById('metric-sold-out');
    const lowStockList = document.getElementById('low-stock-list');
    const soldOutList = document.getElementById('sold-out-list');

    // User Management Element Selections ---
    const usersTableBody = document.getElementById('users-table-body');
    const createUserBtn = document.getElementById('create-user-btn');
    const userModalOverlay = document.getElementById('user-modal-overlay');
    const userModalCloseBtn = document.getElementById('user-modal-close-btn');
    const userForm = document.getElementById('user-form');
    const userModalTitle = document.getElementById('user-modal-title');
    const passwordGroup = document.getElementById('password-group');
    const userIdInput = document.getElementById('user-id');

    // Add User Modal Image Selections ---
    const userModalImg = document.getElementById('user-modal-img');
    const userPictureUpload = document.getElementById('user-picture-upload');
    const userRemovePictureBtn = document.getElementById('user-remove-picture-btn');

    // Product Management Element Selections ---
    const productsContainer = document.getElementById('products-container');
    const createProductBtn = document.getElementById('create-product-btn');
    const productModalOverlay = document.getElementById('product-modal-overlay');
    const productModalCloseBtn = document.getElementById('product-modal-close-btn');
    const productForm = document.getElementById('product-form');
    const productModalTitle = document.getElementById('product-modal-title');
    const productIdInput = document.getElementById('product-id');
    const productModalImg = document.getElementById('product-modal-img');
    const productPictureUpload = document.getElementById('product-picture-upload');
    const variantsContainer = document.getElementById('variants-container');
    const addVariantBtn = document.getElementById('add-variant-btn');
    const deleteProductBtn = document.getElementById('delete-product-btn');

    // Hairstyle Management Element Selections ---
    const hairstylesContainer = document.getElementById('hairstyles-container');
    const createHairstyleBtn = document.getElementById('create-hairstyle-btn');
    const hairstyleModalOverlay = document.getElementById('hairstyle-modal-overlay');
    const hairstyleModalCloseBtn = document.getElementById('hairstyle-modal-close-btn');
    const hairstyleForm = document.getElementById('hairstyle-form');
    const hairstyleModalTitle = document.getElementById('hairstyle-modal-title');
    const hairstyleIdInput = document.getElementById('hairstyle-id');
    const hairstyleModalImg = document.getElementById('hairstyle-modal-img');
    const hairstylePictureUpload = document.getElementById('hairstyle-picture-upload');
    const hairstyleStylistsContainer = document.getElementById('hairstyle-stylists-container');
    const deleteHairstyleBtn = document.getElementById('delete-hairstyle-btn');

    // Booking Details Modal Element Selections ---
    const bookingsContainer = document.getElementById('bookings-container');
    const bookingDetailsModalOverlay = document.getElementById('booking-details-modal-overlay');
    const bookingModalCloseBtn = document.getElementById('booking-modal-close-btn');
    const bookingModalServiceName = document.getElementById('booking-modal-service-name');
    const bookingModalCustomer = document.getElementById('booking-modal-customer');
    const bookingModalStylist = document.getElementById('booking-modal-stylist');
    const bookingModalDate = document.getElementById('booking-modal-date');
    const bookingModalTime = document.getElementById('booking-modal-time');
    const bookingModalChatMessages = document.getElementById('booking-modal-chat-messages');

    // --- NEW: Booking Modal Edit/Delete Elements ---
    const bookingModalFooter = document.getElementById('booking-modal-footer');
    const bookingModalViewDetails = document.getElementById('booking-modal-view-details');
    const bookingModalEditForm = document.getElementById('booking-modal-edit-form');
    const bookingModalEditBtn = document.getElementById('booking-modal-edit-btn');
    const bookingModalDeleteBtn = document.getElementById('booking-modal-delete-btn');
    const bookingModalSaveBtn = document.getElementById('booking-modal-save-btn');
    const bookingModalCancelBtn = document.getElementById('booking-modal-cancel-btn');
    const bookingModalStylistSelect = document.getElementById('booking-modal-stylist-select');
    const bookingModalDateInput = document.getElementById('booking-modal-date-input');
    const bookingModalTimeInput = document.getElementById('booking-modal-time-input');
    const bookingModalStatusSelect = document.getElementById('booking-modal-status-select');


    // Order Details Modal Element Selections ---
    const ordersContainer = document.getElementById('orders-container');
    const orderDetailsModalOverlay = document.getElementById('order-details-modal-overlay');
    const orderModalCloseBtn = document.getElementById('order-modal-close-btn');
    const orderModalTitle = document.getElementById('order-modal-title');
    const orderModalCustomer = document.getElementById('order-modal-customer');
    const orderModalTotal = document.getElementById('order-modal-total');
    const orderModalItemsList = document.getElementById('order-modal-items-list');

    // --- NEW: Order Modal Edit/Delete Elements ---
    const orderModalStatusSelect = document.getElementById('order-modal-status-select');
    const orderModalSaveStatusBtn = document.getElementById('order-modal-save-status-btn');
    const orderModalDeleteBtn = document.getElementById('order-modal-delete-btn');

    // --- NEW: Time Off Element Selections ---
    const timeoffTableBody = document.getElementById('timeoff-table-body');
    const createTimeOffBtn = document.getElementById('create-timeoff-btn'); // For admin
    const timeOffAdminModalOverlay = document.getElementById('timeoff-admin-modal-overlay');
    const timeOffAdminModalCloseBtn = document.getElementById('timeoff-admin-modal-close-btn');
    const timeOffAdminForm = document.getElementById('timeoff-admin-form');
    const timeOffAdminModalTitle = document.getElementById('timeoff-admin-modal-title');
    const timeOffAdminStylistSelect = document.getElementById('timeoff-admin-stylist');
    const timeOffRequestIdInput = document.getElementById('timeoff-request-id');
    const timeOffAdminErrorMsg = document.getElementById('timeoff-admin-error-msg');
    // --- END NEW Time Off Selections ---


    // Support System Element Selections ---
    const adminTicketListContainer = document.getElementById('admin-ticket-list-container');
    const adminTicketConversationContainer = document.getElementById('admin-ticket-conversation-container');
    const adminSupportChatForm = document.getElementById('admin-support-chat-form');
    const adminSupportChatInput = document.getElementById('admin-support-chat-input');
    const closeTicketBtn = document.getElementById('close-ticket-btn');
    const closeTicketModalOverlay = document.getElementById('close-ticket-modal-overlay');
    const closeTicketModalCloseBtn = document.getElementById('close-ticket-modal-close-btn');
    const confirmCloseTicketBtn = document.getElementById('confirm-close-ticket-btn');

    // Admin Profile Page Element Selections ---
    const adminProfileForm = document.getElementById('admin-profile-form');
    const adminProfileImg = document.getElementById('admin-profile-img');
    const adminPictureUpload = document.getElementById('admin-picture-upload');
    const adminRemovePictureBtn = document.getElementById('admin-remove-picture-btn');

    // --- NEW: Confirmation Modal Elements ---
    const confirmationModalOverlay = document.getElementById('confirmation-modal-overlay');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmProceedBtn = document.getElementById('confirm-proceed-btn');

    // --- NEW: Reason Prompt Modal Elements ---
    const reasonPromptOverlay = document.getElementById('reason-prompt-modal-overlay');
    const reasonPromptInput = document.getElementById('reason-prompt-input');
    const reasonPromptError = document.getElementById('reason-prompt-error');
    const reasonPromptTitle = document.getElementById('reason-prompt-title');
    const reasonPromptMessage = document.getElementById('reason-prompt-message');
    const reasonPromptCancelBtn = document.getElementById('reason-prompt-cancel-btn');
    const reasonPromptSubmitBtn = document.getElementById('reason-prompt-submit-btn');
    const reasonPromptCloseBtn = document.getElementById('reason-prompt-close-btn');
    let reasonPromptResolve = null; // For reason prompt promise
    // --- END NEW ---


    // Variables for sorting ---
    let allUsers = []; // This will hold the raw user data from Firestore
    let allStylists = [];
    let currentSortKey = 'name';
    let currentSortOrder = 'asc'; // 'asc' or 'desc'
    let newProfileImageFile = null;
    let newProductImageFile = null;
    let newHairstyleImageFile = null;
    let unsubscribeBookingChat;
    let unsubscribeAdminSupportChat;
    let currentOpenTicketId = null;
    let currentAdminData = null;
    let newAdminProfileImageFile = null;
    let currentEditingBookingId = null; // --- NEW
    let currentEditingOrderId = null; // --- NEW
    let confirmResolve = null;
    let currentOpenBookingId = null; // Store ID for edit/delete
    let currentOpenOrderId = null; // Store ID for edit/delete
    let confirmPromiseResolve = null; // For confirmation modal
    let currentAdminId = null;

    const functions = getFunctions(auth.app); // Initialize Firebase Functions

    // --- ADDED: Custom Toast Notification Function to replace alert() ---
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.error("Toast container not found!");
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Animate out and remove after a delay
        setTimeout(() => {
            toast.classList.remove('show');
            // Remove the element after the transition is complete
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // --- NEW: Custom Confirmation Modal Function ---
   function showConfirmationModal(message, confirmClass = 'btn-danger', confirmText = 'Proceed') {
        return new Promise((resolve) => {
            confirmationMessage.textContent = message;
            confirmProceedBtn.className = `btn ${confirmClass}`;
            confirmProceedBtn.textContent = confirmText;
            confirmationModalOverlay.classList.add('visible');
            confirmPromiseResolve = resolve;
        });
    }

     // --- Confirmation Modal Button Listeners ---
    confirmCancelBtn.addEventListener('click', () => {
        confirmationModalOverlay.classList.remove('visible');
        if (confirmPromiseResolve) confirmPromiseResolve(false);
    });
    confirmProceedBtn.addEventListener('click', () => {
        confirmationModalOverlay.classList.remove('visible');
        if (confirmPromiseResolve) confirmPromiseResolve(true);
    });

    // --- NEW: Reason Prompt Modal Function ---
    function showReasonPromptModal(config = {}) {
        return new Promise((resolve) => {
             if (!reasonPromptOverlay || !reasonPromptInput || !reasonPromptError || !reasonPromptTitle || !reasonPromptMessage || !reasonPromptSubmitBtn) {
                 console.error("Reason prompt modal elements not found!");
                 resolve(null); return;
             }
             reasonPromptTitle.textContent = config.title || 'Provide Reason';
             reasonPromptMessage.textContent = config.message || 'Please provide a reason:';
             reasonPromptInput.value = '';
             reasonPromptError.textContent = '';
             reasonPromptInput.placeholder = config.placeholder || 'Enter reason here...';
             reasonPromptSubmitBtn.textContent = config.submitText || 'Submit';
             reasonPromptSubmitBtn.className = `btn ${config.submitClass || 'btn-danger'}`;
             reasonPromptOverlay.classList.add('visible');
             reasonPromptInput.focus();
             reasonPromptResolve = resolve;
         });
    }
    // --- NEW: Reason Prompt Button Listeners ---
    reasonPromptCancelBtn?.addEventListener('click', () => {
        reasonPromptOverlay?.classList.remove('visible');
        if (reasonPromptResolve) { reasonPromptResolve(null); reasonPromptResolve = null; }
    });
    reasonPromptCloseBtn?.addEventListener('click', () => {
        reasonPromptOverlay?.classList.remove('visible');
         if (reasonPromptResolve) { reasonPromptResolve(null); reasonPromptResolve = null; }
    });
    reasonPromptSubmitBtn?.addEventListener('click', () => {
        const reason = reasonPromptInput?.value.trim();
        if (!reason) {
            if(reasonPromptError) reasonPromptError.textContent = 'Reason cannot be empty.';
            return;
        }
        reasonPromptOverlay?.classList.remove('visible');
        if (reasonPromptResolve) { reasonPromptResolve(reason); reasonPromptResolve = null; }
    });

     // --- 1. Security Check and Initial Data Load ---
    onAuthStateChanged(auth, async user => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().role === 'ADMIN') {
                currentAdminId = user.uid;
                currentAdminData = userDoc.data();
                console.log("Admin authenticated:", currentAdminId);
                await loadAllStylists(); // --- MODIFIED: Wait for stylists to load
                
                // --- NEW: Check hash on load ---
                const hash = window.location.hash.substring(1);
                handleNavigation(hash || 'dashboard');
            } else {
                console.warn("Unauthorized access attempt by user:", user.uid);
                window.location.href = 'login.html';
            }
        } else {
            console.log("No user logged in, redirecting...");
            window.location.href = 'login.html';
        }
    });

    // --- 2. Hamburger Menu Logic ---
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // --- 3. Dashboard Navigation Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            handleNavigation(targetId);
            window.location.hash = targetId;
        });
    });

    // --- NEW: Handle browser back/forward buttons ---
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1);
        handleNavigation(hash || 'dashboard');
    });
    
    function handleNavigation(targetId) {
        const targetPage = document.getElementById(`${targetId}-page`);

        navLinks.forEach(navLink => navLink.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            // Default to dashboard if hash is invalid
            document.querySelector('.nav-link[href="#dashboard"]').classList.add('active');
            targetId = 'dashboard'; // Reset targetId
        }

        contentPages.forEach(page => page.style.display = 'none');

        //if (targetPage) {
          //  targetPage.style.display = 'block';
        //}

        const pageToShow = document.getElementById(`${targetId}-page`);
        if (pageToShow) {
            pageToShow.style.display = 'block';
        } else {
            // Default to dashboard page if target doesn't exist
            document.getElementById('dashboard-page').style.display = 'block';
        }

        updatePageHeader(targetId);

        // Here we will call the specific data-fetching functions for each page
        switch (targetId) {
            case 'dashboard':
                fetchDashboardMetrics();
                break;
            case 'users':
                fetchUsers();
                break;
            case 'products': 
                fetchProducts(); 
                break;
            case 'hairstyles': 
                fetchHairstyles(); 
                break;
            case 'bookings': 
                fetchAllBookings(); 
                break;
            case 'orders': 
                fetchAllOrders(); 
                break;
            case 'timeoff':
                fetchAllTimeOffRequests();
                break;
            case 'support': 
                fetchAllSupportTickets(); 
                break;
            case 'profile': 
                displayAdminProfile(); 
                break;
            default: // Handle unknown hash
                fetchDashboardMetrics(); 
                break;
        }

        if (window.innerWidth <= 560) {
            sidebar.classList.remove('open');
        }
    }

    function updatePageHeader(pageId) {
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: "A live overview of your salon's activity." },
            users: { title: 'User Management', subtitle: 'View, create, and manage all user accounts.' },
            products: { title: 'Product Management', subtitle: 'Manage your salon\'s product inventory.' },
            hairstyles: { title: 'Hairstyle Management', subtitle: 'Manage your salon\'s hairstyle services.' },
            bookings: { title: 'All Bookings', subtitle: 'View the complete history of all appointments.' },
            orders: { title: 'All Product Orders', subtitle: 'View the complete history of all product sales.' },
             timeoff: { title: 'Time Off Management', subtitle: 'Approve, reject, or manage stylist time off.' }, 
            support: { title: 'Support Tickets', subtitle: 'Respond to and manage user support requests.' },
            profile: { title: 'My Profile', subtitle: 'Update your personal admin details.' }
        };

        const newTitle = titles[pageId] || titles['dashboard'];
        pageTitle.textContent = newTitle.title;
        pageSubtitle.textContent = newTitle.subtitle;
    }

    // --- 4. Data Fetching for the Main Dashboard ---
    function fetchDashboardMetrics() {
        // ... existing metric fetches (bookings, users) ...
        onSnapshot(collection(db, "bookings"), (snapshot) => {
            metricBookings.textContent = snapshot.size;
        });

        const usersQuery = collection(db, "users");
        onSnapshot(usersQuery, (snapshot) => {
            let stylistCount = 0;
            let customerCount = 0;
            snapshot.forEach(doc => {
                if (doc.data().role === 'WORKER') stylistCount++;
                if (doc.data().role === 'CUSTOMER') customerCount++;
            });
            metricStylists.textContent = stylistCount;
            metricCustomers.textContent = customerCount;
        });


        // Fetch Products for stock counts and lists
        onSnapshot(collection(db, "products"), (snapshot) => {
            let totalStock = 0;
            let lowStockCount = 0;
            let soldOutCount = 0;
            let lowStockHtml = '';
            let soldOutHtml = '';

            snapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() }; // Include ID
                if (product.variants && Array.isArray(product.variants)) {
                    product.variants.forEach(variant => {
                        const stock = variant.stock || 0;
                        totalStock += stock;
                        const itemName = `${product.name} (${variant.size})`;

                        if (stock === 0) {
                            soldOutCount++;
                            soldOutHtml += `<li>${itemName}</li>`; // --- NEW
                        } else if (stock <= 10) { // Assuming <= 10 is "low stock"
                            lowStockCount++;
                            lowStockHtml += `<li>${itemName} <span>${stock} left</span></li>`; // --- NEW
                        }
                    });
                }
            });

            // Update metric cards
            metricProducts.textContent = totalStock;
            metricLowStock.textContent = lowStockCount;
            metricSoldOut.textContent = soldOutCount;

            // --- NEW: Update dashboard lists ---
            lowStockList.innerHTML = lowStockHtml || '<li>No items are low on stock.</li>';
            soldOutList.innerHTML = soldOutHtml || '<li>No items are sold out.</li>';
        });
    }

    //  5. All logic for User Management ---

    // Fetches all users and populates the table
    function fetchUsers() {
        const usersCollection = collection(db, "users");
        onSnapshot(usersCollection, (snapshot) => {
            // 1. Store the raw data
            allUsers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            // 2. Render the table with the new data
            renderUsersTable();
        });
    }

    // --- NEW: Renders the user table based on current sorting ---
    function renderUsersTable() {
        // Sort the array before rendering
        const sortedUsers = [...allUsers].sort((a, b) => {
            const valA = a[currentSortKey] || '';
            const valB = b[currentSortKey] || '';
            
            if (valA < valB) {
                return currentSortOrder === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return currentSortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });

        let usersHtml = '';
        sortedUsers.forEach(user => {
            console.log(`Rendering user: ${user.name}, ID: ${user.id}`); 

            const roleClass = `role-${user.role.toLowerCase()}`;
            const profilePic = user.imageUrl || 'https://placehold.co/40x40/D67A84/FFFFFF?text=G';
            usersHtml += `
                <tr>
                    <td>
                        <div class="user-info-cell">
                            <img src="${profilePic}" alt="${user.name}">
                            <span>${user.name}</span>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td><span class="role-badge ${roleClass}">${user.role}</span></td>
                    <td class="action-buttons">
                        <a href="#" class="edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></a>
                        <a href="#" class="delete-user" data-id="${user.id}"><i class="fas fa-trash"></i></a>
                    </td>
                </tr>
            `;
        });
        usersTableBody.innerHTML = usersHtml;
        updateSortIcons();
    }

    // --- NEW: Handles clicks on table headers for sorting ---
    document.querySelector('#users-page thead').addEventListener('click', (e) => {
        const header = e.target.closest('th[data-sort]');
        if (!header) return;

        const sortKey = header.dataset.sort;

        if (sortKey === currentSortKey) {
            // If clicking the same column, reverse the order
            currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            // If clicking a new column, reset to ascending
            currentSortKey = sortKey;
            currentSortOrder = 'asc';
        }
        renderUsersTable();
    });

    // --- NEW: Updates the sort icons in the table header ---
    function updateSortIcons() {
        document.querySelectorAll('#users-page thead th[data-sort]').forEach(th => {
            th.classList.remove('sorted');
            const icon = th.querySelector('i');
            icon.className = 'fas fa-sort'; // Reset all icons

            if (th.dataset.sort === currentSortKey) {
                th.classList.add('sorted');
                icon.className = currentSortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            }
        });
    }

    // Opens the modal for creating or editing a user
    async function openUserModal(userId = null) {
        console.log("--- openUserModal called ---");
        console.log("Is userModalOverlay element found?", userModalOverlay);

        userForm.reset();
        newProfileImageFile = null;
        userIdInput.value = ''; // Clear hidden ID field

        if (userId) {
            // Edit mode
            userModalTitle.textContent = 'Edit User';
            passwordGroup.style.display = 'none'; // Hide password field for edits
            
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                const user = userDoc.data();
                userIdInput.value = userId;
                userForm.name.value = user.name;
                userForm.email.value = user.email;
                userForm.phone.value = user.phone || '';
                userForm.role.value = user.role;
                userModalImg.src = user.imageUrl || 'https://placehold.co/150x150/D67A84/FFFFFF?text=G';
            }
        } else {
            // Create mode
            userModalTitle.textContent = 'Create New User';
            passwordGroup.style.display = 'block';
            userModalImg.src = 'https://placehold.co/150x150/D67A84/FFFFFF?text=G'; // Reset to placeholder
        }
        userModalOverlay.style.display = 'flex';
        userModalOverlay.style.opacity = '1'; 
    }

    function closeUserModal() {
        userModalOverlay.style.opacity = '0';
        // Use a timeout to let the fade-out animation finish before hiding
        setTimeout(() => {
            userModalOverlay.style.display = 'none';
        }, 200); // This duration should match your CSS transition time
    }

    // --- NEW: 6. All logic for Product Management ---

    // Fetches all products and renders them as cards
    function fetchProducts() {
        onSnapshot(collection(db, "products"), (snapshot) => {
            let productsHtml = '';
            snapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                productsHtml += `
                    <div class="product-card" data-product-id="${product.id}">
                        <img src="${product.imageUrl}" alt="${product.name}">
                        <div class="card-content">
                            <h3>${product.name}</h3>
                            <p>${product.variants.length} variant(s)</p>
                        </div>
                    </div>
                `;
            });
            productsContainer.innerHTML = productsHtml;
        });
    }

    // Opens the product modal for creating or editing
    async function openProductModal(productId = null) {
        productForm.reset();
        newProductImageFile = null;
        productIdInput.value = '';
        variantsContainer.innerHTML = ''; // Clear old variants
        deleteProductBtn.style.display = 'none'; // Hide delete button by default

        if (productId) {
            // Edit Mode
            productModalTitle.textContent = 'Edit Product';
            deleteProductBtn.style.display = 'block';
            const productDoc = await getDoc(doc(db, "products", productId));
            if (productDoc.exists()) {
                const product = productDoc.data();
                productIdInput.value = productId;
                productForm.querySelector('#product-name').value = product.name;
                productModalImg.src = product.imageUrl || 'https://placehold.co/150x150/F4DCD6/333333?text=Image';

                // Add existing variants
                product.variants.forEach(addVariantGroup);
            }
        } else {
            // Create Mode
            productModalTitle.textContent = 'Create New Product';
            productModalImg.src = 'https://placehold.co/150x150/F4DCD6/333333?text=Image';
            addVariantGroup(); // Add one empty variant group to start
        }
        productModalOverlay.style.display = 'flex';
        productModalOverlay.style.opacity = '1';
    }

    function closeProductModal() {
        productModalOverlay.style.opacity = '0';
        setTimeout(() => { productModalOverlay.style.display = 'none'; }, 200);
    }
    
    // Adds a new group of variant inputs to the modal
    function addVariantGroup(variant = { size: '', price: '', stock: '' }) {
        const variantDiv = document.createElement('div');
        variantDiv.className = 'variant-group';
        variantDiv.innerHTML = `
            <div class="form-group">
                <label>Size</label>
                <input type="text" class="variant-size" value="${variant.size}" placeholder="e.g., 250ml" required>
            </div>
            <div class="form-group">
                <label>Price (R)</label>
                <input type="number" class="variant-price" value="${variant.price}" placeholder="e.g., 120" required>
            </div>
            <div class="form-group">
                <label>Stock</label>
                <input type="number" class="variant-stock" value="${variant.stock}" placeholder="e.g., 25" required>
            </div>
            <button type="button" class="remove-variant-btn">&times;</button>
        `;
        variantsContainer.appendChild(variantDiv);
    }
    
    // --- 7. Event Listeners for Product Management ---
    createProductBtn.addEventListener('click', () => openProductModal());
    productModalCloseBtn.addEventListener('click', closeProductModal);
    addVariantBtn.addEventListener('click', () => addVariantGroup());

    // Handle clicks on product cards for editing
    productsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
            openProductModal(card.dataset.productId);
        }
    });

    // Handle removing a variant group
    variantsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-variant-btn')) {
            e.target.closest('.variant-group').remove();
        }
    });
    
    // Handle the product form submission
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productId = productIdInput.value;
        const productName = productForm.querySelector('#product-name').value.trim();
        
        // --- VALIDATION 1: Check for product name ---
        if (!productName) {
            showToast("Please enter a product name.", "warning");
            return;
        }

        const variants = [];
        const variantGroups = variantsContainer.querySelectorAll('.variant-group');

        // --- VALIDATION 2: Check if there's at least one variant ---
        if (variantGroups.length === 0) {
             showToast("Please add at least one product variant.", "warning");
            return;
        }

        // --- VALIDATION 3: Loop through variants and check their inputs ---
        for (const group of variantGroups) {
            const size = group.querySelector('.variant-size').value.trim();
            const price = group.querySelector('.variant-price').value;
            const stock = group.querySelector('.variant-stock').value;

            if (!size || !price || !stock) {
                  showToast("Please ensure all variant fields (Size, Price, Stock) are filled out.", "warning");
                return;
            }
            variants.push({
                size: size,
                price: parseFloat(price),
                stock: parseInt(stock),
            });
        }
        
        // --- VALIDATION 4: Require an image for NEW products ---
        if (!productId && !newProductImageFile) {
            showToast("Please select an image for the new product.", "warning");
            return;
        }

        try {
            let finalProductId = productId;
            let imageUrlToSave = '';

            if (finalProductId) {
                const productDoc = await getDoc(doc(db, "products", finalProductId));
                if (productDoc.exists()) {
                    imageUrlToSave = productDoc.data().imageUrl || '';
                }
            } else {
                finalProductId = `prod_${crypto.randomUUID()}`;
            }

            if (newProductImageFile) {
                const storageRef = ref(storage, `products/${finalProductId}`);
                await uploadBytes(storageRef, newProductImageFile);
                imageUrlToSave = await getDownloadURL(storageRef);
            }

            const productData = {
                id: finalProductId,
                name: productName,
                imageUrl: imageUrlToSave,
                variants: variants,
                type: "PRODUCT"
            };

            await setDoc(doc(db, "products", finalProductId), productData);
            
              showToast('Product saved successfully!', 'success');
            closeProductModal();

        } catch (error) {
            console.error("Error saving product:", error);
           showToast(`Failed to save product: ${error.message}`, 'error');
        }
    });

    // --- NEW: EVENT LISTENER FOR IMAGE PREVIEW ---
    productPictureUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            newProductImageFile = file; // Store the file for uploading
            const reader = new FileReader();
            reader.onload = (event) => {
                // Set the src of the image tag to the file's data URL for preview
                productModalImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // --- NEW: Event Listener for Deleting a Product ---
     deleteProductBtn.addEventListener('click', async () => {
        const productId = productIdInput.value;
        if (!productId) return;

        const confirmed = await showConfirmationModal("Are you sure you want to permanently delete this product?");
        if (confirmed) {
            try {
                // Delete Firestore document
                await deleteDoc(doc(db, "products", productId));
                // Delete image from Storage
                const storageRef = ref(storage, `products/${productId}`);
                await deleteObject(storageRef).catch(err => console.warn("Image not found, skipping delete.", err));
                
                showToast("Product deleted successfully.", "success");
                closeProductModal();
            } catch (error) {
                console.error("Error deleting product:", error);
                showToast("Failed to delete product.", "error");
            }
        }
    });

    // --- NEW: 8. All logic for Hairstyle Management ---

    function fetchHairstyles() {
        onSnapshot(collection(db, "hairstyles"), (snapshot) => {
            let hairstylesHtml = '';
            snapshot.forEach(doc => {
                const hairstyle = { id: doc.id, ...doc.data() };
                hairstylesHtml += `
                    <div class="product-card" data-hairstyle-id="${hairstyle.id}">
                        <img src="${hairstyle.imageUrl}" alt="${hairstyle.name}">
                        <div class="card-content">
                            <h3>${hairstyle.name}</h3>
                            <p>R${hairstyle.price}</p>
                        </div>
                    </div>
                `;
            });
            hairstylesContainer.innerHTML = hairstylesHtml;
        });
    }
    
    async function openHairstyleModal(hairstyleId = null) {
        hairstyleForm.reset();
        newHairstyleImageFile = null;
        hairstyleIdInput.value = '';
        hairstyleStylistsContainer.innerHTML = 'Loading stylists...';
        deleteHairstyleBtn.style.display = 'none';

        // Fetch all stylists to populate the checklist
        const stylistsQuery = query(collection(db, "users"), where("role", "==", "WORKER"));
        const stylistsSnapshot = await getDocs(stylistsQuery);
        let stylistsHtml = '';
        stylistsSnapshot.forEach(doc => {
            const stylist = doc.data();
            stylistsHtml += `
                <div class="stylist-checkbox-item">
                    <input type="checkbox" id="stylist-${doc.id}" value="${doc.id}">
                    <label for="stylist-${doc.id}">${stylist.name}</label>
                </div>
            `;
        });
        hairstyleStylistsContainer.innerHTML = stylistsHtml;
        
        if (hairstyleId) {
            // Edit Mode
            hairstyleModalTitle.textContent = 'Edit Hairstyle';
            deleteHairstyleBtn.style.display = 'block';
            const hairstyleDoc = await getDoc(doc(db, "hairstyles", hairstyleId));
            if (hairstyleDoc.exists()) {
                const hairstyle = hairstyleDoc.data();
                hairstyleIdInput.value = hairstyleId;
                hairstyleForm.querySelector('#hairstyle-name').value = hairstyle.name;
                hairstyleForm.querySelector('#hairstyle-description').value = hairstyle.description;
                hairstyleForm.querySelector('#hairstyle-price').value = hairstyle.price;
                hairstyleForm.querySelector('#hairstyle-duration').value = hairstyle.durationHours;
                hairstyleModalImg.src = hairstyle.imageUrl || 'https://placehold.co/150x150/F4DCD6/333333?text=Image';
                
                // Pre-check the stylists that are available for this hairstyle
                if (hairstyle.availableStylistIds) {
                    hairstyle.availableStylistIds.forEach(stylistId => {
                        const checkbox = hairstyleStylistsContainer.querySelector(`#stylist-${stylistId}`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
            }
        } else {
            // Create Mode
            hairstyleModalTitle.textContent = 'Create New Hairstyle';
            hairstyleModalImg.src = 'https://placehold.co/150x150/F4DCD6/333333?text=Image';
        }
        hairstyleModalOverlay.style.display = 'flex';
        hairstyleModalOverlay.style.opacity = '1';
    }

    function closeHairstyleModal() {
        hairstyleModalOverlay.style.opacity = '0';
        setTimeout(() => { hairstyleModalOverlay.style.display = 'none'; }, 200);
    }
    
    // --- 9. Event Listeners for Hairstyle Management ---
    createHairstyleBtn.addEventListener('click', () => openHairstyleModal());
    hairstyleModalCloseBtn.addEventListener('click', closeHairstyleModal);

    hairstylesContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
            openHairstyleModal(card.dataset.hairstyleId);
        }
    });

    hairstylePictureUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            newHairstyleImageFile = file;
            const reader = new FileReader();
            reader.onload = (event) => { hairstyleModalImg.src = event.target.result; };
            reader.readAsDataURL(file);
        }
    });

    hairstyleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hairstyleId = hairstyleIdInput.value;
        const hairstyleName = hairstyleForm.querySelector('#hairstyle-name').value.trim();
        const hairstylePrice = hairstyleForm.querySelector('#hairstyle-price').value;
        const hairstyleDuration = hairstyleForm.querySelector('#hairstyle-duration').value;
        
        // Get selected stylist IDs
        const availableStylistIds = [];
        hairstyleStylistsContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            availableStylistIds.push(checkbox.value);
        });

        if (!hairstyleName) { showToast("Please enter a hairstyle name.", "warning"); return; }
        if (!hairstylePrice || !hairstyleDuration) { showToast("Please enter a price and duration.", "warning"); return; }
        if (availableStylistIds.length === 0) { showToast("Please select at least one available stylist.", "warning"); return; }
        if (!newHairstyleImageFile && !hairstyleId) { showToast("Please select an image for a new hairstyle.", "warning"); return; }
        
        try {
            let imageUrlToSave = hairstyleModalImg.src;
            let finalHairstyleId = hairstyleId;

            if (!finalHairstyleId) {
                finalHairstyleId = `hs_${crypto.randomUUID()}`;
            }

            if (newHairstyleImageFile) {
                const storageRef = ref(storage, `hairstyles/${finalHairstyleId}`);
                await uploadBytes(storageRef, newHairstyleImageFile);
                imageUrlToSave = await getDownloadURL(storageRef);
            }

            const hairstyleData = {
                id: finalHairstyleId,
                name: hairstyleName,
                description: hairstyleForm.querySelector('#hairstyle-description').value,
                price: parseFloat(hairstyleForm.querySelector('#hairstyle-price').value),
                durationHours: parseInt(hairstyleForm.querySelector('#hairstyle-duration').value),
                imageUrl: imageUrlToSave,
                availableStylistIds: availableStylistIds,
                type: "HAIRSTYLE"
            };

            await setDoc(doc(db, "hairstyles", finalHairstyleId), hairstyleData);
             showToast('Hairstyle saved successfully!', 'success');
            closeHairstyleModal();
        } catch (error) {
            console.error("Error saving hairstyle:", error);
              showToast(`Failed to save hairstyle: ${error.message}`, 'error');
        }
    });

    deleteHairstyleBtn.addEventListener('click', async () => {
        const hairstyleId = hairstyleIdInput.value;
        if (!hairstyleId) return;

        const confirmed = await showConfirmationModal("Are you sure you want to permanently delete this hairstyle?");
        if (confirmed) {
            try {
                // Delete Firestore document
                await deleteDoc(doc(db, "hairstyles", hairstyleId));
                // Delete image from Storage
                const storageRef = ref(storage, `hairstyles/${hairstyleId}`);
                await deleteObject(storageRef).catch(err => console.warn("Image not found, skipping delete.", err));
                
                showToast("Hairstyle deleted successfully.", "success");
                closeHairstyleModal();
            } catch (error) {
                console.error("Error deleting hairstyle:", error);
                   showToast("Failed to delete hairstyle.", "error");
            }
        }
    });

    // 10. All logic for Viewing Bookings ---

    function fetchAllBookings() {
        bookingsContainer.innerHTML = '<p>Loading all bookings...</p>';
        const q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));

        onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                bookingsContainer.innerHTML = '<p>No bookings found in the system.</p>';
                return;
            }

            let bookingsHtml = '';
            const cardPromises = snapshot.docs.map(async (bookingDoc) => {
                const booking = { ...bookingDoc.data(), id: bookingDoc.id };
                const statusClass = `status-${booking.status.toLowerCase()}`;

                let imageUrl = 'https://placehold.co/600x400/F4DCD6/333333?text=No+Image';
                if (booking.hairstyleId) {
                    try {
                        const hairstyleDoc = await getDoc(doc(db, "hairstyles", booking.hairstyleId));
                        if (hairstyleDoc.exists()) {
                            imageUrl = hairstyleDoc.data().imageUrl;
                        }
                    } catch (e) {
                        console.warn("Could not fetch hairstyle image for booking: ", e.message);
                    }
                }
                
                // --- NEW: Added quick delete button (btn-card-delete) ---
                return `
                    <div class="booking-card" data-booking-id="${booking.id}">
                        <button class="btn-card-delete delete-booking-quick" data-id="${booking.id}">&times;</button>
                        <img src="${imageUrl}" alt="${booking.serviceName}">
                        <div class="card-content">
                            <h3>${booking.serviceName}</h3>
                            <p><strong>Customer:</strong> ${booking.customerName}</p>
                            <p><strong>Stylist:</strong> ${booking.stylistName || 'N/A'}</p>
                        </div>
                        <div class="card-footer">
                            <span class="status-badge ${statusClass}">${booking.status}</span>
                        </div>
                    </div>
                `;
            });
            
            bookingsHtml = (await Promise.all(cardPromises)).join('');
            bookingsContainer.innerHTML = bookingsHtml;
        });
    }

    async function openAdminBookingModal(bookingId) {
   
        if (!bookingId) {
            console.error("openAdminBookingModal was called with a null or empty bookingId.");
            return;
        }

        // --- NEW: Reset modal to view mode ---
        bookingModalViewDetails.style.display = 'block';
        bookingModalEditForm.style.display = 'none';
        bookingModalFooter.style.display = 'flex';
        bookingModalEditBtn.style.display = 'inline-block';
        bookingModalDeleteBtn.style.display = 'inline-block';
        bookingModalSaveBtn.style.display = 'none';
        bookingModalCancelBtn.style.display = 'none';
        
        currentEditingBookingId = bookingId; // --- NEW: Store ID

        bookingDetailsModalOverlay.style.display = 'flex';
        bookingDetailsModalOverlay.style.opacity = '1';
        
        if (unsubscribeBookingChat) unsubscribeBookingChat();

        const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
        if (!bookingDoc.exists()) return;

        const booking = bookingDoc.data();
        
        // --- Populate View Mode ---
        bookingModalServiceName.textContent = booking.serviceName;
        bookingModalCustomer.textContent = booking.customerName;
        bookingModalStylist.textContent = booking.stylistName || 'Not Assigned';
        bookingModalDate.textContent = booking.date;
        bookingModalTime.textContent = booking.time;
        
        // --- NEW: Populate Edit Mode (hidden) ---
        populateStylistDropdown(booking.stylistId);
        bookingModalDateInput.value = booking.date;
        bookingModalTimeInput.value = booking.time; // This assumes time is saved in a format the input likes
        bookingModalStatusSelect.value = booking.status;


        const messagesRef = collection(db, "bookings", bookingId, "messages");
        const q = query(messagesRef, orderBy("timestamp"));
        unsubscribeBookingChat = onSnapshot(q, (snapshot) => {
            let messagesHtml = '';
            
            snapshot.forEach(messageDoc => {
                const message = messageDoc.data();
                const bubbleClass = message.senderUid === booking.customerId ? 'customer' : 'stylist';
                messagesHtml += `
                    <div class="chat-bubble ${bubbleClass}">
                        <div class="chat-sender-name">${message.senderName}</div>
                        <span class="message-text">${message.messageText}</span>
                        <div class="chat-footer">
                            <span class="chat-timestamp">${formatTimestamp(message.timestamp)}</span>
                        </div>
                    </div>
                `;
            });
            bookingModalChatMessages.innerHTML = messagesHtml;
            bookingModalChatMessages.scrollTop = bookingModalChatMessages.scrollHeight;
        });
    }

    // --- NEW: Helper function to populate stylist dropdown ---
    function populateStylistDropdown(selectedStylistId) {
        let optionsHtml = '<option value="">-- Select Stylist --</option>';
        allStylists.forEach(stylist => {
            const selected = stylist.id === selectedStylistId ? 'selected' : '';
            optionsHtml += `<option value="${stylist.id}" ${selected}>${stylist.name}</option>`;
        });
        bookingModalStylistSelect.innerHTML = optionsHtml;
    }

   function closeAdminBookingModal() {
        bookingDetailsModalOverlay.style.opacity = '0';
        setTimeout(() => { bookingDetailsModalOverlay.style.display = 'none'; }, 200);
        if (unsubscribeBookingChat) unsubscribeBookingChat();
        currentEditingBookingId = null; // --- NEW
    }

    // --- NEW: Function to delete a booking ---
    async function deleteBooking(bookingId) {
        if (!bookingId) return;
        try {
            await deleteDoc(doc(db, "bookings", bookingId));
            // Note: This does not delete the 'messages' subcollection.
            // A Cloud Function is required for that.
            showToast("Booking deleted successfully.", "success");
        } catch (error) {
            console.error("Error deleting booking:", error);
            showToast("Failed to delete booking.", "error");
        }
    }

    // --- 11. Event Listeners for Booking Management ---
    bookingModalCloseBtn.addEventListener('click', closeAdminBookingModal);

    // --- MODIFIED: To handle quick delete ---
    bookingsContainer.addEventListener('click', async (e) => {
        // Handle quick delete
        if (e.target.classList.contains('delete-booking-quick')) {
            e.stopPropagation(); // Stop modal from opening
            const bookingId = e.target.dataset.id;
            const confirmed = await showConfirmationModal("Are you sure you want to permanently delete this booking?");
            if (confirmed) {
                deleteBooking(bookingId);
            }
            return;
        }

        // Handle opening modal
        const card = e.target.closest('.booking-card');
        if (card) {
            openAdminBookingModal(card.dataset.bookingId);
        }
    });
    
    // --- NEW: Event listeners for booking edit/delete buttons ---
    bookingModalEditBtn.addEventListener('click', () => {
        bookingModalViewDetails.style.display = 'none';
        bookingModalEditForm.style.display = 'block';
        bookingModalEditBtn.style.display = 'none';
        bookingModalDeleteBtn.style.display = 'none';
        bookingModalSaveBtn.style.display = 'inline-block';
        bookingModalCancelBtn.style.display = 'inline-block';
    });

    bookingModalCancelBtn.addEventListener('click', () => {
        bookingModalViewDetails.style.display = 'block';
        bookingModalEditForm.style.display = 'none';
        bookingModalEditBtn.style.display = 'inline-block';
        bookingModalDeleteBtn.style.display = 'inline-block';
        bookingModalSaveBtn.style.display = 'none';
        bookingModalCancelBtn.style.display = 'none';
    });
    
    bookingModalDeleteBtn.addEventListener('click', async () => {
        const confirmed = await showConfirmationModal("Are you sure you want to permanently delete this booking?");
        if (confirmed) {
            deleteBooking(currentEditingBookingId);
            closeAdminBookingModal();
        }
    });

    bookingModalSaveBtn.addEventListener('click', async () => {
        if (!currentEditingBookingId) return;

        try {
            const selectedStylistOption = bookingModalStylistSelect.options[bookingModalStylistSelect.selectedIndex];
            const stylistId = selectedStylistOption.value;
            const stylistName = stylistId ? selectedStylistOption.text : "Not Assigned";

            const dataToUpdate = {
                stylistId: stylistId,
                stylistName: stylistName,
                date: bookingModalDateInput.value,
                time: bookingModalTimeInput.value, // You may need to validate this format
                status: bookingModalStatusSelect.value,
            };

            await updateDoc(doc(db, "bookings", currentEditingBookingId), dataToUpdate);
            showToast("Booking updated successfully!", "success");
            
            // Refresh the view mode data
            bookingModalStylist.textContent = stylistName;
            bookingModalDate.textContent = dataToUpdate.date;
            bookingModalTime.textContent = dataToUpdate.time;
            
            // Switch back to view mode
            bookingModalCancelBtn.click();

        } catch (error) {
            console.error("Error updating booking:", error);
            showToast("Failed to update booking.", "error");
        }
    });

    // 12. All logic for Viewing Product Orders ---
// --- MODIFIED: Added quick delete button ---
    function fetchAllOrders() {
        ordersContainer.innerHTML = '<p>Loading all orders...</p>';
        const q = query(collection(db, "product_orders"), orderBy("timestamp", "desc"));

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                ordersContainer.innerHTML = '<p>No product orders found.</p>';
                return;
            }
            let ordersHtml = '';
            snapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                const statusClass = `status-${order.status.toLowerCase().replace(' ', '-')}`;
                
                let imagesHtml = '';
                if (order.items && order.items.length > 0) {
                    order.items.slice(0, 3).forEach(item => {
                        imagesHtml += `<img src="${item.imageUrl}" alt="${item.name}">`;
                    });
                }

                // --- NEW: Added quick delete button (btn-card-delete) ---
                ordersHtml += `
                    <div class="order-card" data-order-id="${order.id}">
                        <button class="btn-card-delete delete-order-quick" data-id="${order.id}">&times;</button>
                        <div class="order-card-images">${imagesHtml}</div>
                        <div class="card-content">
                            <h3>Order #${order.id.slice(-6)}</h3>
                            <p><strong>Customer:</strong> ${order.customerName}</p>
                        </div>
                        <div class="card-footer">
                            <span class="status-badge ${statusClass}">${order.status}</span>
                        </div>
                    </div>
                `;
            });
            ordersContainer.innerHTML = ordersHtml;
        });
    }

     // --- MODIFIED: To store order ID and populate status ---
    async function openAdminOrderModal(orderId) {
        if (!orderId) return;
        currentEditingOrderId = orderId; // --- NEW
        orderDetailsModalOverlay.style.display = 'flex';
        orderDetailsModalOverlay.style.opacity = '1';

        const orderDoc = await getDoc(doc(db, "product_orders", orderId));
        if (orderDoc.exists()) {
            const order = orderDoc.data();
            orderModalTitle.textContent = `Order Details #${orderId.slice(-6)}`;
            orderModalCustomer.textContent = order.customerName;
            orderModalTotal.textContent = `R${order.totalPrice.toFixed(2)}`;
            orderModalStatusSelect.value = order.status; // --- NEW

            let itemsHtml = '';
            order.items.forEach(item => {
                itemsHtml += `
                    <div class="order-item">
                        <img src="${item.imageUrl}" alt="${item.name}">
                        <div class="item-details">
                            <strong>${item.name}</strong>
                            <p>Qty: ${item.quantity} | Size: ${item.size}</p>
                        </div>
                    </div>
                `;
            });
            orderModalItemsList.innerHTML = itemsHtml;
        }
    }

   function closeAdminOrderModal() {
        orderDetailsModalOverlay.style.opacity = '0';
        setTimeout(() => { orderDetailsModalOverlay.style.display = 'none'; }, 200);
        currentEditingOrderId = null; // --- NEW
    }

    // --- NEW: Function to delete an order ---
    async function deleteOrder(orderId) {
        if (!orderId) return;
        try {
            await deleteDoc(doc(db, "product_orders", orderId));
            showToast("Order deleted successfully.", "success");
        } catch (error) {
            console.error("Error deleting order:", error);
            showToast("Failed to delete order.", "error");
        }
    }

    // 13. Event Listeners for Order Management ---
    orderModalCloseBtn.addEventListener('click', closeAdminOrderModal);

    // --- MODIFIED: To handle quick delete ---
    ordersContainer.addEventListener('click', async (e) => {
        // Handle quick delete
        if (e.target.classList.contains('delete-order-quick')) {
            e.stopPropagation(); // Stop modal from opening
            const orderId = e.target.dataset.id;
             const confirmed = await showConfirmationModal("Are you sure you want to permanently delete this order?");
            if (confirmed) {
                deleteOrder(orderId);
            }
            return;
        }

        // Handle opening modal
        const card = e.target.closest('.order-card');
        if (card) {
            openAdminOrderModal(card.dataset.orderId);
        }
    });

    // --- NEW: Event listeners for order modal buttons ---
    orderModalSaveStatusBtn.addEventListener('click', async () => {
        if (!currentEditingOrderId) return;
        const newStatus = orderModalStatusSelect.value;
        try {
            await updateDoc(doc(db, "product_orders", currentEditingOrderId), {
                status: newStatus
            });
            showToast("Order status updated!", "success");
        } catch (error) {
            console.error("Error updating order status:", error);
            showToast("Failed to update status.", "error");
        }
    });

    orderModalDeleteBtn.addEventListener('click', async () => {
        const confirmed = await showConfirmationModal("Are you sure you want to permanently delete this order?");
        if (confirmed) {
            deleteOrder(currentEditingOrderId);
            closeAdminOrderModal();
        }
    });

    // --- 13. Time Off Management Logic ---
    async function loadAllStylists() {
        allStylists = [];
        const stylistsQuery = query(collection(db, "users"), where("role", "==", "WORKER"));
        try {
            const querySnapshot = await getDocs(stylistsQuery);
            querySnapshot.forEach(doc => allStylists.push({ id: doc.id, ...doc.data() }));
            console.log("Cached all stylists:", allStylists);
        } catch (error) { console.error("Error loading stylists:", error); }
    }

    function populateStylistDropdown() {
        if (!timeOffAdminStylistSelect) return;
        timeOffAdminStylistSelect.innerHTML = '<option value="">Select a stylist...</option>';
        allStylists.forEach(stylist => {
            timeOffAdminStylistSelect.innerHTML += `<option value="${stylist.id}" data-name="${stylist.name}">${stylist.name}</option>`;
        });
    }

    function fetchAllTimeOffRequests() {
        if (!timeoffTableBody) return;
        timeoffTableBody.innerHTML = '<tr><td colspan="6">Loading requests...</td></tr>';
        const q = query(collection(db, "timeOffRequests"), orderBy("timestamp", "desc"));

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                timeoffTableBody.innerHTML = '<tr><td colspan="6">No time off requests found.</td></tr>';
                return;
            }
            let html = '';
            snapshot.forEach(doc => {
                const request = { id: doc.id, ...doc.data() };
                const statusClass = `status-${request.status.toLowerCase()}`;
                html += `
                    <tr data-request-id="${request.id}">
                        <td>${request.stylistName}</td>
                        <td>${request.startDate}</td>
                        <td>${request.endDate}</td>
                        <td class="reason-cell">${request.reason}</td>
                        <td><span class="status-badge ${statusClass}">${request.status}</span></td>
                        <td class="action-buttons">
                            ${request.status === 'pending' ? `
                                <a href="#" class="approve-timeoff" title="Approve"><i class="fas fa-check"></i></a>
                                <a href="#" class="reject-timeoff" title="Reject"><i class="fas fa-times"></i></a>
                            ` : ''}
                            <a href="#" class="edit-timeoff" title="Edit"><i class="fas fa-edit"></i></a>
                            <a href="#" class="delete-timeoff" title="Delete"><i class="fas fa-trash"></i></a>
                        </td>
                    </tr>
                `;
            });
            timeoffTableBody.innerHTML = html;
        }, (error) => {
            console.error("Error fetching time off requests:", error);
            timeoffTableBody.innerHTML = '<tr><td colspan="6">Error loading requests. Please create the required Firestore index.</td></tr>';
        });
    }

    // --- MODIFIED: showTimeOffModal to use classes and display ---
    async function showTimeOffModal(requestId = null) {
        timeOffAdminForm.reset();
        timeOffAdminErrorMsg.textContent = '';
        populateStylistDropdown(); 

        if (requestId) {
            timeOffAdminModalTitle.textContent = 'Edit Time Off Request';
            timeOffRequestIdInput.value = requestId;
            try {
                const requestDoc = await getDoc(doc(db, "timeOffRequests", requestId));
                if (requestDoc.exists()) {
                    const data = requestDoc.data();
                    timeOffAdminStylistSelect.value = data.stylistId;
                    timeOffAdminForm.startDate.value = data.startDate;
                    timeOffAdminForm.endDate.value = data.endDate;
                    timeOffAdminForm.reason.value = data.reason;
                }
            } catch (error) {
                console.error("Error fetching time off request for edit:", error);
                timeOffAdminErrorMsg.textContent = 'Could not load request data.';
            }
        } else {
            timeOffAdminModalTitle.textContent = 'Create Time Off Request';
            timeOffRequestIdInput.value = '';
        }
        // --- MODIFIED: Use display: flex and classList for transition ---
        timeOffAdminModalOverlay.style.display = 'flex';
        setTimeout(() => timeOffAdminModalOverlay.classList.add('visible'), 10);
    }

    // --- MODIFIED: closeTimeOffModal to use classes and display ---
    function closeTimeOffModal() {
        timeOffAdminModalOverlay.classList.remove('visible');
        // --- MODIFIED: Wait for transition before hiding ---
        setTimeout(() => {
            timeOffAdminModalOverlay.style.display = 'none';
        }, 300); // Match transition duration
    }

    // --- MODIFIED: timeOffAdminForm submit listener ---
    timeOffAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const requestId = timeOffRequestIdInput.value;
        const stylistId = timeOffAdminStylistSelect.value;
        const selectedOption = timeOffAdminStylistSelect.options[timeOffAdminStylistSelect.selectedIndex];
        const stylistName = selectedOption ? selectedOption.dataset.name : null; // Check if an option is selected
        const startDate = timeOffAdminForm.startDate.value;
        const endDate = timeOffAdminForm.endDate.value;
        const reason = timeOffAdminForm.reason.value.trim();

        if (!stylistId || !stylistName || !startDate || !endDate || !reason) {
            timeOffAdminErrorMsg.textContent = 'Please fill in all fields.';
            return;
        }
        if (endDate < startDate) {
            timeOffAdminErrorMsg.textContent = 'End date cannot be before the start date.';
            return;
        }

        const submitButton = timeOffAdminForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        const requestData = {
            stylistId,
            stylistName,
            startDate,
            endDate,
            reason,
            status: 'approved',
            timestamp: serverTimestamp()
        };

        try {
            if (requestId) {
                const requestRef = doc(db, "timeOffRequests", requestId);
                delete requestData.timestamp; 
                await updateDoc(requestRef, requestData);
                showToast("Time off request updated.", "success");
            } else {
                await addDoc(collection(db, "timeOffRequests"), requestData);
                showToast("Time off request created and approved.", "success");
            }
            closeTimeOffModal();
        } catch (error) {
            console.error("Error saving time off request:", error);
            timeOffAdminErrorMsg.textContent = 'Failed to save request.';
        } finally {
            submitButton.disabled = false;
        }
    });

    async function deleteTimeOffRequest(requestId) {
        const confirmed = await showConfirmationModal("Are you sure you want to delete this time off request? This cannot be undone.", 'btn-danger', 'Delete');
        if (confirmed) {
            try {
                await deleteDoc(doc(db, "timeOffRequests", requestId));
                showToast("Request deleted.", "success");
            } catch (error) {
                console.error("Error deleting time off request:", error);
                showToast("Failed to delete request.", "error");
            }
        }
    }

    timeoffTableBody?.addEventListener('click', async (e) => {
        e.preventDefault();
        const link = e.target.closest('a');
        if (!link) return;
        const row = link.closest('tr');
        const requestId = row?.dataset.requestId;
        if (!requestId) return;
        const requestRef = doc(db, "timeOffRequests", requestId);

        if (link.classList.contains('approve-timeoff')) {
            try {
                await updateDoc(requestRef, { status: 'approved' });
                showToast("Request approved.", "success");
            } catch (error) { showToast("Failed to approve request.", "error"); }
        } else if (link.classList.contains('reject-timeoff')) {
             try {
                await updateDoc(requestRef, { status: 'rejected' });
                showToast("Request rejected.", "success");
            } catch (error) { showToast("Failed to reject request.", "error"); }
        } else if (link.classList.contains('edit-timeoff')) {
            showTimeOffModal(requestId);
        } else if (link.classList.contains('delete-timeoff')) {
            deleteTimeOffRequest(requestId);
        }
    });

     createTimeOffBtn?.addEventListener('click', () => showTimeOffModal(null));
     timeOffAdminModalCloseBtn?.addEventListener('click', closeTimeOffModal);

    // 14. All logic for the Admin Support System ---

    function fetchAllSupportTickets() {
        adminTicketListContainer.innerHTML = '<p>Loading tickets...</p>';
        const q = query(collection(db, "support_messages"), orderBy("timestamp", "desc"));

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                adminTicketListContainer.innerHTML = '<p>No support tickets found.</p>';
                return;
            }
            let ticketsHtml = '';
            snapshot.forEach(ticketDoc => {
                const ticket = { ...ticketDoc.data(), id: ticketDoc.id };
                const statusClass = `status-${ticket.status.toLowerCase()}`;
                const activeClass = ticket.id === currentOpenTicketId ? 'active' : '';
                ticketsHtml += `
                    <div class="ticket-item ${activeClass}" data-ticket-id="${ticket.id}" data-ticket-status="${ticket.status}">
                        <p>${ticket.message}</p>
                        <p style="font-weight: normal; font-size: 0.9em;">From: ${ticket.senderName}</p>
                        <span class="status-badge ${statusClass}">${ticket.status}</span>
                    </div>
                `;
            });
            adminTicketListContainer.innerHTML = ticketsHtml;
        });
    }

    async function openAdminSupportConversation(ticketId, status) {
        currentOpenTicketId = ticketId;
        fetchAllSupportTickets(); // Redraw list to highlight active ticket

        adminSupportChatForm.style.display = 'flex';
        adminTicketConversationContainer.innerHTML = '<p>Loading conversation...</p>';

        if (status === 'Closed') {
            adminSupportChatForm.style.display = 'none';
            closeTicketBtn.style.display = 'none'; // Hide button if already closed
        } else {
            adminSupportChatForm.style.display = 'flex';
            closeTicketBtn.style.display = 'block'; // --- NEW: Show the close button
        }

        if (unsubscribeAdminSupportChat) unsubscribeAdminSupportChat();

        // Mark the parent ticket as "Read" if it's "New"
        if (status === 'New') {
            await updateDoc(doc(db, "support_messages", ticketId), { status: "Read" });
        }

        const repliesRef = collection(db, "support_messages", ticketId, "replies");
        const q = query(repliesRef, orderBy("timestamp"));
        
        unsubscribeAdminSupportChat = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs;
            if (docs.length > 0) {
                const lastMessage = docs[docs.length - 1].data();
                if (lastMessage.senderUid !== currentAdminId) {
                    markSupportMessagesAsRead(ticketId);
                }
            }

            let messagesHtml = '';
            docs.forEach(messageDoc => {
                const message = messageDoc.data();
                const bubbleClass = message.senderUid === currentAdminId ? 'admin' : 'customer';
                let statusTicks = '';
                if (bubbleClass === 'admin') {
                    statusTicks = getStatusTicks(message.status || 'SENT');
                }
                
                // --- THIS IS THE FIX: Add sender name and formatted timestamp ---
                messagesHtml += `
                    <div class="chat-bubble ${bubbleClass}">
                        <div class="chat-sender-name">${message.senderName}</div>
                        <span class="message-text">${message.messageText}</span>
                        <div class="chat-footer">
                            <span class="chat-timestamp">${formatTimestamp(message.timestamp)}</span>
                            ${statusTicks}
                        </div>
                    </div>
                `;
            });
            adminTicketConversationContainer.innerHTML = messagesHtml;
            adminTicketConversationContainer.scrollTop = adminTicketConversationContainer.scrollHeight;
        });
    }

    // --- NEW HELPER FUNCTION FOR TIMESTAMPS ---
    function formatTimestamp(fbTimestamp) {
        if (!fbTimestamp || !fbTimestamp.toDate) {
            return '';
        }
        const date = fbTimestamp.toDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    adminTicketListContainer.addEventListener('click', (e) => {
        const ticketItem = e.target.closest('.ticket-item');
        if (ticketItem) {
            openAdminSupportConversation(ticketItem.dataset.ticketId, ticketItem.dataset.ticketStatus);
        }
    });

    adminSupportChatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = adminSupportChatInput.value.trim();
        if (message === '' || !currentOpenTicketId) return;

        try {
            await addDoc(collection(db, "support_messages", currentOpenTicketId, "replies"), {
                messageText: message,
                senderUid: currentAdminId,
                senderName: currentAdminData.name || "Admin", 
                status: "SENT",
                timestamp: serverTimestamp()
            });
            adminSupportChatInput.value = '';
        } catch (error) {
            console.error("Error sending support reply:", error);
             showToast("Failed to send reply.", "error");
        }
    });

    async function markSupportMessagesAsRead(ticketId) {
        const repliesRef = collection(db, "support_messages", ticketId, "replies");
        const q = query(repliesRef, where("senderUid", "==", currentAdminId), where("status", "!=", "Read"));
        const snapshot = await getDocs(q);
        snapshot.forEach(docSnap => {
            updateDoc(doc(db, "support_messages", ticketId, "replies", docSnap.id), { status: "Read" });
        });
    }
    
    // --- 15. Event Listeners for Closing a Ticket ---
    closeTicketBtn.addEventListener('click', () => {
        console.log("Close Ticket button clicked. Current open ticket ID:", currentOpenTicketId);
        if (currentOpenTicketId) {
            console.log("Opening close ticket confirmation modal...");
            closeTicketModalOverlay.classList.add('is-visible');
        } else {
            console.warn("Close Ticket button clicked, but no ticket is currently open.");
        }
    });
    
    closeTicketModalCloseBtn.addEventListener('click', () => {
        closeTicketModalOverlay.classList.remove('is-visible');
    });

    confirmCloseTicketBtn.addEventListener('click', async () => {
        console.log("Confirm Close Ticket button clicked for ticket ID:", currentOpenTicketId);
        if (!currentOpenTicketId) {
            console.error("Confirmation button clicked, but currentOpenTicketId is missing.");
            return;
        }
        try {
            console.log("Attempting to update Firestore document...");
            await updateDoc(doc(db, "support_messages", currentOpenTicketId), { status: "Closed" });
            console.log("Firestore document updated successfully.");
            showToast("Ticket has been closed.", "success");
            closeTicketModalOverlay.classList.remove('is-visible');
            // Refresh the conversation view
            console.log("Refreshing conversation view for the closed ticket.");
            openAdminSupportConversation(currentOpenTicketId, 'Closed');
        } catch (error) {
            console.error("Error closing ticket:", error);
            showToast("Failed to close ticket.", "error");
        }
    });

    function getStatusTicks(status) {
        if (status === 'Read') return '<span class="ticks read"><i class="fas fa-check-double"></i></span>';
        if (status === 'SENT') return '<span class="ticks"><i class="fas fa-check"></i></span>';
        return '';
    }

    // 16. All logic for Admin Profile Page ---

    function displayAdminProfile() {
        if (!currentAdminData) return;
        adminProfileForm.name.value = currentAdminData.name || '';
        adminProfileForm.email.value = currentAdminData.email || '';
        adminProfileForm.phone.value = currentAdminData.phone || '';
        adminProfileImg.src = currentAdminData.imageUrl || 'https://placehold.co/150x150/D67A84/FFFFFF?text=A';
    }

    // Image preview listener
    adminPictureUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            newAdminProfileImageFile = file;
            const reader = new FileReader();
            reader.onload = (event) => { adminProfileImg.src = event.target.result; };
            reader.readAsDataURL(file);
        }
    });

    // Form submission listener
    adminProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentAdminId) return;

        const newName = adminProfileForm.name.value.trim();
        const newPhone = adminProfileForm.phone.value.trim();

        // Basic Validation
        if (!newName || !/^\d{10}$/.test(newPhone)) {
            showToast("Please enter a valid name and a 10-digit phone number.", "warning");
            return;
        }

        try {
            // If there's a new image, upload it first
            if (newAdminProfileImageFile) {
                const storageRef = ref(storage, `profile_pictures/${currentAdminId}`);
                await uploadBytes(storageRef, newAdminProfileImageFile);
                const downloadURL = await getDownloadURL(storageRef);
                await updateDoc(doc(db, "users", currentAdminId), { imageUrl: downloadURL });
                newAdminProfileImageFile = null; // Reset after upload
            }

            // Update Firestore with name and phone
            await updateDoc(doc(db, "users", currentAdminId), {
                name: newName,
                phone: newPhone,
            });

           showToast('Profile updated successfully!', 'success');
            // Refresh local data
            const userDoc = await getDoc(doc(db, "users", currentAdminId));
            if(userDoc.exists()) currentAdminData = userDoc.data();

        } catch (error) {
            console.error("Error updating admin profile:", error);
             showToast("Failed to update profile.", "error");
        }
    });

    // Remove picture listener
    adminRemovePictureBtn.addEventListener('click', async () => {
        if (!currentAdminId) return;
        const confirmed = await showConfirmationModal("Are you sure you want to remove your profile picture?");
        if (confirmed) {
            try {
                await updateDoc(doc(db, "users", currentAdminId), { imageUrl: "" });
                const storageRef = ref(storage, `profile_pictures/${currentAdminId}`);
                await deleteObject(storageRef).catch(err => console.warn("Old photo not found, skipping delete.", err));
                adminProfileImg.src = 'https://placehold.co/150x150/D67A84/FFFFFF?text=A';
                   showToast('Profile picture removed.', 'success');
            } catch (error) {
                console.error("Error removing picture:", error);
                   showToast("Failed to remove picture.", "error");
            }
        }
    });

    // 17. Event Listeners for User Management ---
     createUserBtn.addEventListener('click', () => {
        console.log("'Create New User' button clicked. Firing openUserModal()...");
        openUserModal();
    });

    userModalCloseBtn.addEventListener('click', closeUserModal);

    // Event delegation for edit and delete buttons
    usersTableBody.addEventListener('click', async (e) => {
            console.log("A click was detected inside the user table body.");
            e.preventDefault();
            const target = e.target.closest('a');

            console.log("Clicked target element:", target);

            if (!target) {
                console.log("Click was not on a link, ignoring.");
                return;
            }

            const userId = target.dataset.id;
            console.log(`Action link clicked for user ID: ${userId}`);

            if (target.classList.contains('edit-user')) {
                openUserModal(userId);
            }
            // --- MODIFIED ---
            if (target.classList.contains('delete-user')) {
                const confirmed = await showConfirmationModal(`Are you sure you want to delete this user? This action cannot be undone.`);
                if (confirmed) {
                    deleteUser(userId);
                }
            }
        });


    // Handle form submission for both creating and editing
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = userIdInput.value;
        const newProfileImageFile = userPictureUpload.files[0];

        const userData = {
            name: userForm.name.value,
            email: userForm.email.value,
            phone: userForm.phone.value,
            role: userForm.role.value,
        };

        if (userId) {
            try {
                // If a new image was chosen, upload it first
                if (newProfileImageFile) {
                    const storageRef = ref(storage, `profile_pictures/${userId}`);
                    await uploadBytes(storageRef, newProfileImageFile);
                    const downloadURL = await getDownloadURL(storageRef);
                    // Update firestore with new image URL
                    await updateDoc(doc(db, "users", userId), { imageUrl: downloadURL });
                }

                // Update other firestore fields
                await updateDoc(doc(db, "users", userId), {
                    name: userData.name,
                    phone: userData.phone,
                });

                // Update role via Cloud Function
                const setUserRole = httpsCallable(functions, 'setUserRole');
                await setUserRole({ userId: userId, role: userData.role });

                 showToast('User updated successfully!', 'success');
                closeUserModal();
            } catch (error) {
                console.error("Error updating user:", error);
               showToast(`Failed to update user: ${error.message}`, 'error');
            }
        } else {
            // Create new user (requires password)
            const password = userForm.password.value;
            if (password.length < 6) {
                 showToast('Password must be at least 6 characters long.', 'warning');
                return;
            }
            try {
                // Step 1: Call the Cloud Function to create the user in Auth and Firestore
                const createUser = httpsCallable(functions, 'createUserByAdmin');
                const result = await createUser({ ...userData, password: password });
                const newUserId = result.data.userId; // Get the new user's ID back

                // Step 2: If there's an image and a new user ID, upload the image
                if (newProfileImageFile && newUserId) {
                    const storageRef = ref(storage, `profile_pictures/${newUserId}`);
                    await uploadBytes(storageRef, newProfileImageFile);
                    const downloadURL = await getDownloadURL(storageRef);

                    // Step 3: Update the new user's document with the image URL
                    await updateDoc(doc(db, "users", newUserId), { imageUrl: downloadURL });
                }

                showToast('User created successfully!', 'success');
                closeUserModal();
            } catch(error) {
                console.error("Error creating user:", error);
                showToast(`Failed to create user: ${error.message}`, 'error');
            }
        }
        closeUserModal();
    });

    // --- NEW: Add Listeners for Profile Picture ---
    userPictureUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            newProfileImageFile = file;
            const reader = new FileReader();
            reader.onload = (event) => { userModalImg.src = event.target.result; };
            reader.readAsDataURL(file);
        }
    });

    userRemovePictureBtn.addEventListener('click', async () => {
        const userId = userIdInput.value;
        if (!userId) return; 
        const confirmed = await showConfirmationModal("Are you sure you want to remove this user's profile picture?");
        if (confirmed) {
            try {
                await updateDoc(doc(db, "users", userId), { imageUrl: "" });
                const storageRef = ref(storage, `profile_pictures/${userId}`);
                await deleteObject(storageRef).catch(err => console.warn("Old photo not found, skipping delete.", err));
                userModalImg.src = 'https://placehold.co/150x150/D67A84/FFFFFF?text=G';
                showToast('Profile picture removed.', 'success');
            } catch (error) {
                console.error("Error removing picture:", error);
               showToast("Failed to remove picture.", "error");
            }
        }
    });

    // Function to call the deleteUser Cloud Function
    async function deleteUser(userId) {
        try {
            const deleteUserFn = httpsCallable(functions, 'deleteUser');
            await deleteUserFn({ userId: userId });
            showToast('User deleted successfully.', 'success');
        } catch (error) {
            console.error("Error deleting user:", error);
            showToast(`Failed to delete user: ${error.message}`, 'error');
        }
    }

    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1);
        handleNavigation(hash || 'dashboard');
    });
});

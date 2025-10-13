/**
 * This script handles all the interactive logic for the stylist dashboard,
 * including the mobile navigation and switching between content pages.
 */

// Import Firebase functions and your config
import { auth, db, storage } from './firebase-config.js';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp, orderBy, getDocs, FieldValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    // Get all the necessary elements from the page
    const sidebar = document.querySelector('.sidebar');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const contentPages = document.querySelectorAll('.dashboard-page');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const appointmentsContainer = document.getElementById('appointments-container');
    const newBookingsContainer = document.getElementById('new-bookings-container');
    const inventoryContainer = document.getElementById('inventory-container');
    const ordersTableBody = document.getElementById('orders-table-body');
    const profileForm = document.getElementById('profile-form');
    
    const modalOverlay = document.getElementById('booking-modal-overlay');
    const modal = modalOverlay.querySelector('.modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalServiceName = document.getElementById('modal-service-name');
    const modalCustomerName = document.getElementById('modal-customer-name');
    const modalBookingDate = document.getElementById('modal-booking-date');
    const modalBookingTime = document.getElementById('modal-booking-time');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatMessageInput = document.getElementById('chat-message-input');
    const cancelBookingBtn = document.getElementById('cancel-booking-btn');
    const completeBookingBtn = document.getElementById('complete-booking-btn');

    const productModalOverlay = document.getElementById('product-modal-overlay');
    const productModal = productModalOverlay.querySelector('.modal');
    const productModalCloseBtn = document.getElementById('product-modal-close-btn');
    const productModalName = document.getElementById('product-modal-name');
    const productModalImg = document.getElementById('product-modal-img');
    const productModalVariantsTable = document.getElementById('product-modal-variants-table');
    const newBookingsLink = document.querySelector('a[href="#bookings"]');
    const ordersLink = document.querySelector('a[href="#orders"]');

    const profileImg = document.getElementById('profile-img');
    const profilePictureUpload = document.getElementById('profile-picture-upload');
    const removePictureBtn = document.getElementById('remove-picture-btn');

    const ordersContainer = document.getElementById('orders-container');
    const orderDetailsModalOverlay = document.getElementById('order-details-modal-overlay');
    const orderModal = orderDetailsModalOverlay.querySelector('.modal');
    const orderModalCloseBtn = document.getElementById('order-modal-close-btn');
    const orderModalTitle = document.getElementById('order-modal-title');
    const orderModalCustomer = document.getElementById('order-modal-customer');
    const orderModalTotal = document.getElementById('order-modal-total');
    const orderModalItemsList = document.getElementById('order-modal-items-list');
    const orderModalFooter = document.getElementById('order-modal-footer');

    const newTicketBtn = document.getElementById('new-ticket-btn');
    const newTicketModalOverlay = document.getElementById('new-ticket-modal-overlay');
    const newTicketModalCloseBtn = document.getElementById('new-ticket-modal-close-btn');
    const newTicketForm = document.getElementById('new-ticket-form');
    const ticketListContainer = document.getElementById('ticket-list-container');
    const ticketConversationContainer = document.getElementById('ticket-conversation-container');
    const supportChatForm = document.getElementById('support-chat-form');
    const supportChatInput = document.getElementById('support-chat-input');

    let currentStylistId = null;
    let currentUserData = null;
    let currentOpenBookingId = null; // To keep track of which booking is open in the modal
    let unsubscribeChat; // To stop listening for chat messages when the modal closes
    let newProfileImageFile = null; 
    let unsubscribeSupportChat; // --- NEW: For support chat listener
    let currentOpenTicketId = null; // --- NEW: To track the open support ticket

    // --- 1. Hamburger Menu Logic ---
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // --- 2. Dashboard Navigation Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Stop the browser from following the href link
            const targetId = link.getAttribute('href').substring(1);
            handleNavigation(targetId);
        });
    });
    
    // This function will be called when a nav link is clicked
    function handleNavigation(targetId) {
        const targetPage = document.getElementById(`${targetId}-page`);

        // Update the active link style in the sidebar
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        document.querySelector(`.nav-link[href="#${targetId}"]`).classList.add('active');

        // Hide all content pages
        contentPages.forEach(page => page.style.display = 'none');

        // Show only the target page
        if (targetPage) {
            targetPage.style.display = 'block';
        }

        // Update the main header text to match the new page
        updatePageHeader(targetId);

        // Fetch data for the selected page
        if (currentStylistId) {
            switch (targetId) {
                case 'schedule':
                    fetchStylistSchedule(currentStylistId);
                    break;
                case 'bookings':
                    fetchNewBookings(currentStylistId);
                    break;
                case 'inventory':
                    fetchInventory();
                    break;
                case 'orders':
                    fetchProductOrders();
                    break;
                case 'profile':
                    displayUserProfile();
                    break;
                case 'support':
                    fetchSupportTickets(currentStylistId);
                    break;
            }
        }

        // Automatically close the sidebar on mobile after clicking a link
        if (window.innerWidth <= 560) {
            sidebar.classList.remove('open');
        }
    }


    // Helper function to update the title and subtitle in the main content header
    function updatePageHeader(pageId) {
        const titles = {
            schedule: { title: 'My Schedule', subtitle: 'Here are your upcoming appointments.' },
            bookings: { title: 'New Booking Requests', subtitle: 'Review and respond to new appointment requests.' },
            inventory: { title: 'Salon Inventory', subtitle: 'View current stock levels for all products.' },
            orders: { title: 'Product Orders', subtitle: 'Manage and confirm customer product orders.' },
            profile: { title: 'My Profile', subtitle: 'Update your personal details.' },
            support: { title: 'Support Tickets', subtitle: 'View and reply to your support conversations.' }
        };

        if (titles[pageId]) {
            pageTitle.textContent = titles[pageId].title;
            pageSubtitle.textContent = titles[pageId].subtitle;
        }
    }

    // --- Firebase Data Fetching ---

    // 3. Check user's login state
    onAuthStateChanged(auth, async user => {
            if (user) {
                currentStylistId = user.uid;
                // Fetch user data once and store it
                const userDocRef = doc(db, "users", currentStylistId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    currentUserData = userDoc.data();
                    // --- NEW: Also display the user's profile when the page loads ---
                    displayUserProfile(); 
                }
                console.log("Stylist authenticated with UID:", currentStylistId);
                fetchStylistSchedule(currentStylistId); // Load the default page
            } else {
                console.log("No user logged in, redirecting...");
                window.location.href = 'login.html';
            }
        });

    // 4. Function to get the stylist's confirmed appointments
   async function fetchStylistSchedule(stylistId) {
        appointmentsContainer.innerHTML = '<p>Loading schedule...</p>';
        const q = query(collection(db, "bookings"), where("stylistId", "==", stylistId), where("status", "==", "Confirmed"));
        
        onSnapshot(q, async (querySnapshot) => {
            if (querySnapshot.empty) {
                appointmentsContainer.innerHTML = '<p>You have no confirmed appointments.</p>';
                return;
            }

            let cardsHtml = '';
            for (const docSnap of querySnapshot.docs) {
                const booking = docSnap.data();
                const hairstyleDoc = await getDoc(doc(db, "hairstyles", booking.hairstyleId));
                const imageUrl = hairstyleDoc.exists() ? hairstyleDoc.data().imageUrl : 'https://placehold.co/600x400/F4DCD6/333333?text=No+Image';

                cardsHtml += `
                    <div class="booking-card confirmed" data-booking-id="${docSnap.id}">
                        <img src="${imageUrl}" alt="${booking.serviceName}">
                        <div class="card-content">
                            <h3>${booking.serviceName}</h3>
                            <p><strong>Customer:</strong> ${booking.customerName}</p>
                            <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
                        </div>
                        <div class="card-footer">
                            <span class="status-confirmed">Confirmed</span>
                        </div>
                    </div>
                `;
            }
            appointmentsContainer.innerHTML = cardsHtml;
        });
    }

    // 5. Function to get new booking requests for the stylist
   async function fetchNewBookings(stylistId) {
        newBookingsContainer.innerHTML = '<p>Loading new requests...</p>';
        const q = query(collection(db, "bookings"), where("status", "==", "Pending"));

        onSnapshot(q, async (querySnapshot) => {
            let hasPendingBookings = false;

            console.log(`Found ${querySnapshot.size} pending booking(s) in total. Checking each one...`);

            const promises = querySnapshot.docs.map(async (bookingDoc) => {
               
                const booking = { ...bookingDoc.data(), id: bookingDoc.id };
                
                const hairstyleDocRef = doc(db, "hairstyles", booking.hairstyleId);
                const hairstyleDoc = await getDoc(hairstyleDocRef);

                let shouldDisplay = false;
                if (hairstyleDoc.exists() && currentUserData) {
                    const hairstyle = hairstyleDoc.data();
                    const isStylistQualified = hairstyle.availableStylistIds && hairstyle.availableStylistIds.includes(stylistId);

                    const isForAnyAvailable = booking.stylistName === "Any Available" && isStylistQualified;
                    const isDirectlyAssigned = booking.stylistId === stylistId || booking.stylistName === currentUserData.name;

                    if (isForAnyAvailable || isDirectlyAssigned) {
                        shouldDisplay = true;
                    }
                }

                if (shouldDisplay) {
                    hasPendingBookings = true;
                    const imageUrl = hairstyleDoc.data().imageUrl || 'https://placehold.co/600x400/F4DCD6/333333?text=No+Image';
                    return `
                        <div class="booking-card pending" data-booking-id="${booking.id}">
                            <img src="${imageUrl}" alt="${booking.serviceName}">
                            <div class="card-content">
                                <h3>${booking.serviceName}</h3>
                                <p><strong>Customer:</strong> ${booking.customerName}</p>
                                <p><strong>Date:</strong> ${booking.date} at ${booking.time}</p>
                            </div>
                            <div class="card-actions">
                                <button class="action-btn accept" data-id="${booking.id}">Accept</button>
                                <button class="action-btn decline" data-id="${booking.id}">Decline</button>
                            </div>
                        </div>
                    `;
                }
                return null;
            });

            const resolvedCards = await Promise.all(promises);
            const cardsHtml = resolvedCards.filter(card => card !== null).join('');

            if (hasPendingBookings) {
                newBookingsContainer.innerHTML = cardsHtml;
            } else {
                newBookingsContainer.innerHTML = '<p>No new booking requests for you.</p>';
            }

            // --- NEW: Notification Dot Logic ---
            const notificationDot = newBookingsLink.querySelector('.notification-dot');
            if (hasPendingBookings) {
                if (!notificationDot) { // Create dot if it doesn't exist
                    const dot = document.createElement('span');
                    dot.className = 'notification-dot';
                    newBookingsLink.appendChild(dot);
                }
                newBookingsLink.querySelector('.notification-dot').style.display = 'block';
                newBookingsContainer.innerHTML = cardsHtml;
            } else {
                 if (notificationDot) {
                    notificationDot.style.display = 'none';
                }
                newBookingsContainer.innerHTML = '<p>No new booking requests for you.</p>';
            }
        });
    }

    // 6. Function to get all products for inventory view
    async function fetchInventory() {
        inventoryContainer.innerHTML = '<p>Loading inventory...</p>';
        const q = query(collection(db, "products"));
        
        onSnapshot(q, (querySnapshot) => {
            let html = '';
            if (querySnapshot.empty) {
                html = '<p>No products found in inventory.</p>';
            } else {
                querySnapshot.forEach(doc => {
                    const product = doc.data();
                    html += `
                        <div class="product-card" data-product-id="${doc.id}">
                            <img src="${product.imageUrl || 'https://placehold.co/600x400/F4DCD6/333333?text=No+Image'}" alt="${product.name}">
                            <div class="card-content">
                                <h3>${product.name}</h3>
                                <p>${product.variants ? product.variants.length : 0} size(s) available</p>
                            </div>
                        </div>
                    `;
                });
            }
            inventoryContainer.innerHTML = html;
        });
    }

    // 7. Function to fetch product orders
    async function fetchProductOrders() {
            ordersContainer.innerHTML = '<p>Loading active orders...</p>';
            const q = query(collection(db, "product_orders"), where("status", "in", ["Pending Pickup", "Ready for Pickup"]));

            onSnapshot(q, (querySnapshot) => {
                let html = '';
                if (querySnapshot.empty) {
                    html = '<p>No active orders found.</p>';
                } else {
                    querySnapshot.forEach(doc => {
                        const order = doc.data();
                        let statusClass = order.status === 'Pending Pickup' ? 'status-pending' : 'status-ready';
                        
                        // Generate stacked images HTML
                        let imagesHtml = '';
                        if (order.items && order.items.length > 0) {
                            // Show up to 3 images
                            order.items.slice(0, 3).forEach(item => {
                                imagesHtml += `<img src="${item.imageUrl}" alt="${item.name}">`;
                            });
                        }

                        html += `
                            <div class="order-card" data-order-id="${doc.id}">
                                <div class="order-card-images">${imagesHtml}</div>
                                <div class="card-content">
                                    <h3>Order #${doc.id.slice(-6)}</h3>
                                    <p><strong>Customer:</strong> ${order.customerName}</p>
                                </div>
                                <div class="card-footer">
                                    <span class="status-badge ${statusClass}">${order.status}</span>
                                </div>
                            </div>
                        `;
                    });
                }
                ordersContainer.innerHTML = html;

                // --- Notification Dot Logic for Orders ---
                let notificationDot = ordersLink.querySelector('.notification-dot');
                if (!querySnapshot.empty) { // If there are pending orders
                    if (!notificationDot) {
                        notificationDot = document.createElement('span');
                        notificationDot.className = 'notification-dot';
                        ordersLink.appendChild(notificationDot);
                    }
                    notificationDot.style.display = 'block';
                } else { // If there are no pending orders
                    if (notificationDot) {
                        notificationDot.style.display = 'none';
                    }
                }
            });
        }
    
    // 8. Function to display user profile data
    function displayUserProfile() {
        if(currentUserData) {
            profileForm.name.value = currentUserData.name || '';
            profileForm.email.value = currentUserData.email || '';
            profileForm.phone.value = currentUserData.phone || '';
            profileImg.src = currentUserData.imageUrl || 'https://placehold.co/150x150/D67A84/FFFFFF?text=G';
        }
    }

    // 9. All functions for the support ticket system ---

    // Fetches the list of tickets for the current stylist
    function fetchSupportTickets(stylistId) {
        ticketListContainer.innerHTML = '<p>Loading tickets...</p>';
        const q = query(collection(db, "support_messages"), where("senderUid", "==", stylistId), orderBy("timestamp", "desc"));

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
                ticketsHtml += `
                    <div class="ticket-item ${activeClass}" data-ticket-id="${doc.id}" data-ticket-status="${ticket.status}">
                        <p>${ticket.message}</p>
                        <span class="status-badge ${statusClass}">${ticket.status}</span>
                    </div>
                `;
            });
            ticketListContainer.innerHTML = ticketsHtml;
        });
    }

    // Opens a conversation when a ticket is clicked from the list
    function openSupportConversation(ticketId, status) {
        currentOpenTicketId = ticketId;
        // Re-fetch tickets to highlight the active one
        fetchSupportTickets(currentStylistId); 

        supportChatForm.style.display = 'flex';
        ticketConversationContainer.innerHTML = '<p>Loading conversation...</p>';

        // Disable chat form if the ticket is closed
        if (status === 'Closed') {
            supportChatForm.setAttribute('disabled', true);
            supportChatInput.placeholder = 'This ticket is closed.';
        } else {
            supportChatForm.removeAttribute('disabled');
            supportChatInput.placeholder = 'Type your reply...';
        }

        // Unsubscribe from any previous chat listener
        if (unsubscribeSupportChat) unsubscribeSupportChat();

        // Listen for new messages
        const repliesRef = collection(db, "support_messages", ticketId, "replies");
        const q = query(repliesRef, orderBy("timestamp"));
        unsubscribeSupportChat = onSnapshot(q, (snapshot) => {

            const docs = snapshot.docs;

            // 1. Check if the LAST message is from someone else (i.e., the admin)
            if (docs.length > 0) {
                const lastMessage = docs[docs.length - 1].data();
                if (lastMessage.senderUid !== currentStylistId) {
                    // 2. If it is, we tell Firestore to update our old messages.
                    markPreviousMessagesAsRead(ticketId);
                }
            }

              // 3. We build the HTML with the data we have RIGHT NOW.
            let messagesHtml = '';
            docs.forEach(doc => {
                const message = doc.data();
                const bubbleClass = message.senderUid === currentStylistId ? 'stylist' : 'customer';
                
                let statusTicks = '';
                if (bubbleClass === 'stylist') {
                    statusTicks = getStatusTicks(message.status || 'SENT'); 
                }

                messagesHtml += `
                    <div class="chat-bubble ${bubbleClass}">
                        <span class="message-text">${message.messageText}</span>
                        ${statusTicks}
                    </div>
                `;
            });
            ticketConversationContainer.innerHTML = messagesHtml;
            ticketConversationContainer.scrollTop = ticketConversationContainer.scrollHeight;
        });
    }

    // Handle clicks within the ticket list to open conversations
    ticketListContainer.addEventListener('click', (e) => {
        const ticketItem = e.target.closest('.ticket-item');
        if (ticketItem) {
            const ticketId = ticketItem.dataset.ticketId;
            const ticketStatus = ticketItem.dataset.ticketStatus;
            openSupportConversation(ticketId, ticketStatus);
        }
    });
    
    // Handle sending a reply in an open support ticket
    supportChatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = supportChatInput.value.trim();
        if (message === '' || !currentOpenTicketId) return;

        const repliesRef = collection(db, "support_messages", currentOpenTicketId, "replies");
        try {
            await addDoc(repliesRef, {
                messageText: message,
                senderUid: currentStylistId,
                senderName: currentUserData.name,
                status: "SENT",
                timestamp: serverTimestamp()
            });
            supportChatInput.value = '';
        } catch (error) {
            console.error("Error sending support reply:", error);
            alert("Failed to send reply.");
        }
    });

    async function markPreviousMessagesAsRead(ticketId) {
        const repliesRef = collection(db, "support_messages", ticketId, "replies");
        const q = query(repliesRef, where("senderUid", "==", currentStylistId), where("status", "!=", "Read"));
        
        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(docSnap => {
                const messageRef = doc(db, "support_messages", ticketId, "replies", docSnap.id);
                updateDoc(messageRef, { status: "Read" });
            });
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    }

    // --- New Ticket Modal Logic ---
     function openNewTicketModal() {
        newTicketModalOverlay.style.display = 'flex';
        setTimeout(() => {
            newTicketModalOverlay.style.opacity = '1';
        }, 10);
    }
    function closeNewTicketModal() {
        newTicketModalOverlay.style.opacity = '0';
        setTimeout(() => {
            newTicketModalOverlay.style.display = 'none';
            newTicketForm.reset();
        }, 200);
    }

    newTicketBtn.addEventListener('click', openNewTicketModal);
    newTicketModalCloseBtn.addEventListener('click', closeNewTicketModal);

    newTicketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = newTicketForm.message.value.trim();
        if (message === '' || !currentUserData) return;

        try {
            await addDoc(collection(db, "support_messages"), {
                message: message,
                senderUid: currentStylistId,
                senderName: currentUserData.name,
                senderEmail: currentUserData.email,
                status: "New",
                timestamp: serverTimestamp(),
                // Initialize the participants array with the creator's ID
                participantUids: [currentStylistId]
            });
            alert('Support ticket sent successfully!');
            closeNewTicketModal();
        } catch (error) {
            console.error("Error creating new ticket:", error);
            alert("Failed to send ticket.");
        }
    });
    
    // --- Event Delegation for Actions ---
    document.getElementById('content-area').addEventListener('click', async (e) => {
        const target = e.target;

        // --- NEW: Handle opening the order details modal ---
        const orderCard = target.closest('.order-card');
        if (orderCard) {
            const orderId = orderCard.dataset.orderId;
            openOrderModal(orderId);
            return;
        }

        // 1. Check if a product card was clicked
        const productCard = target.closest('.product-card');
        if (productCard) {
            const productId = productCard.dataset.productId;
            openProductModal(productId);
            return; // Action handled, stop here.
        }

        // 2. Check if a confirmed booking card was clicked (to open the details modal)
        const bookingCard = target.closest('.booking-card.confirmed');
        if (bookingCard) {
            const bookingId = bookingCard.dataset.bookingId;
            openBookingModal(bookingId);
            return; // Action handled, stop here.
        }

        // 3. Check if an action button inside a booking card was clicked
        if (target.matches('.action-btn')) {
            const bookingId = target.dataset.id; // Used for service bookings
            const orderId = target.dataset.id; // Used for product orders

            if (!bookingId) return; // Button must have a booking ID

             if (target.matches('.accept') && !target.matches('.mark-ready') && !target.matches('.mark-collected')) {
                if (confirm('Are you sure you want to accept this booking?')) {
                    const bookingRef = doc(db, "bookings", bookingId);
                    try {
                        await updateDoc(bookingRef, {
                            status: "Confirmed",
                            stylistId: currentStylistId,
                            stylistName: currentUserData.name
                        });
                        alert('Booking accepted and added to your schedule!');
                    } catch (error) {
                        console.error("Error accepting booking: ", error);
                        alert("Failed to accept booking. Please try again.");
                    }
                }
            }

            if (target.matches('.action-btn.decline')) {
            // 1. Ask the stylist for a reason using a prompt.
            const reason = prompt("Please provide a reason for declining this booking:");

            // 2. Only proceed if the stylist entered a reason.
            if (reason) { 
                const bookingRef = doc(db, "bookings", bookingId);
                try {
                    // 3. Update the booking with the new status and the reason.
                    await updateDoc(bookingRef, {
                        status: "Declined",
                        cancellationReason: reason
                    });
                    alert('Booking declined.');
                } catch (error) {
                    console.error("Error declining booking: ", error);
                    alert("Failed to decline booking. Please try again.");
                }
            }
            // If the user clicks "Cancel" on the prompt, nothing happens.
        }

            /*
            if (target.matches('.mark-ready')) {
                if (confirm('Mark this order as "Ready for Pickup"?')) {
                    const orderRef = doc(db, "product_orders", orderId);
                    await updateDoc(orderRef, { status: "Ready for Pickup" });
                    alert("Order status updated!");
                }
            }
            if (target.matches('.mark-collected')) {
                if (confirm('Mark this order as "Completed"?')) {
                    const orderRef = doc(db, "product_orders", orderId);
                    await updateDoc(orderRef, { status: "Completed" });
                    alert("Order marked as complete!");
                }
            }
                */
        }
    });

    // --- NEW: Product Modal Functions ---

    async function openProductModal(productId) {
        productModalOverlay.style.display = 'flex';
        setTimeout(() => {
             productModalOverlay.style.opacity = '1';
             productModal.style.transform = 'scale(1)';
        }, 10);

        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
            const product = productSnap.data();
            productModalName.textContent = product.name;
            productModalImg.src = product.imageUrl || 'https://placehold.co/600x400/F4DCD6/333333?text=No+Image';

            let variantsHtml = '';
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(variant => {
                    variantsHtml += `
                        <tr>
                            <td>${variant.size || 'N/A'}</td>
                            <td>R${variant.price ? variant.price.toFixed(2) : 'N/A'}</td>
                            <td>${variant.stock} units</td>
                        </tr>
                    `;
                });
            } else {
                variantsHtml = '<tr><td colspan="3">No variants found for this product.</td></tr>';
            }
            productModalVariantsTable.innerHTML = variantsHtml;
        }
    }

    function closeProductModal() {
        productModalOverlay.style.opacity = '0';
        productModal.style.transform = 'scale(0.95)';
        setTimeout(() => {
            productModalOverlay.style.display = 'none';
        }, 200);
    }

    productModalCloseBtn.addEventListener('click', closeProductModal);

    // --- NEW: Functions for the Order Details Modal ---
    async function openOrderModal(orderId) {
        orderDetailsModalOverlay.style.display = 'flex';
        setTimeout(() => {
             orderDetailsModalOverlay.style.opacity = '1';
             orderModal.style.transform = 'scale(1)';
        }, 10);
        
        const orderRef = doc(db, "product_orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            const order = orderSnap.data();
            orderModalTitle.textContent = `Order Details #${orderId.slice(-6)}`;
            orderModalCustomer.textContent = order.customerName;
            orderModalTotal.textContent = `R${order.totalPrice.toFixed(2)}`;

            // Build the list of items
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

            // Build the action buttons based on status
            let footerHtml = '';
            if (order.status === 'Pending Pickup') {
                footerHtml = `<button class="action-btn accept" data-id="${orderId}" id="modal-mark-ready">Mark as Ready</button>`;
            } else if (order.status === 'Ready for Pickup') {
                footerHtml = `<button class="action-btn accept" data-id="${orderId}" id="modal-mark-collected">Mark as Collected & Complete</button>`;
            }
            orderModalFooter.innerHTML = footerHtml;
        }
    }

    function closeOrderModal() {
        orderDetailsModalOverlay.style.opacity = '0';
        orderModal.style.transform = 'scale(0.95)';
        setTimeout(() => {
            orderDetailsModalOverlay.style.display = 'none';
        }, 200);
    }

    orderModalCloseBtn.addEventListener('click', closeOrderModal);

    // Add a new event listener for the order modal footer
    orderModalFooter.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.matches('.action-btn')) {
            const orderId = target.dataset.id;
            const orderRef = doc(db, "product_orders", orderId);

            if (target.id === 'modal-mark-ready') {
                await updateDoc(orderRef, { status: "Ready for Pickup" });
                alert("Order status updated!");
                closeOrderModal();
            }

            if (target.id === 'modal-mark-collected') {
                await updateDoc(orderRef, { status: "Completed" });
                alert("Order marked as complete!");
                closeOrderModal();
            }
        }
    });

    // --- NEW: Function to update stylist's messages to "Read" in booking chat ---
    async function markBookingMessagesAsRead(bookingId) {
        const repliesRef = collection(db, "bookings", bookingId, "messages");
        const q = query(repliesRef, where("senderUid", "==", currentStylistId), where("status", "!=", "Read"));
        
        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(docSnap => {
                const messageRef = doc(db, "bookings", bookingId, "messages", docSnap.id);
                updateDoc(messageRef, { status: "Read" });
            });
        } catch (error) {
            console.error("Error marking booking messages as read:", error);
        }
    }

    // --- NEW: Modal and Chat Functions ---

    async function openBookingModal(bookingId) {
        currentOpenBookingId = bookingId;
        modalOverlay.style.display = 'flex';
        setTimeout(() => { // Allow display change to render before animating
             modalOverlay.style.opacity = '1';
             modal.style.transform = 'scale(1)';
        }, 10);

        // Fetch booking details
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (bookingSnap.exists()) {
            const booking = bookingSnap.data();
            modalServiceName.textContent = booking.serviceName;
            modalCustomerName.textContent = booking.customerName;
            modalBookingDate.textContent = booking.date;
            modalBookingTime.textContent = booking.time;
        }

        // Listen for chat messages in real-time
        const messagesRef = collection(db, "bookings", bookingId, "messages");
        const q = query(messagesRef, orderBy("timestamp"));

         unsubscribeChat = onSnapshot(q, (snapshot) => {
            // --- NEW: Auto-read logic for booking chat ---
            const docs = snapshot.docs;
            if (docs.length > 0) {
                const lastMessage = docs[docs.length - 1].data();
                if (lastMessage.senderUid !== currentStylistId) {
                    markBookingMessagesAsRead(bookingId);
                }
            }
            
            let messagesHtml = '';
            docs.forEach(doc => {
                const message = doc.data();
                const bubbleClass = message.senderUid === currentStylistId ? 'stylist' : 'customer';
                
                // --- FIX: Add sender name and formatted timestamp ---
                let statusTicks = '';
                if (bubbleClass === 'stylist') {
                    statusTicks = getStatusTicks(message.status || 'SENT');
                }

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
            chatMessagesContainer.innerHTML = messagesHtml;
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
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

    // --- NEW: Helper function to create status tick icons ---
    function getStatusTicks(status) {
        let ticksHtml = '';
        switch (status) {
            case 'SENT':
                ticksHtml = '<span class="ticks"><i class="fas fa-check"></i></span>';
                break;
            case 'DELIVERED': // This status can be implemented later
                ticksHtml = '<span class="ticks"><i class="fas fa-check-double"></i></span>';
                break;
            case 'READ':
                ticksHtml = '<span class="ticks read"><i class="fas fa-check-double"></i></span>';
                break;
            default:
                ticksHtml = ''; // No ticks if status is unknown
        }
        return ticksHtml;
    }

    function closeBookingModal() {
        if (unsubscribeChat) {
            unsubscribeChat(); // Stop listening to the chat to save resources
        }
        modalOverlay.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 200); // Wait for animation to finish
    }

    modalCloseBtn.addEventListener('click', closeBookingModal);

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = chatMessageInput.value.trim();
        if (messageText === '' || !currentOpenBookingId) return;

        const messagesRef = collection(db, "bookings", currentOpenBookingId, "messages");
        try {
            await addDoc(messagesRef, {
                bookingId: currentOpenBookingId,
                messageText: messageText,
                senderName: currentUserData.name,
                senderUid: currentStylistId,
                status: "SENT", // This matches your app's structure for read receipts later
                timestamp: serverTimestamp()
            });
            chatMessageInput.value = ''; // Clear the input
        } catch (error) {
            console.error("Error sending message: ", error);
            alert("Could not send message.");
        }
    });

    completeBookingBtn.addEventListener('click', async () => {
        if (!currentOpenBookingId) return;
        if (confirm('Are you sure you want to mark this booking as complete?')) {
            const bookingRef = doc(db, "bookings", currentOpenBookingId);
            await updateDoc(bookingRef, { status: 'Completed' });
            alert('Booking marked as complete!');
            closeBookingModal();
        }
    });

    cancelBookingBtn.addEventListener('click', async () => {
        if (!currentOpenBookingId) return;
        const reason = prompt("Please provide a reason for cancellation:");
        if (reason) { // Only proceed if the user provides a reason
            const bookingRef = doc(db, "bookings", currentOpenBookingId);
            await updateDoc(bookingRef, {
                status: 'Cancelled',
                cancellationReason: reason // Storing the reason in Firestore
            });
            alert('Booking has been cancelled.');
            closeBookingModal();
        }
    });

    
    // --- NEW: Profile Picture and Form Logic ---
    
    // Create an instant preview when a new image is selected
    profilePictureUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            newProfileImageFile = file; // Store the file for uploading later
            const reader = new FileReader();
            reader.onload = (event) => {
                profileImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle the "Save Changes" button click
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentStylistId) return;

        const newName = profileForm.name.value.trim();
        const newPhone = profileForm.phone.value.trim();

         if (newName.length < 2) {
            alert('Please enter a valid name (at least 2 characters).');
            return; // Stop the function if validation fails
        }
        
        // Simple South African phone number validation (e.g., starts with 0, 10 digits total)
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(newPhone)) {
            alert('Please enter a valid 10-digit South African phone number (e.g., 0821234567).');
            return; // Stop the function if validation fails
        }

        const userDocRef = doc(db, "users", currentStylistId);

        try {
            // If there's a new image file, upload it first
            if (newProfileImageFile) {
                const storageRef = ref(storage, `profile_pictures/${currentStylistId}`);
                await uploadBytes(storageRef, newProfileImageFile);
                const downloadURL = await getDownloadURL(storageRef);
                
                // Now update Firestore with the new image URL along with other data
                await updateDoc(userDocRef, {
                    name: newName,
                    phone: newPhone,
                    imageUrl: downloadURL
                });
                newProfileImageFile = null; // Reset after upload
            } else {
                // Otherwise, just update the name and phone
                await updateDoc(userDocRef, {
                    name: newName,
                    phone: newPhone
                });
            }
            alert('Profile updated successfully!');
            // You might want to refetch the user data here to keep currentUserData fresh
        } catch (error) {
            console.error("Error updating profile: ", error);
            alert("Failed to update profile. Please try again.");
        }
    });

    // Handle removing the profile picture
    removePictureBtn.addEventListener('click', async () => {
        if (!currentStylistId) return;
        if (confirm("Are you sure you want to remove your profile picture?")) {
            const userDocRef = doc(db, "users", currentStylistId);
            try {
                // Set the imageUrl field to empty in Firestore
                await updateDoc(userDocRef, { imageUrl: "" });
                
                // Optionally, delete the image from Storage to save space
                const storageRef = ref(storage, `profile_pictures/${currentStylistId}`);
                await deleteObject(storageRef).catch(error => {
                    // It's okay if it fails (e.g., file didn't exist), so we don't alert the user
                    console.warn("Could not delete old photo from storage, it might not exist.", error);
                });
                
                profileImg.src = 'https://placehold.co/150x150/D67A84/FFFFFF?text=G'; // Reset to placeholder
                alert('Profile picture removed.');
            } catch (error) {
                console.error("Error removing profile picture: ", error);
                alert("Failed to remove picture. Please try again.");
            }
        }
    });
});
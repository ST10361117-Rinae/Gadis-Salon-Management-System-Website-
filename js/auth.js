// Import necessary functions from Firebase and our config file
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

// Get the login form element from login.html
const loginForm = document.getElementById('loginForm');

// Add an event listener for when the form is submitted
loginForm.addEventListener('submit', async (event) => {
    // Prevent the default form submission (which reloads the page)
    event.preventDefault();

    // Get the email and password values from the form inputs
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
        // 1. Sign in the user with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User logged in successfully:", user.uid);

        // 2. Get the user's role from Firestore
        // We assume you have a 'users' collection where the document ID is the user's UID
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role; // Assumes you have a 'role' field in your user document

            console.log("User role is:", role);
            
            // 3. Redirect user based on their role
            switch (role) {
                case 'ADMIN':
                    window.location.href = '/admin-dashboard.html'; // Create this page
                    break;
                case 'WORKER':
                    window.location.href = '/stylist-dashboard.html'; // Create this page
                    break;
                case 'CUSTOMER':
                    window.location.href = '/index.html'; // Or a customer profile page
                    break;
                default:
                    // If role is not defined, redirect to a generic home page
                    window.location.href = '/index.html';
            }
        } else {
            // This case is unlikely if the user exists in Auth, but good practice to handle
            console.error("No user document found in Firestore!");
            alert("Login successful, but could not find user details.");
            window.location.href = '/index.html';
        }

    } catch (error) {
        // Handle login errors (e.g., wrong password, user not found)
        console.error("Login failed:", error.message);
        alert("Login failed: " + error.message);
    }
});
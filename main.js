// Import functions from Firebase and our config file
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { auth } from './firebase-config.js';

// Get references to the navbar links
const loginLink = document.getElementById('login-link');
const profileLink = document.getElementById('profile-link');
const logoutButton = document.getElementById('logout-button');

/**
 * This is a listener that runs whenever the user's login state changes.
 * It's the perfect place to update the UI.
 */
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log("User is logged in:", user.uid);
        loginLink.style.display = 'none';       // Hide Login link
        profileLink.style.display = 'block';    // Show Profile link
        logoutButton.style.display = 'block';   // Show Logout button
    } else {
        // User is signed out
        console.log("User is logged out.");
        loginLink.style.display = 'block';      // Show Login link
        profileLink.style.display = 'none';     // Hide Profile link
        logoutButton.style.display = 'none';    // Hide Logout button
    }
});

/**
 * Handles the click event for the logout button.
 */
logoutButton.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    
    signOut(auth).then(() => {
        // Sign-out successful.
        console.log("Sign-out successful.");
        // Redirect to the homepage after logout
        window.location.href = '/index.html';
    }).catch((error) => {
        // An error happened.
        console.error("Sign-out error:", error);
        alert("Error logging out. Please try again.");
    });
});
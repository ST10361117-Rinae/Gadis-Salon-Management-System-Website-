// Import necessary functions from Firebase and our config file
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

const loginForm = document.getElementById('loginForm');
const errorMsgElement = document.getElementById('login-error-msg');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;
    const button = loginForm.querySelector('button');

    // Reset error message and disable button
    errorMsgElement.textContent = '';
    errorMsgElement.style.display = 'none';
    button.disabled = true;
    button.textContent = 'Logging in...';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("User logged in successfully:", user.uid);

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // Set a flag in sessionStorage to trigger the welcome animation on the homepage
            sessionStorage.setItem('justLoggedIn', 'true');
            
            const userData = userDoc.data();
            const role = userData.role;

            console.log("User role is:", role);
            
            // Redirect user based on their role
            switch (role) {
                case 'ADMIN':
                    window.location.href = '/admin-dashboard.html';
                    break;
                case 'WORKER':
                    window.location.href = '/stylist-dashboard.html';
                    break;
                default:
                    window.location.href = '/index.html';
            }
        } else {
            console.error("No user document found in Firestore!");
            errorMsgElement.textContent = "Login successful, but could not find user details.";
            errorMsgElement.style.display = 'block';
            // Redirect to home anyway as a fallback
            setTimeout(() => window.location.href = '/index.html', 2000);
        }

    } catch (error) {
        console.error("Login failed:", error.message);
        // Provide user-friendly error messages
        let message = "An unknown error occurred.";
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                message = "Invalid email or password. Please try again.";
                break;
            case 'auth/too-many-requests':
                message = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
                break;
        }
        errorMsgElement.textContent = message;
        errorMsgElement.style.display = 'block';
    } finally {
        // Re-enable the button
        button.disabled = false;
        button.textContent = 'Login';
    }
});

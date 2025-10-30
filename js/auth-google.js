import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

const googleLoginButton = document.getElementById('google-login-button');
const googleRegisterButton = document.getElementById('google-register-button');

/**
 * Handles the Google Sign-In popup flow.
 */
const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    
    // Get the error message elements (check which page we're on)
    const errorMsgElement = document.getElementById('login-error-msg') || document.getElementById('register-error-msg');
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Show loading state on button
        if (googleLoginButton) googleLoginButton.textContent = 'Verifying...';
        if (googleRegisterButton) googleRegisterButton.textContent = 'Verifying...';

        // User is signed in, now check their Firestore document
        await handleGoogleSignInResult(user);

    } catch (error) {
        console.error("Google Sign-In Error:", error);
        let message = "An error occurred during Google Sign-In.";
        if (error.code === 'auth/popup-closed-by-user') {
            message = "Sign-in cancelled. Please try again.";
        }
        if (errorMsgElement) {
            errorMsgElement.textContent = message;
            errorMsgElement.style.display = 'block';
        }
    }
};

/**
 * Checks Firestore for the user, creates a profile if new, and redirects.
 * @param {User} user - The user object from Firebase Auth.
 */
const handleGoogleSignInResult = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    let role = "CUSTOMER"; // Default role for new users

    if (!userDoc.exists()) {
        // --- This is a NEW user ---
        console.log("New Google user. Creating profile in Firestore.");
        try {
            await setDoc(userDocRef, {
                id: user.uid,
                name: user.displayName || "Gadis User",
                email: user.email,
                phone: user.phoneNumber || "",
                imageUrl: user.photoURL || "",
                role: "CUSTOMER"
            });
            console.log("New user profile created.");
        } catch (error) {
            console.error("Error creating new user document:", error);
            // Handle error (e.g., show error message)
            return;
        }
    } else {
        // --- This is a RETURNING user ---
        console.log("Returning Google user. Checking role.");
        role = userDoc.data().role || "CUSTOMER";
    }

    // Set flag for welcome animation on homepage
    sessionStorage.setItem('justLoggedIn', 'true');
    
    // Redirect based on role
    console.log("User role is:", role, ". Redirecting...");
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
};

// Attach listeners if the buttons exist on the current page
if (googleLoginButton) {
    googleLoginButton.addEventListener('click', signInWithGoogle);
}
if (googleRegisterButton) {
    googleRegisterButton.addEventListener('click', signInWithGoogle);
}

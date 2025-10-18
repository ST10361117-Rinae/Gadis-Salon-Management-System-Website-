import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const registerForm = document.getElementById('registerForm');
const errorMsgElement = document.getElementById('register-error-msg');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = registerForm.name.value;
    const email = registerForm.email.value;
    const phone = registerForm.phone.value;
    const password = registerForm.password.value;
    const confirmPassword = registerForm.querySelector('#confirm-password').value;
    const button = registerForm.querySelector('button');

    // Reset error message
    errorMsgElement.textContent = '';
    errorMsgElement.style.display = 'none';

    // --- VALIDATION ---
    if (password !== confirmPassword) {
        errorMsgElement.textContent = "Passwords do not match.";
        errorMsgElement.style.display = 'block';
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        errorMsgElement.textContent = "Please enter a valid 10-digit phone number (e.g., 0812345678).";
        errorMsgElement.style.display = 'block';
        return;
    }
    
    // Disable button during process
    button.disabled = true;
    button.textContent = 'Registering...';

    try {
        // Step 1: Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Update the user's profile in Auth to include their name
        await updateProfile(user, { displayName: name });

        // Step 3: Create a user document in Firestore
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            id: user.uid,
            name: name,
            email: email,
            phone: phone,
            imageUrl: "",
            role: "CUSTOMER" // All new sign-ups are customers
        });

        // Set flag for welcome animation on homepage
        sessionStorage.setItem('justLoggedIn', 'true');

        window.location.href = "index.html"; // Redirect to the homepage

    } catch (error) {
        console.error("Error during registration:", error);
        let message = "An unknown error occurred during registration.";
         if (error.code === 'auth/email-already-in-use') {
            message = "This email address is already in use by another account.";
        }
        errorMsgElement.textContent = message;
        errorMsgElement.style.display = 'block';
    } finally {
        button.disabled = false;
        button.textContent = 'Register';
    }
});

import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = registerForm.name.value;
    const email = registerForm.email.value;
    const phone = registerForm.phone.value;
    const password = registerForm.password.value;
    const confirmPassword = registerForm.confirmPassword.value;

    // --- VALIDATION ---
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit phone number (e.g., 0812345678).");
        return;
    }

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

        alert("Registration successful! You are now logged in.");
        window.location.href = "index.html"; // Redirect to the homepage

    } catch (error) {
        console.error("Error during registration:", error);
        alert(`Registration failed: ${error.message}`);
    }
});


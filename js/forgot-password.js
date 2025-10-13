import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { auth } from "./firebase-config.js";

const forgotPasswordForm = document.getElementById('forgotPasswordForm');

forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotPasswordForm.email.value;

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset link sent! Please check your email inbox (and spam folder).");
        forgotPasswordForm.reset();
    } catch (error) {
        console.error("Error sending password reset email:", error);
        alert(`Failed to send reset link: ${error.message}`);
    }
});


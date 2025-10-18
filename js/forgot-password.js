import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { auth } from "./firebase-config.js";

const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const successMsg = document.getElementById('success-msg');
const errorMsg = document.getElementById('error-msg');

forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotPasswordForm.email.value;
    const button = forgotPasswordForm.querySelector('button');

    // Reset messages and disable button
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    button.disabled = true;
    button.textContent = 'Sending...';

    try {
        await sendPasswordResetEmail(auth, email);
        successMsg.textContent = "Password reset link sent! Please check your email inbox (and spam folder).";
        successMsg.style.display = 'block';
        forgotPasswordForm.reset();
    } catch (error) {
        console.error("Error sending password reset email:", error);
        let message = "Failed to send reset link. Please try again.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            message = "No account found with that email address.";
        }
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    } finally {
        button.disabled = false;
        button.textContent = 'Send Reset Link';
    }
});

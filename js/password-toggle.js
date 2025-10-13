document.addEventListener('DOMContentLoaded', () => {
    // Find all the password toggle icons on the page
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            // Find the password input field next to the icon
            const passwordInput = icon.previousElementSibling;

            // Toggle the input type between 'password' and 'text'
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle the icon's class to switch between the 'eye' and 'eye-slash' icon
            icon.classList.toggle('fa-eye-slash');
        });
    });
});


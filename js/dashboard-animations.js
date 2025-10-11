/**
 * This script is for adding simple animations to the dashboard pages.
 * It's kept separate to keep things organized.
 */
document.addEventListener('DOMContentLoaded', () => {
    // You can add more complex animations here in the future if needed.
    // For now, the CSS animations handle everything automatically!
    
    // We can add a class to the body to scope dashboard-specific styles
    if (document.querySelector('.dashboard-container')) {
        document.body.classList.add('dashboard-body');
    }
});

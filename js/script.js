document.addEventListener('DOMContentLoaded', () => {

    // --- Intersection Observer for Fade-In Animations ---
    
    // Select all elements that have the 'fade-in-up' class
    const animatedElements = document.querySelectorAll('.fade-in-up');

    // Create an observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // If the element is in view, add the 'show' class to trigger the animation
                entry.target.classList.add('show');
                // Optional: Stop observing the element once it has animated in
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    // Start observing each of the animated elements
    animatedElements.forEach(el => {
        observer.observe(el);
    });

});

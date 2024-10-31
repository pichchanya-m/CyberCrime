//check element
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

//select all cards
const cards = document.querySelectorAll('.card');

window.addEventListener('scroll', () => {
    cards.forEach(card => {
        if (isInViewport(card)) {
            card.classList.add('enlarged');
        } else {
            card.classList.remove('enlarged');
        }
    });
});



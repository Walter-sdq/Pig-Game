'use strict';

// Select Elements
const modalBtn = document.querySelector('.show-modal');
const modal = document.querySelector('.modal');
const overlay = document.querySelector('.modal-overlay');
const closeModalBtn = document.querySelector('.close-modal-btn');


// Functions
// Open Molal
const openModal = function () {
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
};

// Close Modal
const closeModal = function () {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}


// Event Listeners
// Open Modal On Click
modalBtn.addEventListener('click', openModal);

// Close Modal On Click
closeModalBtn.addEventListener('click', closeModal)

// Close Modal On Overlay click
overlay.addEventListener('click', closeModal)

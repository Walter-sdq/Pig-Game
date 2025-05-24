"use strict";

// Select Elements
const modalBtn = document.querySelector(".show-modal");
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".modal-overlay");
const closeModalBtn = document.querySelector(".close-modal-btn");
const load = document.querySelector("#anim");

// Functions
// Open Molal
const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  modalBtn.classList.add("noAnim");
};

// Close Modal
const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};

// load animation
const loadAnim = () => {
  load.classList.remove("hidden");
  overlay.classList.remove("hidden");
  setTimeout(() => {
    load.classList.add("hidden");
    overlay.classList.add("hidden");
  }, 3000);
};



// Event Listeners
// Open Modal On Click
modalBtn.addEventListener("click", openModal);

// Close Modal On Click
closeModalBtn.addEventListener("click", closeModal);

// Close Modal On Overlay click
overlay.addEventListener("click", closeModal);

// load animation on window load
document.addEventListener("load", loadAnim());


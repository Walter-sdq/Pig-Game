'use strict';
const draggableBtn = document.querySelector("#draggable-btn");

// Variables to track initial position
let isDragging = false;
let offsetX;
let offsetY;

// Mouse down event to start dragging
document.addEventListener('mousedown', (e) => {
    isDragging = true;

    // check #1_Explanation 
    offsetX = e.clientX - draggableBtn.offsetLeft;
    offsetY = e.clientY - draggableBtn.offsetTop;
});


// Mouse move event to drag the button
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        draggableBtn.style.left = `${e.clientX - offsetX}px`;
        draggableBtn.style.top = `${e.clientY - offsetY}px`;
    };
});

// Mouse up event to stop dragging
document.addEventListener('mouseup', () => {
    isDragging = false;
});


// #1_Explanation
// e.clientX: This is the X-coordinate (horizontal position) of the mouse pointer in the browser window when the mousedown event occurs.

// draggableBtn.offsetLeft: This is the distance between the left edge of the draggableBtn element and the left edge of its offset parent (usually its closest positioned ancestor or the document body). It essentially tells you how far the button is from the left side of the screen.

// e.clientX - draggableBtn.offsetLeft: This calculation finds the difference between the mouse pointer’s X position and the button’s X position on the page when the mousedown event is triggered. This difference, stored in offSetX, represents how far the mouse pointer is from the left edge of the button.

// Purpose
// offSetX is used to keep track of the initial position of the mouse pointer relative to the button. When dragging, this offset helps maintain the button’s original position relative to the mouse cursor, preventing it from "jumping" to the cursor position as the user drags it around.
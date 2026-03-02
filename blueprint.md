# Project Blueprint: Korean Lotto Number Generator

## Overview

This project is a simple web application that generates and displays a set of 6 random numbers for the Korean Lotto 6/45.

## Features

*   **Number Generation:** Generates 6 unique random numbers between 1 and 45.
*   **Color-Coded Display:** Displays numbers with their official lottery color ranges:
    *   1-10: Yellow
    *   11-20: Blue
    *   21-30: Red
    *   31-40: Gray
    *   41-45: Green
*   **Theme Management:** Includes a Dark/Light mode toggle that persists in local storage.
*   **Partnership Inquiry Form:** A simple contact form powered by Formspree to receive business inquiries and suggestions.
*   **Responsive Design:** Optimized for both desktop and mobile viewing.

## Design

*   **Layout:** A clean, centered layout with a title, a button, and a display area for the numbers.
*   **Styling:** Modern and visually appealing design with CSS variables, smooth transitions, and hover effects.
*   **Interactivity:** Smooth button interactions and hover scaling on lotto numbers.

## Implemented Features

1.  **`index.html` Update:** Added a theme toggle button and structured the layout for responsiveness.
2.  **`style.css` Refactor:** Implemented CSS variables and dark mode styles for easier maintenance.
3.  **`main.js` Core Logic:** 
    *   Added `generateLottoNumbers` to provide sorted, unique numbers.
    *   Implemented `setTheme` and `localStorage` integration for persistent theme selection.
    *   Created dynamic number range styling in `displayNumbers`.
4.  **Code Quality:** Added detailed comments to all files for clarity and maintainability.

## Current Plan

1.  **Deployment:** Push the latest features (Dark Mode & Color Coding) to the GitHub repository.


# Project Blueprint: Korean Lotto Number Generator

## Overview

This project is a simple web application that generates and displays a set of 6 random numbers for the Korean Lotto 6/45.

## Features

*   **Number Generation:** Generates 6 unique random numbers between 1 and 45.
*   **Display:** Displays the generated numbers in a clear and visually appealing way.
*   **User Interaction:** A button allows the user to generate a new set of numbers at any time.

## Design

*   **Layout:** A clean, centered layout with a title, a button, and a display area for the numbers.
*   **Styling:** Modern and visually appealing design with custom fonts, colors, and animations.
*   **Responsiveness:** The layout will be responsive and work well on both desktop and mobile devices.

## Current Plan

1.  **Modify `index.html`:**
    *   Update the title to "Korean Lotto Number Generator".
    *   Add a main container for the application.
    *   Add a title heading.
    *   Add a placeholder for the generated lotto numbers.
    *   Add a button to trigger the number generation.
2.  **Modify `style.css`:**
    *   Add styles for the overall layout, typography, button, and the number display area.
    *   Incorporate a modern color palette and animations.
3.  **Modify `main.js`:**
    *   Implement the `generateLottoNumbers` function to create an array of 6 unique random numbers from 1 to 45.
    *   Add an event listener to the "Generate" button.
    *   When the button is clicked, call the `generateLottoNumbers` function and update the content of the number display area.

# Test Plan: AI-Powered Portfolio

This document outlines the test plan for the AI-Powered Portfolio website.

## 1. Navigation

- **1.1. Verify that the "About" link scrolls to the "About Me" section.**
  - **Steps:**
    1. Click on the "About" link in the header.
  - **Expected Result:** The page should scroll to the "About Me" section.

- **1.2. Verify that the "Projects" link scrolls to the "Projects" section.**
  - **Steps:**
    1. Click on the "Projects" link in the header.
  - **Expected Result:** The page should scroll to the "Projects" section.

- **1.3. Verify that the "Contact" button opens the contact form (or scrolls to it).**
  - **Steps:**
    1. Click on the "Contact" button in the header.
  - **Expected Result:** The contact form should be displayed.

## 2. Theme Toggle

- **2.1. Verify that the theme toggle button exists.**
  - **Steps:**
    1. Check for the presence of the theme toggle button in the header.
  - **Expected Result:** The theme toggle button should be visible.

- **2.2. Verify that clicking the theme toggle button changes the theme of the page.**
  - **Steps:**
    1. Click on the theme toggle button.
  - **Expected Result:** The page theme should switch between light and dark mode.

## 3. About Me Section

- **3.1. Verify that the "About Me" section is visible.**
  - **Steps:**
    1. Scroll to the "About Me" section.
  - **Expected Result:** The "About Me" section with text and a profile photo should be visible.

- **3.2. Verify that the social media links (GitHub, LinkedIn) are present and correct.**
  - **Steps:**
    1. Check for the presence of GitHub and LinkedIn links in the "About Me" section.
    2. Click on each link.
  - **Expected Result:** The links should open the correct social media profiles in a new tab.

## 4. Projects Section

- **4.1. Verify that the project cards are loaded and displayed.**
  - **Steps:**
    1. Scroll to the "Projects" section.
  - **Expected Result:** A list of project cards should be displayed.

## 5. Resume Section

- **5.1. Verify that the resume is loaded and displayed.**
  - **Steps:**
    1. Scroll to the "My Resume" section.
  - **Expected Result:** The resume should be loaded and displayed, or a link to download it should be available.

## 6. Chatbot

- **6.1. Verify that the chatbot FAB (Floating Action Button) is visible.**
  - **Steps:**
    1. Check for the presence of the chatbot FAB on the page.
  - **Expected Result:** The chatbot FAB should be visible on the bottom right corner of the page.

- **6.2. Verify that clicking the FAB opens the chatbot window.**
  - **Steps:**
    1. Click on the chatbot FAB.
  - **Expected Result:** The chatbot window should open.

- **6.3. Verify that a user can send a message and receive a response.**
  - **Steps:**
    1. Open the chatbot window.
    2. Type a message in the input field and send it.
  - **Expected Result:** The user's message should appear in the chat window, followed by a response from the bot.

- **6.4. Verify that the chatbot can respond to questions about projects.**
  - **Steps:**
    1. Open the chatbot window.
    2. Ask a question about a specific project.
  - **Expected Result:** The chatbot should provide a relevant response about the project.

- **6.5. Verify that the chatbot can display the contact form.**
  - **Steps:**
    1. Open the chatbot window.
    2. Type "contact me" or a similar phrase.
  - **Expected Result:** The chatbot should display a contact form.

- **6.6. Verify that the chatbot handles invalid or malicious input gracefully (guardrails).**
  - **Steps:**
    1. Open the chatbot window.
    2. Enter a malicious string (e.g., a script tag).
  - **Expected Result:** The chatbot should not execute the script and should respond with a message indicating that it cannot process the request.

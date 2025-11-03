/**
 * accessibility.ts
 * This file provides helper functions for enhancing accessibility in the frontend,
 * including setting ARIA attributes, managing focus traps, and handling keyboard events.
 */

/**
 * Sets an ARIA live region for dynamic content updates.
 * @param element The HTMLElement to designate as an ARIA live region.
 * @param politeness The politeness level ('polite' or 'assertive').
 */
export function setAriaLiveRegion(element: HTMLElement, politeness: 'polite' | 'assertive' = 'polite'): void {
  element.setAttribute('aria-live', politeness);
  element.setAttribute('aria-atomic', 'true'); // Announce the entire region as a whole
}

/**
 * Manages focus within a modal or dialog to trap it, preventing users from tabbing outside.
 * @param element The container element (e.g., modal).
 * @returns A function to call to deactivate the focus trap.
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      if (event.shiftKey) { // If Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          event.preventDefault();
        }
      } else { // If Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          event.preventDefault();
        }
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus(); // Focus the first element when trap is activated

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Helper to add common keyboard event handlers (e.g., for closing modals with Escape).
 * @param element The element to attach the listener to.
 * @param keyHandlers An object mapping key codes to handler functions.
 * @returns A function to call to remove the event listener.
 */
export function addKeyboardHandlers(element: HTMLElement, keyHandlers: { [key: string]: (event: KeyboardEvent) => void }): () => void {
  function handleKeyDown(event: KeyboardEvent) {
    if (keyHandlers[event.key]) {
      keyHandlers[event.key](event);
    }
  }

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

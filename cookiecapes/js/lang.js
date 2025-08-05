/**
 * =================================================================
 * CookieCapes Translation System
 * =================================================================
 * 
 * This script handles the entire language logic for the website.
 *
 * Features:
 * 1. Loads translation strings from external JSON files (`/lang/en.json`, `/lang/de.json`).
 * 2. Automatically detects the user's language via cookie or browser settings, with English as a fallback.
 * 3. Manages the language switcher dropdown in the footer.
 * 4. Provides two global functions for use in other scripts:
 *    - `window.translateElement(element)`: Translates a single DOM element that has a `data-translate-key`.
 *    - `window.getTranslation(key, options)`: Fetches a translated string and replaces placeholders (e.g., for "Page 1 of 10").
 */

// Global variable to hold the currently loaded translation data.
// This makes translations accessible to our global functions.
let currentTranslations = {};

// --- 1. HELPER FUNCTIONS ---

/**
 * Sets a cookie on the user's browser.
 * @param {string} name The name of the cookie.
 * @param {string} value The value of the cookie.
 * @param {number} days The number of days until the cookie expires.
 */
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

/**
 * Gets a cookie by its name.
 * @param {string} name The name of the cookie to retrieve.
 * @returns {string|null} The cookie value or null if not found.
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// --- 2. CORE TRANSLATION LOGIC ---

/**
 * Fetches the translation JSON file for a given language.
 * @param {string} lang The language code (e.g., 'en', 'de').
 * @returns {Promise<Object>} A promise that resolves with the translation object.
 */
async function fetchTranslations(lang) {
    try {
        const response = await fetch(`lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load translation file for '${lang}'. Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch translations error:", error);
        throw error; // Rethrow the error to be handled by the caller
    }
}

/**
 * Applies translations to all elements with a `data-translate-key` attribute.
 * @param {Object} translations The translation object with key-value pairs.
 * @param {Document|Element} rootElement The element to search within (defaults to the whole document).
 */
function applyTranslations(translations, rootElement = document) {
    rootElement.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.getAttribute('data-translate-key');
        const translation = translations[key];

        if (translation !== undefined) {
            const attribute = element.getAttribute('data-translate-attr');
            if (attribute) {
                // Translate a specific attribute (e.g., placeholder, title)
                element.setAttribute(attribute, translation);
            } else {
                // Translate the inner HTML content
                element.innerHTML = translation;
            }
        } else {
            // This warning is very helpful during development to find missing keys
            console.warn(`Translation key not found in JSON file: '${key}'`);
        }
    });
}

// --- 3. GLOBAL ACCESS FUNCTIONS (THE API FOR OTHER SCRIPTS) ---

/**
 * Translates a single DOM element using the currently loaded translations.
 * This is useful for dynamically added content.
 * @param {Element} element The DOM element to translate. It must have a `data-translate-key`.
 */
function translateElement(element) {
    if (!element || !element.getAttribute('data-translate-key')) return;

    const key = element.getAttribute('data-translate-key');
    const translation = currentTranslations[key];

    if (translation !== undefined) {
        const attribute = element.getAttribute('data-translate-attr');
        if (attribute) {
            element.setAttribute(attribute, translation);
        } else {
            element.innerHTML = translation;
        }
    }
}
// Attach to the window object to make it globally accessible as `window.translateElement()`
window.translateElement = translateElement;

/**
 * Gets a translated string by its key and replaces placeholders.
 * @param {string} key The translation key from the JSON file.
 * @param {Object} [options] An object with values for placeholders. E.g., { currentPage: 5, totalPages: 10 }
 * @returns {string} The translated and formatted string.
 */
function getTranslation(key, options = {}) {
    let translation = currentTranslations[key];

    if (translation === undefined) {
        console.warn(`Translation key not found: '${key}'`);
        return key; // Return the key as a fallback
    }

    // Replace each placeholder (e.g., {{variable}}) with its value from the options object
    for (const placeholder in options) {
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        translation = translation.replace(regex, options[placeholder]);
    }

    return translation;
}
// Attach to the window object to make it globally accessible as `window.getTranslation()`
window.getTranslation = getTranslation;


// --- 4. INITIALIZATION ---

/**
 * Main function that runs once the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const languageSelect = document.getElementById('languageSelect');
    const defaultLang = 'en';
    let currentLang;

    // 1. Determine the language to use
    const savedLang = getCookie('language');
    if (savedLang && ['en', 'de'].includes(savedLang)) {
        currentLang = savedLang; // Use language from cookie
    } else {
        const browserLang = navigator.language || navigator.userLanguage;
        currentLang = browserLang.startsWith('de') ? 'de' : 'en'; // Use browser language
    }

    // 2. Load and apply the translations
    try {
        currentTranslations = await fetchTranslations(currentLang);
    } catch (error) {
        console.warn(`Could not load '${currentLang}' translations, falling back to '${defaultLang}'.`);
        currentLang = defaultLang;
        currentTranslations = await fetchTranslations(currentLang);
    }
    
    applyTranslations(currentTranslations);

    // 3. Update the page's lang attribute and the language selector dropdown
    document.documentElement.lang = currentLang;
    if (languageSelect) {
        languageSelect.value = currentLang;
    }

    // 4. Add event listener for the language switcher
    if (languageSelect) {
        languageSelect.addEventListener('change', async (event) => {
            const newLang = event.target.value;
            try {
                // Fetch new translations, apply them, and save the choice
                currentTranslations = await fetchTranslations(newLang);
                applyTranslations(currentTranslations);
                document.documentElement.lang = newLang;
                setCookie('language', newLang, 365); // Save choice for one year
            } catch (error) {
                console.error(`Failed to switch language to '${newLang}'.`, error);
                languageSelect.value = getCookie('language') || defaultLang; // Revert dropdown
            }
        });
    }
});
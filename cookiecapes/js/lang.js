let currentTranslations = {};

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

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
async function fetchTranslations(lang) {
    try {
        const response = await fetch(`lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load translation file for '${lang}'. Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch translations error:", error);
        throw error;
    }
}

function applyTranslations(translations, rootElement = document) {
    rootElement.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.getAttribute('data-translate-key');
        const translation = translations[key];
        if (translation !== undefined) {
            const attribute = element.getAttribute('data-translate-attr');
            if (attribute) {
                element.setAttribute(attribute, translation);
            } else {
                element.innerHTML = translation;
            }
        } else {
            console.warn(`Translation key not found in JSON file: '${key}'`);
        }
    });
}

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
window.translateElement = translateElement;

function getTranslation(key, options = {}) {
    let translation = currentTranslations[key];
    if (translation === undefined) {
        console.warn(`Translation key not found: '${key}'`);
        return key;
    }
    for (const placeholder in options) {
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        translation = translation.replace(regex, options[placeholder]);
    }
    return translation;
}
window.getTranslation = getTranslation;
document.addEventListener('DOMContentLoaded', async () => {
    const languageSelect = document.getElementById('languageSelect');
    const defaultLang = 'en';
    let currentLang;
    const savedLang = getCookie('language');
    if (savedLang && ['en', 'de'].includes(savedLang)) {
        currentLang = savedLang;
    } else {
        const browserLang = navigator.language || navigator.userLanguage;
        currentLang = browserLang.startsWith('de') ? 'de' : 'en';
    }
    try {
        currentTranslations = await fetchTranslations(currentLang);
    } catch (error) {
        console.warn(`Could not load '${currentLang}' translations, falling back to '${defaultLang}'.`);
        currentLang = defaultLang;
        currentTranslations = await fetchTranslations(currentLang);
    }
    applyTranslations(currentTranslations);
    document.documentElement.lang = currentLang;
    if (languageSelect) {
        languageSelect.value = currentLang;
    }
    if (languageSelect) {
        languageSelect.addEventListener('change', async (event) => {
            const newLang = event.target.value;
            try {
                currentTranslations = await fetchTranslations(newLang);
                applyTranslations(currentTranslations);
                document.documentElement.lang = newLang;
                setCookie('language', newLang, 100);
            } catch (error) {
                console.error(`Failed to switch language to '${newLang}'.`, error);
                languageSelect.value = getCookie('language') || defaultLang;
            }
        });
    }
});
function initializeGeneralScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (!animatedElements.length) return;

    const observerOptions = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1 
    };

    const animationObserver = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observerInstance.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        animationObserver.observe(el);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initializeGeneralScrollAnimations();

    window.addEventListener("scroll", () => {
        const header = document.querySelector("header");
        if (header) {
            header.classList.toggle("floating", window.scrollY > 50);
        }
    });

    if (document.querySelector('.improved-hero')) { 
        typeHeroTitle();
    }
    
    const emojiUploadSection = document.getElementById('emojiUploadSection');
    if (emojiUploadSection) {
        const emojiUploadForm = document.getElementById('emojiUploadForm');
        const formContainer = document.getElementById('multiStepForm');
        const navigationContainer = document.getElementById('stepNavigation');
        const successMessageContainer = document.getElementById('successMessage');
        const limitMessageContainer = document.getElementById('limitMessage');
        const wizardContainer = emojiUploadSection.querySelector('.step-wizard-container');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        const progressBar = document.getElementById('progressBar');
        const stepTitle = document.getElementById('stepTitle');
        const editBtn = document.getElementById('editBtn');
        const minecraftNameInput = document.getElementById('minecraftName');
        const rulesAgreeCheckbox = document.getElementById('rulesAgreeCheckbox');
        const emojiNameInput = document.getElementById('emojiName');
        const emojiUploadInput = document.getElementById('emojiUploadInput');
        const emojiFileNameDisplay = document.getElementById('emojiFileName');
        const previewMinecraftName = document.getElementById('previewMinecraftName');
        const previewEmojiName = document.getElementById('previewEmojiName');
        const minecraftNameFeedback = document.getElementById('minecraftNameFeedback');
        const rulesAgreeFeedback = document.getElementById('rulesAgreeFeedback');
        const emojiNameFeedback = document.getElementById('emojiNameFeedback');
        const emojiFileFeedback = document.getElementById('emojiFileFeedback');
        const nameCheckLoader = document.getElementById('nameCheckLoader');
        const previewCanvas = document.getElementById("emoji_preview_canvas");

        let currentStep = 1;
        let lastUpdatedStepForTitle = 0;
        const totalSteps = 5;
        const formData = {
            minecraftName: '',
            emojiName: '',
            emojiFile: null,
            nameValidated: false,
            rulesAgreed: false
        };

        const uploadCookie = getCookie("emojiUploadedToday");
        if (uploadCookie) {
            if(emojiUploadForm) emojiUploadForm.style.display = 'none';
            if(limitMessageContainer) limitMessageContainer.style.display = 'block';
            if(wizardContainer) wizardContainer.classList.add('limit-reached');
            if(navigationContainer) navigationContainer.style.display = 'none';
            if(stepTitle) stepTitle.style.display = 'none';
            if(progressBar) progressBar.parentElement.style.display = 'none';
            return;
        } else {
           if (limitMessageContainer) limitMessageContainer.style.display = 'none';
        }
        
        updateButtons();

        function updateButtons() {
            if (!prevBtn || !nextBtn || !submitBtn || !rulesAgreeCheckbox) return;

            prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
            nextBtn.style.display = currentStep < totalSteps ? 'inline-block' : 'none';
            submitBtn.style.display = currentStep === totalSteps ? 'inline-block' : 'none';

            let nextDisabled = false;
            if (currentStep === 1 && !formData.nameValidated) {
                nextDisabled = true;
            } else if (currentStep === 2 && !rulesAgreeCheckbox.checked) {
                nextDisabled = true;
            } else if (currentStep === 3 && emojiNameInput.value.trim().length === 0) {
                nextDisabled = true;
            } else if (currentStep === 4 && !formData.emojiFile) {
                nextDisabled = true;
            }

            nextBtn.disabled = nextDisabled;

            updateProgressBar();
            updateStepTitle();
        }

        function updateProgressBar() {
            if (!progressBar) return;
            const progress = totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0;
            progressBar.style.width = `${progress}%`;
        }

        function updateStepTitle() {
            if (!stepTitle || lastUpdatedStepForTitle === currentStep) return;
            lastUpdatedStepForTitle = currentStep;

            const titles = [
                "Step 1: Your Minecraft Name",
                "Step 2: Agree to Rules",
                "Step 3: Name Your Emoji",
                "Step 4: Upload Your Image",
                "Step 5: Preview & Submit"
            ];
            const newTitle = titles[currentStep - 1] || "Step 1: Your Minecraft Name";

            stepTitle.style.opacity = 0;
            setTimeout(() => {
                stepTitle.textContent = newTitle;
                stepTitle.style.opacity = 1;
            }, 300);
        }

        function showStep(stepNumber) {
            if (stepNumber < 1 || stepNumber > totalSteps) return;

            const currentActive = formContainer.querySelector('.form-step.active');
            if (currentActive) {
                currentActive.classList.add('exiting');
                currentActive.classList.remove('active');
            }

            setTimeout(() => {
                if (currentActive) currentActive.classList.remove('exiting');
                const nextStep = document.getElementById(`step-${stepNumber}`);
                if (nextStep) {
                    nextStep.classList.add('active');
                    currentStep = stepNumber;
                    updateButtons();
                    if (currentStep === totalSteps) {
                        updatePreview();
                    }
                }
            }, currentActive ? 300 : 0);
        }

        async function checkMinecraftName(name) {
            formData.nameValidated = false;
            updateButtons();
            if (!name || !/^[a-zA-Z0-9_]{3,16}$/.test(name)) {
                minecraftNameFeedback.textContent = 'Invalid name format.';
                minecraftNameFeedback.className = 'input-feedback';
                if (nameCheckLoader) nameCheckLoader.style.display = 'none';
                return;
            }
            minecraftNameFeedback.textContent = 'Checking name...';
            minecraftNameFeedback.className = 'input-feedback checking';
            if (nameCheckLoader) nameCheckLoader.style.display = 'inline-block';

            const apiUrl = `https://mineskin.eu/skin/${name}`;
            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    minecraftNameFeedback.textContent = 'Name is valid!';
                    minecraftNameFeedback.className = 'input-feedback success';
                    formData.minecraftName = name;
                    formData.nameValidated = true;
                } else {
                    minecraftNameFeedback.textContent = 'Name not found.';
                    minecraftNameFeedback.className = 'input-feedback';
                }
            } catch (error) {
                minecraftNameFeedback.textContent = 'Network error during name check.';
                minecraftNameFeedback.className = 'input-feedback';
            } finally {
                if (nameCheckLoader) nameCheckLoader.style.display = 'none';
                updateButtons();
            }
        }
        const debouncedCheckMinecraftName = debounce(checkMinecraftName, 500);

        function validateStep(step) {
            let isValid = true;
            clearFeedback();

            if (step === 1) {
                if (!formData.nameValidated) {
                    minecraftNameFeedback.textContent = 'Please enter and validate a Minecraft name.';
                    isValid = false;
                }
            } else if (step === 2) {
                if (!rulesAgreeCheckbox.checked) {
                    rulesAgreeFeedback.textContent = 'You must agree to the rules.';
                    isValid = false;
                }
            } else if (step === 3) {
                if (emojiNameInput.value.trim().length === 0) {
                    emojiNameFeedback.textContent = 'Emoji name cannot be empty.';
                    isValid = false;
                }
            } else if (step === 4) {
                if (!formData.emojiFile) {
                    emojiFileFeedback.textContent = 'Please upload an emoji file.';
                    isValid = false;
                }
            }
            return isValid;
        }

        function clearFeedback() {
            if (minecraftNameFeedback && !minecraftNameFeedback.textContent.includes('valid')) minecraftNameFeedback.textContent = '';
            if (rulesAgreeFeedback) rulesAgreeFeedback.textContent = '';
            if (emojiNameFeedback) emojiNameFeedback.textContent = '';
            if (emojiFileFeedback) emojiFileFeedback.textContent = '';
        }

        function updatePreview() {
            if (!previewMinecraftName || !previewEmojiName || !previewCanvas) return;
            previewMinecraftName.textContent = formData.minecraftName || 'Not specified';
            previewEmojiName.textContent = formData.emojiName || 'Not specified';

            if (formData.emojiFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewCanvas.src = e.target.result;
                }
                reader.readAsDataURL(formData.emojiFile);
            } else {
                previewCanvas.src = '';
            }
        }

        if (minecraftNameInput) {
            minecraftNameInput.addEventListener('input', () => {
                const name = minecraftNameInput.value.trim();
                formData.nameValidated = false;
                updateButtons();
                if (name.length >= 3) {
                    debouncedCheckMinecraftName(name);
                }
            });
        }

        if (rulesAgreeCheckbox) {
            rulesAgreeCheckbox.addEventListener('change', () => {
                formData.rulesAgreed = rulesAgreeCheckbox.checked;
                if(rulesAgreeCheckbox.checked) rulesAgreeFeedback.textContent = '';
                updateButtons();
            });
        }

        if (emojiNameInput) {
            emojiNameInput.addEventListener('input', () => {
                formData.emojiName = emojiNameInput.value.trim();
                if(formData.emojiName) emojiNameFeedback.textContent = '';
                updateButtons();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (validateStep(currentStep)) {
                    showStep(currentStep + 1);
                }
            });
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentStep > 1) {
                    showStep(currentStep - 1);
                }
            });
        }
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                showStep(1);
            });
        }

        if (emojiUploadInput) {
            emojiUploadInput.addEventListener("change", function(event) {
                const file = event.target.files[0];
                if (file) {
                    if (file.type !== "image/png") {
                        emojiFileFeedback.textContent = "Only PNG files are allowed.";
                        formData.emojiFile = null;
                    } else if (file.size > 1 * 1024 * 1024) {
                        emojiFileFeedback.textContent = "File is too large. Max 1MB.";
                        formData.emojiFile = null;
                    } else {
                        formData.emojiFile = file;
                        emojiFileNameDisplay.textContent = `File: ${file.name}`;
                        emojiFileFeedback.textContent = '';
                    }
                } else {
                    formData.emojiFile = null;
                }
                updateButtons();
            });
        }

        if (emojiUploadForm) {
            emojiUploadForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                for (let i = 1; i < totalSteps; i++) {
                    if (!validateStep(i)) {
                        alert("Bitte füllen Sie alle vorherigen Schritte korrekt aus.");
                        showStep(i);
                        return;
                    }
                }

                submitBtn.disabled = true;
                submitBtn.textContent = "Uploading...";

                const data = new FormData();
                data.append('minecraft_name', formData.minecraftName);
                data.append('emoji_name', formData.emojiName);
                data.append('emoji_file', formData.emojiFile);

                const apiUrl = `https://cloudcookieapi.leonmt12345.workers.dev/web_add_emoji`;

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        body: data
                    });

                    let result = {};
                    try {
                        result = await response.json();
                    } catch (e) {
                        if (!response.ok) {
                           result = { detail: `Server error: ${response.status}` };
                        }
                    }

                    if (response.ok) {
                        setCookie("emojiUploadedToday", "true", 1);
                        formContainer.style.display = 'none';
                        navigationContainer.style.display = 'none';
                        successMessageContainer.innerHTML = `<h2>Upload Successful!</h2><p>Your emoji has been uploaded successfully.</p>`;
                        successMessageContainer.style.display = 'block';
                        stepTitle.textContent = "Finished";
                        progressBar.style.width = '100%';
                    } else {
                        const errorDetail = result.detail || `Error ${response.status}`;
                        if (response.status === 469) {
                            alert(`Upload rejected: ${errorDetail}`);
                        } else {
                            alert(`Upload failed: ${errorDetail}`);
                        }
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Submit";
                    }
                } catch (error) {
                    console.error("Upload Network Error:", error);
                    alert(`A network error occurred: ${error.message}`);
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit";
                }
            });
        }
    }
});


function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setHours(23, 59, 59, 999);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function typeHeroTitle() {
    const heroTitle = document.querySelector('.improved-hero h1');
    if (!heroTitle) return;
    const originalText = heroTitle.textContent.trim(); 
    heroTitle.textContent = '';
    heroTitle.classList.add('typing'); 
    let i = 0;

    function typeChar() {
        if (i < originalText.length) {
            heroTitle.textContent += originalText.charAt(i);
            i++;
            setTimeout(typeChar, 80); 
        } else {
            heroTitle.classList.remove('typing'); 
            animateHeroFeatures(); 
        }
    }
    if (document.querySelector('.improved-hero')) { 
        setTimeout(typeChar, 300);
    }
}

function animateHeroFeatures() {
    const features = document.querySelectorAll('.hero-features .feature-item');
    if (!features.length) return;

    features.forEach((feature, index) => {
        setTimeout(() => {
            feature.classList.add('visible');
        }, index * 150); 
    });
}
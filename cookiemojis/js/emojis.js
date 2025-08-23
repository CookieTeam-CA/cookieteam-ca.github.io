document.addEventListener('DOMContentLoaded', function () {
    const emojiContainer = document.getElementById('emojiContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const paginationControls = document.getElementById('paginationControls');
    const emojiSearchInput = document.getElementById('emojiSearchInput');
    const emojiSortBy = document.getElementById('emojiSortBy');
    const emojiSortOrder = document.getElementById('emojiSortOrder');
    const modal = document.getElementById('emojiModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const modalOverlay = document.querySelector('.modal-overlay');

    let currentPage = 1;
    const limit = 15;
    let currentSortBy = 'last_edited';
    let currentSortOrder = 'desc';
    let currentSearchTerm = '';
    let totalEmojis = 0;
    let debounceTimer;

    async function fetchEmojis(page = 1, sortBy = 'last_edited', order = 'desc', searchTerm = '') {
        currentPage = page;
        loadingIndicator.style.display = 'block';
        emojiContainer.style.display = 'none';
        const offset = (page - 1) * limit;
        
        const apiUrl = `https://api.cookieattack.de:8989/list_emojis_sorted`;
        
        const body = {
            limit: limit,
            offset: offset,
            sort_by: sortBy,
            order: order
        };

        if (searchTerm) {
            body.search = searchTerm;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            totalEmojis = data.total_count;
            displayEmojis(data.emojis);
            setupPagination(totalEmojis, page);
        } catch (error) {
            console.error('Failed to fetch emojis:', error);
            loadingIndicator.innerHTML = '<span style="color: var(--text-color-error);">Failed to load emojis. Please try again later.</span>';
        } finally {
            if (emojiContainer.style.display !== 'none') {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    function displayEmojis(emojis) {
        emojiContainer.innerHTML = '';
        if (emojis.length === 0) {
            emojiContainer.innerHTML = `<p style="text-align: center; color: var(--text-color-dim); grid-column: 1 / -1;">No emojis found.</p>`;
            emojiContainer.style.display = 'block';
            loadingIndicator.style.display = 'none';
            return;
        }
        emojis.forEach(emoji => {
            const emojiCard = document.createElement('div');
            emojiCard.className = 'cape-card'; // Re-using cape-card style
            emojiCard.dataset.emojiId = emoji.emoji_id;

            emojiCard.innerHTML = `
                <div class="cape-card-image-container">
                    <img src="${emoji.emoji_image_url}" alt="${emoji.emoji_name}" class="emoji-image" loading="lazy">
                </div>
                <div class="cape-card-info">
                    <h3>${emoji.emoji_name}</h3>
                    <p class="cape-uploader" data-translate-key="from">von ${emoji.minecraft_name}</p>
                </div>
            `;
            
            emojiCard.addEventListener('click', () => showModal(emoji));
            emojiContainer.appendChild(emojiCard);
        });
        emojiContainer.style.display = 'grid';
        loadingIndicator.style.display = 'none';
    }

    function setupPagination(totalItems, page) {
        paginationControls.innerHTML = '';
        const totalPages = Math.ceil(totalItems / limit);

        if (totalPages <= 1) return;

        const createButton = (text, newPage, isDisabled = false, isCurrent = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.disabled = isDisabled;
            if (isCurrent) {
                button.classList.add('current-page');
            }
            button.addEventListener('click', () => {
                fetchEmojis(newPage, currentSortBy, currentSortOrder, currentSearchTerm);
                window.scrollTo(0, 0);
            });
            return button;
        };

        // Previous Button
        paginationControls.appendChild(createButton('«', page - 1, page === 1));

        // Page numbers
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, page + 2);

        if (page <= 3) {
            endPage = Math.min(5, totalPages);
        }
        if (page > totalPages - 3) {
            startPage = Math.max(1, totalPages - 4);
        }

        if (startPage > 1) {
            paginationControls.appendChild(createButton('1', 1));
            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                paginationControls.appendChild(dots);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationControls.appendChild(createButton(i, i, false, i === page));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                paginationControls.appendChild(dots);
            }
            paginationControls.appendChild(createButton(totalPages, totalPages));
        }

        // Next Button
        paginationControls.appendChild(createButton('»', page + 1, page === totalPages));
    }
    
    function showModal(emoji) {
        document.getElementById('modalEmojiName').textContent = emoji.emoji_name;
        document.getElementById('modalEmojiId').textContent = emoji.emoji_id;
        document.getElementById('modalUploaderName').textContent = emoji.minecraft_name;
        const lastEdited = new Date(emoji.last_edited).toLocaleString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        document.getElementById('modalLastEdited').textContent = lastEdited;
        document.getElementById('modalEmojiImage').src = emoji.emoji_image_url;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    emojiSearchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentSearchTerm = emojiSearchInput.value.trim();
            fetchEmojis(1, currentSortBy, currentSortOrder, currentSearchTerm);
        }, 300);
    });

    emojiSortBy.addEventListener('change', () => {
        currentSortBy = emojiSortBy.value;
        fetchEmojis(1, currentSortBy, currentSortOrder, currentSearchTerm);
    });

    emojiSortOrder.addEventListener('change', () => {
        currentSortOrder = emojiSortOrder.value;
        fetchEmojis(1, currentSortBy, currentSortOrder, currentSearchTerm);
    });

    closeModalButton.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hideModal();
        }
    });

    // Initial fetch
    fetchEmojis(currentPage, currentSortBy, currentSortOrder, currentSearchTerm);
});

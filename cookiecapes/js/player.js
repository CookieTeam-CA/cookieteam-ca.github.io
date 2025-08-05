const defaultSkinPath = "/img/skin.png";
const API_BASE_URL = "https://api.cookieattack.de:8989";
const PLAYERS_PER_PAGE = window.innerWidth <= 768 ? 8 : 12;
const playerCardCanvasBackgroundColor = 0x1a1a1a;

let currentPage = 1;
let totalPages = 0;
let capeDataMap = new Map();
const imageCache = new Map();

let currentQuery = '';
let currentSortBy = 'minecraft_name';
let currentOrder = 'asc';
let currentBannedFilter = null;

const playerContainer = document.getElementById("playerContainer");
const paginationControls = document.getElementById("paginationControls");
const loadingIndicator = document.getElementById("loadingIndicator");
const searchInput = document.getElementById("searchInput");
const sortBySelect = document.getElementById("sortBySelect");
const orderSelect = document.getElementById("orderSelect");
const bannedFilterSelect = document.getElementById("bannedFilterSelect");
const showUnnamedCheckbox = document.getElementById("showUnnamedCheckbox");
const toggleAdvancedFiltersBtn = document.getElementById("toggleAdvancedFiltersBtn");
const advancedFilters = document.querySelector(".advanced-filters");

window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    if (header) {
        header.classList.toggle("floating", window.scrollY > 50);
    }
});

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function loadAndCacheImage(url) {
    if (imageCache.has(url)) return imageCache.get(url);
    const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${url}`));
        img.src = url;
    });
    imageCache.set(url, promise);
    return promise;
}

function getPlayerSkinUrl(identifier) {
    return identifier ? `https://starlightskins.lunareclipse.studio/render/skin/${identifier}/default` : defaultSkinPath;
}

function displayCurrentPlayerPage(players) {
    if (!playerContainer) return;
    playerContainer.innerHTML = '';
    playerContainer.style.display = 'none';

    players.forEach((player) => {
        const playerCard = document.createElement("div");
        playerCard.className = `player-card ${player.banned ? 'banned' : ''}`;
        if (player.banned) {
            playerCard.title = `Gebannt: ${player.ban_reason || 'Kein Grund angegeben'}`;
        }

        const canvas = document.createElement("canvas");
        canvas.width = 180;
        canvas.height = 250;
        playerCard.appendChild(canvas);

        const nameP = document.createElement("p");
        nameP.textContent = player.minecraft_name || player.minecraft_uuid;
        if (!player.minecraft_name || player.minecraft_name === player.minecraft_uuid) {
            nameP.style.fontStyle = 'italic';
            nameP.title = 'Spielername konnte nicht abgerufen werden';
        }
        playerCard.appendChild(nameP);

        const capeIdText = player.current_cape_id !== null ? `Cape ID: ${player.current_cape_id}` : 'Kein Cape';
        const capeInfoP = document.createElement("p");
        capeInfoP.textContent = capeIdText;
        playerCard.appendChild(capeInfoP);

        playerContainer.appendChild(playerCard);

        try {
            const viewer = new skinview3d.SkinViewer({ canvas, width: 180, height: 250, background: playerCardCanvasBackgroundColor });
            viewer.fov = 70;
            viewer.zoom = 0.9;
            viewer.globalLight.intensity = 2.8;
            viewer.cameraLight.intensity = 0.7;
            viewer.autoRotate = true;
            viewer.autoRotateSpeed = 0.6;
            
            loadAndCacheImage(defaultSkinPath).then(img => viewer.loadSkin(img));

            if (player.current_cape_id && capeDataMap.has(player.current_cape_id)) {
                const capeUrl = capeDataMap.get(player.current_cape_id);
                loadAndCacheImage(capeUrl)
                    .then(capeImg => viewer.loadCape(capeImg, { backEquipment: 'cape' }))
                    .catch(err => console.error(`Cape-Ladefehler: ${err.message}`));
            }

            const skinUrl = getPlayerSkinUrl(player.minecraft_uuid);
            if (skinUrl !== defaultSkinPath) {
                loadAndCacheImage(skinUrl)
                    .then(skinImg => viewer.loadSkin(skinImg))
                    .catch(err => console.error(`Skin-Ladefehler: ${err.message}`));
            }
        } catch (viewerError) {
            console.error("SkinViewer-Fehler:", viewerError);
        }
    });

    playerContainer.style.display = 'flex';
    renderPlayerPaginationControls();
}

function renderPlayerPaginationControls() {
    if (!paginationControls) return;
    paginationControls.innerHTML = '';
    if (totalPages <= 1) {
        paginationControls.style.display = 'none';
        return;
    }

    const createButton = (text, page, isDisabled = false, isCurrent = false) => {
        const button = document.createElement("button");
        button.textContent = text;
        button.disabled = isDisabled;
        if (isCurrent) {
            button.classList.add('current');
        } else {
            button.onclick = () => changePlayerPage(page);
        }
        return button;
    };
    
    const createEllipsis = () => {
        const span = document.createElement("span");
        span.textContent = "...";
        span.className = 'ellipsis';
        return span;
    };

    paginationControls.appendChild(createButton("‹ Zurück", currentPage - 1, currentPage === 1));

    const contextPages = 5;
    let startPage = Math.max(1, currentPage - contextPages);
    let endPage = Math.min(totalPages, currentPage + contextPages);

    if (startPage > 1) {
        paginationControls.appendChild(createButton("1", 1));
        if (startPage > 2) {
            paginationControls.appendChild(createEllipsis());
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationControls.appendChild(createButton(i, i, i === currentPage, i === currentPage));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationControls.appendChild(createEllipsis());
        }
        paginationControls.appendChild(createButton(totalPages, totalPages));
    }

    paginationControls.appendChild(createButton("Weiter ›", currentPage + 1, currentPage === totalPages));
    paginationControls.style.display = 'flex';
}

function changePlayerPage(newPage) {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
        currentPage = newPage;
        fetchDataForCurrentPage();
        const container = document.getElementById("playerContainer");
        if (container) {
            window.scrollTo({ top: container.offsetTop - 100, behavior: 'smooth' });
        }
    }
}

async function fetchCapeData() {
    const response = await fetch(`${API_BASE_URL}/list_capes`);
    if (!response.ok) throw new Error(`Cape-Abruf fehlgeschlagen: ${response.status}`);
    const result = await response.json();
    capeDataMap.clear();
    (result.capes || []).forEach(cape => {
        if (cape.cape_id !== undefined && cape.cape_image_url) {
            let correctedUrl = cape.cape_image_url;
            try {
                const urlObj = new URL(cape.cape_image_url);
                if (urlObj.protocol === 'http:') {
                    urlObj.protocol = 'https:';
                    urlObj.port = '8989';
                    correctedUrl = urlObj.toString();
                }
            } catch (e) {}
            capeDataMap.set(cape.cape_id, correctedUrl);
        }
    });
}

async function fetchDataForCurrentPage() {
    if (!playerContainer || !loadingIndicator) return;
    loadingIndicator.style.display = 'block';
    playerContainer.style.display = 'none';
    if (paginationControls) paginationControls.style.display = 'none';

    const requestBody = {
        limit: PLAYERS_PER_PAGE,
        offset: (currentPage - 1) * PLAYERS_PER_PAGE,
        sort_by: currentSortBy,
        order: currentOrder
    };
    if (currentQuery) requestBody.query = currentQuery;
    if (currentBannedFilter !== null) requestBody.banned = currentBannedFilter;

    try {
        const response = await fetch(`${API_BASE_URL}/list_players_sorted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`Spieler-Abruf fehlgeschlagen: ${response.status}`);
        
        const result = await response.json();
        let players = result.players || [];
        
        const showUnnamed = showUnnamedCheckbox.checked;
        if (!showUnnamed) {
            players = players.filter(p => p.minecraft_name && p.minecraft_name !== p.minecraft_uuid);
        }

        totalPages = Math.ceil((result.total_count || 0) / PLAYERS_PER_PAGE);
        
        loadingIndicator.style.display = 'none';

        if (players.length === 0) {
            playerContainer.innerHTML = `<p style="color: var(--text-color-dim);">Keine Spieler für die aktuellen Filter gefunden.</p>`;
            playerContainer.style.display = 'flex';
        } else {
            displayCurrentPlayerPage(players);
        }

    } catch (error) {
        console.error("Fehler beim Abrufen der Spielerdaten:", error);
        loadingIndicator.style.display = 'none';
        playerContainer.innerHTML = `<p style="color: var(--error-color);">Fehler beim Laden der Spielerliste: ${error.message}</p>`;
        playerContainer.style.display = 'flex';
    }
}

function handleFilterChange() {
    currentQuery = searchInput.value.trim();
    currentSortBy = sortBySelect.value;
    currentOrder = orderSelect.value;
    const bannedValue = bannedFilterSelect.value;
    currentBannedFilter = (bannedValue === "all") ? null : (bannedValue === "true");
    
    currentPage = 1;
    fetchDataForCurrentPage();
}

function setupEventListeners() {
    toggleAdvancedFiltersBtn.addEventListener('click', () => {
        advancedFilters.classList.toggle('visible');
    });

    const debouncedFilterChange = debounce(handleFilterChange, 400);

    searchInput.addEventListener('input', debouncedFilterChange);
    sortBySelect.addEventListener('change', handleFilterChange);
    orderSelect.addEventListener('change', handleFilterChange);
    bannedFilterSelect.addEventListener('change', handleFilterChange);
    showUnnamedCheckbox.addEventListener('change', handleFilterChange);
}

async function initializePage() {
    const loadingText = document.getElementById("loadingText");
    try {
        if(loadingIndicator) loadingIndicator.style.display = 'block';
        if (loadingText) loadingText.textContent = "Lade Capes...";
        await fetchCapeData();
        
        if (loadingText) loadingText.textContent = "Lade Spielerliste...";
        await fetchDataForCurrentPage();
    } catch (error) {
        console.error("Fehler bei der Initialisierung:", error);
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        if(playerContainer) {
            playerContainer.innerHTML = `<p style="color: var(--error-color);">Fehler bei der Initialisierung: ${error.message}</p>`;
            playerContainer.style.display = 'flex';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializePage();
});
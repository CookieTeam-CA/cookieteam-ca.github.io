document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mobileNav = document.getElementById('mobile-nav');

    if (hamburgerMenu && mobileNav) {
        hamburgerMenu.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
        });

        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
            });
        });
    }

    initialPlayerCountFetch();
    setInterval(updateActivePlayerCount, 30000);
});

async function updateActivePlayerCount() {
    const activePlayerElement = document.getElementById("active-player-count");
    if (!activePlayerElement) return;

    const activeCountUrl = 'https://api.cookieattack.de:8990/stats';

    try {
        const response = await fetch(activeCountUrl);
        if (!response.ok) {
            console.error(getTranslation("pc_error_update"));
            return;
        }

        const data = await response.json();
        const activeCount = data.online_player_count !== undefined ? data.online_player_count : 'N/A';
    
        activePlayerElement.textContent = activeCount;

    } catch (error) {
        console.error(getTranslation("pc_error_update_generic"), error);
    }
}

async function initialPlayerCountFetch() {
    const playerCountNumber = document.getElementById("player-count-number");
    const playerCountTooltip = document.getElementById("player-count-tooltip");

    if (!playerCountNumber || !playerCountTooltip) return;

    const API_BASE_URL = "https://api.cookieattack.de:8989";
    const totalCountUrl = `${API_BASE_URL}/list_players_sorted`;
    const activeCountUrl = 'https://api.cookieattack.de:8990/stats';

    const userIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
        </svg>
    `;

    const [totalResult, activeResult] = await Promise.allSettled([
        fetch(totalCountUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: 1 })
        }),
        fetch(activeCountUrl)
    ]);

    let totalCount = 'N/A';
    if (totalResult.status === 'fulfilled' && totalResult.value.ok) {
        try {
            const data = await totalResult.value.json();
            totalCount = data.total_count !== undefined ? data.total_count : '0';
        } catch (e) {
             console.error(getTranslation("pc_error_process_data"));
        }
    } else {
        console.error(getTranslation("pc_error_fetch_total"));
    }

    let activeCount = 'N/A';
    if (activeResult.status === 'fulfilled' && activeResult.value.ok) {
        try {
            const data = await activeResult.value.json();
            activeCount = data.online_player_count !== undefined ? data.online_player_count : '0';
        } catch(e) {
            console.error(getTranslation("pc_error_process_stats"));
        }
    } else {
        console.error(getTranslation("pc_error_fetch_active"));
    }
    
    playerCountNumber.textContent = totalCount;
    
    playerCountTooltip.innerHTML = `
        <div class="tooltip-line">
            ${userIconSVG}
            <span>${getTranslation("pc_tooltip_registered")} ${totalCount}</span>
        </div>
        <div class="tooltip-line active-players">
            ${userIconSVG}
            <span>${getTranslation("pc_tooltip_active")} <span id="active-player-count">${activeCount}</span></span>
        </div>
    `;
}
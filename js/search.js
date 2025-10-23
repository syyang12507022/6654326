// js/search.js
// let allCasesData = []; // <--- 이 줄을 삭제합니다!

/**
 * [MOVED] Parses all case data from the sidebar links and stores it in the global allCasesData array (declared in main.js).
 * Called once when main.js initializes.
 */
function parseAllCasesData() {
    const allCaseLinksFromMain = document.querySelectorAll('.app-sidebar-link.case-link');
    allCasesData = []; // Use the global allCasesData array from main.js

    allCaseLinksFromMain.forEach(link => {
        if (link.classList.contains('disabled')) return; // Skip disabled links

        const caseTitle = link.textContent.trim();
        const caseHref = link.getAttribute('href');
        const caseSrc = link.dataset.src;

        const caseList = link.closest('.sidebar-case-list');
        const subCategoryHeader = caseList ? caseList.previousElementSibling : null;
        const subCategoryTitle = subCategoryHeader ? subCategoryHeader.querySelector('.menu-text')?.textContent.trim() : 'Unknown';

        const submenu = subCategoryHeader ? subCategoryHeader.closest('.sidebar-submenu') : null;
        const midCategoryHeader = submenu ? submenu.previousElementSibling : null;
        const midCategoryTitle = midCategoryHeader ? midCategoryHeader.querySelector('.menu-text')?.textContent.trim() : 'Unknown';

        if (caseTitle && caseHref && caseSrc) { // Ensure essential data exists
             allCasesData.push({
                title: caseTitle,
                href: caseHref,
                src: caseSrc,
                subCategory: subCategoryTitle,
                midCategory: midCategoryTitle
            });
        } else {
             console.warn("Skipping link with missing data:", link);
        }
    });
    // console.log("Parsed Cases:", allCasesData); // For debugging
}

/**
 * [MOVED] Filters cases based on the search term entered in the home page search box.
 * Calls renderSearchResults to display the results.
 */
function performSearch() {
    const searchInput = document.getElementById('caseSearchInput');
    if (!searchInput || typeof allCasesData === 'undefined') return; // Exit if search input or data doesn't exist

    const searchTerm = searchInput.value.toLowerCase().trim();
    let filteredResults = [];

    if (searchTerm.length > 0) {
        filteredResults = allCasesData.filter(caseItem => {
            // Check if title, subCategory, or midCategory includes the search term
            return (caseItem.title?.toLowerCase().includes(searchTerm) ||
                    caseItem.subCategory?.toLowerCase().includes(searchTerm) ||
                    caseItem.midCategory?.toLowerCase().includes(searchTerm));
        });
    }
    // Render the results (or clear if search term is empty)
    renderSearchResults(filteredResults, searchTerm);
}

/**
 * [MOVED] Renders the search results dynamically below the search bar in case-home.html.
 * @param {Array} results - Array of filtered case objects.
 * @param {string} searchTerm - The search term entered by the user.
 */
function renderSearchResults(results, searchTerm) {
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    if (!searchResultsContainer) return; // Exit if the container doesn't exist

    searchResultsContainer.innerHTML = ''; // Clear previous results

    if (results.length > 0) {
        // Build the HTML for the results grid
        const resultHtml = `
            <h3><i class="fas fa-search me-2"></i>검색 결과 (${results.length}건)</h3>
            <div class="row" id="searchResultsGrid">
                ${results.map(caseItem => `
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="search-result-card" data-src="${caseItem.src}" data-href="${caseItem.href}" role="button" tabindex="0">
                            <span class="badge bg-secondary">${caseItem.midCategory}</span>
                            <span class="badge bg-info text-dark">${caseItem.subCategory}</span>
                            <h5 class="mt-2">${caseItem.title}</h5>
                            <p>클릭하여 상세 내용을 확인하세요.</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        searchResultsContainer.innerHTML = resultHtml;
        // Add click event listeners to the newly created result cards
        attachSearchResultCardListeners();
    } else if (searchTerm.length > 0) {
        // Display a message if there are no results for a non-empty search term
        searchResultsContainer.innerHTML = `
            <h3><i class="fas fa-search me-2"></i>검색 결과 (0건)</h3>
            <div class="alert alert-warning text-center no-results-message">
                <i class="fas fa-info-circle me-2"></i> <strong>'${searchTerm}'</strong>와(과) 일치하는 사례를 찾을 수 없습니다.<br>
                다른 키워드로 다시 시도해 보시거나, 왼쪽 메뉴를 통해 탐색해 보세요.
            </div>
        `;
    }
    // If searchTerm is empty, the container remains empty.
}

/**
 * [MOVED] Attaches click event listeners to the dynamically generated search result cards.
 * Calls the loadContent function (from main.js) when a card is clicked.
 */
function attachSearchResultCardListeners() {
    document.querySelectorAll('.search-result-card').forEach(card => {
        // Function to handle card click/keypress
        const handleCardActivation = function() {
            const src = this.dataset.src;
            const href = this.dataset.href;
            // Call GLOBAL loadContent from main.js, indicating it's a search result click
            if (typeof loadContent === 'function') {
                loadContent(src, href, true);
            } else {
                console.error("loadContent function is not accessible from search.js");
            }
        };

        // Click event
        card.addEventListener('click', handleCardActivation);

        // Keyboard accessibility (Enter key)
        card.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                handleCardActivation.call(this); // Ensure 'this' refers to the card
            }
        });
    });
}

/**
 * [MOVED] Attaches event listeners (keyup for input, click for button) to the search elements on the home page.
 * Called from main.js when the home content is loaded.
 */
function attachSearchEventListeners() {
    const searchInput = document.getElementById('caseSearchInput');
    const searchButton = document.getElementById('caseSearchButton');

    if (searchInput) {
        // Remove potential existing listener to prevent duplicates if home is reloaded
        searchInput.removeEventListener('keyup', handleSearchInput);
        searchInput.addEventListener('keyup', handleSearchInput);
    }
    if (searchButton) {
        // Remove potential existing listener
        searchButton.removeEventListener('click', handleSearchClick);
        searchButton.addEventListener('click', handleSearchClick);
    }
}

/**
 * [MOVED] Handles the 'keyup' event on the search input field.
 * Triggers search on 'Enter' key press and clears results if the input is emptied.
 * @param {Event} event - The keyboard event object.
 */
function handleSearchInput(event) {
    if (event.key === 'Enter') {
        performSearch(); // Perform search when Enter is pressed
    } else if (event.target.value.trim() === '') {
        renderSearchResults([], ''); // Clear results if input is empty
    }
}

/**
 * [MOVED] Handles the 'click' event on the search button.
 * Triggers the search function.
 */
function handleSearchClick() {
    performSearch(); // Perform search when the button is clicked
}
// js/search.js

// [MODIFIED] main.js로부터 카테고리 이름을 받기 위해 수정
/**
 * [NEW] main.js로부터 받은 JSON 데이터로 allCasesData 배열을 구축합니다.
 * @param {Array} mainCategories - cases.json의 mainCategories 배열
 */
function buildSearchDataFromJSON(mainCategories) {
    allCasesData = []; // 배열 초기화

    try {
        mainCategories.forEach(mainCat => {
            if (mainCat.type !== 'main-category' || !mainCat.subItems) return;

            const mainCategoryName = mainCat.name;

            mainCat.subItems.forEach(midCat => {
                if (midCat.type !== 'mid-category' || !midCat.subItems) return;

                const midCategoryName = midCat.name;

                midCat.subItems.forEach(subCat => {
                    if (subCat.type !== 'sub-category' || !subCat.cases) return;

                    const subCategoryName = subCat.name;

                    subCat.cases.forEach(caseItem => {
                        allCasesData.push({
                            id: caseItem.id,
                            title: caseItem.title,
                            src: caseItem.src,
                            // [MODIFIED] 검색 결과 표시에 사용할 카테고리 이름 저장
                            mainCategoryName: mainCategoryName,
                            midCategoryName: midCategoryName,
                            subCategoryName: subCategoryName,
                            // 검색을 위한 키워드로 카테고리 이름들을 추가
                            keywords: `${caseItem.title} ${mainCategoryName} ${midCategoryName} ${subCategoryName}`.toLowerCase()
                        });
                    });
                });
            });
        });
        
        // console.log("Search data built:", allCasesData);

    } catch (error) {
        console.error("Error building search data from JSON:", error);
    }
}


/**
 * [UNCHANGED] 검색을 수행하고 결과를 렌더링합니다.
 */
function performSearch() {
    const searchInput = document.getElementById('caseSearchInput');
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        renderSearchResults([], query); // 검색어가 없으면 빈 결과 표시
        return;
    }

    const results = allCasesData.filter(caseItem => 
        caseItem.keywords.includes(query)
    );

    renderSearchResults(results, query);
}

/**
 * ================================================
 * [MODIFIED] 이 부분이 수정되었습니다.
 * '카드(Card)' 형태의 HTML을 생성하도록 변경되었습니다.
 * (style.css의 .search-result-card 스타일에 맞춤)
 * ================================================
 */
function renderSearchResults(results, query) {
    const resultsContainer = document.getElementById('searchResultsContainer');
    if (!resultsContainer) return;

    if (!query) {
        resultsContainer.innerHTML = ''; // 검색어가 없으면 비움
        // [MODIFIED] active 클래스 제거 (목록형 스타일 잔여물)
        // resultsContainer.classList.remove('active'); 
        return;
    }

    let html = '';
    if (results.length > 0) {
        // style.css의 '#searchResultsContainer h3' 사용
        html += `<h3>"${query}" 검색 결과 (${results.length}건)</h3>`;
        
        // [MODIFIED] Bootstrap grid system (row) 추가
        html += '<div class="row">';

        results.forEach(item => {
            // [MODIFIED] Bootstrap grid system (column) 추가
            // col-lg-4 (큰 화면에서 3개), col-md-6 (중간 화면에서 2개), mb-4 (아래쪽 마진)
            // .search-result-card에 h-100 (높이 100%)을 추가하여 같은 줄의 카드 높이를 맞춥니다.
            html += `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="search-result-card h-100" data-href="#${item.id}" data-src="${item.src}">
                        <!-- style.css의 '.search-result-card .badge' 사용 -->
                        <span class="badge bg-secondary">${item.mainCategoryName}</span>
                        <span class="badge bg-info">${item.midCategoryName}</span>
                        
                        <!-- style.css의 '.search-result-card h5' 사용 -->
                        <h5 class="mt-2">${item.title}</h5>
                        
                        <!-- [수정] 파일 경로 대신 안내 문구를 삽입합니다. -->
                        <p class="text-muted small mb-0">클릭하여 상세 내용을 확인하세요.</p>
                    </div>
                </div>
            `;
        });
        
        // [MODIFIED] Bootstrap grid system (row) 닫기
        html += '</div>';

    } else {
        // style.css의 '.no-results-message' 사용
        html += `
            <div class="no-results-message">
                <i class="fas fa-exclamation-triangle me-2"></i>
                "${query}"에 대한 검색 결과가 없습니다.
            </div>
        `;
    }
    
    resultsContainer.innerHTML = html;
    // [MODIFIED] active 클래스 추가 불필요 (카드형은 상시 노출)
    // resultsContainer.classList.add('active'); 

    // [MODIFIED] 검색 결과 '카드'에 이벤트 리스너 추가
    attachSearchResultLinkListeners();
}

/**
 * ================================================
 * [MODIFIED] 이 부분이 수정되었습니다.
 * 'a.search-result-link' 대신 '.search-result-card'에
 * 클릭 리스너를 부착하도록 변경되었습니다.
 * (카드형 스타일에 맞춤)
 * ================================================
 */
function attachSearchResultLinkListeners() {
    document.querySelectorAll('.search-result-card').forEach(card => {
        card.addEventListener('click', function(event) {
            event.preventDefault();
            const srcUrl = this.dataset.src;
            const targetHash = this.dataset.href; // 'data-href' 속성 사용
            
            // loadContent 함수 (main.js에 있음) 호출
            if (typeof loadContent === 'function') {
                loadContent(srcUrl, targetHash, true); // true: 검색 결과 플래그
            }

            // 검색창 포커스 아웃 (모바일 키보드 닫기 유도)
            const searchInput = document.getElementById('caseSearchInput');
            if(searchInput) searchInput.blur();
        });
    });
}


/**
 * [UNCHANGED] 검색 입력/버튼 이벤트 리스너 부착 함수 (기존과 동일)
 */
function attachSearchEventListeners() {
    const searchButton = document.getElementById('caseSearchButton');
    const searchInput = document.getElementById('caseSearchInput');

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }
}


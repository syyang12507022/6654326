// js/search.js

/**
 * [NEW HELPER] DOMParser를 사용하여 HTML 문자열에서 텍스트 콘텐츠를 추출합니다.
 * @param {string} htmlString - 파싱할 HTML 문자열
 * @returns {string} - 추출된 텍스트 콘텐츠 (소문자로 변환됨)
 */
function extractTextFromHTML(htmlString) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        
        // 1. <title> 태그의 텍스트를 가져옵니다.
        const title = doc.querySelector('title')?.innerText || '';
        
        // 2. <body> (또는 특정 컨테이너)의 텍스트를 가져옵니다.
        // 참고: 만약 케이스 HTML 파일들에 <div id="content"> 같은 공통 콘텐츠 영역이 있다면
        // 'doc.body?.innerText' 대신 'doc.querySelector('#content')?.innerText'를 쓰는 것이 더 정확합니다.
        const bodyContent = doc.body?.innerText || '';
        
        // 3. 주요 헤딩(h1, h2, h3) 텍스트를 가져옵니다.
        let headings = [];
        doc.querySelectorAll('h1, h2, h3').forEach(h => {
            headings.push(h.innerText);
        });

        // 모든 텍스트를 공백으로 구분하여 결합하고 중복 공백을 제거합니다.
        return `${title} ${bodyContent} ${headings.join(' ')}`
               .toLowerCase() // 여기서 소문자로 변환
               .replace(/\s+/g, ' ') // 중복 공백 제거
               .trim();
    } catch (e) {
        console.error("Error parsing HTML for search:", e);
        return "";
    }
}

/**
 * [NEW HELPER] 개별 케이스의 HTML을 비동기로 가져와 텍스트를 추출합니다.
 * @param {object} caseItem - {id, title, src}
 * @param {object} categoryNames - { mainCategoryName, midCategoryName, subCategoryName }
 * @returns {Promise<object>} - 검색 데이터 객체 (allCasesData에 저장될 형식)
 */
async function fetchAndExtractCaseContent(caseItem, categoryNames) {
    let htmlContent = "";
    
    try {
        // caseItem.src (예: 'cases/case01.html')로 fetch 요청
        const response = await fetch(caseItem.src);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${caseItem.src}: ${response.statusText}`);
        }
        const htmlString = await response.text();
        // 헬퍼 함수를 사용해 HTML에서 텍스트 추출
        htmlContent = extractTextFromHTML(htmlString);
        
    } catch (error) {
        console.warn(`Could not fetch content for ${caseItem.title}. Searching by title/category only.`, error.message);
        // HTML fetching에 실패해도 검색은 가능해야 하므로,
        // 기본 키워드(제목 + 카테고리)만 사용합니다.
    }

    // 기본 키워드 (JSON에 있던 제목 + 카테고리)
    const baseKeywords = `${caseItem.title} ${categoryNames.mainCategoryName} ${categoryNames.midCategoryName} ${categoryNames.subCategoryName}`.toLowerCase();

    // 최종 반환 객체
    return {
        id: caseItem.id,
        title: caseItem.title,
        src: caseItem.src,
        mainCategoryName: categoryNames.mainCategoryName,
        midCategoryName: categoryNames.midCategoryName,
        subCategoryName: categoryNames.subCategoryName,
        // [MODIFIED] 기본 키워드 + HTML 본문 키워드를 합칩니다.
        keywords: `${baseKeywords} ${htmlContent}`.replace(/\s+/g, ' ').trim()
    };
}


/**
 * [MODIFIED] main.js로부터 받은 JSON 데이터로 allCasesData 배열을 비동기로 구축합니다.
 * HTML 본문 내용을 fetch하여 검색어에 포함시킵니다.
 * @param {Array} mainCategories - cases.json의 mainCategories 배열
 * @returns {Promise<void>} - 검색 데이터 구축이 완료되면 resolve됩니다.
 */
async function buildSearchDataFromJSON(mainCategories) {
    allCasesData = []; // 배열 초기화
    let fetchPromises = []; // HTML fetch 프로미스들을 담을 배열

    console.log("검색 인덱스 생성을 시작합니다 (HTML 본문 포함)...");
    
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
                        // [MODIFIED] 직접 push하지 않고, fetch 프로미스를 배열에 추가합니다.
                        fetchPromises.push(fetchAndExtractCaseContent(
                            caseItem, 
                            { mainCategoryName, midCategoryName, subCategoryName }
                        ));
                    });
                });
            });
        });

        // [MODIFIED] 모든 HTML fetch가 완료될 때까지 기다립니다.
        // Promise.allSettled를 사용하여 일부가 실패하더라도 나머지는 처리되도록 합니다.
        const results = await Promise.allSettled(fetchPromises);

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                allCasesData.push(result.value); // 성공한 경우에만 데이터 추가
            } else {
                // 실패한 경우 (fetch 실패 등), 콘솔에 에러 기록
                console.error("검색 인덱싱 중 일부 케이스 처리에 실패했습니다:", result.reason);
            }
        });
        
        console.log(`검색 인덱스 생성 완료. 총 ${allCasesData.length}개의 케이스가 인덱싱되었습니다.`);

    } catch (error) {
        console.error("검색 데이터 구축 중 심각한 오류 발생:", error);
    }
    
    // 이 함수는 main.js에서 await로 호출되어야 합니다.
    // (예: await buildSearchDataFromJSON(data.mainCategories);)
    // (그런 다음 main.js에서 검색창을 활성화해야 함)
}


/**
 * [MODIFIED] 검색을 수행하고 결과를 렌더링합니다.
 * 두 글자 미만 입력 시 *팝업* 경고 메시지를 표시합니다.
 */
function performSearch() {
    const searchInput = document.getElementById('caseSearchInput');
    const resultsContainer = document.getElementById('searchResultsContainer'); // [MODIFIED] 기존 결과 비우기 위해 참조
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        renderSearchResults([], query); // 검색어가 없으면(빈 문자열) 빈 결과 표시
        return;
    }

    // [MODIFIED] 두 글자 미만 입력 시 팝업 경고
    if (query.length < 2) {
        // [NEW] 팝업 함수 호출
        showToastMessage('검색어는 두 글자 이상 입력해주세요.', 'warning');
        
        // [NEW] 경고 팝업이 떴을 때, 기존 검색 결과가 남아있으면 비워줍니다.
        if (resultsContainer && resultsContainer.innerHTML !== '') {
             resultsContainer.innerHTML = '';
        }
        
        return; // 검색을 수행하지 않음
    }

    // keywords에 본문 내용이 포함되었으므로, 검색 로직은 수정할 필요가 없습니다.
    const results = allCasesData.filter(caseItem => 
        caseItem.keywords.includes(query)
    );

    renderSearchResults(results, query);
}

/**
 * [MODIFIED HELPER] 토스트 팝업 메시지를 *검색창 아래에* 표시합니다.
 * @param {string} message - 표시할 메시지
 * @param {string} type - 'warning' (default) 또는 'error', 'success' 등 (CSS 클래스에 영향)
 */
function showToastMessage(message, type = 'warning') {
    // 1. 기존 토스트가 있다면 제거
    const existingToast = document.getElementById('search-toast-popup');
    if (existingToast) {
        existingToast.remove();
    }

    // 2. 토스트 엘리먼트 생성
    const toast = document.createElement('div');
    toast.id = 'search-toast-popup';
    toast.className = `search-toast-popup toast-type-${type}`;
    
    // Font Awesome 아이콘 사용 (아이콘이 로드되어 있다고 가정)
    const iconClass = type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${iconClass} me-2"></i> ${message}`;

    // 3. [MODIFIED] 스타일링 (검색창 기준)
    const searchInput = document.getElementById('caseSearchInput');
    let toastStyles = {
        position: 'absolute', // [MODIFIED] 'absolute'
        backgroundColor: type === 'warning' ? '#fff8e1' : '#e6f7ff',
        color: type === 'warning' ? '#856404' : '#004085',
        padding: '10px 15px', // [MODIFIED] 패딩 축소
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: '1100', // 부트스트랩 모달보다 높게 설정
        opacity: '0',
        transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out', // [NEW] transform transition 추가
        transform: 'translateY(-10px)', // [NEW] 초기 위치 (살짝 위)
        fontFamily: 'sans-serif', // 기본 폰트 지정
        fontSize: '14px',
        border: `1px solid ${type === 'warning' ? '#ffeeba' : '#b8daff'}`,
        marginTop: '5px' // [NEW] 검색창과의 간격
    };

    if (searchInput) {
        // [NEW] 검색창 (또는 부모 input-group) 기준으로 위치 계산
        const anchorElement = searchInput.parentElement.classList.contains('input-group') 
                              ? searchInput.parentElement 
                              : searchInput;
        const anchorRect = anchorElement.getBoundingClientRect();

        toastStyles.top = `${anchorRect.bottom + window.scrollY}px`; // 스크롤 위치 반영
        toastStyles.left = `${anchorRect.left + window.scrollX}px`; // 스크롤 위치 반영
        toastStyles.width = `${anchorRect.width}px`;
        toastStyles.maxWidth = 'none'; // [MODIFIED] maxWidth 제거
    } else {
        // [FALLBACK] 검색창 못 찾으면 기존처럼 우측 상단
        console.warn("caseSearchInput을 찾을 수 없어 팝업을 우측 상단에 표시합니다.");
        toastStyles.position = 'fixed';
        toastStyles.top = '20px';
        toastStyles.right = '20px';
        toastStyles.maxWidth = '300px';
    }
    
    Object.assign(toast.style, toastStyles);
    
    // 4. Body에 추가
    document.body.appendChild(toast);

    // 5. Fade-in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)'; // [NEW] 제자리로 이동
    }, 10); // DOM에 추가된 후 바로 실행

    // 6. 3초 후 Fade-out 및 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)'; // [NEW] 다시 위로
        // transition(0.3s)이 끝난 후 DOM에서 제거
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.remove();
            }
        });
    }, 3000); // 3초간 표시
}


/**
 * ================================================
 * [UNCHANGED] 이 부분은 기존 코드와 동일합니다.
 * '카드(Card)' 형태의 HTML을 생성합니다.
 * ================================================
 */
function renderSearchResults(results, query) {
    const resultsContainer = document.getElementById('searchResultsContainer');
    if (!resultsContainer) return;

    if (!query) {
        resultsContainer.innerHTML = ''; // 검색어가 없으면 비움
        return;
    }

    let html = '';
    if (results.length > 0) {
        html += `<h3>"${query}" 검색 결과 (${results.length}건)</h3>`;
        html += '<div class="row">';

        results.forEach(item => {
            html += `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="search-result-card h-100" data-href="#${item.id}" data-src="${item.src}">
                        <span class="badge bg-secondary">${item.mainCategoryName}</span>
                        <span class="badge bg-info">${item.midCategoryName}</span>
                        
                        <h5 class="mt-2">${item.title}</h5>
                        
                        <p class="text-muted small mb-0">클릭하여 상세 내용을 확인하세요.</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';

    } else {
        html += `
            <div class="no-results-message">
                <i class="fas fa-exclamation-triangle me-2"></i>
                "${query}"에 대한 검색 결과가 없습니다.
            </div>
        `;
    }
    
    resultsContainer.innerHTML = html;
    attachSearchResultLinkListeners();
}

/**
 * ================================================
 * [UNCHANGED] 이 부분은 기존 코드와 동일합니다.
 * '.search-result-card'에 클릭 리스너를 부착합니다.
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


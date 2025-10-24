// js/main.js

// [MODIFIED] 두 파일에서 접근해야 하므로 전역 범위에 선언
let allCasesData = []; 
// [NEW] JSON 데이터를 저장할 전역 변수
let sidebarData = null;

/**
 * [MOVED & MODIFIED] 콘텐츠를 로드하고 화면에 표시하는 함수 (전역 함수로 변경)
 * @param {string} srcUrl - 불러올 HTML 파일 경로 (예: 'cases/case-home.html')
 * @param {string} targetHash - 활성화할 링크의 href (예: '#case-home')
 * @param {boolean} isSearchResult - 검색 결과 클릭으로 로드되었는지 여부
 */
async function loadContent(srcUrl, targetHash, isSearchResult = false) {
    const contentLoader = document.getElementById('content-loader');
    if (!srcUrl || !contentLoader) return; 

    try {
        let response = await fetch(srcUrl);
        let html = '';

        if (!response.ok) {
            console.warn(`Relative path fetch failed for ${srcUrl}. Trying root path.`);
            const rootSrcUrl = srcUrl.startsWith('/') ? srcUrl : '/' + srcUrl;
            response = await fetch(rootSrcUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok for ${srcUrl} or ${rootSrcUrl}`);
            }
            html = await response.text();
        } else {
            html = await response.text();
        }

        contentLoader.innerHTML = html; 

        const pageTitleH2 = document.querySelector('#pageTitleArea h2');
        const pageTitleP = document.querySelector('#pageTitleArea p');
        updatePageTitle(contentLoader, targetHash, pageTitleH2, pageTitleP); 

        if (!isSearchResult) {
            updateActiveLink(targetHash); 
        } else {
            document.querySelectorAll('.app-sidebar-link.case-link, .sidebar-sub-category-header').forEach(link => {
                link.classList.remove('active');
            });
        }

        window.scrollTo(0, 0); 

        if ((targetHash === '#case-home' || contentLoader.querySelector('#case-home')) && typeof attachSearchEventListeners === 'function') {
            attachSearchEventListeners();
             if (!isSearchResult && typeof renderSearchResults === 'function') {
                renderSearchResults([], '');
            }
        }

    } catch (error) {
        console.error('Failed to load content:', error);
        contentLoader.innerHTML = `<div class="alert alert-danger">콘텐츠를 불러오는 데 실패했습니다. (${srcUrl}). 경로와 서버 상태를 확인해주세요.</div>`;
    }
}

/**
 * [MOVED & MODIFIED] 페이지 제목 영역 업데이트 함수 (전역 함수로 변경)
 */
function updatePageTitle(contentLoader, targetHash, pageTitleH2, pageTitleP) {
    if (!pageTitleH2 || !pageTitleP) return; 

    if (targetHash === '#case-home' || contentLoader.querySelector('#case-home')) {
        pageTitleH2.textContent = "NE능률 AI 업무 활용 사례집";
        pageTitleP.textContent = "NE능률 사내 AI 업무 활용 사례를 공유하고 확산하는 플랫폼입니다.";
    } else {
        const cardElement = contentLoader.querySelector('.case-card'); 
        const cardTitle = cardElement?.querySelector('h2')?.innerText || "사례 상세";
        const cardBadge = cardElement?.querySelector('.lead .badge:last-of-type')?.innerText || "AI 활용";
        pageTitleH2.textContent = cardBadge + " 사례";
        pageTitleP.textContent = cardTitle + " 상세 내용입니다.";
    }
}

/**
 * [MOVED & MODIFIED] 사이드바 링크 활성 상태 업데이트 및 부모 메뉴 펼치기 (전역 함수로 변경)
 */
function updateActiveLink(targetHash) {
    document.querySelectorAll('.app-sidebar-link.case-link, .sidebar-sub-category-header').forEach(link => {
        link.classList.remove('active');
        if(link.classList.contains('sidebar-sub-category-header') || link.classList.contains('sidebar-mid-category-header')) {
            link.setAttribute('aria-expanded', 'false');
            link.classList.add('collapsed'); 
        }
    });

     // 모든 콜랩스 메뉴 접기 (기존 활성 링크 외)
    document.querySelectorAll('.sidebar-submenu.show, .sidebar-case-list.show').forEach(element => {
        const collapseInstance = bootstrap.Collapse.getInstance(element);
        if (collapseInstance) {
            collapseInstance.hide();
        }
    });

    const targetLink = document.querySelector(`a.case-link[href="${targetHash}"]`);
    if (!targetLink) return;
    targetLink.classList.add('active');

    let currentElement = targetLink;
    while (currentElement && currentElement.classList) { 
        const collapsibleParent = currentElement.closest('.collapse');
         if (collapsibleParent) {
            const collapseInstance = bootstrap.Collapse.getOrCreateInstance(collapsibleParent);
            if (collapseInstance) {
                collapseInstance.show();
            }
            const header = collapsibleParent.previousElementSibling;
             if (header && header.hasAttribute('data-bs-toggle')) {
                header.setAttribute('aria-expanded', 'true');
                header.classList.remove('collapsed');
            }
            currentElement = header; 
        } else {
            currentElement = currentElement.parentElement; 
        }
    }
}


// --- [NEW] 사이드바 HTML 생성 함수 ---
/**
 * JSON 데이터를 기반으로 사이드바 HTML을 생성합니다.
 * @param {Array} mainCategories - cases.json의 mainCategories 배열
 * @returns {string} - 생성된 HTML 문자열
 */
function buildSidebarHTML(mainCategories) {
    let html = '';

    mainCategories.forEach(mainCat => {
        if (mainCat.type === 'main-category') {
            html += `
                <li class="app-sidebar-main-category">
                    <div class="sidebar-main-category-header">
                        <i class="${mainCat.icon}"></i><span class="menu-text">${mainCat.name}</span>
                    </div>
                </li>
            `;

            mainCat.subItems.forEach(midCat => {
                if (midCat.type === 'mid-category') {
                    const submenuId = `submenu-${midCat.id}`;
                    html += `
                        <li>
                            <div class="sidebar-mid-category-header collapsed" data-bs-toggle="collapse" data-bs-target="#${submenuId}" aria-expanded="false">
                                <div class="d-flex"><i class="${midCat.icon}"></i><span class="menu-text">${midCat.name}</span></div>
                                <i class="fas fa-chevron-down toggle-icon chevron-icon"></i>
                            </div>
                            <ul class="sidebar-submenu collapse" id="${submenuId}">
                    `;

                    midCat.subItems.forEach(subCat => {
                        if (subCat.type === 'sub-category') {
                            const caseListId = `case-list-${subCat.id}`;
                            html += `
                                <li class="app-sidebar-item">
                                    <div class="sidebar-sub-category-header" data-bs-toggle="collapse" data-bs-target="#${caseListId}" aria-expanded="false">
                                        <div class="d-flex"><i class="${subCat.icon}"></i><span class="menu-text">${subCat.name}</span></div>
                                        <i class="fas fa-chevron-down toggle-icon chevron-icon"></i>
                                    </div>
                                    <ul class="sidebar-case-list collapse" id="${caseListId}">
                            `;

                            subCat.cases.forEach(caseItem => {
                                html += `
                                    <li class="app-sidebar-item">
                                        <a href="#${caseItem.id}" class="app-sidebar-link case-link" data-src="${caseItem.src}">
                                            <span class="menu-text">${caseItem.title}</span>
                                        </a>
                                    </li>
                                `;
                            });
                            html += `</ul></li>`; // sub-category 닫기
                        }
                    });
                    html += `</ul></li>`; // mid-category 닫기
                }
            });
        } else if (mainCat.type === 'main-category-spacer') {
             html += `<li class="app-sidebar-main-category"></div></li>`;
        }
    });
    
    return html;
}


// --- DOMContentLoaded 이벤트 리스너 시작 ---
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const logoLink = document.querySelector('.app-logo');
    const sidebarMenuList = document.getElementById('sidebar-menu-list');

    // --- 모바일 사이드바 토글 (기존 코드) ---
    if (sidebarToggleMobile && sidebar) {
        sidebarToggleMobile.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }
    window.addEventListener('resize', function () {
        if (window.innerWidth > 991 && sidebar?.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    // --- (여기까지) ---

    /**
     * [REMAINED] 기본 콘텐츠(홈) 표시 함수 (리스너 내부에 유지)
     */
    function showDefaultContent() {
        // 모든 콜랩스 메뉴 접기 (updateActiveLink가 이 기능을 포함하도록 수정됨)
        updateActiveLink(''); // 활성 링크 없음 = 홈 + 모든 메뉴 접기

        // 홈 콘텐츠 로드 (전역 loadContent 함수 호출)
        if (logoLink && logoLink.dataset.src && logoLink.getAttribute('href')) {
            loadContent(logoLink.dataset.src, logoLink.getAttribute('href'));
        } else {
            console.warn("Logo link missing data-src or href, loading default home.");
            loadContent('cases/case-home.html', '#case-home');
        }
    }

    // --- [NEW] 이벤트 리스너 연결 (이벤트 위임) ---
    // 사이드바 메뉴가 동적으로 생성되므로, 부모인 'sidebarMenuList'에 이벤트 리스너를 한 번만 연결합니다.
    if (sidebarMenuList) {
        sidebarMenuList.addEventListener('click', function(event) {
            // 클릭된 요소 또는 그 부모 중에서 '.case-link'를 찾습니다.
            const targetLink = event.target.closest('a.case-link');

            if (targetLink && !targetLink.classList.contains('disabled')) {
                event.preventDefault();
                
                const srcUrl = targetLink.dataset.src;
                const targetHash = targetLink.getAttribute('href');

                loadContent(srcUrl, targetHash); // 전역 loadContent 함수 호출

                // 모바일에서 링크 클릭 시 사이드바 닫기
                if (window.innerWidth <= 991 && sidebar?.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // 2. 로고 클릭 시 (홈으로)
    if (logoLink) {
        logoLink.addEventListener('click', function (event) {
            event.preventDefault();
            showDefaultContent(); // 홈 콘텐츠 표시 및 사이드바 메뉴 닫기
        });
    }

    // --- [NEW] 초기 실행 ---
    // 1. JSON 데이터를 fetch하고 사이드바를 빌드합니다.
    async function initializeApp() {
        try {
            // 'cases.json' 경로가 올바른지 확인하세요.
            const response = await fetch('cases.json'); 
            if (!response.ok) {
                throw new Error(`Failed to fetch cases.json: ${response.statusText}`);
            }
            const data = await response.json();
            sidebarData = data.mainCategories; // 전역 변수에 저장

            // 2. 사이드바 HTML 생성 및 삽입
            const sidebarHTML = buildSidebarHTML(sidebarData);
            if (sidebarMenuList) {
                sidebarMenuList.innerHTML = sidebarHTML;
            }

            // 3. 검색 데이터 빌드 (search.js 함수 호출)
            if (typeof buildSearchDataFromJSON === 'function') {
                buildSearchDataFromJSON(sidebarData);
            } else {
                console.error("buildSearchDataFromJSON function not found in search.js.");
            }

            // 4. 페이지 첫 로드 시 홈 콘텐츠 표시
            showDefaultContent();

        } catch (error) {
            console.error("앱 초기화 실패:", error);
            if (sidebarMenuList) {
                sidebarMenuList.innerHTML = `<li class="p-3 text-danger">메뉴를 불러오는 데 실패했습니다. cases.json 파일을 확인해주세요.</li>`;
            }
        }
    }

    initializeApp(); // 앱 초기화 함수 실행

}); // --- DOMContentLoaded 이벤트 리스너 끝 ---
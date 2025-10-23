// js/main.js

// [MODIFIED] 두 파일에서 접근해야 하므로 전역 범위에 선언
let allCasesData = [];

/**
 * [MOVED & MODIFIED] 콘텐츠를 로드하고 화면에 표시하는 함수 (전역 함수로 변경)
 * @param {string} srcUrl - 불러올 HTML 파일 경로 (예: 'cases/case-home.html')
 * @param {string} targetHash - 활성화할 링크의 href (예: '#case-home')
 * @param {boolean} isSearchResult - 검색 결과 클릭으로 로드되었는지 여부
 */
async function loadContent(srcUrl, targetHash, isSearchResult = false) {
    const contentLoader = document.getElementById('content-loader');
    if (!srcUrl || !contentLoader) return; // data-src 또는 contentLoader 없으면 실행 중지

    try {
        let response = await fetch(srcUrl);
        let html = '';

        if (!response.ok) {
            // 상대 경로 실패 시 루트 경로 시도 (Live Server 등 환경 대비)
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

        contentLoader.innerHTML = html; // 내용 삽입

        // 제목 업데이트 (페이지 로드 후 실행되도록 DOMContentLoaded 리스너 안의 함수 호출 필요 시 고려)
        // 전역 함수로 만들거나, 아래처럼 직접 DOM 조작
        const pageTitleH2 = document.querySelector('#pageTitleArea h2');
        const pageTitleP = document.querySelector('#pageTitleArea p');
        updatePageTitle(contentLoader, targetHash, pageTitleH2, pageTitleP); // 제목 업데이트 함수 호출

        // 활성 링크 업데이트 (DOMContentLoaded 리스너 안의 함수 호출 필요 시 고려)
        if (!isSearchResult) {
            updateActiveLink(targetHash); // 활성 링크 업데이트 함수 호출
        } else {
            // 검색 결과 로드 시에는 사이드바 링크 비활성화
            document.querySelectorAll('.app-sidebar-link.case-link, .sidebar-sub-category-header').forEach(link => {
                link.classList.remove('active');
            });
        }

        window.scrollTo(0, 0); // 상단 스크롤

        // 홈 콘텐츠 로드 시 검색 이벤트 리스너 (재)부착 (search.js 함수 호출)
        if ((targetHash === '#case-home' || contentLoader.querySelector('#case-home')) && typeof attachSearchEventListeners === 'function') {
            attachSearchEventListeners();
            // 홈 최초 로드 시 검색 결과 영역 초기화
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
    if (!pageTitleH2 || !pageTitleP) return; // 제목 영역 요소 없으면 종료

    if (targetHash === '#case-home' || contentLoader.querySelector('#case-home')) {
        pageTitleH2.textContent = "NE능률 AI 업무 활용 사례집";
        pageTitleP.textContent = "NE능률 사내 AI 업무 활용 사례를 공유하고 확산하는 플랫폼입니다.";
    } else {
        // contentLoader 내부에서 직접 검색
        const cardElement = contentLoader.querySelector('.case-card'); // 로드된 카드를 찾음
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
    // 모든 링크 비활성화
    document.querySelectorAll('.app-sidebar-link.case-link, .sidebar-sub-category-header').forEach(link => {
        link.classList.remove('active');
         // 헤더의 aria-expanded 상태도 초기화 (펼쳐진 상태 유지 방지)
        if(link.classList.contains('sidebar-sub-category-header') || link.classList.contains('sidebar-mid-category-header')) {
            link.setAttribute('aria-expanded', 'false');
            link.classList.add('collapsed'); // 부트스트랩 클래스 추가
        }
    });

     // 대상 링크 찾기 및 활성화
    const targetLink = document.querySelector(`a.case-link[href="${targetHash}"]`);
    if (!targetLink) return;
    targetLink.classList.add('active');

    // 부모 메뉴 펼치기 (Bootstrap 5 API 사용)
    let currentElement = targetLink;
    while (currentElement && currentElement.classList) { // currentElement가 유효하고 classList 속성이 있는지 확인
        const collapsibleParent = currentElement.closest('.collapse');
         if (collapsibleParent) {
            const collapseInstance = bootstrap.Collapse.getOrCreateInstance(collapsibleParent);
            collapseInstance.show();
             // 해당 collapse를 제어하는 헤더(버튼) 상태 업데이트
            const header = collapsibleParent.previousElementSibling;
             if (header && header.hasAttribute('data-bs-toggle')) {
                header.setAttribute('aria-expanded', 'true');
                header.classList.remove('collapsed');
            }
            currentElement = header; // 부모 헤더로 이동하여 계속 탐색
        } else {
            currentElement = currentElement.parentElement; // 일반 부모로 이동하여 계속 탐색
        }
    }
}


// --- DOMContentLoaded 이벤트 리스너 시작 ---
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const allCaseLinks = document.querySelectorAll('.app-sidebar-link.case-link');
    const logoLink = document.querySelector('.app-logo');

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
        // 모든 콜랩스 메뉴 접기
        document.querySelectorAll('.sidebar-submenu.show, .sidebar-case-list.show').forEach(element => {
            const collapseInstance = bootstrap.Collapse.getInstance(element);
            if (collapseInstance) {
                collapseInstance.hide();
            }
            const header = element.previousElementSibling;
            if (header && header.hasAttribute('data-bs-toggle')) {
                header.classList.add('collapsed');
                header.setAttribute('aria-expanded', 'false');
            }
        });

        // 홈 콘텐츠 로드 (전역 loadContent 함수 호출)
        if (logoLink && logoLink.dataset.src && logoLink.getAttribute('href')) {
            loadContent(logoLink.dataset.src, logoLink.getAttribute('href'));
        } else {
            console.warn("Logo link missing data-src or href, loading default home.");
            loadContent('cases/case-home.html', '#case-home');
        }
         // 홈으로 갈 때는 모든 사이드바 링크 비활성화
        updateActiveLink('');
    }

    // --- 이벤트 리스너 연결 (페이지 최초 로드 시) ---

    // 1. 사이드바의 '사례' 링크 클릭 시
    allCaseLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            if (this.classList.contains('disabled')) return;

            const srcUrl = this.dataset.src;
            const targetHash = this.getAttribute('href');

            loadContent(srcUrl, targetHash); // 전역 loadContent 함수 호출

            // 모바일에서 링크 클릭 시 사이드바 닫기
            if (window.innerWidth <= 991 && sidebar?.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    });

    // 2. 로고 클릭 시 (홈으로)
    if (logoLink) {
        logoLink.addEventListener('click', function (event) {
            event.preventDefault();
            showDefaultContent(); // 홈 콘텐츠 표시 및 사이드바 메뉴 닫기
        });
    }

    // --- 초기 실행 ---
    // search.js의 함수를 호출하여 사례 데이터 파싱
    if (typeof parseAllCasesData === 'function') {
        parseAllCasesData();
    } else {
        console.error("parseAllCasesData function not found in search.js. Check loading order.");
    }

    // 페이지 첫 로드 시 홈 콘텐츠 표시
    showDefaultContent();
    // 검색 이벤트 리스너는 loadContent 함수 내에서 홈 로드 시 호출됨

}); // --- DOMContentLoaded 이벤트 리스너 끝 ---
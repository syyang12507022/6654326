document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const contentLoader = document.getElementById('content-loader'); // 콘텐츠가 로드될 영역
    const pageTitleH2 = document.querySelector('#pageTitleArea h2');
    const pageTitleP = document.querySelector('#pageTitleArea p');
    const allCaseLinks = document.querySelectorAll('.app-sidebar-link.case-link');
    const logoLink = document.querySelector('.app-logo');

    // --- 모바일 사이드바 토글 (기존 코드) ---
    if (sidebarToggleMobile) {
        sidebarToggleMobile.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }
    window.addEventListener('resize', function () {
        if (window.innerWidth > 991 && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    // --- (여기까지) ---


    /**
     * [NEW] 콘텐츠를 로드하고 화면에 표시하는 함수
     * @param {string} srcUrl - 불러올 HTML 파일 경로 (예: 'cases/case-home.html')
     * @param {string} targetHash - 활성화할 링크의 href (예: '#case-home')
     */
    async function loadContent(srcUrl, targetHash) {
        if (!srcUrl) return; // data-src가 없으면 실행 중지

        try {
            // 1. fetch API로 HTML 파일 내용을 가져옴
            const response = await fetch(srcUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const html = await response.text();

            // 2. 가져온 HTML을 contentLoader에 삽입
            contentLoader.innerHTML = html;

            // 3. 페이지 상단 제목 업데이트
            updatePageTitle(contentLoader, targetHash);

            // 4. 활성 링크 업데이트
            updateActiveLink(targetHash);
            
            // 5. 콘텐츠 로드 후 화면 상단으로 스크롤
            window.scrollTo(0, 0); 

        } catch (error) {
            console.error('Failed to load content:', error);
            contentLoader.innerHTML = `<div class="alert alert-danger">콘텐츠를 불러오는 데 실패했습니다. (${srcUrl})</div>`;
        }
    }

    /**
     * [NEW] 페이지 제목 영역 업데이트
     */
    function updatePageTitle(contentElement, targetHash) {
        // targetHash가 '#case-home'이거나, 로드된 콘텐츠에 #case-home ID가 있는지 확인
        if (targetHash === '#case-home' || contentElement.querySelector('#case-home')) {
            pageTitleH2.textContent = "NE능률 AI 업무 활용 사례집";
            pageTitleP.textContent = "NE능률 사내 AI 업무 활용 사례를 공유하고 확산하는 플랫폼입니다.";
        } else {
            const cardTitle = contentElement.querySelector('h2')?.innerText || "사례 상세";
            const cardBadge = contentElement.querySelector('.badge:last-of-type')?.innerText || "AI 활용";
            pageTitleH2.textContent = cardBadge + " 사례";
            pageTitleP.textContent = cardTitle + " 상세 내용입니다.";
        }
    }

    /**
     * [NEW] 사이드바 링크 활성 상태 업데이트 및 부모 메뉴 펼치기
     */
    function updateActiveLink(targetHash) {
        document.querySelectorAll('.app-sidebar-link, .sidebar-sub-category-header').forEach(link => {
            link.classList.remove('active');
        });

        const targetLink = document.querySelector(`a.case-link[href="${targetHash}"]`);
        if (!targetLink) return;

        targetLink.classList.add('active');

        // [기존 코드 활용] 부모 메뉴 펼치기
        let parentCaseList = targetLink.closest('.sidebar-case-list');
        if (parentCaseList && !parentCaseList.classList.contains('show')) {
            const subCategoryHeader = parentCaseList.previousElementSibling;
            new bootstrap.Collapse(parentCaseList, { toggle: false }).show();
            if(subCategoryHeader) subCategoryHeader.setAttribute('aria-expanded', 'true');
        }
        
        let parentSubMenu = targetLink.closest('.sidebar-submenu');
        if (parentSubMenu && !parentSubMenu.classList.contains('show')) {
            const midCategoryHeader = parentSubMenu.previousElementSibling;
            new bootstrap.Collapse(parentSubMenu, { toggle: false }).show();
            if(midCategoryHeader) midCategoryHeader.setAttribute('aria-expanded', 'true');
        }
    }

    /**
     * [NEW] 기본 콘텐츠(홈) 표시
     */
    function showDefaultContent() {
        // 모든 콜랩스 메뉴 접기 (기존 코드)
        document.querySelectorAll('.sidebar-submenu.show, .sidebar-case-list.show').forEach(element => {
            const collapseInstance = bootstrap.Collapse.getInstance(element) || new bootstrap.Collapse(element, { toggle: false });
            collapseInstance.hide();
            if (element.previousElementSibling) element.previousElementSibling.setAttribute('aria-expanded', 'false');
        });

        // 홈 콘텐츠 로드
        if(logoLink) {
             loadContent(logoLink.dataset.src, logoLink.getAttribute('href'));
        } else {
            // 로고 링크가 없는 비상시 홈 로드
             loadContent('cases/case-home.html', '#case-home');
        }
    }

    // --- 이벤트 리스너 연결 ---

    // 1. 사이드바의 '사례' 링크 클릭 시
    allCaseLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            if (this.classList.contains('disabled')) return;

            const srcUrl = this.dataset.src; // data-src 속성에서 파일 경로 가져오기
            const targetHash = this.getAttribute('href');

            loadContent(srcUrl, targetHash); // 콘텐츠 로드 함수 호출

            // 모바일에서 링크 클릭 시 사이드바 닫기
            if (window.innerWidth <= 991 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    });

    // 2. 로고 클릭 시 (홈으로)
    if (logoLink) {
        logoLink.addEventListener('click', function (event) {
            event.preventDefault();
            showDefaultContent();
        });
    }

    // --- 초기 실행 ---
    showDefaultContent(); // 페이지 첫 로드 시 홈 콘텐츠 표시
});
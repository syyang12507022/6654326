/**
 * js/disclaimer.js (수정버전)
 */
document.addEventListener('DOMContentLoaded', () => {
    const contentLoader = document.getElementById('content-loader');

    if (!contentLoader) {
        console.error('Disclaimer script: #content-loader 요소를 찾을 수 없습니다.');
        return;
    }

    // 면책사항 HTML (수정사항 반영)
    const disclaimerHTML = `
<div class="disclaimer-container alert alert-warning mt-5 mx-3" 
     style="font-size: 0.9rem; background-color: #fff3cd !important; color: #664d03 !important; border-color: #ffecb5 !important;">
    <h6 class="alert-heading" 
        style="font-weight: bold; font-size: 1.25rem; color: #664d03 !important; margin-left: 0.3rem;">
        면책조항
    </h6>
    <hr style="border-top-color: #ffecb5 !important; margin-top: 0.4rem; margin-bottom: 0.8rem;">
    <div style="margin-left: 0.3rem;">
        <p class="mb-2">본 "AI 업무 자동화 사례집"(이하 '본 자료')은 AI 활용 교육에 참여한 임직원들의 발표 내용과 제출 자료(PPT 등)를 바탕으로 참고 및 교육 목적으로 재구성되었습니다.</p>
        <p class="mb-2">본 자료에 포함된 정보는 다음과 같은 한계를 가질 수 있으며, 이용자는 다음 사항을 충분히 인지하고 본 자료를 활용해야 합니다.</p>
        <ol class="mb-0" style="padding-left: 1.2rem; list-style-type: decimal;">
            <li class="mb-2"><strong>정보의 목적:</strong> 본 자료는 정보 제공 및 교육적 참고를 목적으로만 제공되며, 특정 상황에 대한 전문적인 비즈니스 조언이나 컨설팅을 대체할 수 없습니다.</li>
            <li class="mb-2"><strong>내용의 정확성:</strong> 본 자료의 내용은 참여자의 발표를 기반으로 하므로, 실제 업무 프로세스와 일부 차이가 있을 수 있으며, 그 정확성, 완전성, 최신성을 보장하지 않습니다.</li>
            <li class="mb-2"><strong>결과 미보장:</strong> 사례에 언급된 성과(예: 업무 효율화 수치, 비용 절감 등)는 특정 조건 하에서 달성된 것이며, 본 자료의 내용을 적용한다고 해서 동일하거나 유사한 결과가 보장되는 것은 아닙니다.</li>
            <li class="mb-2"><strong>책임의 한계:</strong> 본 자료의 발행처는 본 자료에 포함된 정보의 사용이나 신뢰로 인해 발생하는 어떠한 직간접적인 손해, 손실, 또는 문제에 대해서도 법적 책임을 지지 않습니다. 모든 결정과 행동에 대한 최종 책임은 자료 이용자 본인에게 있습니다.</li>
            <li class="mb-2"><strong>내용의 변경:</strong> 본 자료의 내용은 향후 사전 고지 없이 수정되거나 변경될 수 있습니다.</li>
        </ol>
    </div>
</div>
    `;

    const addDisclaimer = () => {
        const caseCard = contentLoader.querySelector('.case-card');
        if (!caseCard || caseCard.id === 'case-home') {
            const existingDisclaimer = contentLoader.querySelector('.disclaimer-container');
            if (existingDisclaimer) existingDisclaimer.remove();
            return;
        }
        if (caseCard && !caseCard.querySelector('.disclaimer-container')) {
            caseCard.insertAdjacentHTML('beforeend', disclaimerHTML);
        }
    };

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                addDisclaimer();
                break;
            }
        }
    });

    observer.observe(contentLoader, { childList: true });
    addDisclaimer();
});

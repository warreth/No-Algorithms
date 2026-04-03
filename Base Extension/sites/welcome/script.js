document.addEventListener('DOMContentLoaded', () => {
    const isFirefox = typeof InstallTrigger !== 'undefined' || navigator.userAgent.toLowerCase().includes('firefox');
    
    const browserNameSpan = document.getElementById('browser-name');
    const firefoxInstructions = document.getElementById('firefox-instructions');
    const chromeInstructions = document.getElementById('chrome-instructions');
    const closeBtn = document.getElementById('close-btn');
    const stepBtns = document.querySelectorAll('.step-btn');

    if (isFirefox) {
        browserNameSpan.textContent = "Firefox";
        firefoxInstructions.classList.remove('hidden');
    } else {
        browserNameSpan.textContent = "Chrome / Edge";
        chromeInstructions.classList.remove('hidden');
    }

    stepBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
                step.classList.add('hidden');
            });
            const nextStep = document.getElementById(targetId);
            if (nextStep) {
                nextStep.classList.remove('hidden');
                nextStep.classList.add('active');
            }
        });
    });

    closeBtn.addEventListener('click', () => {
        window.close();
    });
});

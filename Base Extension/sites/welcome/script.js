document.addEventListener('DOMContentLoaded', () => {
    // Detect OS
    const platform = navigator.userAgent.toLowerCase();
    let osKey = 'linux';
    let osLabel = 'Linux';
    if (platform.includes('win')) {
        osKey = 'win';
        osLabel = 'Windows';
    } else if (platform.includes('mac')) {
        osKey = 'mac';
        osLabel = 'macOS';
    }

    // Detect Browser Engine
    const isFirefoxEngine = typeof InstallTrigger !== 'undefined' || navigator.userAgent.toLowerCase().includes('firefox');
    
    // Toggle correct browser selection list in step 3
    const fxBrowsers = document.getElementById('firefox-browsers');
    const crBrowsers = document.getElementById('chrome-browsers');
    if (fxBrowsers && crBrowsers) {
        if (isFirefoxEngine) {
            fxBrowsers.style.display = 'flex';
        } else {
            crBrowsers.style.display = 'flex';
        }
    }

    // Handle initial browser selection (Step 3 to Step 4)
    const browserBtns = document.querySelectorAll('.browser-btn');
    browserBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const browserType = e.target.getAttribute('data-browser');
            const browserName = e.target.textContent;

            // Set UI Labels for Step 4
            document.getElementById('browser-name').textContent = browserName;
            document.getElementById('os-name').textContent = osLabel;

            // Trigger specific instructions based on OS + selected Browser
            setupInstructions(isFirefoxEngine, browserType, osKey, browserName);

            // Move to Step 4
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
                step.classList.add('hidden');
            });
            const nextStep = document.getElementById('step-4');
            if (nextStep) {
                nextStep.classList.remove('hidden');
                nextStep.classList.add('active');
            }
        });
    });

    function setupInstructions(isFirefox, browserType, osKey, browserName) {
        // Reset actives
        document.querySelectorAll('.os-instruction').forEach(el => el.classList.remove('active'));
        
        if (isFirefox) {
            document.getElementById('instr-firefox').classList.add('active');
            
            if (['fx-other', 'waterfox', 'librewolf'].includes(browserType)) {
                const otherElement = document.getElementById('fx-other');
                if (otherElement) otherElement.classList.add('active');
            } else {
                const osElement = document.getElementById(`fx-${osKey}`);
                if (osElement) osElement.classList.add('active');
            }
        } else {
            document.getElementById('instr-chrome').classList.add('active');
            const osElement = document.getElementById(`cr-${osKey}`);
            if (osElement) osElement.classList.add('active');
            
            // Dynamically get Chrome extension ID
            const extId = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) 
                ? chrome.runtime.id 
                : "YOUR_EXTENSION_ID";

            const updateStr = `${extId};https://clients2.google.com/service/update2/crx`;
            
            // Determine Correct Paths based on Selection
            let regPath = `HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist`;
            let macDomain = `com.google.Chrome`;
            let linuxPath = `/etc/opt/chrome/policies/managed/`;

            if (browserType === 'chromium' || browserType === 'cr-other') {
                regPath = `HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Chromium\\ExtensionInstallForcelist`;
                macDomain = `org.chromium.Chromium`;
                linuxPath = `/etc/chromium/policies/managed/`;
            } else if (browserType === 'brave') {
                regPath = `HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\BraveSoftware\\Brave\\ExtensionInstallForcelist`;
                macDomain = `com.brave.Browser`;
                linuxPath = `/etc/brave/policies/managed/`;
            } else if (browserType === 'edge') {
                regPath = `HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Edge\\ExtensionInstallForcelist`;
                macDomain = `com.microsoft.Edge`;
                linuxPath = `/etc/opt/edge/policies/managed/`;
            }

            // Write actual DOM Elements
            if (osKey === 'win') {
                const regPathEl = document.getElementById('win-reg-path');
                if (regPathEl) regPathEl.textContent = regPath;
                const updateStrEl = document.getElementById('win-update-str');
                if (updateStrEl) updateStrEl.textContent = updateStr;
            } else if (osKey === 'mac') {
                const macCmdEl = document.getElementById('mac-cmd-str');
                if (macCmdEl) macCmdEl.textContent = `defaults write ${macDomain} ExtensionInstallForcelist -array "${updateStr}"`;
            } else {
                const linuxMkdirEl = document.getElementById('linux-cmd-mkdir');
                if (linuxMkdirEl) linuxMkdirEl.textContent = `sudo mkdir -p ${linuxPath}`;
                const linuxNanoEl = document.getElementById('linux-cmd-nano');
                if (linuxNanoEl) linuxNanoEl.textContent = `sudo nano ${linuxPath}lock_extension.json`;
                const linuxUpdateEl = document.getElementById('linux-update-str');
                if (linuxUpdateEl) linuxUpdateEl.textContent = `{
  "ExtensionInstallForcelist": [
    "${extId};https://clients2.google.com/service/update2/crx"
  ]
}`;
                const linuxUndoEl = document.getElementById('linux-cmd-undo');
                if (linuxUndoEl) linuxUndoEl.textContent = `sudo rm ${linuxPath}lock_extension.json`;
            }
        }
    }

    // Normal Step navigation handling
    const stepBtns = document.querySelectorAll('.step-btn');
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

    document.getElementById('close-btn').addEventListener('click', () => {
        window.close();
    });
});

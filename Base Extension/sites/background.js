function openWelcomePage() {
    try {
        console.log("Attempting to open welcome page...");
        chrome.tabs.create({ url: chrome.runtime.getURL('sites/welcome/index.html') }, () => {
            if (chrome.runtime.lastError) {
                console.warn("Retrying owing to error:", chrome.runtime.lastError);
                setTimeout(openWelcomePage, 500);
            }
        });
    } catch (e) {
        console.error("Tab create threw:", e);
        setTimeout(openWelcomePage, 500);
    }
}

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        openWelcomePage();
    } else if (details.reason === 'update') {
        // Only open on update if we are actively developing the extension (unpacked)
        chrome.management.getSelf((self) => {
            if (self.installType === 'development') {
                openWelcomePage();
            }
        });
    }
});

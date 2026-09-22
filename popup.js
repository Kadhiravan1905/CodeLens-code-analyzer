document.getElementById("openPanel").addEventListener("click", async () => {
    await chrome.sidePanel.open({
        windowId: chrome.windows.WINDOW_ID_CURRENT
    });

    window.close();
});
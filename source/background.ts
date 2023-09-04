function downloadAndClose(data: string, tabId: number) {
    let downloadId;

    function onChanged(delta: chrome.downloads.DownloadDelta) {
        if (delta.id === downloadId && delta.state?.current !== 'in_progress') {
            chrome.downloads.onChanged.removeListener(onChanged);
            chrome.tabs.remove(tabId);
        }
    };
    chrome.downloads.onChanged.addListener(onChanged);

    chrome.offscreen.createDocument({
        url: chrome.runtime.getURL("offscreen.html"),
        reasons: [chrome.offscreen.Reason.BLOBS],
        justification: "download saml payload.",
      }, () => {
            chrome.runtime.sendMessage({ data: data}, (response) => {
                const url = response.url;
                chrome.downloads.download({ url: url, filename: "saml.txt", saveAs: false }, (id) => {
                    downloadId = id;
                    chrome.offscreen.closeDocument();
                });
            });
        }
    );
    
}

function addTabListener(details: chrome.webRequest.WebRequestBodyDetails) {
    let tabId = details.tabId;
    let timeLimit = Date.now() + (10 * 60 * 1000);
    function handleTabRequests(details: chrome.webRequest.WebRequestBodyDetails){
        if (details.tabId === tabId && details?.requestBody?.formData?.SAMLResponse !== undefined){
            chrome.webRequest.onBeforeRequest.removeListener(handleTabRequests);
            downloadAndClose(details.requestBody.formData.SAMLResponse[0], tabId);
        }
    }
    chrome.webRequest.onBeforeRequest.addListener(
        handleTabRequests,
        { urls: ['http://*/*', 'https://*/*'] },
        ['requestBody']
      );

    setInterval(() => {
        if(Date.now() >= timeLimit) {
            chrome.webRequest.onBeforeRequest.removeListener(handleTabRequests);
        }
    }, 2000);

    //chrome.tabs.update(tabId, {active: true});
    //chrome.tabs.get(tabId).then((tab) => {
    //    chrome.windows.update(tab.windowId, {focused: true});
    //});
    let ending = "SAMLDOWNLOAD";
    let newUrl = details.url.slice(0, -ending.length);
    return {redirectUrl: newUrl};
}

chrome.webRequest.onBeforeRequest.addListener(
    addTabListener,
    {urls: ["*://*/*SAMLDOWNLOAD"]},
    []
  );
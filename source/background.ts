function downloadAndClose(data: string, tabId: number) {
    let downloadId;

    function onChanged(delta: chrome.downloads.DownloadDelta) {
        if (delta.id === downloadId && delta.state?.current !== 'in_progress') {
            chrome.downloads.onChanged.removeListener(onChanged);
            chrome.tabs.remove(tabId);
        }
    };
    chrome.downloads.onChanged.addListener(onChanged);

    let jsonBlob = new Blob( [data], { type : "application/json" });
    let objectURL = window.URL.createObjectURL(jsonBlob);
    chrome.downloads.download({ url: objectURL, filename: "saml.txt", saveAs: false }, (id) => {
        downloadId = id;
    });
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
    ["blocking"]
  );
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log("in offscreen");
    const jsonBlob = new Blob( [message.data], { type : "application/json" });
    const objectURL = URL.createObjectURL(jsonBlob);
    sendResponse({ url: objectURL });
    return true;
  });
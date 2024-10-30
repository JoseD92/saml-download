chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    try {
      console.log("in offscreen");
      const jsonBlob = new Blob( [message.data], { type : "application/json" });
      const objectURL = URL.createObjectURL(jsonBlob);
      console.log(objectURL);
      sendResponse({ url: objectURL });
      return true;
    }
    catch (e){
      console.log("from offscreen page: got exception: " + e);
      throw e;
    }
  });
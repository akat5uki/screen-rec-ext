chrome.browserAction.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 500,
    height: 400
  });
});

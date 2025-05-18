chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'popup.html', // This will resolve correctly if Vite builds it to dist/
    type: 'popup',
    width: 500,
    height: 400
  });
});

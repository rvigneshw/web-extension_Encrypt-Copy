function handleMessage(request, sender, sendResponse) {
    document.activeElement.value = request.content;
}
browser.runtime.onMessage.addListener(handleMessage);
import { AES, enc } from "crypto-js";

const ENC_COPY_ID_CM = "enc-copy-cm";
const ENC_COPY_ID_KC = "enc-copy-kc";
const DEC_PASTE_ID_CM = "dec-paste-cm";
const DEC_PASTE_ID_KC = "dec-paste-kc";
let SECRET_TOKEN = null;

browser.runtime.onMessage.addListener(handleMessages);
browser.runtime.onInstalled.addListener((details) => {

  if (details.temporary) {
    setTempDataForTesting();
    printDebugInfo();
    browser.tabs.create({ url: '../pages/popup.html' });
  } else {
    if (details.reason == "install") {
      initializeTheSecretToken();
    } else if (details.reason == "update") {
      onUpdate();
    }
  }
});

createContextMenus();
addListenersToContextMenu();
addListenersToKeyboardCommands();


function handleMessages(request, sender, sendResponse) {
  console.log(request)
  if (request.type == "DAV") {
    decryptAndSendResponse(request, sendResponse);
  } else if (request.type == "CLR_RST") {
    clearAndReset(sendResponse);
  }
}
function onUpdate() {
  browser.tabs.create({ url: '../pages/intro.html#changelog' });
}
function decryptAndSendResponse(request, sendResponse) {
  if (SECRET_TOKEN == null) {
    setTheSecretToken();
  }
  try {
    var bytes = AES.decrypt(request.content, SECRET_TOKEN);
    var originalText = bytes.toString(enc.Utf8);
    console.log(originalText);
    console.log(request.content);
    sendResponse({ response: originalText });
  } catch (error) {
    console.log(error)
  }
}

function addListenersToKeyboardCommands() {
  browser.commands.onCommand.addListener(function (command) {
    if (command === "enc-copy") {
      browser.tabs.executeScript({
        code: "window.getSelection().toString();"
      }, function (selection) {
        var textValue = selection[0];
        encryptAndCopyToClipboard(textValue);
        console.log(textValue);
      });
    }
    else if (command === "dec-paste") {
      decryptAndPasteFromClipboard();
    }
  });
}

function addListenersToContextMenu() {
  browser.contextMenus.onClicked.addListener(function (info, tab) {
    switch (info.menuItemId) {
      case ENC_COPY_ID_CM:
        encryptAndCopyToClipboard(info.selectionText);
        break;
      case DEC_PASTE_ID_CM:
        decryptAndPasteFromClipboard();
        break;
    }
  });
}

function createContextMenus() {
  browser.contextMenus.create({
    id: ENC_COPY_ID_CM,
    title: "Encrypt and Copy",
    contexts: ["selection"]
  }, onCreated);
  browser.contextMenus.create({
    id: DEC_PASTE_ID_CM,
    title: "Decrypt and Paste",
    contexts: ["editable"]
  }, onCreated);
}

function initializeTheSecretToken() {
  var secret_string = randomString(30);
  SECRET_TOKEN = secret_string;
  browser.storage.local.set({
    secret_phrase: secret_string,
    copied_items: [],
    settings: {
      history: true
    }
  });
  browser.tabs.create({ url: '../pages/intro.html' });
}
function clearAndReset(response) {
  var secret_string = randomString(30);
  SECRET_TOKEN = secret_string;
  browser.storage.local.set({
    secret_phrase: secret_string,
    copied_items: [],
    settings: {
      history: true,
      decrypt: false
    }
  }).then(() => {
    response({ response: "Done" });
  });
}

function setTempDataForTesting() {
  var secret_string = randomString(30);
  console.log("installed");
  SECRET_TOKEN = secret_string;
  browser.storage.local.set({
    copied_items: getTempData()
  });
}

function encryptAndCopyToClipboard(textValue) {
  try {
    if (SECRET_TOKEN == null) {
      setTheSecretToken();
    }
    encryptText();
  } catch (error) {
    console.log(error);
  }

  function encryptText() {
    var encrypted_data = AES
      .encrypt(textValue, SECRET_TOKEN).toString();
    console.log("Orginal Text:" + textValue);
    console.log("Enc Data:" + encrypted_data);
    copyToClipboard(encrypted_data);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function () {
    browser.storage.local.get().then((data) => {
      if (data.settings.history) {
        if (data.copied_items) {
          var local_copied_items = data.copied_items;
          var new_item = {
            time: new Date().toLocaleString(),
            data: text
          }
          local_copied_items.push(new_item);
          browser.storage.local.set({
            copied_items: local_copied_items
          });
          console.log(local_copied_items);
        }
      }
    });
  }, function () {
    /* clipboard write failed */
  });
}
function decryptAndPasteFromClipboard() {
  navigator.clipboard.readText().then((text) => {
    if (SECRET_TOKEN == null) {
      setTheSecretToken();
    }
    decryptAndSendData(text);
  });

  function decryptAndSendData(text) {
    var originalText = decryptText(text);
    console.log("Enc Data:" + text);
    console.log("Dec Data:" + originalText);
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      browser.tabs.sendMessage(tabs[0].id, { content: originalText }, function (response) { });
    });
  }
}

function decryptText(text) {
  var bytes = AES.decrypt(text, SECRET_TOKEN);
  var originalText = bytes.toString(enc.Utf8);
  return originalText;
}

function randomString(length) {
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

function onCreated(p) {

}

function getTempData(params) {

  // return [
  //   {
  //     "time": "6/29/2020, 10:40:03 PM",
  //     "data": "U2FsdGVkX19x9UPQbfjJags1A3NVgMcyir2juzpwe68="
  //   },
  //   {
  //     "time": "6/29/2020, 10:40:06 PM",
  //     "data": "U2FsdGVkX1+JXJBICXKquVV84nzzyEhTU0fVw1Eq8dU="
  //   },
  //   {
  //     "time": "6/29/2020, 10:40:08 PM",
  //     "data": "U2FsdGVkX1+JxbBf47d/KPe36p6p/72TA6oirojf9n0="
  //   }
  // ]
  return [];
}

function printDebugInfo() {
  console.log("SECRET_TOKEN : " + SECRET_TOKEN)
}

function setTheSecretToken() {
  browser.storage.local.get().then((data) => {
    if (data.secret_phrase) {
      SECRET_TOKEN = data.secret_phrase;
    }
  });
}
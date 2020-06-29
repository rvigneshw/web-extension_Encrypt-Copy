var CryptoJS = require("crypto-js");

const ENC_COPY_ID = "enc-copy-cm";
const DEC_PASTE_ID = "dec-paste-cm";
let SECRET_TOKEN = null;

browser.runtime.onInstalled.addListener((details) => {
  var date = new Date();
  var secret_string = date.toISOString()
  console.log("installed");
  browser.storage.local.set({
    secret_phrase: secret_string,
    copied_items: []
  });
  SECRET_TOKEN = secret_string;
});

console.log(window)
browser.contextMenus.create({
  id: ENC_COPY_ID,
  title: "Encrypt and Copy",
  contexts: ["selection"]
}, onCreated);

browser.contextMenus.create({
  id: DEC_PASTE_ID,
  title: "Decrypt and Paste",
  contexts: ["editable"]
}, onCreated);

browser.contextMenus.onClicked.addListener(function (info, tab) {
  switch (info.menuItemId) {
    case ENC_COPY_ID:
      encryptAndCopyToClipboard(info.selectionText);
      break;
    case DEC_PASTE_ID:
      decryptAndPasteFromClipboard();
      break;
  }
});

browser.commands.onCommand.addListener(function (command) {
  if (command === ENC_COPY_ID) {
    browser.tabs.executeScript({
      code: "window.getSelection().toString();"
    }, function (selection) {
      var textValue = selection[0]
      encryptAndCopyToClipboard(textValue)
      console.log(textValue);
    });
  } else if (command === DEC_PASTE_ID) {
    decryptAndPasteFromClipboard();
  }
});

function encryptAndCopyToClipboard(textValue) {
  try {
    var encrypted_data = CryptoJS.AES
      .encrypt(textValue, SECRET_TOKEN).toString();

    console.log("Orginal Text:" + textValue);
    console.log("Enc Data:" + encrypted_data);
    copyToClipboard(encrypted_data);

  } catch (error) {
    console.log(error);
  }
}

function copyToClipboard(text) {

  navigator.clipboard.writeText(text).then(function () {
    /* clipboard successfully set */
  }, function () {
    /* clipboard write failed */
  });

}
function decryptAndPasteFromClipboard() {
  navigator.clipboard.readText().then((text) => {
    var bytes = CryptoJS.AES.decrypt(text, SECRET_TOKEN);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    console.log("Enc Data:" + text);
    console.log("Dec Data:" + originalText);
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      browser.tabs.sendMessage(tabs[0].id, { content: originalText }, function (response) { });
    });
  });
}

function handleResponse(message) {
  console.log(`Message from the background script:  ${message.response}`);
}

function handleError(error) {
  console.log(`Error: ${error}`);
}


function onCreated(p) {

}
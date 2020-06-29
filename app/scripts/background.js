var CryptoJS = require("crypto-js");

const ENC_COPY_ID = "enc-copy-cm";
const DEC_PASTE_ID = "dec-paste-cm";
let SECRET_TOKEN = null;

browser.runtime.onInstalled.addListener((details) => {
  initializeTheSecretToken();
  browser.tabs.create({ url: '../pages/popup.html' });
  if (details.temporary) {
    setTempDataForTesting();
  } else {

  }
});

createContextMenus();
addListenersToContextMenu();
addListenersToKeyboardCommands();


function addListenersToKeyboardCommands() {
  browser.commands.onCommand.addListener(function (command) {
    if (command === ENC_COPY_ID) {
      browser.tabs.executeScript({
        code: "window.getSelection().toString();"
      }, function (selection) {
        var textValue = selection[0];
        encryptAndCopyToClipboard(textValue);
        console.log(textValue);
      });
    }
    else if (command === DEC_PASTE_ID) {
      decryptAndPasteFromClipboard();
    }
  });
}

function addListenersToContextMenu() {
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
}

function createContextMenus() {
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
}

function initializeTheSecretToken() {
  var secret_string = randomString(30);
  console.log("installed");
  SECRET_TOKEN = secret_string;
  browser.storage.local.set({
    secret_phrase: secret_string,
    copied_items: []
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
      setTheSecretTokenAndEncryptText();
    } else {
      encryptText();
    }
  } catch (error) {
    console.log(error);
  }

  function setTheSecretTokenAndEncryptText() {
    browser.storage.local.get(data => {
      if (data.secret_phrase) {
        SECRET_TOKEN = data.secret_phrase;
        encryptText();
      }
    });
  }

  function encryptText() {
    var encrypted_data = CryptoJS.AES
      .encrypt(textValue, SECRET_TOKEN).toString();
    console.log("Orginal Text:" + textValue);
    console.log("Enc Data:" + encrypted_data);
    copyToClipboard(encrypted_data);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function () {
    browser.storage.local.get(data => {
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
    });
  }, function () {
    /* clipboard write failed */
  });
}
function decryptAndPasteFromClipboard() {
  navigator.clipboard.readText().then((text) => {
    if (SECRET_TOKEN == null) {
      setTheSecretTokenAndDecryptText(text);
    } else {
      decryptAndSendData(text);
    }
  });

  function setTheSecretTokenAndDecryptText(text) {
    browser.storage.local.get(data => {
      if (data.secret_phrase) {
        SECRET_TOKEN = data.secret_phrase;
        decryptAndSendData(text);
      }
    });
  }

  function decryptAndSendData(text) {
    var bytes = CryptoJS.AES.decrypt(text, SECRET_TOKEN);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    console.log("Enc Data:" + text);
    console.log("Dec Data:" + originalText);
    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      browser.tabs.sendMessage(tabs[0].id, { content: originalText }, function (response) { });
    });
  }
}

function randomString(length) {
  return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
}

function onCreated(p) {

}

function getTempData(params) {

  return [
    {
      "time": "6/29/2020, 10:40:03 PM",
      "data": "U2FsdGVkX19x9UPQbfjJags1A3NVgMcyir2juzpwe68="
    },
    {
      "time": "6/29/2020, 10:40:06 PM",
      "data": "U2FsdGVkX1+JXJBICXKquVV84nzzyEhTU0fVw1Eq8dU="
    },
    {
      "time": "6/29/2020, 10:40:08 PM",
      "data": "U2FsdGVkX1+JxbBf47d/KPe36p6p/72TA6oirojf9n0="
    }
  ]
}
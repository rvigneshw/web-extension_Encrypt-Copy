function attachEventListenerTo(className, eventHandler) {
    var allIcons = document.getElementsByClassName(className);
    for (let i = 0; i < allIcons.length; i++) {
        allIcons[i].addEventListener('click', eventHandler);
    }
}

function handleDVclick(event) {
    var encData = event.srcElement.dataset.data;
    decryptAndView(encData, event);
}
function handleCCEclick(event) {
    var encData = event.srcElement.dataset.data;
    copyToClipboard(encData);
}
function handleCCDclick(event) {
    var encData = event.srcElement.dataset.data;
    decryptAndCopyToClipboard(encData);
}
function handleDELclick(event) {
    var timeStampData = event.srcElement.dataset.timestamp;
    deleteItemFromStorage(timeStampData);
}

const EVENT_LISTENER_ARRAY = [
    {
        "class": "d_v_btn",
        "handler": handleDVclick
    },
    {
        "class": "cc_e_btn",
        "handler": handleCCEclick
    },
    {
        "class": "cc_d_btn",
        "handler": handleCCDclick
    },
    {
        "class": "del_btn",
        "handler": handleDELclick
    }
]

function updateVersionText() {
    var version = browser.runtime.getManifest().version;
    document.getElementById("wand-tools-version-text")
        .innerHTML = `Version : ${version}`;
}


initialize();

function initialize() {
    browser.storage.local.get(data => {
        updateVersionText();
        var listItems = '';
        if (data.copied_items) {
            var local_copied_items = data.copied_items;
            document.getElementById("num_of_copied_items").innerText = local_copied_items.length;
            local_copied_items.forEach(element => {
                listItems += `<li>
            <div>
        <div class="uk-card uk-card-hover uk-card-default uk-card-small uk-card-body">
            <div class="uk-card-badge uk-label">${element.time}</div>
            <span class="uk-text-right uk-text-emphasis uk-text-primary"> 
                
                <div class="uk-inline">
                    <button  class="uk-button uk-button-small uk-button-secondary" type="button">More Options</button>
                    <div uk-dropdown="mode: click; boundary: ! .uk-button-group; boundary-align: true;">
                        <ul class="uk-nav uk-dropdown-nav">
                        <li><button data-timestamp="${element.time}" class="del_btn uk-button uk-button-small uk-button-danger uk-width-1-1 uk-margin-small-bottom">Delete</button></li>
                            <li><button data-data="${element.data}" class="d_v_btn uk-button uk-button-small uk-button-primary uk-width-1-1 uk-margin-small-bottom" type="button">
                            Decrypt and View
                            </button></li>
                            <li><button data-data="${element.data}" class="cc_e_btn uk-button uk-button-small uk-button-primary uk-width-1-1 uk-margin-small-bottom" type="button">
                            Copy to Clipboard (Encrypted Text)
                            </button></li>
                            <li><button data-data="${element.data}" class="cc_d_btn uk-button uk-button-small uk-button-primary uk-width-1-1 uk-margin-small-bottom" type="button">
                            Copy to Clipboard (Decrypted Text)
                            </button></li>
                        </ul>
                    </div>
                </div>
            </span>
            <p class="uk-text-break">${element.data}</p>
        </div>
    </div></li>`;
            });
            document.getElementById("history_items")
                .innerHTML = listItems;
            EVENT_LISTENER_ARRAY.forEach(element => {
                attachEventListenerTo(element.class, element.handler);
            });
        }
    });
}

function deleteItemFromStorage(timeStamp) {
    browser.storage.local.get(data => {
        if (data.copied_items) {
            var copied_list = data.copied_items;
            var copied_list_new = copied_list.filter(item => item.time !== timeStamp)
            browser.storage.local.set({
                copied_items: copied_list_new
            });
            initialize();
        }
    });
}

function decryptAndView(data, event) {
    console.log(data)
    browser.runtime.sendMessage({
        "type": "DAV",
        "content": data
    }).then(handleResponse);
    function handleResponse(message) {
        console.log(message)
        event.srcElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.lastElementChild.innerText = message.response
    }
}

function decryptAndCopyToClipboard(data) {
    console.log(data)
    browser.runtime.sendMessage({
        "type": "DAV",
        "content": data
    }).then(handleResponse);
    function handleResponse(message) {
        copyToClipboard(message.response);
    }
}



function handleError(error) {
    console.log(`Error: ${error}`);
}

function notifyBackgroundPage(e) {
    var sending = browser.runtime.sendMessage({
        greeting: "Greeting from the content script"
    });
    sending.then(handleResponse, handleError);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function () {

    }, function () {
        /* clipboard write failed */
    });
}
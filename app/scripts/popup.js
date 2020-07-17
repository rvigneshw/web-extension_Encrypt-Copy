import { AES, enc } from "crypto-js";
const DEBUG = true;
function attachEventListenerTo(className, event, eventHandler) {
    var allElements = document.getElementsByClassName(className);
    for (let i = 0; i < allElements.length; i++) {
        allElements[i].addEventListener(event, eventHandler);
    }
}
function changeToTick(img) {
    img.src = "../images/check.svg"
}
function handleDVclick(event) {
    var encData = event.srcElement.dataset.data;
    decryptAndView(encData, event);
    changeToTick(event.srcElement);
}
function handleCCEclick(event) {
    var encData = event.srcElement.dataset.data;
    copyToClipboard(encData);
    changeToTick(event.srcElement);
    d(event.srcElement);
}
function handleCCDclick(event) {
    var encData = event.srcElement.dataset.data;
    decryptAndCopyToClipboard(encData);
    changeToTick(event.srcElement);
}
function handleDELclick(event) {
    var timeStampData = event.srcElement.dataset.timestamp;
    deleteItemFromStorage(timeStampData);
    changeToTick(event.srcElement);
}
function handleSettingsChange(event) {
    var settings_history = getByID("settings_history");
    var updated_settings = {
        history: settings_history.checked,
        decrypt: settings_view_decrypt.checked
    }
    browser.storage.local.set({
        settings: updated_settings
    });
    initialize();
}
function handleClearReset() {
    browser.runtime.sendMessage({
        "type": "CLR_RST"
    }).then((res) => {
        initialize();
    });
}
function handleViewIntroPage() {
    browser.tabs.create({ url: '../pages/intro.html' });
}

const EVENT_LISTENER_ARRAY = [
    {
        "class": "d_v_btn",
        "event": "click",
        "handler": handleDVclick
    },
    {
        "class": "cc_e_btn",
        "event": "click",
        "handler": handleCCEclick
    },
    {
        "class": "cc_d_btn",
        "event": "click",
        "handler": handleCCDclick
    },
    {
        "class": "del_btn",
        "event": "click",
        "handler": handleDELclick
    },
    {
        "class": "clear_reset_btn",
        "event": "click",
        "handler": handleClearReset
    },
    {
        "class": "view_intro_btn",
        "event": "click",
        "handler": handleViewIntroPage
    },
    {
        "class": "settings-control",
        "event": "click",
        "handler": handleSettingsChange
    }
]

function updateVersionTextAndGreetings() {
    var version = browser.runtime.getManifest().version;
    getByID("wand-tools-version-text")
        .innerHTML = `Version : ${version}`;

    var greetdate = new Date()
    var hours = greetdate.getHours()
    var greetingText = '';

    if (hours < 12) {
        greetingText = 'Good Morning!';
    } else if (hours < 16) {
        greetingText = 'Good Afternoon!';
    } else if (hours < 20) {
        greetingText = 'Good Evening!';
    } else if (hours < 24) {
        greetingText = 'Good Night!';
    }
    getByID("greetings").innerHTML = greetingText;
}


initialize();

function initialize() {
    browser.storage.local.get().then((data) => {
        d(data);
        updateVersionTextAndGreetings();
        var listItems = '';
        if (data.copied_items) {
            var local_copied_items = data.copied_items;
            getByID("settings_history").checked = data.settings.history;
            getByID("num_of_copied_items").innerText = local_copied_items.length;
            local_copied_items.forEach(element => {

                listItems = generateCards(
                    listItems,
                    element.data,
                    element.time,
                    "",
                    data.settings.decrypt);

            });
            getByID("history_items")
                .innerHTML = listItems;
            EVENT_LISTENER_ARRAY.forEach(element => {
                attachEventListenerTo(element.class, element.event, element.handler);
            });
        }
    });

    function generateCards(listItems, data, time) {
        listItems += `<li>
            <div>
        <div class=" uk-card uk-card-hover uk-card-default uk-card-small uk-card-body" >
            <div class="uk-card-badge uk-label">${time}</div>
            <span class="uk-text-right uk-text-emphasis uk-text-primary"> 
                
                <div class="uk-inline icon-array">
                    
                    <img uk-tooltip="Delete this" class="icons-array-icons del_btn" src="../images/trash.svg" height="25px" width="25px" data-timestamp="${time}">
                    
                    <img uk-tooltip="Copy the decrypted data to clipboard" class="icons-array-icons cc_d_btn" src="../images/crypt-key.svg" height="25px" width="25px" data-data="${data}">
                                        
                    <img uk-tooltip="View the decrypted data" class="icons-array-icons d_v_btn" src="../images/visibility.svg" height="25px" width="25px" data-data="${data}">
                    
                    <img uk-tooltip="Copy the encrypted data to clipboard" class="icons-array-icons cc_e_btn" src="../images/copy.svg" height="25px" width="25px" data-data="${data}">

                </div>
            </span>
            <p class="uk-text-break">${data}</p>
        </div>
    </div></li>`;
        return listItems;
    }
}

function deleteItemFromStorage(timeStamp) {
    browser.storage.local.get().then((data) => {
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

    browser.runtime.sendMessage({
        "type": "DAV",
        "content": data
    }).then(handleResponse);
    function handleResponse(message) {

        event.srcElement.parentElement.parentElement.parentElement.lastElementChild.innerText = message.response
    }
}
function decryptAndCopyToClipboard(data) {

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


function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function () {

    }, function () {

    });
}


function getByID(id) {
    return document.getElementById(id);
}

function d(data) {
    if (DEBUG) console.log(data);
}
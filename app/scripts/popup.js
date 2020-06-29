function updateVersionText() {
    var version = browser.runtime.getManifest().version;
    document.getElementById("wand-tools-version-text")
        .innerHTML = `Version : ${version}`;
}
updateVersionText();

browser.storage.local.get(data => {
    var listItems = '';
    if (data.copied_items) {
        var local_copied_items = data.copied_items;
        local_copied_items.forEach(element => {
            listItems += `<li>
            <div>
        <div class="uk-card uk-card-default uk-card-small uk-card-body">
            <div class="uk-card-badge uk-label">${element.time}</div>
            <span class="uk-text-right uk-text-emphasis uk-text-primary"> 
                <button class="uk-button uk-button-small uk-button-danger">Delete</button>
                <div class="uk-inline">
                    <button class="uk-button uk-button-small uk-button-secondary" type="button">More Options</button>
                    <div uk-dropdown="mode: click;">
                        <ul class="uk-nav uk-dropdown-nav">
                            <li><a href="#">Decrypt and View</a></li>
                            <li><a href="#">Copy to Clipboard (Encrypted Text)</a></li>        
                            <li><a href="#">Copy to Clipboard (Decrypted Text)</a></li>        
                        </ul>
                    </div>
                </div>
            </span>
            <p>${element.data}</p>
        </div>
    </div></li>`;
        });
        document.getElementById("history_items")
            .innerHTML = listItems;
    }
});

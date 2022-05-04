/** @param {LLH.Depends.Promise<void>} loadDeferred */
function renderPage(loadDeferred) {
    /**
     * @param {LLH.API.AccessoryDictDataType} accessoryData
     * @param {LLH.API.CardDictDataType} cardData
     * @param {LLH.API.MetaDataType} metaData
     */
    function init(accessoryData, cardData, metaData) {
        LLConst.initMetadata(metaData);
        
        var comp_accessory_selector = new LLAccessorySelectorComponent('accessory_selector', {
            'accessoryData': accessoryData,
            'cardData': cardData,
            'showDetail': true
        });

        var comp_language = new LLLanguageComponent('language');
        comp_language.registerLanguageChange(comp_accessory_selector);

        // done
        document.getElementById('loadingbox').style.display = 'none';
    }

    LLDepends.whenAll(LLAccessoryData.getAllBriefData(), LLCardData.getAllBriefData(), LLMetaData.get(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );
    
}

/** @param {LLH.Depends.Promise<void, void>} loadDeferred */
function renderPage(loadDeferred) {
    LLCardData.briefKeys.push('smile2', 'pure2', 'cool2');

    /**
     * @param {LLH.API.CardDictDataType} cardData
     * @param {LLH.API.MetaDataType} metaData
     */
    function init(cardData, metaData) {
        LLConst.initMetadata(metaData);
        
        var comp_card_pool = new LLCardPoolComponent({
            'id': 'card_pool',
            'poolsKey': LLHelperLocalStorageKeys.localStorageCardPoolKey,
            'cards': cardData
        });

        var comp_language = new LLLanguageComponent('language');
        comp_language.registerLanguageChange(comp_card_pool);

        // done
        LoadingUtil.stop();
    }

    LLDepends.whenAll(LLCardData.getAllBriefData(), LLMetaData.get(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );
    
}

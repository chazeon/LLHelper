/** @param {LLH.Depends.Promise<void>} loadDeferred */
function renderPage(loadDeferred) {
    /**
     * @param {LLH.API.SisDictDataType} sisData
     * @param {LLH.API.MetaDataType} metaData
     */
    function init(sisData, metaData) {
        LLConst.initMetadata(metaData);
        
        var comp_gem_selector = new LLGemSelectorComponent('gem_selector', sisData);

        // done
        document.getElementById('loadingbox').style.display = 'none';
    }

    LLDepends.whenAll(LLSisData.getAllBriefData(), LLMetaData.get(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );
    
}

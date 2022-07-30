var import_unit_json = undefined;
var mezame = 0;

var data_mapnote = 0;
var comp_skill = 0;
var comp_cardselector = 0;
/** @type {LLH.Selector.LLSongSelectorComponent} */
var comp_songselector = undefined;
/** @type {LLH.Selector.LLGemSelectorComponent} */
var comp_gemselector = undefined;
/** @type {LLH.Selector.LLAccessorySelectorComponent} */
var comp_accessory_selector = undefined;
var comp_cardavatar = 0;
/** @type {LLH.Layout.ScoreDistParam.LLScoreDistributionParameter} */
var comp_distribution_param = undefined;
var comp_distribution_chart = 0;
/** @type {LLH.Layout.Team.LLTeamComponent} */
var comp_team = undefined;
var comp_cskill_team = 0;
/** @type {LLH.Layout.UnitResult.LLUnitResultComponent} */
var comp_result = undefined;
var comp_language = 0;
var enable_make_test_case = 0;

function toMezame() {
    mezame = 1 - mezame
    LLUnit.applycarddata();
}

function clearall() {
    setCookie("mezame" + "unit", mezame, -1)
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageLanguageKey);
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageCardSelectKey);
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageSongSelectKey);
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageLLNewUnitLATeamKey);
    LLHelperLocalStorage.clearData(LLHelperLocalStorage.localStorageAccessorySelectKey);
    window.location.href = "/llnewunitla"
}

function makeSaveData() {
    return new LLSaveData({ 'version': 104, 'team': comp_team.getMembers(), 'gemstock': {}, 'submember': [] });
}

function saveunit() {
    var saveData = makeSaveData();
    var unitjson = saveData.serializeV104();
    window.location.href = "/llsaveunit/" + unitjson;
}

function handleLoadTeamMember(teamMember) {
    comp_team.setMembers(teamMember);
    precalcu();
}

function handleLoadUnit(unit) {
    if (import_unit_json === undefined) {
        import_unit_json = unit;
        return
    }
    var saveData = new LLSaveData(unit);
    console.log(saveData);
    handleLoadTeamMember(saveData.teamMember);
}

function loadunit() {
    document.getElementById("unitform").action = '/llload/parent.handleLoadUnit'
    document.getElementById("unitform").target = 'if'
}

function precalcu() {
    document.getElementById("unitform").action = ''
    document.getElementById("unitform").target = ''
}

function saveToCookie() {
    setCookie("mezame" + "unit", mezame, 1)
}

function check() {
    if (!comp_songselector.getSelectedSongSetting()) {
        comp_result.showError('请选择谱面');
        return;
    }
    if (!comp_team.isAllMembersPresent()) {
        comp_result.showError('队伍中仍有空位');
        return;
    }
    comp_result.hideError();
    saveToCookie();
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageLanguageKey, comp_language.serialize())
    comp_cardselector.saveLocalStorage(LLHelperLocalStorage.localStorageCardSelectKey);
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageSongSelectKey, comp_songselector.saveJson());
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageAccessorySelectKey, comp_accessory_selector.saveJson());
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageDistParamLAKey, comp_distribution_param.saveJson());
    LLHelperLocalStorage.setData(LLHelperLocalStorage.localStorageLLNewUnitLATeamKey, comp_team.saveJson());

    LLUnit.calculate(docalculate, comp_team.getCardIds(), comp_team.getAccessoryIds(), [data_mapnote.getMapNoteData(comp_songselector.getSelectedSong(), comp_songselector.getSelectedSongSetting())]);
    return true;
}

function docalculate(cards, accessoryDetails, extraData) {
    var test_case = {};
    if (enable_make_test_case) {
        test_case.saveData = JSON.parse(makeSaveData().serializeV104());
        test_case.songId = comp_songselector.getSelectedSongId();
        test_case.songSettingId = comp_songselector.getSelectedSongSettingId();
        test_case.version = LLCardData.getVersion();
        test_case.page = 'llnewunitla';
    }
    var member = comp_team.getMembers();
    var llmembers = [];

    var mainatt = comp_songselector.getSongAttribute();

    for (var i = 0; i < 9; i++) {
        /** @type {LLH.Model.LLMember_Options} */
        var memberOpt = member[i];
        memberOpt.card = cards[memberOpt.cardid];
        if (memberOpt.accessory) {
            memberOpt.accessoryData = accessoryDetails[memberOpt.accessory.id];
        }
        memberOpt.enableLAGem = true;
        memberOpt.gemDataDict = comp_gemselector.gemData;
        llmembers.push(new LLMember(memberOpt, mainatt));
    }

    var distParam = comp_distribution_param.saveData();
    var llmap = comp_songselector.getMap(comp_team.getWeights());
    llmap.setDistParam(distParam);

    var llteam = new LLTeam(llmembers);
    var llmapSaveData = llmap.saveData();
    llteam.calculateAttributeStrength(llmapSaveData);
    llteam.calculateSkillStrength(llmapSaveData);

    comp_team.setStrengthDebuffs(llteam.attrDebuff);

    var t0 = window.performance.now();

    var percentiles = [1, 2, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99];
    var err;
    if (distParam.type == 'simla') {
        err = llteam.simulateScoreDistribution(llmapSaveData, extraData[0], parseInt(distParam.count));
    } else {
        err = '未知的得分分布';
    }
    var t1 = window.performance.now();
    if (err) {
        comp_result.showError(err);
    } else {
        comp_result.hideError();
    }
    console.debug(llteam);
    console.debug('Elapesd time (ms): ' + (t1 - t0).toFixed(3));
    var calResult = llteam.getResults();
    for (var i in percentiles) {
        document.getElementById('simresult' + (100 - percentiles[i]).toString()).innerHTML = calResult.naivePercentile[percentiles[i]];
    }
    document.getElementById('maxscoreprobability').innerHTML = '(' + (calResult.probabilityForMaxScore * 100) + ')%';
    document.getElementById('minscoreprobability').innerHTML = '(' + (calResult.probabilityForMinScore * 100) + ')%';
    document.getElementById('simresult0').innerHTML = calResult.maxScore;
    document.getElementById('simresult100').innerHTML = calResult.minScore;
    document.getElementById('distributionresult').style.display = '';
    if (!comp_distribution_chart) {
        comp_distribution_chart = new LLScoreDistributionChart('score_chart', { 'series': [calResult.naivePercentile], 'width': '100%', 'height': '400px' });
    } else {
        comp_distribution_chart.addSeries(calResult.naivePercentile);
    }

    if (enable_make_test_case) {
        test_case.type = distParam.type;
        test_case.map = llmapSaveData;
        test_case.result = llteam.getResults();
        console.log(test_case);
    }
    comp_team.setResult(llteam);
    comp_result.showResult(llteam);
}


/** @param {LLH.Depends.Promise<void>} loadDeferred */
function renderPage(loadDeferred) {
    /**
     * @param {LLH.API.CardDictDataType} cardData
     * @param {LLH.API.SongDictDataType} songData
     * @param {LLH.API.MetaDataType} metaData
     * @param {LLH.API.AccessoryDictDataType} accessoryData
     * @param {LLH.API.SisDictDataType} sisData
     */
    function init(cardData, songData, metaData, accessoryData, sisData) {
        // init components
        LLConst.initMetadata(metaData);
        comp_cskill_team = new LLCSkillComponent('cskill_team');
        comp_songselector = new LLSongSelectorComponent('song_filter', {
            'songs': songData,
            'includeMapInfo': true,
            'mode': 'la'
        });
        data_mapnote = new LLMapNoteData();
        comp_skill = new LLSkillContainer();
        comp_cardselector = new LLCardSelectorComponent('card_filter_container', { 'cards': cardData });
        comp_cardselector.onCardChange = LLUnit.applycarddata;
        comp_cardavatar = new LLImageComponent('imageselect');
        comp_distribution_param = new LLScoreDistributionParameter('distribution_param', {'mode': 'la'});
        comp_distribution_param.loadJson(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageDistParamLAKey));
        comp_accessory_selector = new LLAccessorySelectorComponent('accessory_selector', {
            'accessoryData': accessoryData,
            'cardData': cardData,
            'showLevelSelect': true,
            'excludeMaterial': true
        });

        comp_result = new LLUnitResultComponent('unit_result');
        comp_gemselector = new LLGemSelectorComponent('gem_filter', {
            'includeLAGem': true,
            'gemData': sisData,
            'showBrief': true
        });

        comp_songselector.onSongSettingChange = (songSettingId, songSetting) => songSetting && comp_team.setWeights(songSetting.positionweight);
        comp_songselector.onSongColorChange = (songAttribute) => comp_team.setMapAttribute(songAttribute);

        comp_language = new LLLanguageComponent('language');
        comp_language.registerLanguageChange(comp_songselector);
        comp_language.registerLanguageChange(comp_cardselector);
        comp_language.registerLanguageChange(comp_accessory_selector);

        var comp_dataversion = new LLDataVersionSelectorComponent('card_data_version', LLCardData, function (v) {
            LoadingUtil.startSingle(LLCardData.getAllBriefData().then(function (cards) {
                comp_cardselector.setCardData(cards, true);
            }));
        });
        var comp_savestorage = new LLSaveStorageComponent('unit-storage', {
            'saveData': makeSaveData,
            'loadTeamMember': handleLoadTeamMember
        });
        comp_team = new LLTeamComponent('unit-team', {
            'onPutCardClicked': function (i) {
                var curMain = document.getElementById("main").value;
                var memberData = {
                    'cardid': comp_cardselector.getCardId(),
                    'mezame': (document.getElementById("mezame").checked ? 1 : 0),
                    'hp': parseInt(document.getElementById("hp").value),
                    'smile': parseInt(document.getElementById("smile").value),
                    'pure': parseInt(document.getElementById("pure").value),
                    'cool': parseInt(document.getElementById("cool").value),
                    'skilllevel': parseInt(document.getElementById("skilllevel").innerHTML)
                };
                memberData[curMain] += parseInt(document.getElementById("kizuna").value);
                comp_team.putMember(i, memberData);
            },
            'onPutGemClicked': function (i) {
                return comp_gemselector.getGemId();
            },
            'onCenterChanged': function () {
                LoadingUtil.startSingle(LLCardData.getDetailedData(this.getCardId(4) || 0)).then(function (card) {
                    comp_cskill_team.setCSkill(card);
                }, defaultHandleFailedRequest);
            },
            'onPutAccessoryClicked': function () {
                return comp_accessory_selector.getAccessorySaveData();
            },
            'mode': 'la'
        });
        comp_team.loadJson(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageLLNewUnitLATeamKey));


        mezame = getCookie("mezameunit")
        if (mezame == "") mezame = 0; else mezame = parseInt(mezame);
        document.getElementById("mezame").checked = mezame

        // load
        comp_language.deserialize(parseInt(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageLanguageKey, 0)));
        comp_cardselector.loadLocalStorage(LLHelperLocalStorage.localStorageCardSelectKey);
        comp_songselector.loadJson(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageSongSelectKey));
        comp_accessory_selector.loadJson(LLHelperLocalStorage.getData(LLHelperLocalStorage.localStorageAccessorySelectKey));
        comp_team.setMapAttribute(comp_songselector.getSongAttribute());

        // addition script
        if (import_unit_json !== undefined) {
            handleLoadUnit(import_unit_json);
        } else {
            import_unit_json = 0;
        }

        // done
        document.getElementById('loadingbox').style.display = 'none';
    }

    LLDepends.whenAll(LLCardData.getAllBriefData(), LLSongData.getAllBriefData(), LLMetaData.get(), LLAccessoryData.getAllBriefData(), LLSisData.getAllBriefData(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );

}

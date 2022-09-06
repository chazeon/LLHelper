var import_unit_json = undefined;
var mezame = 0;

/** @type {LLMapNoteData} */
var data_mapnote;
/** @type {LLSkillContainer} */
var comp_skill;
/** @type {LLH.Selector.LLCardSelectorComponent} */
var comp_cardselector;
/** @type {LLH.Selector.LLSongSelectorComponent} */
var comp_songselector;
var comp_gemselector = 0;
/** @type {LLH.Selector.LLAccessorySelectorComponent} */
var comp_accessory_selector;
var comp_cardavatar = 0;
/** @type {LLH.Layout.ScoreDistParam.LLScoreDistributionParameter} */
var comp_distribution_param;
var comp_distribution_chart = 0;
/** @type {LLH.Layout.Team.LLTeamComponent} */
var comp_team;
var comp_result = 0;
/** @type {LLH.Layout.Language.LLLanguageComponent} */
var comp_language;
/** @type {LLH.Persistence.LLSaveLoadJsonGroup} */
var persister;

var enable_make_test_case = 0;

function toMezame() {
    mezame = 1 - mezame
    LLUnit.applycarddata();
}

function clearall() {
    setCookie("mezame" + "unit", mezame, -1)
    persister.clearAll();
    window.location.href = "/llnewunit"
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
    persister.saveAll();
    var distParam = comp_distribution_param.saveData();
    if (distParam.type == 'sim') {
        LLUnit.calculate(docalculate, comp_team.getCardIds(), comp_team.getAccessoryIds(), [data_mapnote.getMapNoteData(comp_songselector.getSelectedSong(), comp_songselector.getSelectedSongSetting())]);
    } else {
        LLUnit.calculate(docalculate, comp_team.getCardIds(), comp_team.getAccessoryIds());
    }
    return true;
}

function docalculate(cards, accessoryDetails, extraData) {
    var test_case = {};
    if (enable_make_test_case) {
        test_case.saveData = JSON.parse(makeSaveData().serializeV104());
        test_case.songId = comp_songselector.getSelectedSongId();
        test_case.songSettingId = comp_songselector.getSelectedSongSettingId();
        test_case.version = LLCardData.getVersion();
        test_case.page = 'llnewunit';
    }
    var member = comp_team.getMembers();
    var llmembers = [];

    var mainatt = comp_songselector.getSongAttribute();

    for (var i = 0; i < 9; i++) {
        member[i].card = cards[member[i].cardid];
        if (member[i].accessory) {
            member[i].accessoryData = accessoryDetails[member[i].accessory.id];
        }
        llmembers.push(new LLMember(member[i], mainatt));
    }

    var distParam = comp_distribution_param.saveData();
    var llmap = comp_songselector.getMap(comp_team.getWeights());

    var llteam = new LLTeam(llmembers);
    if (distParam.type == 'sim') {
        llmap.setDistParam(distParam);
    }
    var llmapSaveData = llmap.saveData();
    llteam.calculateAttributeStrength(llmapSaveData);
    llteam.calculateSkillStrength(llmapSaveData);

    comp_team.setStrengthDebuffs(llteam.attrDebuff);

    if (distParam.type != 'no') {
        var t0 = window.performance.now();

        var percentiles = [1, 2, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99];
        var err;
        if (distParam.type == 'v1') {
            err = llteam.calculateScoreDistribution();
            if (!err) {
                llteam.calculatePercentileNaive();
            }
        } else if (distParam.type == 'sim') {
            err = llteam.simulateScoreDistribution(llmapSaveData, extraData[0], parseInt(distParam.count));
        } else {
            err = '未知的得分分布';
        }
        if (err) {
            comp_result.showError(err);
        } else {
            comp_result.hideError();
        }
        var t1 = window.performance.now();
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
    } else {
        document.getElementById('distributionresult').style.display = 'none';
        comp_result.hideError();
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


/** @param {LLH.Depends.Promise<void, void>} loadDeferred */
function renderPage(loadDeferred) {
    /**
     * @param {LLH.API.CardDictDataType} cardData
     * @param {LLH.API.SongDictDataType} songData
     * @param {LLH.API.MetaDataType} metaData
     * @param {LLH.API.AccessoryDictDataType} accessoryData
     */
    function init(cardData, songData, metaData, accessoryData) {
        // init components
        LLConst.initMetadata(metaData);
        var comp_cskill_team = new LLCSkillComponent('cskill_team');
        var comp_cskill_friend = new LLCSkillComponent('cskill_friend', { 'editable': true, 'title': '好友主唱技能' });
        comp_songselector = new LLSongSelectorComponent('song_filter', { 'songs': songData, 'includeMapInfo': true, 'friendCSkill': comp_cskill_friend });
        data_mapnote = new LLMapNoteData();
        comp_skill = new LLSkillContainer();
        comp_cardselector = new LLCardSelectorComponent('card_filter_container', { 'cards': cardData, 'pools': LLPoolUtil.loadPools(LLHelperLocalStorageKeys.localStorageCardPoolKey) });
        comp_cardselector.onCardChange = LLUnit.applycarddata;
        comp_cardavatar = new LLImageComponent('imageselect');
        comp_distribution_param = new LLScoreDistributionParameter('distribution_param');
        comp_accessory_selector = new LLAccessorySelectorComponent('accessory_selector', {
            'accessoryData': accessoryData,
            'cardData': cardData,
            'showLevelSelect': true,
            'excludeMaterial': true
        });

        comp_result = new LLUnitResultComponent('unit_result');
        comp_gemselector = new LLGemSelectorComponent('gem_filter', { 'includeNormalGemCategory': true });

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
            }
        });


        mezame = getCookie("mezameunit")
        if (mezame == "") mezame = 0; else mezame = parseInt(mezame);
        document.getElementById("mezame").checked = mezame

        // load
        persister = new LLSaveLoadJsonGroup();
        persister.register(LLHelperLocalStorageKeys.localStorageDistParamKey, comp_distribution_param, undefined, true);
        persister.register(LLHelperLocalStorageKeys.localStorageLLNewUnitTeamKey, comp_team);
        persister.register(LLHelperLocalStorageKeys.localStorageLanguageKey, comp_language, '0');
        persister.register(LLHelperLocalStorageKeys.localStorageCardSelectKey, comp_cardselector);
        persister.register(LLHelperLocalStorageKeys.localStorageSongSelectKey, comp_songselector);
        persister.register(LLHelperLocalStorageKeys.localStorageAccessorySelectKey, comp_accessory_selector);

        persister.loadAll();
        comp_team.setMapAttribute(comp_songselector.getSongAttribute());

        // addition script
        if (import_unit_json !== undefined) {
            handleLoadUnit(import_unit_json);
        } else {
            import_unit_json = 0;
        }

        // done
        LoadingUtil.stop();
    }

    LLDepends.whenAll(LLCardData.getAllBriefData(), LLSongData.getAllBriefData(), LLMetaData.get(), LLAccessoryData.getAllBriefData(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );

}
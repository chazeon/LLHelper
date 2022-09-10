var mezame = 0;

/** @type {LLH.Layout.Skill.LLSkillContainer} */
var comp_skill;
/** @type {LLH.Misc.LLMapNoteData} */
var data_mapnote;
/** @type {LLH.Selector.LLCardSelectorComponent} */
var comp_cardselector;
/** @type {LLH.Selector.LLSongSelectorComponent} */
var comp_songselector;
/** @type {LLH.Layout.Language.LLLanguageComponent} */
var comp_language;
/** @type {LLH.Component.LLImageComponent} */
var comp_cardavatar;
var comp_avatar_team = [];

function threetonumber(three) {
    var result = three
    if (result == '0') {
        return 0;
    }
    if (result[0] == '0') {
        result = result[1] + result[2]
    }
    if (result[0] == '0') {
        result = result[1]
    }
    return result
}

function offsetup() {
    if (document.getElementById('offset').value < 50) {
        document.getElementById('offset').value = Number(document.getElementById('offset').value) + 1;
    }
    else
        return;
}

function offsetdown() {
    if (document.getElementById('offset').value > -50) {
        document.getElementById('offset').value = Number(document.getElementById('offset').value) - 1;
    }
    else
        return;
}

function offsetzero() {
    document.getElementById('offset').value = 0;
}

function changecolor() {
    var index = comp_cardselector.getCardId();
    var mezame = (document.getElementById("mezame").checked ? 1 : 0);
    if (index != "") {
        LoadingUtil.startSingle(LLCardData.getDetailedData(index)).then(function (curCard) {
            comp_skill.setCardData(curCard);
        }, defaultHandleFailedRequest);
        if (mezame == 0) {
            document.getElementById("mezame").value = "未觉醒"
        }
        else {
            document.getElementById("mezame").value = "已觉醒"
        }
    } else {
        comp_skill.setCardData();
    }
    LLUnit.setAvatarSrcList(comp_cardavatar, index, mezame);
}

function toMezame() {
    mezame = 1 - mezame
    changecolor()
}

function applysongdata(songSettingId, songSetting) {
    if (!songSettingId) return;
    document.getElementById('speeds').value = LLConst.Live.getDefaultSpeed(songSetting.difficulty);
}

function copyTo(n) {
    var index = comp_cardselector.getCardId();
    if (index == "") return;
    var mezame = (document.getElementById("mezame").checked ? 1 : 0);
    LLUnit.setAvatarSrcList(comp_avatar_team[n], index, mezame);
    comp_avatar_team[n].show();
    LoadingUtil.startSingle(LLCardData.getDetailedData(index)).then(function (curCard) {
        if (!curCard.skill) return;
        if (curCard.triggertype == 3) {
            document.getElementById("member" + String(n))[1].selected = true;
        } else if (curCard.triggertype == 1) {
            document.getElementById("member" + String(n))[2].selected = true;
        } else if (curCard.triggertype == 4) {
            document.getElementById("member" + String(n))[3].selected = true;
        } else {
            document.getElementById("member" + String(n))[0].selected = true;
        }
        var skilllevel = comp_skill.skillLevel;
        document.getElementById("skilllevel" + String(n)).innerHTML = String(skilllevel + 1);
        document.getElementById('require' + String(n)).value = curCard['skilldetail'][skilllevel].require
        document.getElementById('probability' + String(n)).value = curCard['skilldetail'][skilllevel].possibility
        document.getElementById('time' + String(n)).value = curCard['skilldetail'][skilllevel].time
        document.getElementById("mezame" + String(n)).value = mezame;
        document.getElementById("cardid" + String(n)).value = index;
    }, defaultHandleFailedRequest);
}

function decopyTo(n) {
    LLUnit.setAvatarSrcList(comp_avatar_team[n], '', 0);
    if (n > 0) comp_avatar_team[n].hide();
    document.getElementById("member" + String(n))[0].selected = true;
    document.getElementById("skilllevel" + String(n)).innerHTML = 1;
    document.getElementById("require" + String(n)).value = 0;
    document.getElementById("probability" + String(n)).value = 0;
    document.getElementById("time" + String(n)).value = 0;
    document.getElementById("mezame" + String(n)).value = 0;
    document.getElementById("cardid" + String(n)).value = 0;
}

function saveToCookie() {
    var inputs = document.getElementsByTagName("input");
    var selects = document.getElementsByTagName("select");
    var nospan = document.getElementsByTagName("nospan");
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type == "text" && inputs[i].name)
            setCookie(inputs[i].name + "perfect", inputs[i].value, 1);
    }
    for (var i = 0; i < selects.length; i++) {
        if (!selects[i].name) continue;
        setCookie(selects[i].name + "perfect", selects[i].value, 1);
    }
    for (var i = 1; i < nospan.length; i++) {
        setCookie("nospan" + String(i) + "perfect", nospan[i].innerHTML, 1);
    }
    setCookie("mezame" + "perfect", mezame, 1)
}

function check() {
    if (!comp_songselector.getSelectedSongSetting()) {
        alert('请选择谱面');
        return false;
    }
    if (window.innerHeight - 20 < 977 && window.innerHeight - 20 > 700) {
        document.getElementById('container').style.height = String(window.innerHeight - 20) + "px";
    }
    else if (window.innerHeight - 20 >= 977) {
        document.getElementById('container').style.height = "977px";
    }
    else {
        document.getElementById('container').style.height = "700px";
    }
    containerheight = parseInt(document.getElementById('container').style.height) - 165;
    saveToCookie();
    comp_cardselector.saveLocalStorage('llcoverage_cardselector');
    comp_songselector.saveLocalStorage('llcoverage_songselector');
    LLHelperLocalStorage.setData(LLHelperLocalStorageKeys.localStorageLanguageKey, comp_language.serialize());
    document.getElementById('container').style.display = "";
    document.getElementById('separater').style.display = "";
    var song = comp_songselector.getSelectedSong();
    var songSetting = comp_songselector.getSelectedSongSetting();
    document.getElementById('running').style.display = "";
    document.getElementById('running').innerHTML = "谱面下载中…";
    document.getElementById("running").scrollIntoView();
    data_mapnote.getMapNoteData(song, songSetting).done(function (data) {
        CoverageCalculator(song, songSetting, data);
    }).fail(function () {
        document.getElementById('running').innerHTML = "谱面下载失败";
    });
    return true;
}

/** @param {LLH.Depends.Promise<void, void>} loadDeferred */
function renderPage(loadDeferred) {
    LLSongData.briefKeys.push('bpm', 'jsonpath');

    function legacyInit() {
        mezame = getCookie("mezameperfect")
        if (mezame == "") mezame = 0; else mezame = parseInt(mezame);
    
        var inputs = document.getElementsByTagName("input");
        var selects = document.getElementsByTagName("select");
        var nospan = document.getElementsByTagName("nospan");
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type == "text" && inputs[i].name)
                if (getCookie(inputs[i].name + "perfect") != "")
                    inputs[i].value = getCookie(inputs[i].name + "perfect");
        }
        for (var i = 0; i < selects.length; i++) {
            if (!selects[i].name) continue;
            if (getCookie(selects[i].name + "perfect") != "")
                selects[i].value = getCookie(selects[i].name + "perfect");
        }
        for (var i = 1; i < nospan.length; i++) {
            if (!selects[i].name) continue;
            if (getCookie("nospan" + String(i) + "perfect") != "")
                nospan[i].innerHTML = getCookie("nospan" + String(i) + "perfect");
        }
        document.getElementById("mezame").checked = mezame
        for (i = 0; i < 9; i++) {
            if (document.getElementById("member" + String(i)).value != 0) {
                var curCardid = parseInt(document.getElementById('cardid' + String(i)).value);
                var curMezame = parseInt(document.getElementById('mezame' + String(i)).value);
                LLUnit.setAvatarSrcList(comp_avatar_team[i], curCardid, curMezame);
                comp_avatar_team[i].show();
            }
        }
    }


    /**
     * @param {LLH.API.CardDictDataType} cardData
     * @param {LLH.API.SongDictDataType} songData
     * @param {LLH.API.MetaDataType} metaData
     */
    function init(cardData, songData, metaData) {
        // init components
        LLConst.initMetadata(metaData);
        comp_songselector = new LLSongSelectorComponent('song_filter', { 'songs': songData });
        comp_songselector.onSongSettingChange = applysongdata;
        data_mapnote = new LLMapNoteData();
        comp_skill = new LLSkillContainer();
        comp_cardselector = new LLCardSelectorComponent('card_filter_container', { 'cards': cardData, 'noShowN': true, 'pools': LLPoolUtil.loadPools(LLHelperLocalStorageKeys.localStorageCardPoolKey) });
        comp_cardselector.getComponent('rarity').filterOptions(function (opt) {
            return !(opt.value == 'N' || opt.value == 'R');
        });
        comp_cardselector.getComponent('skilltype').filterOptions(function (opt) {
            return opt.value == '5';
        });
        comp_cardselector.onCardChange = changecolor;

        var comp_dataversion = new LLDataVersionSelectorComponent('card_data_version', LLCardData, function (v) {
            LoadingUtil.startSingle(LLCardData.getAllBriefData().then(function (cards) {
                comp_cardselector.setCardData(cards, true);
            }));
        });

        comp_cardavatar = new LLImageComponent('imageselect');
        for (var i = 0; i < 9; i++) {
            comp_avatar_team.push(new LLImageComponent('avatar' + i));
        }

        comp_language = new LLLanguageComponent('language');
        comp_language.registerLanguageChange(comp_songselector);
        comp_language.registerLanguageChange(comp_cardselector);

        legacyInit();

        // load
        comp_language.deserialize(parseInt(LLHelperLocalStorage.getData(LLHelperLocalStorageKeys.localStorageLanguageKey, 0)));
        comp_cardselector.loadLocalStorage('llcoverage_cardselector');
        comp_songselector.loadLocalStorage('llcoverage_songselector');

        // done
        LoadingUtil.stop();
    }

    LLDepends.whenAll(LLCardData.getAllBriefData(), LLSongData.getAllBriefData(), LLMetaData.get(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );

}

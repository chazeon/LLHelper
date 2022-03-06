"use strict";
var g_page_load_case = undefined;
/** @param {LLH.Depends.Promise<void>} loadDeferred */
function renderPage(loadDeferred) {
    /** @type {LLH.Test.AcceptedTestItem[]} */
    var testSet = [];
    var defer_test_load = LLDepends.createDeferred();
    var data_mapnote = 0;
    var song_settings = 0;
    var testStatusSummary = (function () {
        var summary = {
            'initial': 0,
            'pending': 0,
            'running': 0,
            'success': 0,
            'fail': 0,
            'skip': 0
        };
        var timer = undefined;
        function render() {
            document.getElementById('test-result').innerHTML = '测试结果: ' +
                '未开始: ' + summary.initial +
                ', 等待中: ' + summary.pending +
                ', 跳过: ' + summary.skip +
                ', 成功: ' + summary.success +
                ', 失败: ' + summary.fail +
                ', 运行中: ' + summary.running;
            timer = undefined;
        }
        function deferredUpdate() {
            if (timer) return;
            timer = setTimeout(render, 1000);
        }
        return {
            'update': function (fromStatus, toStatus) {
                if (fromStatus) {
                    summary[fromStatus] -= 1;
                }
                if (toStatus) {
                    summary[toStatus] += 1;
                }
                deferredUpdate();
            }
        };
    })();

    function loadCardsById(cardIds, version) {
        var uniqueCardids = {};
        var requests = [];
        for (var i = 0; i < cardIds.length; i++) {
           var curCardId = cardIds[i];
           if (curCardId && uniqueCardids[curCardId] === undefined) {
              requests.push(LLCardData.getDetailedDataWithVersion(version || 'cn', curCardId));
              uniqueCardids[curCardId] = 1;
           }
        }
        return LoadingUtil.start(requests, LoadingUtil.cardDetailMerger);
    }
    
    function loadTestCase(caseId) {
        /** @type {LLH.Depends.Promise<LLH.Test.TestCaseData, void>} */
        var defer = LLDepends.createDeferred();
        var url = '/static/testcase/' + caseId + '.json';
        $.ajax({
            'url': url,
            'type': 'GET',
            'success': function (data) {
                defer.resolve(data);
            },
            'error': function (xhr, textStatus, errorThrown) {
                console.error("Failed on request to " + url + ": " + textStatus);
                console.error(errorThrown);
                defer.reject();
            },
            'dataType': 'json'
        });
        return defer;
    }
    function getSongById(songId) {
        return LLSongData.getCachedBriefData()[songId];
    }
    function getSongSettingById(songSettingId) {
        return song_settings[songSettingId];
    }
    function buildMapOptionById(songId, songSettingId, friendCSkill) {
        return {
           'song': getSongById(songId),
           'songSetting': getSongSettingById(songSettingId),
           'friendCSkill': friendCSkill
        };
    }

    /**
     * @param {LLH.Test.TestItemOptions} item 
     * @returns {LLH.Test.AcceptedTestItem}
     */
    function addTestItem(item) {
        /** @type {LLH.Test.AcceptedTestItem} */
        var acceptedItem = item;
        testSet.push(acceptedItem);
        testStatusSummary.update(undefined, 'initial');

        var resultElement = LLUnit.createElement('td', { 'innerHTML': 'Not started' });
        var performanceElement = LLUnit.createElement('td');
        var defer = LLDepends.createDeferred();
        acceptedItem.defer = defer;

        var setResult = function (result) {
            acceptedItem.finishTime = window.performance.now();
            if (result == 'Skipped') {
                resultElement.innerHTML = result;
                resultElement.className = 'warning';
                testStatusSummary.update('pending', 'skip');
            } else if (result) {
                resultElement.innerHTML = 'Fail: ' + result;
                resultElement.className = 'danger';
                testStatusSummary.update('running', 'fail');
            } else {
                var maxDiff = acceptedItem.maxDiff;
                if (maxDiff !== undefined) {
                    resultElement.innerHTML = 'Success, max diff = ' + maxDiff.toFixed(6);
                } else {
                    resultElement.innerHTML = 'Success';
                }
                resultElement.className = 'success';
                testStatusSummary.update('running', 'success');
            }
            performanceElement.innerHTML = (acceptedItem.finishTime - acceptedItem.startTime).toFixed(3);
        };

        acceptedItem.start = function () {
            testStatusSummary.update('initial', 'pending');
            resultElement.innerHTML = 'Pending';
            resultElement.className = 'info';
            /** @type {LLH.Depends.Promise<any, any>[]} */
            var afters = [];
            if (acceptedItem.after) {
                if (acceptedItem.after.length) {
                    for (var i = 0; i < acceptedItem.after.length; i++) {
                        var after = acceptedItem.after[i];
                        if (after.defer) afters.push(after.defer);
                        else afters.push(after);
                    }
                } else if (acceptedItem.after.defer) {
                    afters.push(acceptedItem.after.defer);
                } else {
                    afters.push(acceptedItem.after);
                }
            }
            LLDepends.whenAllByArray(afters).then(function () {
                testStatusSummary.update('pending', 'running');
                var cardDefer, songDefer;
                if (acceptedItem.cardConfigs) {
                    var cardIds = acceptedItem.cardConfigs.map(function (c) { return c[0]; });
                    cardDefer = loadCardsById(cardIds, acceptedItem.version);
                }
                if (acceptedItem.songId && acceptedItem.songSettingId) {
                    var song = getSongById(acceptedItem.songId);
                    var songSetting = getSongSettingById(acceptedItem.songSettingId);
                    songDefer = data_mapnote.getLocalMapNoteData(song, songSetting);
                }
                return LLDepends.whenAll(cardDefer, songDefer);
            }, function () {
                setResult('Skipped');
                defer.reject('Skipped');
            }).then(function (cards, noteData) {
                try {
                    resultElement.innerHTML = 'Running';
                    acceptedItem.startTime = window.performance.now();
                    var ret = acceptedItem.run(cards, noteData);
                    if (ret && ret.then) {
                        ret.then(function (r) {
                            setResult(r);
                            defer.resolve(r);
                        }, function (r) {
                            setResult(r || 'Reject');
                            defer.reject(r);
                        });
                    } else {
                        setResult(ret);
                        defer.resolve(ret);
                    }
                } catch (e) {
                    console.log(e);
                    if (typeof (e) == 'string') {
                        setResult('Exception: ' + e);
                    } else {
                        setResult('Exception: ' + e.message);
                    }
                    defer.resolve(e);
                }
            }, function () {
                setResult('Load cards and notes failed');
                defer.reject();
            });
            return defer;
        };

        var testRow = LLUnit.createElement('tr', undefined, [
            LLUnit.createElement('td', { 'innerHTML': testSet.length }),
            LLUnit.createElement('td', { 'innerHTML': item.name }),
            resultElement,
            performanceElement
        ]);
        document.getElementById('test-list').appendChild(testRow);
        return item;
    }

    function buildTeam(cards, cardConfigs, mapdata) {
        var members = [];
        for (var i = 0; i < 9; i++) {
            var id = cardConfigs[i][0];
            var mezame = cardConfigs[i][1];
            var skillLevel = cardConfigs[i][2];
            var maxcost = cardConfigs[i][3];
            var gems = cardConfigs[i][4];
            var member = {
                'cardid': id,
                'smile': (mezame ? cards[id].smile2 : cards[id].smile),
                'pure': (mezame ? cards[id].pure2 : cards[id].pure),
                'cool': (mezame ? cards[id].cool2 : cards[id].cool),
                'skilllevel': skillLevel,
                'maxcost': maxcost,
                'gemlist': gems.map((g) => LLConst.Gem.getNormalGemMeta(g).key),
                'card': cards[id],
                'hp': (mezame ? cards[id].hp+1 : cards[id].hp)
            };
            member[cards[id].attribute] += kizuna[cards[id].rarity][mezame];
            members.push(new LLMember(member, mapdata.data.attribute));
        }
        var llteam = new LLTeam(members);
        return llteam;
    }
  
    function buildSubMembers(cards, cardConfigs) {
        var members = [];
        for (var i = 9; i < cardConfigs.length; i++) {
            var id = cardConfigs[i][0];
            var mezame = cardConfigs[i][1];
            var skillLevel = cardConfigs[i][2];
            var maxcost = cardConfigs[i][3];
            var member = {
                'cardid': id,
                'smile': (mezame ? cards[id].smile2 : cards[id].smile),
                'pure': (mezame ? cards[id].pure2 : cards[id].pure),
                'cool': (mezame ? cards[id].cool2 : cards[id].cool),
                'skilllevel': skillLevel,
                'maxcost': maxcost,
                'gemlist': [],
                'card': cards[id],
                'hp': (mezame ? cards[id].hp+1 : cards[id].hp)
            };
            member[cards[id].attribute] += kizuna[cards[id].rarity][mezame];
            members.push(new LLMember(member));
        }
        return members;
    }
  
    function getSmileTeam() {
        // id, mezame, skilllevel, maxcost, gems
        return [
            [1115, 1, 2, 6, [LLConst.GemType.SMUL_16, LLConst.GemType.AMUL_18]],
            [782, 0, 1, 4, [LLConst.GemType.AMUL_24]],
            [937, 1, 2, 6, [LLConst.GemType.SMUL_16, LLConst.GemType.AMUL_18]],
            [843, 1, 1, 5, [LLConst.GemType.SMUL_10, LLConst.GemType.AMUL_18]],
            [980, 1, 5, 4, [LLConst.GemType.SCORE_250]],
            [476, 1, 1, 5, [LLConst.GemType.SMUL_10, LLConst.GemType.SMUL_16]],
            [315, 1, 3, 5, [LLConst.GemType.SCORE_250, LLConst.GemType.SADD_200]],
            [107, 1, 2, 4, [LLConst.GemType.SCORE_250]],
            [955, 1, 4, 4, [LLConst.GemType.SCORE_250]]
        ];
    }
  
    function getPureTeam() {
        return [
            [636, 1, 1, 3, [LLConst.GemType.AMUL_18]],
            [939, 1, 1, 4, [LLConst.GemType.AMUL_24]],
            [369, 1, 2, 3, [LLConst.GemType.AMUL_18]],
            [127, 0, 1, 4, [LLConst.GemType.AMUL_18]],
            [1002, 1, 1, 5, [LLConst.GemType.SMUL_10, LLConst.GemType.SMUL_16]],
            [648, 1, 1, 3, [LLConst.GemType.AMUL_18]],
            [317, 1, 2, 3, [LLConst.GemType.AMUL_18]],
            [378, 0, 1, 4, [LLConst.GemType.AMUL_24]],
            [957, 1, 1, 5, [LLConst.GemType.SMUL_10, LLConst.GemType.SMUL_16]]
        ];
    }
  
    function getSmileSong(name) {
        if (name == 'oyasuminasann') {
            var songSetting = {"combo": 427, "positionweight": ["39.75", "48.0", "65", "52.5", "29", "55.75", "58.75", "47.25", "41.75"], "star": 0, "time": "110", 'difficulty': LLConst.SONG_DIFFICULTY_EXPERT};
            return {
              'song': {'group': LLConst.SONG_GROUP_AQOURS, "attribute": "smile", "settings": {'1': songSetting}},
              'songSetting': songSetting
            };
        }
    }
  
    function getPureSong(name) {
        if (name == 'kiminokokorohakagayaiterukai') {
            var songSetting = {"combo": 497, "positionweight": ["41.25", "68.5", "82.5", "59.25", "16.5", "56.25", "82.5", "67.5", "40.25"], "star": 0, "time": "110", 'difficulty': LLConst.SONG_DIFFICULTY_EXPERT};
            return {
              'song': {'group': LLConst.SONG_GROUP_AQOURS, "attribute": "pure", "settings": {'1': songSetting}},
              'songSetting': songSetting
            };
        }
    }
  
    function getFriendCSkill_muse_9_3(attribute) {
        return {
            'attribute': attribute,
            'Cskillattribute': attribute,
            'Cskillpercentage': 9,
            'Csecondskilllimit': LLConst.GROUP_MUSE,
            'Csecondskillattribute': 3
        };
    }
  
    function getFriendCSkill_grade2_9_6(attribute) {
        return {
            'attribute': attribute,
            'Cskillattribute': attribute,
            'Cskillpercentage': 9,
            'Csecondskilllimit': LLConst.GROUP_GRADE2,
            'Csecondskillattribute': 6
        };
    }
  
    function getGemStock_40AllGem() {
        return {
            'SADD_200': {'ALL': 9},
            'SADD_450': {'ALL': 9},
            'SMUL_10': {'ALL': 9},
            'SMUL_16': {'ALL': 9},
            'AMUL_18': {'ALL': 9},
            'AMUL_24': {'ALL': 9},
            'SCORE_250': {'ALL': 9},
            'HEAL_480': {'ALL': 9},
            'EMUL_33': {'ALL': 9},
            'SADD_1400': {'ALL': 0},
            'SMUL_28': {'ALL': 0},
            'AMUL_40': {'ALL': 0},
            'MEMBER_29': {'ALL': 0},
            'NONET_42': {'ALL': 0},
            'MEMBER_13': {'ALL': 0},
            'MEMBER_21': {'ALL': 0},
            'MEMBER_53': {'ALL': 0},
            'NONET_15': {'ALL': 0}
        };
    }
  
    function getGemStock_60AllGem() {
        var names = [
            "高坂穂乃果", "絢瀬絵里", "南ことり", "園田海未", "星空凛", "西木野真姫", "東條希", "小泉花陽", "矢澤にこ",
            "高海千歌", "桜内梨子", "松浦果南", "黒澤ダイヤ", "渡辺曜", "津島善子", "国木田花丸", "小原鞠莉", "黒澤ルビィ"
        ];
        var member_29 = {};
        for (var i = 0; i < names.length; i++) {
            var per_color = {'smile': 0, 'pure': 0, 'cool': 0}
            per_color[LLConst.getMemberColor(names[i])] = 9;
            member_29[LLConst[names[i]]] = per_color;
        }
        return {
            'SADD_200': {'ALL': 9},
            'SADD_450': {'ALL': 9},
            'SMUL_10': {'ALL': 9},
            'SMUL_16': {'ALL': 9},
            'AMUL_18': {'ALL': 9},
            'AMUL_24': {'ALL': 9},
            'SCORE_250': {'ALL': 9},
            'HEAL_480': {'ALL': 9},
            'EMUL_33': {'ALL': 9},
            'SADD_1400': {'ALL': 9},
            'SMUL_28': {'ALL': 9},
            'AMUL_40': {'ALL': 9},
            'MEMBER_29': member_29,
            'NONET_42': {'ALL': 9},
            'MEMBER_13': {'ALL': 0},
            'MEMBER_21': {'ALL': 0},
            'MEMBER_53': {'ALL': 0},
            'NONET_15': {'ALL': 0}
        };
    }
  
    function getGemStock_65AllGem() {
        return {
            'SADD_200': {'ALL': 9},
            'SADD_450': {'ALL': 9},
            'SMUL_10': {'ALL': 9},
            'SMUL_16': {'ALL': 9},
            'AMUL_18': {'ALL': 9},
            'AMUL_24': {'ALL': 9},
            'SCORE_250': {'ALL': 9},
            'HEAL_480': {'ALL': 9},
            'EMUL_33': {'ALL': 9},
            'SADD_1400': {'ALL': 9},
            'SMUL_28': {'ALL': 9},
            'AMUL_40': {'ALL': 9},
            'MEMBER_29': {'ALL': 9},
            'NONET_42': {'ALL': 9},
            'MEMBER_13': {'ALL': 0},
            'MEMBER_21': {'ALL': 0},
            'MEMBER_53': {'ALL': 0},
            'NONET_15': {'ALL': 0}
        };
    }
  
    function getGemStock_92AllGem() {
        return {'ALL': 9};
    }
  
    function assertEqual(a, b, message) {
        if (a == b) return;
        throw new Error((message || 'assertEqual fail') + ': ' + a + ' == ' + b);
    }
  
    function assertFloatEqual(a, b, eps, lastDiff) {
        var diff = a-b;
        if (diff < 0) diff = -diff;
        if (diff <= eps) return (lastDiff && diff < lastDiff ? lastDiff : diff);
        throw 'assertFloatEqual fail: abs(' + a + ' - ' + b + ') = ' + diff + ' > ' + eps;
    }

    /**
     * @param {LLH.Internal.AttributesValue} a 
     * @param {LLH.Internal.AttributesValue} b 
     * @param {string} message 
     */
    function assertAttributesValue(a, b, message) {
        if (a.smile == b.smile && a.pure == b.pure && a.cool == b.cool) return;
        throw new Error((message || 'assertAttributesValue fail') + ': {' + a.smile + ', ' + a.pure + ', ' + a.cool + '} == {' + b.smile + ', ' + b.pure + ', ' + b.cool + '}');
    }
    function assertAttributeP(a, smilep, purep, coolp) {
        if (a.smile == smilep && a.pure == purep && a.cool == coolp) return;
        throw 'assertAttributeP fail: {' + a.smile + ', ' + a.pure + ', ' + a.cool + '} == {' + smilep + ', ' + purep + ', ' + coolp + '}';
    }
  
    function assertFloatArrayEqual(arr1, arr2, eps, lastDiff) {
        var maxDiff = lastDiff || 0;
        for (var i = 0; i < arr1.length; i++) {
            maxDiff = assertFloatEqual(arr1[i], arr2[i], eps, maxDiff);
        }
        return maxDiff;
    }

    function arrayMaxValue(array) {
        if (array.length == 0) return undefined;
        var maxValue = array[0];
        for (var i = 1; i < array.length; i++) {
            if (array[i] > maxValue) maxValue = array[i];
        }
        return maxValue;
    }

    function assertFloatArrayEqualDynamic(arr1, arr2, maxFactor) {
        return assertFloatArrayEqual(arr1, arr2, arrayMaxValue(arr2) * maxFactor);
    }
  
    function initSongSettings() {
        var songs = LLSongData.getCachedBriefData();
        song_settings = {};
        for (var i in songs) {
            if (!songs[i].settings) continue;
            for (var j in songs[i].settings) {
                song_settings[j] = songs[i].settings[j];
                songs[i].settings[j].song = i;
            }
        }
    }
  
    function calcSim(item, cards, noteData, verifyCallback) {
        var cardConfigs = item.cardConfigs;
        var songId = item.songId;
        var songSettingId = item.songSettingId;
        var simCount = item.simCount || 1000;
        var friendCSkill = item.friendCSkill || {
            'attribute': 'smile',
            'Cskillattribute': 'smile',
            'Cskillpercentage': 0,
            'Csecondskilllimit': LLConst.GROUP_UNKNOWN,
            'Csecondskillattribute': 0
        };
        var buffTapUp = item.buffTapUp || 0;
        var buffSkillUp = item.buffSkillUp || 0;
        var perfectPercent = (item.perfectPercent === undefined ? 95 : item.perfectPercent);
        var speed = (item.speed === undefined ? 8 : item.speed);
        var cfPattern = (item.cfPattern === undefined ? 2 : item.cfPattern);
        var overHealPattern = (item.overHealPattern === undefined ? 1 : item.overHealPattern);
        var perfectAccuracyPattern = (item.perfectAccuracyPattern === undefined ? 1 : item.perfectAccuracyPattern);
        // do simulate
        var llmap = new LLMap(buildMapOptionById(songId, songSettingId, friendCSkill));
        llmap.setMapBuff(buffTapUp, buffSkillUp);
        llmap.data.perfect = Math.floor(parseFloat(perfectPercent)/100 * llmap.data.combo);
        llmap.data.speed = speed;
        llmap.data.combo_fever_pattern = cfPattern;
        llmap.data.over_heal_pattern = overHealPattern;
        llmap.data.perfect_accuracy_pattern = perfectAccuracyPattern;
        var llteam = buildTeam(cards, cardConfigs, llmap);
        llteam.calculateAttributeStrength(llmap.saveData());
        llteam.calculateSkillStrength(llmap.saveData());
        var err = llteam.simulateScoreDistribution(llmap.saveData(), noteData, simCount);
        if (err) throw err;
        var diffs = verifyCallback(llteam);
        if (diffs && diffs.length) {
            var maxDiff = 0;
            for (var i = 0; i < diffs.length; i++) {
                if (diffs[i] > maxDiff) maxDiff = diffs[i];
            }
            item.maxDiff = maxDiff;
        }
    }
  
     /**
     * @param {LLH.API.MetaDataType} metaData
     */
    function init(metaData) {
        LLConst.initMetadata(metaData);
        data_mapnote = new LLMapNoteData('/static/live/json/');
        initSongSettings();
        defer_test_load.resolve();
        // done
        document.getElementById('loadingbox').style.display = 'none';
 
        // init tests
        var test1 = addTestItem({'name': 'Load card detail', 'run': function () {
            var cnids = [378, 346, 330, 296, 408, 358, 367, 1172, 397, 1165, 1373, 1417, 68, 88, 155, 315, 476, 565, 634, 726,
                1115, 782, 937, 843, 980, 107, 955, 459, 127, 1002, 648, 317, 957, 636, 1065, 939, 369, 1720, 1721, 1651, 1640
            ];
            var jpids = [2357, 346, 476, 315];
            return LLDepends.whenAll(
                loadCardsById(cnids, 'cn'),
                loadCardsById(jpids, 'latest')
            ).then(function () {
                return 0;
            });
        }});
        addTestItem({
            'name': 'Basic calculate',
            'after': test1,
            'cardConfigs': [
                [955, 1, 4, 4, [LLConst.GemType.SCORE_250]],
                [980, 1, 4, 4, [LLConst.GemType.SCORE_250]],
                [459, 1, 1, 1, [LLConst.GemType.SADD_200]],
                [127, 0, 1, 4, [LLConst.GemType.AMUL_24]],
                [1002, 1, 1, 5, [LLConst.GemType.SMUL_10, LLConst.GemType.SMUL_16]],
                [648, 1, 1, 3, [LLConst.GemType.AMUL_18]],
                [317, 1, 2, 3, [LLConst.GemType.AMUL_18]],
                [378, 0, 1, 4, [LLConst.GemType.AMUL_24]],
                [957, 1, 1, 5, [LLConst.GemType.SMUL_10, LLConst.GemType.SMUL_16]]
            ],
            'run': function (cards) {
                var songSetting = {"combo": 359, "positionweight": ["15.5", "26.0", "51.5", "55.0", "52.25", "58.25", "58.5", "26.75", "21.5"], "star": "62", "time": "117", 'difficulty': LLConst.SONG_DIFFICULTY_EXPERT};
                var mapdata = new LLMap({
                    'song': {'group': LLConst.SONG_GROUP_MUSE, "attribute": "pure", "settings": {'1': songSetting}},
                    'songSetting': songSetting
                });
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 37910, 59698, 32990);
                assertAttributeP(llteam.bonusAttr, 0, 7337, 0);
                assertEqual(llteam.totalStrength, 67734);
                assertEqual(llteam.totalAttrStrength, 57788);
                assertEqual(llteam.totalSkillStrength, 9946);
                return 0;
            }
        });
 
        addTestItem({
            'name': 'Smile team with smile song with friend',
            'after': test1,
            'cardConfigs': getSmileTeam(),
            'run': function (cards) {
                var mapdata = new LLMap(buildMapOptionById('529', '887', getFriendCSkill_muse_9_3('smile')));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 78546, 37230, 36880);
                assertAttributeP(llteam.bonusAttr, 16200, 0, 0);
                assertEqual(llteam.totalStrength, 89738);
                assertEqual(llteam.totalAttrStrength, 72088);
                assertEqual(llteam.totalSkillStrength, 17650);
                return 0;
            }
        });
        addTestItem({
            'name': 'Smile team with smile song with friend - autoarm 6.0 gem',
            'after': test1,
            'cardConfigs': getSmileTeam(),
            'run': function (cards) {
                var mapdata = new LLMap(buildMapOptionById('529', '887', getFriendCSkill_muse_9_3('smile')));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.autoArmGem(mapdata.saveData(), getGemStock_60AllGem());
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 81501, 37230, 36880);
                assertAttributeP(llteam.bonusAttr, 16778, 0, 0);
                assertEqual(llteam.totalStrength, 90936);
                assertEqual(llteam.totalAttrStrength, 74798);
                assertEqual(llteam.totalSkillStrength, 16138);
                return 0;
            }
        });
        addTestItem({
            'name': 'Smile team with smile song with friend - autoarm 6.5 gem',
            'after': test1,
            'cardConfigs': getSmileTeam(),
            'run': function (cards) {
                var mapdata = new LLMap(buildMapOptionById('529', '887', getFriendCSkill_muse_9_3('smile')));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.autoArmGem(mapdata.saveData(), getGemStock_65AllGem());
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 85016, 37230, 36880);
                assertAttributeP(llteam.bonusAttr, 17542, 0, 0);
                assertEqual(llteam.totalStrength, 92305);
                assertEqual(llteam.totalAttrStrength, 78025);
                assertEqual(llteam.totalSkillStrength, 14280);
                return 0;
            }
        });
        addTestItem({
            'name': 'Smile team with smile song with friend - autoarm no gem',
            'after': test1,
            'cardConfigs': getSmileTeam(),
            'run': function (cards) {
                var mapdata = new LLMap(buildMapOptionById('529', '887', getFriendCSkill_muse_9_3('smile')));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.autoArmGem(mapdata.saveData(), {'ALL': 0});
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 67743, 37230, 36880);
                assertAttributeP(llteam.bonusAttr, 13963, 0, 0);
                assertEqual(llteam.totalStrength, 69914);
                assertEqual(llteam.totalAttrStrength, 62172);
                assertEqual(llteam.totalSkillStrength, 7742);
                return 0;
            }
        });
        addTestItem({
            'name': 'Smile team with smile song with friend - autounit 4.0 gem',
            'after': test1,
            'cardConfigs': getSmileTeam().concat([
                [1065, 1, 1, 3, []],
                [378, 1, 4, 4, []]
            ]),
            'run': function (cards) {
                var mapdata = new LLMap(buildMapOptionById('529', '887', getFriendCSkill_grade2_9_6('smile')));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                var submembers = buildSubMembers(cards, this.cardConfigs);
                llteam.autoUnit(mapdata.saveData(), getGemStock_40AllGem(), submembers);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 76696, 39960, 36810);
                assertAttributeP(llteam.bonusAttr, 17038, 0, 0);
                assertEqual(llteam.totalStrength, 91930);
                assertEqual(llteam.totalAttrStrength, 70182);
                assertEqual(llteam.totalSkillStrength, 21748);
                return 0;
            }
        });
        var test8 = addTestItem({
            'name': 'Pure muse team with pure aqours song - autounit N-SSR 4.0 gem',
            'after': test1,
            'cardConfigs': getPureTeam().concat([
                [1720, 0, 1, 3, []],
                [1721, 1, 1, 3, []],
                [1651, 1, 1, 6, []],
                [1640, 1, 8, 6, []]
            ]),
            'run': function (cards) {
                var mapdata = new LLMap(buildMapOptionById('446', '520'));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                var submembers = buildSubMembers(cards, this.cardConfigs);
                llteam.autoUnit(mapdata.saveData(), getGemStock_40AllGem(), submembers);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 34090, 70181, 35790);
                assertAttributeP(llteam.bonusAttr, 0, 8514, 0);
                assertEqual(llteam.totalStrength, 66155);
                assertEqual(llteam.totalAttrStrength, 64823);
                assertEqual(llteam.totalSkillStrength, 1332);
                return 0;
            }
        });
        addTestItem({
            'name': 'Pure muse team with pure aqours song - autounit N-SSR 6.0 gem',
            'after': test8,
            'cardConfigs': getPureTeam().concat([
                [1720, 0, 1, 3, []],
                [1721, 1, 1, 3, []],
                [1651, 1, 1, 6, []],
                [1640, 1, 8, 6, []]
            ]),
            'run': function (cards) {
                var mapdata = new LLMap(buildMapOptionById('446', '520'));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                var submembers = buildSubMembers(cards, this.cardConfigs);
                llteam.autoUnit(mapdata.saveData(), getGemStock_60AllGem(), submembers);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 33010, 72833, 35830);
                assertAttributeP(llteam.bonusAttr, 0, 8923, 0);
                assertEqual(llteam.totalStrength, 68605);
                assertEqual(llteam.totalAttrStrength, 67273);
                assertEqual(llteam.totalSkillStrength, 1332);
                return 0;
            }
        });
        addTestItem({
            'name': 'Attribute up sim',
            'after': test1,
            'cardConfigs': [
                [2357, 1, 8, 4, []],
                [346, 1, 1, 4, []],
                [476, 1, 1, 4, []],
                [315, 1, 1, 4, []],
                [315, 1, 1, 4, []],
                [315, 1, 1, 4, []],
                [315, 1, 1, 4, []],
                [315, 1, 1, 4, []],
                [2357, 1, 8, 4, []]
            ],
            'songId': '577',
            'songSettingId': '1171',
            'version': 'latest',
            'run': function (cards, noteData) {
                return calcSim(this, cards, noteData, function (team) {
                    var diffs = [];
                    diffs.push(assertFloatArrayEqual(team.averageSkillsActiveChanceCount,
                    [13, 8, 5, 17, 17, 17, 17, 17, 13], 0.01));
                    diffs.push(assertFloatArrayEqual(team.averageSkillsActiveCount,
                    [3.1235, 3.063, 2.562, 5.914, 5.8885, 5.9145, 5.9905, 5.9475, 7.6535], 0.4));
                    diffs.push(assertFloatEqual(team.averageSkillsActiveCount[8], team.averageSkillsActiveNoEffectCount[0], 0.001));
                    diffs.push(assertFloatArrayEqual(team.averageSkillsActiveNoEffectCount.slice(1),
                    [0, 0, 0, 0, 0, 0, 0, 0], 0));
                    return diffs;
                });
            }
        });
        addTestItem({
            'name': 'Nonet check - muse',
            'after': test1,
            'cardConfigs': [
                [2980, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2605, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2585, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2784, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [980, 1, 8, 4, [LLConst.GemType.NONET_42]],
                [2571, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2695, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2620, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2802, 1, 1, 4, [LLConst.GemType.NONET_42]]
            ],
            'version': 'latest',
            'run': function (cards, noteData) {
                var mapdata = new LLMap(buildMapOptionById('55', '661'));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 90012, 37310, 37560);
                assertAttributeP(llteam.bonusAttr, 8927, 0, 0);
                assertEqual(llteam.totalStrength, 95696);
                assertEqual(llteam.totalAttrStrength, 90012);
                assertEqual(llteam.totalSkillStrength, 5684);
                return 0;
            }
        });
        addTestItem({
            'name': 'Nonet check - aqours',
            'after': test1,
            'cardConfigs': [
                [2815, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2634, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2482, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2791, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2598, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2697, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2609, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2491, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2635, 1, 1, 4, [LLConst.GemType.NONET_42]]
            ],
            'version': 'latest',
            'run': function (cards, noteData) {
                var mapdata = new LLMap(buildMapOptionById('452', '996'));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 34860, 36880, 94263);
                assertAttributeP(llteam.bonusAttr, 0, 0, 9385);
                assertEqual(llteam.totalStrength, 94263);
                assertEqual(llteam.totalAttrStrength, 94263);
                assertEqual(llteam.totalSkillStrength, 0);
                return 0;
            }
        });
        addTestItem({
            'name': 'Nonet check - nijigasaki',
            'after': test1,
            'cardConfigs': [
                [2971, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2783, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [3019, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2757, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2724, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2874, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [3004, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [3010, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [3079, 1, 1, 4, [LLConst.GemType.NONET_42]]
            ],
            'version': 'latest',
            'run': function (cards, noteData) {
                var mapdata = new LLMap(buildMapOptionById('549', '1008'));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 35630, 95573, 38330);
                assertAttributeP(llteam.bonusAttr, 0, 12470, 0);
                assertEqual(llteam.totalStrength, 98895);
                assertEqual(llteam.totalAttrStrength, 94867);
                assertEqual(llteam.totalSkillStrength, 4028);
                return 0;
            }
        });
        addTestItem({
            'name': 'Nonet check - liella',
            'after': test1,
            'cardConfigs': [
                [3094, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [3057, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2939, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2919, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2918, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2951, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [2981, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [3058, 1, 1, 4, [LLConst.GemType.NONET_42]],
                [3095, 1, 1, 4, [LLConst.GemType.NONET_42]]
            ],
            'version': 'latest',
            'run': function (cards, noteData) {
                var mapdata = new LLMap(buildMapOptionById('631', '1446'));
                var llteam = buildTeam(cards, this.cardConfigs, mapdata);
                llteam.calculateAttributeStrength(mapdata.saveData());
                llteam.calculateSkillStrength(mapdata.saveData());
                console.log(llteam);
                assertAttributeP(llteam.finalAttr, 61288, 44880, 50962);
                assertAttributeP(llteam.bonusAttr, 0, 0, 6652);
                assertEqual(llteam.totalStrength, 58810);
                assertEqual(llteam.totalAttrStrength, 57755);
                assertEqual(llteam.totalSkillStrength, 1055);
                return 0;
            }
        });

        /**
         * 
         * @param {LLH.Test.TestCaseData} caseData 
         * @param {LLH.API.CardDictDataType} cards 
         * @param {LLH.API.NoteDataType} noteData 
         */
        function runTestCase(caseData, cards, noteData) {
            var saveData = new LLSaveData(caseData.saveData);
            var member =  saveData.teamMember;
            var llmembers = [];
            for (var i = 0; i < 9; i++) {
                member[i].card = cards[member[i].cardid];
                llmembers.push(new LLMember(member[i], caseData.map.attribute));
            }

            var llteam = new LLTeam(llmembers);
            llteam.calculateAttributeStrength(caseData.map);
            llteam.calculateSkillStrength(caseData.map);

            var expectedResult = caseData.result;
            assertAttributesValue(llteam.finalAttr, expectedResult.finalAttr, 'finalAttr mismatch');
            assertAttributesValue(llteam.bonusAttr, expectedResult.bonusAttr, 'bonusAttr mismatch');
            assertEqual(llteam.totalStrength, expectedResult.totalStrength, 'totalStrength mismatch');
            assertEqual(llteam.totalAttrStrength, expectedResult.totalAttrStrength, 'totalAttrStrength mismatch');
            assertEqual(llteam.totalSkillStrength, expectedResult.totalSkillStrength, 'totalSkillStrength mismatch');

            var diffs = [];
            if (caseData.type == 'v1') {
                llteam.calculateScoreDistribution();
            } else if (caseData.type == 'sim') {
                llteam.simulateScoreDistribution(caseData.map, noteData, 1000);
                diffs.push(assertFloatArrayEqualDynamic(llteam.averageSkillsActiveChanceCount, expectedResult.averageSkillsActiveChanceCount, 0.05));
                diffs.push(assertFloatArrayEqualDynamic(llteam.averageSkillsActiveCount, expectedResult.averageSkillsActiveCount, 0.05));
                diffs.push(assertFloatArrayEqualDynamic(llteam.averageSkillsActiveNoEffectCount, expectedResult.averageSkillsActiveNoEffectCount, 0.05));
                diffs.push(assertFloatArrayEqualDynamic(llteam.averageSkillsActiveHalfEffectCount, expectedResult.averageSkillsActiveHalfEffectCount, 0.05));
            } else {
                return 0;
            }
            caseData.maxDiff = arrayMaxValue(diffs);
        }

        addTestItem({
            'name': 'Load more test cases',
            'after': test1,
            'run': function () {
                return loadTestCase('1').then(function (caseData) {
                    /** @type {LLH.Test.TestItemOptions} */
                    var testOptions = caseData;
                    var cardConfigs = [];
                    var saveData = new LLSaveData(caseData.saveData);
                    var teamMembers = saveData.teamMember;
                    for (var i = 0; i < teamMembers.length; i++) {
                        cardConfigs.push([parseInt(teamMembers[i].cardid)]);
                    }
                    testOptions.cardConfigs = cardConfigs;
                    testOptions.run = function (cards, noteData) {
                        return runTestCase(caseData, cards, noteData);
                    }
                    addTestItem(caseData).start();
                    return 0;
                })
            }
        });
        // run tests
        var defers = [];
        for (var i = 1; i < testSet.length; i++) {
            defers.push(testSet[i].start());
        }
    }

    g_page_load_case = function () {
        addTestItem({'name': '载入页面', 'run': function () { return defer_test_load; }}).start();
    };

    LLDepends.whenAll(
        LLMetaData.get(),
        LLCardData.getAllBriefDataWithVersion('cn'),
        LLCardData.getAllBriefDataWithVersion('latest'),
        LLSongData.getAllBriefData(),
        loadDeferred).then(
        init,
        function (e) {
            defer_test_load.reject(e);
            document.getElementById('loadingbox').style.display = 'none';
        }
    );
}

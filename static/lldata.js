/**
 * This script contains following things:
 *   LoadingUtil
 *   LLHelperLocalStorage
 *   LLData
 *     (instance) LLCardData
 *     (instance) LLSongData
 *   LLSimpleKeyData
 *     (instance) LLMetaData
 *   LLMapNoteData
 *   LLConst
 *   LLUnit
 *   LLMap
 *   LLSisGem
 *   LLSkill
 *   LLMember
 *   LLSimulateContext
 *   LLTeam
 *   LLSaveData
 *   LLSaveLoadJsonMixin
 *   LLSwapper
 *
 * components:
 *   LLComponentBase
 *     +- LLValuedComponent
 *     | +- LLSelectComponent
 *     +- LLImageComponent
 *   LLComponentCollection
 *     +- LLFiltersComponent
 *     | +- LLCardSelectorComponent
 *     | +- LLGemSelectorComponent
 *     | +- LLSongSelectorComponent
 *     +- LLSkillContainer
 *   LLGemStockComponent
 *   LLSubMemberComponent
 *   LLMicDisplayComponent
 *   LLSaveStorageComponent
 *   LLDataVersionSelectorComponent
 *   LLScoreDistributionParameter
 *   LLScoreDistributionChart
 *   LLTeamComponent
 *   LLCSkillComponent
 *   LLUnitResultComponent
 *
 * v2.0
 * By ben1222
 */
"use strict";

/** @type {LLH.Depends.Utils} */
var LLDepends = {
   createDeferred: function () {
      return $.Deferred();
   },
   whenAll: function (...args) {
      return $.when.apply($, args);
   },
   whenAllByArray: function (arr) {
      return $.when.apply($, arr);
   }
};

/*
 * LoadingUtil: utility to show loading box when defers are not resolved
 * and hide the loading box when defers are resolved or rejected
 */
var LoadingUtil = {
   start: function (defers, merger) {
      return LoadingUtil.startImpl(defers, 'loadingbox', 'loadingbox_progress', merger);
   },
   /**
    * @template DoneT, FailT
    * @param {LLH.Depends.Promise<DoneT, FailT>} defer 
    * @returns {LLH.Depends.Promise<DoneT, FailT>}
    */
   startSingle: function (defer) {
      return LoadingUtil.startImpl([defer], 'loadingbox', 'loadingbox_progress').then(function (data) { return data[0]; });
   },
   startImpl: function (defers, loadingboxid, progressboxid, merger) {
      var defer = LLDepends.createDeferred();
      var result = {};
      if ((!defers) || defers.length == 0) {
         defer.resolve(result);
         return defer;
      }
      var loadingbox = document.getElementById(loadingboxid);
      var progressbox = document.getElementById(progressboxid);
      var finishedCount = 0;
      var failedCount = 0;
      var totalCount = defers.length;

      var updateProgress = function() {
         if (progressbox) {
            if (failedCount == 0) {
               progressbox.innerHTML = finishedCount + ' / ' + totalCount;
            } else {
               progressbox.innerHTML = (finishedCount + failedCount) + ' / ' + totalCount + ' (' + failedCount + '个资源载入失败)';
            }
         }
      };

      var updateLoadingBox = function(s) {
         if (loadingbox) {
            loadingbox.style.display = s;
         }
      };

      updateProgress();
      updateLoadingBox('');
      for (var i = 0; i < totalCount; i++) {
         (function (index) {
            defers[index].then(function(data) {
               if (merger) {
                  merger(data, index, result);
               } else {
                  result[index] = data;
               }
               finishedCount++;
               updateProgress();
               if (finishedCount == totalCount) {
                  updateLoadingBox('none');
                  defer.resolve(result);
               }
            }, function() {
               failedCount++;
               updateProgress();
               defer.reject();
            });
         })(i);
      }
      return defer;
   },

   cardDetailMerger: function (card, index, result) {
      result[parseInt(card.id)] = card;
   },

   stop: function () {
      var loadingbox = document.getElementById('loadingbox');
      if (loadingbox) {
         loadingbox.style.display = 'none';
      }
   }
};

var LLClassUtil = {
   /**
    * Set super class
    * @param {*} cls 
    * @param {*} superCls 
    */
   'setSuper': function (cls, superCls) {
      var s = function () {};
      s.prototype = superCls.prototype;
      cls.prototype = new s();
      cls.prototype.constructor = cls;
  }
};

const LLHelperLocalStorageKeys = {
   'localStorageDataVersionKey': 'llhelper_data_version__',
   'localStorageDistParamKey': 'llhelper_dist_param__',
   'localStorageDistParamLAKey': 'llhelper_dist_param_la__',
   'localStorageLLNewUnitTeamKey': 'llhelper_llnewunit_team__',
   'localStorageLLNewUnitSisTeamKey': 'llhelper_llnewunitsis_team__',
   'localStorageLLNewUnitLATeamKey': 'llhelper_llnewunitla_team__',
   'localStorageLLNewAutoUnitTeamKey': 'llhelper_llnewautounit_team__',
   'localStorageSongSelectKey': 'llhelper_song_select__',
   'localStorageCardSelectKey': 'llhelper_card_select__',
   'localStorageLanguageKey': 'llhelper_language__',
   'localStorageAccessorySelectKey': 'llhelper_accessory_select__',
   'localStorageCardPoolKey': 'llhelper_card_pool__',
   'localStorageMezameKey': 'llhelper_mezame__'
};

/** @type {LLH.Persistence.LLHelperLocalStorage} */
var LLHelperLocalStorage = {
   'getDataVersion': function () {
      var version;
      try {
         version = localStorage.getItem(LLHelperLocalStorageKeys.localStorageDataVersionKey);
      } catch (e) {
         version = 'latest';
         console.error(e);
      }
      return (version || 'latest');
   },
   'setDataVersion': function (v) {
      try {
         localStorage.setItem(LLHelperLocalStorageKeys.localStorageDataVersionKey, v);
      } catch (e) {
         console.error(e);
      }
   },
   'getData': function (key, default_value) {
      var ret;
      try {
         ret = localStorage.getItem(key);
         if (ret === undefined || ret === null) ret = default_value;
      } catch (e) {
         ret = default_value;
         console.error(e);
      }
      return ret;
   },
   'setData': function (key, value) {
      try {
         localStorage.setItem(key, value);
      } catch (e) {
         console.error(e);
      }
   },
   'clearData': function (key) {
      try {
         localStorage.removeItem(key);
      } catch (e) {
         console.error(e);
      }
   }
};

/** @type {typeof LLH.Persistence.LLSaveLoadJsonGroup} */
var LLSaveLoadJsonGroup = (function () {
   /**
    * @constructor
    */
   function LLSaveLoadJsonGroup_cls() {
      /** @type {LLH.Persistence.SaveLoadJsonConfig[]} */
      this.groups = [];
   }
   /**
    * @param {string} key 
    * @param {LLH.Mixin.SaveLoadJson} serializable 
    * @param {string} [defaultJson]
    * @param {boolean} [skipClear]
    */
   LLSaveLoadJsonGroup_cls.prototype.register = function (key, serializable, defaultJson, skipClear) {
      this.groups.push({
         'key': key,
         'serializable': serializable,
         'defaultJson': defaultJson,
         'skipClear': skipClear
      });
   };
   LLSaveLoadJsonGroup_cls.prototype.loadAll = function () {
      for (var i = 0; i < this.groups.length; i++) {
         var config = this.groups[i];
         config.serializable.loadJson(LLHelperLocalStorage.getData(config.key, config.defaultJson));
      }
   };
   LLSaveLoadJsonGroup_cls.prototype.saveAll = function () {
      for (var i = 0; i < this.groups.length; i++) {
         var config = this.groups[i];
         LLHelperLocalStorage.setData(config.key, config.serializable.saveJson());
      }
   };
   LLSaveLoadJsonGroup_cls.prototype.clearAll = function () {
      for (var i = 0; i < this.groups.length; i++) {
         var config = this.groups[i];
         if (!config.skipClear) {
            LLHelperLocalStorage.clearData(config.key);
         }
      }
   };
   return LLSaveLoadJsonGroup_cls;
})();

var SaveLoadJsonBase = (function () {
   /**
    * @template DataT
    * @implements {LLH.Mixin.SaveLoadJson}
    * @implements {LLH.Mixin.SaveLoadable<DataT>}
    */
   class SaveLoadJsonBase {
      constructor() {}
      /** @returns {DataT | undefined} */
      saveData() {
         return undefined;
      }
      /** @param {DataT} [data] */
      loadData(data) {}
      saveJson() {
         return JSON.stringify(this.saveData());
      }
      /** @param {string} [jsonData] */
      loadJson(jsonData) {
         try {
            if ((!jsonData) || jsonData == 'undefined') {
               this.loadData();
            } else {
               var json = JSON.parse(jsonData);
               this.loadData(json);
            }
         } catch (e) {
            console.error('Failed to load json:');
            console.error(e);
            console.info(jsonData);
         }
      }
   }

   return SaveLoadJsonBase;
})();

var SaveLoadableGroup = (function () {
   /**
    * @template [DataT=LLH.Mixin.SaveLoadableGroupDataType]
    * @extends {LLH.Mixin.SaveLoadJsonBase<DataT>}
    */
   class SaveLoadableGroup extends SaveLoadJsonBase {
      constructor() {
         super();
         /** @type {{[key: string]: LLH.Mixin.SaveLoadable<any>}} */
         this._saveLoadableMap = {};
      }
      /**
       * @template SubDataT
       * @param {string} key
       * @param {LLH.Mixin.SaveLoadable<SubDataT>} saveLoadable
       */
      addSaveLoadable(key, saveLoadable) {
         this._saveLoadableMap[key] = saveLoadable;
      }
      /**
       * @template {LLH.Mixin.SaveLoadable} T
       * @param {string} key 
       * @returns {T | undefined}
       */
      getSaveLoadable(key) {
         return /** @type {T} */ (this._saveLoadableMap[key]);
      }
      /** @override */
      saveData() {
         var ret = {};
         for (var k in this._saveLoadableMap) {
            ret[k] = this._saveLoadableMap[k].saveData();
         }
         return /** @type {DataT} */ (ret);
      }
      /**
       * @override
       * @param {DataT} [data]
       */
      loadData(data) {
         for (var k in this._saveLoadableMap) {
            if (data && data[k] !== undefined) {
               this._saveLoadableMap[k].loadData(data[k]);
            } else {
               this._saveLoadableMap[k].loadData();
            }
         }
      }
   }
   return SaveLoadableGroup;
})();

/*
 * LLData: class to load json data from backend
 * LLSimpleKeyData: class to load json data from backend
 * LLCardData: instance for LLData, load card data
 * LLSongData: instance for LLData, load song data
 * LLMetaData: instance for LLSimpleKeyData, load meta data
 * require jQuery
 */
/** @type {typeof LLH.LLData} */
var LLData = (function () {
   /**
    * @template DataT
    * @constructor
    * @param {string} brief_url 
    * @param {string} detail_url 
    * @param {string[]} brief_keys 
    * @param {string} [version] 
    */
   function LLData_cls(brief_url, detail_url, brief_keys, version) {
      this.briefUrl = brief_url;
      this.detailUrl = detail_url;
      this.briefKeys = brief_keys;
      this.briefCache = {};
      this.briefCachedKeys = {};
      this.detailCache = {};
      this.version = 'latest';
      this.setVersion(version);
   }
   /** @param {string} [version] */
   LLData_cls.prototype.setVersion = function(version) {
      if (version === undefined) {
         version = LLHelperLocalStorage.getDataVersion();
      }
      this.version = version;
      this.initVersion(version);
   };
   LLData_cls.prototype.initVersion = function (version) {
      if (!this.briefCache[version]) {
         this.briefCache[version] = {};
         this.briefCachedKeys[version] = {};
         this.detailCache[version] = {};
      }
   };
   LLData_cls.prototype.getVersion = function() {
      return this.version;
   };
   LLData_cls.prototype.getAllCachedBriefData = function() {
      return this.briefCache[this.version];
   };
   LLData_cls.prototype.getCachedDetailedData = function (key) {
      var v = this.detailCache[this.version];
      if (v && v[key]) {
         return v[key];
      } else {
         return undefined;
      }
   };

   LLData_cls.prototype.getAllBriefDataWithVersion = function(version, keys, url) {
      if (keys === undefined) keys = this.briefKeys;
      if (url === undefined) url = this.briefUrl;
      var me = this;
      var missingKeys = [];
      var defer = LLDepends.createDeferred();
      me.initVersion(version);
      for (var i = 0; i < keys.length; i++) {
         var key = keys[i];
         if (!me.briefCachedKeys[version][key]) {
            missingKeys.push(key);
         }
      }
      if (missingKeys.length == 0) {
         defer.resolve(me.briefCache[version]);
         return defer;
      }
      var requestKeys = missingKeys.sort().join(',');

      $.ajax({
         'url': url,
         'type': 'GET',
         'data': {
            'keys': requestKeys,
            'version': version
         },
         'success': function (data) {
            var curCache = me.briefCache[version];
            for (var index in data) {
               if (!curCache[index]) {
                  curCache[index] = data[index];
               } else {
                  var curData = data[index];
                  var curCache = curCache[index];
                  for (var curKey in curData) {
                     curCache[curKey] = curData[curKey];
                  }
               }
            }
            for (var i = 0; i < missingKeys.length; i++) {
               me.briefCachedKeys[version][missingKeys[i]] = 1;
            }
            defer.resolve(curCache);
         },
         'error': function (xhr, textStatus, errorThrown) {
            console.error("Failed on request to " + url + " with keys:\"" + requestKeys + "\": " + textStatus);
            console.error(errorThrown);
            defer.reject();
         },
         'dataType': 'json'
      });
      return defer;
   };
   LLData_cls.prototype.getAllBriefData = function(keys, url) {
      return this.getAllBriefDataWithVersion(this.version, keys, url);
   };

   LLData_cls.prototype.getDetailedDataWithVersion = function(version, index, url) {
      if (url === undefined) url = this.detailUrl;
      var defer = LLDepends.createDeferred();
      if (index === undefined) {
         console.error("Index not specified");
         defer.reject();
         return defer;
      }
      var me = this;
      me.initVersion();
      if (me.detailCache[version][index]) {
         defer.resolve(me.detailCache[version][index]);
         return defer;
      }
      url = url + index;
      $.ajax({
         'url': url ,
         'data': {
            'version': version
         },
         'type': 'GET',
         'success': function (data) {
            me.detailCache[version][index] = data;
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
   };
   LLData_cls.prototype.getDetailedData = function(index, url) {
      return this.getDetailedDataWithVersion(this.version, index, url);
   };
   return LLData_cls;
})();

var LLSimpleKeyData = (function () {
   /** @template T */
   class LLSimpleKeyData_cls {
      /**
       * @param {string} url 
       * @param {string[]} keys 
       */
      constructor(url, keys) {
         this.url = url;
         this.keys = keys;
         this.cache = /** @type {T} */ ({});
      }
      /**
       * @param {string[]} [keys] 
       * @param {string} [url] 
       */
      get(keys, url) {
         if (keys === undefined)
            keys = this.keys;
         if (url === undefined)
            url = this.url;
         var me = this;
         var missingKeys = [];
         /** @type {LLH.Depends.Deferred<T, void>} */
         var defer = LLDepends.createDeferred();
         for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!me.cache[key]) {
               missingKeys.push(key);
            }
         }
         if (missingKeys.length == 0) {
            defer.resolve(me.cache);
            return defer;
         }
         var requestKeys = missingKeys.sort().join(',');

         $.ajax({
            'url': url,
            'data': {
               'keys': requestKeys
            },
            'type': 'GET',
            'success': function (data) {
               for (var index in data) {
                  me.cache[index] = data[index];
               }
               defer.resolve(me.cache);
            },
            'error': function (xhr, textStatus, errorThrown) {
               console.error("Failed on request to " + me.url + ": " + textStatus);
               console.error(errorThrown);
               defer.reject();
            },
            'dataType': 'json'
         });
         return defer;
      }
   }
   return LLSimpleKeyData_cls;
})();

/** @type {LLH.LLData<LLH.API.CardDataType>} */
var LLCardData = new LLData('/lldata/cardbrief', '/lldata/card/',
   ['id', 'typeid', 'support', 'rarity', 'attribute', 'special', 'type', 'skilleffect', 'triggertype', 'triggerrequire', 'eponym', 'jpeponym', 'hp', 'album']);
/** @type {LLH.LLData<LLH.API.SongDataType>} */
var LLSongData = new LLData('/lldata/songbrief', '/lldata/song/',
   ['id', 'attribute', 'name', 'jpname', 'settings', 'group']);
/** @type {LLH.LLData<LLH.API.SisDataType>} */
var LLSisData = new LLData('/lldata/sisbrief', '/lldata/sis/',
   ['id', 'type', 'jpname', 'cnname', 'level', 'size', 'range', 'effect_type', 'effect_value', 'color', 'fixed', 'member', 'grade', 'group',
    'trigger_ref', 'trigger_value', 'sub_skill', 'live_effect_type', 'live_effect_interval', 'level_up_skill']);
/** @type {LLH.LLData<LLH.API.AccessoryDataType>} */
var LLAccessoryData = new LLData('/lldata/accessorybrief', '/lldata/accessory/',
   ['id', 'jpname', 'cnname', 'rarity', 'smile', 'pure', 'cool', 'is_material', 'effect_type', 'unit_id', 'max_level', 'trigger_type', 'trigger_effect_type']);
/** @type {LLH.LLSimpleKeyData<LLH.API.MetaDataType>} */
var LLMetaData = new LLSimpleKeyData('/lldata/metadata', ['album', 'member_tag', 'unit_type', 'cskill_groups']);

var LLMapNoteData = (function () {
   /**
    * @constructor
    * @param {string} [base_url]
    */
   function LLMapNoteData_cls(base_url) {
      this.baseUrl = (base_url || 'https://rawfile.loveliv.es/livejson/');
      this.cache = {};
   }
   function createMapData(combo, time) {
      if (combo <= 0 || time <= 3) return undefined;
      var data = [];
      // 第一秒和最后一秒不填note, 其它时间把note平均分布在除5号位外的8个位置上
      var interval = (time - 2)/combo;
      for (var i = 0; i < combo; i++) {
         var pos = (i%8)+1;
         if (pos >= 5) pos = pos+1;
         data.push({
            "timing_sec": i*interval+1,
            // notes_attribute
            "notes_level": 1,
            "effect": 1,
            "effect_value": 2,
            "position": pos
         });
      }
      return data;
   }
   function handleLocalServerCache(me, jsonPath, liveId, defer) {
      $.ajax({
         'url': '/static/live/json/' + liveId + '.json',
         'type': 'GET',
         'success': function (data) {
            me.cache[jsonPath] = data;
            defer.resolve(data);
         },
         'error': function (xhr, textStatus, errorThrown) {
            console.error("Failed on request to local cache for live id " + liveId + ": " + textStatus);
            console.error(errorThrown);
            defer.reject();
         },
         'dataType': 'json'
      });
   }
   function handleLocalCache(me, jsonPath, liveId, defer) {
      if (!jsonPath) {
         console.error('No json path found for liveSetting id : ' + liveId);
         defer.reject();
         return true;
      }
      if (me.cache[jsonPath]) {
         defer.resolve(me.cache[jsonPath]);
         return true;
      }
      return false;
   }
   /**
    * @param {LLH.API.SongDataType} song 
    * @param {LLH.API.SongSettingDataType} songSetting 
    * @returns {LLH.Depends.Promise<LLH.API.NoteDataType[], void>}
    */
   LLMapNoteData_cls.prototype.getMapNoteData = function (song, songSetting) {
      var defer = LLDepends.createDeferred();
      if (song.attribute == 'all') {
         // 默认曲目
         defer.resolve(createMapData(songSetting.combo, songSetting.time));
         return defer;
      }
      var jsonPath = songSetting.jsonpath;
      var liveId = songSetting.liveid;
      var me = this;
      if (handleLocalCache(me, jsonPath, liveId, defer)) return defer;
      var url = me.baseUrl + jsonPath;
      $.ajax({
         'url': url ,
         'type': 'GET',
         'success': function (data) {
            me.cache[jsonPath] = data;
            defer.resolve(data);
         },
         'error': function (xhr, textStatus, errorThrown) {
            console.info("Failed on request to " + url + ": " + textStatus + ', retry on local cache');
            console.info(errorThrown);
            if (!liveId) {
               console.error('No live id found for liveSetting id : ' + liveId);
               console.error(song);
               defer.reject();
            } else {
               handleLocalServerCache(me, jsonPath, liveId, defer);
            }
         },
         'dataType': 'json'
      });
      return defer;
   };
   /**
    * @param {LLH.API.SongDataType} song 
    * @param {LLH.API.SongSettingDataType} songSetting 
    * @returns {LLH.Depends.Promise<LLH.API.NoteDataType[], void>}
    */
   LLMapNoteData_cls.prototype.getLocalMapNoteData = function (song, songSetting) {
      var me = this;
      var defer = LLDepends.createDeferred();
      if (song.attribute == 'all') {
         // 默认曲目
         defer.resolve(createMapData(songSetting.combo, songSetting.time));
         return defer;
      }
      var jsonPath = songSetting.jsonpath;
      var liveId = songSetting.liveid;
      if (handleLocalCache(me, jsonPath, liveId, defer)) return defer;
      handleLocalServerCache(me, jsonPath, liveId, defer);
      return defer;
   };
   return LLMapNoteData_cls;
})();

// base components

var LLComponentBase = (function () {
   /**
    * @template {HTMLElement} [ElementType = HTMLElement]
    * @template [DataT = boolean]
    * @extends {SaveLoadJsonBase<DataT>}
    */
   class LLComponentBase_cls extends SaveLoadJsonBase {
      /**
       * @param {ElementType | string} [id] 
       * @param {LLH.Component.LLComponentBase_Options} [options] 
       */
      constructor(id, options) {
         super();
         this.id = undefined;
         this.exist = false;
         this.visible = false;
         /** @type {ElementType | undefined} */
         this.element = undefined;
         if (id) {
            if (typeof(id) == 'string') this.id = id;
            this.element = /** @type {ElementType} */ (LLUnit.getElement(id));
            if (this.element) {
               this.exist = true;
               if (this.element.style.display != 'none') {
                  this.visible = true;
               }
               if (options && options.listen) {
                  var listenList = Object.keys(options.listen);
                  for (var i = 0; i < listenList.length; i++) {
                     var e = listenList[i];
                     this.on(e, options.listen[e]);
                  }
               }
            }
         }
      }
      show() {
         if (!this.element) return;
         if (this.visible) return;
         this.element.style.display = '';
         this.visible = true;
      }
      hide() {
         if (!this.element) return;
         if (!this.visible) return;
         this.element.style.display = 'none';
         this.visible = false;
      }
      toggleVisible() {
         if (!this.element) return;
         if (this.visible) {
            this.hide();
         } else {
            this.show();
         }
      }
      /** @param {boolean} visible */
      setVisible(visible) {
         if (visible) this.show();
         else this.hide();
      }
      /** @param {string} newClassName */
      setClassName(newClassName) {
         if (!this.element) return;
         if (this.element.className == newClassName) return;
         this.element.className = newClassName;
      }
      /** @param {string} tooltips */
      setTooltips(tooltips) {
         if (!this.element) return;
         if (this.element.title == tooltips) return;
         this.element.title = tooltips;
      }
      saveData() {
         if (!this.element) return undefined;
         return /** @type {DataT} */ (this.visible);
      }
      /** @param {DataT} [data] */
      loadData(data) {
         if (data === undefined) return;
         if (data) {
            this.show();
         } else {
            this.hide();
         }
      }
      /**
       * @param {string} e 
       * @param {(event: Event) => void} callback 
       */
      on(e, callback) {
         if (!this.element) return;
         if ((!e) || (!callback)) return;
         this.element.addEventListener(e, callback);
      }
      isInDocument() {
         return !!(this.element && this.element.ownerDocument);
      }
   }

   return LLComponentBase_cls;
})();

var LLValuedComponent = (function() {
   /**
    * @template {HTMLElement} [ElementType = HTMLElement]
    * @template [ValueType = string]
    * @extends {LLComponentBase<ElementType, ValueType>}
    */
   class LLValuedComponent_cls extends LLComponentBase {
      /**
       * @param {ElementType | string} [id] 
       * @param {LLH.Component.LLValuedComponent_Options} [options] 
       */
      constructor(id, options) {
         super(id, options);
         /** @type {((newValue: ValueType) => void) | undefined} */
         this.onValueChange = undefined;
         /** @type {ValueType=} */
         this.value = undefined;
         if (!this.element) {
            this.valueKey = 'innerHTML';
            return this;
         }
         /** @type {HTMLElement} */
         var element = this.element;
         var vk = (options && options.valueKey ? options.valueKey : '');
         if (!vk) {
            var tag = element.tagName.toUpperCase();
            if (tag == 'INPUT') {
               if ((/** @type {HTMLInputElement} */ (element)).type.toUpperCase() == 'CHECKBOX') {
                  vk = 'checked';
               } else {
                  vk = 'value';
               }
            } else if (tag == 'SELECT' ) {
               vk = 'value';
            } else {
               vk = 'innerHTML';
            }
         }
         this.valueKey = vk;
         this.value = element[vk];
         var me = this;
         this.on('change', function (e) {
            me.set(element[me.valueKey]);
         });
      }
      get() {
         return this.value;
      }
      /** @param {ValueType} defaultValue */
      getOrElse(defaultValue) {
         var ret = this.get();
         if (ret === undefined) return defaultValue;
         return ret;
      }
      /** @param {ValueType} v */
      set(v) {
         if (!this.element) return;
         if (v == this.value) return;
         this.element[this.valueKey] = v;
         this.value = v;
         if (this.onValueChange) this.onValueChange(v);
      }
      saveData() {
         return this.get();
      }
      /** @param {ValueType} [data] */
      loadData(data) {
         if (data === undefined) return;
         this.set(data);
      }
   }

   return LLValuedComponent_cls;
})();

var LLValuedMemoryComponent = (function() {
   /**
    * @template [ValueType = string]
    * @extends {LLValuedComponent<HTMLElement, ValueType>}
    */
   class LLValuedMemoryComponent_cls extends LLValuedComponent {
      /** @param {ValueType} initialValue */
      constructor(initialValue) {
         super();
         this.value = initialValue;
      }
      get() {
         return this.value;
      }
      /** @param {ValueType} v */
      set(v) {
         if (v == this.value) return;
         this.value = v;
         if (this.onValueChange) this.onValueChange(v);
      }
   }

   return LLValuedMemoryComponent_cls;
})();

var LLSelectComponent = (function() {
   /**
    * @template {string} [ValueType = string]
    * @extends {LLValuedComponent<HTMLSelectElement, ValueType>}
    */
   class LLSelectComponent_cls extends LLValuedComponent {
      /**
       * @param {HTMLSelectElement | string} id 
       * @param {LLH.Component.LLValuedComponent_Options} [options] 
       */
      constructor(id, options) {
         super(id, options);
         /** @type {LLH.Component.LLSelectComponent_OptionDef<ValueType>[]} */
         this.options = [];
         /** @type {LLH.Component.LLSelectComponent_OptionDef<ValueType>[]} read only*/
         this.filteredOptions = [];
         /** @type {LLH.Component.LLSelectComponent_FilterCallback<ValueType> | undefined} */
         this.filter = undefined;
         if (!this.element) {
            return this;
         }
         var orig_opts = this.element.options;
         for (var i = 0; i < orig_opts.length; i++) {
            this.options.push({
               value: /** @type {ValueType} */ (orig_opts[i].value),
               text: orig_opts[i].text
            });
         }
      }
      /**
       * @override
       * @param {ValueType} v 
       */
      set(v) {
         if (!this.element) return;
         if (v != this.element[this.valueKey]) {
            this.element[this.valueKey] = v;
         }
         if (this.element.selectedIndex >= 0) {
            var curOption = this.element.options[this.element.selectedIndex];
            var curBackground = curOption.style['background-color'];
            this.element.style.color = curOption.style.color;
            this.element.style['background-color'] = (curBackground == '#fff' ? '' : curBackground);
         }
         if (v != this.value) {
            this.value = v;
            if (this.onValueChange) this.onValueChange(v);
         }
      }
      /**
       * @param {LLH.Component.LLSelectComponent_OptionDef<ValueType>[]} options 
       * @param {LLH.Component.LLSelectComponent_FilterCallback<ValueType>} [filter] 
       */
      setOptions(options, filter) {
         if (!this.exist) return;
         this.options = options || [];
         this.filterOptions(filter);
      }
      /** @param {LLH.Component.LLSelectComponent_FilterCallback<ValueType>} [filter] */
      filterOptions(filter) {
         if (!this.element) return;
         if (!filter) filter = this.filter;
         var oldValue = this.get();
         var foundOldValue = false;
         /** @type {LLH.Component.LLSelectComponent_OptionDef<ValueType>[]} */
         var filteredOptions = [];
         this.element.options.length = 0;
         for (var i in this.options) {
            var option = this.options[i];
            if (filter && !filter(option)) continue;
            filteredOptions.push(option);
            var newOption = new Option(option.text, option.value);
            newOption.style.color = option.color || '';
            newOption.style['background-color'] = option.background || '#fff';
            this.element.options.add(newOption);
            if (oldValue == option.value) foundOldValue = true;
         }
         if (foundOldValue && oldValue !== undefined) {
            this.set(oldValue);
         } else {
            this.set(/** @type {ValueType} */ (this.element.value));
         }
         this.filter = filter;
         this.filteredOptions = filteredOptions;
      }
   }

   return LLSelectComponent_cls;
})();

var LLImageComponent = (function() {
   /**
    * @extends {LLComponentBase<HTMLImageElement>}
    */
   class LLImageComponent_cls extends LLComponentBase {
      /**
       * @param {HTMLImageElement | string} id 
       * @param {LLH.Component.LLImageComponent_Options} [options] 
       */
      constructor(id, options) {
         super(id, options);
         /** @type {string[]} */
         this.srcList = [];
         /** @type {number | undefined} */
         this.curSrcIndex = undefined;
         if (!this.element) {
            this.curSrcIndex = undefined;
            return this;
         }
         var srcList = (options && options.srcList ? options.srcList : [this.element.src]);
         var me = this;
         this.on('error', function (e) {
            if (me.curSrcIndex === undefined) return;
            if (!me.element) return;
            if (me.curSrcIndex < me.srcList.length-1) {
               me.curSrcIndex++;
               me.element.src = me.srcList[me.curSrcIndex];
            } else {
               console.error('Failed to load image');
               console.error(me.srcList);
            }
         });
         this.on('reset', function (e) {
            console.error('reset called, src=' + (me.element && me.element.src));
            console.error(e);
         });
         this.setSrcList(srcList);
      }
      /** @param {string[]} srcList */
      setSrcList(srcList) {
         this.srcList = srcList;
         if (!this.element) return;
         if (srcList.length > 0) {
            for (var i = 0; i < srcList.length; i++) {
               // skip if already in list
               if (this.element.src == srcList[i]) {
                  this.curSrcIndex = i;
                  return;
               }
            }
            this.curSrcIndex = 0;
            this.element.src = '';
            this.element.src = this.srcList[0];
         } else {
            this.curSrcIndex = undefined;
            this.element.src = '';
         }
      }
      /** @param {string} text */
      setAltText(text) {
         if (!this.element) return;
         if (this.element.title == text) {
            return;
         }
         this.element.title = text;
         // this.element.alt = text;
      }
   }

   return LLImageComponent_cls;
})();

var LLAvatarComponent = (function () {
   class LLAvatarComponent extends LLImageComponent {
      /** @param {LLH.Component.LLAvatarComponent_Options} [options] */
      constructor(options) {
         if (!options) {
            options = {};
         }
         /** @type {HTMLImageElement} */
         var id = LLUnit.getOrCreateElement(options.id, 'img', {
            'src': '/static/null.png',
            'className': (options.smallAvatar ? 'avatar' : '')
         });
         super(id, options);
         this.element = id;
         /** @type {LLH.Core.CardIdStringType=} */
         this.cardId = undefined;
         this.mezame = false;
         this.setCard(options.cardId, options.mezame);
      }
      /**
       * @param {LLH.Core.CardIdStringType} [cardId] 
       * @param {boolean | LLH.Core.MezameType} [mezame] 
       */
      setCard(cardId, mezame) {
         var newMezame = (mezame ? true : false);
         if (this.cardId != cardId || this.mezame != newMezame) {
            this.cardId = cardId;
            this.mezame = newMezame;
            this.setSrcList(LLUnit.getImagePathList(cardId, 'avatar', newMezame));
            if (cardId) {
               this.setAltText(LLConst.Common.getCardDescription((LLCardData.getAllCachedBriefData() || {})[cardId] || {'id': cardId}, LLConstValue.LANGUAGE_CN, newMezame));
            } else {
               this.setAltText('');
            }
            var me = this;
            LLImageServerSwitch.registerCallback(this, function () {
               me.setSrcList(LLUnit.getImagePathList(cardId, 'avatar', newMezame));
            });
         }
      }
      getCardId() { return this.cardId; }
      getMezame() { return this.mezame; }
   }
   return LLAvatarComponent;
})();

var LLButtonComponent = (function () {
   /** @extends {LLComponentBase<HTMLButtonElement>} */
   class LLButtonComponent extends LLComponentBase {
      /** @param {LLH.Component.LLButtonComponent_Options} options */
      constructor(options) {
         var id = options.id;
         /** @type {LLH.Component.LLComponentBase_Options} */
         var superOptions = {};
         if (!id) {
            var colorStyle = options.colorStyle || 'default';
            /** @type {HTMLButtonElement} */
            var button = LLUnit.createElement('button', {'className': 'btn btn-' + colorStyle, 'type': 'button', 'style': options.style, 'innerHTML': options.text});
            id = button;
         }
         if (options.click) {
            superOptions.listen = {'click': options.click};
         }
         super(id, superOptions);

         if (options.tooltips) {
            this.setTooltips(options.tooltips);
         }
      }
      /** @param {boolean} enabled */
      setEnabled(enabled) {
         if (!this.element) return;
         this.element.disabled = !enabled;
      }
      /** @param {string} text */
      setText(text) {
         if (!this.element) return;
         this.element.innerHTML = text;
      }
   }
   return LLButtonComponent;
})();

var LLDialogComponent = (function () {
   const ZINDEX_BASE = 101;
   var dialogDepth = 0;

   class LLDialogComponent {
      /** @param {LLH.Component.LLDialogComponent_Options} options */
      constructor(options) {
         var me = this;
         var closeButton = LLUnit.createElement('a', { 'title': '关闭', 'className': 'dialog-close-button' }, undefined, {
            'click': () => me.close()
         });
         var height = options.height || '80%';
         var width = options.width || '80%';
         var dialogContent;
         if (height == 'auto') {
            dialogContent = LLUnit.createElement('div', {'style': {
               'display': 'flex',
               'overflowY': 'auto',
               'maxHeight': (document.documentElement.clientHeight * 0.8).toFixed(0) + 'px'
            }}, options.content);
         } else {
            dialogContent = options.content;
         }

         this.depth = dialogDepth;
         dialogDepth += 1;
         this.closeCallback = options.closeCallback;
         this.overlay = LLUnit.createElement('div', {
            'className': 'dialog-overlay',
            'style': {'zIndex': (ZINDEX_BASE + this.depth * 2).toFixed()}
         }, undefined, {
            'click': () => me.close()
         });
         this.dialog = LLUnit.createElement('div', {
            'className': 'dialog-main',
            'style': {
               'display': 'block',
               'height': height,
               'width': width,
               'zIndex': (ZINDEX_BASE + this.depth * 2 + 1).toFixed()
            }
         }, dialogContent);
         LLUnit.updateSubElements(this.dialog, closeButton);
         LLUnit.updateSubElements(document.body, [this.overlay, this.dialog]);
      }
      close() {
         dialogDepth = this.depth;
         this.dialog.remove();
         this.overlay.remove();
         if (this.closeCallback) {
            this.closeCallback();
         }
      }
      /** @param {LLH.Component.LLDialogComponent_Options} options */
      static openDialog(options) {
         return new LLDialogComponent(options);
      }
   }
   return LLDialogComponent;
})();

var LLYesNoDialogComponent = (function() {
   class LLYesNoDialogComponent extends LLDialogComponent {
      /** @param {LLH.Component.LLYesNoDialogComponent_Options} options */
      constructor(options) {
         var answer = false;
         var answerCallback = options.answerCallback;
         var yesButton = new LLButtonComponent({'text': '确认', 'colorStyle': 'primary'});
         var noButton = new LLButtonComponent({'text': '取消', 'style': {'marginLeft': '12px'}});
         var content = LLUnit.createElement('div');
         if (options.title) {
            LLUnit.updateSubElements(content, LLUnit.createElement('div', {'className': 'dialog-title-section'}, options.title));
         }
         LLUnit.updateSubElements(content, options.question);
         LLUnit.updateSubElements(content, LLUnit.createElement('div', {'className': 'dialog-bottom-section'}, [yesButton.element, noButton.element]));
         super({
            'content': content,
            'height': 'auto',
            'width': 'auto',
            'closeCallback': () => answerCallback && answerCallback(answer)
         });
         var me = this;
         yesButton.on('click', function () {
            answer = true;
            me.close();
         });
         noButton.on('click', () => me.close());
      }
      /** @param {LLH.Component.LLYesNoDialogComponent_Options} options */
      static openYesNoDialog(options) {
         return new LLYesNoDialogComponent(options);
      }
   }
   return LLYesNoDialogComponent;
})();

var LLComponentCollection = (function() {
   /**
    * @template [DataT=LLH.Mixin.SaveLoadableGroupDataType]
    * @extends {LLH.Mixin.SaveLoadableGroup<DataT>}
    */
   class LLComponentCollection_cls extends SaveLoadableGroup {
      constructor() {
         super();
      }
      /**
       * @template {HTMLElement} E
       * @template D
       * @param {string} name 
       * @param {LLH.Component.LLComponentBase<E, D>} component 
       */
      add(name, component) {
         this.addSaveLoadable(name, component);
      }
      /**
       * @template {LLH.Component.LLComponentBase} T
       * @param {string} name
       * @returns {T | undefined}
       */
      getComponent(name) {
         return /** @type {T} */ this.getSaveLoadable(name);
      }
      /**
       * @template {LLH.Component.LLValuedComponent} T
       * @param {string} name
       * @returns {T | undefined}
       */
      getValuedComponent(name) {
         return /** @type {T} */ this.getSaveLoadable(name);
      }
      saveLocalStorage(key) {
         LLHelperLocalStorage.setData(key, this.saveJson());
      }
      loadLocalStorage(key) {
         var data = LLHelperLocalStorage.getData(key);
         this.loadJson(data);
      }
      deleteLocalStorage(key) {
         LLHelperLocalStorage.clearData(key);
      }
   }

   return LLComponentCollection_cls;
})();

var LLFiltersComponent = (function() {
   class LLFiltersComponent_cls extends LLComponentCollection {
      constructor() {
         super();
         /** @type {{[name: string]: LLH.Component.LLFiltersComponent_FilterDef}} */
         this.filters = {};
         this.freeze = false;
         /** @type {((name: string, newValue: any) => void) | undefined} */
         this.onValueChange = undefined;
      }
      /** @param {boolean} isFreezed */
      setFreezed(isFreezed) {
         this.freeze = isFreezed;
      }
      isFreezed() {
         return this.freeze;
      };
      /**
       * @template {HTMLElement} E
       * @template D
       * @param {string} name 
       * @param {LLH.Component.LLValuedComponent<E, D>} component 
       * @param {(opt: LLH.Component.LLSelectComponent_OptionDef) => any} [dataGetter] 
       */
      addFilterable(name, component, dataGetter) {
         var me = this;
         me.add(name, component);
         var curFilter = me.getFilter(name, true);
         if (dataGetter) curFilter.dataGetter = dataGetter;
         component.onValueChange = function (v) {
            if (!me.isFreezed()) me.handleFilters(name);
            if (me.onValueChange) me.onValueChange(name, v);
         };
      }
      /**
       * @param {string} name 
       * @param {boolean} [createIfAbsent] 
       * @returns {LLH.Component.LLFiltersComponent_FilterDef}
       */
      getFilter(name, createIfAbsent) {
         if (createIfAbsent && this.filters[name] === undefined) {
            this.filters[name] = {};
         }
         return this.filters[name];
      }
      /**
       * @template [FilterValueT = string]
       * @template [TargetDataT = any]
       * @param {string} sourceName 
       * @param {string} targetName 
       * @param {LLH.Component.LLFiltersComponent_FilterCallback<FilterValueT, TargetDataT>} callback 
       */
      addFilterCallback(sourceName, targetName, callback) {
         var sourceFilter = this.getFilter(sourceName, true);
         var targetFilter = this.getFilter(targetName, true);
         if (!sourceFilter.callbacks) {
            sourceFilter.callbacks = {};
         }
         if (!targetFilter.reverseCallbacks) {
            targetFilter.reverseCallbacks = {};
         }
         sourceFilter.callbacks[targetName] = /** @type {LLH.Component.LLFiltersComponent_FilterCallback} */ (callback);
         targetFilter.reverseCallbacks[sourceName] = /** @type {LLH.Component.LLFiltersComponent_FilterCallback} */ (callback);
      }
      /**
       * @param {string} name 
       * @param {() => string} groupGetter 
       * @param {string[]} affectedBy 
       */
      setFilterOptionGroupCallback(name, groupGetter, affectedBy) {
         var curFilter = this.getFilter(name, true);
         curFilter.groupGetter = groupGetter;
         if (affectedBy) {
            for (var i = 0; i < affectedBy.length; i++) {
               var affectedFilter = this.getFilter(affectedBy[i], true);
               if (!affectedFilter.affectOptionGroupFilters) {
                  affectedFilter.affectOptionGroupFilters = [name];
               } else {
                  affectedFilter.affectOptionGroupFilters.push(name);
               }
            }
         }
      }
      /**
       * @param {string} name 
       * @param {LLH.Component.LLFiltersComponent_OptionGroupType} groups 
       */
      setFilterOptionGroups(name, groups) {
         var curFilter = this.getFilter(name, true);
         curFilter.optionGroups = groups;
         curFilter.currentOptionGroup = undefined;
      }
      /**
       * @param {string} name 
       * @param {LLH.Component.LLSelectComponent_OptionDef[]} options 
       */
      setFilterOptions(name, options) {
         var curFilter = this.getFilter(name, true);
         curFilter.optionGroups = undefined;
         var curComp = /** @type {LLH.Component.LLSelectComponent | undefined} */ (this.getComponent(name));
         if (curComp) {
            curComp.setOptions(options);
         } else {
            console.error('Not found component for name: ' + name);
         }
      }
      /**
       * Handle changes when specified component's value change.
       * When not provided name, handle all component's filters.
       * @param {string} [name] 
       */
      handleFilters(name) {
         var i;
         if (name) {
            var filter = this.getFilter(name);
            if (filter.callbacks) {
               for (i in filter.callbacks) {
                  handleFilter(this, i, true, false);
               }
            }
            if (filter.affectOptionGroupFilters) {
               var affectFilters = filter.affectOptionGroupFilters;
               for (i = 0; i < affectFilters.length; i++) {
                  handleFilter(this, affectFilters[i], false, true);
               }
            }
         } else {
            for (i in this.filters) {
               handleFilter(this, i, true, true);
            }
         }
      }
      /** @param {LLH.Mixin.SaveLoadableGroupDataType} [data] */
      loadData(data) {
         if (data === undefined) return;
         this.setFreezed(true);
         super.loadData(data);
         this.setFreezed(false);
         this.handleFilters();
      }
   }
   /**
    * @param {LLH.Component.LLFiltersComponent} me
    * @param {string} targetName
    * @param {boolean} checkCallbacks
    * @param {boolean} checkOptionGroups
    */
   function handleFilter(me, targetName, checkCallbacks, checkOptionGroups) {
      var filter = me.getFilter(targetName);
      if (!filter) {
         console.warn('Not found filter for ' + targetName, me);
         return;
      }
      /** @type {LLH.Component.LLSelectComponent_FilterCallback | undefined} */
      var newFilter = undefined;
      /** @type {LLH.Component.LLSelectComponent_OptionDef[] | undefined} */
      var newOptions = undefined;
      var i;
      if (checkCallbacks && filter.reverseCallbacks) {
         /** @type {LLH.Component.LLFiltersComponent_FilterCallback[]} */
         var filterCallbacks = [];
         /** @type {(string | undefined)[]} */
         var values = [];
         /** @type {LLH.Component.LLValuedComponent | undefined} */
         var comp = undefined;
         for (i in filter.reverseCallbacks) {
            comp = /** @type {LLH.Component.LLValuedComponent | undefined} */ (me.getComponent(i));
            if (!comp) {
               console.error('Not found component for ' + i, me);
               continue;
            }
            filterCallbacks.push(filter.reverseCallbacks[i]);
            values.push(comp.get());
         }
         if (filterCallbacks.length > 0) {
            newFilter = function (option) {
               if (!option) return true;
               var data = undefined;
               if (filter.dataGetter) data = filter.dataGetter(option);
               for (var j = 0; j < filterCallbacks.length; j++) {
                  if (!filterCallbacks[j](option, values[j], data)) return false;
               }
               return true;
            };
         }
      }
      if (checkOptionGroups && filter.groupGetter && filter.optionGroups) {
         var groupId = filter.groupGetter();
         if (groupId !== filter.currentOptionGroup) {
            newOptions = filter.optionGroups[groupId] || [];
            filter.currentOptionGroup = groupId;
         }
      }
      if (newFilter || newOptions) {
         var selComp = /** @type {LLH.Component.LLSelectComponent | undefined} */ (me.getComponent(targetName));
         if (!selComp) {
            console.error('Not found select component for ' + targetName, me);
            return;
         }
         if (newOptions) {
            selComp.setOptions(newOptions, newFilter);
            selComp.setVisible(newOptions.length > 0);
         } else {
            selComp.filterOptions(newFilter);
         }
      }
   }
   
   return LLFiltersComponent_cls;
})();

const LLConstValue = {
   '高坂穂乃果': 1,
   '絢瀬絵里': 2,
   '南ことり': 3,
   '園田海未': 4,
   '星空凛': 5,
   '西木野真姫': 6,
   '東條希': 7,
   '小泉花陽': 8,
   '矢澤にこ': 9,
   'MEMBER_HONOKA': 1,
   'MEMBER_ELI': 2,
   'MEMBER_KOTORI': 3,
   'MEMBER_UMI': 4,
   'MEMBER_RIN': 5,
   'MEMBER_MAKI': 6,
   'MEMBER_NOZOMI': 7,
   'MEMBER_HANAYO': 8,
   'MEMBER_NICO': 9,

   '綺羅ツバサ': 80,
   '優木あんじゅ': 81,
   '統堂英玲奈': 82,
   'MEMBER_TSUBASA': 80,
   'MEMBER_ANJU': 81,
   'MEMBER_ERENA': 82,

   '高海千歌': 101,
   '桜内梨子': 102,
   '松浦果南': 103,
   '黒澤ダイヤ': 104,
   '渡辺曜': 105,
   '津島善子': 106,
   '国木田花丸': 107,
   '小原鞠莉': 108,
   '黒澤ルビィ': 109,
   'MEMBER_CHIKA': 101,
   'MEMBER_RIKO': 102,
   'MEMBER_KANAN': 103,
   'MEMBER_DIA': 104,
   'MEMBER_YOU': 105,
   'MEMBER_YOSHIKO': 106,
   'MEMBER_HANAMARU': 107,
   'MEMBER_MARI': 108,
   'MEMBER_RUBY': 109,

   '鹿角理亞': 112,
   '鹿角聖良': 113,
   'MEMBER_LEAH': 112,
   'MEMBER_SARAH': 113,

   '上原歩夢': 201,
   '中須かすみ': 202,
   '桜坂しずく': 203,
   '朝香果林':  204,
   '宮下愛': 205,
   '近江彼方': 206,
   '優木せつ菜': 207,
   'エマ・ヴェルデ': 208,
   '天王寺璃奈': 209,
   '三船栞子': 212,
   '鐘嵐珠': 213,
   'ショウ・ランジュ': 213,
   'ミア・テイラー': 214,
   'MEMBER_AYUMU': 201,
   'MEMBER_KASUMI': 202,
   'MEMBER_SHIZUKU': 203,
   'MEMBER_KARIN': 204,
   'MEMBER_AI': 205,
   'MEMBER_KANATA': 206,
   'MEMBER_SETSUNA': 207,
   'MEMBER_EMMA': 208,
   'MEMBER_RINA': 209,
   'MEMBER_SHIORIKO': 212,
   'MEMBER_LANZHU': 213,
   'MEMBER_MIA': 214,

   '澁谷かのん': 301,
   '唐可可': 302,
   '嵐千砂都': 303,
   '平安名すみれ': 304,
   '葉月恋': 305,
   '桜小路きな子': 306,
   '米女メイ': 307,
   '若菜四季': 308,
   '鬼塚夏美': 309,
   'MEMBER_KANON': 301,
   'MEMBER_KEKE': 302,
   'MEMBER_CHISATO': 303,
   'MEMBER_SUMIRE': 304,
   'MEMBER_REN': 305,
   'MEMBER_KINAKO': 306,
   'MEMBER_MEI': 307,
   'MEMBER_SHIKI': 308,
   'MEMBER_NATUMI': 309,

   '聖澤悠奈': 311,
   '柊摩央': 312,
   'MEMBER_YUUNA': 311,
   'MEMBER_MAO': 312,

   'GROUP_UNKNOWN': 0,
   'GROUP_GRADE1': 1,
   'GROUP_GRADE2': 2,
   'GROUP_GRADE3': 3,
   /** @type {LLH.Core.BigGroupIdType} */
   'GROUP_MUSE': 4,
   /** @type {LLH.Core.BigGroupIdType} */
   'GROUP_AQOURS': 5,
   'GROUP_PRINTEMPS': 6,
   'GROUP_LILYWHITE': 7,
   'GROUP_BIBI': 8,
   'GROUP_CYARON': 9,
   'GROUP_AZALEA': 10,
   'GROUP_GUILTYKISS': 11,
   'GROUP_ARISE': 12,
   'GROUP_SAINTSNOW': 13,
   'GROUP_HONOKA_RIN': 23,
   'GROUP_NOZOMI_NICO': 24,
   'GROUP_KOTORI_HANAYO': 25,
   'GROUP_KOTORI_UMI': 26,
   'GROUP_RIN_MAKI': 27,
   'GROUP_MAKI_NICO': 28,
   'GROUP_ELI_UMI': 29,
   'GROUP_ELI_NOZOMI': 30,
   'GROUP_MUSE_COOL': 31,
   'GROUP_MUSE_GRADE2': 32,
   'GROUP_NICORINHANA': 33,
   'GROUP_AQOURS_GRADE2': 34,
   'GROUP_MUSE_GRADE1': 35,
   'GROUP_MUSE_GRADE3': 36,
   'GROUP_SOMEDAY': 37,
   'GROUP_AQOURS_GRADE1': 38,
   'GROUP_LOVE_WING_BELL':  39,
   'GROUP_AQOURS_GRADE3': 40,
   'GROUP_TRANSFER_STUDENT': 50,
   'GROUP_RIVAL': 51,
   'GROUP_SUPPORT': 52,
   'GROUP_RIKO_HANAMARU_MARI': 53,
   'GROUP_KUROSAWA_SISTERS': 54,
   'GROUP_YOU_YOSHIKO': 55,
   'GROUP_CHIKA_KANAN': 56,
   'GROUP_SAINT_AQOURS_SNOW': 57,
   /** @type {LLH.Core.BigGroupIdType} */
   'GROUP_NIJIGASAKI': 60,
   'GROUP_ELI_NOZOMI2': 83,
   'GROUP_RIN_HANAYO': 99,
   'GROUP_YOSHIKO_HANAMARU': 137,
   /** @type {LLH.Core.BigGroupIdType} */
   'GROUP_LIELLA': 143,
   'GROUP_DIVER_DIVA': 1000,
   'GROUP_A_ZU_NA': 1001,
   'GROUP_QU4RTZ': 1002,

   'NOTE_TYPE_NORMAL': 1,
   'NOTE_TYPE_EVENT': 2,
   'NOTE_TYPE_HOLD': 3,
   'NOTE_TYPE_BOMB_1': 4,
   'NOTE_TYPE_BOMB_3': 5,
   'NOTE_TYPE_BOMB_5': 6,
   'NOTE_TYPE_BOMB_9': 7,
   'NOTE_TYPE_SWING': 11,
   'NOTE_TYPE_SWING_EVENT': 12,
   'NOTE_TYPE_SWING_HOLD': 13,

   'NOTE_WEIGHT_HOLD_FACTOR': 1.25,
   'NOTE_WEIGHT_SWING_FACTOR': 0.5,
   'NOTE_WEIGHT_PERFECT_FACTOR': 1.25,
   'NOTE_WEIGHT_GREAT_FACTOR': 1.1,
   'NOTE_WEIGHT_GOOD_FACTOR': 1,
   'NOTE_WEIGHT_BAD_FACTOR': 0.5,
   'NOTE_WEIGHT_MISS_FACTOR': 0,
   'NOTE_WEIGHT_ACC_PERFECT_FACTOR': 1.35,

   'SKILL_TRIGGER_TIME': 1,
   'SKILL_TRIGGER_NOTE': 3,
   'SKILL_TRIGGER_COMBO': 4,
   'SKILL_TRIGGER_SCORE': 5,
   'SKILL_TRIGGER_PERFECT': 6,
   'SKILL_TRIGGER_STAR_PERFECT': 12,
   'SKILL_TRIGGER_MEMBERS': 100,
   'SKILL_TRIGGER_SKILL_ACTIVATE_COUNT': 201,

   'SKILL_EFFECT_NONE': -1,
   'SKILL_EFFECT_ACCURACY_SMALL': 4,
   'SKILL_EFFECT_ACCURACY_NORMAL': 5,
   'SKILL_EFFECT_HEAL': 9,
   'SKILL_EFFECT_SCORE': 11,
   'SKILL_EFFECT_POSSIBILITY_UP': 2000,
   'SKILL_EFFECT_REPEAT': 2100,
   'SKILL_EFFECT_PERFECT_SCORE_UP': 2201,
   'SKILL_EFFECT_COMBO_FEVER': 2300,
   'SKILL_EFFECT_SYNC': 2400,
   'SKILL_EFFECT_LEVEL_UP': 2500,
   'SKILL_EFFECT_ATTRIBUTE_UP': 2600,
   'SKILL_EFFECT_CHARGED_SPARK': 2800,

   'SKILL_LIMIT_PERFECT_SCORE_UP': 100000,
   'SKILL_LIMIT_COMBO_FEVER': 1000,
   'SKILL_LIMIT_COMBO_FEVER_2': 2147483647,
   'SKILL_LIMIT_HEAL_BONUS': 200,

   /** @type {LLH.Core.SongGroupIdType} */
   'SONG_GROUP_MUSE': 1,
   /** @type {LLH.Core.SongGroupIdType} */
   'SONG_GROUP_AQOURS': 2,
   /** @type {LLH.Core.SongGroupIdType} */
   'SONG_GROUP_NIJIGASAKI': 3,
   /** @type {LLH.Core.SongGroupIdType} */
   'SONG_GROUP_LIELLA': 4,

   'SONG_DIFFICULTY_EASY': 1,
   'SONG_DIFFICULTY_NORMAL': 2,
   'SONG_DIFFICULTY_HARD': 3,
   'SONG_DIFFICULTY_EXPERT': 4,
   'SONG_DIFFICULTY_RANDOM': 5,
   'SONG_DIFFICULTY_MASTER': 6,

   'SONG_DEFAULT_SET_1': 1,
   'SONG_DEFAULT_SET_2': 2,

   'BACKGROUND_COLOR_DEFAULT': '#dcdbe3',

   'SIS_TYPE_NORMAL': 1,
   'SIS_TYPE_LIVE_ARENA': 2,

   /** @type {LLH.Internal.NormalGemCategoryEffectRangeType} */
   'SIS_RANGE_SELF': 1,
   /** @type {LLH.Internal.NormalGemCategoryEffectRangeType} */
   'SIS_RANGE_TEAM': 2,

   'SIS_EFFECT_TYPE_SMILE': 1,
   'SIS_EFFECT_TYPE_PURE': 2,
   'SIS_EFFECT_TYPE_COOL': 3,
   'SIS_EFFECT_TYPE_SCORE_BOOST': 11,
   'SIS_EFFECT_TYPE_HEAL_SCORE': 12,
   'SIS_EFFECT_TYPE_ACCURACY_SMILE': 13,
   'SIS_EFFECT_TYPE_ACCURACY_PURE': 14,
   'SIS_EFFECT_TYPE_ACCURACY_COOL': 15,
   'SIS_EFFECT_TYPE_LA_SCORE': 24,
   'SIS_EFFECT_TYPE_LA_DEBUFF': 25,

   'SIS_TRIGGER_REF_HP_PERCENT': 9,
   'SIS_TRIGGER_REF_FULL_COMBO': 11,
   'SIS_TRIGGER_REF_OVERHEAL': 12,
   'SIS_TRIGGER_REF_ALL_SMILE': 13,
   'SIS_TRIGGER_REF_ALL_COOL': 14,
   'SIS_TRIGGER_REF_ALL_PURE': 15,
   'SIS_TRIGGER_REF_PERFECT_COUNT': 20,

   'SIS_LIVE_EFFECT_TYPE_DAMAGE': 1,
   'SIS_LIVE_EFFECT_TYPE_POSSIBILITY_DOWN': 2,

   /** @type {LLH.Core.LanguageType} */
   'LANGUAGE_CN': 0,
   /** @type {LLH.Core.LanguageType} */
   'LANGUAGE_JP': 1
};

/** @type {LLH.LLConst} */
var LLConst = (function () {
   const KEYS = LLConstValue;

   /** @type {{[id: number]: LLH.Core.AttributeAllType}} */
   var COLOR_ID_TO_NAME = {1: 'smile', 2: 'pure', 3: 'cool', 5: 'all'};
   var COLOR_NAME_TO_COLOR = {'smile': 'red', 'pure': 'green', 'cool': 'blue', '': 'purple', 'all': 'purple'};

   /** @type {{[id: number]: LLH.Internal.MemberMetaDataType}} */
   var MEMBER_DATA = {};

   /** @type {LLH.Internal.NormalGemMetaType[]} */
   var GEM_NORMAL_TYPE_DATA = [
      {'name': 'kiss', 'cnname': '吻', 'key': 'SADD_200', 'slot': 1, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 200, 'per_color': 1, 'attr_add': 1},
      {'name': 'perfume', 'cnname': '香水', 'key': 'SADD_450', 'slot': 2, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 450, 'per_color': 1, 'attr_add': 1},
      {'name': 'ring', 'cnname': '指环', 'key': 'SMUL_10', 'slot': 2, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 10, 'per_color': 1, 'per_grade': 1, 'attr_mul': 1},
      {'name': 'cross', 'cnname': '十字', 'key': 'SMUL_16', 'slot': 3, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 16, 'per_color': 1, 'per_grade': 1, 'attr_mul': 1},
      {'name': 'aura', 'cnname': '光环', 'key': 'AMUL_18', 'slot': 3, 'effect_range': KEYS.SIS_RANGE_TEAM, 'effect_value': 1.8, 'per_color': 1, 'attr_mul': 1},
      {'name': 'veil', 'cnname': '面纱', 'key': 'AMUL_24', 'slot': 4, 'effect_range': KEYS.SIS_RANGE_TEAM, 'effect_value': 2.4, 'per_color': 1, 'attr_mul': 1},
      {'name': 'charm', 'cnname': '魅力', 'key': 'SCORE_250', 'slot': 4, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 150, 'per_color': 1, 'skill_mul': 1},
      {'name': 'heal', 'cnname': '治愈', 'key': 'HEAL_480', 'slot': 4, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 480, 'per_color': 1, 'heal_mul': 1},
      {'name': 'trick', 'cnname': '诡计', 'key': 'EMUL_33', 'slot': 4, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 33, 'per_color': 1, 'ease_attr_mul': 1},
      {'name': 'wink', 'cnname': '眼神', 'key': 'SADD_1400', 'slot': 5, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 1400, 'per_color': 1, 'attr_add': 1},
      {'name': 'trill', 'cnname': '颤音', 'key': 'SMUL_28', 'slot': 5, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 28, 'per_color': 1, 'per_grade': 1, 'attr_mul': 1},
      {'name': 'bloom', 'cnname': '绽放', 'key': 'AMUL_40', 'slot': 6, 'effect_range': KEYS.SIS_RANGE_TEAM, 'effect_value': 4, 'per_color': 1, 'attr_mul': 1},
      {'name': 'member', 'cnname': '个宝', 'key': 'MEMBER_29', 'slot': 4, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 29, 'per_member': 1, 'per_color': 1, 'attr_mul': 1},
      {'name': 'nonet', 'cnname': '九重奏', 'key': 'NONET_42', 'slot': 4, 'effect_range': KEYS.SIS_RANGE_TEAM, 'effect_value': 4.2, 'per_color': 1, 'per_unit': 1, 'attr_mul': 1},
      {'name': 'member_petit', 'cnname': '小个宝', 'key': 'MEMBER_13', 'slot': 2, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 13, 'per_member': 1, 'per_color': 1, 'attr_mul': 1},
      {'name': 'member_midi', 'cnname': '中个宝', 'key': 'MEMBER_21', 'slot': 3, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 21, 'per_member': 1, 'per_color': 1, 'attr_mul': 1},
      {'name': 'member_grand', 'cnname': '大个宝', 'key': 'MEMBER_53', 'slot': 5, 'effect_range': KEYS.SIS_RANGE_SELF, 'effect_value': 53, 'per_member': 1, 'per_color': 1, 'attr_mul': 1},
      {'name': 'nonet_petit', 'cnname': '小九重奏', 'key': 'NONET_15', 'slot': 2, 'effect_range': KEYS.SIS_RANGE_TEAM, 'effect_value': 1.5, 'per_color': 1, 'per_unit': 1, 'attr_mul': 1},
   ];

   var MEMBER_GEM_LIST = [
      KEYS.MEMBER_HONOKA, KEYS.MEMBER_ELI, KEYS.MEMBER_KOTORI,
      KEYS.MEMBER_UMI, KEYS.MEMBER_RIN, KEYS.MEMBER_MAKI,
      KEYS.MEMBER_NOZOMI, KEYS.MEMBER_HANAYO, KEYS.MEMBER_NICO,

      KEYS.MEMBER_CHIKA, KEYS.MEMBER_RIKO, KEYS.MEMBER_KANAN,
      KEYS.MEMBER_DIA, KEYS.MEMBER_YOU, KEYS.MEMBER_YOSHIKO,
      KEYS.MEMBER_HANAMARU, KEYS.MEMBER_MARI, KEYS.MEMBER_RUBY,

      KEYS.MEMBER_AYUMU, KEYS.MEMBER_KASUMI, KEYS.MEMBER_SHIZUKU,
      KEYS.MEMBER_KARIN, KEYS.MEMBER_AI, KEYS.MEMBER_KANATA,
      KEYS.MEMBER_SETSUNA, KEYS.MEMBER_EMMA, KEYS.MEMBER_RINA,
      KEYS.MEMBER_SHIORIKO,

      KEYS.MEMBER_KANON, KEYS.MEMBER_KEKE, KEYS.MEMBER_CHISATO,
      KEYS.MEMBER_SUMIRE, KEYS.MEMBER_REN
   ];

   var UNIT_GEM_LIST = [KEYS.GROUP_MUSE, KEYS.GROUP_AQOURS, KEYS.GROUP_NIJIGASAKI, KEYS.GROUP_LIELLA];

   /** @type {LLH.API.MemberTagDictDataType} */
   var GROUP_DATA = {};
   var NOT_FOUND_MEMBER = {};

   /** @type {LLH.Internal.ProcessedAlbumDictDataType} */
   var ALBUM_DATA = {};

   /** @type {LLH.Internal.ProcessedAlbumGroupType[]} */
   var ALBUM_GROUP = [];

   /** @type {LLH.API.LevelLimitPatternDictDataType} */
   var LEVEL_LIMIT_DATA = {};

   const INIT_KEY_ALBUM = 'album';
   const INIT_KEY_MEMBER_TAG = 'member_tag';
   const INIT_KEY_UNIT_TYPE = 'unit_type';
   const INIT_KEY_CSKILL_GROUPS = 'cskill_groups';
   const INIT_KEY_LEVEL_LIMIT = 'level_limit';

   var metaDataInited = {};
   /**
    * @param {string} key
    * @param {boolean} [noThrow]
    */
   var mCheckInited = function (key, noThrow) {
      if (!metaDataInited[key]) {
         var err = key + ' not inited';
         if (noThrow) {
            console.error(err);
         } else {
            throw err;
         }
      }
   };

   /**
    * @param {LLH.Core.MemberIdType} member
    * @returns {number | undefined}
    */
   var mGetMemberId = function (member) {
      if (typeof(member) != 'number') {
         var memberid = KEYS[member];
         if (memberid === undefined) {
            //e.g. N card
            if (!NOT_FOUND_MEMBER[member]) {
               console.debug('Not found member ' + member);
               NOT_FOUND_MEMBER[member] = 1;
            }
            return undefined;
         }
         return memberid;
      } else {
         return member;
      }
   };
   /**
    * @param {LLH.Core.MemberIdType} member 
    * @returns {LLH.Internal.MemberMetaDataType | undefined}
    */
   var mGetMemberData = function (member) {
      mCheckInited(INIT_KEY_UNIT_TYPE);
      var memberid = mGetMemberId(member);
      if (memberid !== undefined) {
         return MEMBER_DATA[memberid];
      }
      return undefined;
   };
   var mGetGroupId = function (group) {
      var groupid = group;
      if (typeof(groupid) != 'number') {
         groupid = parseInt(groupid);
         if (groupid == 0) {
            console.error('Unknown group ' + group);
            return undefined;
         }
      }
      return groupid;
   };
   var mGetGroupData = function (group) {
      mCheckInited(INIT_KEY_MEMBER_TAG);
      var groupid = mGetGroupId(group);
      if (groupid !== undefined) {
         return GROUP_DATA[groupid];
      }
      console.error('Not found group data for ' + group);
      return undefined;
   };

   /** @param {LLH.API.UnitTypeDictDataType} members */
   var mInitMemberData = function (members) {
      for (var k in members) {
         var id = parseInt(k);
         var curMember = members[k];
         if (!MEMBER_DATA[id]) {
            MEMBER_DATA[id] = {};
         }
         var curMemberData = MEMBER_DATA[id];
         if (curMember.color !== undefined) {
            curMemberData.color = COLOR_ID_TO_NAME[curMember.color];
         }
         if (curMember.name !== undefined) {
            curMemberData.name = curMember.name;
         }
         if (curMember.cnname !== undefined) {
            curMemberData.cnname = curMember.cnname;
         }
         if (curMember.background_color !== undefined) {
            curMemberData.background_color = '#' + curMember.background_color;
         }
      }
      for (var grade = 1; grade <= 3; grade++) {
         var curGroupData = mGetGroupData(grade);
         var gradeMembers = curGroupData && curGroupData.members;
         if (!gradeMembers) {
            console.error('Not found members for grade ' + grade);
            continue;
         }
         for (var i = 0; i < gradeMembers.length; i++) {
            var curMemberId = gradeMembers[i];
            if (!MEMBER_DATA[curMemberId]) {
               console.warn('Not found member ' + curMemberId + ' for grade ' + grade);
               continue;
            }
            MEMBER_DATA[curMemberId].grade = /** @type {LLH.Core.GradeType} */ (grade);
         }
      }
      for (var i = 0; i < MEMBER_GEM_LIST.length; i++) {
         var id = MEMBER_GEM_LIST[i];
         if (!MEMBER_DATA[id]) {
            console.warn('Not found member ' + id + ' for member gem');
            continue;
         }
         MEMBER_DATA[id].member_gem = true;
      }
   };

   var normalizeAlbumName = function (name) {
      name = name.replace(/(前半|後半|后半)$/, '');
      name = name.replace(/Part\d+$/, '');
      name = name.replace(/[ 　]+$/, '');
      return name;
   };

   /** @param {LLH.API.AlbumDictDataType} albumMeta */
   var mInitAlbumData = function (albumMeta) {
      var albumGroupNames = {};
      var i, k;
      for (k in albumMeta) {
         let album = albumMeta[k];
         var jpname = normalizeAlbumName(album.name);
         if (!albumGroupNames[jpname]) {
            albumGroupNames[jpname] = {'albums': [k], 'name': jpname};
         } else {
            albumGroupNames[jpname].albums.push(k);
         }
         if (album.cnname) {
            albumGroupNames[jpname].cnname = normalizeAlbumName(album.cnname);
         }
      }
      var groupData = [];
      ALBUM_DATA = {};
      for (k in albumGroupNames) {
         var groupId = groupData.length;
         groupData.push(albumGroupNames[k]);
         albumGroupNames[k].id = groupId;
         var albums = albumGroupNames[k].albums;
         for (i = 0; i < albums.length; i++) {
            let album = albumMeta[albums[i]];
            ALBUM_DATA[albums[i]] = {
               'albumGroupId': groupId,
               'cnname': album.cnname,
               'name': album.name
            };
         }
      }
      ALBUM_GROUP = groupData;
   };

   var NOTE_APPEAR_OFFSET_S = [1.8, 1.6, 1.45, 1.3, 1.15, 1, 0.9, 0.8, 0.7, 0.6];
   /** @type {{[id: LLH.Core.SongDifficultyType]: LLH.Core.NoteSpeedType}} */
   var DEFAULT_SPEED = {};
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_EASY] = 2;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_NORMAL] = 4;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_HARD] = 6;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_EXPERT] = 8;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_RANDOM] = 8;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_MASTER] = 9;

   /** @type {LLH.LLConst} */
   var constUtil = {};

   var HEAL_BONUS = [0.26,  // 9
      0.29, 0.31, 0.34, 0.37, 0.4,  // 10~14
      0.43, 0.46, 0.49, 0.51, 0.59, // 15~19
      0.63, 0.66, 0.7,  0.73, 0.77, // 20~24
      0.8,  0.84, 0.88, 0.91, 0.95, // 25~29
      0.99, 1.02, 1.06, 1.1,  1.14, // 30~34
      1.18, 1.21, 1.76, 1.83, 1.9,  // 35~39
      1.97, 2.04, 2.11, 2.18, 2.25, // 40~44
      2.33, 2.64, 2.73, 2.82, 2.91, // 45~49
      3,    3.09, 3.19, 3.28, 3.38, // 50~54
      3.47, 3.57, 3.67, 3.77, 3.87, // 55~59
      3.98, 4.08, 4.19, 4.29]; // 60~63
   var DEFAULT_MAX_SLOT = {'UR': 8, 'SSR': 6, 'SR': 4, 'R': 2, 'N': 1};
   var DEFAULT_MIN_SLOT = {'UR': 4, 'SSR': 3, 'SR': 2, 'R': 1, 'N': 0};
   var DEFAULT_KIZUNA_MEZAME = {'UR': 1000, 'SSR': 750, 'SR': 500, 'R': 200, 'N': 50};
   var DEFAULT_KIZUNA_NORMAL = {'UR': 500, 'SSR': 375, 'SR': 250, 'R': 100, 'N': 25};

   /** @type {LLH.Core.MemberTagIdType[]} */
   var CSKILL_GROUPS = [];

   /** @type {LLH.ConstUtil.Common} */
   var CommonUtils = {
      getRarityString: (function () {
         /** @type {{[id: number]: LLH.Core.RarityStringType}} */
         var rarityMap = {1: 'N', 2: 'R', 3: 'SR', 4: 'UR', 5: 'SSR'};
         return function (rarity) {
            return rarityMap[rarity];
         };
      })(),
      getAttributeColor: function (attribute) {
         return COLOR_NAME_TO_COLOR[attribute] || 'black';
      },
      getOverHealLevelBonus: function (maxHP, overHealLevel) {
         if (maxHP < 9 || maxHP > 63) {
            console.error('max HP out of range: ' + maxHP);
            return 1;
         }
         if (!overHealLevel) return 1;
         var bonus = overHealLevel * HEAL_BONUS[maxHP-9];
         if (bonus > KEYS.SKILL_LIMIT_HEAL_BONUS) bonus = KEYS.SKILL_LIMIT_HEAL_BONUS;
         return 1 + bonus/100;
      },
      getDefaultMaxSlot: function(rarity) {
         return (DEFAULT_MAX_SLOT[rarity] || 0);
      },
      getDefaultMinSlot: function(rarity) {
         return (DEFAULT_MIN_SLOT[rarity] || 0);
      },
      getCSkillGroups: function () {
         mCheckInited(INIT_KEY_CSKILL_GROUPS);
         return CSKILL_GROUPS;
      },
      getZeroCSkill: function () {
         return {
            'attribute': 'smile',
            'Cskillattribute': 'smile',
            'Cskillpercentage': 0,
            'Csecondskilllimit': LLConstValue.GROUP_UNKNOWN,
            'Csecondskillattribute': 0
         };
      },
      copyCSkill: function (fromCSkill, toCSkill) {
         if (!toCSkill) {
            return {
               'attribute': fromCSkill.attribute,
               'Cskillattribute': fromCSkill.Cskillattribute,
               'Cskillpercentage': fromCSkill.Cskillpercentage,
               'Csecondskilllimit': fromCSkill.Csecondskilllimit,
               'Csecondskillattribute': fromCSkill.Csecondskillattribute
            };
         } else {
            toCSkill.attribute = fromCSkill.attribute;
            toCSkill.Cskillattribute = fromCSkill.Cskillattribute;
            toCSkill.Cskillpercentage = fromCSkill.Cskillpercentage;
            toCSkill.Csecondskilllimit = fromCSkill.Csecondskilllimit;
            toCSkill.Csecondskillattribute = fromCSkill.Csecondskillattribute;
            return toCSkill;
         }
      },
      getCardCSkill: function (card) {
         var attribute = card.attribute;
         if (attribute == 'all') {
            return CommonUtils.getZeroCSkill();
         } else {
            return {
               'attribute': attribute,
               'Cskillattribute': card.Cskillattribute,
               'Cskillpercentage': card.Cskillpercentage,
               'Csecondskilllimit': card.Csecondskilllimit,
               'Csecondskillattribute': card.Csecondskillattribute
            };
         }
      },
      getOrMakeDummyCardData: function (card, cardId) {
         if (card) return card;
         var cardData = {
            'id': parseInt((cardId || -1) + '')
         };
         // TODO: make a better dummy data
         return /** @type {LLH.API.CardDataType} */ (cardData);
      },
      getCardDescription: function (card, language, mezame) {
         var desc = String(card.id);
         var albumGroup = constUtil.Album.getAlbumGroupByAlbumId(card.album);
         if (!albumGroup) {
            albumGroup = {
               'albums': [],
               'id': -1,
               'name': '未知相册'
            };
         }
         var curTypeId = (card.typeid ? card.typeid : -1);
         while (desc.length < 3) desc = '0' + desc;
         desc += ' ' + (card.rarity || '?') + ' ';
         if (mezame !== undefined) {
            desc += (mezame ? '觉醒' : '未觉') + ' ';
         }
         var albumGroupJpName = (albumGroup.name ? "("+albumGroup.name+")" : '');
         if (language == KEYS.LANGUAGE_JP) {
            desc += (card.jpeponym ? "【"+card.jpeponym+"】" : '') + ' ' + constUtil.Member.getMemberName(curTypeId) + ' ' + albumGroupJpName;
         } else {
            desc += (card.eponym ? "【"+card.eponym+"】" : '') + ' ' + constUtil.Member.getMemberName(curTypeId, KEYS.LANGUAGE_CN) + ' ' + (albumGroup.cnname ? "("+albumGroup.cnname+")" : albumGroupJpName);
         }
         return desc;
      },
      getMaxKizuna: function (rarity, mezame) {
         if (mezame) {
            return DEFAULT_KIZUNA_MEZAME[rarity];
         } else {
            return DEFAULT_KIZUNA_NORMAL[rarity];
         }
      }
   };
   constUtil.Common = CommonUtils;

   /** @type {LLH.ConstUtil.Attributes} */
   var AttributesUtils = {
      makeAttributes: function (smile, pure, cool) {
         return {'smile': smile || 0, 'pure': pure || 0, 'cool': cool || 0};
      },
      makeAttributes0: function () {
         return AttributesUtils.makeAttributes(0, 0, 0);
      },
      copyAttributes: function (fromAttr) {
         return AttributesUtils.makeAttributes(fromAttr.smile, fromAttr.pure, fromAttr.cool);
      },
      multiplyCeilingAttributes: function (lhs, factor) {
         return AttributesUtils.makeAttributes(Math.ceil(lhs.smile * factor), Math.ceil(lhs.pure * factor), Math.ceil(lhs.cool * factor));
      },
      addAttributes: function (lhs, rhs) {
         return AttributesUtils.makeAttributes(lhs.smile + rhs.smile, lhs.pure + rhs.pure, lhs.cool + rhs.cool);
      },
      addToAttributes: function (baseAttr, deltaAttr) {
         baseAttr.smile = baseAttr.smile + deltaAttr.smile;
         baseAttr.pure = baseAttr.pure + deltaAttr.pure;
         baseAttr.cool = baseAttr.cool + deltaAttr.cool;
         return baseAttr;
      }
   };
   constUtil.Attributes = AttributesUtils;

   /** @type {LLH.ConstUtil.Member} */
   var MemberUtils = {
      isMemberInGroup: function (member, group) {
         if (group === undefined || group == '') return false;
         var memberId = mGetMemberId(member);
         var groupData = mGetGroupData(group);
         if (memberId === undefined || groupData === undefined) return false;
         var groupMembers = groupData.members;
         if (groupMembers) {
            for (var i = 0; i < groupMembers.length; i++) {
               if (groupMembers[i] == memberId) return true;
            }
         }
         return false;
      },
      getMemberName: function (member, language) {
         var memberData = mGetMemberData(member);
         if (!memberData) return '<未知成员(' + member + ')>';
         if (language !== undefined && language == KEYS.LANGUAGE_CN && memberData.cnname) return memberData.cnname;
         if (!memberData.name) return '<未知名字(' + member + ')>';
         return memberData.name;
      },
      getBigGroupId: function (memberId) {
         var bigGroups = constUtil.Group.getBigGroupIds();
         for (var i = 0; i < bigGroups.length; i++) {
            var groupId = bigGroups[i];
            if (constUtil.Member.isMemberInGroup(memberId, groupId)) {
               return groupId;
            }
         }
         return undefined;
      },
      isNonetTeam: function (members) {
         if ((!members) || (members.length != 9)) {
            console.error('isNonetTeam: invalid members', members);
            return undefined;
         }
         var curMemberName = members[0].card.jpname;
         var bigGroup = MemberUtils.getBigGroupId(curMemberName);
         if (bigGroup === undefined) return undefined;
         var memberFlag = {};
         memberFlag[curMemberName] = 1;
         for (var i = 1; i < members.length; i++) {
            curMemberName = members[i].card.jpname;
            if (!constUtil.Member.isMemberInGroup(curMemberName, bigGroup)) return undefined;
            memberFlag[curMemberName] = 1;
         }
         var distinctMemberCount = Object.keys(memberFlag).length;
         if (bigGroup == KEYS.GROUP_LIELLA) {
            return (distinctMemberCount == 5 ? bigGroup : undefined);
         } else {
            return (distinctMemberCount == 9 ? bigGroup : undefined);
         }
      },
      isSameColorTeam: function (members) {
         if ((!members) || (members.length != 9)) {
            console.error('isSameColorTeam: invalid members', members);
            return undefined;
         }
         var curMemberColor = members[0].card.attribute;
         if (curMemberColor == 'all') {
            console.warn('isSameColorTeam: invalid member attribute: all', members);
            return undefined;
         }
         for (var i = 1; i < members.length; i++) {
            if (members[i].card.attribute != curMemberColor) return undefined;
         }
         return curMemberColor;
      },
      getMemberGrade: function (member) {
         mCheckInited(INIT_KEY_UNIT_TYPE);
         var memberData = mGetMemberData(member);
         if (!memberData) return undefined;
         return memberData.grade;
      },
      getMemberTypeIdsInGroups: function (groups) {
         mCheckInited(INIT_KEY_UNIT_TYPE);
         if (groups === undefined) return [];
         if (typeof(groups) == 'number') groups = [groups];
         var memberInGroupCount = {};
         var expectedCount = groups.length;
         var i, j;
         for (i = 0; i < groups.length; i++) {
            var groupData = mGetGroupData(groups[i]);
            var groupMembers = groupData && groupData.members;
            if ((!groupMembers) || groupMembers.length == 0) {
               console.warn('Group ' + groups[i] + ' has no member!');
               expectedCount -= 1;
               continue;
            }
            for (j = 0; j < groupMembers.length; j++) {
               if (memberInGroupCount[groupMembers[j]] !== undefined) {
                  memberInGroupCount[groupMembers[j]] += 1;
               } else {
                  memberInGroupCount[groupMembers[j]] = 1;
               }
            }
         }
         var ret = [];
         for (i in memberInGroupCount) {
            if (memberInGroupCount[i] == expectedCount) {
               ret.push(parseInt(i));
            }
         }
         return ret;
      },
      getMemberColor: function (member) {
         var memberData = mGetMemberData(member);
         if (!memberData) return undefined;
         return memberData.color;
      },
      getMemberBackgroundColor: function (member) {
         var memberData = mGetMemberData(member);
         if ((!memberData) || (!memberData.background_color)) return KEYS.BACKGROUND_COLOR_DEFAULT;
         return memberData.background_color;
      }
   };
   constUtil.Member = MemberUtils;

   /** @type {LLH.ConstUtil.Group} */
   var GroupUtils = {
      getGroupName: function (groupid) {
         mCheckInited(INIT_KEY_MEMBER_TAG);
         var groupData = GROUP_DATA[groupid];
         if (!groupData) return '<Unknown(' + groupid + ')>';
         if (groupData.cnname) return groupData.cnname;
         return groupData.name;
      },
      getBigGroupIds: function () {
         return [KEYS.GROUP_MUSE, KEYS.GROUP_AQOURS, KEYS.GROUP_NIJIGASAKI, KEYS.GROUP_LIELLA];
      }
   };
   constUtil.Group = GroupUtils;

   /** @type {LLH.ConstUtil.Gem} */
   var GemUtils = {
      getMemberGemList: function () { return MEMBER_GEM_LIST; },
      getUnitGemList: function () { return UNIT_GEM_LIST; },
      isMemberGemExist: function (member) {
         var memberData = mGetMemberData(member);
         if (!memberData) return false;
         return (memberData.member_gem ? true : false);
      },
      getNormalGemMeta: function (typeOrMeta) {
         if (typeof(typeOrMeta) == 'number') {
            if (typeOrMeta < 0 || typeOrMeta >= GEM_NORMAL_TYPE_DATA.length) {
               console.warn('Unknown normal gem id: ' + typeOrMeta);
               return undefined;
            }
            return GEM_NORMAL_TYPE_DATA[typeOrMeta];
         } else {
            return typeOrMeta;
         }
      },
      getNormalGemTypeKeys: (function (arr) {
         /** @type {string[]} */
         var keys = [];
         for (var i = 0; i < arr.length; i++) {
            keys.push(arr[i].key);
         }
         return function () { return keys; };
      })(GEM_NORMAL_TYPE_DATA),
      getNormalGemName: function (typeOrMeta) {
         var meta = GemUtils.getNormalGemMeta(typeOrMeta);
         return meta && meta.cnname;
      },
      getNormalGemBriefDescription: function (typeOrMeta) {
         var meta = GemUtils.getNormalGemMeta(typeOrMeta);
         if (!meta) return undefined;
         var str = 'C' + meta.slot + '/';
         if (meta.attr_add) {
            str += meta.effect_value;
         } else if (meta.attr_mul) {
            str += meta.effect_value + '%';
         } else if (meta.skill_mul) {
            str += (meta.effect_value + 100) / 100 + 'x';
         } else if (meta.heal_mul) {
            str += meta.effect_value + 'x';
         } else if (meta.ease_attr_mul) {
            str += meta.effect_value + '%/判';
         }
         return str;
      },
      getNormalGemNameAndDescription: function (typeOrMeta) {
         var meta = GemUtils.getNormalGemMeta(typeOrMeta);
         var gemName, gemDesc;
         if (meta) {
            gemName = GemUtils.getNormalGemName(meta)
            gemDesc = GemUtils.getNormalGemBriefDescription(meta);
         }
         return (gemName || '未知宝石') + ' （' + (gemDesc || '未知宝石') + '）';
      },
      isGemFollowMemberAttribute: function (typeOrMeta) {
         var meta = GemUtils.getNormalGemMeta(typeOrMeta);
         if (!meta) return false;
         if (meta.heal_mul || meta.skill_mul || meta.ease_attr_mul) return true;
         return false;
      },
      getGemBriefDescription: function (gemData, iscn) {
         var desc = '';
         var effect_type = gemData.effect_type;
         var effect_value = gemData.effect_value;
         if (effect_type == KEYS.SIS_EFFECT_TYPE_SMILE
            || effect_type == KEYS.SIS_EFFECT_TYPE_PURE
            || effect_type == KEYS.SIS_EFFECT_TYPE_COOL) {
            if (gemData.fixed) {
               desc += '[' + effect_value + ']';
            } else {
               desc += '[' + effect_value + '%]';
            }
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_SCORE_BOOST) {
            desc += '[' + (effect_value + 100)/100 + 'x]';
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_HEAL_SCORE) {
            desc += '[' + effect_value + 'x]';
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_ACCURACY_SMILE
            || effect_type == KEYS.SIS_EFFECT_TYPE_ACCURACY_PURE
            || effect_type == KEYS.SIS_EFFECT_TYPE_ACCURACY_COOL) {
            desc += '[' + effect_value + '%/判]';
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_LA_SCORE) {
            desc += '[' + effect_value + '%';
            var sub_skill = gemData.sub_skill_data;
            while (sub_skill) {
               desc += '+' + sub_skill.effect_value + '%';
               sub_skill = sub_skill.sub_skill_data;
            }
            desc += ']';
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_LA_DEBUFF) {
            if (gemData.live_effect_type == KEYS.SIS_LIVE_EFFECT_TYPE_DAMAGE) {
               desc += '[-' + effect_value + '/' + gemData.live_effect_interval + 's]';
            } else if (gemData.live_effect_type == KEYS.SIS_LIVE_EFFECT_TYPE_POSSIBILITY_DOWN) {
               desc += '[-' + effect_value + '%]';
            } else {
               desc += '[-?]';
            }
         } else {
            desc += '[?]';
         }
         if (gemData.level) {
            desc += '[Lv' + gemData.level + ']';
         }
         if (iscn && gemData.cnname) {
            desc += gemData.cnname;
         } else {
            desc += gemData.jpname;
         }
         return desc;
      },
      getGemDescription: function (gemData, iscn) {
         var desc = gemData.id;
         while (desc.length < 3) desc = '0' + desc;
         desc += ' ';
         if (gemData.type == KEYS.SIS_TYPE_NORMAL) {
            desc += '●';
         } else if (gemData.type == KEYS.SIS_TYPE_LIVE_ARENA) {
            desc += '■';
         }
         desc += gemData.size + ' ' + GemUtils.getGemBriefDescription(gemData, iscn);
         if (gemData.member) {
            desc += '[' + constUtil.Member.getMemberName(gemData.member, iscn ? KEYS.LANGUAGE_CN : KEYS.LANGUAGE_JP) + ']';
         }
         return desc;
      },
      getGemFullDescription: function (gemData, iscn) {
         var desc = '';
         var effect_type = gemData.effect_type;
         var isAttributeEffect = (effect_type == KEYS.SIS_EFFECT_TYPE_SMILE
            || effect_type == KEYS.SIS_EFFECT_TYPE_PURE
            || effect_type == KEYS.SIS_EFFECT_TYPE_COOL);
         // 限制可装备的成员
         if (gemData.member) {
            var memberName = constUtil.Member.getMemberName(gemData.member, iscn ? KEYS.LANGUAGE_CN : KEYS.LANGUAGE_JP);
            desc += '仅限' + memberName + '装备，';
         }
         if (gemData.grade) {
            desc += '仅限' + gemData.grade + '年级装备，';
         }
         if ((!isAttributeEffect) && gemData.color) {
            desc += '仅限' + COLOR_ID_TO_NAME[gemData.color] + '社员装备，';
         }
         // 发动条件
         if (gemData.group) {
            var groupName = constUtil.Group.getGroupName(gemData.group);
            if (gemData.group == KEYS.GROUP_NIJIGASAKI) {
               desc += '不同的9名' + groupName + '成员参加时，';
            } else if (gemData.group == KEYS.GROUP_LIELLA) {
               desc += '队伍中成员均为' + groupName + '成员并全员参加时，';
            } else {
               desc += '队伍中成员为' + groupName + '全员时，';
            }
         }
         if (gemData.trigger_ref == KEYS.SIS_TRIGGER_REF_HP_PERCENT) {
            desc += '歌曲结束时若体力高于' + gemData.trigger_value + '%，';
         } else if (gemData.trigger_ref == KEYS.SIS_TRIGGER_REF_FULL_COMBO) {
            desc += '全连击时，';
         } else if (gemData.trigger_ref == KEYS.SIS_TRIGGER_REF_OVERHEAL) {
            desc += '歌曲结束时若体力槽高于' + gemData.trigger_value + '，';
         } else if (gemData.trigger_ref == KEYS.SIS_TRIGGER_REF_ALL_SMILE) {
            desc += '队伍成员属性全为smile时，';
         } else if (gemData.trigger_ref == KEYS.SIS_TRIGGER_REF_ALL_PURE) {
            desc += '队伍成员属性全为pure时，';
         } else if (gemData.trigger_ref == KEYS.SIS_TRIGGER_REF_ALL_COOL) {
            desc += '队伍成员属性全为cool时，';
         } else if (gemData.trigger_ref == KEYS.SIS_TRIGGER_REF_PERFECT_COUNT) {
            desc += '歌曲结束时，若perfect次数高于' + gemData.trigger_value + '，';
         } else if (gemData.trigger_ref) {
            desc += '<未知发动条件(' + gemData.trigger_ref + ')>';
         }
         // 效果
         if (isAttributeEffect) {
            if (gemData.range == KEYS.SIS_RANGE_SELF) {
               desc += '装备此技能的社员的'
            } else if (gemData.range == KEYS.SIS_RANGE_TEAM) {
               desc += '队伍中的所有社员的'
            }
            desc += COLOR_ID_TO_NAME[gemData.color || 0] + '提升'
            if (gemData.fixed) {
               desc += gemData.effect_value;
            } else {
               desc += gemData.effect_value + '%';
            }
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_SCORE_BOOST) {
            desc += '装备此技能的社员的得分提升技能效果变为' + (gemData.effect_value + 100)/100 + '倍';
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_HEAL_SCORE) {
            desc += '体力最大时，装备此技能的社员发动体力回复技能，可增加（回复量 x ' + gemData.effect_value + '）的得分';
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_ACCURACY_SMILE
            || effect_type == KEYS.SIS_EFFECT_TYPE_ACCURACY_PURE
            || effect_type == KEYS.SIS_EFFECT_TYPE_ACCURACY_COOL) {
            let colorName = (gemData.color && COLOR_ID_TO_NAME[gemData.color]) || '<未知属性>';
            desc += '判定强化技能发动时，装备此技能的社员的' + colorName + '变为' + (gemData.effect_value + 100)/100 + '倍';
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_LA_SCORE) {
            desc += '得分增加' + gemData.effect_value + '%';
         } else if (effect_type == KEYS.SIS_EFFECT_TYPE_LA_DEBUFF) {
            if (gemData.live_effect_type == KEYS.SIS_LIVE_EFFECT_TYPE_DAMAGE) {
               desc += '每隔' + gemData.live_effect_interval + '秒，对手的体力减少' + gemData.effect_value;
            } else if (gemData.live_effect_type == KEYS.SIS_LIVE_EFFECT_TYPE_POSSIBILITY_DOWN) {
               desc += '对手的技能发动率下降' + gemData.effect_value + '%';
            }
         } else if (effect_type) {
            desc += '<未知效果(' + effect_type + ')>';
         }
         // sub skill
         if (gemData.sub_skill_data) {
            desc += '；' + constUtil.Gem.getGemFullDescription(gemData.sub_skill_data, iscn);
         } else if (gemData.sub_skill) {
            desc += '；<未知子效果(' + gemData.sub_skill + ')>';
         }
         return desc;
      },
      getGemColor: function (gemData) {
         if (gemData.type == KEYS.SIS_TYPE_NORMAL) {
            return COLOR_NAME_TO_COLOR[COLOR_ID_TO_NAME[gemData.color || 5]];
         } else if (gemData.type == KEYS.SIS_TYPE_LIVE_ARENA) {
            var trigger_ref = gemData.trigger_ref;
            if (trigger_ref == KEYS.SIS_TRIGGER_REF_HP_PERCENT
               || trigger_ref == KEYS.SIS_TRIGGER_REF_OVERHEAL) {
               return '#4c4';
            } else if (trigger_ref == KEYS.SIS_TRIGGER_REF_FULL_COMBO
               || trigger_ref == KEYS.SIS_TRIGGER_REF_PERFECT_COUNT) {
               return '#f0c';
            } else if (trigger_ref == KEYS.SIS_TRIGGER_REF_ALL_SMILE
               || trigger_ref == KEYS.SIS_TRIGGER_REF_ALL_PURE
               || trigger_ref == KEYS.SIS_TRIGGER_REF_ALL_COOL) {
               return '#f60';
            } else if (gemData.group) {
               return '#eb0';
            } else if (gemData.effect_type == KEYS.SIS_EFFECT_TYPE_LA_DEBUFF) {
               return '#f00';
            } else if (trigger_ref) {
               return '#888';
            } else {
               return '#fa0';
            }
         } else {
            return '';
         }
      },
      postProcessGemData: function (gemData) {
         if (!gemData) return;
         for (var i in gemData) {
            var curGemData = gemData[i];
            if (curGemData.sub_skill) {
               curGemData.sub_skill_data = gemData[curGemData.sub_skill.toFixed()];
            }
            if (curGemData.level_up_skill) {
               curGemData.level_up_skill_data = gemData[curGemData.level_up_skill.toFixed()];
               if (curGemData.level_up_skill_data) {
                  curGemData.level_up_skill_data.level_down_skill_data = curGemData;
               }
            }
         }
      }
   };
   constUtil.Gem = GemUtils;
   constUtil.GemType = (function (arr) {
      /** @type {LLH.ConstUtil.GemType} */
      // @ts-ignore
      var indexMap = {};
      for (var i = 0; i < arr.length; i++) {
         indexMap[arr[i].key] = i;
      }
      return indexMap;
   })(GEM_NORMAL_TYPE_DATA);

   var COMBO_FEVER_PATTERN_2 = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 5, 6, 7, 8, 9, 10]

   /** @type {LLH.ConstUtil.Live} */
   var LiveUtils = {
      getNoteAppearTime: function(noteTimeSec, speed) {
         return noteTimeSec - NOTE_APPEAR_OFFSET_S[speed - 1];
      },
      getDefaultSpeed: function (difficulty) {
         return DEFAULT_SPEED[difficulty] || 8;
      },
      isHoldNote: function(note_effect) {
         return (note_effect == KEYS.NOTE_TYPE_HOLD || note_effect == KEYS.NOTE_TYPE_SWING_HOLD);
      },
      isSwingNote: function(note_effect) {
         return (note_effect == KEYS.NOTE_TYPE_SWING || note_effect == KEYS.NOTE_TYPE_SWING_HOLD || note_effect == KEYS.NOTE_TYPE_SWING_EVENT);
      },
      getComboScoreFactor: function (combo) {
         if (combo <= 50) return 1;
         else if (combo <= 100) return 1.1;
         else if (combo <= 200) return 1.15;
         else if (combo <= 400) return 1.2;
         else if (combo <= 600) return 1.25;
         else if (combo <= 800) return 1.3;
         else return 1.35;
      },
      getComboFeverBonus: function(combo, pattern) {
         if (pattern == 1) return (combo >= 300 ? 10 : Math.pow(Math.floor(combo/10), 2)/100+1);
         return (combo >= 220 ? 10 : COMBO_FEVER_PATTERN_2[Math.floor(combo/10)]);
      }
   };
   constUtil.Live = LiveUtils;

   var SKILL_TRIGGER_TEXT = {};
   SKILL_TRIGGER_TEXT[KEYS.SKILL_TRIGGER_TIME] = {'name': '时间', 'unit': '秒'};
   SKILL_TRIGGER_TEXT[KEYS.SKILL_TRIGGER_NOTE] = {'name': '图标', 'unit': '图标'};
   SKILL_TRIGGER_TEXT[KEYS.SKILL_TRIGGER_COMBO] = {'name': '连击', 'unit': '连击'};
   SKILL_TRIGGER_TEXT[KEYS.SKILL_TRIGGER_SCORE] = {'name': '分数', 'unit': '分'};
   SKILL_TRIGGER_TEXT[KEYS.SKILL_TRIGGER_PERFECT] = {'name': '完美', 'unit': '完美判定'};
   SKILL_TRIGGER_TEXT[KEYS.SKILL_TRIGGER_STAR_PERFECT] = {'name': '星星', 'unit': '星星'};
   SKILL_TRIGGER_TEXT[KEYS.SKILL_TRIGGER_MEMBERS] = {'name': '连锁', 'unit': ''};

   var SKILL_EFFECT_TEXT = {};
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_ACCURACY_SMALL] = '小判定';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_ACCURACY_NORMAL] = '判定';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_HEAL] = '回血';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_SCORE] = '加分';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_POSSIBILITY_UP] = '技能发动率';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_REPEAT] = '重复';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_PERFECT_SCORE_UP] = '完美加分';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_COMBO_FEVER] = '连击加分';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_SYNC] = '属性同步';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_LEVEL_UP] = '技能等级';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_ATTRIBUTE_UP] = '属性提升';
   SKILL_EFFECT_TEXT[KEYS.SKILL_EFFECT_CHARGED_SPARK] = '火花';

   /** @type {LLH.ConstUtil.Skill} */
   var SkillUtils = {
      getTriggerTargetDescription: function (targets) {
         if (!targets) return '(数据缺失)';
         var desc = '';
         for (var i = 0; i < targets.length; i++) {
            desc += constUtil.Group.getGroupName(targets[i]);
         }
         return desc;
      },
      getTriggerTargetMemberDescription: function (targets) {
         if (!targets) return '全员';
         var desc = '';
         for (var i = 0; i < targets.length; i++) {
            if (i > 0) desc += '、';
            desc += constUtil.Member.getMemberName(targets[i], KEYS.LANGUAGE_CN);
         }
         return desc;
      },
      getTriggerLimitDescription: function (triggerLimit) {
         var desc = '';
         if (triggerLimit) desc = '（最多' + triggerLimit + '次）';
         return desc;
      },
      getTriggerDescription: function (triggerType, triggerValue, triggerTarget, triggerEffectType) {
         var desc = '(未知条件)';
         if (triggerType == KEYS.SKILL_TRIGGER_TIME)
            desc = '每' + triggerValue + '秒';
         else if (triggerType == KEYS.SKILL_TRIGGER_NOTE)
            desc = '每' + triggerValue + '个图标';
         else if (triggerType == KEYS.SKILL_TRIGGER_COMBO)
            desc = '每达成' + triggerValue + '次连击';
         else if (triggerType == KEYS.SKILL_TRIGGER_SCORE)
            desc = '每达成' + triggerValue + '分';
         else if (triggerType == KEYS.SKILL_TRIGGER_PERFECT)
            desc = '每获得' + triggerValue + '个PERFECT';
         else if (triggerType == KEYS.SKILL_TRIGGER_STAR_PERFECT)
            desc = '每获得' + triggerValue + '个星星图标的PERFECT';
         else if (triggerType == KEYS.SKILL_TRIGGER_MEMBERS)
            desc = '自身以外的' + SkillUtils.getTriggerTargetDescription(triggerTarget) + '的成员的特技全部发动时';
         else if (triggerType == KEYS.SKILL_TRIGGER_SKILL_ACTIVATE_COUNT)
            desc = '每发动' + triggerValue + '次' + SkillUtils.getEffectBrief(triggerEffectType) + '技能时';
         return desc;
      },
      getEffectDescription: function (effectType, effectValue, dischargeTime, effectTarget, effectTargetMember) {
         var desc = '(未知效果)';
         var targetDesc = '(数据缺失)';
         if (effectTarget) {
            targetDesc = SkillUtils.getTriggerTargetDescription(effectTarget);
         } else {
            targetDesc = SkillUtils.getTriggerTargetMemberDescription(effectTargetMember);
         }
         if (effectType == KEYS.SKILL_EFFECT_ACCURACY_SMALL)
            desc = '稍微增强判定' + dischargeTime + '秒';
         else if (effectType == KEYS.SKILL_EFFECT_ACCURACY_NORMAL)
            desc = '增强判定' + dischargeTime + '秒';
         else if (effectType == KEYS.SKILL_EFFECT_HEAL)
            desc = '恢复' + effectValue + '点体力';
         else if (effectType == KEYS.SKILL_EFFECT_SCORE)
            desc = '提升分数' + effectValue + '点';
         else if (effectType == KEYS.SKILL_EFFECT_POSSIBILITY_UP)
            desc = dischargeTime + '秒内其它的特技发动概率提高到' + effectValue + '倍';
         else if (effectType == KEYS.SKILL_EFFECT_REPEAT)
            desc = '发动上一个发动的非repeat的特技';
         else if (effectType == KEYS.SKILL_EFFECT_PERFECT_SCORE_UP)
            desc = dischargeTime + '秒内的PERFECT提升' + effectValue + '分';
         else if (effectType == KEYS.SKILL_EFFECT_COMBO_FEVER) {
            if (effectValue && typeof(effectValue) == 'number') {
               desc = dischargeTime + '秒内的点击得分根据combo数提升' + effectValue + '~' + (effectValue*10) + '分';
            } else {
               desc = dischargeTime + '秒内的点击得分根据combo数提升' + effectValue + '0分';
            }
         } else if (effectType == KEYS.SKILL_EFFECT_SYNC) {
            if (effectTarget || effectTargetMember) targetDesc += '的随机一位成员';
            else targetDesc = '某位成员';
            desc = dischargeTime + '秒内自身的属性P变为与' + targetDesc + '的属性P一致';
         } else if (effectType == KEYS.SKILL_EFFECT_LEVEL_UP)
            desc = '使下一个发动的技能等级提升' + effectValue + '级';
         else if (effectType == KEYS.SKILL_EFFECT_ATTRIBUTE_UP) {
            if (effectTarget) targetDesc += '的成员'
            desc = dischargeTime + '秒内' + targetDesc + '的属性P提高到' + effectValue + '倍';
         } else if (effectType == KEYS.SKILL_EFFECT_CHARGED_SPARK)
            desc = dischargeTime + '秒内的点击得分提升' + effectValue + '分';
         return desc;
      },
      isStrengthSupported: function (card) {
         if (card && card.skill && (card.skilleffect > 11 || card.triggertype > 12)) return false;
         return true;
      },
      getCardSkillDescription: function (card, level) {
         if (!card.skill) return '无';
         if (card.skilleffect == 0) return '获得特技经验';
         var level_detail = card.skilldetail[level];
         var effect_type = card.skilleffect;
         var effect_value = level_detail.score;
         var discharge_time = level_detail.time;
         // cover the legacy case
         if (discharge_time === undefined) {
            if (effect_type == 4 || effect_type == 5) {
               discharge_time = effect_value;
               effect_value = 0;
            }
         }
         var trigger_text = SkillUtils.getTriggerDescription(card.triggertype, level_detail.require, card.triggertarget);
         var effect_text = SkillUtils.getEffectDescription(effect_type, effect_value, discharge_time, card.effecttarget);
         var rate_text = SkillUtils.getRateDescription(level_detail.possibility);
         var limit_text = SkillUtils.getTriggerLimitDescription(level_detail.limit);
         var supporting_text = (SkillUtils.isStrengthSupported(card) ? '' : '(该技能暂不支持理论强度计算，仅支持模拟)');

         return trigger_text + rate_text + effect_text + limit_text + supporting_text;
      },
      getRateDescription: function (rate) {
         return '就有' + rate + '%的概率';
      },
      getAccessorySkillDescription: function (accessory, levelIndex) {
         if ((!accessory.levels) || (!accessory.levels[levelIndex])) {
            return '';
         }
         var level_detail = accessory.levels[levelIndex];
         var trigger_text = '特技未发动时，';
         if (accessory.trigger_type) {
            trigger_text += SkillUtils.getTriggerDescription(accessory.trigger_type, level_detail.trigger_value || 0, undefined, accessory.trigger_effect_type);
         }
         var rate_text = SkillUtils.getRateDescription(level_detail.rate);
         var effect_text = SkillUtils.getEffectDescription(accessory.effect_type, level_detail.effect_value, level_detail.time, undefined, accessory.effect_target);
         return trigger_text + rate_text + effect_text;
      },
      getEffectBrief: function (effectType) {
         if (!effectType) return '无';
         return SKILL_EFFECT_TEXT[effectType] || '未知';
      },
      getSkillTriggerText: function(skill_trigger) {
         if (!skill_trigger) return '无';
         var t = SKILL_TRIGGER_TEXT[skill_trigger];
         if (!t) return '未知';
         return t.name;
      },
      getSkillTriggerUnit: function(skill_trigger) {
         if (!skill_trigger) return '';
         var t = SKILL_TRIGGER_TEXT[skill_trigger];
         if (!t) return '';
         return t.unit;
      }
   };
   constUtil.Skill = SkillUtils;

   /** @type {LLH.ConstUtil.Album} */
   var AlbumUtils = {
      getAlbumGroupByAlbumId: function (album_id) {
         mCheckInited(INIT_KEY_ALBUM);
         if (!album_id) return undefined;
         if (!ALBUM_DATA[album_id]) {
            console.error('not found album ' + album_id);
            return undefined;
         }
         var album = ALBUM_DATA[album_id];
         if (album.albumGroupId === undefined) {
            console.error('album ' + album_id + ' has no group id');
            return undefined;
         }
         return ALBUM_GROUP[album.albumGroupId];
      },
      getAlbumGroups: function () {
         mCheckInited(INIT_KEY_ALBUM);
         return ALBUM_GROUP;
      },
      isAlbumInAlbumGroup: function (album_id, group_id) {
         mCheckInited(INIT_KEY_ALBUM);
         if (!album_id) return false;
         if (!ALBUM_DATA[album_id]) {
            console.error('not found album ' + album_id);
            return false;
         }
         return ALBUM_DATA[album_id].albumGroupId === group_id;
      }
   };
   constUtil.Album = AlbumUtils;

   /** @type {LLH.ConstUtil.Accessory} */
   var AccessoryUtils = {
      getAccessoryDescription: function (accessoryData, language) {
         if (language === undefined) {
            language = KEYS.LANGUAGE_JP;
         }
         var desc = accessoryData.id;
         while (desc.length < 3) desc = '0' + desc;
         var rarityStr = constUtil.Common.getRarityString(accessoryData.rarity);
         var name = accessoryData.jpname;
         if (language == KEYS.LANGUAGE_CN && accessoryData.cnname) name = accessoryData.cnname;
         var type = AccessoryUtils.getAccessoryType(accessoryData);
         if (accessoryData.unit_id) {
            var maybeProcessedData = /** @type {LLH.Internal.ProcessedAccessoryDataType} */ (accessoryData);
            if (maybeProcessedData.card && maybeProcessedData.card.typeid) {
               type = constUtil.Member.getMemberName(maybeProcessedData.card.typeid, language);
            }
         }
         return desc + ' [' + rarityStr + '][' + type + '] ' + name;
      },
      postProcessAccessoryData: function (accessoryData, cardData) {
         for (var i in accessoryData) {
            AccessoryUtils.postProcessSingleAccessoryData(accessoryData[i], cardData);
         }
         return /** @type {LLH.Internal.ProcessedAccessoryDictDataType} */ (accessoryData);
      },
      postProcessSingleAccessoryData: function (accessoryData, cardData) {
         var retAccessory = /** @type {LLH.Internal.ProcessedAccessoryDataType} */ (accessoryData);
         if (retAccessory.unit_id) {
            var cardId = retAccessory.unit_id;
            if (cardData[cardId]) {
               retAccessory.card = cardData[cardId];
               retAccessory.unit_type_id = retAccessory.card.typeid;
            } else {
               console.warn('Not found card data for ' + cardId + ' when processing accessory', retAccessory);
            }
         }
         retAccessory.main_attribute = AccessoryUtils.getAccessoryMainAttribute(retAccessory);
         retAccessory.type = AccessoryUtils.getAccessoryType(retAccessory);
         return retAccessory;
      },
      getAccessoryMainAttribute: function (accessory) {
         var maxValue = accessory.smile;
         /** @type {LLH.Core.AttributeAllType} */
         var mainAttribute = 'smile';
         var maxCount = 1;
         if (accessory.pure > maxValue) {
            maxValue = accessory.pure;
            mainAttribute = 'pure';
            maxCount = 1;
         } else if (accessory.pure == maxValue) {
            maxCount += 1;
         }
         if (accessory.cool > maxValue) {
            maxValue = accessory.cool;
            mainAttribute = 'cool';
            maxCount = 1;
         } else if (accessory.cool == maxValue) {
            maxCount += 1;
         }
         if (maxCount == 1) {
            return mainAttribute;
         } else {
            return 'all';
         }
      },
      getAccessoryType: function (accessory) {
         if (accessory.is_material) {
            return '材料';
         } else if (accessory.unit_id) {
            return '个人';
         } else {
            return '通用';
         }
      },
      getAccessoryLevelAttribute: function (accessory, level) {
         if (accessory) {
            var levelIndex = level - 1;
            if (accessory.levels && accessory.levels[levelIndex]) {
               var levelDetail = accessory.levels[levelIndex];
               return AttributesUtils.makeAttributes(
                  (levelDetail.smile !== undefined ? levelDetail.smile : accessory.smile),
                  (levelDetail.pure !== undefined ? levelDetail.pure : accessory.pure),
                  (levelDetail.cool !== undefined ? levelDetail.cool : accessory.cool)
               );
            } else {
               return AttributesUtils.copyAttributes(accessory);
            }
         } else {
            return AttributesUtils.makeAttributes0();
         }
      },
      canEquipAccessory: function (accessory, level, cardId) {
         if ((!accessory) || (!cardId)) {
            return true;
         }
         if (!accessory.unit_id) {
            return true;
         }
         if (accessory.unit_id == cardId) {
            return true;
         }
         if (level < 8) {
            return false;
         }
         var cardBrief = LLCardData.getAllCachedBriefData()[cardId];
         var accessoryCardBrief = LLCardData.getAllCachedBriefData()[accessory.unit_id];
         return (cardBrief && accessoryCardBrief && cardBrief.typeid == accessoryCardBrief.typeid);
      }
   };
   constUtil.Accessory = AccessoryUtils;

   constUtil.initMetadata = function(metadata) {
      if (metadata.album) {
         mInitAlbumData(metadata.album);
         metaDataInited[INIT_KEY_ALBUM] = 1;
      }
      if (metadata.member_tag) {
         GROUP_DATA = metadata.member_tag;
         metaDataInited[INIT_KEY_MEMBER_TAG] = 1;
      }
      if (metadata.unit_type) {
         mInitMemberData(metadata.unit_type);
         metaDataInited[INIT_KEY_UNIT_TYPE] = 1;
      }
      if (metadata.cskill_groups) {
         CSKILL_GROUPS = metadata.cskill_groups;
         metaDataInited[INIT_KEY_CSKILL_GROUPS] = 1;
      }
      if (metadata.level_limit) {
         LEVEL_LIMIT_DATA = metadata.level_limit;
         metaDataInited[INIT_KEY_LEVEL_LIMIT] = 1;
      }
   };

   var SONG_GROUP_NAME = {};
   SONG_GROUP_NAME[KEYS.SONG_GROUP_MUSE] = '缪';
   SONG_GROUP_NAME[KEYS.SONG_GROUP_AQOURS] = '水';
   SONG_GROUP_NAME[KEYS.SONG_GROUP_NIJIGASAKI] = '虹';
   SONG_GROUP_NAME[KEYS.SONG_GROUP_LIELLA] = '星';

   var SONG_DIFFICULTY_NAME = {};
   SONG_DIFFICULTY_NAME[KEYS.SONG_DIFFICULTY_EASY] = {'cn': '简单', 'en': 'Easy'};
   SONG_DIFFICULTY_NAME[KEYS.SONG_DIFFICULTY_NORMAL] = {'cn': '普通', 'en': 'Normal'};
   SONG_DIFFICULTY_NAME[KEYS.SONG_DIFFICULTY_HARD] = {'cn': '困难', 'en': 'Hard'};
   SONG_DIFFICULTY_NAME[KEYS.SONG_DIFFICULTY_EXPERT] = {'cn': '专家', 'en': 'Expert'};
   SONG_DIFFICULTY_NAME[KEYS.SONG_DIFFICULTY_RANDOM] = {'cn': '随机', 'en': 'Random'};
   SONG_DIFFICULTY_NAME[KEYS.SONG_DIFFICULTY_MASTER] = {'cn': '大师', 'en': 'Master'};

   /** @type {{[id: number]: LLH.Core.BigGroupIdType}} */
   var SONG_GROUP_TO_GROUP = {};
   SONG_GROUP_TO_GROUP[KEYS.SONG_GROUP_MUSE] = KEYS.GROUP_MUSE;
   SONG_GROUP_TO_GROUP[KEYS.SONG_GROUP_AQOURS] = KEYS.GROUP_AQOURS;
   SONG_GROUP_TO_GROUP[KEYS.SONG_GROUP_NIJIGASAKI] = KEYS.GROUP_NIJIGASAKI;
   SONG_GROUP_TO_GROUP[KEYS.SONG_GROUP_LIELLA] = KEYS.GROUP_LIELLA;

   /** @type {LLH.ConstUtil.Song} */
   var SongUtil = {
      getSongGroupShortName: function (song_group) {
         return SONG_GROUP_NAME[song_group] || '?';
      },
      getSongGroupIds: function () {
         return [KEYS.SONG_GROUP_MUSE, KEYS.SONG_GROUP_AQOURS, KEYS.SONG_GROUP_NIJIGASAKI, KEYS.SONG_GROUP_LIELLA];
      },
      getGroupForSongGroup: function (song_group) {
         if (SONG_GROUP_TO_GROUP[song_group] !== undefined) {
            return SONG_GROUP_TO_GROUP[song_group];
         }
         return undefined;
      },
      getDefaultSongSetIds: function () {
         return [KEYS.SONG_DEFAULT_SET_1, KEYS.SONG_DEFAULT_SET_2];
      },
      getSongDifficultyName: function (diff, language) {
         return SONG_DIFFICULTY_NAME[diff][language == KEYS.LANGUAGE_CN ? 'cn' : 'en'];
      },
      getDefaultSongSetting: function (song_group, default_set) {
         var songIdBase = -(song_group*100+default_set*10);
         /** @type {LLH.Core.PositionWeightType} */
         var exWeight;
         /** @type {number} */
         var exCombo;
         if (default_set == KEYS.SONG_DEFAULT_SET_1) {
            exWeight = [63.75,63.75,63.75,63.75,0,63.75,63.75,63.75,63.75];
            exCombo = 500;
         } else {
            exWeight = [63,63,63,63,0,63,63,63,63];
            exCombo = 504;
         }
         /** @type {LLH.API.SongSettingDataType} */
         var expert_default = {
            'time': '110',
            'star': '65',
            'difficulty': KEYS.SONG_DIFFICULTY_EXPERT,
            'stardifficulty': 9,
            'liveid': (songIdBase-KEYS.SONG_DIFFICULTY_EXPERT).toFixed(),
            'positionweight': exWeight,
            'combo': exCombo,
            'isac': 0,
            'isswing': 0
         };
         return expert_default;
      },
      getDefaultSong: function (song_group, default_set) {
         var songIdBase = -(song_group*100+default_set*10);
         /** @type {LLH.Core.PositionWeightType} */
         var maWeight, ma2Weight;
         /** @type {number} */
         var maCombo, ma2Combo;
         if (default_set == KEYS.SONG_DEFAULT_SET_1) {
            maWeight = [87.5,87.5,87.5,87.5,0,87.5,87.5,87.5,87.5];
            maCombo = 700;
            ma2Weight = [112.5,112.5,112.5,112.5,0,112.5,112.5,112.5,112.5];
            ma2Combo = 900;
         } else {
            maWeight = [88,88,88,88,0,88,88,88,88];
            maCombo = 704;
            ma2Weight = [113,113,113,113,0,113,113,113,113];
            ma2Combo = 904;
         }
         var expert_default = SongUtil.getDefaultSongSetting(song_group, default_set);
         /** @type {LLH.API.SongSettingDataType} */
         var master_default = {
            'time': '110',
            'star': '65',
            'difficulty': KEYS.SONG_DIFFICULTY_MASTER,
            'stardifficulty': 11,
            'liveid': (songIdBase-KEYS.SONG_DIFFICULTY_MASTER).toFixed(),
            'positionweight': maWeight,
            'combo': maCombo,
            'isac': 0,
            'isswing': 0
         };
         /** @type {LLH.API.SongSettingDataType} */
         var master2_default ={
            'time': '110',
            'star': '65',
            'difficulty': KEYS.SONG_DIFFICULTY_MASTER,
            'stardifficulty': 12,
            'liveid': (songIdBase-KEYS.SONG_DIFFICULTY_MASTER-1).toFixed(),
            'positionweight': ma2Weight,
            'combo': ma2Combo,
            'isac': 0,
            'isswing': 0
         };

         var songName = '默认曲目' + default_set + '（' + SongUtil.getSongGroupShortName(song_group) + '）';
         /** @type {LLH.API.SongDataType} */
         var default_song = {
            'id': songIdBase.toFixed(),
            'name': songName,
            'jpname': songName,
            'group': song_group,
            'bpm': '200',
            'attribute': 'all',
            'settings': {}
         };
         default_song.settings[expert_default.liveid] = expert_default;
         default_song.settings[master_default.liveid] = master_default;
         default_song.settings[master2_default.liveid] = master2_default;
         return default_song;
      }
   };
   constUtil.Song = SongUtil;

   /** @type {LLH.ConstUtil.Level} */
   var levelUtil = {
      getLevelLimitPatterns: function () {
         mCheckInited(INIT_KEY_LEVEL_LIMIT, true);
         return Object.keys(LEVEL_LIMIT_DATA).sort((a, b) => parseInt(a) - parseInt(b));
      },
      getLevelLimit: function (patternId) {
         mCheckInited(INIT_KEY_LEVEL_LIMIT, true);
         return LEVEL_LIMIT_DATA[patternId];
      },
      getLevelLimitAttributeDiff: function (patternId, level) {
         mCheckInited(INIT_KEY_LEVEL_LIMIT, true);
         var levelLimit = levelUtil.getLevelLimit(patternId);
         if (levelLimit && levelLimit[level] !== undefined) {
            return levelLimit[level];
         } else {
            return 0;
         }
      }
   };
   constUtil.Level = levelUtil;

   return constUtil;
})();

/*
 * LLUnit: utility functions for unit related operations, used in llnewunit, llnewunitsis, etc.
 */
var defaultHandleFailedRequest = function() {
   alert('载入失败!');
};

var LLUnit = {

   comboMulti: function (cb) {
      if (cb <= 50) {
         return 1;
      } else if (cb <= 100) {
         return 1.1 - 5 / cb;
      } else if (cb <= 200) {
         return 1.15 - 10 / cb;
      } else if (cb <= 400) {
         return 1.2 - 20 / cb;
      } else if (cb <= 600) {
         return 1.25 - 40 / cb;
      } else if (cb <= 800) {
         return 1.3 - 70 / cb;
      } else {
         return 1.35 - 110 / cb;
      }
   },

   /**
    * @param {number} n 
    * @param {number} precision 
    */
   numberToString: function (n, precision) {
      var ret = n.toFixed(precision);
      var pos = ret.length - 1;
      while (ret[pos] == '0') pos--;
      if (ret[pos] == '.') pos--;
      if (pos != ret.length - 1) ret = ret.substring(0, pos+1);
      return ret;
   },

   /** @param {number} n */
   healNumberToString: function (n) {
      return LLUnit.numberToString(n, 2);
   },

   numberToPercentString: function (n, precision) {
      if (n === undefined) return '';
      if (precision === undefined) precision = 2;
      return LLUnit.numberToString(n*100, precision) + '%';
   },

   /**
    * @param {LLH.Core.CardIdOrStringType | undefined} cardid 
    * @param {'avatar' | 'card' | 'navi'} type 
    * @param {boolean} mezame 
    * @returns {string[]}
    */
   getImagePathList: function (cardid, type, mezame) {
      if ((!cardid) || cardid == "0") {
         if (type == 'avatar') return ['/static/null.png'];
         return [''];
      }
      var ret = [];
      var isHttp = ('http:' == document.location.protocol);
      var curServer = LLImageServerSwitch.getImageServer();
      if (type == 'avatar' || type == 'card') {
         var f = (type == 'avatar' ? 'icon' : 'unit');
         var m = (mezame ? 'rankup' : 'normal');
         if (type == 'avatar') {
            ret.push('/static/avatar/' + m + '/' + cardid + '.png');
         }
         if (!(type == 'avatar' && curServer === LLImageServerSwitch.AVATAR_SERVER_LOCAL)) {
            if (isHttp) {
               for (var i = 0; i < 4; i++) {
                  ret.push(((i>=2) ? 'https' : 'http') + '://gitcdn.' + (i%2==0 ? 'xyz' : 'link') + '/repo/iebb/SIFStatic/master/' + f + '/' + m + '/' + cardid + '.png');
               }
            } else {
               for (var i = 0; i < 2; i++) {
                  ret.push('https://gitcdn.' + (i%2==0 ? 'xyz' : 'link') + '/repo/iebb/SIFStatic/master/' + f + '/' + m + '/' + cardid + '.png');
               }
            }
         }
      } else if (type == 'navi') {
         var m = (mezame ? '1' : '0');
         for (var i = 0; i < 2; i++) {
            ret.push((isHttp !== (i>=1) ? 'http' : 'https') + '://db.loveliv.es/png/navi/' + cardid + '/' + m);
         }
      } else {
         ret.push('');
      }
      return ret;
   },

   calculate: function (docalculate, cardids, accessoryIds, addRequests) {
      var requests = [];
      var i;
      var uniqueCardids = {};
      var uniqueAccessoryIds = {};
      if (cardids) {
         for (i = 0; i < cardids.length; i++) {
            var cardid = cardids[i];
            if (cardid && uniqueCardids[cardid] === undefined) {
               requests.push(LLCardData.getDetailedData(cardid));
               uniqueCardids[cardid] = 1;
            }
         }
      }
      var accessoryBegin = requests.length;
      if (accessoryIds) {
         for (i = 0; i < accessoryIds.length; i++) {
            var accessoryId = accessoryIds[i];
            if (accessoryId && uniqueAccessoryIds[accessoryId] === undefined) {
               requests.push(LLAccessoryData.getDetailedData(accessoryId));
               uniqueAccessoryIds[accessoryId] = 1;
            }
         }
      }
      var additionalBegin = requests.length; 
      var accessoryResults = {};
      var extraResults = [];
      if (addRequests) {
         for (i = 0; i < addRequests.length; i++) {
            requests.push(addRequests[i]);
            extraResults.push(undefined);
         }
      }
      LoadingUtil.start(requests, function (data, index, result) {
         if (index < accessoryBegin) result[parseInt(data.id)] = data;
         else if (index < additionalBegin) accessoryResults[data.id] = data;
         else extraResults[index-additionalBegin] = data;
      }).then(function (cards) {
         try {
            docalculate(cards, accessoryResults, extraResults);
         } catch (e) {
            console.error('calculate fail');
            console.error(e);
         }
      }, defaultHandleFailedRequest);
   },

   getCardCSkillText: function (card, withbr) {
      if (!card.Cskill) return '无';
      var nameSuffix = '<Unknown>';
      var majorPercentage = parseInt(card.Cskillpercentage);
      var majorEffect = '';
      var secondEffect = '';
      if (majorPercentage == 3) nameSuffix = '的力量';
      else if (majorPercentage == 4) nameSuffix = '能量';
      else if (majorPercentage == 6) nameSuffix = '之心';
      else if (majorPercentage == 7) nameSuffix = '之星';
      else if (majorPercentage == 9 || (majorPercentage == 12 && card.Csecondskilllimit !== undefined)) {
         if (card.Cskillattribute == 'smile') nameSuffix = '公主';
         else if (card.Cskillattribute == 'pure') nameSuffix = '天使';
         else if (card.Cskillattribute == 'cool') nameSuffix = '皇后';
      } else if (majorPercentage  == 12) {
         if (card.Cskillattribute == 'smile') nameSuffix = '红宝石';
         else if (card.Cskillattribute == 'pure') nameSuffix = '绿宝石';
         else if (card.Cskillattribute == 'cool') nameSuffix = '蓝宝石';
      }
      if (card.Cskillattribute == card.attribute) {
         majorEffect = card.attribute + '属性提升' + majorPercentage + '%';
      } else {
         majorEffect = card.attribute + '属性提升' + card.Cskillattribute + '的' + majorPercentage +  '%';
      }
      if (card.Csecondskilllimit !== undefined) {
         secondEffect = (withbr ? '<br/>' : '+') + LLConst.Group.getGroupName(parseInt(card.Csecondskilllimit)) + '的社员进一步将' + card.attribute + '属性提升' + card.Csecondskillattribute + '%';
      }
      return card.attribute + nameSuffix + '：' + (withbr ? '<br/>' : '') + majorEffect + secondEffect;
   },

   /**
    * @param {HTMLElement} element 
    * @param {LLH.Component.HTMLElementOrString} [subElement] 
    */
   appendSubElement: function (element, subElement) {
      if (!subElement) return;
      if (typeof (subElement) == 'string') {
         element.appendChild(document.createTextNode(subElement));
      } else {
         element.appendChild(subElement);
      }
   },

   /**
    * @param {HTMLElement} ele 
    * @param {LLH.Component.SubElements} [subElements] 
    * @param {boolean} [isReplace]
    * @returns {HTMLElement} ele
    */
   updateSubElements: function (ele, subElements, isReplace) {
      if (isReplace) {
         ele.innerHTML = '';
      }
      if (subElements) {
         if (Array.isArray(subElements)) {
            for (var i = 0; i < subElements.length; i++) {
                var element = subElements[i];
                if (Array.isArray(element)) {
                    for (var j = 0; j < element.length; j++) {
                        LLUnit.appendSubElement(ele, element[j]);
                    }
                } else {
                  LLUnit.appendSubElement(ele, element);
                }
            }
         } else {
            LLUnit.appendSubElement(ele, subElements);
         }
      }
      return ele;
   },

   /**
    * @template {HTMLElement} T
    * @param {string} tag 
    * @param {LLH.Component.CreateElementOptions} [options]
    * @param {LLH.Component.SubElements} [subElements]
    * @param {{[x: string] : (e: Event) => void}} [eventHandlers]
    * @returns {T}
    */
   createElement: function (tag, options, subElements, eventHandlers) {
      var ret = document.createElement(tag);
      if (options) {
         for (var k in options) {
            if (k == 'style') {
               for (var s in options.style) {
                  ret.style[s] = options.style[s];
               }
            } else {
               ret[k] = options[k];
            }
         }
      }
      if (subElements) {
         LLUnit.updateSubElements(ret, subElements, false);
      }
      if (eventHandlers) {
         for (var e in eventHandlers) {
            ret.addEventListener(e, eventHandlers[e]);
         }
      }
      return /** @type {T} */ (ret);
   },

   /**
    * @param {LLH.Component.CreateElementOptions} [options] 
    * @param {LLH.Component.SubElements} [subElements] 
    * @param {{[x: string] : (e: Event) => void}} [eventHandlers]
    * @returns {HTMLSelectElement} 
    */
   createSelectElement: function (options, subElements, eventHandlers) {
      return LLUnit.createElement('select', options, subElements, eventHandlers);
   },

   /**
    * @template {HTMLElement} T
    * @param {LLH.Component.HTMLElementOrId} id 
    * @returns {T}
    */
   getElement: function (id) {
      if (typeof(id) == 'string') {
         var element = document.getElementById(id);
         if (!element) {
            console.error('Not found element by id: ' + id);
            element = LLUnit.createElement('div', undefined, ['dummy']);
         }
         return /** @type {T} */ (element);
      } else {
         return /** @type {T} */ (id);
      }
   },

   /**
    * @template {HTMLElement} T
    * @param {LLH.Component.HTMLElementOrId | undefined} id 
    * @param {string} tag 
    * @param {LLH.Component.CreateElementOptions} [options]
    * @param {LLH.Component.SubElements} [subElements]
    * @param {{[x: string] : (e: Event) => void}} [eventHandlers]
    * @returns {T}
    */
   getOrCreateElement: function (id, tag, options, subElements, eventHandlers) {
      var element;
      if (id) {
         if (typeof(id) === 'string') {
            element = document.getElementById(id);
         } else {
            element = id;
         }
      }
      if (!element) {
         /** @type {T} */
         var newElement = LLUnit.createElement(tag, options, subElements, eventHandlers);
         return newElement;
      } else {
         return /** @type {T} */ (element);
      }
   },

   /**
    * @param {string} label 
    * @param {LLH.Component.SubElements} [subElements] 
    * @returns {HTMLElement}
    */
   createFormInlineGroup: function (label, subElements) {
      var group = LLUnit.createElement('div', {'className': 'form-group'}, [
         LLUnit.createElement('label', undefined, label)
      ]);
      LLUnit.updateSubElements(group, subElements);
      return LLUnit.createElement('div', {'className': 'form-inline'}, group);
   },

   /** @returns {HTMLSelectElement} */
   createFormSelect: function () {
      return LLUnit.createSelectElement({'className': 'form-control no-padding'});
   },

   createSimpleTable: function (data) {
      var createElement = LLUnit.createElement;
      var rowElements = [];
      for (var i = 0; i < data.length; i++) {
         var row = data[i];
         var cellElements = [];
         for (var j = 0; j < row.length; j++) {
            var cell = row[j];
            var tag = 'td';
            if (typeof(cell) == 'string') {
               var text = cell;
               if (cell[0] == '#') {
                  tag = 'th';
                  text = cell.substr(1);
               }
               cellElements.push(createElement(tag, {'innerHTML': text}));
            } else if (typeof(cell) == 'number') {
               cellElements.push(createElement(tag, {'innerHTML': '' + cell}));
            } else {
               cellElements.push(createElement(tag, undefined, cell));
            }
         }
         rowElements.push(createElement('tr', undefined, cellElements));
      }
      var tbodyElement = createElement('tbody', undefined, rowElements);
      var tableElement = createElement('table', {'className': 'table-bordered table-condensed'}, [tbodyElement]);
      return tableElement;
   },

   /** @param {LLH.Component.CreateElementOptions} [options] */
   createColorSelectComponent: function (options) {
      /** @type {LLH.Component.LLSelectComponent<LLH.Core.AttributeType>} */
      var selectComponent = new LLSelectComponent(LLUnit.createSelectElement(options));
      /** @type {LLH.Component.LLSelectComponent_OptionDef<LLH.Core.AttributeType>[]} */
      var selOptions = [];
      selOptions.push({'value': 'smile', 'text': 'Smile', 'color': 'red'});
      selOptions.push({'value': 'pure',  'text': 'Pure',  'color': 'green'});
      selOptions.push({'value': 'cool',  'text': 'Cool',  'color': 'blue'});
      selectComponent.setOptions(selOptions);
      return selectComponent;
   }
};

var LLImageServerSwitch = (function () {
   /** @type {LLH.Misc.LLImageServerSwitch_Servers} */
   const servers = {
      'AVATAR_SERVER_GIT': 0,
      'AVATAR_SERVER_LOCAL': 1
   }

   var IMAGE_SERVER_KEY = 'llhelper_image_server__';
   function getImageServer() {
      var server = servers.AVATAR_SERVER_GIT;
      try {
         server = parseInt(localStorage.getItem(IMAGE_SERVER_KEY) || '0');
      } catch (e) {
         console.error(e);
      }
      return server;
   }

   var curServer = getImageServer();

   function updateImageServer() {
      try {
         localStorage.setItem(IMAGE_SERVER_KEY, curServer.toFixed());
      } catch (e) {
         console.error(e);
      }
   }

   function getServerName(server) {
      return '线路' + (server+1);
   }

   var callbacks = [];
   var lastCleanupSize = 0;

   function checkCallbacks(doCallback) {
      for (var i = 0; i < callbacks.length; i++) {
         var key = callbacks[i][0];
         if (key && key.isInDocument && !key.isInDocument()) {
            callbacks.splice(i, 1);
            i--;
         } else if (doCallback) {
            callbacks[i][1]();
         }
      }
      lastCleanupSize = callbacks.length;
   }

   /** @type {LLH.Misc.LLImageServerSwitch} */
   var ret = {
      'AVATAR_SERVER_GIT': servers.AVATAR_SERVER_GIT,
      'AVATAR_SERVER_LOCAL' : servers.AVATAR_SERVER_LOCAL,

      getImageServer: function () {
         return curServer;
      },
      changeImageServer: function () {
         curServer = (curServer + 1) % 2;
         updateImageServer();
         checkCallbacks(true);
      },
      registerCallback: function (key, callback) {
         for (var i = 0; i < callbacks.length; i++) {
            if (callbacks[i][0] === key) {
               callbacks[i][1] = callback;
               return;
            }
         }
         callbacks.push([key, callback]);
         if (callbacks.length - lastCleanupSize > 30) {
            checkCallbacks(false);
         }
      },
      initImageServerSwitch: function (id) {
         var element = LLUnit.getElement(id);
         var switchLink = LLUnit.createElement('a', {'href': 'javascript:;', 'title': '点击切换头像线路'}, [getServerName(curServer)], {
            'click': function () {
               ret.changeImageServer();
               LLUnit.updateSubElements(switchLink, [getServerName(curServer)], true);
            }
         });
         LLUnit.updateSubElements(element, [switchLink], true);
         element.style.display = '';
      }
   };

   return ret;
})();

/*
 * componsed components
 *   LLSkillContainer (require LLUnit)
 */
var LLSkillContainer = (function() {
   const SEL_ID_CONTAINER = 'container';
   const SEL_ID_LVUP = 'lvup';
   const SEL_ID_LVDOWN = 'lvdown';
   const SEL_ID_LEVEL = 'level';
   const SEL_ID_TEXT = 'text';
   class LLSkillContainer_cls extends LLComponentCollection {
      /**
       * @param {LLH.Layout.Skill.LLSkillContainer_Options} [options] 
       */
      constructor(options) {
         super();
         this.skillLevel = 0; // base 0, range 0-7
         this.cardData = undefined;
         options = options || {};

         this.showAll = options.showall || false;
         this.lvUpComponent = new LLComponentBase(options.lvup || 'skilllvup');
         this.lvDownComponent = new LLComponentBase(options.lvdown || 'skilllvdown');
         this.containerComponent = new LLComponentBase(options.container || 'skillcontainer');
         this.levelComponent = new LLValuedComponent(options.level || 'skilllevel');
         this.textComponent = new LLValuedComponent(options.text || 'skilltext');

         var me = this;
         this.lvUpComponent.on('click', function (e) {
            me.setSkillLevel(me.skillLevel+1);
         });
         this.lvDownComponent.on('click', function (e) {
            me.setSkillLevel(me.skillLevel-1);
         });

         this.add(SEL_ID_CONTAINER, this.containerComponent);
         this.add(SEL_ID_LVUP, this.lvUpComponent);
         this.add(SEL_ID_LVDOWN, this.lvDownComponent);
         this.add(SEL_ID_LEVEL, this.levelComponent);
         this.add(SEL_ID_TEXT, this.textComponent);
         this.setCardData(options.cardData, true);
         this.render();
      }
      /** @param {number} lv */
      setSkillLevel(lv) {
         if (lv == this.skillLevel) return;
         var lvCap = 8;
         if (this.showAll && this.cardData && this.cardData.skilldetail && this.cardData.skilldetail.length > lvCap) {
            lvCap = this.cardData.skilldetail.length;
         }
         if (lv >= lvCap) {
            this.skillLevel = 0;
         } else if (lv < 0) {
            this.skillLevel = lvCap-1;
         } else {
            this.skillLevel = lv;
         }
         this.render();
      }
      /**
       * @param {LLH.API.CardDataType} [cardData] 
       * @param {boolean} [skipRender] 
       */
      setCardData(cardData, skipRender) {
         if (this.cardData === undefined) {
            if (cardData === undefined) return;
            this.cardData = cardData;
            this.skillLevel = 0;
            if (!skipRender) this.render();
         } else {
            if (cardData === undefined || this.cardData.id != cardData.id) {
               this.cardData = cardData;
               this.skillLevel = 0;
               if (!skipRender) this.render();
            }
         }
      }
      render() {
         if ((!this.cardData) || this.cardData.skill == 0 || this.cardData.skill == null) {
            this.containerComponent.hide();
         } else {
            this.containerComponent.show();
            this.textComponent.set(LLConst.Skill.getCardSkillDescription(this.cardData, this.skillLevel));
            this.levelComponent.set((this.skillLevel+1).toFixed());
         }
      }
   }

   return LLSkillContainer_cls;
})();

var LLSkillComponent = (function () {
   class LLSkillComponent extends LLSkillContainer {
      /** @param {LLH.Layout.Skill.LLSkillComponent_Options} [options] */
      constructor(options) {
         if (!options) options = {};
         var container = LLUnit.getOrCreateElement(options.id, 'div');
         var lvUp = LLUnit.createElement('input', {'type': 'button', 'value': '▲', 'style': {'width': '20px', 'height': '20px', 'padding': '0px'}});
         var lvDown = LLUnit.createElement('input', {'type': 'button', 'value': '▼', 'style': {'width': '20px', 'height': '20px', 'padding': '0px'}});
         var lvText = LLUnit.createElement('span', {'innerHTML': '1'});
         var skillText = LLUnit.createElement('span');
         if (options.showLabel) {
            LLUnit.updateSubElements(container, [
               '技能等级：', lvUp, ' Lv', lvText, ' ', lvDown, LLUnit.createElement('br'),
               '技能效果：', skillText, LLUnit.createElement('br')
            ]);
         } else {
            LLUnit.updateSubElements(container, [
               lvUp, ' Lv', lvText, ' ', lvDown, LLUnit.createElement('br'),
               skillText, LLUnit.createElement('br')
            ]);
         }
         super({
            'container': container,
            'level': lvText,
            'lvdown': lvDown,
            'lvup': lvUp,
            'text': skillText,
            'showall': options.showAll
         });
         this.element = container;
      }
   }

   return LLSkillComponent;
})();

var LLCardSelectorComponent = (function() {
   const createElement = LLUnit.createElement;
   const updateSubElements = LLUnit.updateSubElements;
   const createFormInlineGroup = LLUnit.createFormInlineGroup;
   const createFormSelect = LLUnit.createFormSelect;

   const SEL_ID_CARD_CHOICE = 'cardchoice';
   const SEL_ID_RARITY = 'rarity';
   const SEL_ID_CHARA = 'chr';
   const SEL_ID_UNIT_GRADE = 'unitgrade';
   const SEL_ID_ATTRIBUTE = 'att';
   const SEL_ID_TRIGGER_TYPE = 'triggertype';
   const SEL_ID_TRIGGER_REQUIRE = 'triggerrequire';
   const SEL_ID_SKILL_TYPE = 'skilltype';
   const SEL_ID_SPECIAL = 'special';
   const SEL_ID_SET_NAME = 'setname';
   const SEL_ID_SHOW_N_CARD = 'showncard';
   const SEL_ID_CARD_POOL = 'cardpool';
   const MEM_ID_LANGUAGE = 'language';

   /** @param {LLH.Core.SkillTriggerType} triggerId */
   var makeTriggerTypeOption = function (triggerId) {
      return {'value': triggerId + '', 'text': LLConst.Skill.getSkillTriggerText(triggerId)};
   };
   /** @param {LLH.Core.SkillEffectType} effectId */
   var makeEffectTypeOption = function (effectId) {
      return {'value': effectId + '', 'text': LLConst.Skill.getEffectBrief(effectId)};
   };

   /** @param {(filterValue: string, targetData: LLH.API.CardDataType) => boolean} callback */
   const makeCardFilter = function (callback) {
      /** @type {LLH.Component.LLFiltersComponent_FilterCallback<string, LLH.API.CardDataType>} */
      return function (opt, v, d) {
         return (!v) || (!d) || callback(v, d);
      };
   };

   /**
    * @implements {LLH.Mixin.LanguageSupport}
    */
   class LLCardSelectorComponent_cls extends LLFiltersComponent {
      /**
       * @param {LLH.Component.HTMLElementOrId} id 
       * @param {LLH.Selector.LLCardSelectorComponent_Options} options
       */
      constructor(id, options) {
         super();
         var container = LLUnit.getElement(id);

         /** @type {{[albumGroupId: string]: LLH.Core.UnitTypeIdType[]}} */
         this.albumGroupMemberCache = {};
         /** @type {LLH.API.CardDictDataType} */
         this.cards = {};
         /** @type {LLH.Selector.LLCardSelectorComponent_OnCardChangeCallback=} */
         this.onCardChange = undefined;
         /** @type {LLH.Pool.CardPoolsProcessedDataType=} */
         this.pools = options.pools;

         var me = this;
         // init components
         var selCardChoice = createFormSelect();
         var selRarity = createFormSelect();
         var selChara = createFormSelect();
         var selUnitGrade = createFormSelect();
         var selAttribute = createFormSelect();
         var selTriggerType = createFormSelect();
         var selTriggerRequire = createFormSelect();
         var selSkillType = createFormSelect();
         var selSpecial = createFormSelect();
         var selSetName = createFormSelect();
         var selCardPool = (this.pools ? createFormSelect() : undefined);
         var checkShowNCard = createElement('input', {'type': 'checkbox'});

         this._cardChoiceComponent = new LLSelectComponent(selCardChoice);
         this._languageComponent = new LLValuedMemoryComponent(LLConstValue.LANGUAGE_CN);
         this._triggerTypeComponent = new LLSelectComponent(selTriggerType);
   
         me.addFilterable(SEL_ID_CARD_CHOICE, this._cardChoiceComponent, function (opt) {
            var index = opt.value;
            if (!index) return undefined;
            return me.cards[index];
         });
         me.addFilterable(SEL_ID_RARITY, new LLSelectComponent(selRarity));
         me.addFilterable(SEL_ID_CHARA, new LLSelectComponent(selChara));
         me.addFilterable(SEL_ID_UNIT_GRADE, new LLSelectComponent(selUnitGrade));
         me.addFilterable(SEL_ID_ATTRIBUTE, new LLSelectComponent(selAttribute));
         me.addFilterable(SEL_ID_TRIGGER_TYPE, this._triggerTypeComponent);
         me.addFilterable(SEL_ID_TRIGGER_REQUIRE, new LLSelectComponent(selTriggerRequire));
         me.addFilterable(SEL_ID_SKILL_TYPE, new LLSelectComponent(selSkillType));
         me.addFilterable(SEL_ID_SPECIAL, new LLSelectComponent(selSpecial));
         me.addFilterable(SEL_ID_SET_NAME, new LLSelectComponent(selSetName));
         me.addFilterable(SEL_ID_SHOW_N_CARD, new LLValuedComponent(checkShowNCard));
         if (selCardPool) {
            me.addFilterable(SEL_ID_CARD_POOL, new LLSelectComponent(selCardPool));
         }
         me.addFilterable(MEM_ID_LANGUAGE, this._languageComponent);
   
         var languageGroupGetter = function () {
            return me._languageComponent.get() + ''; 
         }
         me.setFilterOptionGroupCallback(SEL_ID_CARD_CHOICE, languageGroupGetter, [MEM_ID_LANGUAGE]);
         me.setFilterOptionGroupCallback(SEL_ID_CHARA, languageGroupGetter, [MEM_ID_LANGUAGE]);
         me.setFilterOptionGroupCallback(SEL_ID_SET_NAME, languageGroupGetter, [MEM_ID_LANGUAGE]);
         me.setFilterOptionGroupCallback(SEL_ID_TRIGGER_REQUIRE, () => (me._triggerTypeComponent.get() || ''), [SEL_ID_TRIGGER_TYPE]);
   
         me.addFilterCallback(SEL_ID_RARITY, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => (d.rarity == v)));
         me.addFilterCallback(SEL_ID_CHARA, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => (LLConst.Member.getMemberName(d.typeid) == v)));
         me.addFilterCallback(SEL_ID_CHARA, SEL_ID_SET_NAME, function (opt, v) {
            if (v == '' || opt.value === '') return true;
            var members = me.albumGroupMemberCache[opt.value];
            if (!members) return false;
            for (var i = 0; i < members.length; i++) {
               if (LLConst.Member.getMemberName(members[i]) == v) return true;
            }
            return false;
         });
         me.addFilterCallback(SEL_ID_UNIT_GRADE, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => LLConst.Member.isMemberInGroup(d.typeid, v)));
         me.addFilterCallback(SEL_ID_UNIT_GRADE, SEL_ID_CHARA, (opt, v) => (!v) || (opt.value == '') || LLConst.Member.isMemberInGroup(opt.value, v));
         me.addFilterCallback(SEL_ID_UNIT_GRADE, SEL_ID_SET_NAME, function (opt, v) {
            if ((!v) || opt.value === '') return true;
            var members = me.albumGroupMemberCache[opt.value];
            if (!members) return false;
            for (var i = 0; i < members.length; i++) {
               if (LLConst.Member.isMemberInGroup(members[i], v)) return true;
            }
            return false;
         });
         me.addFilterCallback(SEL_ID_ATTRIBUTE, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => (d.attribute == v)));
         me.addFilterCallback(SEL_ID_TRIGGER_TYPE, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => ((d.triggertype + '') == v)));
         me.addFilterCallback(SEL_ID_TRIGGER_REQUIRE, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => (d.triggerrequire == v)));
         me.addFilterCallback(SEL_ID_SKILL_TYPE, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => ((d.skilleffect + '') == v)));
         me.addFilterCallback(SEL_ID_SPECIAL, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => (d.special == parseInt(v))));
         me.addFilterCallback(SEL_ID_SET_NAME, SEL_ID_CARD_CHOICE, makeCardFilter((v, d) => LLConst.Album.isAlbumInAlbumGroup(d.album, parseInt(v))));
         if (selCardPool) {
            me.addFilterCallback(SEL_ID_CARD_POOL, SEL_ID_CARD_CHOICE, (opt, v) => (!v) || (!opt.value) || (!me.pools) || me.pools[parseInt(v)].itemSet.has(opt.value));
         }
         me.addFilterCallback(SEL_ID_SHOW_N_CARD, SEL_ID_CARD_CHOICE, (opt, /** @type {boolean=} */ v, /** @type {LLH.API.CardDataType=} */ d) => (v == true) || (!d) || (d.rarity != 'N'));
         me.addFilterCallback(SEL_ID_SHOW_N_CARD, SEL_ID_CHARA, (opt, /** @type {boolean=} */ v) => (v == true) || (opt.value == '') || (LLConstValue[opt.value] !== undefined));
   
         /** @type {LLH.Component.SubElements} */
         var generalFilters = [selRarity, selChara, selUnitGrade, selAttribute, selSpecial];
         if (!options.noShowN) {
            generalFilters.push(checkShowNCard, '显示N卡');
         }
         updateSubElements(container, [
            createFormInlineGroup('筛选：', generalFilters),
            createFormInlineGroup('技能筛选：', [selTriggerType, selTriggerRequire, selSkillType]),
            createFormInlineGroup('相册：', [selSetName]),
            (selCardPool ? createFormInlineGroup('卡池：', [selCardPool]) : undefined),
            createFormInlineGroup('卡片：', [selCardChoice])
         ], true);
   
         me.onValueChange = function (name, newValue) {
            if (name == SEL_ID_CARD_CHOICE && me.onCardChange) {
               me.onCardChange(newValue);
            }
         }
   
         me.setCardData(options.cards);
      }
      /** @param {LLH.Core.LanguageType} language */
      setLanguage(language) {
         this._languageComponent.set(language);
      }
      /** @returns {LLH.Core.CardIdStringType} */
      getCardId() {
         return this._cardChoiceComponent.getOrElse('');
      }
      /** @returns {LLH.Core.CardIdStringType[]} */
      getFilteredCardIdList() {
         var selectedCard = this._cardChoiceComponent.get();
         if (selectedCard) {
            return [selectedCard];
         } else {
            return this._cardChoiceComponent.filteredOptions.map((x) => x.value).filter((x) => !!x);
         }
      }
      /**
       * @param {LLH.API.CardDictDataType} cards 
       * @param {boolean} [resetSelection] 
       */
      setCardData(cards, resetSelection) {
         var me = this;
         me.cards = cards;
         me.setFreezed(true);
   
         /** @type {{[id: number]: 0|1}} */
         var foundTypeIds = {};
         /** @type {{[triggerType: number]: {[triggerRequire: string]: 0|1}}} */
         var foundTriggerRequires = {};
         /** @type {{[albumGroupId: string]: LLH.Core.UnitTypeIdType[]}} */
         var albumGroupMemberCache = {};
   
         // build card options for both language
         var cardOptionsCN = [{'value': '', 'text': ''}];
         var cardOptionsJP = [{'value': '', 'text': ''}];
         var cardKeys = Object.keys(cards).sort(function(a,b){return parseInt(a) - parseInt(b);});
         var i;
         for (i = 0; i < cardKeys.length; i++) {
            var index = cardKeys[i];
            if (index == "0") continue;
            var curCard = cards[index];
            if (curCard.support == 1) continue;
   
            var curTypeId = (curCard.typeid ? curCard.typeid : -1);
            var cnName = LLConst.Common.getCardDescription(curCard, LLConstValue.LANGUAGE_CN);
            var jpName = LLConst.Common.getCardDescription(curCard, LLConstValue.LANGUAGE_JP);
            var color = LLConst.Common.getAttributeColor(curCard.attribute);
            cardOptionsCN.push({'value': index, 'text': cnName, 'color': color});
            cardOptionsJP.push({'value': index, 'text': jpName, 'color': color});
   
            foundTypeIds[curTypeId] = 1;
            if (curCard.triggerrequire) {
               if (!foundTriggerRequires[curCard.triggertype]) {
                  foundTriggerRequires[curCard.triggertype] = {};
               }
               foundTriggerRequires[curCard.triggertype][curCard.triggerrequire] = 1;
            }
   
            if (curCard.album) {
               var albumGroup = LLConst.Album.getAlbumGroupByAlbumId(curCard.album);
               if (albumGroup) {
                  if (albumGroupMemberCache[albumGroup.id]) {
                     albumGroupMemberCache[albumGroup.id].push(curTypeId);
                  } else {
                     albumGroupMemberCache[albumGroup.id] = [curTypeId];
                  }
               }
            }
         }
         me.setFilterOptionGroups(SEL_ID_CARD_CHOICE, {'0': cardOptionsCN, '1': cardOptionsJP});
         me.albumGroupMemberCache = albumGroupMemberCache;
         if (resetSelection) this._cardChoiceComponent.set('');
   
         // build set name options from album groups
         var setNameOptionsCN = [{'value': '', 'text': '相册名'}];
         var setNameOptionsJP = [{'value': '', 'text': '相册名'}];
         var albumGroups = LLConst.Album.getAlbumGroups();
         for (i = 0; i < albumGroups.length; i++) {
            var curGroup = albumGroups[i];
            setNameOptionsCN.push({'value': curGroup.id + '', 'text': (curGroup.cnname || curGroup.name)});
            setNameOptionsJP.push({'value': curGroup.id + '', 'text': curGroup.name});
         }
         me.setFilterOptionGroups(SEL_ID_SET_NAME, {'0': setNameOptionsCN, '1': setNameOptionsJP});
   
         // build character name options
         var charaNameOptionsCN = [{'value': '', 'text': '角色'}];
         var charaNameOptionsJP = [{'value': '', 'text': '角色'}];
         var typeIds = Object.keys(foundTypeIds).sort(function (a, b){return parseInt(a)-parseInt(b);});
         /** @type {LLH.Core.UnitTypeIdType[]} */
         var normalizedTypeIds = [];
         /** @type {{[jpName: string]: LLH.Core.UnitTypeIdType}} */
         var typeNameId = {};
         for (i = 0; i < typeIds.length; i++) {
            var curTypeId = parseInt(typeIds[i]);
            if (curTypeId < 0) continue;
            // some member has more than 1 id, we need normalize the ids using LLConst
            var jpName = LLConst.Member.getMemberName(curTypeId);
            if (typeNameId[jpName] === undefined) {
               if (LLConstValue[jpName] !== undefined) {
                  curTypeId = LLConstValue[jpName];
               } 
               typeNameId[jpName] = curTypeId;
               normalizedTypeIds.push(curTypeId);
            }
         }
         normalizedTypeIds = normalizedTypeIds.sort(function (a, b) {return a - b});
         for (i = 0; i < normalizedTypeIds.length; i++) {
            var curTypeId = normalizedTypeIds[i];
            var jpName = LLConst.Member.getMemberName(curTypeId);
            var cnName = LLConst.Member.getMemberName(curTypeId, LLConstValue.LANGUAGE_CN);
            var bkColor = LLConst.Member.getMemberBackgroundColor(curTypeId);
            charaNameOptionsCN.push({'value': jpName, 'text': cnName, 'background': bkColor});
            charaNameOptionsJP.push({'value': jpName, 'text': jpName, 'background': bkColor});
         }
         me.setFilterOptionGroups(SEL_ID_CHARA, {'0': charaNameOptionsCN, '1': charaNameOptionsJP});
   
         // build trigger require options
         /** @type {LLH.Component.LLFiltersComponent_OptionGroupType} */
         var triggerRequireOptions = {};
         for (i in foundTriggerRequires) {
            var triggerRequires = Object.keys(foundTriggerRequires[i]).sort(function (a, b){return parseInt(a) - parseInt(b)});
            var options = [{'value': '', 'text': '触发条件'}];
            var unitText = LLConst.Skill.getSkillTriggerUnit(parseInt(i));
            for (var j = 0; j < triggerRequires.length; j++) {
               options.push({'value': triggerRequires[j], 'text': triggerRequires[j] + unitText});
            }
            triggerRequireOptions[i] = options;
         }
         me.setFilterOptionGroups(SEL_ID_TRIGGER_REQUIRE, triggerRequireOptions);

         // build card pool options
         me.updatePoolsOptions();

         // set other options
         me.setFilterOptions(SEL_ID_RARITY, [
            {'value': '',    'text': '稀有度'},
            {'value': 'N',   'text': 'N'},
            {'value': 'R',   'text': 'R'},
            {'value': 'SR',  'text': 'SR'},
            {'value': 'SSR', 'text': 'SSR'},
            {'value': 'UR',  'text': 'UR'}
         ]);
         me.setFilterOptions(SEL_ID_UNIT_GRADE, [
            {'value': '', 'text': '年级小队'},
            {'value': '' + LLConstValue.GROUP_MUSE,       'text': "μ's"},
            {'value': '' + LLConstValue.GROUP_AQOURS,     'text': 'Aqours'},
            {'value': '' + LLConstValue.GROUP_NIJIGASAKI, 'text': '虹咲'},
            {'value': '' + LLConstValue.GROUP_LIELLA,     'text': 'Liella!'},
            {'value': '' + LLConstValue.GROUP_GRADE1,     'text': '一年级'},
            {'value': '' + LLConstValue.GROUP_GRADE2,     'text': '二年级'},
            {'value': '' + LLConstValue.GROUP_GRADE3,     'text': '三年级'},
            {'value': '' + LLConstValue.GROUP_PRINTEMPS,  'text': 'Printemps'},
            {'value': '' + LLConstValue.GROUP_LILYWHITE,  'text': 'lilywhite'},
            {'value': '' + LLConstValue.GROUP_BIBI,       'text': 'BiBi'},
            {'value': '' + LLConstValue.GROUP_CYARON,     'text': 'CYaRon!'},
            {'value': '' + LLConstValue.GROUP_AZALEA,     'text': 'AZALEA'},
            {'value': '' + LLConstValue.GROUP_GUILTYKISS, 'text': 'Guilty Kiss'},
            {'value': '' + LLConstValue.GROUP_DIVER_DIVA, 'text': 'DiverDiva'},
            {'value': '' + LLConstValue.GROUP_A_ZU_NA,    'text': 'A・ZU・NA'},
            {'value': '' + LLConstValue.GROUP_QU4RTZ,     'text': 'QU4RTZ'}
         ]);
         me.setFilterOptions(SEL_ID_ATTRIBUTE, [
            {'value': '',      'text': '属性',  'color': 'black'},
            {'value': 'smile', 'text': 'smile', 'color': 'red'},
            {'value': 'pure',  'text': 'pure',  'color': 'green'},
            {'value': 'cool',  'text': 'cool',  'color': 'blue'}
         ]);
         me.setFilterOptions(SEL_ID_TRIGGER_TYPE, [
            {'value': '', 'text': '触发类型'},
            makeTriggerTypeOption(LLConstValue.SKILL_TRIGGER_TIME),
            makeTriggerTypeOption(LLConstValue.SKILL_TRIGGER_NOTE),
            makeTriggerTypeOption(LLConstValue.SKILL_TRIGGER_COMBO),
            makeTriggerTypeOption(LLConstValue.SKILL_TRIGGER_SCORE),
            makeTriggerTypeOption(LLConstValue.SKILL_TRIGGER_PERFECT),
            makeTriggerTypeOption(LLConstValue.SKILL_TRIGGER_STAR_PERFECT),
            makeTriggerTypeOption(LLConstValue.SKILL_TRIGGER_MEMBERS)
         ]);
         me.setFilterOptions(SEL_ID_SKILL_TYPE, [
            {'value': '', 'text': '技能类型'},
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_ACCURACY_SMALL),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_ACCURACY_NORMAL),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_HEAL),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_SCORE),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_POSSIBILITY_UP),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_REPEAT),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_PERFECT_SCORE_UP),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_COMBO_FEVER),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_SYNC),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_LEVEL_UP),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP),
            makeEffectTypeOption(LLConstValue.SKILL_EFFECT_CHARGED_SPARK)
         ]);
         me.setFilterOptions(SEL_ID_SPECIAL, [
            {'value': '', 'text': '是否特典卡'},
            {'value': '0', 'text': '不是特典'},
            {'value': '1', 'text': '是特典'}
         ]);
   
         // at last, unfreeze the card filter and refresh filter
         me.setFreezed(false);
         me.handleFilters();
      }
      scrollIntoView() {
         var element = this._cardChoiceComponent.element;
         if (element) {
            element.scrollIntoView(true);
         }
      }
      updatePoolsOptions() {
         if (!this.pools) return;
         var cardPoolOptions = [{'value': '', 'text': '自定义卡池'}];
         for (var i = 0; i < this.pools.length; i++) {
            var poolName = this.pools[i].raw.name + '（卡片数：' + this.pools[i].raw.items.length + '）';
            cardPoolOptions.push({'value': i + '', 'text': poolName});
         }
         this.setFilterOptions(SEL_ID_CARD_POOL, cardPoolOptions);
         this.handleFilters(SEL_ID_CARD_POOL);
      }
   }
   return LLCardSelectorComponent_cls;
})();

var LLSongSelectorComponent = (function() {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;
   var createFormInlineGroup = LLUnit.createFormInlineGroup;
   var createFormSelect = LLUnit.createFormSelect;

   var SEL_ID_DIFF_CHOICE = 'diffchoice';
   var SEL_ID_SONG_CHOICE = 'songchoice';
   var SEL_ID_SONG_ATT = 'songatt';
   var SEL_ID_SONG_UNIT = 'songunit';
   var TEXT_ID_SONG_SEARCH = 'songsearch';
   var SEL_ID_SONG_DIFF = 'songdiff';
   var SEL_ID_SONG_AC = 'songac';
   var SEL_ID_SONG_SWING = 'songswing';
   var SEL_ID_SONG_STAR_DIFF = 'songstardiff';
   var SEL_ID_MAP_ATT = 'map';
   var MEM_ID_LANGUAGE = 'language';

   /**
    * @param {string} defaultValue 
    * @returns {HTMLInputElement}
    */
   function createFormNumber(defaultValue) {
      return createElement('input', {'className': 'form-control small-padding num-size-4', 'type': 'number', 'value': defaultValue});
   }

   /**
    * @param {LLH.Selector.LLSongSelectorComponent} me 
    * @param {HTMLElement} container 
    */
   function initMapInfo(me, container) {
      var isLAMode = (me.mode == 'la');
      var selMapAtt = createFormSelect();
      var numMapCombo = createFormNumber('300');
      var numMapPerfect = createFormNumber('285');
      var numMapTime = createFormNumber('100');
      var numMapStarPerfect = createFormNumber('47');
      var numBuffTapUp = (!isLAMode ? createFormNumber('0') : undefined);
      var numBuffSkillUp = (!isLAMode ? createFormNumber('0') : undefined);
      var numDebuffSkillRateDown = (isLAMode ? createFormNumber('0') : undefined);
      var numDebuffHpDownValue = (isLAMode ? createFormNumber('0'): undefined);
      var numDebuffHpDownInterval = (isLAMode ? createFormNumber('0'): undefined);
      me.addFilterable(SEL_ID_MAP_ATT, new LLSelectComponent(selMapAtt));
      me.addFilterCallback(SEL_ID_SONG_CHOICE, SEL_ID_MAP_ATT, function (opt, v) {
         if (!v) return true;
         var songData = me.songs[v];
         if ((!songData) || songData.attribute == 'all') return true;
         return (opt.value == songData.attribute);
      });
      me.addFilterCallback(SEL_ID_DIFF_CHOICE, SEL_ID_MAP_ATT, function (opt, v) {
         if (!v) return true;
         var songSetting = me.songSettings[v];
         if (!songSetting) return true;
         var songData = me.songs[songSetting.song];
         if ((!songData) || songData.attribute == 'all') return true;
         return (opt.value == songData.attribute);
      });
      updateSubElements(container, [
         createFormInlineGroup('图属性', selMapAtt),
         createFormInlineGroup('总combo数', numMapCombo),
         createFormInlineGroup('perfect数', numMapPerfect),
         createFormInlineGroup('时间', [numMapTime, '秒（从人物出现到最后一个note被击打的时间，不是歌曲长度。部分谱面无长度数据，默认值为110秒）']),
         createFormInlineGroup('星星perfect数', numMapStarPerfect)
      ]);
      if (isLAMode) {
         updateSubElements(container, [
            createFormInlineGroup('技能发动率下降：', [numDebuffSkillRateDown, '%']),
            createFormInlineGroup('体力伤害：', ['每', numDebuffHpDownInterval, '秒造成', numDebuffHpDownValue, '点伤害'])
         ]);
      } else {
         updateSubElements(container, [
            createFormInlineGroup('点击得分增加', [numBuffTapUp, '%']),
            createFormInlineGroup('技能发动率增加', [numBuffSkillUp, '%'])
         ]);
      }

      me.updateMapInfo = function (songSetting) {
         if (songSetting) {
            var combo = (songSetting.combo || 0);
            numMapCombo.value = combo + '';
            numMapPerfect.value = Math.floor(combo * 19/20) + '';
            numMapTime.value = (parseFloat(songSetting.time || '0') || 110) + '';
            numMapStarPerfect.value = parseInt(songSetting.star || '0') + '';
         }
      };

      me.getMap = function (customWeights) {
         var songSetting = me.getSelectedSongSetting();
         var llmap = new LLMap({
            'song': me.getSelectedSong(),
            'songSetting': songSetting,
            'friendCSkill': (me.friendCSkill ? me.friendCSkill.getCSkill() : undefined)
         });
         llmap.setAttribute(me.getSongAttribute());
         llmap.setSongDifficultyData(parseInt(numMapCombo.value), parseInt(numMapStarPerfect.value), parseInt(numMapTime.value), parseInt(numMapPerfect.value), parseInt(numMapStarPerfect.value));
         if (numDebuffSkillRateDown && numDebuffHpDownValue && numDebuffHpDownInterval) {
            llmap.setLADebuff(parseFloat(numDebuffSkillRateDown.value), parseInt(numDebuffHpDownValue.value), parseFloat(numDebuffHpDownInterval.value));
         } else if (numBuffTapUp && numBuffSkillUp) {
            llmap.setMapBuff(parseFloat(numBuffTapUp.value), parseFloat(numBuffSkillUp.value));
         } else {
            console.error('Failed to set map buff/debuff');
         }
         llmap.setWeights(customWeights || songSetting.positionweight);
         return llmap;
      };
   }

   /**
    * @implements {LLH.Mixin.LanguageSupport}
    */
   class LLSongSelectorComponent_cls extends LLFiltersComponent {
      /**
       * @param {LLH.Component.HTMLElementOrId} id
       * @param {LLH.Selector.LLSongSelectorComponent_Options} options
       */
      constructor(id, options) {
         super();
         var me = this;
         this.includeMapInfo = options.includeMapInfo || false;
         this.friendCSkill = options.friendCSkill || undefined;
         this.mode = options.mode || 'normal';
         /** @type {LLH.API.SongDictDataType} */
         this.songs = {};
         /** @type {LLH.Internal.ProcessedSongSettingDictDataType} */
         this.songSettings = {};
         /** @type {LLH.Selector.LLSongSelectorComponent_SongSettingChangeCallback=} */
         this.onSongSettingChange = undefined;
         /** @type {LLH.Selector.LLSongSelectorComponent_SongColorChangeCallback=} */
         this.onSongColorChange = undefined;

         var container = LLUnit.getElement(id);

         var selDiffChoice = createFormSelect();
         var selSongChoice = createFormSelect();
         var selSongAtt = createFormSelect();
         var selSongUnit = createFormSelect();
         var textSongSearch = createElement('input', {'type': 'text', 'className': 'form-control small-padding'});
         var selSongDiff = createFormSelect();
         var selSongAc = createFormSelect();
         var selSongSwing = createFormSelect();
         var selSongStarDiff = createFormSelect();

         this._diffChoiceComponent = new LLSelectComponent(selDiffChoice);
         this._songChoiceComponent = new LLSelectComponent(selSongChoice);
         this._languageComponent = new LLValuedMemoryComponent(LLConstValue.LANGUAGE_CN);

         me.addFilterable(SEL_ID_DIFF_CHOICE, this._diffChoiceComponent, function (opt) {
            var settingId = opt.value;
            if (!settingId) return undefined;
            return me.songSettings[settingId];
         });
         me.addFilterable(SEL_ID_SONG_CHOICE, this._songChoiceComponent, function (opt) {
            var songId = opt.value;
            if (!songId) return undefined;
            return me.songs[songId];
         });
         me.addFilterable(SEL_ID_SONG_ATT, new LLSelectComponent(selSongAtt));
         me.addFilterable(SEL_ID_SONG_UNIT, new LLSelectComponent(selSongUnit));
         me.addFilterable(TEXT_ID_SONG_SEARCH, new LLValuedComponent(textSongSearch));
         me.addFilterable(SEL_ID_SONG_DIFF, new LLSelectComponent(selSongDiff));
         me.addFilterable(SEL_ID_SONG_AC, new LLSelectComponent(selSongAc));
         me.addFilterable(SEL_ID_SONG_SWING, new LLSelectComponent(selSongSwing));
         me.addFilterable(SEL_ID_SONG_STAR_DIFF, new LLSelectComponent(selSongStarDiff));
         me.addFilterable(MEM_ID_LANGUAGE, this._languageComponent);

         me.setFilterOptionGroupCallback(SEL_ID_DIFF_CHOICE, () => me._languageComponent.get() + '', [MEM_ID_LANGUAGE]);
         me.setFilterOptionGroupCallback(SEL_ID_SONG_CHOICE, () => me._languageComponent.get() + '', [MEM_ID_LANGUAGE]);

         /**
          * @param {string} name
          * @param {(opt: LLH.Component.LLSelectComponent_OptionDef, v:string, d: LLH.API.SongDataType) => boolean} songChecker
          */
         var addSongAndSettingFilterBySong = function (name, songChecker) {
            me.addFilterCallback(name, SEL_ID_SONG_CHOICE,
               (opt, v, /** @type {LLH.API.SongDataType=} */ d) => (!v) || (!d) || songChecker(opt, v, d));
            me.addFilterCallback(name, SEL_ID_DIFF_CHOICE,
               (opt, v, /** @type {LLH.Internal.ProcessedSongSettingDataType=} */ d) => (!v) || (!d) || songChecker(opt, v, me.songs[d.song]));
         };
         /**
          * @param {string} name 
          * @param {(opt: LLH.Component.LLSelectComponent_OptionDef, v:string, d: LLH.Internal.ProcessedSongSettingDataType) => boolean} songSettingChecker 
          */
         var addSongAndSettingFilterBySongSetting = function (name, songSettingChecker) {
            me.addFilterCallback(name, SEL_ID_SONG_CHOICE, function (opt, v, /** @type {LLH.API.SongDataType=} */ d) {
               if ((!v) || (!d)) return true;
               for (var k in d.settings) {
                  var songSetting = /** @type {LLH.Internal.ProcessedSongSettingDataType} */ (d.settings[k]);
                  if (songSettingChecker(opt, v, songSetting)) return true;
               }
               return false;
            });
            me.addFilterCallback(name, SEL_ID_DIFF_CHOICE,
               (opt, v, /** @type {LLH.Internal.ProcessedSongSettingDataType=} */ d) => (!v) || (!d) || songSettingChecker(opt, v, d));
         };
         me.addFilterCallback(SEL_ID_SONG_CHOICE, SEL_ID_DIFF_CHOICE,
            (opt, v, /** @type {LLH.Internal.ProcessedSongSettingDataType=} */ d) => (!v) || (!d) || (d.song == v));
         addSongAndSettingFilterBySong(SEL_ID_SONG_ATT, (opt, v, d) => (d.attribute == 'all' || (d.attribute == v)));
         addSongAndSettingFilterBySong(SEL_ID_SONG_UNIT, (opt, v, d) => ((d.group + '') == v));
         addSongAndSettingFilterBySong(TEXT_ID_SONG_SEARCH, function (opt, v, d) {
            v = v.toLowerCase();
            return (d.name.toLowerCase().indexOf(v) >= 0) || (d.jpname.toLowerCase().indexOf(v) >= 0);
         });
         addSongAndSettingFilterBySongSetting(SEL_ID_SONG_DIFF, (opt, v, d) => ((d.difficulty + '') == v));
         addSongAndSettingFilterBySongSetting(SEL_ID_SONG_AC, (opt, v, d) => ((d.isac + '') == v));
         addSongAndSettingFilterBySongSetting(SEL_ID_SONG_SWING, (opt, v, d) => ((d.isswing + '') == v));
         addSongAndSettingFilterBySongSetting(SEL_ID_SONG_STAR_DIFF, (opt, v, d) => ((d.stardifficulty + '') == v));

         /** @type {(name: string, newValue: string) => void} */
         me.onValueChange = function (name, newValue) {
            if (name == SEL_ID_DIFF_CHOICE) {
               if (options.includeMapInfo) me.updateMapInfo(me.getSelectedSongSetting());
               if (me.onSongSettingChange) me.onSongSettingChange(newValue, me.getSelectedSongSetting());
            } else if (name == SEL_ID_MAP_ATT) {
               var songAttribute = /** @type {LLH.Core.AttributeType} */ (newValue);
               if (me.friendCSkill) me.friendCSkill.setMapColor(songAttribute);
               if (me.onSongColorChange) me.onSongColorChange(songAttribute);
            }
         };

         updateSubElements(container, [
            createFormInlineGroup('搜索', textSongSearch),
            createFormInlineGroup('筛选', [selSongDiff, selSongAtt, selSongUnit, selSongSwing, selSongAc, selSongStarDiff]),
            createFormInlineGroup('歌曲', selSongChoice),
            createFormInlineGroup('谱面', selDiffChoice)
         ], true);

         if (options.includeMapInfo) {
            initMapInfo(me, container);
         }

         me.setSongData(options.songs, options.excludeDefaultSong);
      }
      /**
       * @param {LLH.API.SongDictDataType} songs 
       * @param {boolean} [excludeDefaultSong] 
       */
      setSongData(songs, excludeDefaultSong) {
         /** @type {LLH.Selector.LLSongSelectorComponent} */
         var me = this;
         var i, j;
   
         if (!excludeDefaultSong) {
            var songGroups = LLConst.Song.getSongGroupIds();
            var songDefaultSets = LLConst.Song.getDefaultSongSetIds();
            for (i = 0; i < songGroups.length; i++) {
               for (j = 0; j < songDefaultSets.length; j++) {
                  var defaultSong = LLConst.Song.getDefaultSong(songGroups[i], songDefaultSets[j]);
                  songs[defaultSong.id] = defaultSong;
               }
            }
         }
   
         /** @type {LLH.Internal.ProcessedSongSettingDictDataType} */
         var songSettings = {};
         for (i in songs) {
            if (!songs[i].settings) continue;
            for (j in songs[i].settings) {
               songSettings[j] = /** @type {LLH.Internal.ProcessedSongSettingDataType} */ (songs[i].settings[j]);
               songSettings[j].song = i;
            }
         }
   
         me.songs = songs;
         me.songSettings = songSettings;
   
         me.setFreezed(true);
   
         // build song setting options for both language
         var songSettingAvailableStarDiff = new Array(20);
         var songSettingOptionsCN = [{'value': '', 'text': '谱面', 'color': 'black'}];
         var songSettingOptionsJP = [{'value': '', 'text': '谱面', 'color': 'black'}];
         var songSettingKeys = Object.keys(songSettings).sort(function (a,b){
            var ia = parseInt(a), ib =  parseInt(b);
            if (ia < 0 && ib < 0) return ib - ia;
            return ia - ib;
         });
         for (i = 0; i < songSettingKeys.length; i++) {
            var liveId = songSettingKeys[i];
            var curSongSetting = songSettings[liveId];
            var curSong = songs[curSongSetting.song];
            var fullname = String(liveId);
            if (parseInt(liveId) > 0) {
               while (fullname.length < 3) fullname = '0' + fullname;
            }
            fullname += ' ★ ' + curSongSetting.stardifficulty + ' [';
            var cnName = fullname + LLConst.Song.getSongDifficultyName(curSongSetting.difficulty, LLConstValue.LANGUAGE_CN) + (curSongSetting.isac ? ' 街机' : '') + (curSongSetting.isswing ? ' 滑键' : '') + '][' + curSongSetting.combo + ' 连击] ' + curSong.name;
            var jpName = fullname + LLConst.Song.getSongDifficultyName(curSongSetting.difficulty, LLConstValue.LANGUAGE_JP) + (curSongSetting.isac ? ' Arcade' : '') + (curSongSetting.isswing ? ' Swing' : '') + '][' + curSongSetting.combo + ' COMBO] ' + curSong.jpname;
            var color = LLConst.Common.getAttributeColor(curSong.attribute);
            songSettingOptionsCN.push({'value': liveId, 'text': cnName, 'color': color});
            songSettingOptionsJP.push({'value': liveId, 'text': jpName, 'color': color});
   
            songSettingAvailableStarDiff[curSongSetting.stardifficulty] = 1;
         }
         me.setFilterOptionGroups(SEL_ID_DIFF_CHOICE, {'0': songSettingOptionsCN, '1': songSettingOptionsJP});
   
         // build song options for both language
         var songOptionsCN = [{'value': '', 'text': '歌曲', 'color': 'black'}];
         var songOptionsJP = [{'value': '', 'text': '歌曲', 'color': 'black'}];
         var songKeys = Object.keys(songs).sort(function (a,b){
            var ia = parseInt(a), ib =  parseInt(b);
            if (ia < 0 && ib < 0) return ib - ia;
            return ia - ib;
         });
         for (i = 0; i < songKeys.length; i++) {
            var songId = songKeys[i];
            var curSong = songs[songId];
            var color = LLConst.Common.getAttributeColor(curSong.attribute);
            songOptionsCN.push({'value': songId, 'text': curSong.name, 'color': color});
            songOptionsJP.push({'value': songId, 'text': curSong.jpname, 'color': color});
         }
         me.setFilterOptionGroups(SEL_ID_SONG_CHOICE, {'0': songOptionsCN, '1': songOptionsJP});
   
         // set other options
         me.setFilterOptions(SEL_ID_SONG_DIFF, [
            {'value': '',  'text': '难度'},
            {'value': '1', 'text': '简单（Easy）'},
            {'value': '2', 'text': '普通（Normal）'},
            {'value': '3', 'text': '困难（Hard）'},
            {'value': '4', 'text': '专家（Expert）'},
            {'value': '5', 'text': '随机（Random）'},
            {'value': '6', 'text': '大师（Master）'}
         ]);
         me.setFilterOptions(SEL_ID_SONG_ATT, [
            {'value': '',      'text': '属性',  'color': 'black'},
            {'value': 'smile', 'text': 'Smile', 'color': 'red'},
            {'value': 'pure',  'text': 'Pure',  'color': 'green'},
            {'value': 'cool',  'text': 'Cool',  'color': 'blue'}
         ]);
         me.setFilterOptions(SEL_ID_SONG_UNIT, [
            {'value': '',  'text': '组合'},
            {'value': '1', 'text': "μ's"},
            {'value': '2', 'text': 'Aqours'},
            {'value': '3', 'text': '虹咲'},
            {'value': '4', 'text': 'Liella!'}
         ]);
         me.setFilterOptions(SEL_ID_SONG_SWING, [
            {'value': '',  'text': '是否滑键谱面'},
            {'value': '0', 'text': '非滑键'},
            {'value': '1', 'text': '滑键'},
         ]);
         me.setFilterOptions(SEL_ID_SONG_AC, [
            {'value': '',  'text': '是否街机谱面'},
            {'value': '0', 'text': '非街机'},
            {'value': '1', 'text': '街机'},
         ]);
         var songStarDifficultyOptions = [{'value': '', 'text': '星级'}];
         for (i = 0; i < songSettingAvailableStarDiff.length; i++) {
            if (songSettingAvailableStarDiff[i]) {
               songStarDifficultyOptions.push({'value': String(i), 'text': '★ ' + i});
            }
         }
         me.setFilterOptions(SEL_ID_SONG_STAR_DIFF, songStarDifficultyOptions);
         if (me.includeMapInfo) {
            me.setFilterOptions(SEL_ID_MAP_ATT, [
               {'value': 'smile', 'text': 'Smile', 'color': 'red'},
               {'value': 'pure',  'text': 'Pure',  'color': 'green'},
               {'value': 'cool',  'text': 'Cool',  'color': 'blue'}
            ]);
         }
   
         // at last, unfreeze the filter
         me.setFreezed(false);
         me.handleFilters();
      }
      /** @param {LLH.Core.LanguageType} language */
      setLanguage(language) {
         this._languageComponent.set(language);
      }
      /** @returns {LLH.Core.SongIdType} */
      getSelectedSongId() {
         var curSongId = this._songChoiceComponent.get();
         if (curSongId) return curSongId;
         var curSongSettingId = this._diffChoiceComponent.get();
         if (curSongSettingId && this.songSettings[curSongSettingId]) {
            return this.songSettings[curSongSettingId].song || '';
         }
         return '';
      }
      getSelectedSong() {
         return this.songs[this.getSelectedSongId()];
      }
      /** @returns {LLH.Core.SongSettingIdType} */
      getSelectedSongSettingId() {
         return this._diffChoiceComponent.getOrElse('');
      }
      getSelectedSongSetting() {
         return this.songSettings[this.getSelectedSongSettingId()];
      }
      /** @returns {LLH.Core.AttributeAllType} */
      getSongAttribute() {
         /** @type {LLH.Component.LLSelectComponent=} */
         var mapAttrComponent = this.getValuedComponent(SEL_ID_MAP_ATT);
         if (!mapAttrComponent) {
            var curSong = this.getSelectedSong();
            if (curSong) return curSong.attribute;
            return 'all';
         } else {
            return /** @type {LLH.Core.AttributeAllType} */ (mapAttrComponent.getOrElse('all'));
         }
      }
      /** @param {LLH.Internal.ProcessedSongSettingDataType} songSetting */
      updateMapInfo(songSetting) {
         console.error('Unexpected call to updateMapInfo on LLSongSelectorCompoent excluding map info');
      }
      /**
       * @param {LLH.Core.PositionWeightType} customWeight
       * @returns {LLH.Model.LLMap}
       */
      getMap(customWeight) {
         console.error('Unexpected call to getMap on LLSongSelectorCompoent excluding map info');
         return new LLMap();
      }
   }
   return LLSongSelectorComponent_cls;
})();

var LLSaveLoadJsonMixin = (function () {
   var loadJson = function(data) {
      if (typeof(data) != 'string') return;
      if (data == '') return;
      try {
         var json = JSON.parse(data);
         this.loadData(json);
      } catch (e) {
         console.error('Failed to load json:');
         console.error(e);
         console.error(data);
      }
   };
   var saveJson = function() {
      return JSON.stringify(this.saveData());
   }
   /** @param {LLH.Mixin.SaveLoadJson} obj */
   return function(obj) {
      obj.loadJson = loadJson;
      obj.saveJson = saveJson;
   };
})();

var LLSaveLoadJsonHelper = {
   /**
    * @param {(any) => void} loader
    * @param {string} [jsonString] 
    */
   commonLoadJson: function (loader, jsonString) {
      if (!jsonString) return true;
      if (jsonString == 'undefined') return true;
      try {
         var json = JSON.parse(jsonString);
         loader(json);
         return true;
      } catch (e) {
         console.error('Failed to load json:');
         console.error(e);
         console.error(jsonString);
         return false;
      }
   },
   commonSaveJson: function (data) {
      return JSON.stringify(data);
   }
}

/*
 * strength calculation helper
 *   LLMap
 *   LLSisGem
 *   LLSkill
 *   LLMember
 *   LLSimulateContext
 *   LLTeam
 */
var LLMap = (function () {
   var DEFAULT_SONG_MUSE = LLConst.Song.getDefaultSong(LLConstValue.SONG_GROUP_MUSE, LLConstValue.SONG_DEFAULT_SET_1);
   var DEFAULT_SONG_SETTING = LLConst.Song.getDefaultSongSetting(LLConstValue.SONG_GROUP_MUSE, LLConstValue.SONG_DEFAULT_SET_1);
   var zeroWeights = [0, 0, 0, 0, 0, 0, 0, 0, 0];

   /**
    * @implements {LLH.Mixin.SaveLoadJson}
    */
   class LLMap_cls {
      /**
       * @param {LLH.Model.LLMap_Options} [options] 
       */
      constructor(options) {
         /** @type {LLH.Model.LLMap_SaveData} */
         this.data = {
            'attribute': 'all',
            'weights': zeroWeights,
            'totalWeight': 0,
            'friendCSkill': {
               'attribute': 'smile',
               'Cskillattribute': 'smile',
               'Cskillpercentage': 0
            },
            'combo': 0,
            'star': 0,
            'time': 110,
            'perfect': 0,
            'starPerfect': 0,
            'tapup': 0,
            'skillup': 0
         };
         if (!options) options = {};
         if (options.song && options.songSetting) {
            this.setSong(options.song, options.songSetting);
         } else {
            this.setSong(DEFAULT_SONG_MUSE, DEFAULT_SONG_SETTING);
         }
         if (options.friendCSkill) {
            this.data.friendCSkill = options.friendCSkill;
         }
      }
      /** @param {LLH.Core.AttributeAllType} attribute */
      setAttribute(attribute) {
         this.data.attribute = attribute;
      }
      /**
       * @param {LLH.API.SongDataType} song 
       * @param {LLH.API.SongSettingDataType} songSetting 
       */
      setSong(song, songSetting) {
         if ((!song) || (!songSetting)) {
            console.error('No song data');
            return;
         }
         this.data.attribute = song.attribute;
         this.data.songUnit = LLConst.Song.getGroupForSongGroup(song.group);
         // when difficulty is not given, use 0 for difficulty-specific data
         this.setSongDifficultyData(songSetting.combo, parseInt(songSetting.star), parseFloat(songSetting.time));
         this.setWeights(songSetting.positionweight);
      }
      /** @param {LLH.Core.PositionWeightType} weights */
      setWeights(weights) {
         var w = [];
         var total = 0;
         if (weights && weights.length == 9) {
            for (var i = 0; i < 9; i++) {
               var curWeight = weights[i];
               if (typeof(curWeight) == 'string') {
                  curWeight = parseFloat(curWeight);
               }
               w.push(curWeight);
               total += curWeight;
            }
         } else {
            if (weights !== undefined) {
               console.error('Invalid weight data:');
               console.log(weights);
            }
            w = zeroWeights;
         }
         this.data.weights = w;
         this.data.totalWeight = total;
      }
      /**
       * @param {number} combo 
       * @param {number} star 
       * @param {number} time 
       * @param {number} [perfect] 
       * @param {number} [starPerfect] 
       */
      setSongDifficultyData(combo, star, time, perfect, starPerfect) {
         this.data.combo = (combo || 0);
         this.data.star = (star || 0);
         this.data.time = (time || 0);
         // 95% perfect
         this.data.perfect = (perfect === undefined ? Math.floor(this.data.combo * 19 / 20) : perfect);
         this.data.starPerfect = (starPerfect || 0);
      }
      /**
       * @param {number} tapup 
       * @param {number} skillup 
       */
      setMapBuff(tapup, skillup) {
         this.data.tapup = (tapup || 0);
         this.data.skillup = (skillup || 0);
      }
      /**
       * @param {number} skillRateDown 
       * @param {number} hpDownValue 
       * @param {number} hpDownInterval 
       */
      setLADebuff(skillRateDown, hpDownValue, hpDownInterval) {
         this.data.debuff_skill_rate_down = (skillRateDown || 0);
         this.data.debuff_hp_down_value = (hpDownValue || 0);
         this.data.debuff_hp_down_interval = (hpDownInterval || 0);
      }
      /** @param {LLH.Layout.ScoreDistParam.ScoreDistParamSaveData} distParam */
      setDistParam(distParam) {
         this.data.perfect = Math.floor((distParam.perfect_percent || 0)/100 * this.data.combo);
         this.data.speed = distParam.speed;
         this.data.combo_fever_pattern = distParam.combo_fever_pattern;
         this.data.combo_fever_limit = distParam.combo_fever_limit;
         this.data.over_heal_pattern = distParam.over_heal_pattern;
         this.data.perfect_accuracy_pattern = distParam.perfect_accuracy_pattern;
         this.data.trigger_limit_pattern = distParam.trigger_limit_pattern;
         if (distParam.type == 'sim' || distParam.type == 'simla') {
            this.data.simMode = distParam.type;
         }
      }
      saveData() {
         return this.data;
      }
      /** @param {LLH.Model.LLMap_SaveData} data */
      loadData(data) {
         this.data = data;
      }
      saveJson() {
         return LLSaveLoadJsonHelper.commonSaveJson(this.saveData());
      }
      /** @param {string} jsonData */
      loadJson(jsonData) {
         var me = this;
         LLSaveLoadJsonHelper.commonLoadJson(x => me.loadData(x), jsonData);
      }
   }

   return LLMap_cls;
})();

var LLSisGem = (function () {
   class LLSisGem_cls {
      /**
       * @param {number} type
       * @param {LLH.Model.LLSisGem_Options} options
       */
      constructor(type, options) {
         var meta = LLConst.Gem.getNormalGemMeta(type);
         if (!meta) throw 'Unknown type: ' + type;
         this.type = type;
         this.meta = meta;
   
         options = options || {};
         if (meta.per_grade && options.grade) this.grade = options.grade;
         if (meta.per_member && options.member) {
            this.member = options.member;
            var memberColor = LLConst.Member.getMemberColor(options.member);
            if (memberColor == 'all') memberColor = undefined;
            this.color = memberColor;
         }
         if (meta.per_color && options.color) this.color = options.color;
         if (meta.per_unit && options.unit) this.unit = options.unit;
      }
      /**
       * @param {LLH.Internal.NormalGemCategoryIdType} type 
       * @returns {number}
       */
      static getGemSlot(type) {
         var normalGemMeta = LLConst.Gem.getNormalGemMeta(type);
         if (normalGemMeta) {
            return normalGemMeta.slot;
         } else {
            return 999;
         }
      }
      /**
       * @param {LLH.Internal.GemStockSaveDataType} gemStock 
       * @param {string[]} gemStockKeys 
       * @returns {number}
       */
      static getGemStockCount(gemStock, gemStockKeys) {
         /** @type {LLH.Internal.GemStockSaveDataType | number} */
         var cur = gemStock;
         var keys = gemStockKeys;
         for (var i = 0; i < keys.length; i++) {
            if (typeof(cur) == 'number') {
               console.error("Unexpected gem stock keys " + keys.join('.'), gemStock);
               return 0;
            }
            if (cur.ALL !== undefined) return cur.ALL;
            cur = cur[keys[i]];
            if (cur === undefined) {
               console.log("Not found " + keys.join('.') + " in gem stock");
               return 0;
            }
         }
         if (typeof(cur) == 'number') {
            return cur;
         } else {
            console.error("Unexpected gem stock keys " + keys.join('.'), gemStock);
            return 0;
         }
      }
      isEffectRangeSelf() { return this.meta.effect_range == LLConstValue.SIS_RANGE_SELF; }
      isEffectRangeAll() { return this.meta.effect_range == LLConstValue.SIS_RANGE_TEAM; }
      isSkillGem() { return !!(this.meta.skill_mul || this.meta.heal_mul); }
      isAccuracyGem() { return !!this.meta.ease_attr_mul; }
      isValid() {
         if (this.meta.per_grade && !this.grade) return false;
         if (this.meta.per_member) {
            if (!this.member) return false;
            if (!LLConst.Gem.isMemberGemExist(this.member)) return false;
         }
         if (this.meta.per_unit && !this.unit) return false;
         if (this.meta.per_color && !this.color) return false;
         return true;
      }
      isAttrMultiple() { return !!this.meta.attr_mul; }
      isAttrAdd() { return !!this.meta.attr_add; }
      isHealToScore() { return !!this.meta.heal_mul; }
      isScoreMultiple() { return !!this.meta.skill_mul; }
      isNonet() { return !!this.meta.per_unit; }
      isMemberGem() { return !!this.meta.per_member; }
      getEffectValue() { return this.meta.effect_value; }
      getNormalGemType() { return this.type; }
      getGemStockKeys() {
         if (this.gemStockKeys !== undefined) return this.gemStockKeys;
         var ret = [this.meta.key];
         if (this.meta.per_grade) {
            if (this.grade === undefined) throw "Gem has no grade";
            ret.push(this.grade + '');
         }
         if (this.meta.per_member) {
            if (this.member === undefined) throw "Gem has no member";
            ret.push(this.member + '');
         }
         if (this.meta.per_unit) {
            if (this.unit === undefined) throw "Gem has no unit";
            ret.push(this.unit + '');
         }
         if (this.meta.per_color) {
            if (this.color === undefined) throw "Gem has no color";
            ret.push(this.color);
         }
         this.gemStockKeys = ret;
         return ret;
      }
      /** @param {LLH.Internal.GemStockSaveDataType} gemStock */
      getGemStockCount(gemStock) {
         return LLSisGem_cls.getGemStockCount(gemStock, this.getGemStockKeys());
      }
      getAttributeType() { return this.color; }
      /** @param {LLH.Core.AttributeType} newColor */
      setAttributeType(newColor) {
         this.color = newColor;
      }
   }

   return LLSisGem_cls;
})();

var LLCommonSisGem = (function () {
   class LLCommonSisGem_cls {
      /**
       * @param {LLH.API.SisDataType} gemData 
       */
      constructor(gemData) {
         this.gemData = gemData;
      }
   }
   return LLCommonSisGem_cls;
})();

var LLSkill = (function () {
   const eTriggerType = {
      'TIME': LLConstValue.SKILL_TRIGGER_TIME,
      'NOTE': LLConstValue.SKILL_TRIGGER_NOTE,
      'COMBO': LLConstValue.SKILL_TRIGGER_COMBO,
      'SCORE': LLConstValue.SKILL_TRIGGER_SCORE,
      'PERFECT': LLConstValue.SKILL_TRIGGER_PERFECT,
      'STAR_PERFECT': LLConstValue.SKILL_TRIGGER_STAR_PERFECT,
      'MEMBERS': LLConstValue.SKILL_TRIGGER_MEMBERS
   };
   /**
    * @param {number} n 
    * @param {number} p 
    */
   var calcBiDist = function (n, p) {
      // time: O(n^2), space: O(n)
      if (n < 0) throw 'LLSkill::calcBiDist: n cannot be negitive, n=' + n + ', p=' + p;
      /** @type {number[][]} */
      var dist = [new Array(n+1), new Array(n+1)];
      var pCur = 0, pNext = 1;
      var q = 1-p; // p: possibility for +1, q: possibility for no change
      dist[pCur][0] = 1;
      for (var i = 1; i <= n; i++) {
         dist[pNext][0] = dist[pCur][0] * q;
         dist[pNext][i] = dist[pCur][i-1] * p;
         for (var j = 1; j < i; j++) {
            dist[pNext][j] = dist[pCur][j-1] * p + dist[pCur][j] * q;
         }
         pCur = pNext;
         pNext = 1-pNext;
      }
      return dist[pCur];
   };
   class LLSkill_cls {
      /**
       * @param {LLH.API.CardDataType} card 
       * @param {number} level base 0
       * @param {LLH.Model.LLSkill_Buff} [buff] 
       */
      constructor(card, level, buff) {
         this.card = card;
         this.level = level;
         var skilldetails = card.skilldetail || [];
         var skilldetail = skilldetails[level]  || {};
         this.hasSkill = (card.skilldetail && skilldetail.possibility);
         this.require = skilldetail.require || 1;
         this.possibility = skilldetail.possibility || 0;
         this.score = skilldetail.score || 0;
         this.time = skilldetail.time || 0;
   
         this.triggerType = card.triggertype;
         this.effectType = card.skilleffect;
         this.triggerTarget = card.triggertarget;
         this.effectTarget = card.effecttarget;
   
         this.skillChance = 0;
         this.averageScore = 0;
         this.maxScore = 0;
         this.averageHeal = 0;
         this.maxHeal = 0;
         this.simpleCoverage = 0;
         this.skillDist = undefined;
         this.strength = 0;

         this.actualScore = 0;
         this.actualPossibility = this.possibility;
   
         buff = buff || {};
         this.setScoreGem(buff.gemskill);
         this.setSkillPossibilityUp(buff.skillup);
      }
      /** @param {boolean} [has] */
      setScoreGem(has) {
         if (has) {
            if (this.effectType == LLConstValue.SKILL_EFFECT_HEAL) {
               // 日服4.1版本前是270, 4.1版本后是480; 国服没有270
               this.actualScore = this.score * 480;
            } else if (this.effectType == LLConstValue.SKILL_EFFECT_SCORE) {
               this.actualScore = Math.ceil(this.score * 2.5);
            }
         } else {
            if (this.effectType == LLConstValue.SKILL_EFFECT_SCORE) {
               this.actualScore = this.score;
            }
         }
      }
      /** @param {number} [rate] */
      setSkillPossibilityUp(rate) {
         this.actualPossibility = this.possibility * (1+(rate || 0)/100);
      }
      reset() {
         this.skillChance = 0;
         this.averageScore = 0;
         this.maxScore = 0;
         this.averageHeal = 0;
         this.maxHeal = 0;
         this.simpleCoverage = 0;
         this.skillDist = undefined;
      }
      isScoreTrigger() { return this.triggerType == eTriggerType.SCORE; }
      // 技能发动最大判定次数
      // 如果比上次计算的次数更多, 返回true, 否则返回false
      // env: {time, combo, score, perfect, starperfect}
      calcSkillChance(env) {
         if (!this.hasSkill) return false;
         var chance = 0;
         var total = 0;
         if (this.triggerType == eTriggerType.TIME) {
            total = env.time;
         } else if (this.triggerType == eTriggerType.NOTE || this.triggerType == eTriggerType.COMBO) {
            total = env.combo;
         } else if (this.triggerType == eTriggerType.SCORE) {
            total = env.score;
         } else if (this.triggerType == eTriggerType.PERFECT) {
            // TODO: combo*perfect_rate?
            total = env.perfect;
         } else if (this.triggerType == eTriggerType.STAR_PERFECT) {
            // TODO: star*perfect_rate?
            total = env.starperfect;
         } else if (this.triggerType == eTriggerType.MEMBERS) {
            // TODO: how to calculate it?
            total = 0;
         }
         chance = Math.floor(total/this.require);
         if (chance > this.skillChance) {
            this.skillChance = chance;
            this.skillDist = undefined; // reset distribution
            return true;
         } else {
            return false;
         }
      }
      calcSkillEffect(env) {
         if (!this.hasSkill) return false;
         this.maxScore = this.skillChance * this.actualScore;
         if (this.effectType == LLConstValue.SKILL_EFFECT_HEAL) {
            this.maxHeal = this.skillChance * this.score;
         } else {
            this.maxHeal = 0;
         }
         this.averageScore = this.maxScore * this.actualPossibility/100;
         this.averageHeal = this.maxHeal * this.actualPossibility/100;
         // 对于buff型技能, 计算简易覆盖率
         if (this.time > 0) {
            // 令: 判定次数*每次发动需要秒数+判定次数*发动率*发动秒数 <= 总时间
            // 则: 判定次数<=总时间/(每次发动需要秒数+发动率*发动秒数)
            // 简易覆盖率: 发动率*发动秒数/(每次发动需要秒数+发动率*发动秒数)
            // 实际覆盖率受多种因素影响(临近结尾发动的判定, note分布不均匀等), 到llcoverge页面计算实际覆盖率
            // 非时间系的转换成平均多少秒能满足发动条件
            var timeRequire = env.time/this.skillChance;
            var p = this.actualPossibility/100;
            this.simpleCoverage = p*this.time/(timeRequire+p*this.time);
         } else {
            this.simpleCoverage = 0;
         }
      }
      /** @param {number} scorePerStrength */
      calcSkillStrength(scorePerStrength) {
         if (!this.maxScore) {
            this.strength = 0;
         } else {
            this.strength = Math.round(this.maxScore * this.possibility/100 /scorePerStrength);
         }
      }
      calcSkillDist() {
         if (this.skillChance === undefined) {
            console.error("No skill chance");
            return [1];
         }
         if (!this.skillChance) return [1]; // no chance or not supported, return 100% not active
         if (this.skillDist) return this.skillDist;
         this.skillDist = calcBiDist(this.skillChance, this.actualPossibility/100);
         return this.skillDist;
      }
      isEffectHeal() { return this.effectType == LLConstValue.SKILL_EFFECT_HEAL; }
      isEffectScore() { return this.effectType == LLConstValue.SKILL_EFFECT_SCORE; }
   }

   return LLSkill_cls;
})();

var LLMember = (function() {
   var int_attr = ["cardid", "smile", "pure", "cool", "skilllevel", "maxcost", "hp"];
   var MIC_RATIO = [0, 5, 11, 24, 40, 0]; //'UR': 40, 'SSR': 24, 'SR': 11, 'R': 5, 'N': 0
   class LLMember_cls {
      /**
       * @param {LLH.Model.LLMember_Options} v 
       * @param {LLH.Core.AttributeType} mapAttribute
       */
      constructor(v, mapAttribute) {
         var i;
         this.cardid = v.cardid || 0;
         this.smile = v.smile || 0;
         this.pure = v.pure || 0;
         this.cool = v.cool || 0;
         this.skilllevel = v.skilllevel || 0;
         this.maxcost = v.maxcost || 0;
         this.hp = v.hp || 0;
         for (i = 0; i < int_attr.length; i++) {
            var attr = int_attr[i];
            if (v[attr] === undefined) {
               console.error('missing attribute ' + attr);
            }
         }
         if (v.card === undefined) {
            console.error('missing card detail');
         } else {
            this.card = v.card;
         }
         /** @type {LLH.Model.LLSisGem[]} */
         this.gems = [];
         if (!v.enableLAGem) {
            if (v.gemlist === undefined) {
               console.error('missing gem info');
            } else if (v.card) {
               for (i = 0; i < v.gemlist.length; i++) {
                  var gemMetaId = LLConst.GemType[v.gemlist[i]];
                  var memberId = v.card.typeid;
                  var sisOptions = {
                     'grade': LLConst.Member.getMemberGrade(memberId),
                     'member': memberId,
                     'unit': LLConst.Member.getBigGroupId(memberId)
                  };
                  if (LLConst.Gem.isGemFollowMemberAttribute(gemMetaId)) {
                     sisOptions.color = v.card.attribute;
                  } else {
                     sisOptions.color = mapAttribute;
                  }
                  this.gems.push(new LLSisGem(gemMetaId, sisOptions));
               }
            }
         }
         /** @type {LLH.Model.LLCommonSisGem[]} */
         this.laGems = [];
         if (v.enableLAGem && v.laGemList && v.laGemList.length > 0) {
            if (v.gemDataDict) {
               for (i = 0; i < v.laGemList.length; i++) {
                  var gemId = v.laGemList[i];
                  var sisBrief = v.gemDataDict[gemId];
                  if (!sisBrief) {
                     console.error('Missing sis gem data for id = ' + gemId);
                  } else {
                     this.laGems.push(new LLCommonSisGem(sisBrief));
                  }
               }
            } else {
               console.error('No sis gem data, skipping initialize laGems');
            }
         }
         if (v.accessory && v.accessoryData) {
            if (v.accessory.level !== undefined && LLConst.Accessory.canEquipAccessory(v.accessoryData, v.accessory.level, v.cardid)) {
               this.accessory = v.accessoryData;
               this.accessoryLevel = v.accessory.level;
               this.accessoryAttr = LLConst.Accessory.getAccessoryLevelAttribute(this.accessory, this.accessoryLevel);
            } else {
               console.info('Accessory ' + v.accessoryData.id + ' cannot be equipped to ' + v.cardid);
            }
         }
         this.raw = v;
      }
      hasSkillGem() {
         for (var i = 0; i < this.gems.length; i++) {
            if (this.gems[i].isSkillGem()) return true;
         }
         return false;
      }
      getAccuracyGemFactor() {
         var factor = 1;
         for (var i = 0; i < this.gems.length; i++) {
            if (this.gems[i].isAccuracyGem()) {
               factor = factor * (1+this.gems[i].getEffectValue()/100);
            }
         }
         return factor;
      }
      empty() {
         return (!this.cardid) || (this.cardid == '0');
      }
      calcDisplayAttr() {
         //显示属性=(基本属性+绊+饰品属性)*单体百分比宝石加成+数值宝石加成
         var withAccessory = LLConst.Attributes.copyAttributes(this);
         if (this.accessory && this.accessoryAttr) {
            LLConst.Attributes.addToAttributes(withAccessory, this.accessoryAttr);
         }
         var ret = LLConst.Attributes.copyAttributes(withAccessory);
         for (var i = 0; i < this.gems.length; i++) {
            var gem = this.gems[i];
            var gemAttribute = gem.getAttributeType();
            if (gemAttribute) {
               if (gem.isAttrAdd()) {
                  ret[gemAttribute] += gem.getEffectValue();
               }
               if (gem.isAttrMultiple() && gem.isEffectRangeSelf()) {
                  ret[gemAttribute] += Math.ceil(gem.getEffectValue()/100 * withAccessory[gemAttribute]);
               }
            }
         }
         this.displayAttr = ret;
         return ret;
      }
      /**
       * @param {LLH.Core.AttributeAllType} mapcolor 
       * @param {LLH.Model.LLSisGem[][]} teamgem 
       * @returns {number}
       */
      calcAttrWithGem(mapcolor, teamgem) {
         if (!this.displayAttr) throw "Need calcDisplayAttr first";
         if (!(teamgem && teamgem.length == 9)) throw "Expect teamgem length 9";
         //全体宝石累计加成(下标i表示0..i-1位队员所带的全体宝石给该队员带来的总加成, [0]=0)
         //注意全体宝石是在(基本属性值+绊)基础上计算的, 不是在显示属性上计算的, 并且不包括饰品属性
         var cumulativeTeamGemBonus = [0];
         var sum = 0;
         for (var i = 0; i < 9; i++) {
            for (var j = 0; j < teamgem[i].length; j++) {
               sum += Math.ceil(teamgem[i][j].getEffectValue()/100 * this[mapcolor]);
            }
            cumulativeTeamGemBonus.push(sum);
         }
         this.cumulativeTeamGemBonus = cumulativeTeamGemBonus;
         this.attrWithGem = this.displayAttr[mapcolor] + sum;
         return this.attrWithGem;
      }
      /**
       * @param {LLH.Core.AttributeAllType} mapcolor 
       * @param {LLH.Internal.CSkillDataType[]} cskills 
       */
      calcAttrWithCSkill(mapcolor, cskills) {
         if (!this.displayAttr) throw "Need calcDisplayAttr first";
         if (!(this.attrWithGem && this.cumulativeTeamGemBonus)) throw "Need calcAttrWithGem first";
         //主唱技能加成(下标i表示只考虑前i-1个队员的全体宝石时, 主唱技能的加成值, 下标0表示不考虑全体宝石)
         var cumulativeCSkillBonus = [];
         //属性强度(下标i表示只考虑前i-1个队员的全体宝石时的属性强度)
         var cumulativeAttrStrength = [];
         var baseAttr = LLConst.Attributes.copyAttributes(this.displayAttr);
         for (var i = 0; i <= 9; i++) {
            baseAttr[mapcolor] = this.displayAttr[mapcolor] + this.cumulativeTeamGemBonus[i];
            var bonusAttr = LLConst.Attributes.makeAttributes0();
            for (var j = 0; j < cskills.length; j++) {
               var cskill = cskills[j];
               //主c技能
               if (cskill.Cskillpercentage) {
                  bonusAttr[cskill.attribute] += Math.ceil(baseAttr[cskill.Cskillattribute]*cskill.Cskillpercentage/100);
               }
               //副c技能
               if (cskill.Csecondskillattribute && cskill.Csecondskilllimit && this.card) {
                  if (LLConst.Member.isMemberInGroup(this.card.jpname, cskill.Csecondskilllimit)) {
                     bonusAttr[cskill.attribute] += Math.ceil(baseAttr[cskill.attribute]*cskill.Csecondskillattribute/100);
                  }
               }
            }
            cumulativeCSkillBonus.push(bonusAttr[mapcolor]);
            cumulativeAttrStrength.push(baseAttr[mapcolor] + bonusAttr[mapcolor]);
            if (i == 9) {
               this.bonusAttr = bonusAttr;
               this.finalAttr = LLConst.Attributes.addAttributes(baseAttr, bonusAttr);
               this.attrStrength = this.finalAttr[mapcolor];
               this.attrStrengthWithAccuracy = Math.ceil(this.attrStrength * this.getAccuracyGemFactor());
            }
         }
         this.cumulativeCSkillBonus = cumulativeCSkillBonus;
         this.cumulativeAttrStrength = cumulativeAttrStrength;
      }
      /**
       * @param {LLH.Core.AttributeAllType} mapcolor 
       * @param {LLH.Core.BigGroupIdType} [mapunit] 
       */
      getAttrBuffFactor(mapcolor, mapunit) {
         var buff = 1;
         if (!this.card) { return buff; }
         if (this.card.attribute == mapcolor) buff *= 1.1;
         if (mapunit && LLConst.Member.isMemberInGroup(this.card.jpname, mapunit)) buff *= 1.1;
         return buff;
      }
      /**
       * @param {LLH.Core.AttributeAllType} mapcolor 
       * @param {LLH.Core.BigGroupIdType | undefined} mapunit 
       * @param {number} weight 
       * @param {number} totalweight 
       */
      getAttrDebuffFactor(mapcolor, mapunit, weight, totalweight) {
         var debuff = 1;
         if (!this.card) { return debuff; }
         if (this.card.attribute != mapcolor) debuff *= 1.1;
         if (mapunit && !LLConst.Member.isMemberInGroup(this.card.jpname, mapunit)) debuff *= 1.1;
         debuff = 1-1/debuff;
         debuff = (weight/totalweight)*debuff;
         return debuff;
      }
      /**
       * @param {LLH.Model.LLMap_SaveData} mapdata 
       * @param {number} pos 
       * @param {number} teamattr 
       */
      calcAttrDebuff(mapdata, pos, teamattr) {
         var attrDebuff = Math.round(this.getAttrDebuffFactor(mapdata.attribute, mapdata.songUnit, mapdata.weights[pos], mapdata.totalWeight) * teamattr);
         this.attrDebuff = attrDebuff;
         return attrDebuff;
      }
      getMicPoint() {
         if (!this.card) throw "No card data";
         var skill_level_up_pattern = this.card.skillleveluppattern || 0;
         if (MIC_RATIO[skill_level_up_pattern] === undefined) {
            console.error("Unknown skill level up pattern: " + skill_level_up_pattern);
            return 0;
         }
         return MIC_RATIO[skill_level_up_pattern] * this.skilllevel;
      }
      /**
       * @param {LLH.Core.AttributeAllType} mapcolor 
       * @param {LLH.Internal.CSkillDataType[]} cskills 
       */
      calcTotalCSkillPercentageForSameColor(mapcolor, cskills) {
         var sumPercentage = 0;
         for (var i = 0; i < cskills.length; i++) {
            var cskill = cskills[i];
            if (cskill.Cskillpercentage && cskill.attribute == mapcolor && cskill.Cskillattribute == mapcolor) {
               sumPercentage += cskill.Cskillpercentage;
            }
            if (cskill.Csecondskillattribute && cskill.attribute == mapcolor && this.card && cskill.Csecondskilllimit) {
               if (LLConst.Member.isMemberInGroup(this.card.jpname, cskill.Csecondskilllimit)) {
                  sumPercentage += cskill.Csecondskillattribute;
               }
            }
         }
         return sumPercentage;
      }
      getGrade() {
         if (!this.card) throw "No card data";
         if (this.grade !== undefined) return this.grade;
         // N card and some special card has no grade
         this.grade = LLConst.Member.getMemberGrade(this.card.jpname) || 0;
         return this.grade;
      }
      /** @param {number} [levelBoost] */
      getSkillDetail(levelBoost) {
         if (!this.card) {
            return undefined;
         }
         if (!levelBoost) {
            return this.card.skilldetail[this.skilllevel-1];
         }
         var lv = this.skilllevel + levelBoost;
         if (lv > this.card.skilldetail.length) lv = this.card.skilldetail.length;
         return this.card.skilldetail[lv-1];
      }
      /** @param {number} [levelBoost] */
      getAccessoryDetail(levelBoost) {
         if (!(this.accessory && this.accessory.levels)) {
            return undefined;
         }
         if (!levelBoost) {
            return this.accessory.levels[(this.accessoryLevel || 1)-1];
         }
         var lv = (this.accessoryLevel || 1) + levelBoost;
         if (lv > this.accessory.levels.length) lv = this.accessory.levels.length;
         return this.accessory.levels[lv-1];
      }
   }

   return LLMember_cls;
})();

var LLSimulateContextStatic = (function () {
   /**
    * @param {LLH.Model.LLMember[]} members 
    * @param {LLH.Core.TriggerTargetType | LLH.Core.TriggerTargetMemberType | undefined} targets 
    * @param {boolean} byMember true if targets are member (match any), false for group (match all)
    * @returns {number[]} sync target member ids
    */
    function getTargetMembers(members, targets, byMember) {
      var ret = [];
      for (var i = 0; i < members.length; i++) {
         var matched = true;
         if (targets && targets.length > 0) {
            if (byMember) {
               matched = false;
               for (var j = 0; j < targets.length; j++) {
                  if (targets[j] == members[i].card.typeid) {
                     matched = true;
                     break;
                  }
               }
            } else {
               for (var j = 0; j < targets.length; j++) {
                  if (!LLConst.Member.isMemberInGroup(members[i].card.typeid, targets[j])) {
                     matched = false;
                     break;
                  }
               }
            }
         }
         if (matched) {
            ret.push(i);
         }
      }
      return ret;
   }

   class LLSimulateContextStatic_cls {
      /**
       * @param {LLH.Model.LLMap_SaveData} mapdata 
       * @param {LLH.Model.LLTeam} team 
       * @param {number} maxTime 
       */
      constructor(mapdata, team, maxTime) {
         this.simMode = mapdata.simMode || 'sim';

         var members = team.members;
         var isLA = (this.simMode == 'simla');
         this.members = members;
         this.totalNote = mapdata.combo;
         this.totalTime = maxTime;
         this.totalPerfect = mapdata.perfect;
         this.totalHP = team.getResults().totalHP;
         this.mapSkillPossibilityUp = (isLA ? 1 : (1 + (mapdata.skillup || 0)/100));
         this.mapTapScoreUp = (isLA ? 1 : (1 + (mapdata.tapup || 0)/100));
         this.comboFeverPattern = (mapdata.combo_fever_pattern || 2);
         this.comboFeverLimit = (mapdata.combo_fever_limit || LLConstValue.SKILL_LIMIT_COMBO_FEVER);
         this.perfectAccuracyPattern = (mapdata.perfect_accuracy_pattern || 0);
         this.overHealPattern = (mapdata.over_heal_pattern || 0);
         this.triggerLimitPattern = mapdata.trigger_limit_pattern || 0;
         this.skillPosibilityDownFixed = (isLA ? (mapdata.debuff_skill_rate_down || 0) : 0);
         this.debuffHpDownValue = (isLA ? (mapdata.debuff_hp_down_value || 0) : 0);
         this.debuffHpDownInterval = (isLA ? (mapdata.debuff_hp_down_interval || 0) : 0);
         this.hasRepeatSkill = false;
         this.nonetTeam = LLConst.Member.isNonetTeam(members);
         this.sameColorTeam = LLConst.Member.isSameColorTeam(members);
   
         for (var i = 0; i < 9; i++) {
            var curMember = members[i];
            if ((curMember.card.skilleffect == LLConstValue.SKILL_EFFECT_REPEAT)
               || (curMember.accessory && curMember.accessory.effect_type == LLConstValue.SKILL_EFFECT_REPEAT)) {
               this.hasRepeatSkill = true;
               break;
            }
         }
   
         this.skillsStatic = [];
         for (var i = 0; i < 9; i++) {
            this.skillsStatic.push(this.makeSkillStaticInfo(i));
         }
   
         var memberBonusFactor = [];
         for (i = 0; i < 9; i++) {
            memberBonusFactor.push(this.members[i].getAttrBuffFactor(mapdata.attribute, mapdata.songUnit));
         }
         this.memberBonusFactor = memberBonusFactor;
      }
      /** @param {number} index */
      makeSkillStaticInfo(index) {
         /** @type {LLH.Model.LLSimulateContext_SkillStaticInfo} */
         var ret = {};
         var curMember = this.members[index];
         if ((!curMember.card.skill) || (curMember.card.skilleffect == 0)) {
            ret.neverTrigger = true;
            return ret;
         }
         var triggerType = curMember.card.triggertype;
         var skillDetail = curMember.getSkillDetail();
         if (!skillDetail) {
            ret.neverTrigger = true;
            return ret;
         }
         var skillRequire = skillDetail.require;
         ret.neverTrigger = false;
         ret.skillEffect = this.makeEffectStaticInfo(index, false);
         if (curMember.accessory) {
            ret.accessoryEffect = this.makeEffectStaticInfo(index, true);
         }
         // 连锁发动条件
         if (triggerType == LLConstValue.SKILL_TRIGGER_MEMBERS) {
            // 连锁条件是看要求的人物(例如要求μ's二年级的穗乃果的连锁卡, 要求人物为小鸟和海未)都发动过技能
            // 而不是所有是要求的人物的卡都发动过技能
            // 上面的例子中, 只要有任何一张鸟的卡和一张海的卡发动过技能(包括饰品技能)就能触发果的连锁
            var conditionBitset = 0;
            var possibleBitset = 0;
            /** @type {LLH.Model.LLSimulateContext_ChainTypeIdBitsType} */
            var typeIdBits = {};
            var typeIds = LLConst.Member.getMemberTypeIdsInGroups(curMember.card.triggertarget);
            for (var i = 0; i < typeIds.length; i++) {
               var typeId = typeIds[i];
               typeIdBits[typeId] = (1 << i);
               if (typeId != curMember.card.typeid) {
                  conditionBitset |= (1 << i);
               }
            }
            for (var i = 0; i < this.members.length; i++) {
               // 持有连锁技能的卡牌不计入连锁发动条件
               if (this.members[i].card.triggertype == LLConstValue.SKILL_TRIGGER_MEMBERS) continue;
               var curBit = typeIdBits[this.members[i].card.typeid];
               if (curBit !== undefined) {
                  possibleBitset |= curBit;
               }
            }
            // 无连锁对象, 不会触发
            if ((possibleBitset & conditionBitset) != conditionBitset) {
               ret.neverTrigger = true;
            } else {
               skillRequire = conditionBitset;
            }
            ret.chainTypeIdBits = typeIdBits;
         }
         if (!ret.neverTrigger) {
            ret.triggerLimit = (this.triggerLimitPattern ? (skillDetail.limit || 0) : 0);
            ret.triggerPossibility = Math.max(skillDetail.possibility - this.skillPosibilityDownFixed, 0);
            ret.triggerRequire = skillRequire;
            var curAccessoryDetail = curMember.getAccessoryDetail();
            if (curAccessoryDetail) {
               ret.accessoryPosibility = curAccessoryDetail.rate;
            } else {
               ret.accessoryPosibility = 0;
            }
         }
         return ret;
      }
      /**
       * @param {number} index 
       * @param {boolean} isAccessory 
       */
      makeEffectStaticInfo(index, isAccessory) {
         /** @type {LLH.Model.LLSimulateContext_EffectStaticInfo} */
         var ret = {};
         var curMember = this.members[index];
         var effectType;
         var effectTarget;
         if (isAccessory) {
            if (!curMember.accessory) {
               ret.effectType = LLConstValue.SKILL_EFFECT_NONE;
               return ret;
            } else {
               effectType = curMember.accessory.effect_type;
               effectTarget = curMember.accessory.effect_target;
            }
         } else {
            effectType = curMember.card.skilleffect;
            effectTarget = curMember.card.effecttarget;
         }
         ret.effectType = effectType;
         // init sync target
         if (effectType == LLConstValue.SKILL_EFFECT_SYNC && effectTarget) {
            // include self
            ret.syncTargets = getTargetMembers(this.members, effectTarget, isAccessory);
            // exclude one
            ret.syncTargetsBy = [];
            for (var i = 0; i < 9; i++) {
               ret.syncTargetsBy.push(ret.syncTargets.filter((x) => x != i));
            }
         }
         // attribute up target
         else if (effectType == LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP) {
            ret.attributeUpTargets = getTargetMembers(this.members, effectTarget, isAccessory);
         }
         return ret;
      }
   }

   return LLSimulateContextStatic_cls;
})();

var LLSimulateContext = (function() {
   const SIM_NOTE_ENTER = 1;
   const SIM_NOTE_HIT = 2;
   const SIM_NOTE_HOLD = 3;
   const SIM_NOTE_RELEASE = 4;
   const EPSILON = 1e-8;
   const SEC_PER_FRAME = 0.016;

   /**
    * @param {number} maxHP 
    * @return {LLH.Model.LLSimulateContext_HP}
    */
   function initHPData(maxHP) {
      return {
         'currentHP': maxHP,
         'overHealHP': 0,
         'overHealLevel': 0,
         'overHealBonus': 1,
         'totalDamageValue': 0,
         'totalHealValue': 0,
         'frameHeal': 0
      };
   }

   var makeDeltaTriggerCheck = function(key) {
      /**
       * @param {LLH.Model.LLSimulateContext} context
       * @param {LLH.Model.LLSimulateContext_Trigger} data
       */
      return function(context, data) {
         var startValue = data.s;
         var requireValue = data.st.triggerRequire;
         var curValue = context[key];
         if (curValue - startValue >= requireValue) {
            data.s = curValue - (curValue - startValue)%requireValue
            return true;
         }
         return false;
      };
   };
   var triggerChecks = (function() {
      /** @type {{[type: number]: (context: LLH.Model.LLSimulateContext, data: LLH.Model.LLSimulateContext_Trigger) => boolean}} */
      var ret = {};
      ret[LLConstValue.SKILL_TRIGGER_TIME] = makeDeltaTriggerCheck('currentTime');
      ret[LLConstValue.SKILL_TRIGGER_NOTE] = makeDeltaTriggerCheck('currentNote');
      ret[LLConstValue.SKILL_TRIGGER_COMBO] = makeDeltaTriggerCheck('currentCombo');
      ret[LLConstValue.SKILL_TRIGGER_SCORE] = makeDeltaTriggerCheck('currentScore');
      ret[LLConstValue.SKILL_TRIGGER_PERFECT] = makeDeltaTriggerCheck('currentPerfect');
      ret[LLConstValue.SKILL_TRIGGER_STAR_PERFECT] = makeDeltaTriggerCheck('currentStarPerfect');
      ret[LLConstValue.SKILL_TRIGGER_MEMBERS] = function(context, data) {
         var requireBits = data.st.triggerRequire;
         var curBits = data.s;
         if (requireBits && ((curBits & requireBits) == requireBits)) {
            data.s = 0;
            return true;
         }
         return false;
      };
      return ret;
   })();

   class LLSimulateContext_cls {
      /** @param {LLH.Model.LLSimulateContextStatic} staticData */
      constructor(staticData) {
         this.staticData = staticData;
         this.members = staticData.members;
         this.currentTime = 0;
         this.currentFrame = 0;
         this.currentNote = 0;
         this.currentCombo = 0;
         this.currentScore = 0;
         this.currentPerfect = 0;
         this.currentStarPerfect = 0;
         this.currentHPData = initHPData(staticData.totalHP);
         this.skillsActiveCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         this.skillsActiveChanceCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         this.skillsActiveNoEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         this.skillsActiveHalfEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         this.accessoryActiveCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         this.accessoryActiveChanceCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         this.accessoryActiveNoEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         this.accessoryActiveHalfEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         this.currentAccuracyCoverNote = 0;
         this.totalPerfectScoreUp = 0; // capped at SKILL_LIMIT_PERFECT_SCORE_UP
         this.remainingPerfect = staticData.totalPerfect;
         this.triggers = {};
         this.memberSkillOrder = [];
         this.lastFrameForLevelUp = -1;
         this.isFullCombo = false;
         this.laGemTotalBonus = 1;
   
         var skillOrder = []; // [ [i, priority], ...]
         var lvupSkillPriority = 1;
         var otherSkillPriority = 2;
         if (Math.random() < 0.5) {
            lvupSkillPriority = 2;
            otherSkillPriority = 1;
         }
         this.skillsDynamic = [];
         for (var i = 0; i < 9; i++) {
            var curMember = this.members[i];
            /** @type {LLH.Model.LLSimulateContext_SkillDynamicInfo} */
            var skillDynamic = {};
            skillDynamic.staticInfo = this.staticData.skillsStatic[i];
            var triggerData = this.makeTriggerData(i);
            if (triggerData) {
               var triggerType = curMember.card.triggertype;
               var effectType = curMember.card.skilleffect;
               if (this.triggers[triggerType] === undefined) {
                  this.triggers[triggerType] = [triggerData];
               } else {
                  this.triggers[triggerType].push(triggerData);
               }
               skillDynamic.trigger = triggerData;
               var skillPriority; // lower value for higher priority
               if (triggerType == LLConstValue.SKILL_TRIGGER_MEMBERS) {
                  skillPriority = 9;
               } else if (effectType == LLConstValue.SKILL_EFFECT_LEVEL_UP) {
                  skillPriority = lvupSkillPriority;
               } else if (effectType == LLConstValue.SKILL_EFFECT_REPEAT) {
                  skillPriority = 3;
               } else {
                  skillPriority = otherSkillPriority;
               }
               skillOrder.push([i, skillPriority]);
            }
            this.skillsDynamic.push(skillDynamic);
         }
         // sort priority asc, for same priority, put right one before left one (index desc)
         skillOrder.sort(function(a,b){
            if (a[1] == b[1]) return b[0]-a[0];
            return a[1]-b[1];
         });
         for (var i = 0; i < skillOrder.length; i++) {
            this.memberSkillOrder.push(skillOrder[i][0]);
         }
   
         this.activeSkills = [];
         /** @type {LLH.Model.LLSimulateContext_LastActiveSkill=} */
         this.lastActiveSkill = undefined;
         // effect_type: effect_value
         /** @type {{[type: LLH.Core.SkillEffectType]: number}} */
         var eff = {};
         eff[LLConstValue.SKILL_EFFECT_ACCURACY_SMALL] = 0; // active count
         eff[LLConstValue.SKILL_EFFECT_ACCURACY_NORMAL] = 0; // active count
         eff[LLConstValue.SKILL_EFFECT_POSSIBILITY_UP] = 1.0; // possibility *x, no stack
         eff[LLConstValue.SKILL_EFFECT_PERFECT_SCORE_UP] = 0; // total bonus
         eff[LLConstValue.SKILL_EFFECT_COMBO_FEVER] = 0; // score +(x*combo_factor), need cap at SKILL_LIMIT_COMBO_FEVER
         eff[LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP] = 0; // total attribute +x, including sync and attribute up
         eff[LLConstValue.SKILL_EFFECT_LEVEL_UP] = 0; // level boost
         this.effects = eff;
         this.isAccuracyState = false;
      }
      /** @param {number} t */
      timeToFrame(t) {
         return Math.floor((t+EPSILON)/SEC_PER_FRAME);
      }
      /** @param {number} minTime */
      updateNextFrameByMinTime(minTime) {
         // 一帧(16ms)最多发动一次技能
         var minFrame = this.timeToFrame(minTime);
         if (minFrame <= this.currentFrame) minFrame = this.currentFrame + 1;
         this.currentFrame = minFrame;
         this.currentTime = this.currentFrame * SEC_PER_FRAME;
      }
      /** @param {number} t */
      setFailTime(t) {
         if (this.failTime === undefined) {
            this.failTime = t;
         }
      }
      processDeactiveSkills() {
         if (this.activeSkills.length == 0) return;
         var activeIndex = 0;
         var checkAccuracy = false;
         for (; activeIndex < this.activeSkills.length; activeIndex++) {
            var curActiveSkill = this.activeSkills[activeIndex];
            if (curActiveSkill.t <= this.currentTime) {
               var deactivedMemberId = curActiveSkill.m;
               var effectStaticInfo = curActiveSkill.e;
               var deactivedSkillEffect = effectStaticInfo.effectType;
               this.markTriggerActive(deactivedMemberId, false);
               this.activeSkills.splice(activeIndex, 1);
               if (deactivedSkillEffect == LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP) {
                  var totalUp = 0;
                  for (var i = 0; i < effectStaticInfo.attributeUpTargets.length; i++) {
                     var targetMemberId = effectStaticInfo.attributeUpTargets[i];
                     totalUp += this.skillsDynamic[targetMemberId].attributeUp || 0;
                     this.skillsDynamic[targetMemberId].attributeUp = undefined;
                  }
                  this.effects[deactivedSkillEffect] -= totalUp;
               } else if (deactivedSkillEffect == LLConstValue.SKILL_EFFECT_SYNC) {
                  this.effects[LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP] -= this.skillsDynamic[deactivedMemberId].attributeSync || 0;
                  this.skillsDynamic[deactivedMemberId].attributeSync = undefined;
               } else if (deactivedSkillEffect == LLConstValue.SKILL_EFFECT_ACCURACY_SMALL
                  || deactivedSkillEffect == LLConstValue.SKILL_EFFECT_ACCURACY_NORMAL) {
                  this.effects[deactivedSkillEffect] -= 1;
                  checkAccuracy = true;
               } else if (deactivedSkillEffect == LLConstValue.SKILL_EFFECT_POSSIBILITY_UP) {
                  this.effects[deactivedSkillEffect] = 1.0;
               } else if (deactivedSkillEffect == LLConstValue.SKILL_EFFECT_PERFECT_SCORE_UP
                  || deactivedSkillEffect == LLConstValue.SKILL_EFFECT_COMBO_FEVER) {
                  this.effects[deactivedSkillEffect] -= curActiveSkill.v;
               }
               activeIndex--;
            }
         }
         if (checkAccuracy) {
            this.updateAccuracyState();
         }
      }
      updateAccuracyState() {
         this.isAccuracyState = (this.effects[LLConstValue.SKILL_EFFECT_ACCURACY_SMALL] > 0) || (this.effects[LLConstValue.SKILL_EFFECT_ACCURACY_NORMAL] > 0);
      }
      getMinDeactiveTime() {
         var minNextTime = undefined;
         if (this.activeSkills.length == 0) return minNextTime;
         var activeIndex = 0;
         for (; activeIndex < this.activeSkills.length; activeIndex++) {
            if (minNextTime === undefined || this.activeSkills[activeIndex].t < minNextTime) {
               minNextTime = this.activeSkills[activeIndex].t;
            }
         }
         return minNextTime;
      }
      /**
       * @param {number} memberId 
       * @param {boolean} bActive 
       * @param {LLH.Model.LLSimulateContext_EffectStaticInfo} [effectInfo] 
       */
      markTriggerActive(memberId, bActive, effectInfo) {
         var curTriggerData = this.skillsDynamic[memberId].trigger;
         if (!curTriggerData) return;
         curTriggerData.a = bActive;
         curTriggerData.ae = effectInfo;
         // special case
         if ((!bActive) && this.members[memberId].card.triggertype == LLConstValue.SKILL_TRIGGER_TIME) {
            curTriggerData.s = this.currentTime;
         }
      }
      /**
       * @param {number} memberId 
       * @param {LLH.Model.LLSimulateContext_EffectStaticInfo} [effectInfo] 
       */
      isSkillNoEffect(memberId, effectInfo) {
         if (effectInfo === undefined) return true;
         var skillEffect = effectInfo.effectType;
         // 在一些情况下技能会无效化
         if (skillEffect == LLConstValue.SKILL_EFFECT_REPEAT) {
            // 没技能发动时,repeat不能发动
            if (this.lastActiveSkill === undefined) return true;
            // 被非同帧复读过了, 对以后帧就会失效
            var lastRepeatFrame = this.lastActiveSkill.rf;
            if (lastRepeatFrame >= 0 && lastRepeatFrame < this.currentFrame) {
               this.clearLastActiveSkill();
               return true;
            }
            // 当前可复读的技能为当前帧发动的技能等级提升时也会哑火
            if (this.lastActiveSkill.af == this.currentFrame) {
               var realMemberId = this.lastActiveSkill.m;
               var realSkillStatic = this.skillsDynamic[realMemberId].staticInfo;
               var realSkillEffect = (this.lastActiveSkill.a ? realSkillStatic.accessoryEffect : realSkillStatic.skillEffect);
               if (realSkillEffect && realSkillEffect.effectType == LLConstValue.SKILL_EFFECT_LEVEL_UP) {
                  return true;
               }
            }
         } else if (skillEffect == LLConstValue.SKILL_EFFECT_POSSIBILITY_UP) {
            // 已经有技能发动率上升的话不能发动的技能发动率上升
            if (this.effects[LLConstValue.SKILL_EFFECT_POSSIBILITY_UP] > 1+EPSILON) return true;
         } else if (skillEffect == LLConstValue.SKILL_EFFECT_LEVEL_UP) {
            // 若在同一帧中如果有另一个技能等级提升已经发动了, 则无法发动
            if (this.effects[LLConstValue.SKILL_EFFECT_LEVEL_UP] && this.lastFrameForLevelUp == this.currentFrame) {
               return true;
            }
         } else if (skillEffect == LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP && effectInfo.attributeUpTargets) {
            // 若队伍中所有满足条件的卡都已经在属性提升状态, 则无法发动
            for (var i = 0; i < effectInfo.attributeUpTargets.length; i++) {
               var targetMemberId = effectInfo.attributeUpTargets[i];
               if (!this.skillsDynamic[targetMemberId].attributeUp) {
                  return false;
               }
            }
            return true;
         } else if (skillEffect == LLConstValue.SKILL_EFFECT_SYNC && effectInfo.syncTargetsBy) {
            // 若队伍中没有同步对象，则无法发动
            if (effectInfo.syncTargetsBy[memberId].length < 1) return true;
         }
         return false;
      }
      /**
       * @param {number} memberId 
       * @param {boolean} isAccessory 
       */
      getSkillPossibility(memberId, isAccessory) {
         var triggerData = this.skillsDynamic[memberId].trigger;
         var possibility = 0;
         if (triggerData) {
            possibility = (isAccessory ? triggerData.st.accessoryPosibility : triggerData.st.triggerPossibility) || 0;
         }
         return possibility * this.staticData.mapSkillPossibilityUp * this.effects[LLConstValue.SKILL_EFFECT_POSSIBILITY_UP];
      }
      /**
       * @param {number} memberId 
       * @param {number} levelBoost 
       * @param {number} activateFrame 
       * @param {boolean} isAccessory 
       */
      setLastActiveSkill(memberId, levelBoost, activateFrame, isAccessory) {
         this.lastActiveSkill = {'m': memberId, 'b': levelBoost, 'af': activateFrame, 'rf': -1, 'a': isAccessory};
      }
      clearLastActiveSkill() {
         this.lastActiveSkill = undefined;
      }
      setLastFrameForLevelUp() {
         this.lastFrameForLevelUp = this.currentFrame;
      }
      /**
       * @param {LLH.Model.LLSimulateContext_EffectStaticInfo} effectInfo 
       * @param {number} effectTime 
       * @param {number} memberId 
       * @param {number} realMemberId 
       * @param {number} [effectValue] 
       * @param {number} [syncTarget] 
       */
      addActiveSkill(effectInfo, effectTime, memberId, realMemberId, effectValue, syncTarget) {
         /** @type {LLH.Model.LLSimulateContext_ActiveSkill} */
         var ret = {};
         ret.e = effectInfo;
         ret.m = memberId;
         ret.rm = realMemberId;
         ret.st = syncTarget;
         ret.t = this.currentTime + effectTime;
         ret.v = effectValue;
         this.activeSkills.push(ret);
         this.markTriggerActive(memberId, true, effectInfo);
         return ret;
      }
      /**
       * @param {number} memberId 
       * @param {boolean} isAccessory 
       */
      onSkillActive(memberId, isAccessory) {
         var levelBoost = this.effects[LLConstValue.SKILL_EFFECT_LEVEL_UP];
         var triggerType = this.members[memberId].card.triggertype;
         if (levelBoost) {
            // 连锁技能可以吃到同一帧中发动的技能等级提升的效果, 而其它技能则只能吃到之前帧发动的技能等级提升
            if (this.lastFrameForLevelUp == this.currentFrame && triggerType != LLConstValue.SKILL_TRIGGER_MEMBERS) {
               levelBoost = 0;
            } else {
               this.effects[LLConstValue.SKILL_EFFECT_LEVEL_UP] = 0;
            }
         }
         var skillDynamic = this.skillsDynamic[memberId];
         var skillEffect = (isAccessory ? skillDynamic.staticInfo.accessoryEffect : skillDynamic.staticInfo.skillEffect);
         var effectType = (skillEffect ? skillEffect.effectType : LLConstValue.SKILL_EFFECT_NONE);
         var realMemberId = memberId;
         var realAccessory = isAccessory;
         // update chain trigger
         var chainTriggers = this.triggers[LLConstValue.SKILL_TRIGGER_MEMBERS];
         if (chainTriggers && triggerType != LLConstValue.SKILL_TRIGGER_MEMBERS) {
            for (var i = 0; i < chainTriggers.length; i++) {
               var thisBit = chainTriggers[i].st.chainTypeIdBits[this.members[memberId].card.typeid];
               if (thisBit !== undefined) {
                  chainTriggers[i].s |= thisBit;
               }
            }
         }
         // set last active skill
         if (effectType == LLConstValue.SKILL_EFFECT_REPEAT) {
            if (this.lastActiveSkill !== undefined) {
               realMemberId = this.lastActiveSkill.m;
               levelBoost = this.lastActiveSkill.b;
               realAccessory = this.lastActiveSkill.a;
               if (realAccessory) {
                  skillEffect = this.skillsDynamic[realMemberId].staticInfo.accessoryEffect;
               } else {
                  skillEffect = this.skillsDynamic[realMemberId].staticInfo.skillEffect;
               }
               effectType = (skillEffect ? skillEffect.effectType : LLConstValue.SKILL_EFFECT_NONE);
               // 国服翻译有问题, 说复读技能发动时前一个发动的技能是复读时无效
               // 但是日服的复读技能介绍并没有提到这一点, 而是复读上一个非复读技能
               // 这导致了日服出现的复读boost卡组能获得超高得分的事件, 而llh依照国服翻译无法模拟这一情况
               // 而且这一卡组的出现意味着复读可以复读等级提升后的技能
               // 现在更改为按日服介绍进行模拟
               //this.lastActiveSkill = undefined;
               // 记录非同帧复读
               if (this.lastActiveSkill.af != this.currentFrame) {
                  this.lastActiveSkill.rf = this.currentFrame;
               }
               // 半哑火: 被复读的技能哑火了
               if (this.isSkillNoEffect(memberId, skillEffect)) {
                  return false;
               }
            } else {
               // no effect
               return false;
            }
         } else if (this.staticData.hasRepeatSkill) {
            if (this.lastActiveSkill === undefined || this.lastActiveSkill.af != this.currentFrame) {
               this.setLastActiveSkill(memberId, levelBoost, this.currentFrame, isAccessory);
            }
         }
         if (!skillEffect) return false;
         // take effect
         // should not be a REPEAT skill
         var effectTime = 0;
         var effectValue = 0;
         if (realAccessory) {
            var accessoryDetail = this.members[realMemberId].getAccessoryDetail(levelBoost);
            if (accessoryDetail !== undefined) {
               effectTime = accessoryDetail.time;
               effectValue = accessoryDetail.effect_value;
            }
         } else {
            var skillDetail = this.members[realMemberId].getSkillDetail(levelBoost);
            if (skillDetail !== undefined) {
               effectTime = skillDetail.time;
               effectValue = skillDetail.score;
            }
         }
         if (effectType == LLConstValue.SKILL_EFFECT_ACCURACY_SMALL) {
            this.effects[LLConstValue.SKILL_EFFECT_ACCURACY_SMALL] += 1;
            if (effectTime === undefined) effectTime = effectValue;
            this.addActiveSkill(skillEffect, effectTime, memberId, realMemberId);
         } else if (effectType == LLConstValue.SKILL_EFFECT_ACCURACY_NORMAL) {
            this.effects[LLConstValue.SKILL_EFFECT_ACCURACY_NORMAL] += 1;
            if (effectTime === undefined) effectTime = effectValue;
            this.addActiveSkill(skillEffect, effectTime, memberId, realMemberId);
            this.updateAccuracyState();
         } else if (effectType == LLConstValue.SKILL_EFFECT_HEAL) {
            this.updateHP(effectValue);
            // 奶转分
            if (this.isFullHP() && this.members[realMemberId].hasSkillGem()) this.currentScore += effectValue * 480;
         } else if (effectType == LLConstValue.SKILL_EFFECT_SCORE) {
            if (this.members[realMemberId].hasSkillGem()) this.currentScore += Math.ceil(effectValue * 2.5);
            else this.currentScore += effectValue;
         } else if (effectType == LLConstValue.SKILL_EFFECT_POSSIBILITY_UP) {
            // 不可叠加
            this.effects[LLConstValue.SKILL_EFFECT_POSSIBILITY_UP] = effectValue;
            this.addActiveSkill(skillEffect, effectTime, memberId, realMemberId, effectValue);
         } else if (effectType == LLConstValue.SKILL_EFFECT_PERFECT_SCORE_UP) {
            this.effects[LLConstValue.SKILL_EFFECT_PERFECT_SCORE_UP] += effectValue;
            this.addActiveSkill(skillEffect, effectTime, memberId, realMemberId, effectValue);
         } else if (effectType == LLConstValue.SKILL_EFFECT_COMBO_FEVER) {
            this.effects[LLConstValue.SKILL_EFFECT_COMBO_FEVER] += effectValue;
            this.addActiveSkill(skillEffect, effectTime, memberId, realMemberId, effectValue);
         } else if (effectType == LLConstValue.SKILL_EFFECT_SYNC) {
            if (skillEffect.syncTargetsBy === undefined) {
               console.error('Undefined syncTargetsBy');
               return false;
            }
            // exclude the member that activate the skill, not the one owning the skill
            var syncTargets = skillEffect.syncTargetsBy[memberId];
            var syncTarget = syncTargets[Math.floor(Math.random() * syncTargets.length)];
            var attrDiff = 0;
            var targetDynamic = this.skillsDynamic[syncTarget];
            if (targetDynamic.attributeSync !== undefined) {
               attrDiff = this.members[syncTarget].attrStrength + targetDynamic.attributeSync - this.members[memberId].attrStrength;
            } else if (targetDynamic.attributeUp !== undefined) {
               attrDiff = this.members[syncTarget].attrStrength + targetDynamic.attributeUp - this.members[memberId].attrStrength;
            } else {
               attrDiff = this.members[syncTarget].attrStrength - this.members[memberId].attrStrength;
            }
            this.effects[LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP] += attrDiff;
            skillDynamic.attributeSync = attrDiff;
            this.addActiveSkill(skillEffect, effectTime, memberId, realMemberId, attrDiff, syncTarget);
         } else if (effectType == LLConstValue.SKILL_EFFECT_LEVEL_UP) {
            this.effects[LLConstValue.SKILL_EFFECT_LEVEL_UP] = effectValue;
            this.setLastFrameForLevelUp();
         } else if (effectType == LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP) {
            var attrBuff = 0;
            if (skillEffect.attributeUpTargets !== undefined) {
               for (var i = 0; i < skillEffect.attributeUpTargets.length; i++) {
                  var targetMemberId = skillEffect.attributeUpTargets[i];
                  var targetDynamic = this.skillsDynamic[targetMemberId];
                  if (targetDynamic.attributeUp === undefined) {
                     targetDynamic.attributeUp = Math.ceil(this.members[targetMemberId].attrStrength * (effectValue-1));
                     attrBuff += targetDynamic.attributeUp;
                  }
               }
            }
            this.effects[LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP] += attrBuff;
            this.addActiveSkill(skillEffect, effectTime, memberId, realMemberId, attrBuff);
         } else {
            console.warn('Unknown skill effect ' + effectType);
            return false;
         }
         return true;
      }
      /** @param {number} delta */
      updateHP(delta) {
         var hpData = this.currentHPData;
         hpData.frameHeal += delta;
         if (delta > 0) {
            hpData.totalHealValue += delta;
         } else if (delta < 0) {
            hpData.overHealHP = 0;
            hpData.totalDamageValue -= delta;
         }
      }
      commitHP() {
         var hpData = this.currentHPData;
         if (hpData.frameHeal !== 0) {
            var totalHP = this.staticData.totalHP;
            var delta = hpData.frameHeal;
            if (delta > 0) {
               if (hpData.currentHP + delta > totalHP)  {
                  hpData.overHealHP += hpData.currentHP + delta - totalHP;
                  hpData.currentHP = totalHP;
               } else {
                  hpData.currentHP += delta;
               }
               if (hpData.overHealHP >= totalHP) {
                  while (hpData.overHealHP >= totalHP) {
                     hpData.overHealLevel += 1;
                     hpData.overHealHP -= totalHP;
                  }
                  hpData.overHealBonus = LLConst.Common.getOverHealLevelBonus(totalHP, hpData.overHealLevel);
               }
            } else if (delta < 0) {
               hpData.currentHP += delta;
               if (hpData.currentHP < 0) {
                  hpData.currentHP = 0;
               }
            }
            hpData.frameHeal = 0;
         }
      }
      isFullHP() {
         return this.currentHPData.currentHP == this.staticData.totalHP;
      }
      isZeroHP() {
         return this.currentHPData.currentHP == 0;
      }
      getNextTriggerChances() {
         var ret = [];
         for (var i = 0; i < this.memberSkillOrder.length; i++) {
            var memberId = this.memberSkillOrder[i];
            var curTrigger = this.skillsDynamic[memberId].trigger;
            if (curTrigger === undefined) continue;
            var curTriggerType = this.members[memberId].card.triggertype;
            // active skill
            if (curTrigger.a) {
               // 复读到持续性技能的话不会保留机会到持续性技能结束
               if (curTrigger.ae && curTrigger.ae.effectType == LLConstValue.SKILL_EFFECT_REPEAT) {
                  triggerChecks[curTriggerType](this, curTrigger);
               }
               continue;
            }
            // trigger limit
            var triggerLimit = curTrigger.st.triggerLimit;
            if (triggerLimit !== undefined && triggerLimit > 0 && this.skillsActiveCount[memberId] >= triggerLimit) {
               continue;
            }
            // inactive skill, check trigger chance
            if (triggerChecks[curTriggerType](this, curTrigger)) {
               ret.push(curTrigger.m);
            }
         }
         return ret;
      }
      getMinTriggerChanceTime() {
         // 时间系
         var minNextTime = undefined;
         var curTriggerList = this.triggers[LLConstValue.SKILL_TRIGGER_TIME];
         if ((!curTriggerList) || curTriggerList.length == 0) return minNextTime;
         for (var i = 0; i < curTriggerList.length; i++) {
            var curNextTime = curTriggerList[i].s + curTriggerList[i].st.triggerRequire;
            if (minNextTime === undefined || curNextTime < minNextTime) {
               minNextTime = curNextTime;
            }
         }
         return minNextTime;
      }
      /** @param {number} index */
      makeTriggerData(index) {
         var skillStatic = this.staticData.skillsStatic[index];
         if (skillStatic.neverTrigger) {
            return undefined;
         }
         /** @type {LLH.Model.LLSimulateContext_Trigger} */
         var ret = {};
         ret.m = index;
         ret.s = 0;
         ret.a = false;
         ret.st = skillStatic;
         return ret;
      }
      updateLAGemTotalBonus() {
         this.laGemTotalBonus = this.calculateLAGemTotalBonus();
         this.currentScore = Math.ceil(this.currentScore * this.laGemTotalBonus);
      }
      calculateLAGemTotalBonus() {
         var i, j;
         var totalBonus = 1;
         for (i = 0; i < this.members.length; i++) {
            var member = this.members[i];
            for (j = 0; j < member.laGems.length; j++) {
               /** @type {LLH.API.SisDataType=} */
               var gemData = member.laGems[j].gemData;
               while (gemData) {
                  if (this.isLAGemTakeEffect(gemData)) {
                     if (gemData.effect_type == LLConstValue.SIS_EFFECT_TYPE_LA_SCORE) {
                        totalBonus = totalBonus * (1 + gemData.effect_value / 100);
                     }
                  }
                  gemData = gemData.sub_skill_data;
               }
            }
         }
         return totalBonus;
      }
      /** @param {LLH.API.SisDataType} laGem */
      isLAGemTakeEffect(laGem) {
         if (laGem.type != LLConstValue.SIS_TYPE_LIVE_ARENA) return false;
         if (laGem.group) {
            return (laGem.group == this.staticData.nonetTeam);
         } else if (laGem.trigger_ref == LLConstValue.SIS_TRIGGER_REF_HP_PERCENT) {
            return (laGem.trigger_value !== undefined) && ((this.currentHPData.currentHP / this.staticData.totalHP) * 100 >= laGem.trigger_value);
         } else if (laGem.trigger_ref == LLConstValue.SIS_TRIGGER_REF_FULL_COMBO) {
            return this.isFullCombo;
         } else if (laGem.trigger_ref == LLConstValue.SIS_TRIGGER_REF_OVERHEAL) {
            return (laGem.trigger_value !== undefined) && (this.currentHPData.overHealLevel >= laGem.trigger_value);
         } else if (laGem.trigger_ref == LLConstValue.SIS_TRIGGER_REF_ALL_SMILE) {
            return (this.staticData.sameColorTeam == 'smile');
         } else if (laGem.trigger_ref == LLConstValue.SIS_TRIGGER_REF_ALL_PURE) {
            return (this.staticData.sameColorTeam == 'pure');
         } else if (laGem.trigger_ref == LLConstValue.SIS_TRIGGER_REF_ALL_COOL) {
            return (this.staticData.sameColorTeam == 'cool');
         } else if (laGem.trigger_ref == LLConstValue.SIS_TRIGGER_REF_PERFECT_COUNT) {
            return (laGem.trigger_value !== undefined) && (this.currentPerfect >= laGem.trigger_value);
         } else if (!laGem.trigger_ref) {
            return true;
         }
         return false;
      }
      setFullCombo() {
         this.isFullCombo = true;
      }
      /**
       * @param {LLH.Internal.NoteTriggerDataType[]} noteTriggerData 
       * @param {LLH.Model.LLTeam} teamData 
       */
      simulate(noteTriggerData, teamData) {
         // 1. 1速下如果有note时间点<1.8秒的情况下,歌曲会开头留白吗? 不留白的话瞬间出现的note会触发note系技能吗? 数量超过触发条件2倍的能触发多次吗?
         //   A1. 似乎不留白, note一帧出一个, 不会瞬间全出
         // 2. repeat技能如果repeat的是一个经过技能等级提升加成过的技能, 会repeat加成前的还是加成后的?
         //   A2. 加成后的
         // 3. repeat技能如果repeat了一个奶转分, 会加分吗?
         // 4. repeat了一个持续系技能的话, 在该技能持续时间内再次触发repeat的话, 会发生什么? 加分技能能发动吗? 持续系的技能能发动吗? 会延后到持续时间结束点上发动吗?
         //   A4. 被复读的持续系技能结束前, repeat技能再次发动会似乎没效果, 也不会延后到持续时间结束点发动
         // 5. 属性同步是同步的宝石加成前的还是后的?
         //   A5. 同步的是宝石加成以及C技加成后的
         // 6. 属性同步状态下的卡受到能力强化技能加成时是什么效果? 受到能力强化技能加成的卡被属性同步是什么效果?
         //   A6. 属性同步状态下受到属性强化, 则强化的效果是同步前的属性; 但是同步目标受到属性强化加成的话, 会同步属性强化加成后的属性, 而且如果自身也受到属性强化加成的话, 自己那份属性强化也依然存在
         // 7. repeat的是属性同步技能的话, 同步对象会重新选择吗? 如果重新选择, 会选到当初发动同步的卡吗? 如果不重新选择, 同步对象是自身的话是什么效果?
         //   A7. 似乎会重新选择, 不会选到自己但有可能选到之前发动同步的卡

         var noteTriggerIndex = 0;
         var totalTime = this.staticData.totalTime;
         var curNote = (0 < noteTriggerData.length ? noteTriggerData[0] : undefined);
         var hasDamageSis = this.staticData.debuffHpDownInterval && this.staticData.debuffHpDownValue;
         var nextDamageSisTime = this.staticData.debuffHpDownInterval;
         while (noteTriggerIndex < noteTriggerData.length || this.currentTime < totalTime) {
            // 1, check if any active skill need deactive
            this.processDeactiveSkills();
            // 2. check if any skill can be activated
            var nextActiveChances = this.getNextTriggerChances();
            var quickSkip = !nextActiveChances.length;
            if (nextActiveChances.length) {
               for (var iChance = 0; iChance < nextActiveChances.length; iChance++) {
                  var nextActiveChance = nextActiveChances[iChance];
                  this.skillsActiveChanceCount[nextActiveChance]++;
                  // check card skill possibility first, then accessory possibility
                  var possibility = this.getSkillPossibility(nextActiveChance, false);
                  var staticInfo = this.skillsDynamic[nextActiveChance].staticInfo;
                  if (Math.random() < possibility / 100) {
                     if (this.isSkillNoEffect(nextActiveChance, staticInfo.skillEffect)) {
                        this.skillsActiveNoEffectCount[nextActiveChance]++;
                     } else {
                        // activate
                        if (this.onSkillActive(nextActiveChance, false)) {
                           this.skillsActiveCount[nextActiveChance]++;
                        } else {
                           this.skillsActiveHalfEffectCount[nextActiveChance]++;
                        }
                     }
                  } else if (staticInfo.accessoryEffect) {
                     // accessory
                     this.accessoryActiveChanceCount[nextActiveChance]++;
                     possibility = this.getSkillPossibility(nextActiveChance, true);
                     if (possibility > 0 && Math.random() < possibility / 100) {
                        if (this.isSkillNoEffect(nextActiveChance, staticInfo.accessoryEffect)) {
                           this.accessoryActiveNoEffectCount[nextActiveChance]++;
                        } else {
                           // activate
                           if (this.onSkillActive(nextActiveChance, true)) {
                              this.accessoryActiveCount[nextActiveChance]++;
                           } else {
                              this.accessoryActiveHalfEffectCount[nextActiveChance]++;
                           }
                        }
                     }
                  }
               }
            }
            // 3. commit effects
            this.commitHP();
            // 4. move to min next time
            var minNoteTime = (curNote !== undefined ? curNote.time : undefined);
            var minNextTime = this.currentTime;
            if (quickSkip) {
               minNextTime = totalTime;
               var minDeactiveTime = this.getMinDeactiveTime();
               var minTriggerTime = this.getMinTriggerChanceTime();
               if (minDeactiveTime !== undefined && minTriggerTime < minNextTime) {
                  minNextTime = minDeactiveTime;
               }
               if (minTriggerTime !== undefined && minTriggerTime < minNextTime) {
                  minNextTime = minTriggerTime;
               }
               if (minNoteTime !== undefined && minNoteTime <= minNextTime) {
                  minNextTime = minNoteTime;
               }
            }
            this.updateNextFrameByMinTime(minNextTime);
            // 5. damage sis
            if (hasDamageSis) {
               while (this.currentTime >= nextDamageSisTime) {
                  this.updateHP(-this.staticData.debuffHpDownValue);
                  this.commitHP();
                  if (this.isZeroHP()) {
                     this.setFailTime(nextDamageSisTime);
                     this.updateLAGemTotalBonus();
                     return;
                  }
                  nextDamageSisTime += this.staticData.debuffHpDownInterval;
               }
            }
            // 6. handle note
            var handleNote = (minNoteTime !== undefined && minNoteTime <= this.currentTime);
            // process at most one note per frame
            // need update time before process note so that the time-related skills uses correct current time
            if (handleNote && curNote) {
               if (curNote.type == SIM_NOTE_ENTER) {
                  this.currentNote++;
               } else if (curNote.type == SIM_NOTE_HIT || curNote.type == SIM_NOTE_RELEASE) {
                  var isPerfect = (Math.random() * (this.staticData.totalNote - this.currentCombo) < this.remainingPerfect);
                  var accuracyBonus = LLConstValue.NOTE_WEIGHT_PERFECT_FACTOR;
                  var isAccuracyState = this.isAccuracyState;
                  var comboFeverScore = 0;
                  var perfectScoreUp = 0;
                  this.currentCombo++;
                  if (isPerfect) {
                     this.currentPerfect++;
                     this.remainingPerfect--;
                     perfectScoreUp = this.effects[LLConstValue.SKILL_EFFECT_PERFECT_SCORE_UP];
                     if (isAccuracyState && this.staticData.perfectAccuracyPattern) {
                        accuracyBonus = LLConstValue.NOTE_WEIGHT_ACC_PERFECT_FACTOR;
                     }
                  } else {
                     if (isAccuracyState) {
                        this.currentPerfect++;
                        perfectScoreUp = this.effects[LLConstValue.SKILL_EFFECT_PERFECT_SCORE_UP];
                     } else {
                        accuracyBonus = LLConstValue.NOTE_WEIGHT_GREAT_FACTOR;
                     }
                  }
                  if (isAccuracyState) {
                     this.currentAccuracyCoverNote++;
                  }
                  if (curNote.type == SIM_NOTE_RELEASE) {
                     accuracyBonus *= LLConstValue.NOTE_WEIGHT_PERFECT_FACTOR;
                     //TODO: 如果被完美判覆盖到长条开头呢?
                  }
                  if (this.effects[LLConstValue.SKILL_EFFECT_COMBO_FEVER] > 0) {
                     comboFeverScore = Math.ceil(LLConst.Live.getComboFeverBonus(this.currentCombo, this.staticData.comboFeverPattern) * this.effects[LLConstValue.SKILL_EFFECT_COMBO_FEVER]);
                     if (comboFeverScore > this.staticData.comboFeverLimit) {
                        comboFeverScore = this.staticData.comboFeverLimit;
                     }
                  }
                  // seems not really take effect
                  //if (perfectScoreUp + this.totalPerfectScoreUp > LLConstValue.SKILL_LIMIT_PERFECT_SCORE_UP) {
                  //   perfectScoreUp = LLConstValue.SKILL_LIMIT_PERFECT_SCORE_UP - this.totalPerfectScoreUp;
                  //}
                  var baseAttribute = (isAccuracyState ? teamData.totalAttrWithAccuracy : teamData.totalAttrNoAccuracy) + this.effects[LLConstValue.SKILL_EFFECT_ATTRIBUTE_UP];
                  // note position 数值1~9, 从右往左数
                  var baseNoteScore = baseAttribute/100 * curNote.factor * accuracyBonus * this.currentHPData.overHealBonus * this.staticData.memberBonusFactor[9-curNote.note.position] * LLConst.Live.getComboScoreFactor(this.currentCombo) + comboFeverScore + perfectScoreUp;
                  // 点击得分加成对PP分也有加成效果
                  // 点击得分对CF分有加成, 1000分的CF加成上限是限制在点击得分加成之前
                  this.currentScore += Math.ceil(baseNoteScore * this.staticData.mapTapScoreUp);
                  this.totalPerfectScoreUp += perfectScoreUp;
               }
               noteTriggerIndex++;
               curNote = (noteTriggerIndex < noteTriggerData.length ? noteTriggerData[noteTriggerIndex] : undefined);
            }
         }
         this.setFullCombo();
         this.updateLAGemTotalBonus();
      }
   }

   return LLSimulateContext_cls;
})();

var LLTeam = (function() {
   var MAX_SCORE = 10000000;
   var MAX_SCORE_TEXT = '1000w+';
   var MIC_BOUNDARIES = [
      0,     // 1
      90,    // 2
      180,   // 3
      270,   // 4
      450,   // 5
      630,   // 6
      930,   // 7
      1380,  // 8
      2010,  // 9
      2880   // 10
   ];
   var armCombinationList = [];
   var MAX_SLOT = 8;
   const SIM_NOTE_ENTER = 1;
   const SIM_NOTE_HIT = 2;
   const SIM_NOTE_HOLD = 3;
   const SIM_NOTE_RELEASE = 4;
   var getArmCombinationList = function () {
      if (armCombinationList.length > 0) return armCombinationList;
      var i;
      for (i = 0; i <= MAX_SLOT; i++) {
         armCombinationList.push([]);
      }
      var gemTypeKeys = LLConst.Gem.getNormalGemTypeKeys();
      var gemTypes = [];
      var gemSlots = [];
      for (i = 0; i < gemTypeKeys.length; i++) {
         gemTypes.push(i);
         gemSlots.push(LLSisGem.getGemSlot(i));
      }
      var dfs = function (gemList, usedSlot, nextGemIndex) {
         if (nextGemIndex >= gemTypes.length) {
            for (var j = usedSlot; j <= MAX_SLOT; j++) {
               armCombinationList[j].push(gemList);
            }
            return;
         }
         dfs(gemList, usedSlot, nextGemIndex+1);
         var nextUsedSlot = usedSlot + gemSlots[nextGemIndex];
         if (nextUsedSlot <= MAX_SLOT) {
            dfs(gemList.concat(gemTypes[nextGemIndex]), nextUsedSlot, nextGemIndex+1);
         }
      };
      dfs([], 0, 0);
      return armCombinationList;
   };

   var calcTeamSkills = function (llskills, env, isAvg) {
      var finish = false;
      var scoreAttr = (isAvg ? 'averageScore' : 'maxScore');
      var healAttr = (isAvg ? 'averageHeal' : 'maxHeal');
      while (!finish) {
         finish = true;
         if (env[scoreAttr] >= MAX_SCORE) {
            env[scoreAttr] = MAX_SCORE;
            break;
         }
         var sumScore = env.minscore;
         var sumHeal = 0;
         for (var i = 0; i < 9; i++) {
            if (llskills[i].calcSkillChance(env)) {
               finish = false;
               llskills[i].calcSkillEffect(env);
            }
            sumScore += llskills[i][scoreAttr];
            sumHeal += llskills[i][healAttr];
         }
         sumScore = Math.round(sumScore);
         env[scoreAttr] = sumScore;
         env[healAttr] = sumHeal;
         env.score = sumScore;
      }
   };

   class LLTeam_cls {
      /** @param {LLH.Model.LLMember[]} members */
      constructor(members) {
         if (members === undefined) throw("Missing members");
         if (members.length != 9) throw("Expect 9 members");
         this.members = members;
         this.totalAttrNoAccuracy = 0;
         this.totalAttrWithAccuracy = 0;
         /** @type {LLH.Internal.CalculateResultType} */
         this.calculateResult = {};
      }
      /** @param {LLH.Model.LLMap_SaveData} mapdata */
      calculateAttributeStrength(mapdata) {
         var mapcolor = mapdata.attribute;
         //((基本属性+绊+饰品)*个人百分比宝石加成+(基本属性+绊)*全体百分比宝石加成+数值宝石加成)*主唱技能加成
         var teamgem = [];
         var i, j;
         var isNonetTeam = LLConst.Member.isNonetTeam(this.members);
         //数值和单体百分比宝石
         for (i = 0; i < 9; i++) {
            var curMember = this.members[i];
            curMember.calcDisplayAttr();
            /** @type {LLH.Model.LLSisGem[]} */
            var curGems = [];
            for (j = 0; j < curMember.gems.length; j++) {
               /** @type {LLH.Model.LLSisGem} */
               var curGem = curMember.gems[j];
               if (curGem.isAttrMultiple() && curGem.isEffectRangeAll() && curGem.getAttributeType() == mapcolor) {
                  if (curGem.isNonet()) {
                     if (!isNonetTeam) continue;
                  }
                  curGems.push(curGem);
               }
            }
            teamgem.push(curGems);
         }
         //全体宝石和主唱技能加成
         var cskills = [LLConst.Common.getCardCSkill(this.members[4].card)];
         if (mapdata.friendCSkill) cskills.push(mapdata.friendCSkill);
         for (i = 0; i < 9; i++) {
            var curMember = this.members[i];
            curMember.calcAttrWithGem(mapcolor, teamgem);
            curMember.calcAttrWithCSkill(mapcolor, cskills);
         }
         //全体宝石的提升统合到携带全体宝石的队员的属性强度上
         var attrStrength = [];
         var finalAttr = LLConst.Attributes.makeAttributes0();
         var bonusAttr = LLConst.Attributes.makeAttributes0();
         var totalAttrWithAccuracy = 0;
         for (i = 0; i < 9; i++) {
            var curMember = this.members[i];
            var curAttrStrength = curMember.cumulativeAttrStrength[0];
            totalAttrWithAccuracy += curMember.attrStrengthWithAccuracy;
            for (j = 0; j < 9; j++) {
               var jMember = this.members[j];
               curAttrStrength += jMember.cumulativeAttrStrength[i+1] - jMember.cumulativeAttrStrength[i];
            }
            attrStrength.push(curAttrStrength);
            LLConst.Attributes.addToAttributes(finalAttr, curMember.finalAttr);
            LLConst.Attributes.addToAttributes(bonusAttr, curMember.bonusAttr);
         }
         //debuff
         var attrDebuff = [];
         var totalAttrStrength = 0;
         var totalHP = 0;
         for (i = 0; i < 9; i++) {
            var curMember = this.members[i];
            curMember.calcAttrDebuff(mapdata, i, finalAttr[mapcolor]);
            attrDebuff.push(curMember.attrDebuff);
            totalAttrStrength += attrStrength[i] - attrDebuff[i];
            totalHP += (curMember.hp || 0);
         }
         this.calculateResult.attrStrength = attrStrength;
         this.attrDebuff = attrDebuff;
         this.calculateResult.finalAttr = finalAttr;
         this.calculateResult.bonusAttr = bonusAttr;
         this.totalAttrNoAccuracy = finalAttr[mapcolor];
         this.totalAttrWithAccuracy = totalAttrWithAccuracy;
         // total
         this.totalWeight = mapdata.totalWeight;
         this.calculateResult.totalAttrStrength = totalAttrStrength;
         this.calculateResult.totalHP = totalHP;
         // TODO:判定宝石
      }
      /** @param {LLH.Model.LLMap_SaveData} mapdata */
      calculateSkillStrength(mapdata) {
         var comboMulti = LLUnit.comboMulti(mapdata.combo);
         // perfect+accurate: 1.35, perfect: 1.25, great: 1.1, good: 1
         var accuracyMulti = 1.1+0.15*(mapdata.perfect/mapdata.combo);
         var scorePerStrength = 1.21/100*mapdata.totalWeight*comboMulti*accuracyMulti;
         var minScore = Math.round(this.calculateResult.totalAttrStrength * scorePerStrength * (1+mapdata.tapup/100));
   
         var avgSkills = [];
         var maxSkills = [];
         var i;
         for (i = 0; i < 9 ; i++) {
            var curMember = this.members[i]
            avgSkills.push(new LLSkill(curMember.card, curMember.skilllevel-1, {'gemskill': curMember.hasSkillGem(), 'skillup': mapdata.skillup}));
            maxSkills.push(new LLSkill(curMember.card, curMember.skilllevel-1, {'gemskill': curMember.hasSkillGem(), 'skillup': mapdata.skillup}));
         }
   
         var env = {
            'time': mapdata.time,
            'combo': mapdata.combo,
            'score': minScore,
            'perfect': mapdata.perfect,
            'starperfect': mapdata.starPerfect,
            'minscore': minScore
         };
         calcTeamSkills(avgSkills, env, true);
         calcTeamSkills(maxSkills, env, false);
         var totalSkillStrength = 0;
         for (i = 0; i < 9; i++) {
            avgSkills[i].calcSkillStrength(scorePerStrength);
            totalSkillStrength += avgSkills[i].strength;
         }
         this.avgSkills = avgSkills;
         this.maxSkills = maxSkills;
         this.calculateResult.minScore = minScore;
         this.averageScoreNumber = env.averageScore;
         this.averageScore = (env.averageScore == MAX_SCORE ? MAX_SCORE_TEXT : env.averageScore);
         this.maxScoreNumber = env.maxScore;
         this.calculateResult.maxScore = (env.maxScore == MAX_SCORE ? MAX_SCORE_TEXT : env.maxScore);
         this.calculateResult.averageHeal = env.averageHeal;
         this.maxHeal = env.maxHeal;
         // total
         this.calculateResult.totalSkillStrength = totalSkillStrength;
         this.calculateResult.totalStrength = this.calculateResult.totalAttrStrength + totalSkillStrength;
      }
      calculateScoreDistribution() {
         if (this.calculateResult.maxScore == MAX_SCORE || typeof(this.calculateResult.maxScore) == 'string') {
            console.error('Cannot calculate distribution for infinite max score');
            return '分数太高，无法计算分布';
         }
         if (!this.avgSkills) {
            console.error('No skills strength');
            return '缺失技能强度，无法计算分布';
         }
         var nonScoreTriggerSkills = [];
         var scoreTriggerSkills = [];
         var nextScore = [];
         for (var i = 0; i < 9; i++) {
            var curSkill = this.avgSkills[i];
            if (curSkill.actualScore) {
               if (curSkill.isScoreTrigger()) {
                  scoreTriggerSkills.push(curSkill);
                  nextScore.push(curSkill.require);
               } else {
                  nonScoreTriggerSkills.push(curSkill);
               }
            }
         }
         // non-score trigger skills
         var scoreRange = this.calculateResult.maxScore - this.calculateResult.minScore + 1;
         var scorePossibility = [new Array(scoreRange), new Array(scoreRange)];
         var pCur = 0, pNext = 1;
         var curMax = 0;
         scorePossibility[pCur][0] = 1;
         for (var i = 0; i < nonScoreTriggerSkills.length; i++) {
            var curScore = nonScoreTriggerSkills[i].actualScore;
            var curDist = nonScoreTriggerSkills[i].calcSkillDist();
            var nextMax = curMax + curScore * (curDist.length - 1);
            for (var j = 0; j <= nextMax; j++) {
               scorePossibility[pNext][j] = 0;
            }
            for (var j = 0; j <= curMax; j++) {
               for (var k = 0; k < curDist.length; k++) {
                  scorePossibility[pNext][j+k*curScore] += scorePossibility[pCur][j] * curDist[k];
               }
            }
            curMax = nextMax;
            pCur = pNext;
            pNext = 1 - pNext;
         }
         //console.debug(scorePossibility[pCur]);
         // score trigger skills
         while (scoreTriggerSkills.length > 0) {
            var minNextScore = nextScore[0];
            var minIndex = 0;
            for (var i = 1; i < nextScore.length; i++) {
               if (nextScore[i] < minNextScore) {
                  minNextScore = nextScore[i];
                  minIndex = i;
               }
            }
            if (minNextScore > this.calculateResult.maxScore) break;
            var curSkill = scoreTriggerSkills[minIndex];
            var curScore = curSkill.actualScore;
            var curPossibility = curSkill.actualPossibility / 100;
            var minNextScoreIndex = minNextScore - this.calculateResult.minScore;
            if (minNextScoreIndex < 0) minNextScoreIndex = 0;
            var nextMax = curMax + curScore;
            for (var i = 0; i < minNextScoreIndex; i++) {
               scorePossibility[pNext][i] = scorePossibility[pCur][i];
            }
            for (var i = minNextScoreIndex; i <= nextMax; i++) {
               scorePossibility[pNext][i] = 0;
            }
            for (var i = minNextScoreIndex; i <= curMax; i++) {
               scorePossibility[pNext][i] += scorePossibility[pCur][i] * (1-curPossibility);
               scorePossibility[pNext][i+curScore] += scorePossibility[pCur][i] * curPossibility;
            }
            curMax = nextMax;
            pCur = pNext;
            pNext = 1 - pNext;
            nextScore[minIndex] += curSkill.require;
         }
         //console.debug(scorePossibility[pCur]);
         this.scoreDistribution = scorePossibility[pCur];
         this.scoreDistributionMinScore = this.calculateResult.minScore;
         this.calculateResult.probabilityForMinScore = this.scoreDistribution[0];
         this.calculateResult.probabilityForMaxScore = this.scoreDistribution[this.scoreDistribution.length - 1];
         return undefined;
      }
      /**
       * @param {LLH.Model.LLMap_SaveData} mapdata 
       * @param {LLH.API.NoteDataType[]} noteData 
       * @param {number} simCount 
       */
      simulateScoreDistribution(mapdata, noteData, simCount) {
         if (simCount < 100) {
            console.error('Simulate count must be bigger than 100');
            return;
         }
         var i;
         var speed = mapdata.speed || 8;
         /** @type {LLH.Internal.NoteTriggerDataType[]} */
         var noteTriggerData = [];
         // pre-process note data
         // assume hold note start with perfect
         for (i = 0; i < noteData.length; i++) {
            noteTriggerData.push({
               'type': SIM_NOTE_ENTER,
               'time': LLConst.Live.getNoteAppearTime(noteData[i].timing_sec, speed),
               'factor': 0,
               'note': noteData[i]
            });
            if (LLConst.Live.isHoldNote(noteData[i].effect)) {
               noteTriggerData.push({
                  'type': SIM_NOTE_HOLD,
                  'time': noteData[i].timing_sec,
                  'factor': 0,
                  'note': noteData[i]
               });
               noteTriggerData.push({
                  'type': SIM_NOTE_RELEASE,
                  'time': noteData[i].timing_sec + noteData[i].effect_value,
                  'factor': LLConst.Live.isSwingNote(noteData[i].effect) ? 0.5 : 1,
                  'note': noteData[i]
               });
            } else {
               noteTriggerData.push({
                  'type': SIM_NOTE_HIT,
                  'time': noteData[i].timing_sec,
                  'factor': LLConst.Live.isSwingNote(noteData[i].effect) ? 0.5 : 1,
                  'note': noteData[i]
               });
            }
         }
         noteTriggerData.sort(function(a, b) {
            if (a.time < b.time) return -1;
            else if (a.time > b.time) return 1;
            else if (a.type < b.type) return -1;
            else if (a.type > b.type) return 1;
            else return 0;
         });
         var maxTime = noteTriggerData[noteTriggerData.length-1].time;
         if (mapdata.time > maxTime + 1e-8) {
            maxTime = mapdata.time;
         } else {
            // 在缺少歌曲长度数据的情况下, 留1秒空白
            maxTime = maxTime + 1;
         }
   
         var scores = {};
         var skillsActiveCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         var skillsActiveChanceCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         var skillsActiveNoEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         var skillsActiveHalfEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         var accessoryActiveCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         var accessoryActiveChanceCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         var accessoryActiveNoEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         var accessoryActiveHalfEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
         var totalHeal = 0;
         var totalDamage = 0;
         var totalOverHealLevel = 0;
         var totalAccuracyCoverNote = 0;
         var totalFail = 0;
         var totalLABonus = 0;
         var staticData = new LLSimulateContextStatic(mapdata, this, maxTime);
         for (i = 0; i < simCount; i++) {
            var env = new LLSimulateContext(staticData);
            env.simulate(noteTriggerData, this);
   
            if (scores[env.currentScore] !== undefined) {
               scores[env.currentScore]++;
            } else {
               scores[env.currentScore] = 1;
            }
            totalHeal += env.currentHPData.totalHealValue;
            totalDamage += env.currentHPData.totalDamageValue;
            totalOverHealLevel += env.currentHPData.overHealLevel;
            totalAccuracyCoverNote += env.currentAccuracyCoverNote;
            totalLABonus += env.laGemTotalBonus;
            if (env.failTime !== undefined) {
               totalFail += 1;
            }
            for (var j = 0; j < 9; j++) {
               skillsActiveCount[j] += env.skillsActiveCount[j];
               skillsActiveChanceCount[j] += env.skillsActiveChanceCount[j];
               skillsActiveNoEffectCount[j] += env.skillsActiveNoEffectCount[j];
               skillsActiveHalfEffectCount[j] += env.skillsActiveHalfEffectCount[j];
               accessoryActiveCount[j] += env.accessoryActiveCount[j];
               accessoryActiveChanceCount[j] += env.accessoryActiveChanceCount[j];
               accessoryActiveNoEffectCount[j] += env.accessoryActiveNoEffectCount[j];
               accessoryActiveHalfEffectCount[j] += env.accessoryActiveHalfEffectCount[j];
            }
         }
         for (i = 0; i < 9; i++) {
            skillsActiveCount[i] /= simCount;
            skillsActiveChanceCount[i] /= simCount;
            skillsActiveNoEffectCount[i] /= simCount;
            skillsActiveHalfEffectCount[i] /= simCount;
            accessoryActiveCount[i] /= simCount;
            accessoryActiveChanceCount[i] /= simCount;
            accessoryActiveNoEffectCount[i] /= simCount;
            accessoryActiveHalfEffectCount[i] /= simCount;
         }
         /** @type {LLH.Internal.SimulateScoreResult[]} */
         var simResults = [];
         for (i in scores) {
            simResults.push({
               'score': parseInt(i),
               'count': scores[i]
            });
         }
         simResults.sort(function(a, b) {return a.score - b.score;});
         var minResult = simResults[0];
         var maxResult = simResults[simResults.length - 1];
         var expection = 0;
         var percentile = [minResult.score];
         var sumResultCount = 0;
         var nextResultCount = Math.floor(percentile.length * simCount / 100);
         for (i = 0; i < simResults.length; i++) {
            var curResult = simResults[i];
            sumResultCount += curResult.count;
            expection += curResult.count * curResult.score;
            while (sumResultCount >= nextResultCount) {
               percentile.push(curResult.score);
               nextResultCount = Math.floor(percentile.length * simCount / 100);
            }
         }
         this.calculateResult.simulateScoreResults = simResults;
         this.calculateResult.naivePercentile = percentile;
         this.calculateResult.naiveExpection = Math.round(expection / simCount);
         this.calculateResult.probabilityForMinScore = minResult.count / simCount;
         this.calculateResult.probabilityForMaxScore = maxResult.count / simCount;
         this.calculateResult.minScore = minResult.score;
         this.calculateResult.maxScore = maxResult.score;
         this.calculateResult.averageSkillsActiveCount = skillsActiveCount;
         this.calculateResult.averageSkillsActiveChanceCount = skillsActiveChanceCount;
         this.calculateResult.averageSkillsActiveNoEffectCount = skillsActiveNoEffectCount;
         this.calculateResult.averageSkillsActiveHalfEffectCount = skillsActiveHalfEffectCount;
         this.calculateResult.averageAccessoryActiveCount = accessoryActiveCount;
         this.calculateResult.averageAccessoryActiveChanceCount = accessoryActiveChanceCount;
         this.calculateResult.averageAccessoryActiveNoEffectCount = accessoryActiveNoEffectCount;
         this.calculateResult.averageAccessoryActiveHalfEffectCount = accessoryActiveHalfEffectCount;
         this.calculateResult.averageHeal = totalHeal / simCount;
         this.calculateResult.averageDamage = totalDamage / simCount;
         this.calculateResult.averageOverHealLevel = totalOverHealLevel / simCount;
         this.calculateResult.averageAccuracyNCoverage = (totalAccuracyCoverNote / simCount) / noteData.length;
         this.calculateResult.averageLABonus = totalLABonus / simCount;
         this.calculateResult.failRate = totalFail / simCount;
      }
      calculatePercentileNaive() {
         if (this.scoreDistribution === undefined || this.scoreDistributionMinScore === undefined) {
            console.error('Cannot calculate percentile without score distribution');
            return;
         }
         var expection = 0;
         var percent = 0;
         var dist = this.scoreDistribution;
         var minScore = this.scoreDistributionMinScore;
         var percentile = [];
         percentile.push(minScore);
         var nextPercent = 1;
         for (var i = 0; i < dist.length; i++) {
            expection += (i+minScore) * (dist[i] || 0);
            percent += (dist[i] || 0);
            if (percent*100 >= nextPercent) {
               var curScore = i + minScore;
               while (percent*100 >= nextPercent) {
                  percentile.push(curScore);
                  nextPercent++;
               }
            }
         }
         if (nextPercent == 100) {
            percentile.push(i+minScore-1);
            console.debug(percentile);
         } else {
            console.log('calculatePercentileNaive: sum of probability over 100%');
            console.log(percentile);
            percentile[100] = i+minScore-1;
         }
         console.debug('calculatePercentileNaive: expection = ' + expection + ', percent = 1 ' + (percent >= 1 ? '+ ' : '- ') + Math.abs(percent-1));
         this.calculateResult.naivePercentile = percentile;
         this.calculateResult.naiveExpection = Math.round(expection);
      }
      calculateMic() {
         var micPoint = 0;
         var i;
         for (i = 0; i < 9; i++) {
            micPoint += this.members[i].getMicPoint();
         }
         for (i = 9; i >= 0; i--) {
            if (micPoint >= MIC_BOUNDARIES[i]) {
               this.calculateResult.micNumber = i+1;
               break;
            }
         }
         if (i < 0) this.calculateResult.micNumber = 0;
         this.calculateResult.equivalentURLevel = micPoint/40;
      }
      /**
       * @param {LLH.Model.LLMap_SaveData} mapdata 
       * @param {LLH.Internal.GemStockSaveDataType} gemStock 
       */
      autoArmGem(mapdata, gemStock) {
         var mapcolor = mapdata.attribute;
         // 计算主唱增益率以及异色异团惩罚率
         var cskills = [LLConst.Common.getCardCSkill(this.members[4].card)];
         if (mapdata.friendCSkill) cskills.push(mapdata.friendCSkill);
         var cskillPercentages = [];
         var totalDebuffFactor = 0;
         var i, j, k;
         for (i = 0; i < 9; i++) {
            var curMember = this.members[i];
            cskillPercentages.push(curMember.calcTotalCSkillPercentageForSameColor(mapcolor, cskills));
            totalDebuffFactor += curMember.getAttrDebuffFactor(mapcolor, mapdata.songUnit, mapdata.weights[i], mapdata.totalWeight);
         }
         // 需要爆分宝石/治愈宝石可能带来的强度, 所以强行放入宝石进行计算
         for (i = 0; i < 9; i++) {
            var curMember = this.members[i];
            if (!curMember.hasSkillGem()) {
               var curAttribute = curMember.card.attribute;
               if (curAttribute != 'all') {
                  curMember.gems.push(new LLSisGem(LLConst.GemType.SCORE_250, {'color': curAttribute}));
               }
            }
         }
         this.calculateAttributeStrength(mapdata);
         this.calculateSkillStrength(mapdata);
         if (!this.avgSkills) {
            console.error('No skills strength');
            return;
         }
         // 统计年级, 组合信息
         /** @type {LLH.Core.GradeType[]} */
         var gradeInfo = [];
         var gradeCount = [0, 0, 0];
         /** @type {(LLH.Core.BigGroupIdType | undefined)[]} */
         var unitInfo = [];
         for (i = 0; i < 9; i++) {
            var curMember = this.members[i];
            var curMemberGrade = curMember.getGrade();
            var curBigGroupId = LLConst.Member.getBigGroupId(curMember.card.jpname);
            gradeInfo.push(curMemberGrade);
            gradeCount[curMemberGrade]++;
            unitInfo.push(curBigGroupId);
         }
         var isNonetTeam = LLConst.Member.isNonetTeam(this.members);
         // 计算每种宝石带来的增益
         var gemStockSubset = [];
         var gemStockKeyToIndex = {};
         var powerUps = [];
         var gemTypes = LLConst.Gem.getNormalGemTypeKeys();
         for (i = 0; i < 9; i++) {
            var curMember = this.members[i];
            var curPowerUps = {};
            /** @type {LLH.Model.LLSisGem_Options} */
            var gemOption = {'grade': gradeInfo[i], 'color': (mapcolor == 'all' ? undefined : mapcolor), 'member': LLConstValue[curMember.card.jpname], 'unit': unitInfo[i]};
            for (j = 0; j < gemTypes.length; j++) {
               var curGem = new LLSisGem(j, gemOption);
               if (!curGem.isValid()) continue;
               var curStrengthBuff = 0;
               if (curGem.isSkillGem()) {
                  var curSkill = this.avgSkills[i];
                  if (curMember.card.attribute != 'all') {
                     curGem.setAttributeType(curMember.card.attribute);
                  }
                  if (curGem.isHealToScore() && curSkill.isEffectHeal()) {
                     curStrengthBuff = curSkill.strength;
                  } else if (curGem.isScoreMultiple() && curSkill.isEffectScore()) {
                     curStrengthBuff = curSkill.strength * curGem.getEffectValue() / (100+curGem.getEffectValue());
                  }
                  // 考虑技能概率提升带来的增益
                  curStrengthBuff *= (1 + mapdata.skillup/100);
               } else {
                  if (curGem.isAttrAdd()) {
                     if (curGem.isEffectRangeSelf()) {
                        curStrengthBuff = curGem.getEffectValue() * (1 + cskillPercentages[i]/100);
                     }
                  } else if (curGem.isAttrMultiple()) {
                     if (curGem.isEffectRangeSelf()) {
                        if (curGem.getAttributeType() == mapcolor) {
                           curStrengthBuff = (curGem.getEffectValue() / 100) * (1 + cskillPercentages[i]/100) * curMember[mapcolor];
                        }
                        // TODO: 个人宝石和歌曲颜色不同的情况下, 增加强度为12%主唱技能加成带来的强度
                     } else if (curGem.isEffectRangeAll()) {
                        var takeEffect = 0;
                        if (curGem.isNonet()) {
                           if (isNonetTeam) {
                              takeEffect = 1;
                           }
                        } else {
                           takeEffect = 1;
                        }
                        if (takeEffect) {
                           for (k = 0; k < 9; k++) {
                              curStrengthBuff += Math.ceil( (curGem.getEffectValue() / 100) * this.members[k][mapcolor] ) * (1 + cskillPercentages[k]/100);
                           }
                        }
                     }
                  }
                  //TODO: 判定宝石
                  // 考虑点击得分提升带来的增益, 以及异色异团惩罚带来的减益
                  curStrengthBuff *= (1 + mapdata.tapup/100) * (1 - totalDebuffFactor);
               }
               if (curStrengthBuff == 0) continue;
               var gemStockKey = curGem.getGemStockKeys().join('.');
               if (gemStockKeyToIndex[gemStockKey] === undefined) {
                  gemStockKeyToIndex[gemStockKey] = gemStockSubset.length;
                  gemStockSubset.push(curGem.getGemStockCount(gemStock));
               }
               curPowerUps[curGem.getNormalGemType()] = {'gem': curGem, 'strength': curStrengthBuff, 'stockindex': gemStockKeyToIndex[gemStockKey]};
            }
            powerUps.push(curPowerUps);
         }
         // 假设宝石库存充足的情况下, 计算宝石对每个成员带来的最大强度
         var combList = getArmCombinationList();
         var maxStrengthBuffForMember = [];
         for (i = 0; i < 9; i++) {
            var curCombList = combList[this.members[i].maxcost];
            var curPowerUps = powerUps[i];
            var curMaxStrengthBuff = 0;
            var curMaxStrengthBuffComb = [];
            for (j = 0; j < curCombList.length; j++) {
               var curComb = curCombList[j];
               var sumStrengthBuff = 0;
               for (k = 0; k < curComb.length; k++) {
                  if (!curPowerUps[curComb[k]]) break;
                  sumStrengthBuff += curPowerUps[curComb[k]].strength;
               }
               if (k < curComb.length) continue;
               if (sumStrengthBuff > curMaxStrengthBuff) {
                  curMaxStrengthBuff = sumStrengthBuff;
                  curMaxStrengthBuffComb = curComb;
               }
            }
            maxStrengthBuffForMember.push({'strength': curMaxStrengthBuff, 'comb': curMaxStrengthBuffComb});
         }
         // gemStockRequests[i][j]: 统计第(i+1)~第9个成员(下标i~8)对第j种宝石的总需求量
         var gemStockRequests = [];
         for (i = 0; i < 9; i++) {
            var curRequests = [];
            var curPowerUps = powerUps[i];
            for (j = 0; j < gemStockSubset.length; j++) {
               curRequests.push(0);
            }
            for (j in curPowerUps) {
               curRequests[curPowerUps[j].stockindex] = 1;
            }
            gemStockRequests.push(curRequests);
         }
         for (i = 7; i >= 0; i--) {
            for (j = 0; j < gemStockSubset.length; j++) {
               gemStockRequests[i][j] += gemStockRequests[i+1][j];
            }
         }
         // dp[member_index][cur_state]={'strength': cur_max_strength, 'prev': prev_state, 'comb': cur_combination}
         // DP状态: 在考虑第1~member_index个成员(下标0~(member_index-1))的宝石分配情况下, 还剩cur_state个宝石的时候, 所能达到的最大强度加成
         // prev_state和cur_combination用于记录到达该状态的路径
         // member_index==0: 初始状态
         // cur_state, prev_state: 状态用字符串表示, 每个字符用0~9或者-, 表示剩余宝石数, -表示库存充足
         var curState = '';
         for (i = 0; i < gemStockSubset.length; i++) {
            if (gemStockSubset[i] >= gemStockRequests[0][i]) {
               curState = curState + '-';
            } else {
               curState = curState + String(gemStockSubset[i]);
            }
         }
         var dp = [{}];
         dp[0][curState] = {'strength': 0, 'prev': '', 'comb': []};
         var maxStrengthBuff = -1;
         var addDPState = function (curDP, memberIndex, state, strength, prev, comb) {
            var nextState = state.split('');
            for (var i = 0; i < nextState.length; i++) {
               if (nextState[i] != '-') {
                  if (memberIndex+1 < 9) {
                     if (parseInt(nextState[i]) >= gemStockRequests[memberIndex+1][i]) nextState[i] = '-';
                  } else {
                     nextState[i] = '-';
                  }
               }
            }
            var nextStateStr = nextState.join('');
            if (curDP[nextStateStr] !== undefined && curDP[nextStateStr].strength >= strength) return;
            curDP[nextStateStr] = {'strength': strength, 'prev': prev, 'comb': comb};
            if (strength > maxStrengthBuff) maxStrengthBuff = strength;
         };
         for (i = 0; i < 9; i++) {
            var curMaxStrengthBuffStrength = maxStrengthBuffForMember[i].strength;
            var curMaxStrengthBuffComb2 = maxStrengthBuffForMember[i].comb;
            var curCombList = combList[this.members[i].maxcost];
            var curPowerUps = powerUps[i];
            var remainingMaxStrengthBuff = 0;
            for (j = i; j < 9; j++) {
               remainingMaxStrengthBuff += maxStrengthBuffForMember[j].strength;
            }
            var lastDP = dp[i];
            var curDP = {};
            for (var lastState in lastDP) {
               var lastDPState = lastDP[lastState];
               if (lastDPState.strength + remainingMaxStrengthBuff < maxStrengthBuff) continue;
               // 检查当前成员最大加成所需的宝石是否充足, 如果充足就用这个配置
               var enoughGem = 1;
               for (j = 0; enoughGem && j < curMaxStrengthBuffComb2.length; j++) {
                  if (lastState.charAt(curPowerUps[curMaxStrengthBuffComb2[j]].stockindex) != '-') enoughGem = 0;
               }
               if (enoughGem) {
                  addDPState(curDP, i, lastState, lastDPState.strength + curMaxStrengthBuffStrength, lastState, curMaxStrengthBuffComb2);
                  continue;
               }
               // 尝试该槽数下所有可行的宝石组合
               for (j = 0; j < curCombList.length; j++) {
                  var curComb = curCombList[j];
                  var nextState = lastState.split('');
                  var sumStrengthBuff = 0;
                  for (k = 0; k < curComb.length; k++) {
                     var powerUp = curPowerUps[curComb[k]];
                     if (!powerUp) break;
                     if (nextState[powerUp.stockindex] == '0') break;
                     if (nextState[powerUp.stockindex] != '-') {
                        nextState[powerUp.stockindex] = String(parseInt(nextState[powerUp.stockindex])-1);
                     }
                     sumStrengthBuff += powerUp.strength;
                  }
                  if (k < curComb.length) continue;
                  addDPState(curDP, i, nextState.join(''), lastDPState.strength + sumStrengthBuff, lastState, curComb);
               }
            }
            dp.push(curDP);
         }
         // 找到最优组合并沿着路径获取每个成员的最优宝石分配
         // dp[9]里应该只有一个状态(全是'-')
         maxStrengthBuff = -1;
         var maxStrengthState;
         for (i in dp[9]) {
            if (dp[9][i].strength > maxStrengthBuff) {
               maxStrengthBuff = dp[9][i].strength;
               maxStrengthState = i;
            }
         }
         for (i = 8; i >= 0; i--) {
            var curDPState = dp[i+1][maxStrengthState];
            var curComb = curDPState.comb;
            var curPowerUps = powerUps[i];
            var curGems = [];
            for (j = 0; j < curComb.length; j++) {
               curGems.push(curPowerUps[curComb[j]].gem);
            }
            this.members[i].gems = curGems;
            maxStrengthState = curDPState.prev;
         }
      }
      /**
       * @param {LLH.Model.LLMap_SaveData} mapdata 
       * @param {LLH.Internal.GemStockSaveDataType} gemStock 
       * @param {LLH.Model.LLMember[]} submembers 
       */
      autoUnit(mapdata, gemStock, submembers) {
         var me = this;
         var mapcolor = mapdata.attribute;
         var weights = mapdata.weights
         //排序权重, 不包括主唱位, 从大到小
         var visitedWeight = [0, 0, 0, 0, 1, 0, 0, 0, 0];
         var weightSort = [];
         var i, j;
         for (i = 0; i < 8; i++) {
            var maxWeight = 0;
            var maxWeightPos = -1;
            for (j = 0; j < 9; j++) {
               if (visitedWeight[j]) continue;
               if (maxWeight < weights[j]) {
                  maxWeight = weights[j];
                  maxWeightPos = j;
               }
            }
            weightSort.push(maxWeightPos);
            visitedWeight[maxWeightPos] = 1;
         }
         //把除了主唱的所有成员放到一起
         var allMembers = submembers.concat();
         for (i = 0; i < this.members.length; i++) {
            if (i == 4) continue;
            var curMember = this.members[i];
            if (curMember.empty()) continue;
            allMembers.push(curMember);
         }
         //计算歌曲颜色和组合对各个成员的加成, 方便把异色卡放在权重小的位置
         var membersRef = [];
         for (i = 0; i < allMembers.length; i++) {
            membersRef.push({
               'index': i,
               'buff': allMembers[i].getAttrBuffFactor(mapcolor, mapdata.songUnit)
            });
         }
         //定一个初始状态, 这里用的是取属性P最高的8个, 也许可以直接用当前的队伍?
         membersRef.sort(function(a, b) {
            var lhs = allMembers[a.index][mapcolor];
            var rhs = allMembers[b.index][mapcolor];
            if (lhs < rhs) return 1;
            else if (lhs > rhs) return -1;
            else return 0;
         });
         var curTeam = membersRef.splice(0, 8);
         //对每个备选成员, 每次尝试替换队伍中8个成员的一个并自动配饰
         //如果最大能得到的期望得分比现有队伍高, 则换上这个成员, 并在这基础上继续上述步骤
         var sortByBuffDesc = function(a, b) {
            var lhs = a.buff;
            var rhs = b.buff;
            if (lhs < rhs) return 1;
            else if (lhs > rhs) return -1;
            else return 0;
         };
         var getCurTeamBestStrength = function() {
            var curTeamSorted = curTeam.concat();
            curTeamSorted.sort(sortByBuffDesc);
            for (var sortIndex = 0; sortIndex < 8; sortIndex++) {
               me.members[weightSort[sortIndex]] = allMembers[curTeamSorted[sortIndex].index];
            }
            me.autoArmGem(mapdata, gemStock);
            me.calculateAttributeStrength(mapdata);
            me.calculateSkillStrength(mapdata);
            return me.averageScore;
         };
         var debugTeam = function() {
            var ret = '{';
            for (var i = 0; i < 8; i++) {
               var member = allMembers[curTeam[i].index];
               ret += member.cardid + '(' + member.skilllevel + ',' + member.maxcost + '),';
            }
            return ret + '}';
         };
         var maxAverageScore = getCurTeamBestStrength();
         for (i = 0; i < membersRef.length; i++) {
            var replacePos = -1;
            for (j = 0; j < 8; j++) {
               var tmp = curTeam[j];
               curTeam[j] = membersRef[i];
               var curScore = getCurTeamBestStrength();
               if (curScore > maxAverageScore) {
                  maxAverageScore = curScore;
                  replacePos = j;
               }
               curTeam[j] = tmp;
            }
            if (replacePos >= 0) {
               var tmp = curTeam[replacePos];
               curTeam[replacePos] = membersRef[i];
               membersRef[i] = tmp;
               console.debug(debugTeam() + maxAverageScore);
            }
         }
         //最后把得分最高的队伍组回来, 重新计算一次配饰作为最终结果
         //把剩余的成员返回出去
         curTeam.sort(sortByBuffDesc);
         /** @type {(LLH.Model.LLMember | undefined)[]} */
         var allMembersMarked = allMembers.concat();
         for (i = 0; i < 8; i++) {
            me.members[weightSort[i]] = allMembers[curTeam[i].index];
            allMembersMarked[curTeam[i].index] = undefined;
         }
         me.autoArmGem(mapdata, gemStock);
         var resultSubMembers = [];
         for (i = 0; i < allMembersMarked.length; i++) {
            if (allMembersMarked[i] !== undefined) {
               resultSubMembers.push(allMembersMarked[i]);
            }
         }
         return resultSubMembers;
      }
      getResults() {
         return this.calculateResult;
      }
   }

   return LLTeam_cls;
})();

var LLSaveData = (function () {
   // ver 0 : invalid save data
   // ver 1 : [{team member}, ..] total 9 members
   // ver 2 : [{team member with maxcost}, ..(9 members), {gem stock}] total 10 items
   // ver 10 : [{sub member}, ..] any number of members
   // ver 11 : {gem stock} ("1".."15", total 15 items)
   // ver 101 : (not compatible with old version)
   //   { "version": 101, "team": [{team member}, ..(9 members)], "gemstock": {gem stock v2}, "submember": [{sub member}, ..] }
   //   gem stock v2:
   //     {
   //       "<gem type key>": {"<sub type>": {"<sub type>": ...{"<sub type>": "<number>"}...} }, ...
   //     }
   //     sub type in following order and value:
   //       gem type has per_grade: "1", "2", "3"
   //       gem type has per_member: "<member name>"
   //       gem type has per_unit: "muse", "aqours"
   //       gem type has per_color: "smile", "pure", "cool"
   // ver 102 : use gem stock v3
   //   gem stock v3:
   //     {
   //       "ALL": "<number>" | "<gem type key>" : {...}
   //     }
   //     added "ALL" for any type/sub-type dict, when specified, all sub-types having "<number>" of gem
   // ver 103 :
   //   member gem now is also per_color (gem stock and gemmember need convert)
   // ver 104 :
   //   member gem use member id instead of name now
   //   nonet gem use unit id instead of key now (4 for muse, 5 for aqours, 60 for niji, 143 for liella)
   //   new member gems and nonet gems
   //   team member def change
   //     removed: gemnum, gemsinglepercent, gemallpercent, gemskill, gemacc, gemmember, gemnonet
   //     added: gemlist (normal gem meta key list)
   /** @param {LLH.Internal.UnitAnySaveDataType} data */
   var checkSaveDataVersionImpl = function (data) {
      if (data === undefined) return 0;
      var dataGeV101 = /** @type {LLH.Internal.UnitSaveDataTypeV104} */ (data);
      if (dataGeV101.version !== undefined) return dataGeV101.version;
      var dataLtV101 = /** @type {LLH.Internal.Legacy.UnitSaveDataTypeV2} */ (data);
      if (dataLtV101.length === undefined && Object.keys(data).length == 15) return 11;
      if (dataLtV101.length == 0) return 0;
      if (!dataLtV101[0]) return 0;
      var member = dataLtV101[0];
      if (!(member.cardid && (member.mezame !== undefined) && member.skilllevel)) return 0;
      if (member.maxcost && !member.smile) return 10;
      if (dataLtV101.length == 9) return 1;
      if (dataLtV101.length == 10) return 2;
      return 0;
   };
   /** @param {LLH.Internal.Legacy.UnitSaveDataTypeV2} data */
   var getTeamMemberV1V2 = function (data) {
      var ret = [];
      for (var i = 0; i < 9; i++) {
         /** @type {LLH.Internal.MemberSaveDataType} */
         var member = {};
         var cur = data[i];
         for (var j in cur) {
            member[j] = cur[j];
         }
         if (member.maxcost === undefined) {
            var totalCost = 0;
            convertMemberV103ToV104([member]);
            if (member.gemlist) {
               for (var k = 0; k < member.gemlist.length; k++) {
                  var gemMeta = LLConst.Gem.getNormalGemMeta(LLConst.GemType[member.gemlist[k]]);
                  if (gemMeta) {
                     totalCost += gemMeta.slot;
                  }
               }
            }
            member.maxcost = totalCost;
         }
         ret.push(member);
      }
      return ret;
   };
   var getGemStockV11 = function (data) {
      /** @type {LLH.Internal.GemStockNodeExpandType} */
      var ret = {};
      var gemv1 = [9];
      for (var i = 1; i < 16; i++) {
         gemv1.push(parseInt(data[i] || 0));
      }
      ret['SADD_200'] = {'ALL': gemv1[0]};
      ret['SADD_450'] = {'ALL': gemv1[1]};
      ret['SMUL_10'] = {
         '1': {'ALL': gemv1[2]},
         '2': {'ALL': gemv1[3]},
         '3': {'ALL': gemv1[4]}
      };
      ret['SMUL_16'] = {
         '1': {'ALL': gemv1[5]},
         '2': {'ALL': gemv1[6]},
         '3': {'ALL': gemv1[7]}
      };
      ret['AMUL_18'] = {'ALL': gemv1[8]};
      ret['AMUL_24'] = {'ALL': gemv1[9]};
      ret['SCORE_250'] = {'smile': gemv1[10], 'pure': gemv1[11], 'cool': gemv1[12]};
      ret['HEAL_480'] = {'smile': gemv1[13], 'pure': gemv1[14], 'cool': gemv1[15]};
      return ret;
   };
   var getGemStockV1V2 = function (data) {
      if (!data[9]) {
         return {};
      }
      return getGemStockV11(data[9]);
   };
   var getSubMemberV10 = function (data) {
      return data;
   };
   var GEM_MEMBER_COLOR_102_TO_103 = {
      'smile': 2,
      'pure': 3,
      'cool': 4
   };
   /** @param {LLH.Model.LLSaveData} me */
   var convertV102ToV103 = function (me) {
      if (me.hasGemStock && me.gemStock) {
         var stock = me.gemStock;
         if (stock['MEMBER_29']) {
            var m29 = stock['MEMBER_29'];
            var members = LLConst.Gem.getMemberGemList();
            if (m29['ALL'] === undefined) {
               for (var i = 0; i < members.length; i++) {
                  var curMemberName = LLConst.Member.getMemberName(members[i]);
                  if (m29[curMemberName] !== undefined) {
                     var memberGemCount = m29[curMemberName];
                     if (memberGemCount > 0) {
                        var memberGemPerColor = {
                           'smile': 0,
                           'pure': 0,
                           'cool': 0
                        };
                        memberGemPerColor[LLConst.Member.getMemberColor(curMemberName)] = memberGemCount;
                        m29[curMemberName] = memberGemPerColor;
                     } else {
                        m29[curMemberName] = {'ALL': 0};
                     }
                  }
               }
            } else if (m29['ALL'] > 0) {
               var memberGemCount = m29['ALL'];
               stock['MEMBER_29'] = {};
               for (var i = 0; i < members.length; i++) {
                  var curMemberName = LLConst.Member.getMemberName(members[i]);
                  stock['MEMBER_29'][curMemberName] = {'ALL': memberGemCount};
               }
            }
         }
      }
      if (me.teamMember) {
         var teamMember = me.teamMember;
         for (var i = 0; i < teamMember.length; i++) {
            var curMember = /** @type {LLH.Internal.Legacy.MemberSaveDataTypeV103} */ (teamMember[i]);
            if (curMember.gemmember && parseInt(curMember.gemmember + '') == 1) {
               var memberColor = LLConst.Member.getMemberColor(LLCardData.getAllCachedBriefData()[curMember.cardid].typeid);
               curMember.gemmember = GEM_MEMBER_COLOR_102_TO_103[memberColor];
            } else if (!curMember.gemmember) {
               curMember.gemmember = 0;
            }
            if (!curMember.gemnonet) curMember.gemnonet = 0;
         }
      }
      return me;
   };
   var CONVERT_MEMBER_103_TO_104 = {
      '0': [],
      '200': ['SADD_200'],
      '450': ['SADD_450'],
      '650': ['SADD_450', 'SADD_200'],
      '1400': ['SADD_1400'],
      '1600': ['SADD_1400', 'SADD_200'],
      '1850': ['SADD_1400', 'SADD_450'],
      '2050': ['SADD_1400', 'SADD_450', 'SADD_200'],
      '0.1': ['SMUL_10'],
      '0.16': ['SMUL_16'],
      '0.26': ['SMUL_16', 'SMUL_10'],
      '0.28': ['SMUL_28'],
      '0.38': ['SMUL_28', 'SMUL_10'],
      '0.44': ['SMUL_28', 'SMUL_16'],
      '0.018': ['AMUL_18'],
      '0.024': ['AMUL_24'],
      '0.04': ['AMUL_40'],
      '0.042': ['AMUL_24', 'AMUL_18']
   };
   /** @param {LLH.Internal.Legacy.MemberSaveDataTypeV103ToV104[]} members */
   var convertMemberV103ToV104 = function (members) {
      for (var i = 0; i < members.length; i++) {
         var member = members[i];
         if (member.gemlist !== undefined) continue;
         /** @type {LLH.Internal.NormalGemCategoryKeyType[]} */
         var gemList = [];
         var memberV103 = /** @type {LLH.Internal.Legacy.MemberSaveDataTypeV103} */ (member);
         if (memberV103.gemnum) {
            gemList = gemList.concat(CONVERT_MEMBER_103_TO_104[memberV103.gemnum]);
         }
         if (memberV103.gemsinglepercent) {
            gemList = gemList.concat(CONVERT_MEMBER_103_TO_104[memberV103.gemsinglepercent]);
         }
         if (memberV103.gemallpercent) {
            gemList = gemList.concat(CONVERT_MEMBER_103_TO_104[memberV103.gemallpercent]);
         }
         if (memberV103.gemskill == '1') {
            var isHeal = false;
            if (memberV103.cardid && LLCardData) {
               var cardbrief = (LLCardData.getAllCachedBriefData() || {})[memberV103.cardid];
               if (cardbrief && cardbrief.skilleffect == LLConstValue.SKILL_EFFECT_HEAL) {
                  isHeal = true;
               }
            }
            gemList.push(isHeal ? 'HEAL_480' : 'SCORE_250');
         }
         if (memberV103.gemacc == '1') {
            gemList.push('EMUL_33');
         }
         if (memberV103.gemmember && memberV103.gemmember != '0') {
            gemList.push('MEMBER_29');
         }
         if (memberV103.gemnonet == '1') {
            gemList.push('NONET_42');
         }
         member.gemlist = gemList;
      }
   };
   /** @param {LLH.Model.LLSaveData} me */
   var convertV103ToV104 = function (me) {
      // convert gem stock
      var i;
      if (me.hasGemStock && me.gemStock) {
         var stock = me.gemStock;
         // convert member gems, name => member id
         if (stock['MEMBER_29']) {
            var m29 = stock['MEMBER_29'];
            if (m29['ALL'] === undefined) {
               var newM29 = {};
               var members = LLConst.Gem.getMemberGemList();
               for (i = 0; i < members.length; i++) {
                  var curMemberName = LLConst.Member.getMemberName(members[i]);
                  if (m29[curMemberName] !== undefined) {
                     newM29[i.toFixed()] = m29[curMemberName];
                  } else {
                     newM29[i.toFixed()] = {'ALL': 0};
                  }
               }
               stock['MEMBER_29'] = newM29;
            }
         }
         // convert nonet gems, unit key => group id
         if (stock['NONET_42']) {
            var n42 = stock['NONET_42'];
            if (n42['ALL'] === undefined) {
               var newN42 = {};
               if (n42['muse'] !== undefined) {
                  newN42[LLConstValue.GROUP_MUSE.toFixed()] = n42['muse'];
               }
               if (n42['aqours'] !== undefined) {
                  newN42[LLConstValue.GROUP_AQOURS.toFixed()] = n42['aqours'];
               }
               var units = LLConst.Gem.getUnitGemList();
               for (i = 0; i < units.length; i++) {
                  if (newN42[i.toFixed()] === undefined) {
                     newN42[i.toFixed()] = {'ALL': 0};
                  }
               }
               stock['NONET_42'] = newN42;
            }
         }
      }
      if (me.teamMember && me.teamMember.length > 0) {
         convertMemberV103ToV104(me.teamMember);
      }
   };
   var SUB_MEMBER_ATTRS = ['cardid', 'mezame', 'skilllevel', 'maxcost'];
   var shrinkSubMembers = function (submembers) {
      var ret = [];
      for (var i = 0; i < submembers.length; i++) {
         var shrinked = {};
         var curSubmember = submembers[i];
         for (var j = 0; j < SUB_MEMBER_ATTRS.length; j++) {
            shrinked[SUB_MEMBER_ATTRS[j]] = curSubmember[SUB_MEMBER_ATTRS[j]];
         }
         ret.push(shrinked);
      }
      return ret;
   };
   /**
    * @param {LLH.Internal.NormalGemMetaType | undefined} meta 
    * @param {string} current_sub 
    * @param {string[]} subtypes 
    * @param {(meta: LLH.Internal.NormalGemMetaType | undefined, subtypes: string[]) => number} callback 
    * @returns {LLH.Internal.GemStockSaveDataType | number}
    */
   var recursiveMakeGemStockDataImpl = function (meta, current_sub, subtypes, callback) {
      if (!current_sub) {
         return callback(meta, subtypes);
      }
      var next_sub;
      var types;
      if (current_sub == 'per_grade') {
         next_sub = 'per_member';
         types = ['1', '2', '3'];
      } else if (current_sub == 'per_member') {
         next_sub = 'per_unit';
         types = LLConst.Gem.getMemberGemList().map((x) => x.toFixed());
      } else if (current_sub == 'per_unit') {
         next_sub = 'per_color';
         types = LLConst.Gem.getUnitGemList().map((x) => x.toFixed());
      } else if (current_sub == 'per_color') {
         next_sub = '';
         types = ['smile', 'pure', 'cool'];
      } else {
         throw 'Unexpected current_sub "' + current_sub + '"';
      }
      if ((!meta) || (!meta[current_sub])) return recursiveMakeGemStockDataImpl(meta, next_sub, subtypes, callback);
      /** @type {LLH.Internal.GemStockNodeExpandType} */
      var ret = {};
      for (var i = 0; i < types.length; i++) {
         ret[types[i]] = recursiveMakeGemStockDataImpl(meta, next_sub, subtypes.concat(types[i]), callback);
      }
      return ret;
   };
   /**
    * @param {LLH.Internal.NormalGemMetaType | undefined} meta 
    * @param {(meta: LLH.Internal.NormalGemMetaType | undefined, subtypes: string[]) => number} callback 
    */
   var recursiveMakeGemStockData = function (meta, callback) {
      return recursiveMakeGemStockDataImpl(meta, 'per_grade', [], callback);
   };
   /**
    * @param {LLH.Internal.GemStockSaveDataType} stock 
    * @param {number} fillnum 
    */
   var fillDefaultGemStock = function (stock, fillnum) {
      if (stock.ALL !== undefined) return;
      var keys = LLConst.Gem.getNormalGemTypeKeys();
      for (var i = 0; i < keys.length; i++) {
         if (stock[keys[i]] === undefined) {
            stock[keys[i]] = recursiveMakeGemStockData(LLConst.Gem.getNormalGemMeta(i), function(){return fillnum;});
         }
      }
   };
   class LLSaveData_cls {
      /** @param {LLH.Internal.UnitAnySaveDataType} data */
      constructor(data) {
         this.rawData = data;
         this.rawVersion = checkSaveDataVersionImpl(data);
         /** @type {LLH.Internal.MemberSaveDataType[]} */
         this.teamMember = [];
         if (this.rawVersion == 0) {
            if (data !== undefined) {
               console.error("Unknown save data:");
               console.error(data);
            }
            this.gemStock = {};
            this.hasGemStock = false;
            this.subMember = [];
         } else if (this.rawVersion == 1 || this.rawVersion == 2) {
            var dataV2 = /** @type {LLH.Internal.Legacy.UnitSaveDataTypeV2} */ (data);
            this.teamMember = getTeamMemberV1V2(dataV2);
            this.gemStock = getGemStockV1V2(dataV2);
            this.hasGemStock = true;
            this.subMember = [];
         } else if (this.rawVersion == 10) {
            this.gemStock = {};
            this.hasGemStock = false;
            this.subMember = getSubMemberV10(data);
         } else if (this.rawVersion == 11) {
            this.gemStock = getGemStockV11(data);
            this.hasGemStock = true;
            this.subMember = [];
         } else if (this.rawVersion >= 101) {
            var dataGeV101 = /** @type {LLH.Internal.UnitSaveDataTypeV104} */ (data);
            this.teamMember = dataGeV101.team;
            this.gemStock = dataGeV101.gemstock;
            this.hasGemStock = true;
            this.subMember = dataGeV101.submember;
         } else {
            this.gemStock = {};
            this.hasGemStock = false;
         }
         if (this.rawVersion <= 102) {
            convertV102ToV103(this);
         }
         if (this.rawVersion <= 103) {
            convertV103ToV104(this);
         }
      }
      /** @param {LLH.Internal.UnitAnySaveDataType} data */
      static checkSaveDataVersion(data) {
         return checkSaveDataVersionImpl(data);
      }
      static makeFullyExpandedGemStock() {
         /** @type {LLH.Internal.GemStockSaveDataType} */
         var ret = {};
         fillDefaultGemStock(ret, 9);
         return ret;
      }
      /** @param {LLH.Internal.MemberSaveDataType[]} members */
      static normalizeMemberGemList(members) {
         convertMemberV103ToV104(members);
      }
      /**
       * @param {boolean} [excludeTeam] 
       * @param {boolean} [excludeGemStock] 
       * @param {boolean} [excludeSubMember] 
       */
      serializeV104(excludeTeam, excludeGemStock, excludeSubMember) {
         return JSON.stringify({
            'version': 104,
            'team': (excludeTeam ? [] : this.teamMember),
            'gemstock': (excludeGemStock ? {} : this.gemStock),
            'submember': (excludeSubMember ? [] : shrinkSubMembers(this.subMember))
         });
      }
   }

   return LLSaveData_cls;
})();

/** @type {typeof LLH.Layout.GemStock.LLGemStockComponent} */
var LLGemStockComponent = (function () {
   const createElement = LLUnit.createElement;
   const STOCK_SUB_TYPE_START = 0;
   const STOCK_SUB_TYPE_GEM = 1;
   const STOCK_SUB_TYPE_GRADE = 2;
   const STOCK_SUB_TYPE_MEMBER = 3;
   const STOCK_SUB_TYPE_UNIT = 4;
   const STOCK_SUB_TYPE_COLOR = 5;
   /**
    * @param {number} curSubType 
    * @param {LLH.Internal.NormalGemMetaType} [gemMeta] 
    * @returns {number}
    */
   function getNextSubType(curSubType, gemMeta) {
      if (curSubType == STOCK_SUB_TYPE_START) {
         return STOCK_SUB_TYPE_GEM;
      }
      if (curSubType == STOCK_SUB_TYPE_GEM) {
         curSubType += 1;
         if (gemMeta && gemMeta.per_grade) return curSubType;
      }
      if (curSubType == STOCK_SUB_TYPE_GRADE) {
         curSubType += 1;
         if (gemMeta && gemMeta.per_member) return curSubType;
      }
      if (curSubType == STOCK_SUB_TYPE_MEMBER) {
         curSubType += 1;
         if (gemMeta && gemMeta.per_unit) return curSubType;
      }
      if (curSubType == STOCK_SUB_TYPE_UNIT) {
         curSubType += 1;
         if (gemMeta && gemMeta.per_color) return curSubType;
      }
      return curSubType + 1;
   }
   /**
    * @param {string} curKey 
    * @param {number} curSubType 
    * @returns {string}
    */
   function getGemKeyText(curKey, curSubType) {
      if (curSubType == STOCK_SUB_TYPE_GEM) {
         var gemType = LLConst.GemType[curKey];
         return LLConst.Gem.getNormalGemNameAndDescription(gemType);
      } else if (curSubType == STOCK_SUB_TYPE_GRADE) {
         return LLConst.Group.getGroupName(parseInt(curKey));
      } else if (curSubType == STOCK_SUB_TYPE_MEMBER) {
         return LLConst.Member.getMemberName(parseInt(curKey), LLConstValue.LANGUAGE_CN);
      } else if (curSubType == STOCK_SUB_TYPE_UNIT) {
         return LLConst.Group.getGroupName(parseInt(curKey));
      }
      return curKey;
   }
   /**
    * @param {HTMLElement} arrowSpan 
    * @param {LLH.Component.LLComponentBase} subGroupComp 
    * @param {boolean} [visible] 
    */
   function toggleSubGroup(arrowSpan, subGroupComp, visible) {
      if (visible === undefined) {
         subGroupComp.toggleVisible();
      } else if (visible) {
         subGroupComp.show();
      } else {
         subGroupComp.hide();
      }
      arrowSpan.className = (subGroupComp.visible ? 'tri-down' : 'tri-right');
   }
   function createListGroup(subItems) {
      return createElement('div', {'className': 'list-group'}, subItems);
   }
   /**
    * 
    * @param {string} text 
    * @param {string} val 
    * @param {LLH.Layout.GemStock.LLGemStockComponent_NodeController} controller 
    * @param {HTMLElement} [subGroup] 
    * @returns {HTMLElement[]}
    */
   function createListGroupItem(text, val, controller, subGroup) {
      var item;
      var textSpan = createElement('span', {'className': 'gem-text', 'innerHTML': text});

      /** @type {HTMLInputElement} */
      var gemCountInput = createElement('input', {'type': 'text', 'size': 2, 'className': 'gem-count num-size-2'}, undefined, {'click': function (e) {
         var curEvent = window.event || e;
         curEvent.cancelBubble = true;
      }, 'change': function () {
         if (controller.onchange) controller.onchange(gemCountInput.value);
      }});
      controller.get = function() { return gemCountInput.value; };
      controller.set = function(v) {
         gemCountInput.value = v;
         if (String(v) == '9') {
            gemCountInput.style['background-color'] = '#373';
         } else {
            gemCountInput.style['background-color'] = '';
         }
      };
      controller.set(val);

      if (subGroup) {
         var arrowSpan = createElement('span', {'className': 'tri-down'});
         var subGroupDiv = createElement('div', {'className': 'list-group-item subtype-padding'}, [subGroup]);
         var subGroupComp = new LLComponentBase(subGroupDiv);

         controller.fold = function() { toggleSubGroup(arrowSpan, subGroupComp, false); };
         controller.unfold = function() { toggleSubGroup(arrowSpan, subGroupComp, true); };
         item = createElement('div', {'className': 'list-group-item'}, [arrowSpan, textSpan, gemCountInput], {'click': function () {
            toggleSubGroup(arrowSpan, subGroupComp); 
         }});
         return [item, subGroupDiv];
      } else {
         item = createElement('div', {'className': 'list-group-item leaf-gem'}, [textSpan, gemCountInput]);
         return [item];
      }
   }
   /** @param {string} text */
   function makeControllerOnChangeFunc(text) {
      /** @param {string} v */
      return function(v) {
         var num = parseInt(v);
         if (isNaN(num)) num = 0;
         if (num < 0) num = 0;
         if (num > 9) num = 9;
         if (this.pushchange) this.pushchange(num);
         if (this.raisechange) this.raisechange(text, num, num);
      }
   }
   function makeControllerRaiseChangeFunc(controllers, text) {
      return function (key, minv, maxv) {
         var raiseMin = minv;
         var raiseMax = maxv;
         var raiseController;
         for (var i in controllers) {
            var curController = controllers[i];
            if (i == 'ALL') {
               raiseController = curController;
            } else if (i != key) {
               if (curController.ALL.min < raiseMin) raiseMin = curController.ALL.min;
               if (curController.ALL.max > raiseMax) raiseMax = curController.ALL.max;
            }
         }
         raiseController.min = raiseMin;
         raiseController.max = raiseMax;
         if (raiseMin != raiseMax) {
            raiseController.set(raiseMin + '+');
         } else {
            raiseController.set(raiseMin);
         }
         if (raiseController.raisechange) {
            raiseController.raisechange(text, raiseMin, raiseMax);
         }
      };
   }
   /** @param {LLH.Layout.GemStock.LLGemStockComponent_GroupController} [controllers] */
   function makeControllerPushChangeFunc(controllers) {
      /**
       * @this {LLH.Layout.GemStock.LLGemStockComponent_NodeController}
       * @param {number} n
       */
      return function(n) {
         if (controllers) {
            for (var i in controllers) {
               if (i == 'ALL') continue;
               var curController = controllers[i].ALL;
               if (curController.pushchange) {
                  curController.pushchange(n);
               }
            }
         }
         if (this.set) this.set(n + '');
         this.min = n;
         this.max = n;
      };
   }
   /** @param {LLH.Layout.GemStock.LLGemStockComponent_GroupController} [controllers] */
   function makeControllerDeserializeFunc(controllers) {
      /**
       * @this {LLH.Layout.GemStock.LLGemStockComponent_NodeController}
       * @param {LLH.Internal.GemStockSaveDataType | number} data
       */
      return function(data) {
         if (typeof(data) == 'number' || typeof(data) == 'string') {
            if (this.onchange) this.onchange(data + '');
         } else if (data.ALL !== undefined) {
            if (this.onchange) this.onchange(data.ALL + '');
            if (this.fold) this.fold();
         } else {
            if (controllers) {
               var minVal = 9;
               var maxVal = 0;
               for (var i in controllers) {
                  if (i == 'ALL') continue;
                  if (data[i]) {
                     controllers[i].ALL.deserialize(data[i]);
                  } else {
                     controllers[i].ALL.deserialize({'ALL':0});
                  }
                  if (controllers[i].ALL.min < minVal) minVal = controllers[i].ALL.min;
                  if (controllers[i].ALL.max > maxVal) maxVal = controllers[i].ALL.max;
               }
               if (this.unfold && minVal != maxVal) this.unfold();
               if (this.fold && minVal == maxVal) this.fold();
            } else {
               console.error("Failed to deserialize gem stock data");
               console.error(data);
               console.error(this);
            }
         }
      }
   }
   /** @param {LLH.Layout.GemStock.LLGemStockComponent_GroupController} [controllers] */
   function makeControllerSerializeFunc(controllers) {
      /**
       * @this {LLH.Layout.GemStock.LLGemStockComponent_NodeController}
       * @returns {LLH.Internal.GemStockSaveDataType | number}
       */
      return function() {
         if (controllers) {
            if (this.min == this.max) {
               return {'ALL': (this.get ? parseInt(this.get()) : 0)};
            }
            /** @type {LLH.Internal.GemStockSaveDataType} */
            var ret = {};
            for (var i in controllers) {
               if (i == 'ALL') continue;
               ret[i] = controllers[i].ALL.serialize();
            }
            return ret;
         } else {
            return (this.get ? parseInt(this.get()) : 0);
         }
      }
   }
   /**
    * @param {string} curKey 
    * @param {any} data 
    * @param {number} curSubType STOCK_SUB_TYPE_*
    * @param {LLH.Internal.NormalGemMetaType} [gemMeta]
    * @returns {LLH.Layout.GemStock.LLGemStockComponent_Gui}
    */
   function buildStockGUI(curKey, data, curSubType, gemMeta) {
      if (typeof(data) == 'number' || typeof(data) == 'string') {
         var val = parseInt(data + '');
         if (val > 9) val = 9;
         if (val < 0) val = 0;
         /** @type {LLH.Layout.GemStock.LLGemStockComponent_NodeController} */
         var controller = {
            'onchange': makeControllerOnChangeFunc(curKey),
            'pushchange': makeControllerPushChangeFunc(),
            'deserialize': makeControllerDeserializeFunc(),
            'serialize': makeControllerSerializeFunc(),
            'min': val,
            'max': val
         };
         return {
            'items': createListGroupItem(getGemKeyText(curKey, curSubType), val + '', controller),
            'controller': /** @type {LLH.Layout.GemStock.LLGemStockComponent_GroupController} */ ({'ALL': controller})
         };
      } else {
         var items = [];
         /** @type {LLH.Layout.GemStock.LLGemStockComponent_GroupController} */
         var controllers = {};
         var minVal = 9;
         var maxVal = 0;
         for (var dataKey in data) {
            var ret = buildStockGUI(dataKey, data[dataKey], getNextSubType(curSubType, gemMeta), gemMeta || LLConst.Gem.getNormalGemMeta(LLConst.GemType[dataKey]));
            var curController = ret.controller.ALL;
            if (curController.min < minVal) minVal = curController.min;
            if (curController.max > maxVal) maxVal = curController.max;
            curController.raisechange = makeControllerRaiseChangeFunc(controllers);
            controllers[dataKey] = ret.controller;
            items = items.concat(ret.items);
         }
         /** @type {LLH.Layout.GemStock.LLGemStockComponent_NodeController} */
         var controller = {
            'onchange': makeControllerOnChangeFunc(curKey),
            'pushchange': makeControllerPushChangeFunc(controllers),
            'deserialize': makeControllerDeserializeFunc(controllers),
            'serialize': makeControllerSerializeFunc(controllers),
            'min': minVal,
            'max': maxVal
         };
         var subGroup = createListGroup(items);
         var retItems = createListGroupItem(getGemKeyText(curKey, curSubType), (minVal == maxVal ? minVal + '' : minVal + '+'), controller, subGroup);
         if (minVal == maxVal && controller.fold) controller.fold();
         controllers['ALL'] = controller;
         return {
            'items': retItems,
            'controller': controllers
         };
      }
   };

   /** @extends {LLH.Mixin.SaveLoadJsonBase<LLH.Internal.GemStockSaveDataType>} */
   class LLGemStockComponent_cls extends SaveLoadJsonBase {
      /** @param {LLH.Component.HTMLElementOrId} id  */
      constructor(id) {
         super();
         var data = LLSaveData.makeFullyExpandedGemStock();
         var gui = buildStockGUI('技能宝石仓库', data, STOCK_SUB_TYPE_START);
         LLUnit.getElement(id).appendChild(createListGroup(gui.items));
         this._gui = gui;
      }
      saveData() {
         var ret = this._gui.controller.ALL.serialize();
         if (typeof(ret) == 'number') {
            console.error('Unexpected serialized gem stock: ' + ret);
            return undefined;
         }
         return ret;
      }
      /** @param {LLH.Internal.GemStockSaveDataType} [data] */
      loadData(data) {
         if (data === undefined) return;
         this._gui.controller.ALL.deserialize(data);
      }
   };
   return LLGemStockComponent_cls;
})();

var LLSwapper = (function () {
   /**
    * @template T
    */
   class LLSwapper_cls {
      constructor () {
         /** @type {LLH.Misc.Swappable<T> | undefined} */
         this.controller = undefined;
         /** @type {T=} */
         this.data = undefined;
      }
      /** @param {LLH.Misc.Swappable<T>} controller */
      onSwap(controller) {
         if (this.controller) {
            var tmp = controller.finishSwapping(this.data);
            this.controller.finishSwapping(tmp);
            this.controller = undefined;
            this.data = undefined;
         } else {
            this.controller = controller;
            this.data = controller.startSwapping();
         }
      }
   }

   return LLSwapper_cls;
})();

/** @type {typeof LLH.Layout.SubMember.LLSubMemberComponent} */
var LLSubMemberComponent = (function () {
   var createElement = LLUnit.createElement;
   function createSimpleInputContainer(text, input) {
      var label = createElement('label', {'className': 'col-xs-4 control-label', 'innerHTML': text});
      var inputContainer = createElement('div', {'className': 'col-xs-8'}, [input]);
      var group = createElement('div', {'className': 'form-group'}, [label, inputContainer]);
      return group;
   }

   /**
    * @param {LLH.Internal.SubMemberSaveDataType} member 
    * @param {LLH.Layout.SubMember.LLSubMemberComponent_MemberContainerController} controller 
    * @returns {HTMLElement}
    */
   function createMemberContainer(member, controller) {
      var localMember;
      var bSwapping = false;
      var bDeleting = false;
      var imageComp = new LLAvatarComponent({'smallAvatar': true});
      /** @type {HTMLInputElement} */
      var levelInput = createElement('input', {'className': 'form-control', 'type': 'number', 'min': '1', 'max': '8', 'value': '1'});
      levelInput.addEventListener('change', function() {
         localMember.skilllevel = parseInt(levelInput.value);
      });
      /** @type {HTMLInputElement} */
      var slotInput = createElement('input', {'className': 'form-control', 'type': 'number', 'min': '0', 'max': '8', 'value': '0'});
      slotInput.addEventListener('change', function() {
         localMember.maxcost = parseInt(slotInput.value);
      });
      /** @type {HTMLButtonElement} */
      var deleteButton = createElement('button', {'className': 'btn btn-default btn-block', 'type': 'button', 'innerHTML': '删除'});
      /** @type {HTMLButtonElement} */
      var swapButton = createElement('button', {'className': 'btn btn-default btn-block', 'type': 'button', 'innerHTML': '换位'});
      var unDelete = function() {
         deleteButton.innerHTML = '删除';
         deleteButton.className = 'btn btn-default btn-block';
         swapButton.innerHTML = '换位';
         bDeleting = false;
      };
      deleteButton.addEventListener('click', function() {
         if (bDeleting) {
            unDelete();
            if (controller.onDelete) controller.onDelete();
         } else {
            deleteButton.innerHTML = '确认';
            deleteButton.className = 'btn btn-danger btn-block';
            swapButton.innerHTML = '取消';
            bDeleting = true;
         }
      });
      swapButton.addEventListener('click', function() {
         if (bDeleting) {
            unDelete();
         } else {
            if (controller.onSwap) controller.onSwap();
         }
      });
      controller.getMember = function() { return localMember; };
      controller.setMember = function(m) {
         if (localMember === m) return;
         localMember = m;
         if ((!localMember) || (!localMember.cardid) || (localMember.cardid == '0')) {
            if (controller.onDelete) {
               controller.onDelete();
               return;
            }
         }
         levelInput.value = m.skilllevel + '';
         slotInput.value = m.maxcost + '';
         imageComp.setCard(m.cardid + '', m.mezame);
      };
      controller.startSwapping = function() {
         swapButton.innerHTML = '选择';
         swapButton.className = 'btn btn-primary btn-block';
         deleteButton.disabled = true;
         levelInput.disabled = true;
         slotInput.disabled = true;
         bSwapping = true;
         return this.getMember();
      };
      controller.finishSwapping = function(v) {
         if (bSwapping) {
            swapButton.innerHTML = '换位';
            swapButton.className = 'btn btn-default btn-block';
            deleteButton.disabled = false;
            levelInput.disabled = false;
            slotInput.disabled = false;
            bSwapping = false;
         }
         var ret = this.getMember();
         this.setMember(v);
         return ret;
      };
      controller.setMember(member);
      var imageContainer = createElement('td', {'className': 'text-center'}, [imageComp.element]);
      var levelInputContainer = createSimpleInputContainer('等级', levelInput);
      var slotInputContainer = createSimpleInputContainer('槽数', slotInput);
      var inputsContainer = createElement('td', {'className': 'form-horizontal'}, [levelInputContainer, slotInputContainer]);
      var buttonContainer = createElement('td', {}, [deleteButton, swapButton]);
      var tr = createElement('tr', {}, [imageContainer, inputsContainer, buttonContainer]);
      var table = createElement('table', {}, [tr]);
      var panel = createElement('div', {'className': 'col-xs-12 col-sm-6 col-md-4 col-lg-3 panel panel-default submember-container'}, [table]);
      return panel;
   }

   /** @extends {LLH.Mixin.SaveLoadJsonBase<LLH.Internal.SubMemberSaveDataType[]>} */
   class LLSubMemberComponent_cls extends SaveLoadJsonBase {
      /** @param {LLH.Component.HTMLElementOrId} id */
      constructor(id) {
         super();
         this.element = LLUnit.getElement(id);
         /** @type {LLH.Layout.SubMember.LLSubMemberComponent_OnCountChangeCallback=} */
         this.onCountChange = undefined;
         /** @type {LLH.Layout.SubMember.LLSubMemberComponent_MemberContainerController[]} */
         this._controllers = [];
         /** @type {LLH.Misc.LLSwapper<LLH.Internal.SubMemberSaveDataType>=} */
         this._swapper = undefined;
      }
      _callCountChange() {
         if (this.onCountChange) {
            this.onCountChange(this.count());
         }
      }
      /**
       * @param {LLH.Internal.SubMemberSaveDataType} member 
       * @param {boolean} [skipCountChange] 
       */
      add(member, skipCountChange) {
         /** @type {LLH.Layout.SubMember.LLSubMemberComponent_MemberContainerController} */
         var controller = {};
         var container = createMemberContainer(member, controller);
         var me = this;
         this.element.appendChild(container);
         this._controllers.push(controller);
         controller.onDelete = function () {
            for (var i = 0; i < me._controllers.length; i++) {
               if (me._controllers[i] === controller) {
                  me._controllers.splice(i, 1);
                  break;
               }
            }
            controller.removeElement();
            me._callCountChange();
         };
         controller.onSwap = function () {
            if (me._swapper && me._swapper.onSwap) {
               me._swapper.onSwap(controller);
            }
         };
         controller.removeElement = function () { me.element.removeChild(container); };
         if (!skipCountChange) this._callCountChange();
      }
      /**
       * @param {number} [start]
       * @param {number} [n]
       */
      remove(start, n) {
         if (!n) return;
         start = start || 0;
         var end = start + n;
         if (end > this._controllers.length) end = this._controllers.length;
         if (end <= start) return;
         for (var i = start; i < end; i++) {
            this._controllers[i].removeElement();
         }
         this._controllers.splice(start, end - start);
         this._callCountChange();
      }
      count() {
         return this._controllers.length;
      }
      empty() {
         return this._controllers.length <= 0;
      }
      /** @param {LLH.Misc.LLSwapper<LLH.Internal.SubMemberSaveDataType>} sw */
      setSwapper(sw) {
         this._swapper = sw;
      }
      /** @param {LLH.Layout.SubMember.LLSubMemberComponent_OnCountChangeCallback} callback */
      setOnCountChange(callback) {
         this.onCountChange = callback;
      }
      saveData() {
         var ret = [];
         for (var i = 0; i < this._controllers.length; i++) {
            ret.push(this._controllers[i].getMember());
         }
         return ret;
      }
      /** @param {LLH.Internal.SubMemberSaveDataType[]} [data] */
      loadData(data) {
         if (!data) return;
         var i = 0;
         for (; i < data.length && i < this._controllers.length; i++) {
            this._controllers[i].setMember(data[i]);
         }
         if (i < data.length) {
            for (; i < data.length; i++) {
               this.add(data[i], true);
            }
            this._callCountChange();
         }
         if (i < this._controllers.length) {
            this.remove(i, this._controllers.length - i);
         }
      }
   };
   return LLSubMemberComponent_cls;
})();

var LLMicDisplayComponent = (function () {
   var createElement = LLUnit.createElement;
   var detailMicData = [
      ['#话筒数', '#数值', '#UR技能等级和'],
      ['1', '0', '0'],
      ['2', '90', '2.25'],
      ['3', '180', '4.5'],
      ['4', '270', '6.75'],
      ['5', '450', '11.25'],
      ['6', '630', '15.75'],
      ['7', '930', '23.35'],
      ['8', '1380', '34.5'],
      ['9', '2010', '50.25'],
      ['10', '2880', '72'],
      ['#稀有度', '#数值', '#等效UR技能等级'],
      ['UR', '40', '1'],
      ['SSR', '24', '0.6'],
      ['SR', '11', '0.275'],
      ['R或特典', '5', '0.125']
   ];
   function createMicResult (controller) {
      var detailContainer = createElement('div');
      /** @type {LLH.Component.LLComponentBase=} */
      var detailContainerComponent = undefined;
      var detailLink = createElement('a', {'innerHTML': '等效UR等级: ', 'href': 'javascript:;'}, undefined, {'click': function () {
         if (!detailContainerComponent) {
            detailContainer.appendChild(LLUnit.createSimpleTable(detailMicData));
            detailContainerComponent = new LLComponentBase(detailContainer);
         } else {
            detailContainerComponent.toggleVisible();
         }
      }});
      detailLink.style.cursor = 'help';
      var resultMic = createElement('span');
      var resultURLevel = createElement('span');
      var resultContainer = createElement('div', undefined, [
         '卡组筒数：',
         resultMic,
         ' (',
         detailLink,
         resultURLevel,
         ')',
         detailContainer
      ]);
      controller.set = function (mic, urlevel) {
         resultMic.innerHTML = mic;
         resultURLevel.innerHTML = LLUnit.numberToString(urlevel, 3);
      };
      return resultContainer;
   };
   // LLMicDisplayComponent
   // {
   //    'set': function (mic, urlevel),
   // }
   function LLMicDisplayComponent_cls(id) {
      var element = LLUnit.getElement(id);
      var controller = {};
      element.appendChild(createMicResult(controller));
      this.set = controller.set;
   };
   return LLMicDisplayComponent_cls;
})();

var LLSaveStorageComponent = (function () {
   var createElement = LLUnit.createElement;
   var localStorageKey = 'llhelper_unit_storage__';
   var toggleDisabledClass = 'btn btn-default disabled';
   var toggleIncludedClass = 'btn btn-success';
   var toggleExcludedClass = 'btn btn-default';

   function loadStorageJSON() {
      var json;
      try {
         var s = localStorage.getItem(localStorageKey);
         if (s) {
            json = JSON.parse(s);
         } else {
            json = {};
         }
      } catch (e) {
         json = {};
      }
      if (json == null || json === '') {
         json = {};
      }
      return json;
   }

   function saveStorageJSON(json) {
      localStorage.setItem(localStorageKey, JSON.stringify(json));
   }

   // controller
   // {
   //    'enabled': {true|false},
   //    'include': {true|false},
   // }
   function createToggleButton(controller, text, enabled) {
      controller.enabled = enabled;
      controller.included = enabled;
      var toggleButton = createElement('a', {'className': (enabled ? toggleIncludedClass : toggleDisabledClass), 'href': 'javascript:;', 'innerHTML': text}, undefined, {
         'click': function () {
            if (controller.enabled) {
               controller.included = ! controller.included;
               toggleButton.className = (controller.included ? toggleIncludedClass : toggleExcludedClass);
            }
         }
      });
      if (!enabled) {
         toggleButton.style.color = '#fff';
         toggleButton.style['background-color'] = '#777';
      }
      return toggleButton;
   }

   // controller
   // {
   //   'saveData': function() {return LLSaveData},
   //   'loadTeamMember': function(team_member_data),
   //   'loadGemStock': function(gem_stock_data),
   //   'loadSubMember': function(sub_member_data),
   //
   //   'onSave': function(),
   //   'onDelete': function(key),
   //   'reload': function(),
   //   'setInputValue': function(value),
   // }
   function createListItem(controller, key, data) {
      var deleteButton = createElement('a', {'className': 'badge', 'href': 'javascript:;', 'innerHTML': '删除'}, undefined, {
         'click': function() {
            if (controller.onDelete) controller.onDelete(key);
         }
      });
      var saveData = new LLSaveData(JSON.parse(data));
      var teamMemberToggleController = {};
      var teamMemberToggle = createToggleButton(teamMemberToggleController, '队', (saveData.teamMember.length == 9));
      var gemStockToggleController = {};
      var gemStockToggle = createToggleButton(gemStockToggleController, '宝', (Object.keys(saveData.gemStock).length > 0));
      var subMemberToggleController = {};
      var subMemberToggle = createToggleButton(subMemberToggleController, '备', (saveData.subMember.length > 0));

      var toggleGroup = createElement('div', {'className': 'btn-group btn-group-xs', 'role': 'group'}, [teamMemberToggle, gemStockToggle, subMemberToggle]);

      var loadButton = createElement('a', {'className': 'storage-text', 'href': 'javascript:;', 'innerHTML': key}, undefined, {
         'click': function() {
            console.log(saveData);
            if (teamMemberToggleController.included && controller.loadTeamMember) controller.loadTeamMember(saveData.teamMember);
            if (gemStockToggleController.included && controller.loadGemStock) controller.loadGemStock(saveData.gemStock);
            if (subMemberToggleController.included && controller.loadSubMember) controller.loadSubMember(saveData.subMember);
            if (controller.setInputValue) controller.setInputValue(key);
         }
      });
      var listItem = createElement('li', {'className': 'list-group-item'}, [deleteButton, toggleGroup, loadButton]);
      return listItem;
   }

   function createSaveStorage(controller) {
      /** @type {HTMLInputElement} */
      var nameInput = createElement('input', {'type': 'text', 'className': 'form-control', 'placeholder': '给队伍取个名字'});

      var listContainer = createElement('div', {'className': 'list-group storage-list'});
      var saveContainer = createElement('div', {'className': 'input-group'}, [
         nameInput,
         createElement('span', {'className': 'input-group-btn'}, [
            createElement('a', {'className': 'btn btn-default', 'href': 'javascript:;', 'innerHTML': '保存到浏览器'}, undefined, {
               'click': function() {
                  if (controller.onSave) controller.onSave();
               }
            })
         ])
      ]);
      var teamMemberToggleController = {};
      var teamMemberToggle = createToggleButton(teamMemberToggleController, '队伍', (controller.loadTeamMember !== undefined));
      var gemStockToggleController = {};
      var gemStockToggle = createToggleButton(gemStockToggleController, '宝石仓库', (controller.loadGemStock !== undefined));
      var subMemberToggleController = {};
      var subMemberToggle = createToggleButton(subMemberToggleController, '备选成员', (controller.loadSubMember !== undefined));
      var toSaveToggleGroup = createElement('div', {'className': 'btn-group btn-group-sm', 'role': 'group'}, [teamMemberToggle, gemStockToggle, subMemberToggle]);
      var toSaveHint = createElement('span', {'innerHTML': '选择要保存的数据:'});

      controller.onSave = function() {
         if (controller.saveData) {
            var data = controller.saveData();
            var key = nameInput.value;
            if (!key) {
               var date = new Date();
               key = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            }
            var savedJson = loadStorageJSON();
            savedJson[key] = data.serializeV104(!teamMemberToggleController.included, !gemStockToggleController.included, !subMemberToggleController.included);
            saveStorageJSON(savedJson);
            if (controller.reload) controller.reload(savedJson);
         }
      };

      controller.onDelete = function(key) {
         var savedJson = loadStorageJSON();
         delete savedJson[key];
         saveStorageJSON(savedJson);
         if (controller.reload) controller.reload(savedJson);
      };

      controller.reload = function(savedJson) {
         if (savedJson === undefined) savedJson = loadStorageJSON();
         listContainer.innerHTML = '';
         for (var key in savedJson) {
            listContainer.appendChild(createListItem(controller, key, savedJson[key]));
         }
      };

      controller.setInputValue = function(value) {
         nameInput.value = value;
      };

      controller.reload();

      var bodyItem = createElement('div', {'className': 'list-group-item storage-body'}, [listContainer, toSaveHint, toSaveToggleGroup, saveContainer]);
      var bodyItemComponent = new LLComponentBase(bodyItem);
      var arrowSpan = createElement('span', {'className': 'tri-down'});
      var headerText = createElement('span', {'className': 'storage-text', 'innerHTML': '队伍列表'});
      var refreshButton = createElement('a', {'className': 'badge', 'href': 'javascript:;', 'innerHTML': '刷新'}, undefined, {
         'click': function(e) {
            var curEvent = window.event || e;
            curEvent.cancelBubble = true;
            if (controller.reload) controller.reload();
         }
      });
      var headerItem = createElement('div', {'className': 'list-group-item storage-header'}, [arrowSpan, headerText, refreshButton], {
         'click': function() {
            bodyItemComponent.toggleVisible();
            arrowSpan.className = (bodyItemComponent.visible ? 'tri-down' : 'tri-right');
         }
      });
      var container = createElement('div', {'className': 'list-group unit-storage'}, [headerItem, bodyItem]);
      return container;
   }
   // LLSaveStorageComponent
   // {
   // }
   function LLSaveStorageComponent_cls(id, saveloadhandler) {
      var element = LLUnit.getElement(id);
      var controller = {};
      if (saveloadhandler) {
         controller.saveData = saveloadhandler.saveData;
         controller.loadTeamMember = saveloadhandler.loadTeamMember;
         controller.loadGemStock = saveloadhandler.loadGemStock;
         controller.loadSubMember = saveloadhandler.loadSubMember;
      }
      element.appendChild(createSaveStorage(controller));
   };
   return LLSaveStorageComponent_cls;
})();

var LLDataVersionSelectorComponent = (function () {
   var createElement = LLUnit.createElement;
   var versionSelectOptions = [
      {'value': 'latest', 'text': '日服最新'},
      {'value': 'cn', 'text': '20181021'},
      {'value': 'mix', 'text': '混合（1763号卡开始为日服数据）'}
   ];
   function createVersionSelector(controller) {
      /** @type {HTMLSelectElement} */
      var sel = createElement('select', {'className': 'form-control'});
      var selComp = new LLSelectComponent(sel);
      selComp.setOptions(versionSelectOptions);
      selComp.set(LLHelperLocalStorage.getDataVersion());
      selComp.onValueChange = function (v) {
         var lldata = controller.lldata;
         if (lldata) {
            if (lldata.setVersion) {
               lldata.setVersion(v);
            } else {
               if (lldata.length > 0) {
                  for (var i = 0; i < lldata.length; i++) {
                     lldata[i].setVersion(v);
                  }
               }
            }
         }
         LLHelperLocalStorage.setDataVersion(v);
         if (controller.versionChanged) controller.versionChanged(v);
      };
      var container = createElement('div', {'className': 'form-inline'}, [
         createElement('div', {'className': 'form-group'}, [
            createElement('label', {'innerHTML': '选择数据版本：'}),
            sel,
            createElement('span', {'innerHTML': '（切换数据版本后建议重新组卡）'})
         ])
      ]);
      return container;
   }
   // LLDataVersionSelectorComponent
   // {
   // }
   function LLDataVersionSelectorComponent_cls(id, lldata, versionChangedHandler) {
      var element = LLUnit.getElement(id);
      var controller = {
         'lldata': lldata,
         'versionChanged': versionChangedHandler
      };
      element.appendChild(createVersionSelector(controller));
   }
   return LLDataVersionSelectorComponent_cls;
})();

var LLScoreDistributionParameter = (function () {
   var createElement = LLUnit.createElement;
   var createFormInlineGroup = LLUnit.createFormInlineGroup;
   var updateSubElements = LLUnit.updateSubElements;

   /** @type {LLH.Component.LLSelectComponent_OptionDef<LLH.Layout.ScoreDistParam.ScoreDistType>[]} */
   const distTypeSelectOptions = [
      {'value': 'no', 'text': '不计算分布'},
      {'value': 'v1', 'text': '计算理论分布'},
      {'value': 'sim', 'text': '计算模拟分布'}
   ];
   /** @type {LLH.Component.LLSelectComponent_OptionDef<LLH.Layout.ScoreDistParam.ScoreDistType>[]} */
   const distTypeLASelectOptions = [
      {'value': 'simla', 'text': '计算模拟分布（演唱会竞技场）'}
   ];
   const speedSelectOptions = [
      {'value': '1', 'text': '1速'},
      {'value': '2', 'text': '2速'},
      {'value': '3', 'text': '3速'},
      {'value': '4', 'text': '4速'},
      {'value': '5', 'text': '5速'},
      {'value': '6', 'text': '6速'},
      {'value': '7', 'text': '7速'},
      {'value': '8', 'text': '8速'},
      {'value': '9', 'text': '9速'},
      {'value': '10', 'text': '10速'}
   ];
   const comboFeverPatternSelectOptions = [
      {'value': '1', 'text': '技能加强前（300 combo达到最大加成）'},
      {'value': '2', 'text': '技能加强后（220 combo达到最大加成）'}
   ];
   const comboFeverLimitOptions = [
      {'value': LLConstValue.SKILL_LIMIT_COMBO_FEVER + '', 'text': '上限解除前（单键加成上限1000）'},
      {'value': LLConstValue.SKILL_LIMIT_COMBO_FEVER_2 + '', 'text': '上限解除后（单键加成上限21亿）'}
   ];
   const enableDisableSelectOptions = [
      {'value': '0', 'text': '关闭'},
      {'value': '1', 'text': '启用'}
   ];
   const distTypeDetail = [
      ['#要素', '#计算理论分布/计算技能强度', '#计算模拟分布', '#计算模拟分布（演唱会竞技场）'],
      ['触发条件: 时间, 图标, 连击, perfect, star perfect, 分数', '支持', '支持', '支持'],
      ['触发条件: 连锁', '不支持', '支持', '支持'],
      ['技能效果: 回血, 加分', '支持', '支持', '支持'],
      ['技能效果: 小判定, 大判定, 提升技能发动率, 重复, <br/>完美加分, 连击加分, 技能等级提升<br/>属性同步, 属性提升', '不支持', '支持', '支持'],
      ['圆宝石: 属性提升类，魅力，治愈', '支持', '支持', '不支持'],
      ['圆宝石: 诡计', '不支持', '支持', '不支持'],
      ['方宝石', '不支持', '不支持', '支持'],
      ['溢出奶, 完美判', '不支持', '支持', '支持'],
      ['爆分发动次数限制', '不支持', '支持', '支持'],
      ['饰品: 判定, 提升技能发动率, 重复, <br/>完美加分, 连击加分, 技能等级提升<br/>属性同步, 属性提升', '不支持', '支持', '支持'],
      ['饰品: 火花', '不支持', '不支持', '不支持']
   ];

   const DEFAULT_SPEED = '8';
   const DEFAULT_COMBO_FEVER_PATTERN = '2';
   const DEFAULT_COMBO_FEVER_LIMIT = LLConstValue.SKILL_LIMIT_COMBO_FEVER_2 + '';
   const DEFAULT_OVER_HEAL = '1';
   const DEFAULT_PERFECT_ACCURACY = '1';
   const DEFAULT_TRIGGER_LIMIT = '1';

   /**
    * @param {LLH.Component.LLSelectComponent_OptionDef[]} options 
    * @param {string} defaultValue 
    * @returns {LLH.Component.LLSelectComponent}
    */
   function createSelectComponent(options, defaultValue) {
      var ret = new LLSelectComponent(LLUnit.createSelectElement({'className': 'form-control'}));
      ret.setOptions(options);
      ret.set(defaultValue);
      return ret;
   }

   /**
    * @param {boolean?} defaultEnable
    * @returns {LLH.Component.LLSelectComponent}
    */
   function createEnableDisableComponent(defaultEnable) {
      return createSelectComponent(enableDisableSelectOptions, (defaultEnable ? '1' : '0'));
   }

   /** @param {LLH.Layout.LayoutMode} mode */
   function createDistributionTypeSelector(mode) {
      var isLAMode = (mode == 'la');
      var detailContainer = createElement('div');
      /** @type {LLH.Component.LLComponentBase=} */
      var detailContainerComponent = undefined;
      var detailLink = createElement('a', {'innerHTML': '查看支持计算的技能/宝石', 'href': 'javascript:;'}, undefined, {'click': function () {
         if (!detailContainerComponent) {
            detailContainer.appendChild(LLUnit.createSimpleTable(distTypeDetail));
            detailContainerComponent = new LLComponentBase(detailContainer);
         } else {
            detailContainerComponent.toggleVisible();
         }
      }});
      detailLink.style.cursor = 'help';
      /** @type {HTMLInputElement} */
      var simParamCount = createElement('input', {'className': 'form-control', 'type': 'number', 'size': 5, 'value': '2000'});
      /** @type {HTMLInputElement} */
      var simParamPerfectPercent = createElement('input', {'className': 'form-control num-size-3', 'type': 'number', 'size': 3, 'value': '90'});
      var simParamSpeedComponent = createSelectComponent(speedSelectOptions, DEFAULT_SPEED);
      var simParamComboFeverPatternComponent = createSelectComponent(comboFeverPatternSelectOptions, DEFAULT_COMBO_FEVER_PATTERN);
      var simParamComboFeverLimitComponent = createSelectComponent(comboFeverLimitOptions, DEFAULT_COMBO_FEVER_LIMIT);
      var simParamOverHealComponent = createEnableDisableComponent(true);
      var simParamPerfectAccuracyComponent = createEnableDisableComponent(true);
      var simParamTriggerLimitComponent = createEnableDisableComponent(true);
      var simParamContainer = createElement('div', {'className': 'filter-form label-size-12'}, [
         createFormInlineGroup('模拟次数：', [simParamCount, '（模拟次数越多越接近实际分布，但是也越慢）']),
         createFormInlineGroup('无判perfect率：', [simParamPerfectPercent, '%']),
         createFormInlineGroup('速度：', [simParamSpeedComponent.element, '（图标下落速度，1速最慢，10速最快）']),
         createFormInlineGroup('Combo Fever技能：', [simParamComboFeverPatternComponent.element, simParamComboFeverLimitComponent.element]),
         createFormInlineGroup('溢出奶：', simParamOverHealComponent.element),
         createFormInlineGroup('完美判：', simParamPerfectAccuracyComponent.element),
         createFormInlineGroup('爆分发动次数限制：', simParamTriggerLimitComponent.element)
      ]);
      if (!isLAMode) {
         updateSubElements(simParamContainer, createElement('span', {'innerHTML': '注意：默认曲目的模拟分布与理论分布不兼容，两者计算结果可能会有较大差异，如有需要请选默认曲目2'}));
      }
      var simParamContainerComponent = new LLComponentBase(simParamContainer);
      /** @type {LLH.Component.LLSelectComponent<LLH.Layout.ScoreDistParam.ScoreDistType>} */
      var selComp = new LLSelectComponent(LLUnit.createSelectElement({'className': 'form-control'}));
      /** @type {LLH.Layout.ScoreDistParam.ScoreDistType} */
      var defaultSelValue;
      if (!isLAMode) {
         selComp.setOptions(distTypeSelectOptions);
         defaultSelValue = 'no';
      } else {
         selComp.setOptions(distTypeLASelectOptions);
         defaultSelValue = 'simla';
      }
      selComp.onValueChange = function (v) {
         if (v == 'sim' || v == 'simla') {
            simParamContainerComponent.show();
         } else {
            simParamContainerComponent.hide();
         }
      };
      if (!isLAMode) {
         selComp.set('no');
         simParamContainerComponent.hide();
      } else {
         selComp.set('simla');
         simParamContainerComponent.show();
      }
      var container = createElement('div', undefined, [
         createFormInlineGroup('选择分数分布计算模式：', [selComp.element, detailLink]),
         detailContainer,
         simParamContainer
      ]);
      /** @type {LLH.Layout.ScoreDistParam.ScoreDistParamController} */
      var controller = {
         'getParameters': function () {
            return {
               'type': selComp.getOrElse(defaultSelValue),
               'count': parseInt(simParamCount.value),
               'perfect_percent': parseFloat(simParamPerfectPercent.value),
               'speed': parseInt(simParamSpeedComponent.getOrElse(DEFAULT_SPEED)),
               'combo_fever_pattern': /** @type {LLH.Core.ComboFeverPattern} */ (parseInt(simParamComboFeverPatternComponent.getOrElse(DEFAULT_COMBO_FEVER_PATTERN))),
               'combo_fever_limit': /** @type {LLH.Core.ComboFeverLimit} */ (parseInt(simParamComboFeverLimitComponent.getOrElse(DEFAULT_COMBO_FEVER_LIMIT))),
               'over_heal_pattern': /** @type {LLH.Core.YesNoNumberType} */ (parseInt(simParamOverHealComponent.getOrElse(DEFAULT_OVER_HEAL))),
               'perfect_accuracy_pattern': /** @type {LLH.Core.YesNoNumberType} */ (parseInt(simParamPerfectAccuracyComponent.getOrElse(DEFAULT_PERFECT_ACCURACY))),
               'trigger_limit_pattern': /** @type {LLH.Core.YesNoNumberType} */ (parseInt(simParamTriggerLimitComponent.getOrElse(DEFAULT_TRIGGER_LIMIT)))
            };
         },
         'setParameters': function (data) {
            if (!data) return;
            if (data.type) selComp.set(data.type);
            if (data.count !== undefined) simParamCount.value = data.count + '';
            if (data.perfect_percent !== undefined) simParamPerfectPercent.value = data.perfect_percent + '';
            if (data.speed) simParamSpeedComponent.set(data.speed + '');
            if (data.combo_fever_pattern) simParamComboFeverPatternComponent.set(data.combo_fever_pattern + '');
            if (data.combo_fever_limit) simParamComboFeverLimitComponent.set(data.combo_fever_limit + '');
            if (data.over_heal_pattern !== undefined) simParamOverHealComponent.set(data.over_heal_pattern + '');
            if (data.perfect_accuracy_pattern !== undefined) simParamPerfectAccuracyComponent.set(data.perfect_accuracy_pattern + '');
            if (data.trigger_limit_pattern !== undefined) simParamTriggerLimitComponent.set(data.trigger_limit_pattern + '');
         },
         'element': container
      };
      return controller;
   }

   /** @extends {LLH.Mixin.SaveLoadJsonBase<LLH.Layout.ScoreDistParam.ScoreDistParamSaveData>} */
   class LLScoreDistributionParameter_cls extends SaveLoadJsonBase {
      /**
       * @param {LLH.Component.HTMLElementOrId} id 
       * @param {LLH.Layout.ScoreDistParam.LLScoreDistributionParameter_Options} options
       */
      constructor(id, options) {
         super();
         var element = LLUnit.getElement(id);
         if (!options) options = {};
         var mode = options.mode || 'normal';
         this._controller = createDistributionTypeSelector(mode);
         element.appendChild(this._controller.element);
      }
      saveData() {
         return this._controller.getParameters();
      }
      /** @param {LLH.Layout.ScoreDistParam.ScoreDistParamSaveData} [data] */
      loadData(data) {
         this._controller.setParameters(data);
      }
   }
   return LLScoreDistributionParameter_cls;
})();

var LLScoreDistributionChart = (function () {
   var createElement = LLUnit.createElement;
   /** @returns {LLH.Depends.HighCharts.ChartOptions} */
   function makeCommonOptions() {
      return {
         title: {
            text: '得分分布曲线'
         },
         credits: {
            text: 'LLhelper',
            href: 'http://llhelper.com'
         },
         xAxis: {
            min: 0,
            max: 100,
            tickInterval: 10,
            crosshair: true,
            labels: {
               format: '{value}%'
            }
         },
         yAxis: {
            title: {
               text: '得分'
            }
         },
         tooltip: {
            headerFormat: '<span style="font-size: 10px">{point.key}%</span><br/>',
            shared: true
         },
         plotOptions: {
            line: {
               marker: {
                  radius: 2,
                  symbol: 'circle'
               },
               pointStart: 1
            }
         }
      };
   };
   /**
    * @param {number[]} series 
    * @param {string} name 
    */
   function makeSeries(series, name) {
      /** @type {LLH.Depends.HighCharts.ChartSeriesOptions} */
      var ret = {
         'type': 'line',
         //'showCheckbox': true,
         'name': name
      }
      if (series.length == 99) {
         ret.data = series;
      } else if (series.length == 101) {
         ret.data = series.slice(1, 100).reverse();
      } else {
         console.error('Unknown series');
         console.log(series);
         ret.data = series;
      }
      return ret;
   };

   class LLScoreDistributionChart_cls {
      /**
       * @param {LLH.Component.HTMLElementOrId} id 
       * @param {LLH.Layout.ScoreDistChart.LLScoreDistributionChart_Options} options 
       */
      constructor(id, options) {
         var element = LLUnit.getElement(id);
         if (!Highcharts) {
            console.error('Not included Highcharts');
         }
         var me = this;
         var baseComponent = new LLComponentBase(element);
         baseComponent.show(); // need show before create chart, otherwise the canvas size is wrong...
         var canvasDiv = createElement('div');
         var clearButton = createElement('button', { 'className': 'btn btn-danger', 'type': 'button', 'innerHTML': '清空曲线' }, undefined, {
            'click': function () {
               me.clearSeries();
            }
         });
         element.appendChild(canvasDiv);
         element.appendChild(clearButton);
         var chartOptions = makeCommonOptions();
         var seriesOptions = [];
         var nameId = 1;
         if (options) {
            if (options.series) {
               for (; nameId <= options.series.length; nameId++) {
                  seriesOptions.push(makeSeries(options.series[nameId - 1], String(nameId)));
               }
            }
            if (options.width)
               canvasDiv.style.width = options.width;
            if (options.height)
               canvasDiv.style.height = options.height;
         }
         chartOptions.series = seriesOptions;
         this.chart = Highcharts.chart(canvasDiv, chartOptions);
         this._nameId = nameId;
         this._baseComponent = baseComponent;
      }
      /** @param {number[]} data */
      addSeries(data) {
         this.show();
         this.chart.addSeries(makeSeries(data, String(this._nameId)));
         this._nameId++;
      }
      clearSeries() {
         if ((!this.chart.series) || (this.chart.series.length == 0)) {
            return;
         }
         while (this.chart.series.length > 0) {
            this.chart.series[0].remove(false);
         }
         this.chart.redraw();
         this.hide();
      }
      show() {
         this._baseComponent.show();
      }
      hide() {
         this._baseComponent.hide();
      }
   }
   return LLScoreDistributionChart_cls;
})();

var LLTeamComponent = (function () {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;

   /** @type {LLH.Layout.Team.TeamInputFloatCellCreator} */
   function inputCellCreator(options, i) {
      var inputElement = createElement('input', options.elementOptions);
      var inputComponent = new LLValuedComponent(inputElement);
      return {
         'get': function() {
            return options.converter(inputComponent.getOrElse(''));
         },
         'set': function(v) { inputComponent.set(v + ''); },
         'element': inputElement
      };
   }

   /** @type {LLH.Layout.Team.TeamSkillLevelCellCreator} */
   function skillLevelCellCreator(options, i) {
      /** @type {HTMLInputElement} */
      var inputElement = createElement('input', {'type': 'number', 'step': '1', 'size': 1, 'value': '1', 'min': '1', 'max': '8', 'autocomplete': 'off', 'className': 'form-control num-size-1'});
      var inputComponent = new LLValuedComponent(inputElement);
      /** @type {LLH.Layout.Team.TeamSkillLevelCellController} */
      var controller = {
         'get': function() {
            return parseInt(inputComponent.getOrElse('1'));
         },
         'set': function(v) { inputComponent.set(v + ''); },
         'setMaxLevel': function (maxLevel) {
            inputElement.max = maxLevel + '';
         },
         'onChange': options.onChange,
         'element': ['Lv', inputElement]
      };
      inputComponent.onValueChange = function (newValue) {
         if (controller.onChange) {
            controller.onChange(i, parseInt(newValue));
         }
      };
      return controller;
   }

   /** @type {LLH.Layout.Team.TeamSlotCellCreator} */
   function slotCellCreator(options, i) {
      var inputElement = createElement('input', {'type': 'number', 'step': '1', 'size': 1, 'value': '0',
         'min': '0', 'max': '8', 'autocomplete': 'off', 'className': 'form-control num-size-1'});
      var inputComponent = new LLValuedComponent(inputElement);
      var textElement = createElement('span', {'innerHTML': '0'});
      var curUsedSlot = 0;
      /** @type {LLH.Layout.Team.TeamSlotCellController} */
      var controller = {
         'getMaxSlot': function() { return parseInt(inputComponent.getOrElse('0')); },
         'setMaxSlot': function(v) { inputComponent.set(v + ''); },
         'getUsedSlot': function() { return curUsedSlot; },
         'setUsedSlot': function(v) {
            if (curUsedSlot != v) {
               curUsedSlot = v;
               textElement.innerHTML = v + '';
               updateColor();
            }
         },
         'element': [textElement, '/', inputElement]
      };
      var updateColor = function() {
         var curMaxSlot = controller.getMaxSlot();
         if (curUsedSlot == curMaxSlot) {
            textElement.style.color = '';
         } else if (curUsedSlot >= curMaxSlot) {
            textElement.style.color = 'red';
         } else {
            textElement.style.color = 'blue';
         }
      };
      inputComponent.onValueChange = updateColor;

      return controller;
   }

   /** @type {LLH.Layout.Team.TeamButtonCellCreator} */
   function buttonCreator(options, i) {
      var text = (options.text === undefined ? options.head : options.text);
      return {
         'element': createElement('button', {'type': 'button', 'className': 'btn btn-default', 'innerHTML': text+(i+1)}, undefined,
            {'click': function(){ options.clickFunc(i); }}
         )
      };
   }

   /** @type {LLH.Layout.Team.TeamSwapperCellCreator} */
   function swapperCreator(options, i) {
      var bSwapping = false;
      var teamComponent = options.teamComponent;
      /** @type {LLH.Layout.Team.TeamSwapperController} */
      var controller;
      var buttonElement = createElement('button', {'type': 'button', 'className': 'btn btn-default btn-block', 'innerHTML': '换位'+(i+1)}, undefined, {'click': function() {
         var swapper = teamComponent.getSwapper();
         if (swapper) swapper.onSwap(controller);
         if (i == 4 && teamComponent.onCenterChanged) teamComponent.onCenterChanged();
      }});
      controller = {
         'startSwapping': function() {
            buttonElement.innerHTML = '选择';
            buttonElement.className = 'btn btn-primary btn-block';
            bSwapping = true;
            return teamComponent.getMember(i);
         },
         'finishSwapping': function(v) {
            if (bSwapping) {
               buttonElement.innerHTML = '换位' + (i+1);
               buttonElement.className = 'btn btn-default btn-block';
               bSwapping = false;
            }
            var ret = teamComponent.getMember(i);
            teamComponent.setMember(i, v);
            return ret;
         },
         'element': buttonElement
      };
      return controller;
   }

   /** @type {LLH.Layout.Team.TeamAvatarCellCreator} */
   function avatarCreator(options, i) {
      var avatarComp = new LLAvatarComponent({'smallAvatar': true});
      /** @type {LLH.Core.CardIdType=} */
      var curCardid = undefined;
      /** @type {LLH.Core.MezameType=} */
      var curMezame = undefined;
      return {
         'update': function(cardid, mezame) {
            if (typeof(cardid) == 'string') {
               cardid = parseInt(cardid || '0');
            } else if (cardid === undefined) {
               cardid = 0;
            }
            mezame = mezame || 0;
            if (cardid != curCardid || mezame != curMezame) {
               curCardid = cardid;
               curMezame = mezame;
               avatarComp.setCard(cardid + '', mezame);
            }
         },
         'getCardId': function() { return curCardid || 0; },
         'getMezame': function() { return curMezame || 0; },
         'element': avatarComp.element
      };
   }

   /** @type {LLH.Layout.Team.TeamAccessoryIconCellCreator} */
   function accessoryIconCreator(options, i) {
      var accessoryComponent = new LLAccessoryComponent(createElement('div'), {'size': 64});
      /** @type {LLH.API.AccessoryDataType=} */
      var curAccessory = undefined;
      var curLevel = undefined;
      var curCardId = undefined;
      var isValid = true;
      var isRemovable = false;
      var tooltipClassName = 'tooltiptext';
      var teamComponent = options.teamComponent;
      var accTooltip = createElement('span');
      var removeButton = createElement('a', { 'title': '移除', 'className': 'dialog-close-button', 'style': {'display': 'none'} }, undefined, {
         'click': () => teamComponent.setAccessory(i, undefined)
      });
      var accContainer = createElement('div', {'className': 'lltooltip', 'style': {'display': 'flex', 'flexFlow': 'row', 'position': 'relative'}},
         [accessoryComponent.element, removeButton, accTooltip]);
      var validateAndUpdateIcon = function () {
         if ((!curAccessory) || LLConst.Accessory.canEquipAccessory(curAccessory, curLevel, curCardId)) {
            if (!isValid) {
               if (accessoryComponent.element) {
                  accessoryComponent.element.style.filter = '';
               }
               accTooltip.style.display = 'none';
               accTooltip.className = '';
               isValid = true;
            }
         } else {
            if (isValid) {
               if (accessoryComponent.element) {
                  accessoryComponent.element.style.filter = 'grayscale(100%)';
               }
               accTooltip.style.display = '';
               accTooltip.className = tooltipClassName;
               accTooltip.innerHTML = '不可装备';
               isValid = false;
            }
         }
         if (curAccessory !== undefined) {
            if (!isRemovable) {
               removeButton.style.display = '';
               isRemovable = true;
            }
         } else {
            if (isRemovable) {
               removeButton.style.display = 'none';
               isRemovable = false;
            }
         }
      };
      return {
         'set': function (accessorySaveData) {
            if ((!accessorySaveData) || (!accessorySaveData.id)) {
               curAccessory = undefined;
               accessoryComponent.setAccessory(undefined);
            } else {
               curAccessory = LLAccessoryData.getAllCachedBriefData()[accessorySaveData.id];
               accessoryComponent.setAccessory(curAccessory);
               curLevel = accessorySaveData.level;
            }
            validateAndUpdateIcon();
         },
         'get': function () {
            if (curAccessory) {
               return {
                  'id': curAccessory.id,
                  'level': curLevel
               };
            } else {
               return {};
            }
         },
         'updateMember': function(cardid) {
            curCardId = cardid;
            validateAndUpdateIcon();
         },
         'updateAccessoryLevel': function (level) {
            curLevel = level;
            validateAndUpdateIcon();
         },
         'getAccessoryId': function () {
            return (curAccessory ? curAccessory.id : undefined);
         },
         'getAccessoryLevel': function () {
            return curLevel;
         },
         'element': accContainer
      };
   }

   /** @type {LLH.Layout.Team.TeamTextCellCreator} */
   function textCreator(options, i) {
      var textElement = createElement('span');
      var curValue = '';
      return {
         'set': function(v) {
            if (curValue !== v) {
               curValue = v;
               textElement.innerHTML = v;
            }
         },
         'get': function() { return curValue; },
         'reset': function() { this.set(''); },
         'element': textElement
      };
   }

   /** @type {LLH.Layout.Team.TeamTextWithColorCellCreator} */
   function textWithColorCreator(options, i) {
      var textController = textCreator(options, i);
      return {
         'get': textController.get,
         'set': textController.set,
         'reset': textController.reset,
         'element': textController.element,
         'setColor': function(c) { textController.element.style.color = c; }
      };
   }

   /** @type {LLH.Layout.Team.TeamTextWithTooltipCellCreator} */
   function textWithTooltipCreator(options, i) {
      var textController = textCreator(options, i);
      var tooltipContent = createElement('span', {'className': 'tooltiptext'});
      var tooltipElement = createElement('span', {'className': 'lltooltip llsup'}, ['(*)', tooltipContent]);
      var tooltipComponent = new LLComponentBase(tooltipElement);
      tooltipComponent.hide();
      return {
         'get': textController.get,
         'set': textController.set,
         'reset': textController.reset,
         'element': [textController.element, tooltipElement],
         'setTooltip': function(v) {
            if (v === undefined) {
               tooltipComponent.hide();
            } else {
               tooltipContent.innerHTML = v;
               tooltipComponent.show();
            }
         }
      }
   }

   /**
    * @template GemIdType
    * @implements {LLH.Controller.ControllerBaseSingleElement}
    */
   class LLTeamGemListItemComponent {
      /** @param {LLH.Layout.Team.LLTeamGemListItemComponent_Options} options */
      constructor(options) {
         this.onDelete = options.onDelete;
         var me = this;
         this._btnName = createElement('button', {'type': 'button', 'className': 'btn btn-default'}, undefined, {'click': function () {
            if (me.onDelete) me.onDelete();
         }});
         /** @type {HTMLElement[]} */
         var dots = [];
         for (var i = 0; i < 8; i++) {
            dots.push(createElement('div', {'style': {'display': 'none'}}));
         }
         this._dots = dots;
         this._btnDots = createElement('span', {'className': options.dotClass}, dots);
         this._btnTooltip = createElement('span', {'className': 'tooltiptext' + (options.popLeft ? ' pop-left' : '')});
         this.element = createElement('div', {'className': 'lltooltip'}, [this._btnName, this._btnTooltip]);
         this._curSlot = 0;
         /** @type {GemIdType=} */
         this._curId = undefined;
      }
      /** @param {string} newName */
      setName(newName) {
         updateSubElements(this._btnName, [newName, this._btnDots], true);
      }
      /** @param {string} newColor */
      setGemColor(newColor) {
         for (var i = 0; i < 8; i++) {
            this._dots[i].style['background-color'] = newColor;
         }
      }
      /** @param {number} newSlot */
      setSlot(newSlot) {
         for (var i = 0; i < 8; i++) {
            this._dots[i].style.display = (i < newSlot ? '' : 'none');
         }
         this._curSlot = newSlot;
      }
      getSlot() {
         return this._curSlot;
      }
      /** @param {string} newTooltip */
      setTooltip(newTooltip) {
         this._btnTooltip.innerHTML = newTooltip + '<br/>点击移除该宝石';
      }
      /** @param {GemIdType} id */
      setId(id) {
         this._curId = id;
      }
      getId() {
         return this._curId;
      }
   }

   /** @extends {LLTeamGemListItemComponent<LLH.Internal.NormalGemCategoryIdType>} */
   class LLTeamNormalGemListItemComponent extends LLTeamGemListItemComponent {
      /** @param {LLH.Layout.Team.LLTeamNormalGemListItemComponent_Options} options */
      constructor(options) {
         super({'dotClass': 'gem-dot', 'popLeft': options.popLeft, 'onDelete': options.onDelete});
         this._attr = options.attribute;
         this.setId(options.metaId);
         this.setAttribute(options.attribute);
      }
      /** @param {LLH.Internal.NormalGemCategoryIdType} id */
      setId(id) {
         super.setId(id);
         var meta = LLConst.Gem.getNormalGemMeta(id);
         if (meta) {
            this.setName(LLConst.Gem.getNormalGemName(meta) || '未知宝石');
            this.setSlot(meta.slot);
            this.setTooltip(LLConst.Gem.getNormalGemNameAndDescription(meta));
         } else {
            this.setName('未知宝石');
            this.setSlot(1);
            this.setTooltip('未知宝石');
         }
      }
      /** @param {LLH.Core.AttributeAllType} [attr] */
      setAttribute(attr) {
         this._attr = attr;
         this.setGemColor(LLConst.Common.getAttributeColor(attr));
      }
   }

   /** @extends {LLTeamGemListItemComponent<LLH.Core.SisIdType>} */
   class LLTeamLAGemListItemComponent extends LLTeamGemListItemComponent {
      /** @param {LLH.Layout.Team.LLTeamLAGemListItemComponent_Options} options */
      constructor(options) {
         super({'dotClass': 'gem-square', 'popLeft': options.popLeft, 'onDelete': options.onDelete});
         this.setId(options.gemId);
      }
      /** @param {LLH.Core.SisIdType} id */
      setId(id) {
         super.setId(id);
         var gemData = LLSisData.getAllCachedBriefData()[id];
         this.setName(LLConst.Gem.getGemBriefDescription(gemData, true));
         this.setSlot(gemData.size);
         this.setTooltip(LLConst.Gem.getGemDescription(gemData, true));
         this.setGemColor(LLConst.Gem.getGemColor(gemData));
      }
   }

   /**
    * @template GemIdType
    * @template {LLTeamGemListItemComponent<GemIdType>} ItemType
    * @implements {LLH.Controller.ControllerBaseSingleElement}
    */
   class LLTeamGemListComponent {
      /** @param {number} position */
      constructor(position) {
         this.element = createElement('div', {'className': 'gem-list'});
         /** @type {ItemType[]} */
         this._listItemControllers = [];
         this._position = position;
         /** @type {((position: number, slots: number) => void) | undefined} */
         this.onListChange = undefined;
      }
      getCount() {
         return this._listItemControllers.length;
      }
      /** @param {number} itemIndex */
      getItemController(itemIndex) {
         return this._listItemControllers[itemIndex];
      }
      getTotalSlot() {
         var totalSlot = 0;
         for (var i = 0; i < this._listItemControllers.length; i++) {
            totalSlot += this._listItemControllers[i].getSlot();
         }
         return totalSlot;
      }
      /**
       * callback return true to break loop
       * @param {(itemController: ItemType, itemIndex: number) => boolean} callback 
       */
      forEachItemController(callback) {
         for (var i = 0; i < this._listItemControllers.length; i++) {
            if (callback(this._listItemControllers[i], i)) break;
         }
      }
      /**
       * @template T
       * @param {(itemController: ItemType, itemIndex: number) => T} callback
       */
      mapItemController(callback) {
         return this._listItemControllers.map(callback);
      }
      /** @param {ItemType} itemComponent */
      addListItem(itemComponent) {
         this._listItemControllers.push(itemComponent);
         updateSubElements(this.element, itemComponent.element);
      }
      /** @param {number} itemIndex */
      removeListItemByIndex(itemIndex) {
         if (itemIndex === undefined || itemIndex < 0 || itemIndex >= this._listItemControllers.length) {
            console.error('Invalid index to delete: ' + itemIndex);
            return false;
         }
         this.element.removeChild(this._listItemControllers[itemIndex].element);
         this._listItemControllers.splice(itemIndex, 1);
         return true;
      }
      /** @param {ItemType} itemComponent */
      removeListItemByController(itemComponent) {
         for (var i = 0; i < this._listItemControllers.length; i++) {
            if (itemComponent === this._listItemControllers[i]) {
               return this.removeListItemByIndex(i);
            }
         }
         console.error('Invalid controller to delete');
         console.info(itemComponent);
         return false;
      }
      /** @param {GemIdType} itemId */
      hasListItemId(itemId) {
         for (var i = 0; i < this._listItemControllers.length; i++) {
            if (this._listItemControllers[i].getId() == itemId) {
               return true;
            }
         }
         return false;
      }
      callbackListChange() {
         if (this.onListChange !== undefined) {
            this.onListChange(this._position, this.getTotalSlot());
         }
      }
   }

   /** @extends {LLTeamGemListComponent<LLH.Internal.NormalGemCategoryIdType, LLTeamNormalGemListItemComponent>} */
   class LLTeamNormalGemListComponent extends LLTeamGemListComponent {
      /** @param {number} position */
      constructor(position) {
         super(position);
         /** @type {LLH.Core.AttributeAllType=} */
         this._memberAttribute = undefined;
         /** @type {LLH.Core.AttributeType=} */
         this._mapAttribute = undefined;
      }
      get() {
         /** @type {LLH.Internal.NormalGemCategoryKeyType[]} */
         var ret = [];
         for (var i = 0; i < this.getCount(); i++) {
            var curItem = this.getItemController(i);
            var curId = curItem.getId();
            if (curId === undefined) {
               console.warn('Unexpected empty normal gem list item');
               console.info(curItem);
               continue;
            }
            var curMeta = LLConst.Gem.getNormalGemMeta(curId);
            if (curMeta === undefined) {
               console.warn('Unknown normal gem id ' + curId);
               continue;
            }
            ret.push(curMeta.key);
         }
         return ret;
      }
      /** @param {LLH.Internal.NormalGemCategoryKeyType[]} [normalGemMetaKeyList] */
      set(normalGemMetaKeyList) {
         if (normalGemMetaKeyList === undefined) {
            normalGemMetaKeyList = [];
         }
         var i = 0;
         for (; i < normalGemMetaKeyList.length; i++) {
            /** @type {LLH.Internal.NormalGemCategoryIdType=} */
            var curId = LLConst.GemType[normalGemMetaKeyList[i]];
            if (curId === undefined) continue;
            if (i < this.getCount()) {
               var curController = this.getItemController(i);
               if (curController.getId() != curId) {
                  curController.setId(curId);
                  curController.setAttribute(this._getAttributeForGem(curId))
               }
            } else {
               this._addListItem(curId, false);
            }
         }
         for (; i < this.getCount();) {
            this.removeListItemByIndex(i);
         }
         this.callbackListChange();
      }
      /**
       * @param {LLH.Core.AttributeAllType} [memberAttr] 
       * @param {LLH.Core.AttributeType} [mapAttr] 
       */
      setAttributes(memberAttr, mapAttr) {
         if (memberAttr !== undefined) {
            this._memberAttribute = memberAttr;
         }
         if (mapAttr !== undefined) {
            this._mapAttribute = mapAttr;
         }
         for (var i = 0; i < this.getCount(); i++) {
            var curController = this.getItemController(i);
            var curId = curController.getId();
            if (curId === undefined) continue;
            curController.setAttribute(this._getAttributeForGem(curId));
         }
      }
      /** @param {LLH.Internal.NormalGemCategoryKeyType} normalGemMetaKey */
      add(normalGemMetaKey) {
         var gemId = LLConst.GemType[normalGemMetaKey];
         if (gemId === undefined) return;
         if (this.hasListItemId(gemId)) {
            console.info('Cannot add gem ' + normalGemMetaKey + ', it is already added');
            return;
         }
         this._addListItem(gemId, true);
      }
      /**
       * @param {LLH.Internal.NormalGemCategoryIdType} normalGemMetaId 
       * @param {boolean} doCallback 
       */
      _addListItem(normalGemMetaId, doCallback) {
         var me = this;
         var item = new LLTeamNormalGemListItemComponent({
            'attribute': this._getAttributeForGem(normalGemMetaId),
            'metaId': normalGemMetaId,
            'popLeft': (this._position >= 7),
            'onDelete': function () {
               me.removeListItemByController(item);
               me.callbackListChange();
            }
         });
         this.addListItem(item);
         if (doCallback) {
            this.callbackListChange();
         }
      }
      /** @param {LLH.Internal.NormalGemCategoryIdType} normalGemMetaId */
      _getAttributeForGem(normalGemMetaId) {
         if (LLConst.Gem.isGemFollowMemberAttribute(normalGemMetaId)) {
            // these gems use member attribute
            return this._memberAttribute;
         } else {
            // other gems use map attribute
            return this._mapAttribute;
         }
      }
   }

   /** @extends {LLTeamGemListComponent<LLH.Core.SisIdType, LLTeamLAGemListItemComponent>} */
   class LLTeamLAGemListComponent extends LLTeamGemListComponent {
      /** @param {number} position */
      constructor(position) {
         super(position);
      }
      get() {
         /** @type {LLH.Core.SisIdType[]} */
         var ret = [];
         for (var i = 0; i < this.getCount(); i++) {
            var curItem = this.getItemController(i);
            var curId = curItem.getId();
            if (curId === undefined) {
               console.warn('Unexpected empty normal gem list item');
               console.info(curItem);
               continue;
            }
            ret.push(curId);
         }
         return ret;
      }
      /** @param {LLH.Core.SisIdType[]} [gemIdList] */
      set(gemIdList) {
         if (gemIdList === undefined) {
            gemIdList = [];
         }
         var i = 0;
         for (; i < gemIdList.length; i++) {
            var curId = gemIdList[i];
            if (i < this.getCount()) {
               var curController = this.getItemController(i);
               if (curController.getId() != curId) {
                  curController.setId(curId);
               }
            } else {
               this._addListItem(curId, false);
            }
         }
         for (; i < this.getCount();) {
            this.removeListItemByIndex(i);
         }
         this.callbackListChange();
      }
      /** @param {LLH.Core.SisIdType} gemId */
      add(gemId) {
         if (gemId === undefined) return;
         if (this.hasListItemId(gemId)) {
            console.info('Cannot add gem ' + gemId + ', it is already added');
            return;
         }
         this._addListItem(gemId, true);
      }
      /**
       * @param {LLH.Core.SisIdType} gemId 
       * @param {boolean} doCallback 
       */
      _addListItem(gemId, doCallback) {
         var me = this;
         var item = new LLTeamLAGemListItemComponent({
            'gemId': gemId,
            'popLeft': (this._position >= 7),
            'onDelete': function () {
               me.removeListItemByController(item);
               me.callbackListChange();
            }
         });
         this.addListItem(item);
         if (doCallback) {
            this.callbackListChange();
         }
      }
   }

   /** @type {LLH.Layout.Team.TeamNormalGemListCellCreator} */
   function normalGemListCreator(options, i) {
      var ret = new LLTeamNormalGemListComponent(i);
      ret.onListChange = options.onListChange;
      return ret;
   }

   /** @type {LLH.Layout.Team.TeamLAGemListCellCreator} */
   function laGemListCreator(options, i) {
      var ret = new LLTeamLAGemListComponent(i);
      ret.onListChange = options.onListChange;
      return ret;
   }

   /**
    * @param {Partial<LLH.Layout.Team.TeamControllers>} controllers 
    * @param {(keyof LLH.Layout.Team.TeamControllers)[]} keys 
    * @param {boolean} isFold 
    */
   function foldRows(controllers, keys, isFold) {
      for (var i = 0; i < keys.length; i++) {
         var rowController = controllers[keys[i]];
         if (rowController) {
            if (isFold) {
               if (rowController.hide) {
                  rowController.hide();
               }
            } else {
               if (rowController.show) {
                  rowController.show();
               }
            }
         }
      }
   }

   /**
    * @template {LLH.Controller.ControllerBase} TCellController
    * @template {LLH.Layout.Team.TeamRowOptionBase} TRowOption
    * @param {LLH.Layout.Team.TeamCellCreator<TCellController, TRowOption>} cellCreator 
    * @param {TRowOption} options 
    * @param {Partial<LLH.Layout.Team.TeamControllers>} controllers 
    */
   function createRow(cellCreator, options, controllers) {
      var headElement;
      /** @type {(() => void) | undefined} */
      var toggleFold = undefined;
      if (options.owning) {
         var arrowSpan = createElement('span', {'className': 'tri-down'});
         var textSpan = createElement('span', {'innerHTML': options.head});
         var visible = true;
         var owning = options.owning;
         toggleFold = function () {
            if (visible) {
               foldRows(controllers, owning, true);
               arrowSpan.className = 'tri-right';
               visible = false;
            } else {
               foldRows(controllers, owning, false);
               arrowSpan.className = 'tri-down';
               visible = true;
            }
         };
         headElement = createElement('th', {'scope': 'row'}, [arrowSpan, textSpan], {
            'click': toggleFold
         });
         headElement.style.cursor = 'pointer';
      } else {
         headElement = createElement('th', {'scope': 'row', 'innerHTML': options.head});
      }
      /** @type {LLH.Layout.Team.TeamRowController<TCellController, TRowOption>['setByMember']} */
      var setByMember = undefined;
      /** @type {LLH.Layout.Team.TeamRowController<TCellController, TRowOption>['setToMember']} */
      var setToMember = undefined;
      if (options.memberKey) {
         var memberKey = options.memberKey;
         var memberDefault = options.memberDefault;
         setByMember = function(i, member) {
            if (member[memberKey] !== undefined) {
               this.cells[i].set(member[memberKey]);
            } else if (memberDefault !== undefined) {
               this.cells[i].set(memberDefault);
            }
         };
         setToMember = function(i, member) {
            member[memberKey] = this.cells[i].get();
         };
      }
      if (options.headColor) {
         headElement.style.color = options.headColor;
      }
      var cells = [headElement];
      var cellControllers = [];
      for (var i = 0; i < 9; i++) {
         var cellController = cellCreator(options, i);
         var tdElement = createElement('td', undefined, cellController.element);
         if (options.cellColor) {
            tdElement.style.color = options.cellColor;
         }
         cells.push(tdElement);
         cellControllers.push(cellController);
      }
      var rowElement = createElement('tr', undefined, cells);
      var rowComponent = new LLComponentBase(rowElement);

      /** @type {LLH.Layout.Team.TeamRowController<TCellController>} */
      var rowController = {
         'cells': cellControllers,
         'show': function () { rowComponent.show(); },
         'hide': function () { rowComponent.hide(); },
         'toggleFold': toggleFold,
         'setByMember': setByMember,
         'setToMember': setToMember,
         'element': rowElement
      };
      return rowController;
   }

   /** @template T */
   function createInMemoryCell() {
      /** @type {T=} */
      var value = undefined;
      /** @type {LLH.Layout.Team.TeamInMemoryCellController<T>} */
      var cellController = {
         'get': function () { return value; },
         'set': function (v) { value = v; }
      };
      return cellController;
   }

   /**
    * @template {keyof LLH.Internal.MemberSaveDataType} K
    * @param {LLH.Layout.Team.TeamInMemoryRowOption<K>} options
    */
   function createInMemoryRow(options) {
      /** @type {LLH.Layout.Team.TeamInMemoryCellController<LLH.Internal.MemberSaveDataType[K]>[]} */
      var cells = [];
      for (var i = 0; i < 9; i++) {
         cells.push(createInMemoryCell());
      }
      /** @type {LLH.Layout.Team.TeamInMemoryRowController<LLH.Internal.MemberSaveDataType[K]>} */
      var rowController = {
         'cells': cells,
         'setByMember': function(i, member) {
            if (member[options.memberKey] !== undefined) {
               this.cells[i].set(member[options.memberKey]);
            } else if (options.memberDefault !== undefined) {
               this.cells[i].set(options.memberDefault);
            }
         },
         'setToMember': function(i, member) {
            member[options.memberKey] = this.cells[i].get();
         }
      };
      return rowController;
   }

   /**
    * @template T
    * @param {*} target 
    * @param {(i: LLH.Layout.Team.IndexType) => T} method 
    */
   function doGet9Function(target, method) {
      /** @type {T[]} */
      var ret = [];
      for (var i = 0; i < 9; i++) {
         ret.push(method.call(target, i));
      }
      return ret;
   }
   /**
    * @template T
    * @param {T[] | undefined} val 
    * @param {*} target
    * @param {(i: LLH.Layout.Team.IndexType, v: T | undefined) => void} method 
    */
   function doSet9Function(val, target, method) {
      for (var i = 0; i < 9; i++) {
         method.call(target, i, val && val[i]);
      }
   }
   /**
    * @param {number[]} arr 
    * @param {LLH.Layout.Team.TeamRowController<LLH.Layout.Team.TeamTextWithColorCellController>} [rowController] 
    */
   function doHighlightMinCell(arr, rowController) {
      if (rowController === undefined) return;
      var minVal = undefined;
      var i;
      var cells = rowController.cells;
      for (i = 0; i < arr.length; i++) {
         if (minVal === undefined || arr[i] < minVal) minVal = arr[i];
         cells[i].set(arr[i] + '');
      }
      for (i = 0; i < arr.length; i++) {
         cells[i].setColor((arr[i] == minVal) ? 'red' : '');
      }
   }
   /** @param {number} [count] */
   function countNumberToString(count) {
      if (count === undefined) return '';
      return LLUnit.numberToString(count, 2);
   }

   /**
    * @param {LLH.Layout.Team.LLTeamComponent} controller
    * @param {LLH.Layout.LayoutMode} mode
    */
   function createTeamTable(controller, mode) {
      var rows = [];
      /** @type {LLH.Layout.Team.TeamControllers} */
      var controllersNew = {};
      var isLAGem = (mode == 'la');
      /** @type {LLH.Layout.Team.LLTeamGemListComponent_OnListChangeCallback} */
      var updateSlot = function(i, slots) {
         controllersNew.slot.cells[i].setUsedSlot(slots);
      };
      /**
       * @template {LLH.Controller.ControllerBase} TCellController
       * @template {LLH.Layout.Team.TeamRowOptionBase} TRowOption
       * @param {LLH.Layout.Team.TeamCellCreator<TCellController, TRowOption>} cellCreator 
       * @param {TRowOption} options 
       */
      var addRow = function (cellCreator, options) {
         var controller = createRow(cellCreator, options, controllersNew);
         rows.push(controller.element);
         return controller;
      }
      /** @type {LLH.Component.CreateElementOptions} */
      var number3Config = {'type': 'number', 'step': 'any', 'size': 3, 'autocomplete': 'off', 'className': 'form-control num-size-3', 'value': '0'};
      /** @type {LLH.Component.CreateElementOptions} */
      var number1Config = {'type': 'number', 'step': '1', 'size': 1, 'autocomplete': 'off', 'className': 'form-control num-size-1', 'value': '1'};
      controllersNew.weight = addRow(inputCellCreator, {'head': '权重', 'elementOptions': number3Config, 'converter': parseFloat});
      addRow(buttonCreator, {'head': '放卡', 'clickFunc': function(i) {
         controller.onPutCardClicked && controller.onPutCardClicked(i);
         if (i == 4 && controller.onCenterChanged) controller.onCenterChanged();
      }});
      controllersNew.avatar = addRow(avatarCreator, {'head': '卡片'});
      controllersNew.info = addRow(textCreator, {'head': '基本信息', 'owning': ['info_name', 'skill_trigger', 'skill_effect']});
      controllersNew.info_name = addRow(textCreator, {'head': '名字'});
      controllersNew.skill_trigger = addRow(textCreator, {'head': '技能条件'});
      controllersNew.skill_effect = addRow(textCreator, {'head': '技能类型'});
      controllersNew.hp = addRow(inputCellCreator, {'head': 'HP', 'elementOptions': number1Config, 'converter': parseInt, 'memberKey': 'hp', 'memberDefault': 1});
      controllersNew.smile = addRow(inputCellCreator, {'head': 'smile', 'elementOptions': number3Config, 'converter': parseInt,
         'headColor': 'red', 'cellColor': 'red', 'memberKey': 'smile', 'memberDefault': 0});
      controllersNew.pure = addRow(inputCellCreator, {'head': 'pure', 'elementOptions': number3Config, 'converter': parseInt,
         'headColor': 'green', 'cellColor': 'green', 'memberKey': 'pure', 'memberDefault': 0});
      controllersNew.cool = addRow(inputCellCreator, {'head': 'cool', 'elementOptions': number3Config, 'converter': parseInt,
         'headColor': 'blue', 'cellColor': 'blue', 'memberKey': 'cool', 'memberDefault': 0});
      controllersNew.skill_level = addRow(skillLevelCellCreator, {'head': '技能等级', 'memberKey': 'skilllevel'});
      controllersNew.slot = addRow(slotCellCreator, {'head': '使用槽数', 'owning': ['put_gem', 'gem_list', 'la_gem_list']});
      controllersNew.put_gem = addRow(buttonCreator, {'head': '放宝石', 'clickFunc': function (i) {
         if (controller.onPutGemClicked) {
            var gemKey = controller.onPutGemClicked(i);
            if (controllersNew.la_gem_list) {
               controllersNew.la_gem_list.cells[i].add(gemKey)
            } else if (controllersNew.gem_list) {
               if (LLConst.GemType[gemKey] !== undefined) {
                  controllersNew.gem_list.cells[i].add(gemKey);
               }
            }
         }
      }});

      if (!isLAGem) {
         controllersNew.gem_list = addRow(normalGemListCreator, {'head': '圆宝石', 'onListChange': updateSlot, 'memberKey': 'gemlist'});
         controllersNew.in_memory_la_gem_list = createInMemoryRow({'memberKey': 'laGemList'});
      } else {
         controllersNew.in_memory_gem_list = createInMemoryRow({'memberKey': 'gemlist'});
         controllersNew.la_gem_list = addRow(laGemListCreator, {'head': '方宝石', 'onListChange': updateSlot, 'memberKey': 'laGemList'});
      }
      controllersNew.put_accessory = addRow(buttonCreator, {'head': '放饰品', 'clickFunc': function (i) {
         if (controller.onPutAccessoryClicked) {
            controller.setAccessory(i, controller.onPutAccessoryClicked(i));
         }
      }})
      controllersNew.accessory_icon = addRow(accessoryIconCreator, {'head': '饰品', 'teamComponent': controller});
      controllersNew.accessory_level = addRow(skillLevelCellCreator, {'head': '饰品等级', 'onChange': (i, level) => controller._updateAccessoryLevel(i, level),
         'owning': ['accessory_smile', 'accessory_pure', 'accessory_cool']});
      controllersNew.accessory_smile = addRow(textCreator, {'head': '饰品smile', 'headColor': 'red', 'cellColor': 'red'});
      controllersNew.accessory_pure = addRow(textCreator, {'head': '饰品pure', 'headColor': 'green', 'cellColor': 'green'});
      controllersNew.accessory_cool = addRow(textCreator, {'head': '饰品cool', 'headColor': 'blue', 'cellColor': 'blue'});
      addRow(swapperCreator, {'head': '换位', 'teamComponent': controller});
      controllersNew.str_attr = addRow(textCreator, {'head': '属性强度'})
      if (!isLAGem) {
         controllersNew.str_skill_theory = addRow(textWithTooltipCreator, {'head': '技能强度（理论）'});
         controllersNew.str_card_theory = addRow(textWithColorCreator, {'head': '卡强度（理论）'})
      }
      controllersNew.str_debuff = addRow(textCreator, {'head': '异色异团惩罚'});
      if (!isLAGem) {
         controllersNew.str_total_theory = addRow(textWithColorCreator, {'head': '实际强度（理论）'});
      }
      controllersNew.skill_active_count_sim = addRow(textCreator, {'head': '技能发动次数（模拟）', 'owning': [
         'skill_active_chance_sim', 'skill_active_no_effect_sim', 'skill_active_half_effect_sim',
         'accessory_active_count_sim', 'accessory_active_chance_sim', 'accessory_active_no_effect_sim', 'accessory_active_half_effect_sim'
      ]});
      controllersNew.skill_active_chance_sim = addRow(textCreator, {'head': '技能发动条件达成次数（模拟）'});
      controllersNew.skill_active_no_effect_sim = addRow(textCreator, {'head': '技能哑火次数（模拟）'});
      controllersNew.skill_active_half_effect_sim = addRow(textCreator, {'head': '技能半哑火次数（模拟）'});
      controllersNew.accessory_active_count_sim = addRow(textCreator, {'head': '饰品发动次数（模拟）'});
      controllersNew.accessory_active_chance_sim = addRow(textCreator, {'head': '饰品发动条件达成次数（模拟）'});
      controllersNew.accessory_active_no_effect_sim = addRow(textCreator, {'head': '饰品哑火次数（模拟）'});
      controllersNew.accessory_active_half_effect_sim = addRow(textCreator, {'head': '饰品半哑火次数（模拟）'});
      controllersNew.heal = addRow(textCreator, {'head': '回复'});

      if (controllersNew.info.toggleFold) controllersNew.info.toggleFold();
      if (controllersNew.skill_active_count_sim.toggleFold) controllersNew.skill_active_count_sim.toggleFold();

      /** @type {LLH.Layout.Team.LLTeamComponent_Controller} */
      var mainController = {
         'controllers': controllersNew,
         'element': createElement('table', {'className': 'table table-bordered table-hover table-condensed team-table'}, [
            createElement('tbody', undefined, rows)
         ]),
         'isLAGem': isLAGem,
         'swapper': new LLSwapper()
      }
      return mainController;
   }

   /** @extends {LLH.Mixin.SaveLoadJsonBase<LLH.Internal.MemberSaveDataType[]>} */
   class LLTeamComponent_cls extends SaveLoadJsonBase {
      /**
       * @param {LLH.Component.HTMLElementOrId} id 
       * @param {LLH.Layout.Team.LLTeamComponent_Options} options 
       */
      constructor(id, options) {
         super();
         var element = LLUnit.getElement(id);
         var mainController = createTeamTable(this, (options && options.mode) || 'normal');
         element.appendChild(mainController.element);
         this._controller = mainController;
         this.onPutCardClicked = options && options.onPutCardClicked;
         this.onPutGemClicked = options && options.onPutGemClicked;
         this.onCenterChanged = options && options.onCenterChanged;
         this.onPutAccessoryClicked = options && options.onPutAccessoryClicked;
      }
      /**
       * @param {LLH.Layout.Team.IndexType} i 
       * @param {LLH.Internal.MemberSaveDataType} [member] 
       */
      putMember(i, member) {
         /** @type {Partial<LLH.Internal.MemberSaveDataType>} */
         var partialMember = member || {};
         var controllers = this._controller.controllers;
         for (var k in controllers) {
            if (controllers[k].setByMember) {
               controllers[k].setByMember(i, partialMember);
            }
         }
         controllers.avatar.cells[i].update(partialMember.cardid, partialMember.mezame);
         var cardid = controllers.avatar.cells[i].getCardId();
         var isMezame = controllers.avatar.cells[i].getMezame();
         var cardbrief = undefined;
         if (cardid) {
            cardbrief = ((LLCardData && LLCardData.getAllCachedBriefData()) || {})[cardid];
         }
         if (cardbrief) {
            controllers.info.cells[i].set(cardbrief.attribute);
            controllers.info_name.cells[i].set(LLConst.Member.getMemberName(cardbrief.typeid, LLConstValue.LANGUAGE_CN));
            controllers.skill_trigger.cells[i].set(LLConst.Skill.getSkillTriggerText(cardbrief.triggertype));
            controllers.skill_effect.cells[i].set(LLConst.Skill.getEffectBrief(cardbrief.skilleffect));
            if (partialMember.hp === undefined) {
               controllers.hp.cells[i].set(isMezame ? cardbrief.hp+1 : cardbrief.hp);
            }
            if (controllers.gem_list) {
               controllers.gem_list.cells[i].setAttributes(cardbrief.attribute);
            }
         } else {
            controllers.info.cells[i].reset();
            controllers.info_name.cells[i].reset();
            controllers.skill_trigger.cells[i].reset();
            controllers.skill_effect.cells[i].reset();
            if (controllers.gem_list) {
               controllers.gem_list.cells[i].setAttributes('all');
            }
         }
         if (partialMember.maxcost !== undefined) {
            controllers.slot.cells[i].setMaxSlot(partialMember.maxcost);
         } else if (cardbrief && cardbrief.rarity) {
            controllers.slot.cells[i].setMaxSlot(LLConst.Common.getDefaultMinSlot(cardbrief.rarity));
         }
         if (partialMember.accessory !== undefined) {
            this.setAccessory(i, partialMember.accessory);
         }
         controllers.accessory_icon.cells[i].updateMember(cardid);
         if (i == 4 && this.onCenterChanged) this.onCenterChanged();
      }
      /**
       * @param {LLH.Layout.Team.IndexType} i 
       * @param {LLH.Internal.MemberSaveDataType} [member] 
       */
      setMember(i, member) {
         this.putMember(i, member);
      }
      /** @param {LLH.Internal.MemberSaveDataType[]} [members] */
      setMembers(members) { doSet9Function(members, this, this.putMember); }
      /** @param {LLH.Layout.Team.IndexType} i */
      getMember(i) {
         var controllers = this._controller.controllers;
         /** @type {LLH.Internal.MemberSaveDataType} */
         var retMember = {};
         for (var k in controllers) {
            if (controllers[k].setToMember) {
               controllers[k].setToMember(i, retMember);
            }
         }
         retMember.cardid = controllers.avatar.cells[i].getCardId();
         retMember.mezame = controllers.avatar.cells[i].getMezame();
         retMember.maxcost = controllers.slot.cells[i].getMaxSlot();
         retMember.accessory = controllers.accessory_icon.cells[i].get();
         return retMember;
      }
      getMembers() { return doGet9Function(this, this.getMember); }
      /**
       * @param {LLH.Layout.Team.IndexType} i 
       * @param {LLH.Model.LLSisGem[]} gems 
       */
      setMemberGem(i, gems) {
         /** @type {LLH.Internal.NormalGemCategoryKeyType[]} */
         var gemList = [];
         for (var j = 0; j < gems.length; j++) {
            var curGem = gems[j];
            var gemMeta = LLConst.Gem.getNormalGemMeta(curGem.getNormalGemType());
            if (gemMeta) {
               gemList.push(gemMeta.key);
            }
         }
         var controllers = this._controller.controllers;
         if (controllers.gem_list) {
            controllers.gem_list.cells[i].set(gemList);
         } else if (controllers.in_memory_gem_list) {
            controllers.in_memory_gem_list.cells[i].set(gemList);
         }
      }
      /**
       * @param {LLH.Layout.Team.IndexType} i 
       * @param {LLH.Internal.AccessorySaveDataType} [accessory] 
       */
      setAccessory(i, accessory) {
         var controllers = this._controller.controllers;
         if (accessory && accessory.id !== undefined && accessory.level !== undefined) {
            var accessoryBrief = LLAccessoryData.getAllCachedBriefData()[accessory.id];
            controllers.accessory_icon.cells[i].set(accessory);
            controllers.accessory_level.cells[i].set(accessory.level);
            controllers.accessory_level.cells[i].setMaxLevel(accessoryBrief.max_level);
            this._updateAccessoryLevel(i, accessory.level);
         } else {
            controllers.accessory_icon.cells[i].set(undefined);
            controllers.accessory_level.cells[i].set(1);
            controllers.accessory_level.cells[i].setMaxLevel(8);
            this._updateAccessoryLevel(i, 1);
         }
      }
      /** @param {LLH.Layout.Team.IndexType} i */
      getCardId(i) { return this._controller.controllers.avatar.cells[i].getCardId(); }
      getCardIds() { return doGet9Function(this, this.getCardId); }
      /** @param {LLH.Layout.Team.IndexType} i */
      getAccessoryId(i) { return this._controller.controllers.accessory_icon.cells[i].getAccessoryId() || ''; }
      getAccessoryIds() { return doGet9Function(this, this.getAccessoryId); }
      /** @param {LLH.Layout.Team.IndexType} i */
      getWeight(i) { return this._controller.controllers.weight.cells[i].get(); }
      getWeights() { return doGet9Function(this, this.getWeight); }
      /** @type {(i: LLH.Layout.Team.IndexType, w?: number) => void} */
      setWeight(i, w) { this._controller.controllers.weight.cells[i].set(w || 0); }
      /** @param {number[]} [weights] */
      setWeights(weights) { doSet9Function(weights, this, this.setWeight); }
      /** @param {LLH.Misc.LLSwapper} swapper */
      setSwapper(swapper) { this._controller.swapper = swapper; }
      getSwapper() { return this._controller.swapper; }
      /** @param {LLH.Core.AttributeType} attribute */
      setMapAttribute(attribute) {
         var controllers = this._controller.controllers;
         if (controllers.gem_list) {
            controllers.gem_list.cells.forEach(cell => cell.setAttributes(undefined, attribute));
         }
      }
      isAllMembersPresent() {
         var cardIds = this.getCardIds();
         for (var i = 0; i < cardIds.length; i++) {
            if (!cardIds[i]) return false;
         }
         return true;
      }

      //===== results =====
      /** @type {(i: LLH.Layout.Team.IndexType, s?: number) => void} */
      setStrengthAttribute(i, strength) { this._controller.controllers.str_attr.cells[i].set(strength === undefined ? '' : strength + ''); }
      /** @param {number[]} [strengths] */
      setStrengthAttributes(strengths) { doSet9Function(strengths, this, this.setStrengthAttribute); }
      /** @type {(i: LLH.Layout.Team.IndexType, s?: number) => void} */
      setStrengthDebuff(i, strength) { this._controller.controllers.str_debuff.cells[i].set(strength === undefined ? '' : (-strength) + ''); }
      /** @param {number[]} [strengths] */
      setStrengthDebuffs(strengths) { doSet9Function(strengths, this, this.setStrengthDebuff); }
      /** @param {number[]} strengths */
      setStrengthCardTheories(strengths) { doHighlightMinCell(strengths, this._controller.controllers.str_card_theory); }
      /** @param {number[]} strengths */
      setStrengthTotalTheories(strengths) { doHighlightMinCell(strengths, this._controller.controllers.str_total_theory); }
      /**
       * @param {LLH.Layout.Team.IndexType} i 
       * @param {number} strength 
       * @param {boolean} strengthSupported 
       */
      setStrengthSkillTheory(i, strength, strengthSupported) {
         var rowController = this._controller.controllers.str_skill_theory;
         if (rowController === undefined) return;
         var cell = rowController.cells[i];
         cell.set(strength + '');
         cell.setTooltip(strengthSupported ? undefined : '该技能暂不支持理论强度计算，仅支持模拟');
      }
      /** @type {(i: LLH.Layout.Team.IndexType, c?: number) => void} */
      setSkillActiveCountSim(i, count) { this._controller.controllers.skill_active_count_sim.cells[i].set(countNumberToString(count)); }
      /** @param {number[]} [counts] */
      setSkillActiveCountSims(counts) { doSet9Function(counts, this, this.setSkillActiveCountSim); }
      /** @type {(i: LLH.Layout.Team.IndexType, c?: number) => void} */
      setSkillActiveChanceSim(i, count) { this._controller.controllers.skill_active_chance_sim.cells[i].set(countNumberToString(count)); }
      /** @param {number[]} [counts] */
      setSkillActiveChanceSims(counts) { doSet9Function(counts, this, this.setSkillActiveChanceSim); }
      /** @type {(i: LLH.Layout.Team.IndexType, c?: number) => void} */
      setSkillActiveNoEffectSim(i, count) { this._controller.controllers.skill_active_no_effect_sim.cells[i].set(countNumberToString(count)); }
      /** @param {number[]} [counts] */
      setSkillActiveNoEffectSims(counts) { doSet9Function(counts, this, this.setSkillActiveNoEffectSim); }
      /** @type {(i: LLH.Layout.Team.IndexType, c?: number) => void} */
      setSkillActiveHalfEffectSim(i, count) { this._controller.controllers.skill_active_half_effect_sim.cells[i].set(countNumberToString(count)); }
      /** @param {number[]} [counts] */
      setSkillActiveHalfEffectSims(counts) { doSet9Function(counts, this, this.setSkillActiveHalfEffectSim); }
      /** @type {(i: LLH.Layout.Team.IndexType, c?: number) => void} */
      setAccessoryActiveCountSim(i, count) { this._controller.controllers.accessory_active_count_sim.cells[i].set(countNumberToString(count)); }
      /** @param {number[]} [counts] */
      setAccessoryActiveCountSims(counts) { doSet9Function(counts, this, this.setAccessoryActiveCountSim); }
      /** @type {(i: LLH.Layout.Team.IndexType, c?: number) => void} */
      setAccessoryActiveChanceSim(i, count) { this._controller.controllers.accessory_active_chance_sim.cells[i].set(countNumberToString(count)); }
      /** @param {number[]} [counts] */
      setAccessoryActiveChanceSims(counts) { doSet9Function(counts, this, this.setAccessoryActiveChanceSim); }
      /** @type {(i: LLH.Layout.Team.IndexType, c?: number) => void} */
      setAccessoryActiveNoEffectSim(i, count) { this._controller.controllers.accessory_active_no_effect_sim.cells[i].set(countNumberToString(count)); }
      /** @param {number[]} [counts] */
      setAccessoryActiveNoEffectSims(counts) { doSet9Function(counts, this, this.setAccessoryActiveNoEffectSim); }
      /** @type {(i: LLH.Layout.Team.IndexType, c?: number) => void} */
      setAccessoryActiveHalfEffectSim(i, count) { this._controller.controllers.accessory_active_half_effect_sim.cells[i].set(countNumberToString(count)); }
      /** @param {number[]} [counts] */
      setAccessoryActiveHalfEffectSims(counts) { doSet9Function(counts, this, this.setAccessoryActiveHalfEffectSim); }
      /** @type {(i: LLH.Layout.Team.IndexType, h: number) => void} */
      setHeal(i, heal) { this._controller.controllers.heal.cells[i].set(LLUnit.healNumberToString(heal)); }
      /** @param {LLH.Model.LLTeam} result */
      setResult(result) {
         var cardStrengthList = [], totalStrengthList = [];
         var calResult = result.getResults();
         for (var i=0;i<9;i++){
            var avgSkill = (result.avgSkills ? result.avgSkills[i] : undefined);
            var avgSkillStrength = (avgSkill ? avgSkill.strength : 0);
            var avgSkillHeal = (avgSkill ? avgSkill.averageHeal : 0);
            var curCardStrength = calResult.attrStrength[i]+avgSkillStrength;
            var curStrength = curCardStrength - (result.attrDebuff ? result.attrDebuff[i] : 0);
            cardStrengthList.push(curCardStrength);
            totalStrengthList.push(curStrength);
            this.setStrengthSkillTheory(i, avgSkillStrength, LLConst.Skill.isStrengthSupported(result.members[i].card));
            this.setHeal(i, avgSkillHeal);
         }
   
         this.setStrengthAttributes(calResult.attrStrength);
         this.setStrengthCardTheories(cardStrengthList);
         this.setStrengthTotalTheories(totalStrengthList);
         this.setSkillActiveCountSims(calResult.averageSkillsActiveCount);
         this.setSkillActiveChanceSims(calResult.averageSkillsActiveChanceCount);
         this.setSkillActiveNoEffectSims(calResult.averageSkillsActiveNoEffectCount);
         this.setSkillActiveHalfEffectSims(calResult.averageSkillsActiveHalfEffectCount);
         this.setAccessoryActiveCountSims(calResult.averageAccessoryActiveCount);
         this.setAccessoryActiveChanceSims(calResult.averageAccessoryActiveChanceCount);
         this.setAccessoryActiveNoEffectSims(calResult.averageAccessoryActiveNoEffectCount);
         this.setAccessoryActiveHalfEffectSims(calResult.averageAccessoryActiveHalfEffectCount);
      }
      //===== internal methods =====
      /**
       * @param {LLH.Layout.Team.IndexType} i 
       * @param {number} level 1~8
       */
      _updateAccessoryLevel(i, level) {
         var controllers = this._controller.controllers;
         var me = this;
         controllers.accessory_icon.cells[i].updateAccessoryLevel(level);
         var accessoryId = controllers.accessory_icon.cells[i].getAccessoryId();
         if (accessoryId) {
            var detail = LLAccessoryData.getCachedDetailedData(accessoryId);
            if (detail) {
               me._updateAccessoryAttribute(i, LLConst.Accessory.getAccessoryLevelAttribute(detail, level));
            } else {
               me._updateAccessoryAttribute(i, '...');
               LoadingUtil.startSingle(LLAccessoryData.getDetailedData(accessoryId)).then(function (accessory) {
                  if (level == controllers.accessory_icon.cells[i].getAccessoryLevel()
                     && accessoryId == controllers.accessory_icon.cells[i].getAccessoryId()
                  ) {
                     me._updateAccessoryAttribute(i, LLConst.Accessory.getAccessoryLevelAttribute(accessory, level));
                  }
               });
            }
         } else {
            me._updateAccessoryAttribute(i, '');
         }
      }
      /**
       * @param {LLH.Layout.Team.IndexType} i 
       * @param {string | LLH.Internal.AttributesValue} attribute 
       */
      _updateAccessoryAttribute(i, attribute) {
         var controllers = this._controller.controllers;
         if (typeof(attribute) == 'string') {
            controllers.accessory_smile.cells[i].set(attribute);
            controllers.accessory_pure.cells[i].set(attribute);
            controllers.accessory_cool.cells[i].set(attribute);
         } else {
            controllers.accessory_smile.cells[i].set(attribute.smile + '');
            controllers.accessory_pure.cells[i].set(attribute.pure + '');
            controllers.accessory_cool.cells[i].set(attribute.cool + '');
         }
      }

      //===== override =====
      saveData() {
         return this.getMembers();
      }
      /** @param {LLH.Internal.MemberSaveDataType[]} [members] */
      loadData(members) {
         if (!members) return;
         LLSaveData.normalizeMemberGemList(members);
         this.setMembers(members);
      }
   }

   return LLTeamComponent_cls;
})();

var LLCSkillComponent = (function () {
   var createElement = LLUnit.createElement;
   var defaultCSkill = LLConst.Common.getZeroCSkill();
   var majorPercentageSelectOptions = [
      {'value': '0', 'text': '0'},
      {'value': '3', 'text': '3'},
      {'value': '4', 'text': '4'},
      {'value': '6', 'text': '6'},
      {'value': '7', 'text': '7'},
      {'value': '9', 'text': '9'},
      {'value': '12', 'text': '12'}
   ];
   var secondPercentageSelectOptions = [
      {'value': '0', 'text': '0'},
      {'value': '1', 'text': '1'},
      {'value': '2', 'text': '2'},
      {'value': '3', 'text': '3'},
      {'value': '6', 'text': '6'},
      {'value': '7', 'text': '7'},
      {'value': '9', 'text': '9'}
   ];
   function getSecondLimitSelectOptions() {
      /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
      var ret = [];
      var groups = LLConst.Common.getCSkillGroups();
      for (var i = 0; i < groups.length; i++) {
         ret.push({'value': groups[i] + '', 'text': LLConst.Group.getGroupName(groups[i])});
      }
      return ret;
   };

   /**
    * @param {string} title 
    * @returns {LLH.Layout.CenterSkill.LLCSkillComponent_Controller}
    */
   function createTextDisplay(title) {
      var textElement = createElement('span', {'innerHTML': title + 'N/A'});
      var cskill = LLConst.Common.copyCSkill(defaultCSkill);
      /** @type {LLH.Layout.CenterSkill.LLCSkillComponent_Controller} */
      var controller = {
         'setCSkill': function(cs) {
            if (cs.attribute) {
               textElement.innerHTML = title + LLUnit.getCardCSkillText(cs, false);
               LLConst.Common.copyCSkill(cs, cskill);
            } else {
               textElement.innerHTML = title + 'N/A';
               LLConst.Common.copyCSkill(defaultCSkill, cskill);
            }
         },
         'getCSkill': function() {
            return cskill;
         },
         'setMapColor': function(color) {
            // do nothing
         },
         'element': textElement
      };
      return controller;
   }
   /**
    * @param {string} title 
    * @returns {LLH.Layout.CenterSkill.LLCSkillComponent_Controller}
    */
   function createEditable(title) {
      var selectClass = {'className': 'form-control no-padding'};
      var addToColorComp = LLUnit.createColorSelectComponent(selectClass);
      var addFromColorComp = LLUnit.createColorSelectComponent(selectClass);
      var majorPercentageComp = new LLSelectComponent(LLUnit.createSelectElement(selectClass));
      majorPercentageComp.setOptions(majorPercentageSelectOptions);
      majorPercentageComp.set('0');
      var secondPercentageComp = new LLSelectComponent(LLUnit.createSelectElement(selectClass));
      secondPercentageComp.setOptions(secondPercentageSelectOptions);
      secondPercentageComp.set('0');
      var secondLimitComp = new LLSelectComponent(LLUnit.createSelectElement(selectClass));
      secondLimitComp.setOptions(getSecondLimitSelectOptions());
      var secondColorElement = createElement('span', {'innerHTML': '歌曲'});
      addToColorComp.onValueChange = function(v) {
         secondColorElement.innerHTML = v;
      };
      /** @type {LLH.Layout.CenterSkill.LLCSkillComponent_Controller} */
      var controller = {
         'setCSkill': function(cs) {
            addToColorComp.set(cs.attribute || 'smile');
            secondColorElement.innerHTML = cs.attribute || 'smile';
            addFromColorComp.set(cs.Cskillattribute || 'smile');
            majorPercentageComp.set((cs.Cskillpercentage + '') || '0');
            if (cs.Csecondskilllimit) {
               secondLimitComp.set(cs.Csecondskilllimit + '');
            }
            secondPercentageComp.set((cs.Csecondskillattribute + '') || '0');
         },
         'getCSkill': function() {
            return {
               'attribute': addToColorComp.getOrElse('smile'),
               'Cskillattribute': addFromColorComp.getOrElse('smile'),
               'Cskillpercentage': parseInt(majorPercentageComp.getOrElse('0')),
               'Csecondskilllimit': parseInt(secondLimitComp.getOrElse('0')),
               'Csecondskillattribute': parseInt(secondPercentageComp.getOrElse('0'))
            };
         },
         'setMapColor': function(color) {
            if (addFromColorComp.get() == addToColorComp.get()) {
               addFromColorComp.set(color);
            }
            addToColorComp.set(color);
            secondColorElement.innerHTML = color;
         },
         'element': createElement('div', {'className': 'form-inline'}, [
            title,
            addToColorComp.element,
            '属性提升',
            addFromColorComp.element,
            '的',
            majorPercentageComp.element,
            '%+',
            secondLimitComp.element,
            '的社员进一步将',
            secondColorElement,
            '属性提升',
            secondPercentageComp.element,
            '%'
         ])
      };
      return controller;
   }

   class LLCSkillComponent_cls {
      /**
       * @param {LLH.Component.HTMLElementOrId} id 
       * @param {LLH.Layout.CenterSkill.LLCSkillComponent_Options} [options]
       */
      constructor(id, options) {
         var element = LLUnit.getElement(id);
         var opt = options || {};
         var editable = opt.editable || false;
         var title = opt.title || '主唱技能';
         title = title + '：';
         var controller = (editable ? createEditable(title) : createTextDisplay(title));
         LLUnit.updateSubElements(element, controller.element);
         this.controller = controller;
      }
      /** @param {LLH.Internal.CSkillDataType} cskill */
      setCSkill(cskill) {
         this.controller.setCSkill(cskill);
      }
      getCSkill() {
         return this.controller.getCSkill();
      }
      /** @param {LLH.Core.AttributeType} color */
      setMapColor(color) {
         this.controller.setMapColor(color);
      }
   }

   return LLCSkillComponent_cls;
})();

var LLUnitResultComponent = (function () {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;

   function createAttributeResult() {
      var resultSmile = createElement('td');
      var resultPure = createElement('td');
      var resultCool = createElement('td');

      /** @type {LLH.Layout.UnitResult.LLUnitResultComponent_ResultController} */
      var controller = {
         'update': function (team) {
            var calResult = team.getResults();
            resultSmile.innerHTML = calResult.finalAttr.smile + ' (+' + calResult.bonusAttr.smile + ')';
            resultPure.innerHTML = calResult.finalAttr.pure + ' (+' + calResult.bonusAttr.pure + ')';
            resultCool.innerHTML = calResult.finalAttr.cool + ' (+' + calResult.bonusAttr.cool + ')';
         },
         'updateError': function (e) {
            resultSmile.innerHTML = 'error';
            resultPure.innerHTML = 'error';
            resultCool.innerHTML = 'error';
         },
         'element': createElement('table', {'border': '1'},
            createElement('tbody', undefined, [
               createElement('tr', undefined, [
                  createElement('td', undefined, 'smile'),
                  createElement('td', undefined, 'pure'),
                  createElement('td', undefined, 'cool')
               ]),
               createElement('tr', undefined, [
                  resultSmile,
                  resultPure,
                  resultCool
               ])
            ])
         )
      };

      return controller;
   }

   /**
    * @param {string} label 
    * @param {(team: LLH.Model.LLTeam) => LLH.Component.HTMLElementOrString} callback Callback to fetch result from team
    */
   function createScalarResult(label, callback) {
      var resultElement = createElement('nospan');

      /** @type {LLH.Layout.UnitResult.LLUnitResultComponent_ResultController} */
      var controller = {
         'update': function (team) {
            updateSubElements(resultElement, callback(team), true);
         },
         'updateError': function (e) {
            updateSubElements(resultElement, 'error: ' + e, true);
         },
         'element': createElement('div', undefined, [
            label + '：',
            resultElement
         ])
      };
      return controller;
   }

   function createMicResult() {
      var resultElement = createElement('div');
      var comp = new LLMicDisplayComponent(resultElement);

      /** @type {LLH.Layout.UnitResult.LLUnitResultComponent_ResultController} */
      var controller = {
         'update': function (team) {
            team.calculateMic();
            var calResult = team.getResults();
            comp.set(calResult.micNumber, calResult.equivalentURLevel);
         },
         'updateError': function (e) {
            comp.set(0, 0);
         },
         'element': resultElement
      };

      return controller;
   }

   function renderResults() {
      /** @type {LLH.Layout.UnitResult.LLUnitResultComponent_ResultController[]} */
      var resultControllers = [];
      /** @type {HTMLElement[]} */
      var resultElements = [];
      var resultContainer = createElement('div', {'style': {'display': 'none'}});
      var errorContainer = createElement('div', {'style': {'display': 'none', 'color': 'red'}});

      /** @param {LLH.Layout.UnitResult.LLUnitResultComponent_ResultController} controller */
      function addResultController(controller) {
         resultControllers.push(controller);
         resultElements.push(controller.element);
      }
      addResultController(createAttributeResult());
      addResultController(createScalarResult('卡组HP', (team) => team.getResults().totalHP.toFixed()));
      addResultController(createScalarResult('卡组强度', (team) => team.getResults().totalStrength + ' (属性 ' + team.getResults().totalAttrStrength + ' + 技能 ' + team.getResults().totalSkillStrength + ')'));
      addResultController(createMicResult());
      addResultController(createScalarResult('期望得分', (team) => team.getResults().naiveExpection !== undefined ? team.getResults().naiveExpection.toFixed() : team.averageScore + ''));
      addResultController(createScalarResult('期望回复', (team) => LLUnit.healNumberToString(team.getResults().averageHeal)));
      addResultController(createScalarResult('平均每局伤害', (team) => LLUnit.healNumberToString(team.getResults().averageDamage || 0)));
      addResultController(createScalarResult('平均最高溢出奶等级', (team) => LLUnit.healNumberToString(team.getResults().averageOverHealLevel || 0)));
      addResultController(createScalarResult('平均方宝石加成', (team) => LLUnit.numberToPercentString((team.getResults().averageLABonus || 1)-1, 4)));
      addResultController(createScalarResult('期望判定覆盖率(模拟)', (team) => LLUnit.numberToPercentString(team.getResults().averageAccuracyNCoverage)));
      addResultController(createScalarResult('失败率', (team) => LLUnit.numberToPercentString(team.getResults().failRate)));
      updateSubElements(resultContainer, resultElements);

      /** @type {LLH.Layout.UnitResult.LLUnitResultComponent_Controller} */
      var controller = {
         'showResult': function (team) {
            for (var i = 0; i < resultControllers.length; i++) {
               try {
                  resultControllers[i].update(team);
               } catch (e) {
                  resultControllers[i].updateError(e);
                  console.error(e);
               }
            }
            resultContainer.style.display = '';
            resultContainer.scrollIntoView();
         },
         'showError': function (errorMessage) {
            updateSubElements(errorContainer, errorMessage, true);
            errorContainer.style.display = '';
            errorContainer.scrollIntoView();
         },
         'hideError': function () {
            errorContainer.style.display = 'none';
         },
         'element': [errorContainer, resultContainer]
      };

      return controller;
   }

   class LLUnitResultComponent_cls {
      /** @param {LLH.Component.HTMLElementOrId} id */
      constructor(id) {
         var container = LLUnit.getElement(id);
         this._controller = renderResults();
         updateSubElements(container, this._controller.element);
      }
      /** @param {LLH.Model.LLTeam} team */
      showResult(team) {
         this._controller.showResult(team);
      }
      /** @param {string} errorMessage */
      showError(errorMessage) {
         this._controller.showError(errorMessage);
      }
      hideError() {
         this._controller.hideError();
      }
   }

   return LLUnitResultComponent_cls;
})();

var LLGemSelectorComponent = (function () {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;
   var createFormInlineGroup = LLUnit.createFormInlineGroup;
   var createFormSelect = LLUnit.createFormSelect;

   const SEL_ID_GEM_CHOICE = 'gem_choice';
   const SEL_ID_GEM_TYPE = 'gem_type';
   const SEL_ID_GEM_SIZE = 'gem_size';
   const MEM_ID_LANGUAGE = 'language';
   const GEM_GROUP_NORMAL_CATEGORY = 0;
   const GEM_GROUP_NORMAL = 1;
   const GEM_GROUP_LA = 2;

   /** @param {boolean} showLvup */
   function renderGemDetail(showLvup) {
      var container = createElement('div');
      /** @type {LLH.Selector.LLGemSelectorComponent_DetailController} */
      var controller = {
         'set': function (data, language) {
            if (!data) {
               container.innerHTML = '';
            } else if (typeof(data) == 'string') {
               container.innerHTML = '';
            } else {
               /** @type {LLH.Component.SubElements} */
               var elements = [LLConst.Gem.getGemFullDescription(data, language == 0)];
               if (showLvup && data.level_up_skill_data) {
                  var nextData = data.level_up_skill_data;
                  elements.push(
                     createElement('br'),
                     createElement('b', undefined, '可升级为：'),
                     createElement('br'),
                     createElement('span', {'style': {'color': LLConst.Gem.getGemColor(nextData)}}, LLConst.Gem.getGemDescription(nextData, language == 0)),
                     createElement('br'),
                     LLConst.Gem.getGemFullDescription(nextData, language == 0)
                  );
               }
               updateSubElements(container, elements, true);
            }
         },
         'element': container
      };
      return controller;
   }

   function renderGemSeriesRow() {
      var descCell = createElement('td');
      var fullDescCell = createElement('td');
      /** @type {LLH.Selector.LLGemSelectorComponent_SisDataController} */
      var controller = {
         'set': function (data, language) {
            descCell.style.color = LLConst.Gem.getGemColor(data);
            updateSubElements(descCell, LLConst.Gem.getGemDescription(data, language == 0), true);
            updateSubElements(fullDescCell, LLConst.Gem.getGemFullDescription(data, language == 0), true);
         },
         'element': createElement('tr', undefined, [descCell, fullDescCell])
      };
      return controller;
   }

   function renderGemSeries() {
      /** @type {LLH.API.SisDataType[]} */
      var seriesData = [];
      /** @type {HTMLElement[]} */
      var seriesRows = [];
      /** @type {LLH.Selector.LLGemSelectorComponent_SisDataController[]} */
      var seriesRowsController = [];
      var lastLanguage = undefined;
      var focusedIndex = -1;
      var headerRow = createElement('tr', undefined, [
         createElement('th', {'style': {'width': '50%'}}, '宝石'),
         createElement('th', undefined, '描述')
      ]);
      var tbody = createElement('tbody', undefined, [headerRow]);
      var table = createElement('table', {'className': 'table table-bordered table-hover table-condensed gem-series', 'style': {'display': 'none'}}, tbody);

      /** @type {LLH.Selector.LLGemSelectorComponent_DetailController} */
      var controller = {
         'set': function (data, language) {
            if (typeof(data) == 'string') {
               table.style.display = 'none';
            } else if ((!data.level_up_skill_data) && (!data.level_down_skill_data)) {
               table.style.display = 'none';
            } else {
               var found = -1;
               var i;
               for (i = 0; i < seriesData.length; i++) {
                  if (seriesData[i] === data) {
                     found = i;
                     break;
                  }
               }
               if (found < 0) {
                  // rebuild the rows
                  var curData = data;
                  while (curData.level_down_skill_data) curData = curData.level_down_skill_data;
                  seriesData = [curData];
                  seriesRowsController = [renderGemSeriesRow()];
                  seriesRows = [seriesRowsController[0].element];
                  while (curData.level_up_skill_data) {
                     curData = curData.level_up_skill_data;
                     seriesData.push(curData);
                     var curController = renderGemSeriesRow();
                     seriesRows.push(curController.element);
                     seriesRowsController.push(curController);
                  }
                  for (i = 0; i < seriesData.length; i++) {
                     seriesRowsController[i].set(seriesData[i], language);
                     if (seriesData[i] === data) {
                        seriesRows[i].className = 'focused';
                        focusedIndex = i;
                     }
                  }
                  updateSubElements(tbody, [headerRow].concat(seriesRows), true);
               } else {
                  // reuse the rows
                  if (found != focusedIndex) {
                     if (seriesRows[focusedIndex]) {
                        seriesRows[focusedIndex].className = '';
                     }
                     seriesRows[found].className = 'focused';
                     focusedIndex = found;
                  }
                  // check if language changed
                  if (lastLanguage != language) {
                     for (i = 0; i < seriesData.length; i++) {
                        seriesRowsController[i].set(seriesData[i], language);
                     }
                  }
               }
               table.style.display = '';
               lastLanguage = language;
            }
         },
         'element': table
      };
      return controller;
   }

   /**
    * @implements {LLH.Mixin.LanguageSupport}
    */
   class LLGemSelectorComponent_cls extends LLFiltersComponent {
      /**
       * @param {string | HTMLElement} id 
       * @param {LLH.Selector.LLGemSelectorComponent_Options} options
       */
      constructor(id, options) {
         super();
         var container = LLUnit.getElement(id);
         var me = this;
         if (!options) options = {};
         this.gemData = undefined;
         this.includeNormalGemCategory = options.includeNormalGemCategory || false;
         this.includeNormalGem = options.includeNormalGem || false;
         this.includeLAGem = options.includeLAGem || false;

         var gemChoice = createFormSelect();
         var gemType = createFormSelect();
         var gemSize = createFormSelect();

         this._gemChoiceComponent = new LLSelectComponent(gemChoice);
         this._gemTypeComponent = new LLSelectComponent(gemType);
         this._languageComponent = new LLValuedMemoryComponent(LLConstValue.LANGUAGE_CN);

         this.addFilterable(SEL_ID_GEM_CHOICE, this._gemChoiceComponent, function (opt) {
            if (opt.value && options.gemData && options.gemData[opt.value]) {
               return options.gemData[opt.value];
            } else {
               return undefined;
            }
         });
         this.addFilterable(SEL_ID_GEM_TYPE, this._gemTypeComponent);
         this.addFilterable(SEL_ID_GEM_SIZE, new LLSelectComponent(gemSize));
         this.addFilterable(MEM_ID_LANGUAGE, this._languageComponent);
         this.setFilterOptionGroupCallback(SEL_ID_GEM_CHOICE,
            () => me._gemTypeComponent.get() + '_' + me._languageComponent.get(),
            [SEL_ID_GEM_TYPE, MEM_ID_LANGUAGE]);
         this.setFilterOptionGroupCallback(SEL_ID_GEM_SIZE, () => me._gemTypeComponent.getOrElse(''), [SEL_ID_GEM_TYPE]);
         this.addFilterCallback(SEL_ID_GEM_SIZE, SEL_ID_GEM_CHOICE, (opt, v, d) => (!v) || (!d) || (parseInt(v) == d.size))

         updateSubElements(container, [
            createFormInlineGroup('筛选条件：', [gemType, gemSize]),
            createFormInlineGroup('宝石：', gemChoice)
         ], true);

         /** @type {LLH.Selector.LLGemSelectorComponent_DetailController=} */
         var detailController = undefined;
         /** @type {LLH.Selector.LLGemSelectorComponent_DetailController=} */
         var seriesController = undefined;
         if (options.includeLAGem || options.includeNormalGem) {
            if (options.showBrief) {
               detailController = renderGemDetail(false);
               updateSubElements(container, detailController.element);
            } else {
               detailController = renderGemDetail(true);
               seriesController = renderGemSeries();
               updateSubElements(container, [
                  createElement('h3', undefined, '详细信息'),
                  detailController.element,
                  createElement('h3', undefined, '升级序列'),
                  seriesController.element
               ], false);
            }
         }

         /**
          * @param {LLH.Selector.LLGemSelectorComponent_DetailController | undefined} controller
          * @param {string} gemId
          * @param {LLH.Core.LanguageType} language
          */
         var setDetail = function (controller, gemId, language) {
            if (controller) {
               if (options.gemData && options.gemData[gemId]) {
                  controller.set(options.gemData[gemId], language);
               } else {
                  controller.set(gemId, language);
               }
            }
         };

         /** @type {(name: string, newValue: any) => void} */
         this.onValueChange = function (name, newValue) {
            var curGem, curLanguage, updateDetail = false;
            if (name == SEL_ID_GEM_CHOICE) {
               curGem = newValue;
               curLanguage = me._languageComponent.get();
               updateDetail = true;
            } else if (name == MEM_ID_LANGUAGE) {
               curGem = me._gemChoiceComponent.get();
               curLanguage = newValue;
               updateDetail = true;
            }
            if (updateDetail) {
               setDetail(detailController, curGem, curLanguage);
               setDetail(seriesController, curGem, curLanguage);
            }
         };

         this.setGemData(options.gemData);
      }
      /** @param {LLH.API.SisDictDataType} [gemData] */
      setGemData(gemData) {
         if (gemData) {
            LLConst.Gem.postProcessGemData(gemData);
         }
   
         /** @type {LLH.Component.LLFiltersComponent_OptionGroupType} */
         var gemOptionGroups = {};
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var gemTypeOptions = [];
         /** @type {LLH.Component.LLFiltersComponent_OptionGroupType} */
         var gemSizeOptionGroups = {};
         var i;
   
         this.setFreezed(true);
         this.gemData = gemData;
   
         if (this.includeNormalGemCategory) {
            /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
            var gemNormalCatOptions = [{'value': '', 'text': '选择宝石'}];
            var normalGems = LLConst.Gem.getNormalGemTypeKeys();
            for (i = 0; i < normalGems.length; i++) {
               var normalGemKey = normalGems[i];
               var normalGemId = LLConst.GemType[normalGemKey];
               gemNormalCatOptions.push({'value': normalGemKey, 'text': LLConst.Gem.getNormalGemNameAndDescription(normalGemId)});
            }
            var normalCategoryKey = GEM_GROUP_NORMAL_CATEGORY.toFixed();
            gemOptionGroups[normalCategoryKey + '_0'] = gemNormalCatOptions;
            gemOptionGroups[normalCategoryKey + '_1'] = gemNormalCatOptions;
            gemTypeOptions.push({'value': normalCategoryKey, 'text': '普通宝石（大类）'});
         }
         if (gemData && (this.includeNormalGem || this.includeLAGem)) {
            /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
            var gemNormalOptions = [{'value': '', 'text': '选择宝石'}];
            /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
            var gemNormalOptionsJp = [{'value': '', 'text': '选择宝石'}];
            /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
            var gemLAOptions = [{'value': '', 'text': '选择宝石'}];
            /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
            var gemLAOptionsJp = [{'value': '', 'text': '选择宝石'}];
            var gemDataKeys = Object.keys(gemData).sort((a, b) => parseInt(a) - parseInt(b));
            var gemNormalSizeCollection = {};
            var gemLASizeCollection = {};
            for (i = 0; i < gemDataKeys.length; i++) {
               var curKey = gemDataKeys[i];
               var curGemData = gemData[curKey];
               if (curGemData.type == LLConstValue.SIS_TYPE_NORMAL) {
                  if (this.includeNormalGem) {
                     var curColor = LLConst.Gem.getGemColor(curGemData);
                     gemNormalOptions.push({'value': curKey, 'text': LLConst.Gem.getGemDescription(curGemData, true), 'color': curColor});
                     gemNormalOptionsJp.push({'value': curKey, 'text': LLConst.Gem.getGemDescription(curGemData, false), 'color': curColor});
                     gemNormalSizeCollection[curGemData.size.toFixed()] = 1;
                  }
               } else if (curGemData.type == LLConstValue.SIS_TYPE_LIVE_ARENA) {
                  if (this.includeLAGem) {
                     var curColor = LLConst.Gem.getGemColor(curGemData);
                     gemLAOptions.push({'value': curKey, 'text': LLConst.Gem.getGemDescription(curGemData, true), 'color': curColor});
                     gemLAOptionsJp.push({'value': curKey, 'text': LLConst.Gem.getGemDescription(curGemData, false), 'color': curColor});
                     gemLASizeCollection[curGemData.size.toFixed()] = 1;
                  }
               }
            }
            if (this.includeNormalGem) {
               var normalKey = GEM_GROUP_NORMAL.toFixed();
               gemOptionGroups[normalKey + '_0'] = gemNormalOptions;
               gemOptionGroups[normalKey + '_1'] = gemNormalOptionsJp;
               gemTypeOptions.push({'value': normalKey, 'text': '普通宝石'});
               gemSizeOptionGroups[normalKey] =
                  [{'value': '', 'text': '大小'}].concat(
                     Object.keys(gemNormalSizeCollection).sort((a, b) => parseInt(a) - parseInt(b)).map((x) => {return {'value': x, 'text': '●' + x};})
                  );
            }
            if (this.includeLAGem) {
               var laKey = GEM_GROUP_LA.toFixed();
               gemOptionGroups[laKey + '_0'] = gemLAOptions;
               gemOptionGroups[laKey + '_1'] = gemLAOptionsJp;
               gemTypeOptions.push({'value': laKey, 'text': '演唱会竞技场宝石'});
               gemSizeOptionGroups[laKey] =
                  [{'value': '', 'text': '大小'}].concat(
                     Object.keys(gemLASizeCollection).sort((a, b) => parseInt(a) - parseInt(b)).map((x) => {return {'value': x, 'text': '■' + x};})
                  );
            }
         }
         this.setFilterOptions(SEL_ID_GEM_TYPE, gemTypeOptions);
         this.setFilterOptionGroups(SEL_ID_GEM_SIZE, gemSizeOptionGroups);
         this.setFilterOptionGroups(SEL_ID_GEM_CHOICE, gemOptionGroups);
   
         this.setFreezed(false);
         this.handleFilters();
      }
      /** @returns {LLH.Core.SisIdType | LLH.Internal.NormalGemCategoryKeyType} */
      getGemId() {
         return this._gemChoiceComponent.getOrElse('');
      }
      /** @param {LLH.Core.LanguageType} language */
      setLanguage(language) {
         this._languageComponent.set(language);
      }
   }

   return LLGemSelectorComponent_cls;
})();

var LLLanguageComponent = (function() {
   /** @param {LLH.Layout.Language.LLLanguageComponent} me */
   function toggleLanguage(me) {
      if (me.value == LLConstValue.LANGUAGE_CN) {
         me.set(LLConstValue.LANGUAGE_JP);
      } else {
         me.set(LLConstValue.LANGUAGE_CN);
      }
   }

   /**
    * @extends {LLH.Component.LLComponentBase<HTMLInputElement, LLH.Core.LanguageType>}
    */
   class LLLanguageComponent_cls extends LLComponentBase {
      /** @param {string | HTMLInputElement} [id] */
      constructor(id) {
         /** @type {HTMLInputElement} */
         var element = LLUnit.getOrCreateElement(id, 'input');
         super(element);
         this.element = element;
         this.element.type = 'button';
         this.element.value = '切换语言';
         this.element.className = 'btn btn-default';
         /** @type {LLH.Core.LanguageType} */
         this.value = LLConstValue.LANGUAGE_CN;
         /** @type {LLH.Mixin.LanguageSupport[]} */
         this.langSupports = [];
         /** @type {((newValue: LLH.Core.LanguageType) => void) | undefined} */
         this.onValueChange = undefined;
         var me = this;
         this.on('click', () => toggleLanguage(me));
      }
      get() {
         return this.value;
      }
      /** @param {LLH.Core.LanguageType} v */
      set(v) {
         this.value = v;
         for (var i = 0; i < this.langSupports.length; i++) {
            this.langSupports[i].setLanguage(v);
         }
         if (this.onValueChange) this.onValueChange(v);
      }
      /** @param {LLH.Mixin.LanguageSupport} langSupport */
      registerLanguageChange(langSupport) {
         this.langSupports.push(langSupport);
      }
      saveData() {
         return this.get();
      }
      /** @param {LLH.Core.LanguageType} [data] */
      loadData(data) {
         if (data === undefined) return;
         this.set(data);
      }
   }

   return LLLanguageComponent_cls;
})();

var LLAccessoryComponent = (function () {
   class LLAccessoryComponent_cls extends LLComponentBase {
      /**
       * @param {LLH.Component.HTMLElementOrId} id
       * @param {LLH.Component.LLAccessoryComponent_Options} [options]
       */
      constructor(id, options) {
         super(id, options);
         this.size = 128;
         if (options && options.size) {
            this.size = options.size;
         }
         this.accessoryId = undefined;
         /** @type {HTMLImageElement} */
         var img = LLUnit.createElement('img');
         this.accessoryImage = new LLImageComponent(img);
         if (this.element) {
            this.element.className = 'accessory-base';
            this.element.style.width = this.size + 'px';
            this.element.style.height = this.size + 'px';
            LLUnit.updateSubElements(this.element, img);
         }
      }
      /**
       * @param {LLH.Core.AccessoryIdStringType | LLH.API.AccessoryDataType} [newAccessory] 
       * @param {LLH.Core.LanguageType} [language] 
       */
      setAccessory(newAccessory, language) {
         /** @type {LLH.API.AccessoryDataType=} */
         var accessory;
         if (typeof(newAccessory) == 'string') {
            accessory = LLAccessoryData.getAllCachedBriefData()[newAccessory];
            if (!accessory) {
               console.warn('Not found accessory in cache: ' + newAccessory)
               return;
            }
         } else if (newAccessory === undefined) {
            if (this.accessoryId !== undefined) {
               this.setClassName('accessory-base');
               this.accessoryImage.hide();
               this.accessoryId = undefined;
            }
            return;
         } else {
            accessory = newAccessory;
         }
         this.accessoryImage.show();
         this.accessoryImage.setAltText(LLConst.Accessory.getAccessoryDescription(accessory, language));
         if (accessory.id == this.accessoryId) {
            return;
         }
         var newClassName = 'accessory-' + LLConst.Common.getRarityString(accessory.rarity);
         if (accessory.unit_id) {
            newClassName = newClassName + ' accessory-special';
         }
         this.setClassName(newClassName);
         this.accessoryImage.setSrcList(['/static/accessory/' + accessory.id + '.png']);
         this.accessoryId = accessory.id;
      }
   }

   return LLAccessoryComponent_cls;
})();

var LLAccessorySelectorComponent = (function () {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;
   var createFormInlineGroup = LLUnit.createFormInlineGroup;
   var createFormSelect = LLUnit.createFormSelect;

   var SEL_ID_ACCESSORY_CHOICE = 'accessory_choice';
   var SEL_ID_ACCESSORY_RARITY = 'accessory_rarity';
   var SEL_ID_ACCESSORY_MAIN_ATTRIBUTE = 'accessory_main_attribute';
   var SEL_ID_ACCESSORY_TYPE = 'accessory_type';
   var SEL_ID_ACCESSORY_EFFECT_TYPE = 'accessory_effect_type';
   var SEL_ID_ACCESSORY_LEVEL = 'accessory_level';
   var MEM_ID_LANGUAGE = 'language';

   function renderAccessoryDetail() {
      var cardAvatar1Component = new LLAvatarComponent();
      var cardAvatar2Component = new LLAvatarComponent();
      cardAvatar1Component.hide();
      cardAvatar2Component.hide();
      var accessoryComponent = new LLAccessoryComponent(createElement('div'));
      var container = createElement('div');
      /** @type {LLH.Selector.LLAccessorySelectorComponent_DetailController} */
      var controller = {
         set: function (data, language) {
            if (!data) {
               container.innerHTML = '';
            } else {
               var levelRows = [
                  createElement('tr', undefined, [
                     createElement('th', undefined, '等级'),
                     createElement('th', undefined, 'smile'),
                     createElement('th', undefined, 'pure'),
                     createElement('th', undefined, 'cool'),
                     createElement('th', undefined, '技能'),
                  ])
               ];
               if (data.levels) {
                  for (var i = 1; i <= data.levels.length; i++) {
                     var levelAttribute = LLConst.Accessory.getAccessoryLevelAttribute(data, i);
                     levelRows.push(createElement('tr', undefined, [
                        createElement('td', undefined, i + ''),
                        createElement('td', {'style': {'color': 'red'}}, levelAttribute.smile + ''),
                        createElement('td', {'style': {'color': 'green'}}, levelAttribute.pure + ''),
                        createElement('td', {'style': {'color': 'blue'}}, levelAttribute.cool + ''),
                        createElement('td', undefined, LLConst.Skill.getAccessorySkillDescription(data, i-1))
                     ]));
                  }
               }
               updateSubElements(container, [
                  createElement('table', {'className': 'table table-bordered table-hover table-condensed'}, 
                     createElement('tbody', undefined, levelRows)
                  )
               ], true);
            }
            accessoryComponent.setAccessory(data, language);
            if (data && data.unit_id) {
               cardAvatar1Component.setCard(data.unit_id, false);
               cardAvatar2Component.setCard(data.unit_id, true);
               cardAvatar1Component.show();
               cardAvatar2Component.show();
            } else {
               cardAvatar1Component.hide();
               cardAvatar2Component.hide();
            }
            container.scrollIntoView();
         },
         'element': createElement('div', undefined, [
            createElement('div', {'style': {'display': 'flex', 'flexFlow': 'row'}}, [
               accessoryComponent.element,
               cardAvatar1Component.element,
               cardAvatar2Component.element
            ]),
            container
         ])
      };
      return controller;
   }

   function renderAccessoryBrief() {
      var constraintElement = createElement('span');
      var briefElement = createElement('span');
      var accessoryComponent = new LLAccessoryComponent(createElement('div'), {'size': 64});
      /** @type {LLH.Selector.LLAccessorySelectorComponent_BriefController} */
      var controller = {
         'set': function (data, level, language) {
            if (!data) {
               constraintElement.innerHTML = '';
               briefElement.innerHTML = '';
            } else {
               if (!data.unit_id) {
                  constraintElement.innerHTML = '通用';
               } else if (level == 8 && data.unit_type_id) {
                  constraintElement.innerHTML = '仅限' + LLConst.Member.getMemberName(data.unit_type_id, language) + '装备';
               } else {
                  constraintElement.innerHTML = '仅限该卡装备：' + LLConst.Common.getCardDescription(LLConst.Common.getOrMakeDummyCardData(data.card, data.unit_id), language);
               }
               briefElement.innerHTML = LLConst.Skill.getAccessorySkillDescription(data, level-1);
            }
            accessoryComponent.setAccessory(data, language);
         },
         'element': createElement('div', undefined, [
            accessoryComponent.element,
            '饰品装备限制：', constraintElement, createElement('br'),
            '饰品技能：', briefElement
         ])
      }
      return controller;
   }

   /**
    * @implements {LLH.Mixin.LanguageSupport}
    */
   class LLAccessorySelectorComponent_cls extends LLFiltersComponent {
      /**
       * @param {string | HTMLElement} id 
       * @param {LLH.Selector.LLAccessorySelectorComponent_Options} options
       */
      constructor(id, options) {
         super();
         var container = LLUnit.getElement(id);
         var me = this;
         if (!options) options = {};
         /** @type {LLH.Internal.ProcessedAccessoryDictDataType=} */
         this.accessoryData = undefined;
         this.showDetail = options.showDetail || false;
         this.showLevelSelect = options.showLevelSelect || false;
         this.excludeMaterial = options.excludeMaterial || false;

         var accessoryChoice = createFormSelect();
         var accessoryRarity = createFormSelect();
         var accessoryMainAttribute = createFormSelect();
         var accessoryType = createFormSelect();
         var accessoryEffectType = createFormSelect();

         this._accessoryChoiceComponent = new LLSelectComponent(accessoryChoice);
         this._languageComponent = new LLValuedMemoryComponent(LLConstValue.LANGUAGE_CN);
         /** @type {LLH.Component.LLSelectComponent=} */
         this._accessoryLevelComponent = undefined;

         this.addFilterable(SEL_ID_ACCESSORY_CHOICE, this._accessoryChoiceComponent, function (opt) {
            if (opt.value && me.accessoryData && me.accessoryData[opt.value]) {
               return me.accessoryData[opt.value];
            } else {
               return undefined;
            }
         });
         this.addFilterable(SEL_ID_ACCESSORY_RARITY, new LLSelectComponent(accessoryRarity));
         this.addFilterable(SEL_ID_ACCESSORY_MAIN_ATTRIBUTE, new LLSelectComponent(accessoryMainAttribute));
         this.addFilterable(SEL_ID_ACCESSORY_TYPE, new LLSelectComponent(accessoryType));
         this.addFilterable(SEL_ID_ACCESSORY_EFFECT_TYPE, new LLSelectComponent(accessoryEffectType));
         this.addFilterable(MEM_ID_LANGUAGE, this._languageComponent);
         this.setFilterOptionGroupCallback(SEL_ID_ACCESSORY_CHOICE, () => me._languageComponent.get() + '', [MEM_ID_LANGUAGE]);
         this.addFilterCallback(SEL_ID_ACCESSORY_RARITY, SEL_ID_ACCESSORY_CHOICE, (opt, v, d) => (!v) || (!d) || (parseInt(v) == d.rarity));
         this.addFilterCallback(SEL_ID_ACCESSORY_MAIN_ATTRIBUTE, SEL_ID_ACCESSORY_CHOICE, (opt, v, d) => (!v) || (!d) || (v == d.main_attribute || (v == 'other' && d.main_attribute == 'all')));
         this.addFilterCallback(SEL_ID_ACCESSORY_TYPE, SEL_ID_ACCESSORY_CHOICE, (opt, v, d) => (!d) || (((!v) || (v == d.type)) && !(d.is_material && me.excludeMaterial)));
         this.addFilterCallback(SEL_ID_ACCESSORY_EFFECT_TYPE, SEL_ID_ACCESSORY_CHOICE, (opt, v, d) => (!v) || (!d) || (v == d.effect_type));
   
         updateSubElements(container, [
            createFormInlineGroup('筛选条件：', [accessoryRarity, accessoryMainAttribute, accessoryType, accessoryEffectType]),
            createFormInlineGroup('饰品：', accessoryChoice)
         ], true);
   
         /** @type {LLH.Selector.LLAccessorySelectorComponent_BriefController=} */
         var briefController = undefined;
         if (this.showLevelSelect) {
            var accessoryLevel = createFormSelect();
            this._accessoryLevelComponent = new LLSelectComponent(accessoryLevel);
            this.addFilterable(SEL_ID_ACCESSORY_LEVEL, this._accessoryLevelComponent);
            this.addFilterCallback(SEL_ID_ACCESSORY_CHOICE, SEL_ID_ACCESSORY_LEVEL, (opt, v) => (!v) || (!me.accessoryData) || (!me.accessoryData[v]) || me.accessoryData[v].max_level >= parseInt(opt.value));
            briefController = renderAccessoryBrief();
            updateSubElements(container, createFormInlineGroup('饰品等级：', accessoryLevel));
            updateSubElements(container, briefController.element);
         }
         /** @type {LLH.Selector.LLAccessorySelectorComponent_DetailController=} */
         var detailController = undefined;
         if (this.showDetail) {
            detailController = renderAccessoryDetail();
            updateSubElements(container, createElement('h3', undefined, '饰品详细信息'));
            updateSubElements(container, detailController.element);
         }
   
         /**
          * @param {LLH.Selector.LLAccessorySelectorComponent_DetailController | undefined} contDetail
          * @param {LLH.Selector.LLAccessorySelectorComponent_BriefController | undefined} contBrief
          * @param {LLH.Core.AccessoryIdStringType} accessoryId
          * @param {number} accessoryLevel
          * @param {LLH.Core.LanguageType} language
          */
         var setDetail = function (contDetail, contBrief, accessoryId, accessoryLevel, language) {
            if (contDetail || contBrief) {
               if (accessoryId) {
                  LoadingUtil.startSingle(LLAccessoryData.getDetailedData(accessoryId)).then(function(accessory) {
                     var processedAccessory = LLConst.Accessory.postProcessSingleAccessoryData(accessory, me.cardData || {});
                     if (!me.accessoryData) {
                        me.accessoryData = {};
                     }
                     me.accessoryData[accessoryId] = processedAccessory;
                     if (contDetail) {
                        contDetail.set(processedAccessory, language);
                     }
                     if (contBrief) {
                        contBrief.set(processedAccessory, accessoryLevel, language);
                     }
                  });
               } else {
                  if (contDetail) {
                     contDetail.set(undefined, language);
                  }
                  if (contBrief) {
                     contBrief.set(undefined, accessoryLevel, language);
                  }
               }
            }
         };

         /** @type {(name: string, newValue: any) => void} */
         this.onValueChange = function (name, newValue) {
            /** @type {LLH.Core.AccessoryIdStringType} */
            var curId;
            /** @type {LLH.Core.LanguageType} */
            var curLanguage;
            var curLevel = 1, updateDetail = false;
            if (name == SEL_ID_ACCESSORY_CHOICE) {
               curId = newValue;
               updateDetail = true;
            } else {
               curId = me._accessoryChoiceComponent.getOrElse('');
            }
            if (name == MEM_ID_LANGUAGE) {
               curLanguage = newValue;
               updateDetail = true;
            } else {
               curLanguage = me._languageComponent.get();
            }
            if (me.showLevelSelect && me._accessoryLevelComponent) {
               if (name == SEL_ID_ACCESSORY_LEVEL) {
                  curLevel = parseInt(newValue);
                  updateDetail = true;
               } else {
                  curLevel = parseInt(me._accessoryLevelComponent.getOrElse('1'));
               }
            }
            if (updateDetail) {
               setDetail(detailController, briefController, curId, curLevel, curLanguage);
            }
         };
   
         this.setAccessoryData(options.accessoryData, options.cardData);
      }
      /**
       * @param {LLH.API.AccessoryDictDataType} [accessoryData] 
       * @param {LLH.API.CardDictDataType} [cardData] 
       */
      setAccessoryData(accessoryData, cardData) {
         var i;
   
         this.setFreezed(true);
         if (accessoryData && cardData) {
            this.accessoryData = LLConst.Accessory.postProcessAccessoryData(accessoryData, cardData);
         } else {
            this.accessoryData = {};
         }
         this.cardData = cardData;
   
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var accessoryOptions = [{'value': '', 'text': '选择饰品'}];
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var accessoryOptionsJp = [{'value': '', 'text': '选择饰品'}];
         var effectTypeCollector = {};
         var accessoryDataKeys = Object.keys(this.accessoryData).sort((a, b) => parseInt(a) - parseInt(b));
         for (i = 0; i < accessoryDataKeys.length; i++) {
            var curKey = accessoryDataKeys[i];
            var curAccessoryData = this.accessoryData[curKey];
            var curColor = LLConst.Common.getAttributeColor(LLConst.Accessory.getAccessoryMainAttribute(curAccessoryData));
            accessoryOptions.push({'value': curKey, 'text': LLConst.Accessory.getAccessoryDescription(curAccessoryData, LLConstValue.LANGUAGE_CN), 'color': curColor});
            accessoryOptionsJp.push({'value': curKey, 'text': LLConst.Accessory.getAccessoryDescription(curAccessoryData, LLConstValue.LANGUAGE_JP), 'color': curColor});
            if (curAccessoryData.effect_type) effectTypeCollector[curAccessoryData.effect_type] = 1;
         }
   
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var effectTypeOptions = [{'value': '', 'text': '技能类型'}];
         var effectTypeKeys = Object.keys(effectTypeCollector).sort((a, b) => parseInt(a) - parseInt(b));
         for (i = 0; i < effectTypeKeys.length; i++) {
            var curEffect = effectTypeKeys[i];
            var curEffectBrief = LLConst.Skill.getEffectBrief(parseInt(curEffect));
            if (curEffectBrief != '未知') effectTypeOptions.push({'value': curEffect, 'text': curEffectBrief});
         }
   
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var rarityOptions = [
            {'value': '', 'text': '稀有度'},
            {'value': '1', 'text': 'N'},
            {'value': '2', 'text': 'R'},
            {'value': '3', 'text': 'SR'},
            {'value': '5', 'text': 'SSR'},
            {'value': '4', 'text': 'UR'}
         ];
         
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var mainAttributeOptions = [
            {'value': '', 'text': '主属性'},
            {'value': 'smile', 'text': 'smile', 'color': 'red'},
            {'value': 'pure', 'text': 'pure', 'color': 'green'},
            {'value': 'cool', 'text': 'cool', 'color': 'blue'},
            {'value': 'other', 'text': '其它', 'color': 'purple'}
         ];
   
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var typeOptions = [
            {'value': '', 'text': '分类'},
            {'value': '通用', 'text': '通用'},
            {'value': '个人', 'text': '个人'}
         ];
         if (!this.excludeMaterial) {
            typeOptions.push({'value': '材料', 'text': '材料'});
         }
   
         if (this.showLevelSelect) {
            /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
            var levelOptions = [];
            for (i = 1; i <= 8; i++) {
               levelOptions.push({'value': i + '', 'text': i + ''});
            }
            this.setFilterOptions(SEL_ID_ACCESSORY_LEVEL, levelOptions);
         }
   
         this.setFilterOptions(SEL_ID_ACCESSORY_RARITY, rarityOptions);
         this.setFilterOptions(SEL_ID_ACCESSORY_MAIN_ATTRIBUTE, mainAttributeOptions);
         this.setFilterOptions(SEL_ID_ACCESSORY_TYPE, typeOptions);
         this.setFilterOptions(SEL_ID_ACCESSORY_EFFECT_TYPE, effectTypeOptions);
         this.setFilterOptionGroups(SEL_ID_ACCESSORY_CHOICE, {'0': accessoryOptions, '1': accessoryOptionsJp});
   
         this.setFreezed(false);
         this.handleFilters();
      }
      /** @returns {LLH.Core.AccessoryIdStringType} */
      getAccessoryId() {
         return this._accessoryChoiceComponent.getOrElse('');
      }
      getAccessoryLevel() {
         if (this.showLevelSelect && this._accessoryLevelComponent) {
            return parseInt(this._accessoryLevelComponent.getOrElse('1'));
         } else {
            return 1;
         }
      }
      /** @returns {LLH.Internal.AccessorySaveDataType | undefined} */
      getAccessorySaveData() {
         var accessoryId = this.getAccessoryId();
         var level = this.getAccessoryLevel();
         if (accessoryId && level) {
            return {
               'id': accessoryId,
               'level': level
            }
         } else {
            return undefined;
         }
      }
      /** @param {LLH.Core.LanguageType} language */
      setLanguage(language) {
         this._languageComponent.set(language);
      }
   }

   return LLAccessorySelectorComponent_cls;
})();

var LLPoolUtil = (function () {
   /** @type {LLH.Pool.LLPoolUtil} */
   var poolUtil = {
      /** @template IdType */
      loadRawPools: function(storageKey) {
         /** @type {LLH.Internal.PoolsSaveDataType<IdType>} */
         var pools = [];
         LLSaveLoadJsonHelper.commonLoadJson((x) => pools = x, LLHelperLocalStorage.getData(storageKey));
         return pools;
      },
      /** @template IdType */
      loadPools: function(storageKey) {
         /** @type {LLH.Internal.PoolsSaveDataType<IdType>} */
         var rawPools = poolUtil.loadRawPools(storageKey);
         return rawPools.map(poolUtil.processPool);
      },
      /**
       * @template IdType
       * @param {LLH.Internal.PoolSaveDataType<IdType>} rawPool
       */
      processPool: function(rawPool) {
         /** @type {LLH.Pool.PoolProcessedDataType<IdType>} */
         var processed = {
            'raw': rawPool,
            'itemSet': new Set()
         };
         for (var i in rawPool.items) {
            processed.itemSet.add(rawPool.items[i]);
         }
         return processed;
      },
      saveRawPools: function (storageKey, rawPools) {
         LLHelperLocalStorage.setData(storageKey, LLSaveLoadJsonHelper.commonSaveJson(rawPools));
      },
      savePools: function (storageKey, pools) {
         poolUtil.saveRawPools(storageKey, pools.map((x) => x.raw));
      },
      addPool: function(pools, newPoolName) {
         if (!newPoolName) {
            return '名字不能为空';
         }
         for (var i in pools) {
            if (newPoolName == pools[i].raw.name) {
               return '该名字已经存在';
            }
         }
         pools.push({
            'raw': {
               'name': newPoolName,
               'items': []
            },
            'itemSet': new Set()
         });
         return '';
      },
      removePoolByIndex: function(pools, index) {
         if (index < 0 || index >= pools.length) {
            return;
         }
         pools.splice(index, 1);
      }
   };
   return poolUtil;
})();

var LLCardTableComponent = (function () {
   const createElement = LLUnit.createElement;
   const updateSubElements = LLUnit.updateSubElements;

   function renderRow() {
      /** @type {LLH.Table.LLCardTableComponent_RowController} */
      var controller;
      /** @type {LLH.API.CardDataType=} */
      var curCard = undefined;
      var curSelected = false;

      var cardIdDiv = new LLValuedComponent(createElement('div', {'className': 'card-id'}));
      var normalAvatar = new LLAvatarComponent({'smallAvatar': true});
      var mezameAvatar = new LLAvatarComponent({'smallAvatar': true});
      var smileCell = new LLValuedComponent(createElement('td', {'style': {'color': 'red'}}));
      var pureCell = new LLValuedComponent(createElement('td', {'style': {'color': 'green'}}));
      var coolCell = new LLValuedComponent(createElement('td', {'style': {'color': 'blue'}}));
      var triggerCell = new LLValuedComponent(createElement('td'));
      var possibilityCell = new LLValuedComponent(createElement('td'));
      var skillEffectCell = new LLValuedComponent(createElement('td'));
      var row = new LLComponentBase(createElement('tr', {'style': {'display': 'none'}}, [
         createElement('td', undefined, [cardIdDiv.element, normalAvatar.element, mezameAvatar.element]),
         smileCell.element, pureCell.element, coolCell.element,
         triggerCell.element, possibilityCell.element, skillEffectCell.element
      ], {'click': function () {
         controller.setSelected(!controller.isSelected());
         if (controller.onClick) controller.onClick();
      }}));
      controller = {
         'element': [row.element],
         'isSelected': function () { return curSelected; },
         'setCardData': function (card) {
            if (curCard === card) return;
            curCard = card;
            row.setVisible(card !== undefined);
            if (curCard) {
               cardIdDiv.set('#' + curCard.id);
               normalAvatar.setCard(curCard.id + '', false);
               mezameAvatar.setCard(curCard.id + '', true);
               smileCell.set(curCard.smile2 + '');
               pureCell.set(curCard.pure2 + '');
               coolCell.set(curCard.cool2 + '');
               triggerCell.set(LLConst.Skill.getTriggerDescription(curCard.triggertype, curCard.triggerrequire, curCard.triggertarget));
               possibilityCell.set((curCard.possibility_range || 0) + '%');
               skillEffectCell.set(LLConst.Skill.getEffectDescription(curCard.skilleffect, curCard.score_range, curCard.time_range, curCard.effecttarget)
                  + LLConst.Skill.getTriggerLimitDescription(curCard.limit_range)
               );
            }
         },
         'setSelected': function (selected) {
            if (selected == curSelected) return;
            curSelected = selected;
            row.setClassName(curSelected ? 'info' : '');
         },
         'getCardId': function () {
            if (curCard && curCard.id) {
               return curCard.id + '';
            }
            return undefined;
         }
      };
      return controller;
   }

   function renderPagination() {
      /** @type {LLH.Table.LLCardTableComponent_PaginationController} */
      var controller;
      var pageCount = 0;
      var selectedPage = 0;
      /** @type {LLH.Table.LLCardTableComponent_PageButtonController[]} */
      var pageButtonControllers = [];

      var ul = createElement('ul', {'className': 'pagination'});

      var pushPage = function() {
         /** @type {LLH.Table.LLCardTableComponent_PageButtonController} */
         var pageButtonController;
         pageCount += 1;
         var myPageId = pageCount;
         var li = createElement('li', undefined,
            createElement('a', {'href': 'javascript:;'}, [myPageId + ''], {
               'click': function () {
                  if (selectedPage == myPageId) return;
                  if (selectedPage) {
                     pageButtonControllers[selectedPage-1].setActive(false);
                  }
                  pageButtonController.setActive(true);
                  selectedPage = myPageId;
                  if (controller.onPageChange) {
                     controller.onPageChange(myPageId);
                  }
               }
            })
         );
         pageButtonController = {
            'setActive': function(active) {
               li.className = (active ? 'active' : '');
            },
            'element': li
         }
         pageButtonControllers.push(pageButtonController);
         updateSubElements(ul, li);
         return pageButtonController;
      };
      var popPage = function() {
         var pageButtonController = pageButtonControllers.pop();
         if (!pageButtonController) return;
         var myPageId = pageCount;
         pageCount -= 1;
         if (selectedPage == myPageId) {
            selectedPage = 1;
            pageButtonControllers[0].setActive(true);
            if (controller.onPageChange) {
               controller.onPageChange(selectedPage);
            }
         }
         ul.removeChild(pageButtonController.element);
      };

      controller = {
         'element': createElement('nav', undefined, ul),
         'setPageCount': function (count) {
            if (count <= 0) count = 1;
            if (count == pageCount) return;
            if (count > pageCount) {
               while (pageCount < count) pushPage();
            } else {
               while (pageCount > count) popPage();
            }
         },
         'getSelectedPage': function() {
            return selectedPage;
         }
      };

      pushPage().setActive(true);
      selectedPage = 1;
      return controller;
   }

   /**
    * @param {LLH.Table.LLCardTableComponent_CardInfo} cardInfo 
    * @param {boolean} isSelected 
    * @returns {number} delta
    */
   function setCardInfoSelected(cardInfo, isSelected) {
      if (cardInfo.selected != isSelected) {
         cardInfo.selected = isSelected;
         return (isSelected ? 1 : -1);
      }
      return 0;
   }

   class LLCardTableComponent extends LLComponentBase {
      /**
       * @param {LLH.Table.LLCardTableComponent_Options} options 
       */
      constructor(options) {
         var container = LLUnit.getOrCreateElement(options.id, 'div', {'className': 'card-table'});
         super(container);
         this.element = container;

         var me = this;

         var selectAllButton = new LLButtonComponent({'text': '全选', 'click': () => me.selectAll()});
         var selectNoneButton = new LLButtonComponent({'text': '清空选择', 'click': () => me.selectNone()});
         var selectReverseButton = new LLButtonComponent({'text': '反选', 'click': () => me.selectReverse()});
         var selectAllForPageButton = new LLButtonComponent({'text': '单页全选', 'click': () => me.selectAll(true)});
         var selectNoneForPageButton = new LLButtonComponent({'text': '单页清空选择', 'click': () => me.selectNone(true)});
         var selectReverseForPageButton = new LLButtonComponent({'text': '单页反选', 'click': () => me.selectReverse(true)});
         var selectedCountSpan = new LLValuedComponent(createElement('div', {'className': 'btn-group'}, ['共0项']));
         var onSelectButtons = undefined;
         var alwaysEnabledButtons = undefined;
         if (options.toolbarButtons && options.toolbarButtons.length > 0) {
            onSelectButtons = createElement('div', {'className': 'btn-group'}, options.toolbarButtons.map((x) => x.element));
         }
         if (options.toolbarEnabledButtons && options.toolbarEnabledButtons.length > 0) {
            alwaysEnabledButtons = createElement('div', {'className': 'btn-group'}, options.toolbarEnabledButtons.map((x) => x.element));
         }

         var thead = createElement('thead', undefined, [
            createElement('tr', undefined, [
               createElement('th', {'style': {'width': '150px'}}, '编号'),
               createElement('th', undefined, 'smile'),
               createElement('th', undefined, 'pure'),
               createElement('th', undefined, 'cool'),
               createElement('th', undefined, '触发条件'),
               createElement('th', undefined, '概率'),
               createElement('th', undefined, '技能类型')
            ])
         ])
         var tbody = createElement('tbody');
         var pageController = renderPagination();

         updateSubElements(container, createElement('div', {'className': 'btn-toolbar'}, [
            createElement('div', {'className': 'btn-group'}, [selectAllButton.element, selectNoneButton.element, selectReverseButton.element]),
            createElement('div', {'className': 'btn-group'}, [selectAllForPageButton.element, selectNoneForPageButton.element, selectReverseForPageButton.element]),
            onSelectButtons,
            alwaysEnabledButtons,
            selectedCountSpan.element
         ]));
         updateSubElements(container, createElement('table', {'className': 'table table-hover'}, [thead, tbody]));
         updateSubElements(container, pageController.element);

         pageController.onPageChange = function() {
            me.refreshPage();
         }

         this.tbody = tbody;
         this.selectedCountSpan = selectedCountSpan;
         this.toolbarButtons = options.toolbarButtons;

         this.pageController = pageController;
         this.pageSize = 10;
         this.selectedCount = 0;
         this.cardData = options.cards;
         /** @type {LLH.Table.LLCardTableComponent_CardInfo[]} */
         this.cardsInfo = [];
         /** @type {LLH.Table.LLCardTableComponent_RowController[]} */
         this.rowControllers = [];
         for (var i = 0; i < this.pageSize; i++) {
            var newRowController = renderRow();
            this.rowControllers.push(newRowController);
            updateSubElements(this.tbody, newRowController.element);
            newRowController.onClick = (function (index) {
               return function () {
                  me.onRowClick(index);
               }
            })(i);
         }

         this.updateToolbarButtons(false);
      }
      /** @param {LLH.Core.CardIdStringType[]} newCardIds */
      setCardList(newCardIds) {
         /** @type {LLH.Table.LLCardTableComponent_CardInfo[]} */
         var cardsInfo = [];
         var i;

         for (i = 0; i < newCardIds.length; i++) {
            cardsInfo.push({
               'cardId': newCardIds[i],
               'selected': false
            });
         }
         this.cardsInfo = cardsInfo;
         this.pageController.setPageCount(Math.ceil(cardsInfo.length / this.pageSize));
         this.refreshPage();
         this.updateSelectedCount(-this.selectedCount);
      }
      getPageStartPos() {
         var curPage = this.pageController.getSelectedPage();
         return (curPage - 1) * this.pageSize;
      }
      refreshPage() {
         var startPos = this.getPageStartPos();
         for (var i = 0; i < this.pageSize; i++) {
            var curPos = startPos + i;
            var curRow = this.rowControllers[i];
            if (curPos < this.cardsInfo.length) {
               var curCardInfo = this.cardsInfo[curPos];
               curRow.setCardData(this.cardData[curCardInfo.cardId]);
               curRow.setSelected(curCardInfo.selected);
            } else {
               curRow.setCardData(undefined);
               curRow.setSelected(false);
            }
         }
      }
      /** @param {number} delta */
      updateSelectedCount(delta) {
         var lastHasSelect = (this.selectedCount != 0);
         this.selectedCount += delta;
         var curHasSelect = (this.selectedCount != 0);
         if (curHasSelect) {
            this.selectedCountSpan.set('选中' + this.selectedCount + '项，共' + this.cardsInfo.length + '项');
         } else {
            this.selectedCountSpan.set('共' + this.cardsInfo.length + '项');
         }
         if (lastHasSelect != curHasSelect) {
            this.updateToolbarButtons(curHasSelect);
         }
      }
      /** @param {boolean} enabled */
      updateToolbarButtons(enabled) {
         if (!this.toolbarButtons) return;
         for (var i = 0; i < this.toolbarButtons.length; i++) {
            this.toolbarButtons[i].setEnabled(enabled);
         }
      }
      /** @param {number} index */
      onRowClick(index) {
         var curCardInfo = this.cardsInfo[this.getPageStartPos() + index];
         if (curCardInfo) {
            var delta = setCardInfoSelected(curCardInfo, this.rowControllers[index].isSelected());
            this.updateSelectedCount(delta);
         }
      }
      getSelectedCardList() {
         /** @type {LLH.Core.CardIdStringType[]} */
         var cardIds = [];
         for (var i = 0; i < this.cardsInfo.length; i++) {
            var curCardInfo = this.cardsInfo[i];
            if (curCardInfo.selected) {
               cardIds.push(curCardInfo.cardId);
            }
         }
         return cardIds;
      }
      /** @param {boolean} [isPage] */
      selectAll(isPage) {
         this.applySelectImpl(() => true, isPage);
      }
      /** @param {boolean} [isPage] */
      selectNone(isPage) {
         this.applySelectImpl(() => false, isPage);
      }
      /** @param {boolean} [isPage] */
      selectReverse(isPage) {
         this.applySelectImpl((b) => !b, isPage);
      }
      /**
       * @param {(boolean) => boolean} applyCallback 
       * @param {boolean} [isPage]
       */
      applySelectImpl(applyCallback, isPage) {
         var i;
         var startPos = this.getPageStartPos();
         var delta = 0;
         for (i = 0; i < this.rowControllers.length; i++) {
            var curPos = i + startPos;
            if (curPos < this.cardsInfo.length) {
               var curCardInfo = this.cardsInfo[curPos];
               delta += setCardInfoSelected(curCardInfo, applyCallback(curCardInfo.selected));
               this.rowControllers[i].setSelected(curCardInfo.selected);
            } else {
               this.rowControllers[i].setSelected(false);
            }
         }   
         if (!isPage) {
            var endPos = startPos + this.pageSize;
            for (i = 0; i < this.cardsInfo.length; i++) {
               if (i < startPos || i >= endPos) {
                  var curCardInfo = this.cardsInfo[i];
                  delta += setCardInfoSelected(curCardInfo, applyCallback(curCardInfo.selected));
               }
            }
         }
         this.updateSelectedCount(delta);
      }
   }
   return LLCardTableComponent;
})();

var LLCardPoolComponent = (function () {
   const createElement = LLUnit.createElement;
   const createSelectElement = LLUnit.createSelectElement;
   const updateSubElements = LLUnit.updateSubElements;
   const createFormSelect = LLUnit.createFormSelect;
   const createFormInlineGroup = LLUnit.createFormInlineGroup;

   const NEW_POOL_VALUE = 'new';

   /**
    * @param {string} poolsKey
    * @param {LLH.Table.LLCardTableComponent} cardTable
    */
   function renderPoolsSelect(poolsKey, cardTable) {
      /** @type {LLH.Pool.LLCardPoolComponent_PoolsSelectController} */
      var controller;

      var poolSelect = new LLSelectComponent(createFormSelect());
      var newPoolInput = new LLValuedComponent(createElement('input', {'type': 'text', 'className': 'form-control small-padding'}));
      var addPoolButton = new LLButtonComponent({'text': '添加卡池', 'colorStyle': 'primary'});
      var addPoolMessage = new LLValuedComponent(createElement('div', {'style': {'color': 'red'}}));
      var newPoolContainer = new LLComponentBase(createElement('div', undefined, [
         createFormInlineGroup('输入新卡池名字', [newPoolInput.element, addPoolButton.element]),
         addPoolMessage.element
      ]));

      /** @type {LLH.Pool.CardPoolsProcessedDataType} */
      var pools = LLPoolUtil.loadPools(poolsKey);

      function reloadSelect() {
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var options = [
            {'value': NEW_POOL_VALUE, 'text': '添加新卡池'}
         ];
         for (var i = 0; i < pools.length; i++) {
            var pool = pools[i];
            options.push({'value': i + '', 'text': pool.raw.name + '（卡片数：' + pool.raw.items.length + '）'});
         }
         poolSelect.setOptions(options);
      }
      /** @param {LLH.Pool.CardPoolProcessedDataType} curPool */
      function savePoolChange(curPool) {
         cardTable.setCardList(curPool.raw.items);
         reloadSelect();
         LLPoolUtil.savePools(poolsKey, pools);
         if (controller.onPoolSave) {
            controller.onPoolSave(curPool);
         }
      }

      poolSelect.onValueChange = function (newValue) {
         if (NEW_POOL_VALUE == newValue) {
            newPoolContainer.show();
            addPoolMessage.hide();
            cardTable.hide();
            if (controller.onPoolSelectChange) {
               controller.onPoolSelectChange();
            }
         } else {
            cardTable.setCardList(pools[parseInt(newValue)].raw.items);
            newPoolContainer.hide();
            cardTable.show();
            if (controller.onPoolSelectChange) {
               controller.onPoolSelectChange(pools[parseInt(newValue)]);
            }
         }
      };
      addPoolButton.on('click', function (e) {
         var newPoolName = newPoolInput.get();
         var errorMessage = LLPoolUtil.addPool(pools, newPoolName);
         if (errorMessage) {
            addPoolMessage.set(errorMessage);
            addPoolMessage.show();
            return;
         } else {
            addPoolMessage.hide();
         }
         LLPoolUtil.savePools(poolsKey, pools);
         reloadSelect();
         poolSelect.set((pools.length-1) + '');
         newPoolInput.set('');
      });

      controller = {
         'getPools': function() { return pools; },
         'getSelectedPool': function() {
            var id = poolSelect.getOrElse(NEW_POOL_VALUE);
            if (NEW_POOL_VALUE == id) {
               return undefined;
            } else {
               return pools[parseInt(id)];
            }
         },
         'addCardsToSelectedPool': function(cardIds) {
            var curPool = controller.getSelectedPool();
            if (!curPool) return 0;
            var count = 0;
            for (var i = 0; i < cardIds.length; i++) {
               var cardId = cardIds[i];
               if (curPool.itemSet.has(cardId)) continue;
               curPool.itemSet.add(cardId);
               curPool.raw.items.push(cardId);
               count += 1;
            }
            if (count > 0) {
               savePoolChange(curPool);
            }
            return count;
         },
         'replaceCardsToSelectedPool': function(cardIds) {
            var curPool = controller.getSelectedPool();
            if (!curPool) return 0;
            var origCount = curPool.raw.items.length;
            curPool.itemSet.clear();
            curPool.raw.items.splice(0, origCount);
            var count = controller.addCardsToSelectedPool(cardIds);
            if (origCount > 0 && count == 0) {
               savePoolChange(curPool);
            }
            return count;
         },
         'removeCardsFromSelectedPool': function(cardIds) {
            var curPool = controller.getSelectedPool();
            if (!curPool) return 0;
            var i;
            /** @type {Set<LLH.Core.CardIdStringType>} */
            var cardSet = new Set();
            for (i = 0; i < cardIds.length; i++) {
               var cardId = cardIds[i];
               if (!curPool.itemSet.has(cardId)) continue;
               curPool.itemSet.delete(cardId);
               cardSet.add(cardId);
            }
            if (cardSet.size > 0) {
               /** @type {LLH.Core.CardIdStringType[]} */
               var newItems = [];
               for (i = 0; i < curPool.raw.items.length; i++) {
                  var item = curPool.raw.items[i];
                  if (cardSet.has(item)) continue;
                  newItems.push(item);
               }
               curPool.raw.items = newItems;
               cardTable.setCardList(curPool.raw.items);
               reloadSelect();
               LLPoolUtil.savePools(poolsKey, pools);
               if (controller.onPoolSave) {
                  controller.onPoolSave(curPool);
               }
            }
            return cardSet.size;
         },
         'removeSelectedPool': function() {
            var curSelect = poolSelect.getOrElse(NEW_POOL_VALUE);
            if (curSelect == NEW_POOL_VALUE) return;
            var index = parseInt(curSelect);
            LLPoolUtil.removePoolByIndex(pools, index);
            LLPoolUtil.savePools(poolsKey, pools);
            reloadSelect();
            poolSelect.set(NEW_POOL_VALUE);
         },
         'element': [
            createFormInlineGroup('编辑卡池', [poolSelect.element]),
            newPoolContainer.element
         ]
      };

      reloadSelect();
      poolSelect.onValueChange(poolSelect.getOrElse(NEW_POOL_VALUE));

      return controller;
   }

   /** @param {LLH.Pool.LLCardPoolComponent_PoolsSelectController} poolSelectController */
   function renderImportExportDialog(poolSelectController) {
      var curPool = poolSelectController.getSelectedPool();
      if (!curPool) return;

      var messageSpan = new LLValuedComponent(createElement('div', {'style': {'color': 'red'}}));
      /** @type {HTMLTextAreaElement} */
      var textArea = createElement('textarea', {'style': {'width': '100%', 'height': '201px'}}, [LLSaveLoadJsonHelper.commonSaveJson(curPool.raw.items)]);
      /** @param {boolean} isAdd */
      var handleImport = function (isAdd) {
         if (!textArea.value) {
            messageSpan.set('无导入数据');
            return;
         }
         messageSpan.set('');
         var loadSuccess = LLSaveLoadJsonHelper.commonLoadJson(function(data) {
            if (Array.isArray(data)) {
               var count = 0;
               if (isAdd) {
                  count = poolSelectController.addCardsToSelectedPool(data);
                  if (count > 0) {
                     messageSpan.set('导入成功，新增' + count + '张卡片');
                  } else {
                     messageSpan.set('无新卡片');
                  }
               } else {
                  count = poolSelectController.replaceCardsToSelectedPool(data);
                  messageSpan.set('导入成功，现有' + count + '张卡片');
               }
            } else {
               messageSpan.set('无法识别导入数据');
            }
         }, textArea.value);
         if (!loadSuccess) {
            messageSpan.set('无法识别导入数据');
         }
      };
      var importAdd = new LLButtonComponent({
         'text': '导入（添加）',
         'colorStyle': 'primary',
         'tooltips': '通过添加的方式导入数据，只添加不在当前卡池中的卡，不影响当前卡池中已有的卡。',
         'click': () => handleImport(true)
      });
      var importReplace = new LLButtonComponent({
         'text': '导入（覆盖）',
         'colorStyle': 'danger',
         'tooltips': '通过覆盖的方式导入数据，当前卡池中的卡会被完全覆盖。',
         'style': {'marginLeft': '12px'},
         'click': () => handleImport(false)
      });

      LLDialogComponent.openDialog({
         'content': createElement('div', {'style': {'width': '100%'}}, [
            createElement('div', {'className': 'dialog-title-section'}, ['卡池导入/导出']),
            createElement('div', undefined, [
               createElement('p', undefined, ['当前卡池：' + curPool.raw.name]),
               createElement('p', undefined, ['卡池数据：']),
               textArea,
               messageSpan.element
            ]),
            createElement('div', {'className': 'dialog-bottom-section'}, [importAdd.element, importReplace.element])
         ]),
         'width': '50%',
         'height': 'auto'
      });
   }

   /**
    * @implements {LLH.Mixin.LanguageSupport}
    */
   class LLCardPoolComponent {
      /**
       * @param {LLH.Pool.LLCardPoolComponent_Options} options 
       */
      constructor(options) {
         var container = LLUnit.getOrCreateElement(options.id, 'div');
         var selectorHeader = new LLComponentBase(createElement('h3', undefined, ['选择要添加的卡片']));
         var selectorContainer = createElement('div');
         var selectorContainerComponent = new LLComponentBase(selectorContainer);
         var removeFromPoolButton = new LLButtonComponent({'text': '从卡池中移除', 'colorStyle': 'danger', 'tooltips': '将选中的卡片从当前卡池中移除'});
         var addToPoolButton = new LLButtonComponent({'text': '添加到卡池', 'colorStyle': 'primary', 'tooltips': '将选中的卡片添加到当前卡池中'});
         var removePoolButton = new LLButtonComponent({'text': '删除卡池', 'colorStyle': 'danger', 'tooltips': '删除当前卡池'});
         var importExportButton = new LLButtonComponent({'text': '导入/导出'});
         var poolCardTable = new LLCardTableComponent({
            'cards': options.cards,
            'toolbarButtons': [removeFromPoolButton],
            'toolbarEnabledButtons': [importExportButton, removePoolButton]
         });
         var selectorCardTable = new LLCardTableComponent({'cards': options.cards, 'toolbarButtons': [addToPoolButton]});

         this.controller = renderPoolsSelect(options.poolsKey, poolCardTable);
         this.pools = this.controller.getPools();
         this.cardSelector = new LLCardSelectorComponent(selectorContainer, {'cards': options.cards, 'pools': this.pools});

         var me = this;
         var selector = this.cardSelector;
         var origOnValueChange = selector.onValueChange;
         selector.onValueChange = function (name, newValue) {
            if (origOnValueChange) {
               origOnValueChange.apply(selector, [name, newValue]);
            }
            selectorCardTable.setCardList(selector.getFilteredCardIdList());
         };
         this.controller.onPoolSelectChange = function (pool) {
            var visible = (pool !== undefined);
            selectorHeader.setVisible(visible);
            selectorContainerComponent.setVisible(visible);
            selectorCardTable.setVisible(visible);
         };
         this.controller.onPoolSave = function () {
            selector.updatePoolsOptions();
            selectorCardTable.setCardList(selector.getFilteredCardIdList());
         };

         addToPoolButton.on('click', function() {
            var selectedCardIds = selectorCardTable.getSelectedCardList();
            if (selectedCardIds.length > 0) {
               me.controller.addCardsToSelectedPool(selectedCardIds);
            }
         });
         removeFromPoolButton.on('click', function() {
            var selectedCardIds = poolCardTable.getSelectedCardList();
            if (selectedCardIds.length > 0) {
               me.controller.removeCardsFromSelectedPool(selectedCardIds);
            }
         });
         removePoolButton.on('click', function() {
            var selectedPool = me.controller.getSelectedPool();
            if (selectedPool) {
               LLYesNoDialogComponent.openYesNoDialog({
                  'title': ['删除卡池'],
                  'question': ['确认要删除卡池[' + selectedPool.raw.name + ']吗？'],
                  'answerCallback': function (answer) {
                     if (answer) {
                        me.controller.removeSelectedPool();
                     }
                  }
               });
            }
         });
         importExportButton.on('click', function() {
            renderImportExportDialog(me.controller);
         });

         updateSubElements(container, this.controller.element, true);
         updateSubElements(container, [
            poolCardTable.element,
            selectorHeader.element,
            selectorContainer,
            selectorCardTable.element
         ]);

         this.controller.onPoolSelectChange(this.controller.getSelectedPool());
         selectorCardTable.setCardList(selector.getFilteredCardIdList());
      }
      /** @param {LLH.Core.LanguageType} language */
      setLanguage(language) {
         this.cardSelector.setLanguage(language);
      }
   }
   return LLCardPoolComponent;
})();

var LLCardStatusComponent = (function () {
   const createElement = LLUnit.createElement;

   const SMILE_DEFAULT = '0';
   const PURE_DEFAULT = '0';
   const COOL_DEFAULT = '0';
   const KIZUNA_DEFAULT = '0';
   const HP_DEFAULT = '1';

   const CHK_ID_MEZAME = 'mezame';
   const SEL_ID_LEVEL = 'level';
   const SEL_ID_LEVEL_LIMIT_PATTERN = 'level_limit_pattern';
   const MEM_ID_RARITY = 'rarity';

   /**
    * @param {string} defaultValue
    * @param {string} [color] 
    * @returns {HTMLInputElement}
    */
   function createNumberInput(defaultValue, color) {
      /** @type {LLH.Component.CreateElementOptions} */
      var opt = {'type': 'number', 'className': 'form-control small-padding num-size-4', 'value': defaultValue, 'autocomplete': 'off'};
      if (color) {
         opt.style = {'color': color};
      }
      return createElement('input', opt);
   }

   class LLCardStatusComponent extends LLFiltersComponent {
      /** @param {LLH.Layout.CardStatus.LLCardStatusComponent_Options} [options] */
      constructor(options) {
         super();
         if (!options) options = {};
         this.element = LLUnit.getOrCreateElement(options.id, 'div');

         /** @type {LLH.Component.LLValuedComponent<HTMLElement, boolean>} */
         this._mezameComp = new LLValuedComponent(createElement('input', {'type': 'checkbox'}));
         this._levelComp = new LLSelectComponent(LLUnit.createFormSelect());
         this._levelLimitPatternComp = new LLSelectComponent(LLUnit.createFormSelect());
         this._rarityComp = new LLValuedMemoryComponent(/** @type {LLH.Core.RarityStringType} */ ('N'));
         this.smileComp = new LLValuedComponent(createNumberInput(SMILE_DEFAULT, 'red'));
         this.pureComp = new LLValuedComponent(createNumberInput(PURE_DEFAULT, 'green'));
         this.coolComp = new LLValuedComponent(createNumberInput(COOL_DEFAULT, 'blue'));
         this.mainColorComp = new LLSelectComponent(LLUnit.createFormSelect());
         this.mainColorComp.setOptions([
            {'text': 'smile', 'value': 'smile', 'color': 'red'},
            {'text': 'pure', 'value': 'pure', 'color': 'green'},
            {'text': 'cool', 'value': 'cool', 'color': 'blue'}
         ]);
         this.kizunaComp = new LLValuedComponent(createNumberInput(KIZUNA_DEFAULT));
         this.hpComp = new LLValuedComponent(createNumberInput(HP_DEFAULT));
         this.avatarComp = new LLAvatarComponent({'smallAvatar': true});
         this.skillComp = new LLSkillComponent({'showLabel': true});

         /** @type {LLH.Core.CardIdStringType=} */
         this.cardId = undefined;

         this.addFilterable(CHK_ID_MEZAME, this._mezameComp);
         this.addFilterable(SEL_ID_LEVEL, this._levelComp);
         this.addFilterable(SEL_ID_LEVEL_LIMIT_PATTERN, this._levelLimitPatternComp);
         this.addFilterable(MEM_ID_RARITY, this._rarityComp);

         var me = this;

         this.setFilterOptionGroupCallback(SEL_ID_LEVEL, function () {
            var rarity = me._rarityComp.get();
            var mezame = me._mezameComp.get();
            var limitPattern = me._levelLimitPatternComp.getOrElse('1');
            if (rarity == 'UR' && mezame) {
               return 'UR_1_' + limitPattern;
            } else {
               return rarity + '_' + (mezame ? '1' : '0');
            }
         }, [CHK_ID_MEZAME, SEL_ID_LEVEL_LIMIT_PATTERN, MEM_ID_RARITY]);
         this.setFilterOptionGroupCallback(SEL_ID_LEVEL_LIMIT_PATTERN, function () {
            var rarity = me._rarityComp.get();
            var mezame = me._mezameComp.get();
            return (rarity == 'UR' && mezame) ? '1' : '';
         }, [CHK_ID_MEZAME, MEM_ID_RARITY])

         /** @type {(name: string, newValue: any) => void} */
         this.onValueChange = function (name, value) {
            if (name == CHK_ID_MEZAME || name == SEL_ID_LEVEL || name == SEL_ID_LEVEL_LIMIT_PATTERN) {
               me.applyCardData(me.cardId);
            }
         };

         LLUnit.updateSubElements(this.element, [
            LLUnit.createFormInlineGroup('觉醒：', [this._mezameComp.element, '（特典卡需选择觉醒）']),
            LLUnit.createFormInlineGroup('等级：', [this._levelLimitPatternComp.element, this._levelComp.element]),
            createElement('div', {'style': {'float': 'left'}}, [
               LLUnit.createFormInlineGroup('裸smile：', [this.smileComp.element]),
               LLUnit.createFormInlineGroup('裸pure：', [this.pureComp.element]),
               LLUnit.createFormInlineGroup('裸cool：', [this.coolComp.element]),
               LLUnit.createFormInlineGroup('主属性：', [this.mainColorComp.element]),
               LLUnit.createFormInlineGroup('绊：', [this.kizunaComp.element]),
               LLUnit.createFormInlineGroup('HP：', [this.hpComp.element]),
            ]),
            createElement('div', {'style': {'float': 'left'}}, [
               this.avatarComp.element
            ]),
            createElement('div', {'style': {'clear': 'both'}}, [
               this.skillComp.element
            ])
         ], true);

         this._initSelectOptions();
      }
      _initSelectOptions() {
         this.setFreezed(true);

         var i;

         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var patternOptions = [];
         var levelLimitPatterns = LLConst.Level.getLevelLimitPatterns();
         for (i = 0; i < levelLimitPatterns.length; i++) {
            var patternId = levelLimitPatterns[i];
            patternOptions.push({'value': patternId, 'text': '模式' + patternId});
         }
         this.setFilterOptionGroups(SEL_ID_LEVEL_LIMIT_PATTERN, {'1': patternOptions});

         /** @type {LLH.Component.LLFiltersComponent_OptionGroupType} */
         var levelOptionGrouops = {};
         levelOptionGrouops['N_0'] = [{'value': '30', 'text': 'Lv.30'}];
         levelOptionGrouops['N_1'] = [{'value': '40', 'text': 'Lv.40'}];
         levelOptionGrouops['R_0'] = [{'value': '40', 'text': 'Lv.40'}];
         levelOptionGrouops['R_1'] = [{'value': '60', 'text': 'Lv.60'}];
         levelOptionGrouops['SR_0'] = [{'value': '60', 'text': 'Lv.60'}];
         levelOptionGrouops['SR_1'] = [{'value': '80', 'text': 'Lv.80'}];
         levelOptionGrouops['SSR_0'] = [{'value': '70', 'text': 'Lv.70'}];
         levelOptionGrouops['SSR_1'] = [{'value': '90', 'text': 'Lv.90'}];
         levelOptionGrouops['UR_0'] = [{'value': '80', 'text': 'Lv.80'}];
         for (i = 0; i < levelLimitPatterns.length; i++) {
            var patternId = levelLimitPatterns[i];
            var levelLimitData = LLConst.Level.getLevelLimit(patternId) || {};
            var levels = Object.keys(levelLimitData).sort((a, b) => parseInt(a) - parseInt(b));
            /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
            var levelOptions = [];
            for (var j = 0; j < levels.length; j++) {
               var curLevel = levels[j];
               var addValue = levelLimitData[curLevel];
               levelOptions.push({'value': curLevel, 'text': 'Lv.' + curLevel + '（属性+' + addValue + '）'});
            }
            levelOptionGrouops['UR_1_' + patternId] = levelOptions;
         }
         this.setFilterOptionGroups(SEL_ID_LEVEL, levelOptionGrouops);

         this.setFreezed(false);
         this.handleFilters();
      }
      /** @param {LLH.Core.CardIdStringType} [cardId] */
      applyCardData(cardId) {
         var mezame = this._mezameComp.get();
         var me = this;
         this.cardId = cardId;
         if (cardId) {
            this.avatarComp.setCard(cardId, mezame);
            LoadingUtil.startSingle(LLCardData.getDetailedData(cardId)).then(function (card) {
               me._rarityComp.set(card.rarity);
               me.mainColorComp.set(card.attribute);
               me.skillComp.setCardData(card);
               if (!mezame) {
                  me.smileComp.set(card.smile + '');
                  me.pureComp.set(card.pure + '');
                  me.coolComp.set(card.cool + '');
                  me.hpComp.set(card.hp + '');
               } else {
                  var addValue = 0;
                  if (card.rarity == 'UR') {
                     addValue = LLConst.Level.getLevelLimitAttributeDiff(me._levelLimitPatternComp.getOrElse('1'), me._levelComp.getOrElse('100'));
                  }
                  me.smileComp.set((card.smile2 + addValue) + '');
                  me.pureComp.set((card.pure2 + addValue) + '');
                  me.coolComp.set((card.cool2 + addValue) + '');
                  me.hpComp.set((card.hp + 1) + '');
               }
               me.kizunaComp.set(LLConst.Common.getMaxKizuna(card.rarity, mezame) + '');
            }, defaultHandleFailedRequest);
         } else {
            this.avatarComp.setCard();
            this.skillComp.setCardData();
         }
      }
      /** @returns {LLH.Internal.MemberSaveDataType} */
      getMemberData() {
         var kizunaValue = parseInt(this.kizunaComp.getOrElse(KIZUNA_DEFAULT));
         var mainAttribute = this.mainColorComp.get();
         var kizunaSmile = 0, kizunaPure = 0, kizunaCool = 0;
         if (mainAttribute == 'smile') {
            kizunaSmile = kizunaValue;
         } else if (mainAttribute == 'pure') {
            kizunaPure = kizunaValue;
         } else if (mainAttribute == 'cool') {
            kizunaCool = kizunaValue;
         }
         return {
            'cardid': this.cardId || '',
            'mezame': (this._mezameComp.get() ? 1 : 0),
            'hp': parseInt(this.hpComp.getOrElse(HP_DEFAULT)),
            'smile': parseInt(this.smileComp.getOrElse(SMILE_DEFAULT)) + kizunaSmile,
            'pure': parseInt(this.pureComp.getOrElse(PURE_DEFAULT)) + kizunaPure,
            'cool': parseInt(this.coolComp.getOrElse(COOL_DEFAULT)) + kizunaCool,
            'skilllevel': this.skillComp.skillLevel + 1
         };
      }
   }
   return LLCardStatusComponent;
})();

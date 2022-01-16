/*
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
 *     +- LLSkillContainer
 *     +- LLCardSelector
 *     +- LLSongSelector
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
 *   LLSongSelectorComponent
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
      // var arr = [];
      // for (var i = 0; i < arguments.length; i++) {
      //    arr.push(arguments[i]);
      // }
      // return $.when.apply($, arr);
      return $.when.apply($, args);
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

      var updateProgress = function(){};
      if (progressbox) {
         updateProgress = function() {
            if (failedCount == 0) {
               progressbox.innerHTML = finishedCount + ' / ' + totalCount;
            } else {
               progressbox.innerHTML = (finishedCount + failedCount) + ' / ' + totalCount + ' (' + failedCount + '个资源载入失败)';
            }
         }
      }
      var updateLoadingBox = function(){};
      if (loadingbox) {
         updateLoadingBox = function(s) {
            loadingbox.style.display = s;
         }
      }

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
   }
};

var LLClassUtil = {
   /**
    * Set super class
    * @param {class} cls 
    * @param {class} superCls 
    */
   'setSuper': function (cls, superCls) {
      var s = function () {};
      s.prototype = superCls.prototype;
      cls.prototype = new s();
      cls.prototype.constructor = cls;
  }
};

var LLHelperLocalStorage = {
   'localStorageDataVersionKey': 'llhelper_data_version__',
   'localStorageDistParamKey': 'llhelper_dist_param__',
   'localStorageLLNewUnitTeamKey': 'llhelper_llnewunit_team__',
   'localStorageLLNewUnitSisTeamKey': 'llhelper_llnewunitsis_team__',
   'localStorageLLNewAutoUnitTeamKey': 'llhelper_llnewautounit_team__',
   'localStorageSongSelectKey': 'llhelper_song_select__',
   'localStorageCardSelectKey': 'llhelper_card_select__',

   'getDataVersion': function () {
      var version;
      try {
         version = localStorage.getItem(LLHelperLocalStorage.localStorageDataVersionKey);
      } catch (e) {
         version = 'latest';
         console.error(e);
      }
      return (version || 'latest');
   },
   'setDataVersion': function (v) {
      try {
         localStorage.setItem(LLHelperLocalStorage.localStorageDataVersionKey, v);
      } catch (e) {
         console.error(e);
      }
   },
   'getData': function (key, default_value) {
      var ret;
      try {
         ret = localStorage.getItem(key);
         if (ret === undefined) ret = default_value;
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
   function LLData_cls(brief_url, detail_url, brief_keys, version) {
      this.briefUrl = brief_url;
      this.detailUrl = detail_url;
      this.briefKeys = brief_keys;
      this.briefCache = {};
      this.briefCachedKeys = {};
      this.detailCache = {};
      this.setVersion(version);
   }
   var cls = LLData_cls;
   var proto = cls.prototype;

   proto.setVersion = function(version) {
      if (version === undefined) {
         version = LLHelperLocalStorage.getDataVersion();
      }
      this.version = version;
      this.initVersion(version);
   };
   proto.initVersion = function (version) {
      if (!this.briefCache[version]) {
         this.briefCache[version] = {};
         this.briefCachedKeys[version] = {};
         this.detailCache[version] = {};
      }
   };
   proto.getVersion = function() {
      return this.version;
   };
   proto.getCachedBriefData = function() {
      return this.briefCache[this.version];
   };

   proto.getAllBriefDataWithVersion = function(version, keys, url) {
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
   proto.getAllBriefData = function(keys, url) {
      return this.getAllBriefDataWithVersion(this.version, keys, url);
   };

   proto.getDetailedDataWithVersion = function(version, index, url) {
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
   proto.getDetailedData = function(index, url) {
      return this.getDetailedDataWithVersion(this.version, index, url);
   };
   return cls;
})();

var LLSimpleKeyData = (function () {
   function LLSimpleKeyData_cls(url, keys) {
      this.url = url;
      this.keys = keys;
      this.cache = {};
   }
   var cls = LLSimpleKeyData_cls;
   var proto = cls.prototype;
   proto.get = function(keys, url) {
      if (keys === undefined) keys = this.keys;
      if (url === undefined) url = this.url;
      var me = this;
      var missingKeys = [];
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
   };
   return cls;
})();

var LLCardData = new LLData('/lldata/cardbrief', '/lldata/card/',
   ['id', 'typeid', 'support', 'rarity', 'attribute', 'special', 'type', 'skilleffect', 'triggertype', 'triggerrequire', 'eponym', 'jpeponym', 'hp', 'album']);
var LLSongData = new LLData('/lldata/songbrief', '/lldata/song/',
   ['id', 'attribute', 'name', 'jpname', 'settings', 'group']);
var LLSisData = new LLData('/lldata/sisbrief', '/lldata/sis/',
   ['id', 'type', 'jpname', 'level', 'size', 'range', 'effect_type', 'effect_value', 'color', 'fixed', 'member', 'grade', 'group',
    'trigger_ref', 'trigger_value', 'sub_skill', 'live_effect_type', 'live_effect_interval', 'level_up_skill']);
var LLMetaData = new LLSimpleKeyData('/lldata/metadata', ['album', 'member_tag', 'unit_type', 'cskill_groups']);

var LLMapNoteData = (function () {
   function LLMapNoteData_cls(base_url) {
      this.baseUrl = (base_url || 'https://rawfile.loveliv.es/livejson/');
      this.cache = {};
   }
   var cls = LLMapNoteData_cls;
   var proto = cls.prototype;
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
   proto.getMapNoteData = function (song, songSetting) {
      var defer = LLDepends.createDeferred();
      if (song.attribute == '') {
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
   proto.getLocalMapNoteData = function (song, songSetting) {
      var me = this;
      var defer = LLDepends.createDeferred();
      if (song.attribute == '') {
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
   return cls;
})();

// base components

var LLComponentBase = (function () {
   function LLComponentBase_cls(id, options) {
      this.id = undefined;
      this.exist = false;
      this.visible = false;
      if (id) {
         if (typeof(id) == 'string') this.id = id;
         this.element = LLUnit.getElement(id);
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
   };
   /** @type {typeof LLH.Component.LLComponentBase} */
   var cls = LLComponentBase_cls;
   var proto = cls.prototype;
   proto.show = function () {
      if (!this.exist) return;
      if (this.visible) return;
      this.element.style.display = '';
      this.visible = true;
   };
   proto.hide = function () {
      if (!this.exist) return;
      if (!this.visible) return;
      this.element.style.display = 'none';
      this.visible = false;
   };
   proto.toggleVisible = function () {
      if (!this.exist) return;
      if (this.visible) {
         this.hide();
      } else {
         this.show();
      }
   };
   proto.serialize = function () {
      if (!this.exist) return undefined;
      return this.visible;
   };
   proto.deserialize = function (v) {
      if (v) {
         this.show();
      } else {
         this.hide();
      }
   };
   proto.on = function (e, callback) {
      if (!this.exist) return;
      if ((!e) || (!callback)) return;
      this.element.addEventListener(e, callback);
   };
   proto.isInDocument = function () {
      return (this.element && this.element.ownerDocument);
   };
   return cls;
})();

var LLValuedComponent = (function() {
   function LLValuedComponent_cls(id, options) {
      LLComponentBase.call(this, id, options);
      if (!this.exist) {
         this.value = undefined;
         return this;
      }
      var vk = (options && options.valueKey ? options.valueKey : '');
      if (!vk) {
         var tag = this.element.tagName.toUpperCase();
         if (tag == 'INPUT') {
            if (this.element.type.toUpperCase() == 'CHECKBOX') {
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
      this.value = this.element[vk];
      var me = this;
      this.on('change', function (e) {
         me.set(me.element[me.valueKey]);
      });
   };
   /** @type {typeof LLH.Component.LLValuedComponent} */
   var cls = LLValuedComponent_cls;
   LLClassUtil.setSuper(cls, LLComponentBase);
   var proto = cls.prototype;
   proto.get = function () {
      return this.value;
   };
   proto.set = function (v) {
      if (!this.exist) return;
      if (v == this.value) return;
      this.element[this.valueKey] = v;
      this.value = v;
      if (this.onValueChange) this.onValueChange(v);
   };
   proto.serialize = function () {
      return this.get();
   };
   proto.deserialize = function (v) {
      this.set(v);
   };
   return cls;
})();

var LLSelectComponent = (function() {
   function LLSelectComponent_cls(id, options) {
      LLValuedComponent.call(this, id, options);
      if (!this.exist) {
         this.options = undefined;
         return this;
      }
      var opts = [];
      var orig_opts = this.element.options;
      for (var i = 0; i < orig_opts.length; i++) {
         opts.push({
            value: orig_opts[i].value,
            text: orig_opts[i].text
         });
      }
      this.options = opts;
   };
   /** @type {typeof LLH.Component.LLSelectComponent} */
   var cls = LLSelectComponent_cls;
   LLClassUtil.setSuper(cls, LLValuedComponent);
   var proto = cls.prototype;
   proto.set = function (v) {
      if (!this.exist) return;
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
   };
   proto.setOptions = function (options, filter) {
      if (!this.exist) return;
      this.options = options || [];
      this.filterOptions(filter);
   };
   proto.filterOptions = function (filter) {
      if (!this.exist) return;
      if (!filter) filter = this.filter;
      var oldValue = this.get();
      var foundOldValue = false;
      this.element.options.length = 0;
      for (var i in this.options) {
         var option = this.options[i];
         if (filter && !filter(option)) continue;
         var newOption = new Option(option.text, option.value);
         newOption.style.color = option.color || '';
         newOption.style['background-color'] = option.background || '#fff';
         this.element.options.add(newOption);
         if (oldValue == option.value) foundOldValue = true;
      }
      if (foundOldValue) {
         this.set(oldValue);
      } else {
         this.set(this.element.value);
      }
      this.filter = filter;
   };
   return cls;
})();

var LLImageComponent = (function() {
   /* Properties:
    *    srcList
    *    curSrcIndex
    * Methods:
    *    setSrcList(list)
    */
   function LLImageComponent_cls(id, options) {
      LLComponentBase.call(this, id, options);
      if (!this.exist) {
         this.srcList = undefined;
         this.curSrcIndex = undefined;
         return this;
      }
      var srcList = (options && options.srcList ? options.srcList : [this.element.src]);
      var me = this;
      this.on('error', function (e) {
         if (me.curSrcIndex === undefined) return;
         if (me.curSrcIndex < me.srcList.length-1) {
            me.curSrcIndex++;
            me.element.src = me.srcList[me.curSrcIndex];
         } else {
            console.error('Failed to load image');
            console.error(me.srcList);
         }
      });
      this.on('reset', function (e) {
         console.error('reset called, src=' + me.element.src);
         console.error(e);
      });
      this.setSrcList(srcList);
   };
   var cls = LLImageComponent_cls;
   cls.prototype = new LLComponentBase();
   cls.prototype.constructor = cls;
   var proto = cls.prototype;
   proto.setSrcList = function (srcList) {
      this.srcList = srcList;
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
   return cls;
})();

var LLComponentCollection = (function() {
   function LLComponentCollection_cls() {
      this.components = {};
   };
   /** @type {typeof LLH.Component.LLComponentCollection} */
   var cls = LLComponentCollection_cls;
   var proto = cls.prototype;
   proto.add = function (name, component) {
      this.components[name] = component;
   };
   proto.getComponent = function (name) {
      return this.components[name];
   };
   proto.serialize = function () {
      var ret = {};
      for (var i in this.components) {
         var val = this.components[i].serialize();
         if (val !== undefined) {
            ret[i] = val;
         }
      }
      return ret;
   };
   proto.deserialize = function (v) {
      if (!v) return;
      for (var i in this.components) {
         var val = v[i];
         if (val !== undefined) {
            this.components[i].deserialize(val);
         }
      }
   };
   proto.saveJson = function () {
      return JSON.stringify(this.serialize());
   };
   proto.loadJson = function (data) {
      if (data && data != 'undefined') {
         try {
            this.deserialize(JSON.parse(data));
         } catch (e) {
            console.error(e);
         }
      }
   };
   proto.saveLocalStorage = function (key) {
      LLHelperLocalStorage.setData(key, this.saveJson());
   };
   proto.loadLocalStorage = function (key) {
      var data = LLHelperLocalStorage.getData(key);
      this.loadJson(data);
   };
   proto.deleteLocalStorage = function (key) {
      LLHelperLocalStorage.clearData(key);
   };
   return cls;
})();

var LLFiltersComponent = (function() {
   function LLFiltersComponent_cls() {
      LLComponentCollection.call(this);
      this.filters = {};
      this.freeze = false;
   };

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
      /** @type {LLH.Component.LLSelectComponent_FilterCallback} */
      var newFilter = undefined;
      /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
      var newOptions = undefined;
      var i;
      if (checkCallbacks && filter.reverseCallbacks) {
         /** @type {LLH.Component.LLFiltersComponent_FilterCallback[]} */
         var filterCallbacks = [];
         /** @type {string[]} */
         var values = [];
         /** @type {LLH.Component.LLValuedComponent} */
         var comp = undefined;
         for (i in filter.reverseCallbacks) {
            comp = me.getComponent(i);
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
         /** @type {LLH.Component.LLSelectComponent} */
         var selComp = me.getComponent(targetName);
         if (!selComp) {
            console.error('Not found select component for ' + targetName, me);
            return;
         }
         if (newOptions) {
            selComp.setOptions(newOptions, newFilter);
         } else {
            selComp.filterOptions(newFilter);
         }
      }
   }

   /** @type {typeof LLH.Component.LLFiltersComponent} */
   var cls = LLFiltersComponent_cls;
   LLClassUtil.setSuper(cls, LLComponentCollection);
   var proto = cls.prototype;
   proto.setFreezed = function (isFreezed) {
      this.freeze = isFreezed;
   };
   proto.isFreezed = function () {
      return this.freeze;
   };
   proto.addFilterable = function (name, component) {
      var me = this;
      me.add(name, component);
      me.getFilter(name, true);
      component.onValueChange = function (v) {
         if (!me.isFreezed()) me.handleFilters(name);
         if (me.onValueChange) me.onValueChange(name, v);
      };
   };
   proto.getFilter = function (name, createIfAbsent) {
      if (createIfAbsent && this.filters[name] === undefined) {
         this.filters[name] = {};
      }
      return this.filters[name];
   };
   proto.addFilterCallback = function (sourceName, targetName, callback) {
      var sourceFilter = this.getFilter(sourceName, true);
      var targetFilter = this.getFilter(targetName, true);
      if (!sourceFilter.callbacks) {
         sourceFilter.callbacks = {};
      }
      if (!targetFilter.reverseCallbacks) {
         targetFilter.reverseCallbacks = {};
      }
      sourceFilter.callbacks[targetName] = callback;
      targetFilter.reverseCallbacks[sourceName] = callback;
   };
   proto.setFilterOptionGroupCallback = function (name, groupGetter, affectedBy) {
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
   };
   proto.setFilterOptionGroups = function (name, groups) {
      var curFilter = this.getFilter(name, true);
      curFilter.optionGroups = groups;
   };
   proto.setFilterOptions = function (name, options) {
      var curFilter = this.getFilter(name, true);
      curFilter.optionGroups = undefined;
      /** @type {LLH.Component.LLSelectComponent} */
      var curComp = this.getComponent(name);
      curComp.setOptions(options);
   };
   proto.handleFilters = function (name) {
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
   };
   return cls;
})();

/**
 * @typedef {number | string} MemberIdType
 * the number id or jp name
 */
/**
 * @typedef {4 | 5 | 60 | 143} BigGroupIdType
 * 4 for muse, 5 for aqours, 60 for niji, 143 for liella
 */
/**
 * @typedef NormalGemMetaType
 * @property {string} name en name
 * @property {string} cnname cn name
 * @property {string} key
 * @property {number} slot
 * @property {1|2} effect_range 1 for self, 2 for team
 * @property {number} effect_value 
 * @property {0|1} [per_color] 1 means exists gem for 3 kinds of color
 * @property {0|1} [per_grade] 1 means exists gem for 3 grades
 * @property {0|1} [per_member] 1 means exists gem for different members
 * @property {0|1} [per_unit] 1 means exists gem for different units
 * @property {0|1} [attr_add] 1 means effect_value is fixed value to add attr
 * @property {0|1} [attr_mul] 1 means effect_value is percentage buff to attr
 * @property {0|1} [skill_mul] 1 means effect_value is percentage buff to score skill
 * @property {0|1} [heal_mul] 1 means effect_value is rate of heal to score on overheal
 * @property {0|1} [ease_attr_mul] 1 means effect_value is percentage buff to attr when covered by ease
 */

/*
 * LLConst: static meta data
 */
/** @type {LLH.LLConst} */
var LLConst = (function () {
   var KEYS = {
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
      'MEMBER_MIA': 214,

      '澁谷かのん': 301,
      '唐可可': 302,
      '嵐千砂都': 303,
      '平安名すみれ': 304,
      '葉月恋': 305,
      'MEMBER_KANON': 301,
      'MEMBER_KEKE': 302,
      'MEMBER_CHISATO': 303,
      'MEMBER_SUMIRE': 304,
      'MEMBER_REN': 305,

      'GROUP_UNKNOWN': 0,
      'GROUP_GRADE1': 1,
      'GROUP_GRADE2': 2,
      'GROUP_GRADE3': 3,
      'GROUP_MUSE': 4,
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
      'GROUP_NIJIGASAKI': 60,
      'GROUP_ELI_NOZOMI2': 83,
      'GROUP_RIN_HANAYO': 99,
      'GROUP_YOSHIKO_HANAMARU': 137,
      'GROUP_LIELLA': 143,

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

      'SKILL_LIMIT_PERFECT_SCORE_UP': 100000,
      'SKILL_LIMIT_COMBO_FEVER': 1000,
      'SKILL_LIMIT_HEAL_BONUS': 200,

      'SONG_GROUP_MUSE': 1,
      'SONG_GROUP_AQOURS': 2,
      'SONG_GROUP_NIJIGASAKI': 3,
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

      'SIS_RANGE_SELF': 1,
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
      'SIS_LIVE_EFFECT_TYPE_POSSIBILITY_DOWN': 2
   };
   var COLOR_ID_TO_NAME = ['', 'smile', 'pure', 'cool'];
   var COLOR_NAME_TO_COLOR = {'smile': 'red', 'pure': 'green', 'cool': 'blue', '': 'purple'};
   /**
    * @typedef MemberDataType
    * @property {'smile'|'pure'|'cool'} color
    * @property {string} name
    * @property {string} cnname
    * @property {string} background_color
    * @property {LLH.Core.GradeType} [grade]
    * @property {0|1} [member_gem]
    */
   /** @type {{[id: number]: MemberDataType}} */
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

   var GROUP_DATA = {};
   var NOT_FOUND_MEMBER = {};

   // ALBUM_DATA = {<id>: {name: <name>, cnname: <cnname>, albumGroupId: <album_group_id>}, ...}
   var ALBUM_DATA = {};

   // ALBUM_GROUP = [{albums: [<album_id>, ...], name: <name>, cnname: <cnname>, id: <index>}, ...]
   var ALBUM_GROUP = [];


   var metaDataInited = {};
   var mCheckInited = function (key) {
      if (!metaDataInited[key]) throw key + ' not inited';
   };

   /**
    * @param {MemberIdType} member
    * @returns {number | undefined}
    */
   var mGetMemberId = function (member) {
      var memberid = member;
      if (typeof(memberid) != 'number') {
         memberid = KEYS[memberid];
         if (memberid === undefined) {
            //e.g. N card
            if (!NOT_FOUND_MEMBER[member]) {
               console.debug('Not found member ' + member);
               NOT_FOUND_MEMBER[member] = 1;
            }
            return undefined;
         }
      }
      return memberid;
   };
   /**
    * @param {LLH.Core.MemberIdType} member 
    * @returns {MemberDataType | undefined}
    */
   var mGetMemberData = function (member) {
      mCheckInited('unit_type');
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
      mCheckInited('member_tag');
      var groupid = mGetGroupId(group);
      if (groupid !== undefined) {
         return GROUP_DATA[groupid];
      }
      console.error('Not found group data for ' + group);
      return undefined;
   };

   var mConvertIntId = function (d) {
      var ret = {};
      for (var k in d) {
         ret[parseInt(k)] = d[k];
      }
      return ret;
   };

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
            MEMBER_DATA[curMemberId].grade = grade;
         }
      }
      for (var i = 0; i < MEMBER_GEM_LIST.length; i++) {
         var id = MEMBER_GEM_LIST[i];
         if (!MEMBER_DATA[id]) {
            console.warn('Not found member ' + id + ' for member gem');
            continue;
         }
         MEMBER_DATA[id].member_gem = 1;
      }
   };

   var normalizeAlbumName = function (name) {
      name = name.replace(/(前半|後半|后半)$/, '');
      name = name.replace(/Part\d+$/, '');
      name = name.replace(/[ 　]+$/, '');
      return name;
   };

   var mInitAlbumData = function (albumMeta) {
      ALBUM_DATA = mConvertIntId(albumMeta);
      var albumGroupNames = {};
      var i, k;
      for (k in ALBUM_DATA) {
         var album = ALBUM_DATA[k];
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
      for (k in albumGroupNames) {
         var groupId = groupData.length;
         groupData.push(albumGroupNames[k]);
         albumGroupNames[k].id = groupId;
         var albums = albumGroupNames[k].albums;
         for (i = 0; i < albums.length; i++) {
            ALBUM_DATA[albums[i]].albumGroupId = groupId;
         }
      }
      ALBUM_GROUP = groupData;
   };

   var NOTE_APPEAR_OFFSET_S = [1.8, 1.6, 1.45, 1.3, 1.15, 1, 0.9, 0.8, 0.7, 0.6];
   var DEFAULT_SPEED = {};
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_EASY] = 2;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_NORMAL] = 4;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_HARD] = 6;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_EXPERT] = 8;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_RANDOM] = 8;
   DEFAULT_SPEED[KEYS.SONG_DIFFICULTY_MASTER] = 9;

   /** @type {LLH.LLConst} */
   var ret = KEYS;
   ret.isMemberInGroup = function (member, group) {
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
   };
   ret.getMemberGrade = function (member) {
      mCheckInited('unit_type');
      var memberData = mGetMemberData(member);
      if (!memberData) return undefined;
      return memberData.grade;
   };
   ret.getMemberColor = function (member) {
      var memberData = mGetMemberData(member);
      if (!memberData) return undefined;
      return memberData.color;
   };
   ret.getMemberBackgroundColor = function (member) {
      var memberData = mGetMemberData(member);
      if (!memberData) return KEYS.BACKGROUND_COLOR_DEFAULT;
      return memberData.background_color;
   };
   ret.getMemberNamesInGroups = function (groups) {
      mCheckInited('unit_type');
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
            ret.push(MEMBER_DATA[i].name);
         }
      }
      return ret;
   };

   /** @type {LLH.ConstUtil.Member} */
   var MemberUtils = {
      getMemberName: function (member, iscn) {
         var memberData = mGetMemberData(member);
         if (!memberData) return '<未知成员(' + member + ')>';
         if (iscn && memberData.cnname) return memberData.cnname;
         return memberData.name;
      },
      getBigGroupId: function (memberId) {
         var bigGroups = ret.Group.getBigGroupIds();
         for (var i = 0; i < bigGroups.length; i++) {
            var groupId = bigGroups[i];
            if (ret.isMemberInGroup(memberId, groupId)) {
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
            if (!ret.isMemberInGroup(curMemberName, bigGroup)) return undefined;
            memberFlag[curMemberName] = 1;
         }
         var distinctMemberCount = Object.keys(memberFlag).length;
         if (bigGroup == ret.GROUP_LIELLA) {
            return (distinctMemberCount == 5 ? bigGroup : undefined);
         } else {
            return (distinctMemberCount == 9 ? bigGroup : undefined);
         }
      }
   };
   ret.Member = MemberUtils;

   /** @type {LLH.ConstUtil.Group} */
   var GroupUtils = {
      getGroupName: function (groupid) {
         mCheckInited('member_tag');
         if (!GROUP_DATA[groupid]) return '<Unknown(' + groupid + ')>';
         if (GROUP_DATA[groupid].cnname) return GROUP_DATA[groupid].cnname;
         return GROUP_DATA[groupid].name;
      },
      getBigGroupIds: function () {
         return [KEYS.GROUP_MUSE, KEYS.GROUP_AQOURS, KEYS.GROUP_NIJIGASAKI, KEYS.GROUP_LIELLA];
      }
   };
   ret.Group = GroupUtils;

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
         var gemName = GemUtils.getNormalGemName(meta)
         var gemDesc = GemUtils.getNormalGemBriefDescription(meta);
         return gemName + ' （' + gemDesc + '）';
      },
      isGemFollowMemberAttribute: function (typeOrMeta) {
         var meta = GemUtils.getNormalGemMeta(typeOrMeta);
         if (!meta) return false;
         if (meta.heal_mul || meta.skill_mul || meta.ease_attr_mul) return true;
         return false;
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
         desc += gemData.size + ' ';
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
               sub_skill = sub_skill.sub_skill;
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
         desc += gemData.jpname;
         if (gemData.member) {
            desc += '[' + ret.Member.getMemberName(gemData.member, iscn) + ']';
         }
         return desc;
      },
      getGemFullDescription: function (gemData) {
         var desc = '';
         var effect_type = gemData.effect_type;
         var isAttributeEffect = (effect_type == KEYS.SIS_EFFECT_TYPE_SMILE
            || effect_type == KEYS.SIS_EFFECT_TYPE_PURE
            || effect_type == KEYS.SIS_EFFECT_TYPE_COOL);
         // 限制可装备的成员
         if (gemData.member) {
            var memberName = ret.Member.getMemberName(gemData.member);
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
            var groupName = ret.Group.getGroupName(gemData.group);
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
            desc += COLOR_ID_TO_NAME[gemData.color] + '提升'
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
            desc += '判定强化技能发动时，装备此技能的社员的' + COLOR_ID_TO_NAME[gemData.color] + '变为' + (gemData.effect_value + 100)/100 + '倍';
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
            desc += '；' + ret.Gem.getGemFullDescription(gemData.sub_skill_data);
         } else if (gemData.sub_skill) {
            desc += '；<未知子效果(' + gemData.sub_skill + ')>';
         }
         return desc;
      },
      getGemColor: function (gemData) {
         if (gemData.type == KEYS.SIS_TYPE_NORMAL) {
            return COLOR_NAME_TO_COLOR[COLOR_ID_TO_NAME[gemData.color]];
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
   ret.Gem = GemUtils;
   ret.GemType = (function (arr) {
      /** @type {{[key: string]: number}} */
      var indexMap = {};
      for (var i = 0; i < arr.length; i++) {
         indexMap[arr[i].key] = i;
      }
      return indexMap;
   })(GEM_NORMAL_TYPE_DATA);

   ret.getNoteAppearTime = function(noteTimeSec, speed) {
      return noteTimeSec - NOTE_APPEAR_OFFSET_S[speed - 1];
   };
   ret.getDefaultSpeed = function (difficulty) {
      return DEFAULT_SPEED[difficulty] || 8;
   };
   ret.isHoldNote = function(note_effect) {
      return (note_effect == KEYS.NOTE_TYPE_HOLD || note_effect == KEYS.NOTE_TYPE_SWING_HOLD);
   };
   ret.isSwingNote = function(note_effect) {
      return (note_effect == KEYS.NOTE_TYPE_SWING || note_effect == KEYS.NOTE_TYPE_SWING_HOLD || note_effect == KEYS.NOTE_TYPE_SWING_EVENT);
   };
   ret.getComboScoreFactor = function (combo) {
      if (combo <= 50) return 1;
      else if (combo <= 100) return 1.1;
      else if (combo <= 200) return 1.15;
      else if (combo <= 400) return 1.2;
      else if (combo <= 600) return 1.25;
      else if (combo <= 800) return 1.3;
      else return 1.35;
   };
   var COMBO_FEVER_PATTERN_2 = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 5, 6, 7, 8, 9, 10]
   ret.getComboFeverBonus = function(combo, pattern) {
      if (pattern == 1) return (combo >= 300 ? 10 : Math.pow(Math.floor(combo/10), 2)/100+1);
      return (combo >= 220 ? 10 : COMBO_FEVER_PATTERN_2[Math.floor(combo/10)]);
   };
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
   ret.getHealBonus = function(maxHp, curHp) {
      if (maxHp < 9 || maxHp > 63) {
         console.error('max HP out of range: ' + maxHp);
         return 1;
      }
      if (curHp < maxHp*2) return 1;
      var bonus = (Math.floor(curHp/maxHp + 1e-8)-1) * HEAL_BONUS[maxHp-9];
      if (bonus > KEYS.SKILL_LIMIT_HEAL_BONUS) bonus = KEYS.SKILL_LIMIT_HEAL_BONUS;
      return 1 + bonus/100;
   };

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

   ret.getSkillTriggerText = function(skill_trigger) {
      if (!skill_trigger) return '无';
      var t = SKILL_TRIGGER_TEXT[skill_trigger];
      if (!t) return '未知';
      return t.name;
   };
   ret.getSkillTriggerUnit = function(skill_trigger) {
      if (!skill_trigger) return '';
      var t = SKILL_TRIGGER_TEXT[skill_trigger];
      if (!t) return '';
      return t.unit;
   };
   ret.getSkillEffectText = function(skill_effect) {
      if (!skill_effect) return '无';
      return SKILL_EFFECT_TEXT[skill_effect] || '未知';
   };

   var DEFAULT_MAX_SLOT = {'UR': 8, 'SSR': 6, 'SR': 4, 'R': 2, 'N': 1};
   var DEFAULT_MIN_SLOT = {'UR': 4, 'SSR': 3, 'SR': 2, 'R': 1, 'N': 0};
   ret.getDefaultMaxSlot = function(rarity) {
      return (DEFAULT_MAX_SLOT[rarity] || 0);
   };
   ret.getDefaultMinSlot = function(rarity) {
      return (DEFAULT_MIN_SLOT[rarity] || 0);
   };

   ret.getAlbumGroupByAlbumId = function (album_id) {
      mCheckInited('album');
      if (album_id === undefined || album_id == '') return undefined;
      if (!ALBUM_DATA[parseInt(album_id)]) {
         console.error('not found album ' + album_id);
         return undefined;
      }
      var album = ALBUM_DATA[parseInt(album_id)];
      if (album.albumGroupId === undefined) {
         console.error('album ' + album_id + ' has no group id');
         return undefined;
      }
      return ALBUM_GROUP[album.albumGroupId];
   };
   ret.getAlbumGroups = function () {
      mCheckInited('album');
      return ALBUM_GROUP;
   };
   ret.isAlbumInAlbumGroup = function (album_id, group_id) {
      mCheckInited('album');
      if (album_id === undefined || album_id == '') return false;
      if (!ALBUM_DATA[parseInt(album_id)]) {
         console.error('not found album ' + album_id);
         return false;
      }
      return ALBUM_DATA[parseInt(album_id)].albumGroupId === parseInt(group_id);
   };

   var CSKILL_GROUPS = [];
   ret.getCSkillGroups = function () {
      mCheckInited('cskill_groups');
      return CSKILL_GROUPS;
   };

   ret.initMetadata = function(metadata) {
      if (metadata['album']) {
         mInitAlbumData(metadata['album']);
         metaDataInited['album'] = 1;
      }
      if (metadata['member_tag']) {
         GROUP_DATA = mConvertIntId(metadata['member_tag']);
         metaDataInited['member_tag'] = 1;
      }
      if (metadata['unit_type']) {
         mInitMemberData(metadata['unit_type']);
         metaDataInited['unit_type'] = 1;
      }
      if (metadata['cskill_groups']) {
         CSKILL_GROUPS = metadata['cskill_groups'];
         metaDataInited['cskill_groups'] = 1;
      }
   };

   ret.getAttributeColor = function (attribute) {
      return COLOR_NAME_TO_COLOR[attribute] || 'black';
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

   var SONG_GROUP_TO_GROUP = {};
   SONG_GROUP_TO_GROUP[KEYS.SONG_GROUP_MUSE] = KEYS.GROUP_MUSE;
   SONG_GROUP_TO_GROUP[KEYS.SONG_GROUP_AQOURS] = KEYS.GROUP_AQOURS;
   SONG_GROUP_TO_GROUP[KEYS.SONG_GROUP_NIJIGASAKI] = KEYS.GROUP_NIJIGASAKI;
   SONG_GROUP_TO_GROUP[KEYS.SONG_GROUP_LIELLA] = KEYS.GROUP_LIELLA;

   ret.getSongGroupShortName = function (song_group) {
      return SONG_GROUP_NAME[parseInt(song_group)] || '?';
   };
   ret.getSongGroupIds = function () {
      return [KEYS.SONG_GROUP_MUSE, KEYS.SONG_GROUP_AQOURS, KEYS.SONG_GROUP_NIJIGASAKI, KEYS.SONG_GROUP_LIELLA];
   };
   ret.getGroupForSongGroup = function (song_group) {
      if (SONG_GROUP_TO_GROUP[parseInt(song_group)] !== undefined) {
         return SONG_GROUP_TO_GROUP[parseInt(song_group)];
      }
      return KEYS.GROUP_UNKNOWN;
   };
   ret.getDefaultSongSetIds = function () {
      return [KEYS.SONG_DEFAULT_SET_1, KEYS.SONG_DEFAULT_SET_2];
   };
   ret.getSongDifficultyName = function (diff, cn) {
      return SONG_DIFFICULTY_NAME[parseInt(diff)][cn ? 'cn' : 'en'];
   };
   ret.getDefaultSong = function (song_group, default_set) {
      song_group = parseInt(song_group);
      default_set = parseInt(default_set);
      var expert_default = {
         'time': 110,
         'star': 65,
         'difficulty': KEYS.SONG_DIFFICULTY_EXPERT,
         'stardifficulty': 9,
         'liveid': String(-(song_group*100+default_set*10+KEYS.SONG_DIFFICULTY_EXPERT))
      };
      var master_default = {
         'time': 110,
         'star': 65,
         'difficulty': KEYS.SONG_DIFFICULTY_MASTER,
         'stardifficulty': 11,
         'liveid': String(-(song_group*100+default_set*10+KEYS.SONG_DIFFICULTY_MASTER))
      };
      var master2_default ={
         'time': 110,
         'star': 65,
         'difficulty': KEYS.SONG_DIFFICULTY_MASTER,
         'stardifficulty': 12,
         'liveid': String(-(song_group*100+default_set*10+KEYS.SONG_DIFFICULTY_MASTER+1))
      };
      if (default_set == KEYS.SONG_DEFAULT_SET_1) {
         expert_default.positionweight = [63.75,63.75,63.75,63.75,0,63.75,63.75,63.75,63.75];
         expert_default.combo = 500;
         master_default.positionweight = [87.5,87.5,87.5,87.5,0,87.5,87.5,87.5,87.5];
         master_default.combo = 700;
         master2_default.positionweight = [112.5,112.5,112.5,112.5,0,112.5,112.5,112.5,112.5];
         master2_default.combo = 900;
      } else if (default_set == KEYS.SONG_DEFAULT_SET_2) {
         expert_default.positionweight = [63,63,63,63,0,63,63,63,63];
         expert_default.combo = 504;
         master_default.positionweight = [88,88,88,88,0,88,88,88,88];
         master_default.combo = 704;
         master2_default.positionweight = [113,113,113,113,0,113,113,113,113];
         master2_default.combo = 904;
      }
      var default_song = {'group': song_group, 'bpm': 200, 'attribute': '', 'settings': {}};
      default_song.name = '默认曲目' + default_set + '（' + ret.getSongGroupShortName(song_group) + '）';
      default_song.jpname = default_song.name;
      default_song.settings[expert_default.liveid] = expert_default;
      default_song.settings[master_default.liveid] = master_default;
      default_song.settings[master2_default.liveid] = master2_default;
      return default_song;
   };

   ret.getCardDescription = function (card, isJp, mezame) {
      var desc = String(card.id);
      var albumGroup = ret.getAlbumGroupByAlbumId(card.album) || {};
      var curTypeId = (card.typeid ? parseInt(card.typeid) : -1);
      while (desc.length < 3) desc = '0' + desc;
      desc += ' ' + (card.rarity || '?') + ' ';
      if (mezame !== undefined) {
         desc += (mezame ? '觉醒' : '未觉') + ' ';
      }
      var albumGroupJpName = (albumGroup.name ? "("+albumGroup.name+")" : '');
      if (isJp) {
         desc += (card.jpeponym ? "【"+card.jpeponym+"】" : '') + ' ' + ret.Member.getMemberName(curTypeId) + ' ' + albumGroupJpName;
      } else {
        desc += (card.eponym ? "【"+card.eponym+"】" : '') + ' ' + ret.Member.getMemberName(curTypeId, true) + ' ' + (albumGroup.cnname ? "("+albumGroup.cnname+")" : albumGroupJpName);
      }
      return desc;
   };

   return ret;
})();

/*
 * LLUnit: utility functions for unit related operations, used in llnewunit, llnewunitsis, etc.
 */
var defaultHandleFailedRequest = function() {
   alert('载入失败!');
};

var LLUnit = {
   changeunitskilllevel: function(n) {
      var index = document.getElementById('cardid'+String(n)).value;
      var level = parseInt(document.getElementById('skilllevel'+String(n)).value)-1;
      if ((level < 0) || (level > 7)) return;
      LoadingUtil.startSingle(LLCardData.getDetailedData(index)).then(function(card) {
         //document.getElementById('require'+String(n)).value = card['skilldetail'][level].require;
         //document.getElementById('possibility'+String(n)).value = card['skilldetail'][level].possibility;
         //document.getElementById('score'+String(n)).value = card['skilldetail'][level].score;
      }, defaultHandleFailedRequest);
   },

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

   numberToString: function (n, precision) {
      var ret = n.toFixed(precision);
      var pos = ret.length - 1;
      while (ret[pos] == '0') pos--;
      if (ret[pos] == '.') pos--;
      if (pos != ret.length - 1) ret = ret.substring(0, pos+1);
      return ret;
   },

   healNumberToString: function (n) {
      return LLUnit.numberToString(n, 2);
   },

   numberToPercentString: function (n) {
      if (n === undefined) return '';
      return LLUnit.numberToString(n*100, 2) + '%';
   },

   // kizuna from twintailos.js, skilllevel from each page
   applycarddata: function () {
      var index = document.getElementById('cardchoice').value;
      var mezame = (document.getElementById("mezame").checked ? 1 : 0);
      if (index != "") {
         LLUnit.setAvatarSrcList(comp_cardavatar, parseInt(index), mezame);
         LoadingUtil.startSingle(LLCardData.getDetailedData(index)).then(function(card) {
            document.getElementById("main").value = card.attribute
            comp_skill.setCardData(card);

            var infolist2 = ["smile", "pure", "cool"]
            var i;
            if (!mezame){
               for (i in infolist2){
                  document.getElementById(infolist2[i]).value = card[infolist2[i]]
               }
               document.getElementById("hp").value = parseInt(card.hp);
               document.getElementById("mezame").value = "未觉醒";
            }
            else{
               for (i in infolist2){
                  document.getElementById(infolist2[i]).value = card[infolist2[i]+"2"]
               }
               document.getElementById("hp").value = parseInt(card.hp)+1;
               document.getElementById("mezame").value = "已觉醒"
            }
            document.getElementById("kizuna").value = kizuna[card.rarity][mezame]
         }, defaultHandleFailedRequest);
      } else {
         LLUnit.setAvatarSrcList(comp_cardavatar, 0, mezame);
         comp_skill.setCardData();
      }
   },

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
         if (type == 'avatar') {
            ret.push('/static/avatar/' + m + '/' + cardid + '.png');
         }
      } else if (type == 'navi') {
         var m = (mezame ? '1' : '0');
         for (var i = 0; i < 2; i++) {
            ret.push((isHttp ^ (i>=1) ? 'http' : 'https') + '://db.loveliv.es/png/navi/' + cardid + '/' + m);
         }
      } else {
         ret.push('');
      }
      return ret;
   },

   // getimagepath require twintailosu.js
   changeavatare: function (element, cardid, mezame) {
      var path;
      if ((!cardid) || cardid == "0")
         path = '/static/null.png'
      else if (!mezame)
         path = getimagepath(cardid,'avatar',0)
      else
         path = getimagepath(cardid,'avatar',1)
      if (element.src != path) {
         // avoid showing last image before new image is loaded
         element.src = '';
      }
      element.src = path;
   },

   changeavatar: function (elementid, cardid, mezame) {
      LLUnit.changeavatare(document.getElementById(elementid), cardid, mezame);
   },

   changeavatarn: function (n) {
      var cardid = parseInt(document.getElementById('cardid'+String(n)).value)
      var mezame = parseInt(document.getElementById('mezame'+String(n)).value);
      LLUnit.changeavatar('avatar' + n, cardid, mezame);
   },

   calculate: function (docalculate, cardids, addRequests) {
      var requests = [];
      var i;
      var uniqueCardids = {};
      if (!cardids) {
         for (i = 0; i < 9; i++) {
            var cardid = document.getElementById('cardid' + i).value;
            if (cardid && uniqueCardids[cardid] === undefined) {
               requests.push(LLCardData.getDetailedData(cardid));
               uniqueCardids[cardid] = 1;
            }
         }
      } else {
         for (i = 0; i < cardids.length; i++) {
            var cardid = cardids[i];
            if (cardid && uniqueCardids[cardid] === undefined) {
               requests.push(LLCardData.getDetailedData(cardid));
               uniqueCardids[cardid] = 1;
            }
         }
      }
      if (addRequests) {
         var cardRequestCount = requests.length;
         var extraResults = [];
         for (i = 0; i < addRequests.length; i++) {
            requests.push(addRequests[i]);
            extraResults.push(undefined);
         }
         LoadingUtil.start(requests, function (data, index, result) {
            if (index < cardRequestCount) result[parseInt(data.id)] = data;
            else extraResults[index-cardRequestCount] = data
         }).then(function (cards) {
            docalculate(cards, extraResults);
         }, defaultHandleFailedRequest);
      } else {
         LoadingUtil.start(requests, LoadingUtil.cardDetailMerger).then(function (cards) {
            docalculate(cards);
         }, defaultHandleFailedRequest);
      }
   },

   getSkillText: function (effect_type, trigger_type, effect_value, discharge_time, trigger_value, activation_rate, trigger_target, effect_target, trigger_limit) {
      var trigger_text = '(未知条件)';
      if (trigger_type == LLConst.SKILL_TRIGGER_TIME)
        trigger_text = '每' + trigger_value + '秒';
      else if (trigger_type == LLConst.SKILL_TRIGGER_NOTE)
        trigger_text = '每' + trigger_value + '个图标';
      else if (trigger_type == LLConst.SKILL_TRIGGER_COMBO)
        trigger_text = '每达成' + trigger_value + '次连击';
      else if (trigger_type == LLConst.SKILL_TRIGGER_SCORE)
        trigger_text = '每达成' + trigger_value + '分';
      else if (trigger_type == LLConst.SKILL_TRIGGER_PERFECT)
        trigger_text = '每获得' + trigger_value + '个PERFECT';
      else if (trigger_type == LLConst.SKILL_TRIGGER_STAR_PERFECT)
        trigger_text = '每获得' + trigger_value + '个星星图标的PERFECT';
      else if (trigger_type == LLConst.SKILL_TRIGGER_MEMBERS)
        trigger_text = '自身以外的' + trigger_target + '的成员的特技全部发动时';
      var rate_text = '就有' + activation_rate + '%的概率';
      var effect_text = '(未知效果)';
      if (effect_type == LLConst.SKILL_EFFECT_ACCURACY_SMALL)
        effect_text = '稍微增强判定' + discharge_time + '秒';
      else if (effect_type == LLConst.SKILL_EFFECT_ACCURACY_NORMAL)
        effect_text = '增强判定' + discharge_time + '秒';
      else if (effect_type == LLConst.SKILL_EFFECT_HEAL)
        effect_text = '恢复' + effect_value + '点体力';
      else if (effect_type == LLConst.SKILL_EFFECT_SCORE)
        effect_text = '提升分数' + effect_value + '点';
      else if (effect_type == LLConst.SKILL_EFFECT_POSSIBILITY_UP)
        effect_text = discharge_time + '秒内其它的特技发动概率提高到' + effect_value + '倍';
      else if (effect_type == LLConst.SKILL_EFFECT_REPEAT)
        effect_text = '发动上一个发动的非repeat的特技';
      else if (effect_type == LLConst.SKILL_EFFECT_PERFECT_SCORE_UP)
        effect_text = discharge_time + '秒内的PERFECT提升' + effect_value + '分';
      else if (effect_type == LLConst.SKILL_EFFECT_COMBO_FEVER)
        effect_text = discharge_time + '秒内的点击得分根据combo数提升' + effect_value + '~' + (effect_value*10) + '分';
      else if (effect_type == LLConst.SKILL_EFFECT_SYNC)
        effect_text = discharge_time + '秒内自身的属性P变为与' + effect_target + '的随机一位成员的属性P一致';
      else if (effect_type == LLConst.SKILL_EFFECT_LEVEL_UP)
        effect_text = '使下一个发动的技能等级提升' + effect_value + '级';
      else if (effect_type == LLConst.SKILL_EFFECT_ATTRIBUTE_UP)
        effect_text = discharge_time + '秒内' + effect_target + '的成员的属性P提高到' + effect_value + '倍';
      var limit_text = '';
      if (trigger_limit) 
         limit_text = '（最多' + trigger_limit + '次）';
      return trigger_text + rate_text + effect_text + limit_text;
   },

   getTriggerTarget: function (targets) {
      if (!targets) return '(数据缺失)';
      var ret = '';
      for (var i = 0; i < targets.length; i++) {
         ret += LLConst.Group.getGroupName(parseInt(targets[i]));
      }
      return ret;
   },

   getCardSkillText: function (card, level) {
      if (!card.skill) return '无';
      if (card.skilleffect == 0) return '获得特技经验';
      var level_detail = card.skilldetail[level];
      var effect_type = card.skilleffect;
      var effect_value = level_detail.score;
      var discharge_time = level_detail.time;
      if (discharge_time === undefined) {
         if (effect_type == 4 || effect_type == 5) {
            discharge_time = effect_value;
            effect_value = 0;
         } else {
            discharge_time = '(数据缺失)';
         }
      }
      var trigger_target = LLUnit.getTriggerTarget(card.triggertarget);
      var effect_target = LLUnit.getTriggerTarget(card.effecttarget);
      var text = LLUnit.getSkillText(effect_type, card.triggertype, effect_value, discharge_time, level_detail.require, level_detail.possibility, trigger_target, effect_target, level_detail.limit);
      if (!LLUnit.isStrengthSupported(card)) text = text + '(该技能暂不支持理论强度计算，仅支持模拟)';
      return text;
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

   isStrengthSupported: function (card) {
      if (card && card.skill && (card.skilleffect > 11 || card.triggertype > 12)) return false;
      return true;
   },

   /**
    * @param {HTMLElement} element 
    * @param {string | HTMLElement} subElement 
    */
   appendSubElement: function (element, subElement) {
      if (typeof (subElement) == 'string') {
         element.appendChild(document.createTextNode(subElement));
      } else {
         element.appendChild(subElement);
      }
   },

   /**
    * @typedef {string | HTMLElement | (string | HTMLElement | (string | HTMLElement)[])[]} SubElements
    */
   /**
    * @param {HTMLElement} ele 
    * @param {SubElements} subElements 
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
    * @param {string} tag 
    * @param {*} [options]
    * @param {SubElements} [subElements]
    * @param {{[x: string] : Function}} [eventHandlers]
    * @returns {HTMLElement}
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
      return ret;
   },

   /**
    * @param {string | HTMLElement} id 
    * @returns {HTMLElement}
    */
   getElement: function (id) {
      if (typeof(id) == 'string') {
         return document.getElementById(id);
      } else {
         return id;
      }
   },

   /**
    * @param {string} label 
    * @param {SubElements} subElements 
    * @returns {HTMLElement}
    */
   createFormInlineGroup: function (label, subElements) {
      var group = LLUnit.createElement('div', {'className': 'form-group'}, [
         LLUnit.createElement('label', undefined, label)
      ]);
      LLUnit.updateSubElements(group, subElements);
      return LLUnit.createElement('div', {'className': 'form-inline'}, group);
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

   createColorSelectComponent: function (emptyName, options) {
      var selectComponent = new LLSelectComponent(LLUnit.createElement('select', options));
      var options = [];
      if (emptyName !== undefined) {
         options.push({'value': '', 'text': emptyName});
      }
      options.push({'value': 'smile', 'text': 'Smile', 'color': 'red'});
      options.push({'value': 'pure',  'text': 'Pure',  'color': 'green'});
      options.push({'value': 'cool',  'text': 'Cool',  'color': 'blue'});
      selectComponent.setOptions(options);
      return selectComponent;
   },

   setAvatarSrcList: function (imgComp, cardid, mezame) {
      imgComp.setSrcList(LLUnit.getImagePathList(cardid, 'avatar', mezame));
      if (cardid) {
         imgComp.element.title = LLConst.getCardDescription((LLCardData.getCachedBriefData() || {'id': cardid})[cardid], false, mezame);
      } else {
         imgComp.element.title = '';
      }
      LLImageServerSwitch.registerCallback(imgComp, function () {
         imgComp.setSrcList(LLUnit.getImagePathList(cardid, 'avatar', mezame));
      });
   }
};

var LLImageServerSwitch = (function () {
   var ret = {
      'AVATAR_SERVER_GIT': 0,
      'AVATAR_SERVER_LOCAL': 1
   };

   var IMAGE_SERVER_KEY = 'llhelper_image_server__';
   function getImageServer() {
      var server = ret.AVATAR_SERVER_GIT;
      try {
         server = parseInt(localStorage.getItem(IMAGE_SERVER_KEY) || 0);
      } catch (e) {
         console.error(e);
      }
      return server;
   }

   var curServer = getImageServer();

   function updateImageServer() {
      try {
         localStorage.setItem(IMAGE_SERVER_KEY, curServer);
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

   ret.getImageServer = function () {
      return curServer;
   };
   ret.changeImageServer = function () {
      curServer = (curServer + 1) % 2;
      updateImageServer();
      checkCallbacks(true);
   };
   ret.registerCallback = function (key, callback) {
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
   };

   ret.initImageServerSwitch = function (id) {
      var element = LLUnit.getElement(id);
      var switchLink = LLUnit.createElement('a', {'href': 'javascript:;', 'title': '点击切换头像线路'}, [getServerName(curServer)], {
         'click': function () {
            ret.changeImageServer();
            LLUnit.updateSubElements(switchLink, [getServerName(curServer)], true);
         }
      });
      LLUnit.updateSubElements(element, [switchLink], true);
      element.style.display = '';
   };

   return ret;
})();

/*
 * componsed components
 *   LLSkillContainer (require LLUnit)
 *   LLCardSelector
 *   LLSongSelector
 */
var LLSkillContainer = (function() {
   function LLSkillContainer_cls(options) {
      LLComponentCollection.call(this);
      this.skillLevel = 0; // base 0, range 0-7
      this.cardData = undefined;
      options = options || {};
      options.container = options.container || 'skillcontainer';
      options.lvup = options.lvup || 'skilllvup';
      options.lvdown = options.lvdown || 'skilllvdown';
      options.level = options.level || 'skilllevel';
      options.text = options.text || 'skilltext';
      options.showall = options.showall || 0;
      var me = this;
      this.showAll = (options.showall || 0);
      this.add('container', new LLComponentBase(options.container));
      this.add('lvup', new LLComponentBase(options.lvup));
      this.getComponent('lvup').on('click', function (e) {
         me.setSkillLevel(me.skillLevel+1);
      });
      this.add('lvdown', new LLComponentBase(options.lvdown));
      this.getComponent('lvdown').on('click', function (e) {
         me.setSkillLevel(me.skillLevel-1);
      });
      this.add('level', new LLValuedComponent(options.level));
      this.add('text', new LLValuedComponent(options.text));
      this.setCardData(options.cardData, true);
      this.render();
   };
   var cls = LLSkillContainer_cls;
   cls.prototype = new LLComponentCollection();
   cls.prototype.constructor = cls;
   var proto = cls.prototype;
   proto.setSkillLevel = function (lv) {
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
   };
   proto.setCardData = function (cardData, skipRender) {
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
   };
   proto.render = function () {
      if ((!this.cardData) || this.cardData.skill == 0 || this.cardData.skill == null) {
         this.getComponent('container').hide();
      } else {
         this.getComponent('container').show();
         this.getComponent('text').set(LLUnit.getCardSkillText(this.cardData, this.skillLevel));
         this.getComponent('level').set(this.skillLevel+1);
      }
   };
   return cls;
})();

/** @typedef {'smile'|'pure'|'cool'} AttributeType */

var LLCardSelector = (function() {
   var createElement = LLUnit.createElement;
   var SEL_ID_CARD_CHOICE = 'cardchoice';
   var SEL_ID_RARITY = 'rarity';
   var SEL_ID_CHARA = 'chr';
   var SEL_ID_UNIT_GRADE = 'unitgrade';
   var SEL_ID_ATTRIBUTE = 'att';
   var SEL_ID_TRIGGER_TYPE = 'triggertype';
   var SEL_ID_TRIGGER_REQUIRE = 'triggerrequire';
   var SEL_ID_SKILL_TYPE = 'skilltype';
   var SEL_ID_SPECIAL = 'special';
   var SEL_ID_SET_NAME = 'setname';

   var updateTriggerRequireOption = function (me, triggerType) {
      me.getComponent(SEL_ID_TRIGGER_REQUIRE).setOptions(me.triggerRequireOptions[parseInt(triggerType)] || me.triggerRequireOptions['']);
   };
   /* Properties:
    *    cards
    *    language (serialize)
    *    filters
    *    freezeCardFilter
    *    dataForSelects
    *    cardOptions
    *    setNameOptions
    * Methods:
    *    handleCardFilters()
    *    setLanguage(language)
    *    getCardId()
    *    addComponentAsFilter(name, component, filterfunction)
    *    serialize() (override)
    *    deserialize(v) (override)
    * Callbacks:
    *    onCardChange(cardid)
    */
   /**
    * @constructor
    * @param {LLH.API.CardDictDataType} cards 
    * @param {string | HTMLElement} container 
    */
   function LLCardSelector_cls(cards, container) {
      LLComponentCollection.call(this);

      // init variables
      this.language = 0;
      this.filters = {};
      this.dataForSelects = {};
      this.freezeCardFilter = 1;

      // init components
      // 'cardchoice' and 'showncard' still based on element id
      var eContainer = LLUnit.getElement(container);
      var selRarity = createElement('select', {'className': 'form-control'});
      var selChara = createElement('select', {'className': 'form-control'});
      var selUnitGrade = createElement('select', {'className': 'form-control'});
      var selAttribute = createElement('select', {'className': 'form-control'});
      var selTriggerType = createElement('select', {'className': 'form-control'});
      var selTriggerRequire = createElement('select', {'className': 'form-control'});
      var selSkillType = createElement('select', {'className': 'form-control'});
      var selSpecial = createElement('select', {'className': 'form-control'});
      var selSetName = createElement('select', {'className': 'form-control'});
      LLUnit.updateSubElements(eContainer, [
         '筛选：',
         selRarity,
         selChara,
         selUnitGrade,
         selAttribute,
         selTriggerType,
         selTriggerRequire,
         selSkillType,
         selSpecial,
         selSetName
      ]);
      eContainer.className = "form-inline";

      var me = this;
      var addSelect = function (name, element, cardFilter, extraCallback) {
         var comp = new LLSelectComponent(element);
         var filters;
         if (typeof(cardFilter) == 'function') {
            filters = {};
            filters[SEL_ID_CARD_CHOICE] = cardFilter;
         } else {
            filters = cardFilter;
         }
         me.addComponentAsFilter(name, comp, filters, extraCallback);
      };
      me.add(SEL_ID_CARD_CHOICE, new LLSelectComponent(SEL_ID_CARD_CHOICE));
      me.getComponent(SEL_ID_CARD_CHOICE).onValueChange = function (v) {
         if (me.onCardChange) me.onCardChange(v);
      };
      me.dataForSelects[SEL_ID_CARD_CHOICE] = function (option) {
         var index = option.value;
         if (!index) return undefined;
         return cards[index];
      };

      addSelect(SEL_ID_RARITY, selRarity, function (card, v) { return (v == '' || card.rarity == v); });

      var charaFilters = {};
      charaFilters[SEL_ID_CARD_CHOICE] = function (card, v) { return (v == '' || LLConst.Member.getMemberName(card.typeid) == v); };
      charaFilters[SEL_ID_SET_NAME] = function (opt, v) {
         if (v == '' || opt.value === '') return true;
         var members = me.albumGroupMemberCache[opt.value];
         if (!members) return false;
         for (var i = 0; i < members.length; i++) {
            if (LLConst.Member.getMemberName(members[i]) == v) return true;
         }
         return false;
      };
      addSelect(SEL_ID_CHARA, selChara, charaFilters);

      var unitGradeFilters = {};
      unitGradeFilters[SEL_ID_CARD_CHOICE] = function (card, v) { return (v == '' || LLConst.isMemberInGroup(parseInt(card.typeid), v)); };
      unitGradeFilters[SEL_ID_CHARA] = function (opt, v) { return (v == '' || opt.value == '' || LLConst.isMemberInGroup(opt.value, v)); };
      unitGradeFilters[SEL_ID_SET_NAME] = function (opt, v) {
         if (v == '' || opt.value === '') return true;
         var members = me.albumGroupMemberCache[opt.value];
         if (!members) return false;
         for (var i = 0; i < members.length; i++) {
            if (LLConst.isMemberInGroup(members[i], v)) return true;
         }
         return false;
      };
      addSelect(SEL_ID_UNIT_GRADE, selUnitGrade, unitGradeFilters);

      addSelect(SEL_ID_ATTRIBUTE, selAttribute, function (card, v) { return (v == '' || card.attribute == v); });
      addSelect(SEL_ID_TRIGGER_TYPE, selTriggerType,
         function (card, v) { return (v == '' || card.triggertype == v); },
         function (v) { updateTriggerRequireOption(me, v); }
      );
      addSelect(SEL_ID_TRIGGER_REQUIRE, selTriggerRequire, function (card, v) { return (v == '' || card.triggerrequire == v); });
      addSelect(SEL_ID_SKILL_TYPE, selSkillType, function (card, v) { return (v == '' || card.skilleffect == v); });
      addSelect(SEL_ID_SPECIAL, selSpecial, function (card, v) { return (v == '' || parseInt(card.special) == parseInt(v)); });
      addSelect(SEL_ID_SET_NAME, selSetName, function (card, v) { return (v == '' || LLConst.isAlbumInAlbumGroup(card.album, v)); });

      // showncard
      var showncardFilters = {};
      showncardFilters[SEL_ID_CARD_CHOICE] = function (card, v) { return (v == true || card.rarity != 'N'); };
      showncardFilters[SEL_ID_CHARA] = function (opt, v) {
         return (v == true) || (opt.value == '') || (LLConst[opt.value] !== undefined);
      };
      me.addComponentAsFilter('showncard', new LLValuedComponent('showncard'), showncardFilters);

      me.setCardData(cards);
   };
   var cls = LLCardSelector_cls;
   LLClassUtil.setSuper(cls, LLComponentCollection);

   var makeTriggerTypeOption = function (triggerId) {
      return {'value': triggerId, 'text': LLConst.getSkillTriggerText(parseInt(triggerId))};
   };
   var makeEffectTypeOption = function (effectId) {
      return {'value': effectId, 'text': LLConst.getSkillEffectText(parseInt(effectId))};
   };

   var handleCardFilter = function (me, compId) {
      var comp = me.getComponent(compId);
      if (!comp) {
         console.error('not found filter target ' + compId);
         return;
      }
      var dataGetter = me.dataForSelects[compId];
      var filterMap = me.filters[compId];
      var filters = [];
      var values = [];
      if (filterMap) {
         for (var i in filterMap) {
            filters.push(filterMap[i]);
            values.push(me.getComponent(i).get());
         }
      }
      comp.filterOptions(function (option) {
         if (!filterMap) return true;
         var data = option;
         if (dataGetter) data = dataGetter(option);
         if (data === undefined) return true;
         for (var j = 0; j < filters.length; j++) {
            if (!filters[j](data, values[j])) return false;
         }
         return true;
      });
   };
   var proto = cls.prototype;
   proto.handleCardFilters = function (affectedComps) {
      var me = this;
      if (!affectedComps) {
         for (var i in me.filters) {
            handleCardFilter(me, i);
         }
      } else {
         for (var i = 0; i < affectedComps.length; i++) {
            handleCardFilter(me, affectedComps[i]);
         }
      }
   };
   proto.setLanguage = function (language) {
      if (this.language == language) return;
      this.language = language;
      this.getComponent(SEL_ID_CARD_CHOICE).setOptions(this.cardOptions[this.language]);
      this.getComponent(SEL_ID_SET_NAME).setOptions(this.setNameOptions[this.language]);
      this.getComponent(SEL_ID_CHARA).setOptions(this.charaNameOptions[this.language]);
   };
   proto.getCardId = function () {
      return this.getComponent(SEL_ID_CARD_CHOICE).get() || '';
   };
   proto.addComponentAsFilter = function (name, comp, filters, extraCallback) {
      var me = this;
      me.add(name, comp);
      var affectedComps = [];
      for (var i in filters) {
         if (me.filters[i] === undefined) {
            me.filters[i] = {};
         }
         me.filters[i][name] = filters[i];
         affectedComps.push(i);
      }
      comp.onValueChange = function (v) {
         if (!me.freezeCardFilter) me.handleCardFilters(affectedComps);
         if (extraCallback) extraCallback(v);
      };
   };
   proto.setCardData = function (cards, resetSelection) {
      if (typeof(cards) == "string") {
         cards = JSON.parse(cards);
      }
      this.cards = cards;
      this.freezeCardFilter = 1;

      var foundTypeIds = {};
      var foundTriggerRequires = {};

      // build card options for both language
      var cardOptionsCN = [{'value': '', 'text': ''}];
      var cardOptionsJP = [{'value': '', 'text': ''}];
      var cardKeys = Object.keys(cards).sort(function(a,b){return parseInt(a) - parseInt(b);});
      var i;
      var albumGroupMemberCache = {};
      for (i = 0; i < cardKeys.length; i++) {
         var index = cardKeys[i];
         if (index == "0") continue;
         var curCard = this.cards[index];
         if (curCard.support == 1) continue;

         var curTypeId = (curCard.typeid ? parseInt(curCard.typeid) : -1);
         var cnName = LLConst.getCardDescription(curCard, false);
         var jpName = LLConst.getCardDescription(curCard, true);
         var color = LLConst.getAttributeColor(curCard.attribute);
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
            var albumGroup = LLConst.getAlbumGroupByAlbumId(parseInt(curCard.album));
            if (albumGroupMemberCache[albumGroup.id]) {
               albumGroupMemberCache[albumGroup.id].push(curTypeId);
            } else {
               albumGroupMemberCache[albumGroup.id] = [curTypeId];
            }
         }
      }
      this.cardOptions = [cardOptionsCN, cardOptionsJP];
      this.albumGroupMemberCache = albumGroupMemberCache;
      this.getComponent(SEL_ID_CARD_CHOICE).setOptions(this.cardOptions[this.language]);
      if (resetSelection) this.getComponent(SEL_ID_CARD_CHOICE).set('');

      // build set name options from album groups
      var setNameOptionsCN = [{'value': '', 'text': '相册名'}];
      var setNameOptionsJP = [{'value': '', 'text': '相册名'}];
      var albumGroups = LLConst.getAlbumGroups();
      for (i = 0; i < albumGroups.length; i++) {
         var curGroup = albumGroups[i];
         setNameOptionsCN.push({'value': i, 'text': (curGroup.cnname || curGroup.name)});
         setNameOptionsJP.push({'value': i, 'text': curGroup.name});
      }
      this.setNameOptions = [setNameOptionsCN, setNameOptionsJP];
      this.getComponent(SEL_ID_SET_NAME).setOptions(this.setNameOptions[this.language]);

      // build character name options
      var charaNameOptionsCN = [{'value': '', 'text': '角色'}];
      var charaNameOptionsJP = [{'value': '', 'text': '角色'}];
      var typeIds = Object.keys(foundTypeIds).sort(function (a, b){return parseInt(a)-parseInt(b);});
      var normalizedTypeIds = [];
      var typeNameId = {};
      for (i = 0; i < typeIds.length; i++) {
         var curTypeId = parseInt(typeIds[i]);
         if (curTypeId < 0) continue;
         // some member has more than 1 id, we need normalize the ids using LLConst
         var jpName = LLConst.Member.getMemberName(curTypeId);
         if (typeNameId[jpName] === undefined) {
            if (LLConst[jpName] !== undefined) {
               curTypeId = LLConst[jpName];
            } 
            typeNameId[jpName] = curTypeId;
            normalizedTypeIds.push(curTypeId);
         }
      }
      normalizedTypeIds = normalizedTypeIds.sort(function (a, b) {return a - b});
      for (i = 0; i < normalizedTypeIds.length; i++) {
         var curTypeId = normalizedTypeIds[i];
         var jpName = LLConst.Member.getMemberName(curTypeId);
         var cnName = LLConst.Member.getMemberName(curTypeId, true);
         var bkColor = LLConst.getMemberBackgroundColor(curTypeId);
         charaNameOptionsCN.push({'value': jpName, 'text': cnName, 'background': bkColor});
         charaNameOptionsJP.push({'value': jpName, 'text': jpName, 'background': bkColor});
      }
      this.charaNameOptions = [charaNameOptionsCN, charaNameOptionsJP];
      this.getComponent(SEL_ID_CHARA).setOptions(this.charaNameOptions[this.language]);

      // build trigger require options
      var triggerRequireOptions = {
         '': [{'value': '', 'text': '触发条件'}]
      };
      for (i in foundTriggerRequires) {
         var triggerRequires = Object.keys(foundTriggerRequires[i]).sort(function (a, b){return parseInt(a) - parseInt(b)});
         var options = [{'value': '', 'text': '触发条件'}];
         var unitText = LLConst.getSkillTriggerUnit(parseInt(i));
         for (var j = 0; j < triggerRequires.length; j++) {
            options.push({'value': triggerRequires[j], 'text': triggerRequires[j] + unitText});
         }
         triggerRequireOptions[parseInt(i)] = options;
      }
      this.triggerRequireOptions = triggerRequireOptions;
      updateTriggerRequireOption(this, this.getComponent(SEL_ID_TRIGGER_TYPE).get());

      // set other options
      this.getComponent(SEL_ID_RARITY).setOptions([
         {'value': '',    'text': '稀有度'},
         {'value': 'N',   'text': 'N'},
         {'value': 'R',   'text': 'R'},
         {'value': 'SR',  'text': 'SR'},
         {'value': 'SSR', 'text': 'SSR'},
         {'value': 'UR',  'text': 'UR'}
      ]);
      this.getComponent(SEL_ID_UNIT_GRADE).setOptions([
         {'value': '', 'text': '年级小队'},
         {'value': LLConst.GROUP_MUSE,   'text': "μ's"},
         {'value': LLConst.GROUP_AQOURS, 'text': 'Aqours'},
         {'value': LLConst.GROUP_NIJIGASAKI, 'text': '虹咲'},
         {'value': LLConst.GROUP_LIELLA, 'text': 'Liella!'},
         {'value': LLConst.GROUP_GRADE1, 'text': '一年级'},
         {'value': LLConst.GROUP_GRADE2, 'text': '二年级'},
         {'value': LLConst.GROUP_GRADE3, 'text': '三年级'},
         {'value': LLConst.GROUP_PRINTEMPS, 'text': 'Printemps'},
         {'value': LLConst.GROUP_LILYWHITE, 'text': 'lilywhite'},
         {'value': LLConst.GROUP_BIBI,   'text': 'BiBi'},
         {'value': LLConst.GROUP_CYARON, 'text': 'CYaRon!'},
         {'value': LLConst.GROUP_AZALEA, 'text': 'AZALEA'},
         {'value': LLConst.GROUP_GUILTYKISS, 'text': 'Guilty Kiss'}
      ]);
      this.getComponent(SEL_ID_ATTRIBUTE).setOptions([
         {'value': '',      'text': '属性',  'color': 'black'},
         {'value': 'smile', 'text': 'smile', 'color': 'red'},
         {'value': 'pure',  'text': 'pure',  'color': 'green'},
         {'value': 'cool',  'text': 'cool',  'color': 'blue'}
      ]);
      this.getComponent(SEL_ID_TRIGGER_TYPE).setOptions([
         {'value': '', 'text': '触发类型'},
         makeTriggerTypeOption(LLConst.SKILL_TRIGGER_TIME),
         makeTriggerTypeOption(LLConst.SKILL_TRIGGER_NOTE),
         makeTriggerTypeOption(LLConst.SKILL_TRIGGER_COMBO),
         makeTriggerTypeOption(LLConst.SKILL_TRIGGER_SCORE),
         makeTriggerTypeOption(LLConst.SKILL_TRIGGER_PERFECT),
         makeTriggerTypeOption(LLConst.SKILL_TRIGGER_STAR_PERFECT),
         makeTriggerTypeOption(LLConst.SKILL_TRIGGER_MEMBERS)
      ]);
      this.getComponent(SEL_ID_SKILL_TYPE).setOptions([
         {'value': '', 'text': '技能类型'},
         makeEffectTypeOption(LLConst.SKILL_EFFECT_ACCURACY_SMALL),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_ACCURACY_NORMAL),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_HEAL),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_SCORE),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_POSSIBILITY_UP),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_REPEAT),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_PERFECT_SCORE_UP),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_COMBO_FEVER),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_SYNC),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_LEVEL_UP),
         makeEffectTypeOption(LLConst.SKILL_EFFECT_ATTRIBUTE_UP)
      ]);
      this.getComponent(SEL_ID_SPECIAL).setOptions([
         {'value': '', 'text': '是否特典卡'},
         {'value': '0', 'text': '不是特典'},
         {'value': '1', 'text': '是特典'}
      ]);

      // at last, unfreeze the card filter and refresh filter
      this.freezeCardFilter = 0;
      this.handleCardFilters();
   };
   var super_serialize = proto.serialize;
   var super_deserialize = proto.deserialize;
   proto.serialize = function () {
      return {
         language: this.language,
         components: super_serialize.call(this)
      };
   };
   proto.deserialize = function (v) {
      if (!v) return;
      this.freezeCardFilter = 1;
      if (v.language !== undefined) {
         this.setLanguage(v.language);
      }
      super_deserialize.call(this, v.components);
      this.freezeCardFilter = 0;
      this.handleCardFilters();
      if (this.onCardChange) this.onCardChange(this.getCardId());
   };
   return cls;
})();

/**
 * @typedef LLSongSelector_CompMapping
 * @property {string | HTMLElement} [diffchoice]
 * @property {string | HTMLElement} [songchoice]
 * @property {string | HTMLElement} [songatt]
 * @property {string | HTMLElement} [songunit]
 * @property {string | HTMLElement} [songsearch]
 * @property {string | HTMLElement} [songdiff]
 * @property {string | HTMLElement} [songac]
 * @property {string | HTMLElement} [songswing]
 * @property {string | HTMLElement} [songstardiff]
 * @property {string | HTMLElement} [map]
 */
var LLSongSelector = (function() {
//  removed difficulty (easy, normal, hard, expert, master, arcade, expert_swing)
//  added live settings (settings: {"<liveid>": {<similar to old difficulty>, difficulty: <difficulty id>, isac: <isac>, isswing: <isswing>}, ...})
//  removed separate group (muse, aqours, niji)
//  added group (group: <1(muse)|2(aqours)|3(niji)>

   var COMP_DIFF_CHOICE = 'diffchoice';
   var COMP_SONG_CHOICE = 'songchoice';
   var COMP_SONG_ATT = 'songatt';
   var COMP_SONG_UNIT = 'songunit';
   var COMP_SONG_SEARCH = 'songsearch';
   var COMP_SONG_DIFF = 'songdiff';
   var COMP_SONG_AC = 'songac';
   var COMP_SONG_SWING = 'songswing';
   var COMP_SONG_STAR_DIFF = 'songstardiff';
   var COMP_MAP_ATT = 'map';
   /* Properties:
    *    songs
    *    songSettings
    *    language (serialize)
    *    songFilters
    *    songSettingFilters
    *    freezeSongFilter
    *    songOptions
    *    songSettingOptions
    * Methods:
    *    getSelectedSongId()
    *    getSelectedSong()
    *    getSelectedSongSettingId()
    *    getSelectedSongSetting()
    *    handleSongFilter()
    *    setLanguage(language)
    *    addComponentAsFilter(name, component, songFilterFunction, songSettingFilterFunction)
    *    serialize() (override)
    *    deserialize(v) (override)
    * Callback:
    *    onSongSettingChange(songSettingId)
    *    onSongColorChange(attribute)
    */
   /**
    * @constructor
    * @param {string | LLH.API.SongDictDataType} songjson 
    * @param {boolean} includeDefaultSong 
    * @param {LLSongSelector_CompMapping} compMapping
    */
   function LLSong_cls(songjson, includeDefaultSong, compMapping) {
      LLComponentCollection.call(this);

      this.language = 0;
      this.songFilters = {};
      this.songSettingFilters = {};

      if (!compMapping) {
         compMapping = {};
      }

      var me = this;
      var addComp = function (name, comp, sf, ssf) {
         if (sf === undefined) {
            sf = function (s, v) {
               for (var k in s.settings) {
                  if (ssf(s.settings[k], v)) return true;
               }
               return false;
            };
         }
         if (ssf === undefined) {
            ssf = function (ss, v) { return sf(me.songs[ss.song], v); }
         }
         me.addComponentAsFilter(name, comp, sf, ssf);
      };
      var addSelect = function (name, sf, ssf) {
         addComp(name, new LLSelectComponent(compMapping[name] || name), sf, ssf);
      };
      var addValued = function (name, sf, ssf) {
         addComp(name, new LLValuedComponent(compMapping[name] || name), sf, ssf);
      };
      me.add(COMP_DIFF_CHOICE, new LLSelectComponent(compMapping.diffchoice || COMP_DIFF_CHOICE));
      me.getComponent(COMP_DIFF_CHOICE).onValueChange = function (v) {
         if (me.onSongSettingChange) me.onSongSettingChange(v);
      };
      addSelect(COMP_SONG_CHOICE,
         function (s, v) { return true; },
         function (ss, v) { return (v == '' || ss.song == v); }
      );
      addSelect(COMP_SONG_ATT, function (s, v) { return (v == '' || s.attribute == '' || s.attribute == v); });
      addSelect(COMP_SONG_UNIT, function (s, v) { return (v == '' || s.group == v); });
      addValued(COMP_SONG_SEARCH,
         function (s, v) {
            if (v == '') return true;
            v = v.toLowerCase();
            return (s.name.toLowerCase().indexOf(v) != -1 || s.jpname.toLowerCase().indexOf(v) != -1)
         }
      );
      addSelect(COMP_SONG_DIFF, undefined, function (ss, v) { return (v == '' || ss.difficulty == v); });
      addSelect(COMP_SONG_AC, undefined, function (ss, v) { return (v == '' || ss.isac == v); });
      addSelect(COMP_SONG_SWING, undefined, function (ss, v) { return (v == '' || ss.isswing == v); });
      addSelect(COMP_SONG_STAR_DIFF, undefined, function (ss, v) { return (v == '' || ss.stardifficulty == v); });
      var comp_mapAtt = new LLSelectComponent(compMapping.map || COMP_MAP_ATT);
      if (comp_mapAtt.exist) {
         me.add(COMP_MAP_ATT, comp_mapAtt);
         me.getComponent(COMP_MAP_ATT).onValueChange = function (v) {
            if (me.onSongColorChange) me.onSongColorChange(v);
         };
      }

      me.setSongData(songjson, includeDefaultSong);
   };

   var cls = LLSong_cls;
   LLClassUtil.setSuper(cls, LLComponentCollection);
   var proto = cls.prototype;

   /**
    * @this LLSongSelector
    * @param {string | LLH.API.SongDictDataType} songjson
    * @param {boolean} includeDefaultSong
    */
   proto.setSongData = function (songjson, includeDefaultSong) {
      /** @type {LLH.API.SongDictDataType} */
      var songs = undefined;
      if (typeof(songjson) == "string") {
         songs = JSON.parse(songjson);
      } else {
         songs = songjson;
      }
      if (includeDefaultSong === undefined || includeDefaultSong) {
         var songGroups = LLConst.getSongGroupIds();
         var songDefaultSets = LLConst.getDefaultSongSetIds();
         for (var i = 0; i < songGroups.length; i++) {
            for (var j = 0; j < songDefaultSets.length; j++) {
               var defaultSong = LLConst.getDefaultSong(songGroups[i], songDefaultSets[j]);
               songs[String(-((i+1)*100 + j))] = defaultSong;
            }
         }
      }

      /** @type {LLH.API.SongSettingDictDataType} */
      var songSettings = {};
      for (var i in songs) {
         if (!songs[i].settings) continue;
         for (var j in songs[i].settings) {
            songSettings[j] = songs[i].settings[j];
            songs[i].settings[j].song = i;
         }
      }

      this.songs = songs;
      this.songSettings = songSettings;
      this.freezeSongFilter = 1;
      // build song setting options for both language
      var songSettingAvailableStarDiff = new Array(20);
      var songSettingOptionsCN = [{'value': '', 'text': '谱面', 'color': 'black'}];
      var songSettingOptionsJP = [{'value': '', 'text': '谱面', 'color': 'black'}];
      var songSettingKeys = Object.keys(songSettings).sort(function (a,b){
         var ia = parseInt(a), ib =  parseInt(b);
         if (ia < 0 && ib < 0) return ib - ia;
         return ia - ib;
      });
      var i;
      for (i = 0; i < songSettingKeys.length; i++) {
         var liveId = songSettingKeys[i];
         var curSongSetting = songSettings[liveId];
         var curSong = songs[curSongSetting.song];
         var fullname = String(liveId);
         if (parseInt(liveId) > 0) {
            while (fullname.length < 3) fullname = '0' + fullname;
         }
         fullname += ' ★ ' + curSongSetting.stardifficulty + ' [';
         var cnName = fullname + LLConst.getSongDifficultyName(curSongSetting.difficulty, 1) + (curSongSetting.isac ? ' 街机' : '') + (curSongSetting.isswing ? ' 滑键' : '') + '][' + curSongSetting.combo + ' 连击] ' + curSong.name;
         var jpName = fullname + LLConst.getSongDifficultyName(curSongSetting.difficulty, 0) + (curSongSetting.isac ? ' Arcade' : '') + (curSongSetting.isswing ? ' Swing' : '') + '][' + curSongSetting.combo + ' COMBO] ' + curSong.jpname;
         var color = LLConst.getAttributeColor(curSong.attribute);
         songSettingOptionsCN.push({'value': liveId, 'text': cnName, 'color': color});
         songSettingOptionsJP.push({'value': liveId, 'text': jpName, 'color': color});

         songSettingAvailableStarDiff[parseInt(curSongSetting.stardifficulty)] = 1;
      }
      this.songSettingOptions = [songSettingOptionsCN, songSettingOptionsJP];
      this.getComponent(COMP_DIFF_CHOICE).setOptions(this.songSettingOptions[this.language]);

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
         var color = LLConst.getAttributeColor(curSong.attribute);
         songOptionsCN.push({'value': songId, 'text': curSong.name, 'color': color});
         songOptionsJP.push({'value': songId, 'text': curSong.jpname, 'color': color});
      }
      this.songOptions = [songOptionsCN, songOptionsJP];
      this.getComponent(COMP_SONG_CHOICE).setOptions(this.songOptions[this.language]);

      // set other options
      this.getComponent(COMP_SONG_DIFF).setOptions([
         {'value': '',  'text': '难度'},
         {'value': '1', 'text': '简单（Easy）'},
         {'value': '2', 'text': '普通（Normal）'},
         {'value': '3', 'text': '困难（Hard）'},
         {'value': '4', 'text': '专家（Expert）'},
         {'value': '5', 'text': '随机（Random）'},
         {'value': '6', 'text': '大师（Master）'}
      ]);
      this.getComponent(COMP_SONG_ATT).setOptions([
         {'value': '',      'text': '属性',  'color': 'black'},
         {'value': 'smile', 'text': 'Smile', 'color': 'red'},
         {'value': 'pure',  'text': 'Pure',  'color': 'green'},
         {'value': 'cool',  'text': 'Cool',  'color': 'blue'}
      ]);
      this.getComponent(COMP_SONG_UNIT).setOptions([
         {'value': '',  'text': '组合'},
         {'value': '1', 'text': "μ's"},
         {'value': '2', 'text': 'Aqours'},
         {'value': '3', 'text': '虹咲'},
         {'value': '4', 'text': 'Liella!'}
      ]);
      this.getComponent(COMP_SONG_SWING).setOptions([
         {'value': '',  'text': '是否滑键谱面'},
         {'value': '0', 'text': '非滑键'},
         {'value': '1', 'text': '滑键'},
      ]);
      this.getComponent(COMP_SONG_AC).setOptions([
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
      this.getComponent(COMP_SONG_STAR_DIFF).setOptions(songStarDifficultyOptions);
      if (this.getComponent(COMP_MAP_ATT)) {
         this.getComponent(COMP_MAP_ATT).setOptions([
            {'value': 'smile', 'text': 'Smile', 'color': 'red'},
            {'value': 'pure',  'text': 'Pure',  'color': 'green'},
            {'value': 'cool',  'text': 'Cool',  'color': 'blue'}
         ]);
      }

      // at last, unfreeze the filter
      this.freezeSongFilter = 0;
      this.handleSongFilter();
   };

   proto.addComponentAsFilter = function (name, comp, sf, ssf) {
      var me = this;
      me.add(name, comp);
      comp.onValueChange = function (v) {
         me.songFilters[name] = function (song) { return sf(song, v); };
         me.songSettingFilters[name] = function (songsetting) { return ssf(songsetting, v); };
         if (!me.freezeSongFilter) me.handleSongFilter();
      };
      comp.onValueChange(comp.get());
   };

   var doFilter = function (data, filters, option) {
      var index = option.value;
      if (!index) return true;
      var s = data[index];
      if (!s) return true;
      for (var i in filters) {
         if (!filters[i](s)) return false;
      }
      return true;
   };

   proto.handleSongFilter = function () {
      var me = this;
      this.getComponent(COMP_SONG_CHOICE).filterOptions(function (option) {
         return doFilter(me.songs, me.songFilters, option);
      });
      this.getComponent(COMP_DIFF_CHOICE).filterOptions(function (option) {
         return doFilter(me.songSettings, me.songSettingFilters, option);
      });
      if (this.getComponent(COMP_MAP_ATT)) {
         var curSong = me.getSelectedSong();
         var curSongAttr = (curSong ? curSong.attribute : '');
         this.getComponent(COMP_MAP_ATT).filterOptions(function (option) {
            return curSongAttr == '' || option.value == curSongAttr;
         });
      }
   };

   proto.setLanguage = function (language) {
      if (this.language == language) return;
      this.language = language;
      this.getComponent(COMP_SONG_CHOICE).setOptions(this.songOptions[this.language]);
      this.getComponent(COMP_DIFF_CHOICE).setOptions(this.songSettingOptions[this.language]);
   };

   var super_serialize = proto.serialize;
   var super_deserialize = proto.deserialize;
   proto.serialize = function () {
      return {
         language: this.language,
         components: super_serialize.call(this)
      };
   };
   proto.deserialize = function (v) {
      if (!v) return;
      this.freezeSongFilter = 1;
      if (v.language !== undefined) {
         this.setLanguage(v.language);
      }
      super_deserialize.call(this, v.components);
      this.freezeSongFilter = 0;
      this.handleSongFilter();
      if (this.onSongChange) this.onSongChange(this.getSelectedSongId());
   };
   proto.getSelectedSongId = function () {
      var curSongId = this.getComponent(COMP_SONG_CHOICE).get();
      if (curSongId) return curSongId;
      var curSongSettingId = this.getComponent(COMP_DIFF_CHOICE).get();
      if (curSongSettingId && this.songSettings[curSongSettingId]) {
         return this.songSettings[curSongSettingId].song || '';
      }
      return '';
   };
   proto.getSelectedSong = function () {
      return this.songs[this.getSelectedSongId()];
   };
   proto.getSelectedSongSettingId = function () {
      return this.getComponent(COMP_DIFF_CHOICE).get();
   };
   proto.getSelectedSongSetting = function () {
      return this.songSettings[this.getSelectedSongSettingId()];
   };
   return cls;
})();

/*
 * strength calculation helper
 *   LLMap
 *   LLSisGem
 *   LLSkill
 *   LLMember
 *   LLSimulateContext
 *   LLTeam
 */
/**
 * @typedef CSkillDataType
 * @property {AttributeType} attribute add to
 * @property {AttributeType} Cskillattribute add from
 * @property {number} Cskillpercentage percentage
 * @property {number} [Csecondskillattribute] effect value, percentage
 * @property {number} [Csecondskilllimit] target group
 */
/**
 * @typedef LLMap
 * @property {AttributeType} attribute
 * @property {number[]} weights
 * @property {number} totalWeight sum(weights)
 * @property {CSkillDataType} friendCSkill
 * @property {number} combo int
 * @property {number} star int
 * @property {number} time float
 * @property {number} perfect int
 * @property {number} starPerfect int
 * @property {number} tapup percentage
 * @property {number} skillup percentage
 * @property {number} songUnit group id
 * @property {number} speed
 * @property {1|2} combo_fever_pattern
 * @property {0|1} over_heal_pattern
 * @property {0|1} perfect_accuracy_pattern
 * @property {0|1} trigger_limit_pattern
 * @property {function(LLScoreDistributionParameter_SaveDataType): void} setDistParam
 */
var LLMap = (function () {
   var DEFAULT_SONG_MUSE = LLConst.getDefaultSong(LLConst.SONG_GROUP_MUSE, LLConst.SONG_DEFAULT_SET_1);
   var DEFAULT_SONG_SETTING = (function (s) {
      for (var k in s.settings) {
         if (s.settings[k].difficulty == LLConst.SONG_DIFFICULTY_EXPERT) {
            return s.settings[k];
         }
      }
      console.error('failed to find default song setting');
      return undefined;
   })(DEFAULT_SONG_MUSE);

   /**
    * @constructor
    * @param {{song?: LLH.API.SongDataType, songSetting?: LLH.API.SongSettingDataType, friendCSkill?: CSkillDataType}} options 
    */
   function LLMap_cls(options) {
      if (options.song) {
         this.setSong(options.song, options.songSetting);
      } else {
         this.setSong(DEFAULT_SONG_MUSE, DEFAULT_SONG_SETTING);
      }
      if (options.friendCSkill) {
         this.friendCSkill = options.friendCSkill;
      } else {
         // no friend cskill
         this.setFriendCSkill('smile', 'smile', 0, LLConst.GROUP_MUSE, 0);
      }
      this.setMapBuff();
   };
   var cls = LLMap_cls;
   var proto = cls.prototype;
   proto.setSong = function (song, songSetting) {
      if ((!song) || (!songSetting)) {
         console.error('No song data');
         return;
      }
      this.attribute = song.attribute || '';
      this.songUnit = LLConst.getGroupForSongGroup(song.group);
      // when difficulty is not given, use 0 for difficulty-specific data
      this.setSongDifficultyData(songSetting.combo, songSetting.star, songSetting.time);
      this.setWeights(songSetting.positionweight || [0, 0, 0, 0, 0, 0, 0, 0, 0]);
   };
   proto.setWeights = function (weights) {
      var w = [];
      var total = 0;
      if (weights && weights.length == 9) {
         for (var i = 0; i < 9; i++) {
            var curWeight = parseFloat(weights[i]);
            w.push(curWeight);
            total += curWeight;
         }
      } else {
         if (weights !== undefined) {
            console.error('Invalid weight data:');
            console.log(weights);
         }
         w = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
      this.weights = w;
      this.totalWeight = total;
   };
   proto.setFriendCSkill = function (addToAttribute, addFromAttribute, percentage, groupLimit, groupPercentage) {
      this.friendCSkill = {
         'attribute': addToAttribute,
         'Cskillattribute': addFromAttribute,
         'Cskillpercentage': parseInt(percentage || 0),
         'Csecondskilllimit': parseInt(groupLimit || LLConst.GROUP_UNKNOWN),
         'Csecondskillattribute': parseInt(groupPercentage || 0)
      };
   };
   proto.setSongDifficultyData = function (combo, star, time, perfect, starPerfect) {
      this.combo = parseInt(combo || 0);
      this.star = parseInt(star || 0);
      this.time = parseFloat(time || 0);
      // 95% perfect
      this.perfect = parseInt(perfect === undefined ? (this.combo * 19 / 20) : perfect || 0);
      this.starPerfect = parseInt(starPerfect || 0);
   };
   proto.setMapBuff = function (tapup, skillup) {
      this.tapup = parseFloat(tapup || 0);
      this.skillup = parseFloat(skillup || 0);
   };
   /** @param {LLScoreDistributionParameter_SaveDataType} distParam */
   proto.setDistParam = function (distParam) {
      this.perfect = Math.floor(parseFloat(distParam.perfect_percent || 0)/100 * this.combo);
      this.speed = distParam.speed;
      this.combo_fever_pattern = distParam.combo_fever_pattern;
      this.over_heal_pattern = distParam.over_heal_pattern;
      this.perfect_accuracy_pattern = distParam.perfect_accuracy_pattern;
      this.trigger_limit_pattern = distParam.trigger_limit_pattern;
   };
   return cls;
})();

var LLSisGem = (function () {
   /**
    * @constructor
    * @param {number} type
    * @param {LLH.Model.LLSisGem_Options} options
    * @this {LLH.Model.LLSisGem}
    */
   function LLSisGem_cls(type, options) {
      var meta = LLConst.Gem.getNormalGemMeta(type);
      if (!meta) throw 'Unknown type: ' + type;
      this.type = type;
      this.meta = meta;

      options = options || {};
      if (meta.per_grade && options.grade) this.grade = options.grade;
      if (meta.per_member && options.member) {
         this.member = options.member;
         this.color = LLConst.getMemberColor(options.member);
      }
      if (meta.per_color && options.color) this.color = options.color;
      if (meta.per_unit && options.unit) this.unit = options.unit;
   };
   /** @type {typeof LLH.Model.LLSisGem} */
   var cls = LLSisGem_cls;

   cls.getGemSlot = function (type) {
      return LLConst.Gem.getNormalGemMeta(type).slot;
   };
   cls.getGemStockCount = function (gemStock, gemStockKeys) {
      var cur = gemStock;
      var keys = gemStockKeys;
      for (var i = 0; i < keys.length; i++) {
         if (cur.ALL !== undefined) return cur.ALL;
         cur = cur[keys[i]];
         if (cur === undefined) {
            console.log("Not found " + keys.join('.') + " in gem stock");
            return 0;
         }
      }
      return cur;
   };
   var proto = cls.prototype;
   proto.isEffectRangeSelf = function () { return this.meta.effect_range == LLConst.SIS_RANGE_SELF; };
   proto.isEffectRangeAll = function () { return this.meta.effect_range == LLConst.SIS_RANGE_TEAM; };
   proto.isSkillGem = function () { return this.meta.skill_mul || this.meta.heal_mul; };
   proto.isAccuracyGem = function () { return this.meta.ease_attr_mul; };
   proto.isValid = function () {
      if (this.meta.per_grade && !this.grade) return false;
      if (this.meta.per_member) {
         if (!this.member) return false;
         if (!LLConst.Gem.isMemberGemExist(this.member)) return false;
      }
      if (this.meta.per_unit && !this.unit) return false;
      if (this.meta.per_color && !this.color) return false;
      return true;
   };
   proto.isAttrMultiple = function () { return this.meta.attr_mul; };
   proto.isAttrAdd = function () { return this.meta.attr_add; };
   proto.isHealToScore = function () { return this.meta.heal_mul; };
   proto.isScoreMultiple = function () { return this.meta.skill_mul; };
   proto.isNonet = function () { return this.meta.per_unit; };
   proto.isMemberGem = function () { return this.meta.per_member; };
   proto.getEffectValue = function () { return this.meta.effect_value; };
   proto.getNormalGemType = function () { return this.type; };
   proto.getGemStockKeys = function () {
      if (this.gemStockKeys !== undefined) return this.gemStockKeys;
      var ret = [this.meta.key];
      if (this.meta.per_grade) {
         if (this.grade === undefined) throw "Gem has no grade";
         ret.push(this.grade);
      }
      if (this.meta.per_member) {
         if (this.member === undefined) throw "Gem has no member";
         ret.push(this.member);
      }
      if (this.meta.per_unit) {
         if (this.unit === undefined) throw "Gem has no unit";
         ret.push(this.unit);
      }
      if (this.meta.per_color) {
         if (this.color === undefined) throw "Gem has no color";
         ret.push(this.color);
      }
      this.gemStockKeys = ret;
      return ret;
   };
   proto.getGemStockCount = function (gemStock) {
      return cls.getGemStockCount(gemStock, this.getGemStockKeys());
   };
   proto.getAttributeType = function () { return this.color; };
   proto.setAttributeType = function (newColor) { this.color = newColor; };
   return cls;
})();

var LLSkill = (function () {
   /**
    * @constructor
    * @param {LLH.API.CardDataType} card 
    * @param {number} level base 0
    * @param {{gemskill?: number, skillup?: number}} [buff] 
    */
   function LLSkill_cls(card, level, buff) {
      this.card = card;
      this.level = level;
      var skilldetails = card.skilldetail || [];
      /** @type {LLH.API.SkillDetailDataType} */
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

      this.reset();

      buff = buff || {};
      this.setScoreGem(buff.gemskill);
      this.setSkillPossibilityUp(buff.skillup);
   };
   var cls = LLSkill_cls;
   var eTriggerType = {
      'TIME': LLConst.SKILL_TRIGGER_TIME,
      'NOTE': LLConst.SKILL_TRIGGER_NOTE,
      'COMBO': LLConst.SKILL_TRIGGER_COMBO,
      'SCORE': LLConst.SKILL_TRIGGER_SCORE,
      'PERFECT': LLConst.SKILL_TRIGGER_PERFECT,
      'STAR_PERFECT': LLConst.SKILL_TRIGGER_STAR_PERFECT,
      'MEMBERS': LLConst.SKILL_TRIGGER_MEMBERS
   };
   var calcBiDist = function (n, p) {
      // time: O(n^2), space: O(n)
      if (n < 0) throw 'LLSkill::calcBiDist: n cannot be negitive, n=' + n + ', p=' + p;
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
   var proto = cls.prototype;
   proto.setScoreGem = function (has) {
      this.actualScore = 0;
      if (parseInt(has || 0)) {
         if (this.effectType == LLConst.SKILL_EFFECT_HEAL) {
            // 日服4.1版本前是270, 4.1版本后是480; 国服没有270
            this.actualScore = this.score * 480;
         } else if (this.effectType == LLConst.SKILL_EFFECT_SCORE) {
            this.actualScore = Math.ceil(this.score * 2.5);
         }
      } else {
         if (this.effectType == LLConst.SKILL_EFFECT_SCORE) {
            this.actualScore = this.score;
         }
      }
   };
   proto.setSkillPossibilityUp = function (rate) {
      this.actualPossibility = this.possibility * (1+parseInt(rate || 0)/100);
   };
   proto.reset = function () {
      this.skillChance = 0;
      this.averageScore = 0;
      this.maxScore = 0;
      this.averageHeal = 0;
      this.maxHeal = 0;
      this.simpleCoverage = 0;
      this.skillDist = undefined;
   };
   proto.isScoreTrigger = function () { return this.triggerType == eTriggerType.SCORE; };
   // 技能发动最大判定次数
   // 如果比上次计算的次数更多, 返回true, 否则返回false
   // env: {time, combo, score, perfect, starperfect}
   proto.calcSkillChance = function (env) {
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
   };
   proto.calcSkillEffect = function (env) {
      if (!this.hasSkill) return false;
      this.maxScore = this.skillChance * this.actualScore;
      if (this.effectType == LLConst.SKILL_EFFECT_HEAL) {
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
   };
   proto.calcSkillStrength = function (scorePerStrength) {
      if (!this.maxScore) {
         this.strength = 0;
      } else {
         this.strength = Math.round(this.maxScore * this.possibility/100 /scorePerStrength);
      }
   };
   proto.calcSkillDist = function () {
      if (this.skillChance === undefined) {
         console.error("No skill chance");
         return [1];
      }
      if (!this.skillChance) return [1]; // no chance or not supported, return 100% not active
      if (this.skillDist) return this.skillDist;
      this.skillDist = calcBiDist(this.skillChance, this.actualPossibility/100);
      return this.skillDist;
   };
   proto.isEffectHeal = function () { return this.effectType == LLConst.SKILL_EFFECT_HEAL; }
   proto.isEffectScore = function () { return this.effectType == LLConst.SKILL_EFFECT_SCORE; }
   return cls;
})();

/**
 * @typedef LLMember_Options
 * @property {number | string} cardid int
 * @property {number} smile int
 * @property {number} pure int
 * @property {number} cool int
 * @property {number} skilllevel int 1~8
 * @property {number} maxcost int 0~8
 * @property {number} hp int
 * @property {string[]} gemlist normal gem meta key list
 * @property {LLH.API.CardDataType} card
 */
var LLMember = (function() {
   var int_attr = ["cardid", "smile", "pure", "cool", "skilllevel", "maxcost", "hp"];
   var MIC_RATIO = [0, 5, 11, 24, 40, 0]; //'UR': 40, 'SSR': 24, 'SR': 11, 'R': 5, 'N': 0
   /**
    * @constructor
    * @param {LLMember_Options} v 
    * @param {AttributeType} mapAttribute
    */
   function LLMember_cls(v, mapAttribute) {
      v = v || {};
      var i;
      for (i = 0; i < int_attr.length; i++) {
         var attr = int_attr[i];
         if (v[attr] === undefined) {
            console.error('missing attribute ' + attr);
            this[attr] = 0;
         } else {
            this[attr] = parseInt(v[attr]);
         }
      }
      if (v.card === undefined) {
         console.error('missing card detail');
      } else {
         this.card = v.card;
      }
      this.gems = [];
      if (v.gemlist === undefined) {
         console.error('missing gem info');
      } else if (v.card) {
         for (i = 0; i < v.gemlist.length; i++) {
            var gemMetaId = LLConst.GemType[v.gemlist[i]];
            var memberId = v.card.typeid;
            var sisOptions = {
               'grade': LLConst.getMemberGrade(memberId),
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
      this.raw = v;
   };
   var cls = LLMember_cls;
   var proto = cls.prototype;
   proto.hasSkillGem = function () {
      for (var i = 0; i < this.gems.length; i++) {
         if (this.gems[i].isSkillGem()) return 1;
      }
      return 0;
   };
   proto.getAccuracyGemFactor = function () {
      var factor = 1;
      for (var i = 0; i < this.gems.length; i++) {
         if (this.gems[i].isAccuracyGem()) {
            factor = factor * (1+this.gems[i].effect_value/100);
         }
      }
      return factor;
   };
   proto.empty = function () {
      return (!this.cardid) || (this.cardid == '0');
   };
   proto.calcDisplayAttr = function (mapcolor) {
      //显示属性=(基本属性+绊)*单体百分比宝石加成+数值宝石加成
      var ret = {'smile': this.smile, 'pure': this.pure, 'cool': this.cool};
      for (var i = 0; i < this.gems.length; i++) {
         var gem = this.gems[i];
         if (gem.isAttrAdd()) {
            ret[gem.getAttributeType()] += gem.getEffectValue();
         }
         if (gem.isAttrMultiple() && gem.isEffectRangeSelf()) {
            ret[gem.getAttributeType()] += Math.ceil(gem.getEffectValue()/100 * this[gem.getAttributeType()]);
         }
      }
      this.displayAttr = ret;
      return ret;
   };
   proto.calcAttrWithGem = function (mapcolor, teamgem) {
      if (!this.displayAttr) throw "Need calcDisplayAttr first";
      if (!(teamgem && teamgem.length == 9)) throw "Expect teamgem length 9";
      //全体宝石累计加成(下标i表示0..i-1位队员所带的全体宝石给该队员带来的总加成, [0]=0)
      //注意全体宝石是在(基本属性值+绊)基础上计算的, 不是在显示属性上计算的
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
   };
   proto.calcAttrWithCSkill = function (mapcolor, cskills) {
      if (!this.attrWithGem) throw "Need calcAttrWithGem first";
      //主唱技能加成(下标i表示只考虑前i-1个队员的全体宝石时, 主唱技能的加成值, 下标0表示不考虑全体宝石)
      var cumulativeCSkillBonus = [];
      //属性强度(下标i表示只考虑前i-1个队员的全体宝石时的属性强度)
      var cumulativeAttrStrength = [];
      var baseAttr = {'smile':this.displayAttr.smile, 'pure':this.displayAttr.pure, 'cool':this.displayAttr.cool};
      for (var i = 0; i <= 9; i++) {
         baseAttr[mapcolor] = this.displayAttr[mapcolor] + this.cumulativeTeamGemBonus[i];
         var bonusAttr = {'smile':0, 'pure':0, 'cool':0};
         for (var j = 0; j < cskills.length; j++) {
            var cskill = cskills[j];
            //主c技能
            if (cskill.Cskillpercentage) {
               bonusAttr[cskill.attribute] += Math.ceil(baseAttr[cskill.Cskillattribute]*cskill.Cskillpercentage/100);
            }
            //副c技能
            if (cskill.Csecondskillattribute) {
               if (LLConst.isMemberInGroup(this.card.jpname, cskill.Csecondskilllimit)) {
                  bonusAttr[cskill.attribute] += Math.ceil(baseAttr[cskill.attribute]*cskill.Csecondskillattribute/100);
               }
            }
         }
         cumulativeCSkillBonus.push(bonusAttr[mapcolor]);
         cumulativeAttrStrength.push(baseAttr[mapcolor] + bonusAttr[mapcolor]);
         if (i == 9) {
            this.bonusAttr = bonusAttr;
            this.finalAttr = {
               'smile': baseAttr.smile + bonusAttr.smile,
               'pure': baseAttr.pure + bonusAttr.pure,
               'cool': baseAttr.cool + bonusAttr.cool
            };
            this.attrStrength = this.finalAttr[mapcolor];
            this.attrStrengthWithAccuracy = Math.ceil(this.attrStrength * this.getAccuracyGemFactor());
         }
      }
      this.cumulativeCSkillBonus = cumulativeCSkillBonus;
      this.cumulativeAttrStrength = cumulativeAttrStrength;
      return this.finalAttr[mapcolor];
   };
   proto.getAttrBuffFactor = function (mapcolor, mapunit) {
      var buff = 1;
      if (this.card.attribute == mapcolor) buff *= 1.1;
      if (LLConst.isMemberInGroup(this.card.jpname, mapunit)) buff *= 1.1;
      return buff;
   };
   proto.getAttrDebuffFactor = function (mapcolor, mapunit, weight, totalweight) {
      var debuff = 1;
      if (this.card.attribute != mapcolor) debuff *= 1.1;
      if (!LLConst.isMemberInGroup(this.card.jpname, mapunit)) debuff *= 1.1;
      debuff = 1-1/debuff;
      debuff = (weight/totalweight)*debuff;
      return debuff;
   };
   proto.calcAttrDebuff = function (mapdata, pos, teamattr) {
      var attrDebuff = Math.round(this.getAttrDebuffFactor(mapdata.attribute, mapdata.songUnit, mapdata.weights[pos], mapdata.totalWeight) * teamattr);
      this.attrDebuff = attrDebuff;
      return attrDebuff;
   };
   proto.getMicPoint = function () {
      if (!this.card) throw "No card data";
      var skill_level_up_pattern = this.card.skillleveluppattern || 0;
      if (MIC_RATIO[skill_level_up_pattern] === undefined) {
         console.error("Unknown skill level up pattern: " + skill_level_up_pattern);
         return 0;
      }
      return MIC_RATIO[skill_level_up_pattern] * this.skilllevel;
   };
   proto.calcTotalCSkillPercentageForSameColor = function (mapcolor, cskills) {
      var sumPercentage = 0;
      for (var i = 0; i < cskills.length; i++) {
         var cskill = cskills[i];
         if (cskill.Cskillpercentage && cskill.attribute == mapcolor && cskill.Cskillattribute == mapcolor) {
            sumPercentage += parseInt(cskill.Cskillpercentage);
         }
         if (cskill.Csecondskillattribute && cskill.attribute == mapcolor) {
            if (LLConst.isMemberInGroup(this.card.jpname, cskill.Csecondskilllimit)) {
               sumPercentage += parseInt(cskill.Csecondskillattribute);
            }
         }
      }
      return sumPercentage;
   };
   proto.getGrade = function () {
      if (!this.card) throw "No card data";
      if (this.grade !== undefined) return this.grade;
      // N card and some special card has no grade
      this.grade = LLConst.getMemberGrade(this.card.jpname) || 0;
      return this.grade;
   };
   /**
    * @param {number} [levelBoost]
    * @returns {LLH.API.SkillDetailDataType}
    */
   proto.getSkillDetail = function(levelBoost) {
      if (!levelBoost) {
         return this.card.skilldetail[this.skilllevel-1];
      }
      var lv = this.skilllevel + levelBoost;
      if (lv > this.card.skilldetail.length) lv = this.card.skilldetail.length;
      return this.card.skilldetail[lv-1];
   };
   return cls;
})();

/**
 * @typedef NoteTriggerDataType
 * @property {1|2|3|4} type 1 for enter, 2 for hit, 3 for hold, 4 for release
 * @property {number} time float
 * @property {LLH.API.NoteDataType} note
 * @property {number} factor 0.5 for swing, 1 for other
 */
var LLSimulateContext = (function() {
   function getTargetMembers(members, targets, excludeId) {
      var ret = [];
      if ((!targets) || (targets.length == 0)) return ret;
      for (var i = 0; i < members.length; i++) {
         if (excludeId !== undefined && i == excludeId) continue;
         var matched = true;
         for (var j = 0; j < targets.length; j++) {
            if (!LLConst.isMemberInGroup(members[i].card.jpname, targets[j])) {
               matched = false;
               break;
            }
         }
         if (matched) {
            ret.push(i);
         }
      }
      return ret;
   }
   var IDX_TRIGGER_MEMBER_ID = 0;
   var IDX_TRIGGER_START_VALUE = 1;
   var IDX_TRIGGER_IS_ACTIVE = 2;
   var IDX_TRIGGER_REQUIRE_VALUE = 3;
   var IDX_TRIGGER_BASE_POSSIBILITY = 4;
   var IDX_TRIGGER_LIMIT = 5;
   var IDX_ACTIVE_END_TIME = 0;
   var IDX_ACTIVE_MEMBER_ID = 1;
   var IDX_ACTIVE_REAL_MEMMBER_ID = 2;
   var IDX_ACTIVE_EFFECT_VALUE = 3;
   var IDX_ACTIVE_EXTRA_DATA = 4;
   var IDX_LAST_MEMBER_ID = 0;
   var IDX_LAST_LEVEL_BOOST = 1;
   var IDX_LAST_FRAME = 2;
   var IDX_LAST_REPEAT_FRAME = 3;

   var SIM_NOTE_ENTER = 1;
   var SIM_NOTE_HIT = 2;
   var SIM_NOTE_HOLD = 3;
   var SIM_NOTE_RELEASE = 4;

   /**
    * @constructor
    * @param {LLMap} mapdata 
    * @param {*} members 
    * @param {*} maxTime 
    */
   function LLSimulateContext_cls(mapdata, members, maxTime) {
      this.members = members;
      this.totalNote = mapdata.combo;
      this.totalTime = maxTime;
      this.totalPerfect = mapdata.perfect;
      this.mapSkillPossibilityUp = (1 + parseInt(mapdata.skillup || 0)/100);
      this.mapTapScoreUp = (1 + parseInt(mapdata.tapup || 0)/100);
      this.comboFeverPattern = parseInt(mapdata.combo_fever_pattern || 2);
      this.perfectAccuracyPattern = parseInt(mapdata.perfect_accuracy_pattern || 0);
      this.overHealPattern = parseInt(mapdata.over_heal_pattern || 0);
      this.triggerLimitPattern = mapdata.trigger_limit_pattern || 0;
      this.currentTime = 0;
      this.currentFrame = 0;
      this.currentNote = 0;
      this.currentCombo = 0;
      this.currentScore = 0;
      this.currentPerfect = 0;
      this.currentStarPerfect = 0;
      this.currentHeal = 0;
      this.skillsActiveCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.skillsActiveChanceCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.skillsActiveNoEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.skillsActiveHalfEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.currentAccuracyCoverNote = 0;
      this.totalPerfectScoreUp = 0; // capped at SKILL_LIMIT_PERFECT_SCORE_UP
      this.remainingPerfect = mapdata.perfect;
      // trigger_type: [[memberid, start_value, is_active, require, base_possibility, limit], ...]
      // in SKILL_TRIGGER_MEMBERS case, start_value is members_bitset, require is trigger_condition_members_bitset
      // limit 0 means no limit, otherwise limited
      this.triggers = {};
      this.memberToTrigger = [];
      this.memberSkillOrder = [];
      this.syncTargets = []; // syncTargets[memberId] = [memberIds...]
      this.attributeUpForMember = []; // attributeUpForMember[memberId] = diff for attribute up for that member
      this.attributeUpTargetMembers = []; // attributeUpTargetMembers[sourceMemberId] = [<list of target member id>]
      this.attributeSyncForMember = []; // diff for attribute after sync for that member
      this.chainNameBit = []; // chainNameBit[memberId][jpname] = bit
      this.lastFrameForLevelUp = -1;
      this.hasRepeatSkill = false;

      var skillOrder = []; // [ [i, priority], ...]
      var lvupSkillPriority = 1;
      var otherSkillPriority = 2;
      if (Math.random() < 0.5) {
         lvupSkillPriority = 2;
         otherSkillPriority = 1;
      }
      for (var i = 0; i < 9; i++) {
         var curMember = members[i];
         this.memberToTrigger.push(undefined);
         this.chainNameBit.push(undefined);
         if ((!curMember.card.skill) || (curMember.skilleffect == 0)) continue;
         var triggerType = curMember.card.triggertype;
         var effectType = curMember.card.skilleffect;
         /** @type {LLH.API.SkillDetailDataType} */
         var skillDetail = curMember.getSkillDetail();
         var skillRequire = skillDetail.require;
         var targets;
         var neverTrigger = false;
         if (effectType == LLConst.SKILL_EFFECT_REPEAT) {
            this.hasRepeatSkill = true;
         }
         // 属性同步技能可带来的属性变化量
         if (effectType == LLConst.SKILL_EFFECT_SYNC) {
            targets = getTargetMembers(this.members, curMember.card.effecttarget, i);
            // 无同步对象, 不会触发
            if (targets.length == 0) neverTrigger = true;
            this.syncTargets.push(targets);
         } else {
            this.syncTargets.push(undefined);
         }
         // 属性提升技能带来的属性提升量, 以及属性提升技能的目标
         this.attributeUpForMember.push(undefined);
         this.attributeSyncForMember.push(undefined);
         if (effectType == LLConst.SKILL_EFFECT_ATTRIBUTE_UP) {
            targets = getTargetMembers(this.members, curMember.card.effecttarget);
            if (targets.length > 0) {
               this.attributeUpTargetMembers.push(targets);
            } else {
               this.attributeUpTargetMembers.push(undefined);
            }
         } else {
            this.attributeUpTargetMembers.push(undefined);
         }
         // 连锁发动条件
         if (triggerType == LLConst.SKILL_TRIGGER_MEMBERS) {
            // 连锁条件是看要求的人物(例如要求μ's二年级的穗乃果的连锁卡, 要求人物为小鸟和海未)都发动过技能
            // 而不是所有是要求的人物的卡都发动过技能
            // 上面的例子中, 只要有任何一张鸟的卡和一张海的卡发动过技能就能触发果的连锁
            var conditionBitset = 0;
            var possibleBitset = 0;;
            var nameBits = {};
            var names = LLConst.getMemberNamesInGroups(curMember.card.triggertarget);
            for (var j = 0; j < names.length; j++) {
               nameBits[names[j]] = (1 << j);
               if (names[j] != curMember.card.jpname) {
                  conditionBitset |= (1 << j);
               }
            }
            for (var j = 0; j < members.length; j++) {
               // 持有连锁技能的卡牌不计入连锁发动条件
               if (members[j].card.triggertype  == LLConst.SKILL_TRIGGER_MEMBERS) continue;
               if (nameBits[members[j].card.jpname] !== undefined) {
                  possibleBitset |= nameBits[members[j].card.jpname];
               }
            }
            // 无连锁对象, 不会触发
            if ((possibleBitset & conditionBitset) != conditionBitset) {
               neverTrigger = true;
            } else {
               skillRequire = conditionBitset;
            }
            this.chainNameBit[i] = nameBits;
         }
         if (!neverTrigger) {
            var triggerLimit = (this.triggerLimitPattern ? (skillDetail.limit || 0) : 0);
            // [member_id, start_value, is_active, require, possibility, limit]
            var triggerData = [i, 0, 0, skillRequire, skillDetail.possibility, triggerLimit];
            if (this.triggers[triggerType] === undefined) {
               this.triggers[triggerType] = [triggerData];
            } else {
               this.triggers[triggerType].push(triggerData);
            }
            this.memberToTrigger[i] = triggerData;
            var skillPriority; // lower value for higher priority
            if (triggerType == LLConst.SKILL_TRIGGER_MEMBERS) {
               skillPriority = 9;
            } else if (effectType == LLConst.SKILL_EFFECT_LEVEL_UP) {
               skillPriority = lvupSkillPriority;
            } else if (effectType == LLConst.SKILL_EFFECT_REPEAT) {
               skillPriority = 3;
            } else {
               skillPriority = otherSkillPriority;
            }
            skillOrder.push([i, skillPriority]);
         }
      }
      // sort priority asc, for same priority, put right one before left one (index desc)
      skillOrder.sort(function(a,b){
         if (a[1] == b[1]) return b[0]-a[0];
         return a[1]-b[1];
      });
      for (var i = 0; i < skillOrder.length; i++) {
         this.memberSkillOrder.push(skillOrder[i][0]);
      }

      // activeSkills: [[end_time, memberid, realMemberId, effectValue, extraData], ...]
      // realMemberId is repeat target memberid for repeat skill, otherwise equal to memberid
      // for SYNC & ATTRIBUTE_UP effect: effectValue is increased attribute after sync/attribute up
      this.activeSkills = [];
      // [member id, level boost, activate frame, repeat frame]
      this.lastActiveSkill = undefined;
      // effect_type: effect_value
      this.effects = {};
      this.calculateEffects();
   };
   var cls = LLSimulateContext_cls;
   var proto = cls.prototype;
   var EPSILON = 1e-8;
   var SEC_PER_FRAME = 0.016;
   proto.timeToFrame = function (t) {
      return Math.floor((t+EPSILON)/SEC_PER_FRAME);
   };
   proto.updateNextFrameByMinTime = function (minTime) {
      // 一帧(16ms)最多发动一次技能
      var minFrame = this.timeToFrame(minTime);
      if (minFrame <= this.currentFrame) minFrame = this.currentFrame + 1;
      this.currentFrame = minFrame;
      this.currentTime = this.currentFrame * SEC_PER_FRAME;
   };
   proto.calculateEffects = function() {
      var hasAccuracySmall = 0; // 1 for active
      var hasAccuracyNormal = 0; // 1 for active
      var effPossibilityUp = 1.0; // possibility *x, no stack
      var effPerfectScoreUp = 0; // total bonus
      var effComboFever = 0; // score +(x*combo_factor), need cap at SKILL_LIMIT_COMBO_FEVER
      var effAttributeUp = 0; // total attribute +x, including sync and attribute up and accuracy gem
      var needCheckAttribute = false;
      for (var i = 0; i < this.activeSkills.length; i++) {
         // repeat target member id
         var curMember = this.members[this.activeSkills[i][IDX_ACTIVE_REAL_MEMMBER_ID]];
         var curEffect = curMember.card.skilleffect;
         if (curEffect == LLConst.SKILL_EFFECT_ACCURACY_SMALL)
            hasAccuracySmall = 1;
         else if (curEffect == LLConst.SKILL_EFFECT_ACCURACY_NORMAL)
            hasAccuracyNormal = 1;
         else if (curEffect == LLConst.SKILL_EFFECT_POSSIBILITY_UP)
            effPossibilityUp = this.activeSkills[i][IDX_ACTIVE_EFFECT_VALUE];
         else if (curEffect == LLConst.SKILL_EFFECT_PERFECT_SCORE_UP)
            effPerfectScoreUp += this.activeSkills[i][IDX_ACTIVE_EFFECT_VALUE];
         else if (curEffect == LLConst.SKILL_EFFECT_COMBO_FEVER)
            effComboFever += this.activeSkills[i][IDX_ACTIVE_EFFECT_VALUE];
         else if (curEffect == LLConst.SKILL_EFFECT_ATTRIBUTE_UP || curEffect == LLConst.SKILL_EFFECT_SYNC)
            needCheckAttribute = true;
      }
      if (needCheckAttribute) {
         for (var i = 0; i < 9; i++) {
            var curAttributeUp = this.attributeUpForMember[i];
            var curAttributeSync = this.attributeSyncForMember[i];
            if (curAttributeUp !== undefined) effAttributeUp += curAttributeUp;
            if (curAttributeSync !== undefined) effAttributeUp += curAttributeSync;
         }
      }
      var eff = this.effects;
      eff[LLConst.SKILL_EFFECT_ACCURACY_SMALL] = hasAccuracySmall;
      eff[LLConst.SKILL_EFFECT_ACCURACY_NORMAL] = hasAccuracyNormal;
      eff[LLConst.SKILL_EFFECT_POSSIBILITY_UP] = effPossibilityUp;
      eff[LLConst.SKILL_EFFECT_PERFECT_SCORE_UP] = effPerfectScoreUp;
      eff[LLConst.SKILL_EFFECT_COMBO_FEVER] = effComboFever;
      eff[LLConst.SKILL_EFFECT_ATTRIBUTE_UP] = effAttributeUp;
   };
   proto.processDeactiveSkills = function() {
      if (this.activeSkills.length == 0) return;
      var activeIndex = 0;
      var needRecalculate = false;
      for (; activeIndex < this.activeSkills.length; activeIndex++) {
         var curActiveSkill = this.activeSkills[activeIndex];
         if (curActiveSkill[IDX_ACTIVE_END_TIME] <= this.currentTime) {
            var deactivedMemberId = curActiveSkill[IDX_ACTIVE_MEMBER_ID];
            var deactivedSkillEffect = this.members[deactivedMemberId].card.skilleffect;
            this.markTriggerActive(deactivedMemberId, 0);
            this.activeSkills.splice(activeIndex, 1);
            if (deactivedSkillEffect == LLConst.SKILL_EFFECT_ATTRIBUTE_UP) {
               var realMemberId = curActiveSkill[IDX_ACTIVE_REAL_MEMMBER_ID];
               for (var i = 0; i < this.attributeUpTargetMembers[realMemberId].length; i++) {
                  var targetMemberId = this.attributeUpTargetMembers[realMemberId][i];
                  this.attributeUpForMember[targetMemberId] = undefined;
               }
            } else if (deactivedSkillEffect == LLConst.SKILL_EFFECT_SYNC) {
               var syncTarget = curActiveSkill[IDX_ACTIVE_EXTRA_DATA];
               this.attributeSyncForMember[syncTarget] = undefined;
            }
            needRecalculate = true;
            activeIndex--;
         }
      }
      if (needRecalculate) {
         this.calculateEffects();
      }
   };
   proto.getMinDeactiveTime = function() {
      var minNextTime = undefined;
      if (this.activeSkills.length == 0) return minNextTime;
      var activeIndex = 0;
      for (; activeIndex < this.activeSkills.length; activeIndex++) {
         if (minNextTime === undefined || this.activeSkills[activeIndex][IDX_ACTIVE_END_TIME] < minNextTime) {
            minNextTime = this.activeSkills[activeIndex][IDX_ACTIVE_END_TIME];
         }
      }
      return minNextTime;
   };
   proto.markTriggerActive = function(memberId, bActive) {
      var curTriggerData = this.memberToTrigger[memberId];
      if (!curTriggerData) return;
      curTriggerData[IDX_TRIGGER_IS_ACTIVE] = bActive;
      // special case
      if ((!bActive) && this.members[memberId].card.triggertype == LLConst.SKILL_TRIGGER_TIME) {
         curTriggerData[IDX_TRIGGER_START_VALUE] = this.currentTime;
      }
   };
   proto.isSkillNoEffect = function (memberId) {
      var skillEffect = this.members[memberId].card.skilleffect;
      // 在一些情况下技能会无效化
      if (skillEffect == LLConst.SKILL_EFFECT_REPEAT) {
         // 没技能发动时,repeat不能发动
         if (this.lastActiveSkill === undefined) return true;
         // 被非同帧复读过了, 对以后帧就会失效
         var lastRepeatFrame = this.lastActiveSkill[IDX_LAST_REPEAT_FRAME];
         if (lastRepeatFrame >= 0 && lastRepeatFrame < this.currentFrame) {
            this.lastActiveSkill = undefined;
            return true;
         }
      } else if (skillEffect == LLConst.SKILL_EFFECT_POSSIBILITY_UP) {
         // 已经有技能发动率上升的话不能发动的技能发动率上升
         if (this.effects[LLConst.SKILL_EFFECT_POSSIBILITY_UP] > 1+EPSILON) return true;
      } else if (skillEffect == LLConst.SKILL_EFFECT_LEVEL_UP) {
         // 若在同一帧中如果有另一个技能等级提升已经发动了, 则无法发动
         if (this.effects[LLConst.SKILL_EFFECT_LEVEL_UP] && this.lastFrameForLevelUp == this.currentFrame) {
            return true;
         }
      } else if (skillEffect == LLConst.SKILL_EFFECT_ATTRIBUTE_UP) {
         // 若队伍中所有满足条件的卡都已经在属性提升状态, 则无法发动
         for (var i = 0; i < this.attributeUpTargetMembers[memberId].length; i++) {
            var targetMemberId = this.attributeUpTargetMembers[memberId][i];
            if (this.attributeUpForMember[targetMemberId] !== undefined) {
               return true;
            }
         }
      }
      // 不检查属性同步没同步对象的情况, 如果没有合适的同步对象会在一开始就不加入列表
      return false;
   };
   proto.getSkillPossibility = function(memberId) {
      return this.memberToTrigger[memberId][IDX_TRIGGER_BASE_POSSIBILITY] * this.mapSkillPossibilityUp * this.effects[LLConst.SKILL_EFFECT_POSSIBILITY_UP];
   };
   proto.onSkillActive = function(memberId) {
      var levelBoost = this.effects[LLConst.SKILL_EFFECT_LEVEL_UP];
      if (levelBoost) {
         // 连锁技能可以吃到同一帧中发动的技能等级提升的效果, 而其它技能则只能吃到之前帧发动的技能等级提升
         if (this.lastFrameForLevelUp == this.currentFrame && this.members[memberId].card.triggertype != LLConst.SKILL_TRIGGER_MEMBERS) {
            levelBoost = 0;
         } else {
            this.effects[LLConst.SKILL_EFFECT_LEVEL_UP] = 0;
         }
      }
      var skillEffect = this.members[memberId].card.skilleffect;
      var realMemberId = memberId;
      // update chain trigger
      var chainTriggers = this.triggers[LLConst.SKILL_TRIGGER_MEMBERS];
      if (chainTriggers && this.members[memberId].card.triggertype != LLConst.SKILL_TRIGGER_MEMBERS) {
         for (var i = 0; i < chainTriggers.length; i++) {
            var thisNameBit = this.chainNameBit[chainTriggers[i][IDX_TRIGGER_MEMBER_ID]][this.members[memberId].card.jpname];
            if (thisNameBit !== undefined) {
               chainTriggers[i][IDX_TRIGGER_START_VALUE] |= thisNameBit;
            }
         }
      }
      // set last active skill
      if (skillEffect == LLConst.SKILL_EFFECT_REPEAT) {
         if (this.lastActiveSkill !== undefined) {
            realMemberId = this.lastActiveSkill[IDX_LAST_MEMBER_ID];
            levelBoost = this.lastActiveSkill[IDX_LAST_LEVEL_BOOST];
            skillEffect = this.members[realMemberId].card.skilleffect;
            // 国服翻译有问题, 说复读技能发动时前一个发动的技能是复读时无效
            // 但是日服的复读技能介绍并没有提到这一点, 而是复读上一个非复读技能
            // 这导致了日服出现的复读boost卡组能获得超高得分的事件, 而llh依照国服翻译无法模拟这一情况
            // 而且这一卡组的出现意味着复读可以复读等级提升后的技能
            // 现在更改为按日服介绍进行模拟
            //this.lastActiveSkill = undefined;
            // 记录非同帧复读
            if (this.lastActiveSkill[IDX_LAST_FRAME] != this.currentFrame) {
               this.lastActiveSkill[IDX_LAST_REPEAT_FRAME] = this.currentFrame;
            }
            // 半哑火: 被复读的技能哑火了
            if (this.isSkillNoEffect(realMemberId)) {
               return false;
            }
         } else {
            // no effect
            return false;
         }
      } else if (this.hasRepeatSkill) {
         if (this.lastActiveSkill === undefined || this.lastActiveSkill[IDX_LAST_FRAME] != this.currentFrame) {
            // [member id, level boost, activate frame, repeat frame]
            this.lastActiveSkill = [memberId, levelBoost, this.currentFrame, -1];
         }
      }
      // take effect
      // should not be a REPEAT skill
      var skillDetail = this.members[realMemberId].getSkillDetail(levelBoost);
      if (skillEffect == LLConst.SKILL_EFFECT_ACCURACY_SMALL) {
         this.effects[LLConst.SKILL_EFFECT_ACCURACY_SMALL] = 1;
         if (skillDetail.time === undefined) skillDetail.time = skillDetail.score;
         this.activeSkills.push([this.currentTime+skillDetail.time, memberId, realMemberId]);
         this.markTriggerActive(memberId, 1);
      } else if (skillEffect == LLConst.SKILL_EFFECT_ACCURACY_NORMAL) {
         this.effects[LLConst.SKILL_EFFECT_ACCURACY_NORMAL] = 1;
         if (skillDetail.time === undefined) skillDetail.time = skillDetail.score;
         this.activeSkills.push([this.currentTime+skillDetail.time, memberId, realMemberId]);
         this.markTriggerActive(memberId, 1);
      } else if (skillEffect == LLConst.SKILL_EFFECT_HEAL) {
         this.currentHeal += skillDetail.score;
         // 奶转分
         if (this.members[realMemberId].hasSkillGem()) this.currentScore += skillDetail.score * 480;
      } else if (skillEffect == LLConst.SKILL_EFFECT_SCORE) {
         if (this.members[realMemberId].hasSkillGem()) this.currentScore += Math.ceil(skillDetail.score * 2.5);
         else this.currentScore += skillDetail.score;
      } else if (skillEffect == LLConst.SKILL_EFFECT_POSSIBILITY_UP) {
         // 不可叠加
         this.effects[LLConst.SKILL_EFFECT_POSSIBILITY_UP] = skillDetail.score;
         this.activeSkills.push([this.currentTime + skillDetail.time, memberId, realMemberId, skillDetail.score]);
         this.markTriggerActive(memberId, 1);
      } else if (skillEffect == LLConst.SKILL_EFFECT_PERFECT_SCORE_UP) {
         this.effects[LLConst.SKILL_EFFECT_PERFECT_SCORE_UP] += skillDetail.score;
         this.activeSkills.push([this.currentTime + skillDetail.time, memberId, realMemberId, skillDetail.score]);
         this.markTriggerActive(memberId, 1);
      } else if (skillEffect == LLConst.SKILL_EFFECT_COMBO_FEVER) {
         this.effects[LLConst.SKILL_EFFECT_COMBO_FEVER] += skillDetail.score;
         this.activeSkills.push([this.currentTime + skillDetail.time, memberId, realMemberId, skillDetail.score]);
         this.markTriggerActive(memberId, 1);
      } else if (skillEffect == LLConst.SKILL_EFFECT_SYNC) {
         var syncTargets = this.syncTargets[realMemberId];
         var syncTarget = syncTargets[Math.floor(Math.random() * syncTargets.length)];
         var attrDiff = 0;
         if (this.attributeSyncForMember[syncTarget] !== undefined) {
            attrDiff = this.members[syncTarget].attrStrength + this.attributeSyncForMember[syncTarget] - this.members[memberId].attrStrength;
         } else if (this.attributeUpForMember[syncTarget] !== undefined) {
            attrDiff = this.members[syncTarget].attrStrength + this.attributeUpForMember[syncTarget] - this.members[memberId].attrStrength;
         } else {
            attrDiff = this.members[syncTarget].attrStrength - this.members[memberId].attrStrength;
         }
         this.effects[LLConst.SKILL_EFFECT_ATTRIBUTE_UP] += attrDiff;
         this.attributeSyncForMember[memberId] = attrDiff;
         this.activeSkills.push([this.currentTime + skillDetail.time, memberId, realMemberId, attrDiff, syncTarget]);
         this.markTriggerActive(memberId, 1);
      } else if (skillEffect == LLConst.SKILL_EFFECT_LEVEL_UP) {
         this.effects[LLConst.SKILL_EFFECT_LEVEL_UP] = skillDetail.score;
         this.lastFrameForLevelUp = this.currentFrame;
      } else if (skillEffect == LLConst.SKILL_EFFECT_ATTRIBUTE_UP) {
         var attrBuff = 0;
         for (var i = 0; i < this.attributeUpTargetMembers[realMemberId].length; i++) {
            var targetMemberId = this.attributeUpTargetMembers[realMemberId][i];
            if (this.attributeUpForMember[targetMemberId] === undefined) {
               this.attributeUpForMember[targetMemberId] = this.members[targetMemberId].attrStrength * (skillDetail.score-1);
               attrBuff += this.attributeUpForMember[targetMemberId];
            }
         }
         this.effects[LLConst.SKILL_EFFECT_ATTRIBUTE_UP] += attrBuff;
         this.activeSkills.push([this.currentTime + skillDetail.time, memberId, realMemberId, attrBuff]);
         this.markTriggerActive(memberId, 1);
      } else {
         console.warn('Unknown skill effect ' + skillEffect);
         return false;
      }
      return true;
   };
   var makeDeltaTriggerCheck = function(key) {
      return function(context, data) {
         var startValue = data[IDX_TRIGGER_START_VALUE];
         var requireValue = data[IDX_TRIGGER_REQUIRE_VALUE];
         var curValue = context[key];
         if (curValue - startValue >= requireValue) {
            data[IDX_TRIGGER_START_VALUE] = curValue - (curValue - startValue)%requireValue
            return true;
         }
         return false;
      };
   };
   var triggerChecks = (function() {
      var ret = {};
      ret[LLConst.SKILL_TRIGGER_TIME] = makeDeltaTriggerCheck('currentTime');
      ret[LLConst.SKILL_TRIGGER_NOTE] = makeDeltaTriggerCheck('currentNote');
      ret[LLConst.SKILL_TRIGGER_COMBO] = makeDeltaTriggerCheck('currentCombo');
      ret[LLConst.SKILL_TRIGGER_SCORE] = makeDeltaTriggerCheck('currentScore');
      ret[LLConst.SKILL_TRIGGER_PERFECT] = makeDeltaTriggerCheck('currentPerfect');
      ret[LLConst.SKILL_TRIGGER_STAR_PERFECT] = makeDeltaTriggerCheck('currentStarPerfect');
      ret[LLConst.SKILL_TRIGGER_MEMBERS] = function(context, data) {
         var requireBits = data[IDX_TRIGGER_REQUIRE_VALUE];
         var curBits = data[IDX_TRIGGER_START_VALUE];
         if (requireBits && ((curBits & requireBits) == requireBits)) {
            data[IDX_TRIGGER_START_VALUE] = 0;
            return true;
         }
         return false;
      };
      return ret;
   })();
   proto.getNextTriggerChances = function() {
      var ret = [];
      for (var i = 0; i < this.memberSkillOrder.length; i++) {
         var memberId = this.memberSkillOrder[i];
         var curTrigger = this.memberToTrigger[memberId];
         var curTriggerType = this.members[memberId].card.triggertype;
         // active skill
         if (curTrigger[IDX_TRIGGER_IS_ACTIVE]) {
            // 复读到持续性技能的话不会保留机会到持续性技能结束
            if (this.members[memberId].card.skilleffect == LLConst.SKILL_EFFECT_REPEAT) {
               triggerChecks[curTriggerType](this, curTrigger);
            }
            continue;
         }
         // trigger limit
         if (curTrigger[IDX_TRIGGER_LIMIT] > 0 && this.skillsActiveCount[memberId] >= curTrigger[IDX_TRIGGER_LIMIT]) {
            continue;
         }
         // inactive skill, check trigger chance
         if (triggerChecks[curTriggerType](this, curTrigger)) {
            ret.push(curTrigger[IDX_TRIGGER_MEMBER_ID]);
         }
      }
      return ret;
   };
   proto.getMinTriggerChanceTime = function() {
      // 时间系
      var minNextTime = undefined;
      var curTriggerList = this.triggers[LLConst.SKILL_TRIGGER_TIME];
      if ((!curTriggerList) || curTriggerList.length == 0) return minNextTime;
      for (var i = 0; i < curTriggerList.length; i++) {
         if (minNextTime === undefined || curTriggerList[i][IDX_TRIGGER_START_VALUE] + curTriggerList[i][IDX_TRIGGER_REQUIRE_VALUE] < minNextTime) {
            minNextTime = curTriggerList[i][IDX_TRIGGER_START_VALUE] + curTriggerList[i][IDX_TRIGGER_REQUIRE_VALUE];
         }
      }
      return minNextTime;
   };
   /**
    * @param {NoteTriggerDataType[]} noteTriggerData
    * @param {LLTeam} teamData
    */
   proto.simulate = function (noteTriggerData, teamData) {
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
      while (noteTriggerIndex < noteTriggerData.length || this.currentTime < this.totalTime) {
         // 1, check if any active skill need deactive
         this.processDeactiveSkills();
         // 2. check if any skill can be activated
         var nextActiveChances = this.getNextTriggerChances();
         var quickSkip = !nextActiveChances.length;
         if (nextActiveChances.length) {
            for (var iChance = 0; iChance < nextActiveChances.length; iChance++) {
               var nextActiveChance = nextActiveChances[iChance];
               this.skillsActiveChanceCount[nextActiveChance]++;
               // validate and check possibility
               if (this.isSkillNoEffect(nextActiveChance)) {
                  this.skillsActiveNoEffectCount[nextActiveChance]++;
                  continue;
               }
               var possibility = this.getSkillPossibility(nextActiveChance);
               if (Math.random() < possibility/100) {
                  // activate
                  if (this.onSkillActive(nextActiveChance)) {
                     this.skillsActiveCount[nextActiveChance]++;
                  } else {
                     this.skillsActiveHalfEffectCount[nextActiveChance]++;
                  }
               }
            }
         }
         // 3. move to min next time
         var minNoteTime = (noteTriggerIndex < noteTriggerData.length ? noteTriggerData[noteTriggerIndex].time : undefined);
         var minNextTime = this.currentTime;
         if (quickSkip) {
            minNextTime = this.totalTime;
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
         var handleNote = (minNoteTime !== undefined && minNoteTime <= this.currentTime);
         // process at most one note per frame
         // need update time before process note so that the time-related skills uses correct current time
         if (handleNote) {
            var curNote = noteTriggerData[noteTriggerIndex];
            if (curNote.type == SIM_NOTE_ENTER) {
               this.currentNote++;
            } else if (curNote.type == SIM_NOTE_HIT || curNote.type == SIM_NOTE_RELEASE) {
               var isPerfect = (Math.random() * (this.totalNote - this.currentCombo) < this.remainingPerfect);
               var accuracyBonus = LLConst.NOTE_WEIGHT_PERFECT_FACTOR;
               var isAccuracyState = this.effects[LLConst.SKILL_EFFECT_ACCURACY_SMALL] || this.effects[LLConst.SKILL_EFFECT_ACCURACY_NORMAL];
               var comboFeverScore = 0;
               var perfectScoreUp = 0;
               var healBonus = (this.overHealPattern ? LLConst.getHealBonus(teamData.totalHP, this.currentHeal + teamData.totalHP) : 1);
               this.currentCombo++;
               if (isPerfect) {
                  this.currentPerfect++;
                  this.remainingPerfect--;
                  perfectScoreUp = this.effects[LLConst.SKILL_EFFECT_PERFECT_SCORE_UP];
                  if (isAccuracyState && this.perfectAccuracyPattern) {
                     accuracyBonus = LLConst.NOTE_WEIGHT_ACC_PERFECT_FACTOR;
                  }
               } else {
                  if (isAccuracyState) {
                     this.currentPerfect++;
                     perfectScoreUp = this.effects[LLConst.SKILL_EFFECT_PERFECT_SCORE_UP];
                  } else {
                     accuracyBonus = LLConst.NOTE_WEIGHT_GREAT_FACTOR;
                  }
               }
               if (isAccuracyState) {
                  this.currentAccuracyCoverNote++;
               }
               if (curNote.type == SIM_NOTE_RELEASE) {
                  accuracyBonus *= LLConst.NOTE_WEIGHT_PERFECT_FACTOR;
                  //TODO: 如果被完美判覆盖到长条开头呢?
               }
               if (this.effects[LLConst.SKILL_EFFECT_COMBO_FEVER] > 0) {
                  comboFeverScore = Math.ceil(LLConst.getComboFeverBonus(this.currentCombo, this.comboFeverPattern) * this.effects[LLConst.SKILL_EFFECT_COMBO_FEVER]);
                  if (comboFeverScore > LLConst.SKILL_LIMIT_COMBO_FEVER) {
                     comboFeverScore = LLConst.SKILL_LIMIT_COMBO_FEVER;
                  }
               }
               // seems not really take effect
               //if (perfectScoreUp + this.totalPerfectScoreUp > LLConst.SKILL_LIMIT_PERFECT_SCORE_UP) {
               //   perfectScoreUp = LLConst.SKILL_LIMIT_PERFECT_SCORE_UP - this.totalPerfectScoreUp;
               //}
               var baseAttribute = (isAccuracyState ? teamData.totalAttrWithAccuracy : teamData.totalAttrNoAccuracy) + this.effects[LLConst.SKILL_EFFECT_ATTRIBUTE_UP];
               // note position 数值1~9, 从右往左数
               var baseNoteScore = baseAttribute/100 * curNote.factor * accuracyBonus * healBonus * teamData.memberBonusFactor[9-curNote.note.position] * LLConst.getComboScoreFactor(this.currentCombo) + comboFeverScore + perfectScoreUp;
               // 点击得分加成对PP分也有加成效果
               // 点击得分对CF分有加成, 1000分的CF加成上限是限制在点击得分加成之前
               this.currentScore += Math.ceil(baseNoteScore * this.mapTapScoreUp);
               this.totalPerfectScoreUp += perfectScoreUp;
            }
            noteTriggerIndex++;
         }
      }
   };
   return cls;
})();

var LLTeam = (function() {
   function LLTeam_cls(members) {
      if (members === undefined) throw("Missing members");
      if (members.length != 9) throw("Expect 9 members");
      this.members = members;
   };
   var cls = LLTeam_cls;
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
   var SIM_NOTE_ENTER = 1;
   var SIM_NOTE_HIT = 2;
   var SIM_NOTE_HOLD = 3;
   var SIM_NOTE_RELEASE = 4;
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
   var proto = cls.prototype;
   var getTotalWeight = function (weights) {
      var totalWeight = 0;
      for (var i = 0; i < 9; i++) {
         totalWeight += weights[i];
      }
      return totalWeight;
   };
   proto.calculateAttributeStrength = function (mapdata) {
      var mapcolor = mapdata.attribute;
      //((基本属性+绊)*百分比宝石加成+数值宝石加成)*主唱技能加成
      var teamgem = [];
      var i, j;
      var isNonetTeam = LLConst.Member.isNonetTeam(this.members);
      //数值和单体百分比宝石
      for (i = 0; i < 9; i++) {
         var curMember = this.members[i];
         curMember.calcDisplayAttr(mapcolor);
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
      var cskills = [this.members[4].card];
      if (mapdata.friendCSkill) cskills.push(mapdata.friendCSkill);
      for (i = 0; i < 9; i++) {
         var curMember = this.members[i];
         curMember.calcAttrWithGem(mapcolor, teamgem);
         curMember.calcAttrWithCSkill(mapcolor, cskills);
      }
      //全体宝石的提升统合到携带全体宝石的队员的属性强度上
      var attrStrength = [];
      var finalAttr = {'smile':0, 'pure':0, 'cool':0};
      var bonusAttr = {'smile':0, 'pure':0, 'cool':0};
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
         for (j in finalAttr) {
            finalAttr[j] += curMember.finalAttr[j];
            bonusAttr[j] += curMember.bonusAttr[j];
         }
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
      this.attrStrength = attrStrength;
      this.attrDebuff = attrDebuff;
      this.finalAttr = finalAttr;
      this.bonusAttr = bonusAttr;
      this.totalAttrNoAccuracy = finalAttr[mapcolor];
      this.totalAttrWithAccuracy = totalAttrWithAccuracy;
      // total
      this.totalWeight = mapdata.totalWeight;
      this.totalAttrStrength = totalAttrStrength;
      this.totalHP = totalHP;
      // TODO:判定宝石
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
   proto.calculateSkillStrength = function (mapdata) {
      var comboMulti = LLUnit.comboMulti(mapdata.combo);
      // perfect+accurate: 1.35, perfect: 1.25, great: 1.1, good: 1
      var accuracyMulti = 1.1+0.15*(mapdata.perfect/mapdata.combo);
      var scorePerStrength = 1.21/100*this.totalWeight*comboMulti*accuracyMulti;
      var minScore = Math.round(this.totalAttrStrength * scorePerStrength * (1+mapdata.tapup/100));

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
      this.minScore = minScore;
      this.averageScoreNumber = env.averageScore;
      this.averageScore = (env.averageScore == MAX_SCORE ? MAX_SCORE_TEXT : env.averageScore);
      this.maxScoreNumber = env.maxScore;
      this.maxScore = (env.maxScore == MAX_SCORE ? MAX_SCORE_TEXT : env.maxScore);
      this.averageHeal = env.averageHeal;
      this.maxHeal = env.maxHeal;
      // total
      this.totalSkillStrength = totalSkillStrength;
      this.totalStrength = this.totalAttrStrength + this.totalSkillStrength;
   };
   proto.calculateScoreDistribution = function () {
      if (this.maxScore == MAX_SCORE) {
         console.error('Cannot calculate distribution for infinite max score');
         return '分数太高，无法计算分布';
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
      var scoreRange = this.maxScore - this.minScore + 1;
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
         if (minNextScore > this.maxScore) break;
         var curSkill = scoreTriggerSkills[minIndex];
         var curScore = curSkill.actualScore;
         var curPossibility = curSkill.actualPossibility / 100;
         var minNextScoreIndex = minNextScore - this.minScore;
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
      this.scoreDistributionMinScore = this.minScore;
      this.probabilityForMinScore = this.scoreDistribution[0];
      this.probabilityForMaxScore = this.scoreDistribution[this.scoreDistribution.length - 1];
      return undefined;
   };
   proto.simulateScoreDistribution = function (mapdata, noteData, simCount) {
      if (simCount < 100) {
         console.error('Simulate count must be bigger than 100');
         return undefined;
      }
      var i;
      var speed = parseInt(mapdata.speed || 8);
      var noteTriggerData = [];
      // pre-process note data
      // assume hold note start with perfect
      for (i = 0; i < noteData.length; i++) {
         noteTriggerData.push({
            'type': SIM_NOTE_ENTER,
            'time': LLConst.getNoteAppearTime(noteData[i].timing_sec, speed),
            'note': noteData[i]
         });
         if (LLConst.isHoldNote(noteData[i].effect)) {
            noteTriggerData.push({
               'type': SIM_NOTE_HOLD,
               'time': noteData[i].timing_sec,
               'note': noteData[i]
            });
            noteTriggerData.push({
               'type': SIM_NOTE_RELEASE,
               'time': noteData[i].timing_sec + noteData[i].effect_value,
               'factor': LLConst.isSwingNote(noteData[i].effect) ? 0.5 : 1,
               'note': noteData[i]
            });
         } else {
            noteTriggerData.push({
               'type': SIM_NOTE_HIT,
               'time': noteData[i].timing_sec,
               'factor': LLConst.isSwingNote(noteData[i].effect) ? 0.5 : 1,
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
      var memberBonusFactor = [];
      for (i = 0; i < 9; i++) {
         memberBonusFactor.push(this.members[i].getAttrBuffFactor(mapdata.attribute, mapdata.songUnit));
      }
      this.memberBonusFactor = memberBonusFactor;

      var scores = {};
      var skillsActiveCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      var skillsActiveChanceCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      var skillsActiveNoEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      var skillsActiveHalfEffectCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      var totalHeal = 0;
      var totalAccuracyCoverNote = 0;
      for (i = 0; i < simCount; i++) {
         var env = new LLSimulateContext(mapdata, this.members, maxTime);
         env.simulate(noteTriggerData, this);

         if (scores[env.currentScore] !== undefined) {
            scores[env.currentScore]++;
         } else {
            scores[env.currentScore] = 1;
         }
         totalHeal += env.currentHeal;
         totalAccuracyCoverNote += env.currentAccuracyCoverNote;
         for (var j = 0; j < 9; j++) {
            skillsActiveCount[j] += env.skillsActiveCount[j];
            skillsActiveChanceCount[j] += env.skillsActiveChanceCount[j];
            skillsActiveNoEffectCount[j] += env.skillsActiveNoEffectCount[j];
            skillsActiveHalfEffectCount[j] += env.skillsActiveHalfEffectCount[j];
         }
      }
      for (i = 0; i < 9; i++) {
         skillsActiveCount[i] /= simCount;
         skillsActiveChanceCount[i] /= simCount;
         skillsActiveNoEffectCount[i] /= simCount;
         skillsActiveHalfEffectCount[i] /= simCount;
      }
      var scoreValues = Object.keys(scores).sort(function(a,b){return parseInt(a) - parseInt(b);});
      var minScore = parseInt(scoreValues[0]);
      var scoreDistribution = new Array(scoreValues[scoreValues.length-1]-minScore+1);
      for (i = 0; i < scoreValues.length; i++) {
         scoreDistribution[scoreValues[i]-minScore] = scores[scoreValues[i]]/simCount;
      }
      this.scoreDistributionMinScore = minScore;
      this.scoreDistribution = scoreDistribution;
      this.probabilityForMinScore = this.scoreDistribution[0];
      this.probabilityForMaxScore = this.scoreDistribution[this.scoreDistribution.length - 1];
      this.minScore = minScore;
      this.maxScore = scoreValues[scoreValues.length -1];
      this.averageSkillsActiveCount = skillsActiveCount;
      this.averageSkillsActiveChanceCount = skillsActiveChanceCount;
      this.averageSkillsActiveNoEffectCount = skillsActiveNoEffectCount;
      this.averageSkillsActiveHalfEffectCount = skillsActiveHalfEffectCount;
      this.averageHeal = totalHeal / simCount;
      this.averageAccuracyNCoverage = (totalAccuracyCoverNote / simCount) / noteData.length;
   };
   proto.calculatePercentileNaive = function () {
      if (this.scoreDistribution === undefined || this.scoreDistributionMinScore === undefined) {
         console.error('Cannot calculate percentile without score distribution');
         return undefined;
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
      this.naivePercentile = percentile;
      this.naiveExpection = Math.round(expection);
   };
   proto.calculateMic = function () {
      var micPoint = 0;
      var i;
      for (i = 0; i < 9; i++) {
         micPoint += this.members[i].getMicPoint();
      }
      for (i = 9; i >= 0; i--) {
         if (micPoint >= MIC_BOUNDARIES[i]) {
            this.micNumber = i+1;
            break;
         }
      }
      if (i < 0) this.micNumber = 0;
      this.equivalentURLevel = micPoint/40;
   };
   proto.autoArmGem = function (mapdata, gemStock) {
      var mapcolor = mapdata.attribute;
      // 计算主唱增益率以及异色异团惩罚率
      var cskills = [this.members[4].card];
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
            curMember.gems.push(new LLSisGem(LLConst.GemType.SCORE_250, {'color': curMember.card.attribute}));
         }
      }
      this.calculateAttributeStrength(mapdata);
      this.calculateSkillStrength(mapdata);
      // 统计年级, 组合信息
      var gradeInfo = [];
      var gradeCount = [0, 0, 0];
      var unitInfo = [];
      for (i = 0; i < 9; i++) {
         var curMember = this.members[i];
         var curMemberGrade = curMember.getGrade();
         var curBigGroupId = LLConst.Member.getBigGroupId(curMember.card.jpname);
         gradeInfo.push(curMemberGrade);
         gradeCount[curMemberGrade]++;
         unitInfo.push((curBigGroupId ? curBigGroupId.toFixed() : ''));
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
         var gemOption = {'grade': gradeInfo[i], 'color': mapcolor, 'member': curMember.card.jpname, 'unit': unitInfo[i]};
         for (j = 0; j < gemTypes.length; j++) {
            var curGem = new LLSisGem(j, gemOption);
            if (!curGem.isValid()) continue;
            var curStrengthBuff = 0;
            if (curGem.isSkillGem()) {
               var curSkill = this.avgSkills[i];
               curGem.setAttributeType(curMember.card.attribute);
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
                        for (var k = 0; k < 9; k++) {
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
         var curMaxStrengthBuffComb = maxStrengthBuffForMember[i].comb;
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
            for (j = 0; enoughGem && j < curMaxStrengthBuffComb.length; j++) {
               if (lastState.charAt(curPowerUps[curMaxStrengthBuffComb[j]].stockindex) != '-') enoughGem = 0;
            }
            if (enoughGem) {
               addDPState(curDP, i, lastState, lastDPState.strength + curMaxStrengthBuffStrength, lastState, curMaxStrengthBuffComb);
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
   };
   proto.autoUnit = function (mapdata, gemStock, submembers) {
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
      for (i = 0; i < 8; i++) {
         me.members[weightSort[i]] = allMembers[curTeam[i].index];
         allMembers[curTeam[i].index] = undefined;
      }
      me.autoArmGem(mapdata, gemStock);
      var resultSubMembers = [];
      for (i = 0; i < allMembers.length; i++) {
         if (allMembers[i] !== undefined) {
            resultSubMembers.push(allMembers[i]);
         }
      }
      return resultSubMembers;
   };
   return cls;
})();

/**
 * @typedef LLSaveData
 * @property {any[]} teamMember
 * @property {GemStockType} gemStock
 * @property {boolean} hasGemStock
 * @property {any[]} subMember
 * @property {function(boolean, boolean, boolean): any} serializeV104
 */
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
   var checkSaveDataVersion = function (data) {
      if (data === undefined) return 0;
      if (data.version !== undefined) return parseInt(data.version);
      if (data.length === undefined && Object.keys(data).length == 15) return 11;
      if (data.length == 0) return 0;
      if (!data[0]) return 0;
      var member = data[0];
      if (!(member.cardid && (member.mezame !== undefined) && member.skilllevel)) return 0;
      if (member.maxcost && !member.smile) return 10;
      if (data.length == 9) return 1;
      if (data.length == 10) return 2;
      return 0;
   };
   var getTeamMemberV1V2 = function (data) {
      var ret = [];
      for (var i = 0; i < 9; i++) {
         var member = {};
         var cur = data[i];
         for (var j in cur) {
            member[j] = cur[j];
         }
         if (member.maxcost === undefined) {
            var totalCost = 0;
            convertMemberV103ToV104([member]);
            for (var j = 0; j < member.gemlist.length; j++) {
               totalCost += LLConst.Gem.getNormalGemMeta(LLConst.GemType[member.gemlist[j]]).slot;
            }
            member.maxcost = totalCost;
         }
         ret.push(member);
      }
      return ret;
   };
   var getGemStockV11 = function (data) {
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
                        memberGemPerColor[LLConst.getMemberColor(curMemberName)] = memberGemCount;
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
            var curMember = teamMember[i];
            if (curMember.gemmember && parseInt(curMember.gemmember) == 1) {
               var memberColor = LLConst.getMemberColor(parseInt(LLCardData.getCachedBriefData()[curMember.cardid].typeid));
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
   var convertMemberV103ToV104 = function (members) {
      for (var i = 0; i < members.length; i++) {
         var member = members[i];
         if (member.gemlist !== undefined) continue;
         /** @type {string[]} */
         var gemList = [];
         if (member.gemnum) {
            gemList = gemList.concat(CONVERT_MEMBER_103_TO_104[member.gemnum]);
         }
         if (member.gemsinglepercent) {
            gemList = gemList.concat(CONVERT_MEMBER_103_TO_104[member.gemsinglepercent]);
         }
         if (member.gemallpercent) {
            gemList = gemList.concat(CONVERT_MEMBER_103_TO_104[member.gemallpercent]);
         }
         if (member.gemskill == '1') {
            var isHeal = false;
            if (member.cardid && LLCardData) {
               var cardbrief = (LLCardData.getCachedBriefData() || {})[member.cardid];
               if (cardbrief && cardbrief.skilleffect == LLConst.SKILL_EFFECT_HEAL) {
                  isHeal = true;
               }
            }
            gemList.push(isHeal ? 'HEAL_480' : 'SCORE_250');
         }
         if (member.gemacc == '1') {
            gemList.push('EMUL_33');
         }
         if (member.gemmember && member.gemmember != '0') {
            gemList.push('MEMBER_29');
         }
         if (member.gemnonet == '1') {
            gemList.push('NONET_42');
         }
         member.gemlist = gemList;
      }
   };
   /** @param {LLSaveData} me */
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
                  newN42[LLConst.GROUP_MUSE.toFixed()] = n42['muse'];
               }
               if (n42['aqours'] !== undefined) {
                  newN42[LLConst.GROUP_AQOURS.toFixed()] = n42['aqours'];
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
      if (!meta[current_sub]) return recursiveMakeGemStockDataImpl(meta, next_sub, subtypes, callback);
      var ret = {};
      for (var i = 0; i < types.length; i++) {
         ret[types[i]] = recursiveMakeGemStockDataImpl(meta, next_sub, subtypes.concat(types[i]), callback);
      }
      return ret;
   };
   var recursiveMakeGemStockData = function (meta, callback) {
      return recursiveMakeGemStockDataImpl(meta, 'per_grade', [], callback);
   };
   var fillDefaultGemStock = function (stock, fillnum) {
      if (stock.ALL !== undefined) return;
      var keys = LLConst.Gem.getNormalGemTypeKeys();
      for (var i = 0; i < keys.length; i++) {
         if (stock[keys[i]] === undefined) {
            stock[keys[i]] = recursiveMakeGemStockData(LLConst.Gem.getNormalGemMeta(i), function(){return fillnum;});
         }
      }
   };
   function LLSaveData_cls(data) {
      this.rawData = data;
      this.rawVersion = checkSaveDataVersion(data);
      if (this.rawVersion == 0) {
         if (data !== undefined) {
            console.error("Unknown save data:");
            console.error(data);
         }
         this.teamMember = [];
         this.gemStock = {};
         this.hasGemStock = false;
         this.subMember = [];
      } else if (this.rawVersion == 1 || this.rawVersion == 2) {
         this.teamMember = getTeamMemberV1V2(data);
         this.gemStock = getGemStockV1V2(data);
         this.hasGemStock = true;
         this.subMember = [];
      } else if (this.rawVersion == 10) {
         this.teamMember = [];
         this.gemStock = {};
         this.hasGemStock = false;
         this.subMember = getSubMemberV10(data);
      } else if (this.rawVersion == 11) {
         this.teamMember = [];
         this.gemStock = getGemStockV11(data);
         this.hasGemStock = true;
         this.subMember = [];
      } else if (this.rawVersion >= 101) {
         this.teamMember = data.team;
         this.gemStock = data.gemstock;
         this.hasGemStock = true;
         this.subMember = data.submember;
      }
      if (this.rawVersion <= 102) {
         convertV102ToV103(this);
      }
      if (this.rawVersion <= 103) {
         convertV103ToV104(this);
      }
   };
   var cls = LLSaveData_cls;
   cls.checkSaveDataVersion = checkSaveDataVersion;
   cls.makeFullyExpandedGemStock = function() {
      var ret = {};
      fillDefaultGemStock(ret, 9);
      return ret;
   };
   cls.normalizeMemberGemList = convertMemberV103ToV104;
   var proto = cls.prototype;
   proto.serializeV104 = function(excludeTeam, excludeGemStock, excludeSubMember) {
      return JSON.stringify({
         'version': 104,
         'team': (excludeTeam ? [] : this.teamMember),
         'gemstock': (excludeGemStock ? {} : this.gemStock),
         'submember': (excludeSubMember ? [] : shrinkSubMembers(this.subMember))
      });
   };
   return cls;
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

var LLGemStockComponent = (function () {
   var createElement = LLUnit.createElement;
   var STOCK_SUB_TYPE_START = 0;
   var STOCK_SUB_TYPE_GEM = 1;
   var STOCK_SUB_TYPE_GRADE = 2;
   var STOCK_SUB_TYPE_MEMBER = 3;
   var STOCK_SUB_TYPE_UNIT = 4;
   var STOCK_SUB_TYPE_COLOR = 5;
   /**
    * @param {nummber} curSubType 
    * @param {NormalGemMetaType} gemMeta 
    * @returns {number}
    */
   function getNextSubType(curSubType, gemMeta) {
      if (curSubType == STOCK_SUB_TYPE_START) {
         return STOCK_SUB_TYPE_GEM;
      }
      if (curSubType == STOCK_SUB_TYPE_GEM) {
         curSubType += 1;
         if (gemMeta.per_grade) return curSubType;
      }
      if (curSubType == STOCK_SUB_TYPE_GRADE) {
         curSubType += 1;
         if (gemMeta.per_member) return curSubType;
      }
      if (curSubType == STOCK_SUB_TYPE_MEMBER) {
         curSubType += 1;
         if (gemMeta.per_unit) return curSubType;
      }
      if (curSubType == STOCK_SUB_TYPE_UNIT) {
         curSubType += 1;
         if (gemMeta.per_color) return curSubType;
      }
      return curSubType + 1;
   }
   /**
    * @param {string} curKey 
    * @param {number} curSubType 
    * @returns 
    */
   function getGemKeyText(curKey, curSubType) {
      if (curSubType == STOCK_SUB_TYPE_GEM) {
         var gemType = LLConst.GemType[curKey];
         return LLConst.Gem.getNormalGemNameAndDescription(gemType);
      } else if (curSubType == STOCK_SUB_TYPE_GRADE) {
         return LLConst.Group.getGroupName(parseInt(curKey));
      } else if (curSubType == STOCK_SUB_TYPE_MEMBER) {
         return LLConst.Member.getMemberName(parseInt(curKey), true);
      } else if (curSubType == STOCK_SUB_TYPE_UNIT) {
         return LLConst.Group.getGroupName(parseInt(curKey));
      }
      return curKey;
   }
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
    * @param {number} val 
    * @param {any} controller 
    * @param {HTMLElement} [subGroup] 
    * @returns {HTMLElement[]}
    */
   function createListGroupItem(text, val, controller, subGroup) {
      var item;
      var textSpan = createElement('span', {'className': 'gem-text', 'innerHTML': text});

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

         controller.fold = function() { toggleSubGroup(arrowSpan, subGroupComp, 0); };
         controller.unfold = function() { toggleSubGroup(arrowSpan, subGroupComp, 1); };
         item = createElement('div', {'className': 'list-group-item'}, [arrowSpan, textSpan, gemCountInput], {'click': function () {
            toggleSubGroup(arrowSpan, subGroupComp); 
         }});
         return [item, subGroupDiv];
      } else {
         item = createElement('div', {'className': 'list-group-item leaf-gem'}, [textSpan, gemCountInput]);
         return [item];
      }
   }
   function makeControllerOnChangeFunc(text) {
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
   function makeControllerPushChangeFunc(controllers) {
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
         this.set(n);
         this.min = n;
         this.max = n;
      }
   }
   function makeControllerDeserializeFunc(controllers) {
      return function(data) {
         if (typeof(data) == 'number' || typeof(data) == 'string') {
            this.onchange(data);
         } else if (data.ALL !== undefined) {
            this.onchange(data.ALL);
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
   function makeControllerSerializeFunc(controllers) {
      return function() {
         if (controllers) {
            if (this.min == this.max) {
               return {'ALL': parseInt(this.get())};
            }
            var ret = {};
            for (var i in controllers) {
               if (i == 'ALL') continue;
               ret[i] = controllers[i].ALL.serialize();
            }
            return ret;
         } else {
            return parseInt(this.get());
         }
      }
   }
   /**
    * @param {string} curKey 
    * @param {any} data 
    * @param {number} curSubType STOCK_SUB_TYPE_*
    * @param {NormalGemMetaType} [gemMeta]
    * @returns {{items: HTMLElement[], controller: any}}
    */
   function buildStockGUI(curKey, data, curSubType, gemMeta) {
      if (typeof(data) == 'number' || typeof(data) == 'string') {
         var val = parseInt(data);
         if (val > 9) val = 9;
         if (val < 0) val = 0;
         var controller = {
            'onchange': makeControllerOnChangeFunc(curKey),
            'pushchange': makeControllerPushChangeFunc(),
            'deserialize': makeControllerDeserializeFunc(),
            'serialize': makeControllerSerializeFunc(),
            'min': val,
            'max': val
         };
         return {
            'items': createListGroupItem(getGemKeyText(curKey, curSubType), val, controller),
            'controller': {'ALL': controller}
         };
      } else {
         var items = [];
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
         var controller = {
            'onchange': makeControllerOnChangeFunc(curKey),
            'pushchange': makeControllerPushChangeFunc(controllers),
            'deserialize': makeControllerDeserializeFunc(controllers),
            'serialize': makeControllerSerializeFunc(controllers),
            'min': minVal,
            'max': maxVal
         };
         var subGroup = createListGroup(items);
         var retItems = createListGroupItem(getGemKeyText(curKey, curSubType), (minVal == maxVal ? minVal : minVal + '+'), controller, subGroup);
         if (minVal == maxVal && controller.fold) controller.fold();
         controllers['ALL'] = controller;
         return {
            'items': retItems,
            'controller': controllers
         };
      }
   };
   // controllers:
   // {
   //    'ALL': controller, //for current node and control all its sub nodes
   //    '<subtype>': controllers,
   //    '<subtype>': controllers, ...
   // }
   // controller:
   // {
   //    'onchange': function (v), // v: new value; called when deserialize or input by user
   //    'pushchange': function (n), // set self node value and all its sub node value to n
   //    'raisechange': function (key, minv, maxv), // key: self node's subtype name; minv/maxv: min/max value in current sub-tree; recalculate the value to display and raise
   //    'deserialize': function (data),
   //    'serialize': function (),
   //    'get': function (), // get node value
   //    'set': function (v), // set node value
   //    'fold': function (), // fold the current sub-tree
   //    'unfold': function (), // unfold the current sub-tree
   //    'min': min,
   //    'max': max,
   // }
   //
   // component controller:
   // {
   //    'loadData': function (data),
   //    'saveData': function (),
   //    :LLSaveLoadJsonMixin
   // }
   function LLGemStockComponent_cls(id) {
      var data = LLSaveData.makeFullyExpandedGemStock();
      var gui = buildStockGUI('技能宝石仓库', data, STOCK_SUB_TYPE_START);
      LLUnit.getElement(id).appendChild(createListGroup(gui.items));
      this.loadData = function(data) { gui.controller.ALL.deserialize(data); };
      this.saveData = function() { return gui.controller.ALL.serialize(); }
   };
   var cls = LLGemStockComponent_cls;
   var proto = cls.prototype;
   LLSaveLoadJsonMixin(proto);
   return cls;
})();

var LLSwapper = (function () {
   function LLSwapper_cls() {
      this.controller = undefined;
      this.data = undefined;
   };
   var cls = LLSwapper_cls;
   var proto = cls.prototype;
   proto.onSwap = function (controller) {
      if (this.controller) {
         var tmp = controller.finishSwapping(this.data);
         this.controller.finishSwapping(tmp);
         this.controller = undefined;
         this.data = undefined;
      } else {
         this.controller = controller;
         this.data = controller.startSwapping();
      }
   };
   return cls;
})();

var LLSubMemberComponent = (function () {
   var createElement = LLUnit.createElement;
   function createSimpleInputContainer(text, input) {
      var label = createElement('label', {'className': 'col-xs-4 control-label', 'innerHTML': text});
      var inputContainer = createElement('div', {'className': 'col-xs-8'}, [input]);
      var group = createElement('div', {'className': 'form-group'}, [label, inputContainer]);
      return group;
   }
   // controller:
   // {
   //    'onDelete': undefined function(),
   //    'onSwap': undefined function(),
   //    'getMember': function() return member,
   //    'setMember': function(m),
   //    'startSwapping': function() return member,
   //    'finishSwapping': function(v) return member,
   // }
   function createMemberContainer(member, controller) {
      var localMember;
      var bSwapping = false;
      var bDeleting = false;
      var image = createElement('img', {'className': 'avatar'});
      var imageComp = new LLImageComponent(image);
      var levelInput = createElement('input', {'className': 'form-control', 'type': 'number', 'min': 1, 'max': 8, 'value': 1});
      levelInput.addEventListener('change', function() {
         localMember.skilllevel = parseInt(levelInput.value);
      });
      var slotInput = createElement('input', {'className': 'form-control', 'type': 'number', 'min': 0, 'max': 8, 'value': 0});
      slotInput.addEventListener('change', function() {
         localMember.maxcost = parseInt(slotInput.value);
      });
      var deleteButton = createElement('button', {'className': 'btn btn-default btn-block', 'type': 'button', 'innerHTML': '删除'});
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
         levelInput.value = m.skilllevel;
         slotInput.value = m.maxcost;
         LLUnit.setAvatarSrcList(imageComp, m.cardid, parseInt(m.mezame));
      };
      controller.startSwapping = function() {
         swapButton.innerHTML = '选择';
         swapButton.className = 'btn btn-primary btn-block';
         deleteButton.disabled = 'disabled';
         levelInput.disabled = 'disabled';
         slotInput.disabled = 'disabled';
         bSwapping = true;
         return this.getMember();
      };
      controller.finishSwapping = function(v) {
         if (bSwapping) {
            swapButton.innerHTML = '换位';
            swapButton.className = 'btn btn-default btn-block';
            deleteButton.disabled = '';
            levelInput.disabled = '';
            slotInput.disabled = '';
            bSwapping = false;
         }
         var ret = this.getMember();
         this.setMember(v);
         return ret;
      };
      controller.setMember(member);
      var imageContainer = createElement('td', {'className': 'text-center'}, [image]);
      var levelInputContainer = createSimpleInputContainer('等级', levelInput);
      var slotInputContainer = createSimpleInputContainer('槽数', slotInput);
      var inputsContainer = createElement('td', {'className': 'form-horizontal'}, [levelInputContainer, slotInputContainer]);
      var buttonContainer = createElement('td', {}, [deleteButton, swapButton]);
      var tr = createElement('tr', {}, [imageContainer, inputsContainer, buttonContainer]);
      var table = createElement('table', {}, [tr]);
      var panel = createElement('div', {'className': 'col-xs-12 col-sm-6 col-md-4 col-lg-3 panel panel-default submember-container'}, [table]);
      return panel;
   }

   // LLSubMemberComponent
   // {
   //    'add': function (member),
   //    'remove': function (start, n),
   //    'count': function (),
   //    'empty': function (),
   //    'setSwapper': function (swapper),
   //    'setOnCountChange': function (callback(count)),
   //    'loadData': function (data),
   //    'saveData': function (),
   //    :LLSaveLoadJsonMixin
   // }
   function LLSubMemberComponent_cls(id) {
      var element = LLUnit.getElement(id);
      var controllers = [];
      var swapper;
      var me = this;
      var callCountChange = function () {
         if (me.onCountChange) me.onCountChange(me.count());
      };
      var commonHandleDelete = function () {
         for (var i = 0; i < controllers.length; i++) {
            if (controllers[i] === this) {
               controllers.splice(i, 1);
               break;
            }
         }
         this.removeElement();
         callCountChange();
      };
      var commonHandleSwap = function () {
         if (swapper && swapper.onSwap) {
            swapper.onSwap(this);
         }
      };
      this.add = function (member, skipCountChange) {
         var controller = {};
         var container = createMemberContainer(member, controller);
         element.appendChild(container);
         controllers.push(controller);
         controller.onDelete = commonHandleDelete;
         controller.onSwap = commonHandleSwap;
         controller.removeElement = function() { element.removeChild(container); };
         if (!skipCountChange) callCountChange();
      };
      this.remove = function (start, n) {
         if (!n) return;
         start = start || 0;
         var end = start + n;
         if (end > controllers.length) end = controllers.length;
         if (end <= start) return;
         for (var i = start; i < end; i++) {
            controllers[i].removeElement();
         }
         controllers.splice(start, end-start);
         callCountChange();
      };
      this.count = function () { return controllers.length; };
      this.empty = function () { return controllers.length <= 0; };
      this.setSwapper = function (sw) {
         swapper = sw;
      };
      this.loadData = function (data) {
         var i = 0;
         for (; i < data.length && i < controllers.length; i++) {
            controllers[i].setMember(data[i]);
         }
         if (i < data.length) {
            for (; i < data.length; i++) {
               this.add(data[i], true);
            }
            callCountChange();
         }
         if (i < controllers.length) {
            this.remove(i, controllers.length - i);
         }
      };
      this.saveData = function () {
         var ret = [];
         for (var i = 0; i < controllers.length; i++) {
            ret.push(controllers[i].getMember());
         }
         return ret;
      };
   };
   var cls = LLSubMemberComponent_cls;
   var proto = cls.prototype;
   LLSaveLoadJsonMixin(proto);
   proto.setOnCountChange = function (callback) {
      this.onCountChange = callback;
   };
   return cls;
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
      var detailContainerComponent = 0;
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
   var cls = LLMicDisplayComponent_cls;
   return cls;
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
         json = JSON.parse(localStorage.getItem(localStorageKey));
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
   var cls = LLSaveStorageComponent_cls;
   return cls;
})();

var LLDataVersionSelectorComponent = (function () {
   var createElement = LLUnit.createElement;
   var versionSelectOptions = [
      {'value': 'latest', 'text': '日服最新'},
      {'value': 'cn', 'text': '20181021'},
      {'value': 'mix', 'text': '混合（1763号卡开始为日服数据）'}
   ];
   function createVersionSelector(controller) {
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
   var cls = LLDataVersionSelectorComponent_cls;
   return cls;
})();

/**
 * @typedef LLScoreDistributionParameter_SaveDataType
 * @property {'no'|'v1'|'sim'} type
 * @property {number} count int, simulate count
 * @property {number} perfect_percent float 0~100
 * @property {number} speed int 1~10
 * @property {1|2} combo_fever_pattern 1 for 300 combo, 2 for 220 combo
 * @property {0|1} over_heal_pattern 0 for disabled, 1 for enabled
 * @property {0|1} perfect_accuracy_pattern 0 for disabled, 1 for enabled
 * @property {0|1} trigger_limit_pattern 0 for disabled, 1 for enabled
 */
var LLScoreDistributionParameter = (function () {
   var createElement = LLUnit.createElement;
   var createFormInlineGroup = LLUnit.createFormInlineGroup;

   var distTypeSelectOptions = [
      {'value': 'no', 'text': '不计算分布'},
      {'value': 'v1', 'text': '计算理论分布'},
      {'value': 'sim', 'text': '计算模拟分布'}
   ];
   var speedSelectOptions = [
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
   var comboFeverPatternSelectOptions = [
      {'value': '1', 'text': '技能加强前（300 combo达到最大加成）'},
      {'value': '2', 'text': '技能加强后（220 combo达到最大加成）'}
   ];
   var enableDisableSelectOptions = [
      {'value': '0', 'text': '关闭'},
      {'value': '1', 'text': '启用'}
   ];
   var distTypeDetail = [
      ['#要素', '#计算理论分布/计算技能强度', '#计算模拟分布'],
      ['触发条件: 时间, 图标, 连击, perfect, star perfect, 分数', '支持', '支持'],
      ['触发条件: 连锁', '不支持', '支持'],
      ['技能效果: 回血, 加分', '支持', '支持'],
      ['技能效果: 小判定, 大判定, 提升技能发动率, repeat, <br/>perfect分数提升, combo fever, 技能等级提升<br/>属性同步, 属性提升', '不支持', '支持'],
      ['宝石: 诡计', '不支持', '支持'],
      ['溢出奶, 完美判', '不支持', '支持'],
      ['爆分发动次数限制', '不支持', '支持']
   ];

   /** @returns {LLSelectComponent} */
   function createEnableDisableComponent() {
      var ret = new LLSelectComponent(createElement('select', {'className': 'form-control'}));
      ret.setOptions(enableDisableSelectOptions);
      ret.set('0');
      return ret;
   }

   /**
    * @typedef LLScoreDistributionParameter_Controller
    * @property {function(): LLScoreDistributionParameter_SaveDataType} getParameters
    * @property {function(LLScoreDistributionParameter_SaveDataType): void} setParameters
    */
   /**
    * @param {LLScoreDistributionParameter_Controller} controller 
    * @returns {HTMLElement}
    */
   function createDistributionTypeSelector(controller) {
      var detailContainer = createElement('div');
      var detailContainerComponent = 0;
      var detailLink = createElement('a', {'innerHTML': '查看支持计算的技能/宝石', 'href': 'javascript:;'}, undefined, {'click': function () {
         if (!detailContainerComponent) {
            detailContainer.appendChild(LLUnit.createSimpleTable(distTypeDetail));
            detailContainerComponent = new LLComponentBase(detailContainer);
         } else {
            detailContainerComponent.toggleVisible();
         }
      }});
      detailLink.style.cursor = 'help';
      var simParamCount = createElement('input', {'className': 'form-control', 'type': 'number', 'size': 5, 'value': 2000});
      var simParamPerfectPercent = createElement('input', {'className': 'form-control num-size-3', 'type': 'number', 'size': 3, 'value': 90});
      var simParamSpeedComponent = new LLSelectComponent(createElement('select', {'className': 'form-control', 'value': '8'}));
      simParamSpeedComponent.setOptions(speedSelectOptions);
      simParamSpeedComponent.set('8');
      var simParamComboFeverPatternComponent = new LLSelectComponent(createElement('select', {'className': 'form-control'}));
      simParamComboFeverPatternComponent.setOptions(comboFeverPatternSelectOptions);
      simParamComboFeverPatternComponent.set('2');
      var simParamOverHealComponent = createEnableDisableComponent();
      var simParamPerfectAccuracyComponent = createEnableDisableComponent();
      var simParamTriggerLimitComponent = createEnableDisableComponent();
      var simParamContainer = createElement('div', {'className': 'filter-form'}, [
         createFormInlineGroup('模拟次数：', [simParamCount, '（模拟次数越多越接近实际分布，但是也越慢）']),
         createFormInlineGroup('无判perfect率：', [simParamPerfectPercent, '%']),
         createFormInlineGroup('速度：', [simParamSpeedComponent.element, '（图标下落速度，1速最慢，10速最快）']),
         createFormInlineGroup('Combo Fever技能：', simParamComboFeverPatternComponent.element),
         createFormInlineGroup('溢出奶：', simParamOverHealComponent.element),
         createFormInlineGroup('完美判：', simParamPerfectAccuracyComponent.element),
         createFormInlineGroup('爆分发动次数限制：', simParamTriggerLimitComponent.element),
         createElement('span', {'innerHTML': '注意：默认曲目的模拟分布与理论分布不兼容，两者计算结果可能会有较大差异，如有需要请选默认曲目2'})
      ]);
      var simParamContainerComponent = new LLComponentBase(simParamContainer);
      var sel = createElement('select', {'className': 'form-control'});
      var selComp = new LLSelectComponent(sel);
      selComp.setOptions(distTypeSelectOptions);
      selComp.onValueChange = function (v) {
         if (v == 'sim') {
            simParamContainerComponent.show();
         } else {
            simParamContainerComponent.hide();
         }
      };
      selComp.set('no');
      simParamContainerComponent.hide();
      var container = createElement('div', undefined, [
         createFormInlineGroup('选择分数分布计算模式：', [sel, detailLink]),
         detailContainer,
         simParamContainer
      ]);
      controller.getParameters = function () {
         return {
            'type': selComp.get(),
            'count': parseInt(simParamCount.value),
            'perfect_percent': parseFloat(simParamPerfectPercent.value),
            'speed': parseInt(simParamSpeedComponent.get()),
            'combo_fever_pattern': parseInt(simParamComboFeverPatternComponent.get()),
            'over_heal_pattern': parseInt(simParamOverHealComponent.get()),
            'perfect_accuracy_pattern': parseInt(simParamPerfectAccuracyComponent.get()),
            'trigger_limit_pattern': parseInt(simParamTriggerLimitComponent.get())
         }
      };
      controller.setParameters = function (data) {
         if (!data) return;
         if (data.type) selComp.set(data.type);
         if (data.count !== undefined) simParamCount.value = data.count;
         if (data.perfect_percent !== undefined) simParamPerfectPercent.value = data.perfect_percent;
         if (data.speed) simParamSpeedComponent.set(data.speed);
         if (data.combo_fever_pattern) simParamComboFeverPatternComponent.set(data.combo_fever_pattern);
         if (data.over_heal_pattern !== undefined) simParamOverHealComponent.set(data.over_heal_pattern);
         if (data.perfect_accuracy_pattern !== undefined) simParamPerfectAccuracyComponent.set(data.perfect_accuracy_pattern);
         if (data.trigger_limit_pattern !== undefined) simParamTriggerLimitComponent.set(data.trigger_limit_pattern);
      };
      return container;
   }
   // LLScoreDistributionParameter
   // {
   //    saveData: function()
   //    loadData: function(data)
   //    :LLSaveLoadJsonMixin
   // }
   function LLScoreDistributionParameter_cls(id) {
      var element = LLUnit.getElement(id);
      var controller = {};
      element.appendChild(createDistributionTypeSelector(controller));
      this.saveData = controller.getParameters;
      this.loadData = controller.setParameters;
   }
   var cls = LLScoreDistributionParameter_cls;
   var proto = cls.prototype;
   LLSaveLoadJsonMixin(proto);
   return cls;
})();

var LLScoreDistributionChart = (function () {
   var createElement = LLUnit.createElement;
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
   function makeSeries(series, name) {
      var ret = {
         'type': 'line',
         //'showCheckbox': true,
         'name': name
      }
      if (series.length == 99) {
         ret['data'] = series;
      } else if (series.length == 101) {
         ret['data'] = series.slice(1, 100).reverse();
      } else {
         console.error('Unknown series');
         concole.log(series);
         ret['data'] = series;
      }
      return ret;
   };
   // LLScoreDistributionChart
   // {
   //    chart: Highcharts chart
   //    addSeries: function(data)
   //    clearSeries: function()
   //    show: function()
   //    hide: function()
   // }
   // options
   // {
   //    series: [series_data, ...]
   //    width
   //    height
   // }
   function LLScoreDistributionChart_cls(id, options) {
      var element = LLUnit.getElement(id);
      if (!Highcharts) {
         console.error('Not included Highcharts');
      }
      var me = this;
      var baseComponent = new LLComponentBase(element);
      baseComponent.show(); // need show before create chart, otherwise the canvas size is wrong...
      var canvasDiv = createElement('div');
      var clearButton = createElement('button', {'className': 'btn btn-danger', 'type': 'button', 'innerHTML': '清空曲线'}, undefined, {
         'click': function() {
            me.clearSeries && me.clearSeries();
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
               seriesOptions.push(makeSeries(options.series[nameId-1], String(nameId)));
            }
         }
         if (options.width) canvasDiv.style.width = options.width;
         if (options.height) canvasDiv.style.height = options.height;
      }
      chartOptions['series'] = seriesOptions;
      this.chart = Highcharts.chart(canvasDiv, chartOptions);
      this.addSeries = function(data) {
         this.show();
         this.chart.addSeries(makeSeries(data, String(nameId)));
         nameId++;
      };
      this.clearSeries = function() {
         if ((!this.chart.series) || (this.chart.series.length == 0)) return;
         while (this.chart.series.length > 0) {
            this.chart.series[0].remove(false);
         }
         this.chart.redraw();
         this.hide();
      };
      this.show = function() { baseComponent.show(); }
      this.hide = function() { baseComponent.hide(); }
   }
   var cls = LLScoreDistributionChart_cls;
   return cls;
})();

var LLTeamComponent = (function () {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;

   // controller
   // {
   //    get: function()
   //    set: function(value)
   // }
   function makeInputCreator(options, converter) {
      return function(controller) {
         var inputElement = createElement('input', options);
         var inputComponent = new LLValuedComponent(inputElement);
         controller.get = function() {
            if (converter) {
               return converter(inputComponent.get());
            } else {
               return inputComponent.get();
            }
         };
         controller.set = function(v) { inputComponent.set(v); };
         return [inputElement];
      };
   }
   // controller
   // {
   //    get: function()
   //    set: function(value)
   // }
   function skillLevelCreator(controller) {
      var inputElement = createElement('input', {'type': 'number', 'step': '1', 'size': 1, 'value': '1', 'autocomplete': 'off', 'className': 'form-control num-size-1'});
      var inputComponent = new LLValuedComponent(inputElement);
      controller.get = function() {
         return parseInt(inputComponent.get());
      };
      controller.set = function(v) { inputComponent.set(v); };
      return ['Lv', inputElement];
   }
   // controller
   // {
   //    getMaxSlot: function()
   //    setMaxSlot: function(value)
   //    getUsedSlot: function()
   //    setUsedSlot: function(value)
   // }
   function slotCreator(controller) {
      var inputElement = createElement('input', {'type': 'number', 'step': '1', 'size': 1, 'value': '0', 'autocomplete': 'off', 'className': 'form-control num-size-1'});
      var inputComponent = new LLValuedComponent(inputElement);
      var textElement = createElement('span', {'innerHTML': '0'});
      var curUsedSlot = 0;
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
      controller.getMaxSlot = function() { return parseInt(inputComponent.get()); };
      controller.setMaxSlot = function(v) { inputComponent.set(v); };
      controller.getUsedSlot = function() { return curUsedSlot; };
      controller.setUsedSlot = function(v) {
         if (curUsedSlot != v) {
            curUsedSlot = v;
            textElement.innerHTML = v;
            updateColor();
         }
      };
      return [textElement, '/', inputElement];
   }

   function makeButtonCreator(text, clickFunc) {
      return function(controller, i) {
         return [createElement('button', {'type': 'button', 'className': 'btn btn-default', 'innerHTML': text+(i+1)}, undefined, {'click': function(){clickFunc(i);}})];
      };
   }
   // parentController
   // {
   //   getMember: callback function(i)
   //   setMember: callback function(i, value)
   //   getSwapper: callback function()
   // }
   function makeSwapCreator(parentController) {
      // controller
      // {
      //   startSwapping: function()
      //   finishSwapping: function(value)
      // }
      return function(controller, i) {
         var bSwapping = false;
         var buttonElement = createElement('button', {'type': 'button', 'className': 'btn btn-default', 'innerHTML': '换位'+(i+1)}, undefined, {'click': function() {
            var swapper = parentController.getSwapper();
            if (swapper) swapper.onSwap(controller);
            if (i == 4 && parentController.onCenterChanged) parentController.onCenterChanged();
         }});
         controller.startSwapping = function() {
            buttonElement.innerHTML = '选择';
            buttonElement.className = 'btn btn-primary btn-block';
            bSwapping = true;
            return parentController.getMember(i);
         };
         controller.finishSwapping = function(v) {
            if (bSwapping) {
               buttonElement.innerHTML = '换位' + (i+1);
               buttonElement.className = 'btn btn-default btn-block';
               bSwapping = false;
            }
            var ret = parentController.getMember(i);
            parentController.setMember(i, v);
            return ret;
         };
         return  [buttonElement];
      };
   }
   // controller
   // {
   //    update: function(cardid, mezame)
   //    getCardId: function()
   //    getMezame: function()
   // }
   function avatarCreator(controller) {
      var imgElement = createElement('img', {'className': 'avatar'});
      var imgComp = new LLImageComponent(imgElement, {'srcList': ['/static/null.png']});
      var curCardid = undefined;
      var curMezame = undefined;
      controller.update = function(cardid, mezame) {
         cardid = parseInt(cardid || 0);
         mezame = parseInt(mezame || 0);
         if (cardid != curCardid || mezame != curMezame) {
            curCardid = cardid;
            curMezame = mezame;
            LLUnit.setAvatarSrcList(imgComp, cardid, mezame);
         }
      };
      controller.getCardId = function() { return curCardid; };
      controller.getMezame = function() { return curMezame; };
      return [imgElement];
   }
   // controller
   // {
   //    set: function(value)
   //    get: function()
   //    reset: function()
   // }
   function textCreator(controller) {
      var textElement = createElement('span');
      var curValue = '';
      controller.set = function(v) {
         if (curValue !== v) {
            curValue = v;
            textElement.innerHTML = v;
         }
      };
      controller.get = function() { return curValue; };
      controller.reset = function() { controller.set(''); };
      return [textElement];
   }
   // controller
   // {
   //    setColor: function(color)
   //    :textCreator
   // }
   function textWithColorCreator(controller) {
      var ret = textCreator(controller);
      controller.setColor = function(c) { ret[0].style.color = c; };
      return ret;
   }

   // controller
   // {
   //    setTooltip: function(value)
   //    :textCreator
   // }
   function textWithTooltipCreator(controller) {
      var ret = textCreator(controller);
      var tooltipContent = createElement('span', {'className': 'tooltiptext'});
      var tooltipElement = createElement('span', {'className': 'lltooltip llsup'}, ['(*)', tooltipContent]);
      var tooltipComponent = new LLComponentBase(tooltipElement);
      tooltipComponent.hide();
      ret.push(tooltipElement);
      controller.setTooltip = function(v) {
         if (v === undefined) {
            tooltipComponent.hide();
         } else {
            tooltipContent.innerHTML = v;
            tooltipComponent.show();
         }
      };
      return ret;
   }

   /**
    * @typedef LLTeam_NormalGemListItemController
    * @property {(attribute?: AttributeType) => void} resetAttribute (out)
    * @property {(metaId: number) => void} resetMetaId (out)
    * @property {() => number} getMetaId (out)
    * @property {() => void} [onDelete] (in)
    */
   /**
    * @param {LLTeam_NormalGemListItemController} controller 
    * @param {number} metaId
    * @param {AttributeType} [attribute]
    * @param {boolean} [popLeft]
    * @returns {HTMLElement} 
    */
   function renderNormalGemListItem(controller, metaId, attribute, popLeft) {
      var myMetaId = metaId;
      var myAttr = attribute;
      var callbackOnDelete = function () {
         controller.onDelete && controller.onDelete();
      };
      var btnName = createElement('button', {'type': 'button', 'className': 'btn btn-default'}, undefined, {'click': callbackOnDelete});
      var dots = [];
      for (var i = 0; i < 8; i++) {
         dots.push(createElement('div', {'style': {'display': 'none'}}));
      }
      var btnDots = createElement('span', {'className': 'gem-dot'}, dots);
      var btnTooltip = createElement('span', {'className': 'tooltiptext' + (popLeft ? ' pop-left' : '')});
      var btnContainer = createElement('div', {'className': 'lltooltip'}, [btnName, btnTooltip]);
      var updateMeta = function () {
         var meta = LLConst.Gem.getNormalGemMeta(myMetaId);
         var slot = meta.slot;
         for (var i = 0; i < 8; i++) {
            dots[i].style.display = (i < slot ? '' : 'none');
         }
         btnTooltip.innerHTML = LLConst.Gem.getNormalGemNameAndDescription(meta) + '<br/>点击移除该宝石';
         updateSubElements(btnName, [LLConst.Gem.getNormalGemName(meta), btnDots], true);
      };
      var updateColor = function () {
         for (var i = 0; i < 8; i++) {
            dots[i].style['background-color'] = LLConst.getAttributeColor(myAttr);
         }
      };
      controller.resetMetaId = function (id) {
         myMetaId = id;
         updateMeta();
      };
      controller.resetAttribute = function (attr) {
         myAttr = attr;
         updateColor();
      };
      controller.getMetaId = function () {
         return myMetaId;
      };
      updateMeta();
      updateColor();
      return btnContainer;
   }

   /**
    * @typedef LLTeam_NormalGemListController
    * @property {() => string[]} get (out) normal gem meta key list
    * @property {(normalGemMetaKeyList: string[]) => void} set (out)
    * @property {(memberAttribute?: AttributeType, mapAttribute?: AttributeType) => void} setAttributes (out)
    * @property {(normalGemMetaKey: string) => void} add (out)
    * @property {(index: number, slots: number) => void} [onListChange] (in)
    */
   /**
    * @param {LLTeam_NormalGemListController} controller 
    * @param {number} index
    * @returns {HTMLElement[]}
    */
   function normalGemListCreator(controller, index) {
      /** @type {AttributeType} */
      var memberAttribute = undefined;
      /** @type {AttributeType} */
      var mapAttribute = undefined;
      var listContainer = createElement('div', {'className': 'gem-list'});
      /** @type {HTMLElement[]} */
      var listItems = [];
      /** @type {LLTeam_NormalGemListItemController[]} */
      var listItemControllers = [];
      /** @param {number} normalGemMetaId */
      var getAttributeForGem = function (normalGemMetaId) {
         if (LLConst.Gem.isGemFollowMemberAttribute(normalGemMetaId)) {
            // these gems use member attribute
            return memberAttribute;
         } else {
            // other gems use map attribute
            return mapAttribute;
         }
      };
      var updateColor = function () {
         for (var i = 0; i < listItemControllers.length; i++) {
            var curController = listItemControllers[i];
            curController.resetAttribute(getAttributeForGem(curController.getMetaId()));
         }
      };
      var callbackListChange = function () {
         if (controller.onListChange) {
            var totalSlot = 0;
            for (var i = 0; i < listItemControllers.length; i++) {
               var meta = LLConst.Gem.getNormalGemMeta(listItemControllers[i].getMetaId());
               if (meta) {
                  totalSlot += meta.slot;
               }
            }
            controller.onListChange(index, totalSlot);
         }
      };
      /**
       * @param {LLTeam_NormalGemListItemController} [controller] delete by controller ref
       * @param {number} [index] delete by index
       * @param {boolean} doCallback
       */
      var deleteListItem = function (controller, index, doCallback) {
         if (index === undefined) {
            for (var i = 0; i < listItemControllers.length; i++) {
               if (controller === listItemControllers[i]) {
                  index = i;
                  break;
               }
            }
         }
         if (index === undefined) {
            console.error('Not found index to delete');
            console.info(controller);
            return;
         }
         listContainer.removeChild(listItems[index]);
         listItems.splice(index, 1);
         listItemControllers.splice(index, 1);
         if (doCallback) {
            callbackListChange();
         }
      };
      /**
       * @param {number} normalGemMetaId 
       * @param {boolean} doCallback 
       */
      var addListItem = function (normalGemMetaId, doCallback) {
         /** @type {LLTeam_NormalGemListItemController} */
         var itemController = {
            'onDelete': () => deleteListItem(itemController, undefined, true)
         };
         var item = renderNormalGemListItem(itemController, normalGemMetaId, getAttributeForGem(normalGemMetaId), index >= 7);
         listItems.push(item);
         listItemControllers.push(itemController);
         updateSubElements(listContainer, item);
         if (doCallback) {
            callbackListChange();
         }
      };
      controller.get = function () {
         return listItemControllers.map((c) => LLConst.Gem.getNormalGemMeta(c.getMetaId()).key);
      };
      controller.set = function (normalGemMetaKeyList) {
         var i = 0;
         for (; i < normalGemMetaKeyList.length; i++) {
            var curId = LLConst.GemType[normalGemMetaKeyList[i]];
            if (i < listItemControllers.length) {
               var curController = listItemControllers[i];
               if (curController.getMetaId() != curId) {
                  curController.resetMetaId(curId);
                  curController.resetAttribute(getAttributeForGem(curId))
               }
            } else {
               addListItem(curId, false);
            }
         }
         for (; i < listItemControllers.length;) {
            deleteListItem(undefined, i, false);
         }
         callbackListChange();
      };
      controller.setAttributes = function (memberAttr, mapAttr) {
         if (memberAttr !== undefined) {
            memberAttribute = memberAttr;
         }
         if (mapAttr !== undefined) {
            mapAttribute = mapAttr;
         }
         updateColor();
      };
      controller.add = function (normalGemMetaKey) {
         var gemId = LLConst.GemType[normalGemMetaKey];
         if (gemId === undefined) return;
         for (var i = 0; i < listItemControllers.length; i++) {
            if (listItemControllers[i].getMetaId() == gemId) {
               console.info('Cannot add gem ' + normalGemMetaKey + ', it is already added');
               return;
            }
         }
         addListItem(gemId, true);
      };
      return [listContainer];
   }

   /**
    * @template CellController
    * @typedef LLTeam_RowController
    * @property {string} [headColor] (in)
    * @property {string} [cellColor] (in)
    * @property {() => void} [fold] (in)
    * @property {() => void} [unfold] (in)
    * @property {CellController[]} cells (out) index 0-8
    * @property {() => void} show (out)
    * @property {() => void} hide (out)
    * @property {() => void} [toggleFold] (out)
    */
   /**
    * @template CellController
    * @param {string} head 
    * @param {(controller: CellController, index: number) => HTMLElement[]} cellCreator 
    * @param {LLTeam_RowController<CellController>} controller 
    * @param {(controller: CellController, index: number) => void} cellControllerDeco
    * @returns {HTMLElement}
    */
   function createRowFor9(head, cellCreator, controller, cellControllerDeco) {
      var headElement;
      if (controller.fold) {
         var arrowSpan = createElement('span', {'className': 'tri-down'});
         var textSpan = createElement('span', {'innerHTML': head});
         var visible = true;
         var toggleFold = function () {
            if (visible) {
               controller.fold();
               arrowSpan.className = 'tri-right';
               visible = false;
            } else {
               controller.unfold();
               arrowSpan.className = 'tri-down';
               visible = true;
            }
         };
         headElement = createElement('th', {'scope': 'row'}, [arrowSpan, textSpan], {
            'click': toggleFold
         });
         headElement.style.cursor = 'pointer';
         controller.toggleFold = toggleFold;
      } else {
         headElement = createElement('th', {'scope': 'row', 'innerHTML': head});
      }
      if (controller.headColor) {
         headElement.style.color = controller.headColor;
      }
      var cells = [headElement];
      var cellControllers = [];
      for (var i = 0; i < 9; i++) {
         var cellController = {};
         var tdElement = createElement('td', undefined, cellCreator(cellController, i));
         if (controller.cellColor) {
            tdElement.style.color = controller.cellColor;
         }
         if (cellControllerDeco) {
            cellControllerDeco(cellController, i);
         }
         cells.push(tdElement);
         cellControllers.push(cellController);
      }
      var rowElement = createElement('tr', undefined, cells);
      var rowComponent = new LLComponentBase(rowElement);
      controller.cells = cellControllers;
      controller.show = function(){ rowComponent.show(); }
      controller.hide = function(){ rowComponent.hide(); }
      return rowElement;
   }
   // make getXXXs() and setXXXs(val) functions
   function makeGet9Function(method) {
      return function() {
         var ret = [];
         for (var i = 0; i < 9; i++) {
            ret.push(method.call(this, i));
         }
         return ret;
      };
   }
   function makeSet9Function(method) {
      return function(val) {
         if (!val) val = [];
         for (var i = 0; i < 9; i++) {
            method.call(this, i, val[i]);
         }
      };
   }
   function makeHighlightMinFunction(cells) {
      return function(arr) {
         var minVal, i;
         for (i = 0; i < arr.length; i++) {
            if (i == 0 || arr[i] < minVal) minVal = arr[i];
            cells[i].set(arr[i]);
         }
         for (i = 0; i < arr.length; i++) {
            cells[i].setColor((arr[i] == minVal) ? 'red' : '');
         }
      };
   }

   /** @param {LLH.Layout.Team.LLTeamComponent} controller */
   function createTeamTable(controller) {
      var rows = [];
      var controllers = {
         'weight': {},
         'avatar': {},
         'info': {'owning': ['info_name', 'skill_trigger', 'skill_effect']},
         'info_name': {},
         'skill_trigger': {},
         'skill_effect': {},
         'hp': {'memberKey': 'hp', 'memberDefault': 1},
         'smile': {'headColor': 'red', 'cellColor': 'red', 'memberKey': 'smile', 'memberDefault': 0},
         'pure': {'headColor': 'green', 'cellColor': 'green', 'memberKey': 'pure', 'memberDefault': 0},
         'cool': {'headColor': 'blue', 'cellColor': 'blue', 'memberKey': 'cool', 'memberDefault': 0},
         'skill_level': {'memberKey': 'skilllevel'},
         'slot': {'owning': ['put_gem', 'gem_list']},
         'put_gem': {},
         'gem_list': {'memberKey': 'gemlist'},
         'str_attr': {},
         'str_skill_theory': {},
         'str_card_theory': {},
         'str_debuff': {},
         'str_total_theory': {},
         'skill_active_count_sim': {'owning': ['skill_active_chance_sim', 'skill_active_no_effect_sim', 'skill_active_half_effect_sim']},
         'skill_active_chance_sim': {},
         'skill_active_no_effect_sim': {},
         'skill_active_half_effect_sim': {},
         'heal': {},
      };
      var cardsBrief = new Array(9);
      var doFold = function() {
         for (var i = 0; i < this.owning.length; i++) {
            controllers[this.owning[i]].hide();
         }
      };
      var doUnfold = function() {
         for (var i = 0; i < this.owning.length; i++) {
            controllers[this.owning[i]].show();
         }
      };
      var doSetByMember = function(i, member) {
         if (member[this.memberKey] !== undefined) {
            this.cells[i].set(member[this.memberKey]);
         } else if (this.memberDefault !== undefined) {
            this.cells[i].set(this.memberDefault);
         }
      };
      var doSetToMember = function(i, member) {
         member[this.memberKey] = this.cells[i].get();
      };
      var updateSlot = function(i, slots) {
         controllers.slot.cells[i].setUsedSlot(slots);
      };
      for (var i in controllers) {
         if (controllers[i].owning) {
            controllers[i].fold = doFold;
            controllers[i].unfold = doUnfold;
         }
         if (controllers[i].memberKey) {
            controllers[i].setByMember = doSetByMember;
            controllers[i].setToMember = doSetToMember;
         }
      }
      var number3Config = {'type': 'number', 'step': 'any', 'size': 3, 'autocomplete': 'off', 'className': 'form-control num-size-3', 'value': '0'};
      var number1Config = {'type': 'number', 'step': '1', 'size': 1, 'autocomplete': 'off', 'className': 'form-control num-size-1', 'value': '1'};
      rows.push(createRowFor9('权重', makeInputCreator(number3Config, parseFloat), controllers.weight));
      rows.push(createRowFor9('放卡', makeButtonCreator('放卡', function(i) {
         controller.onPutCardClicked && controller.onPutCardClicked(i);
         if (i == 4 && controller.onCenterChanged) controller.onCenterChanged();
      }), {}));
      rows.push(createRowFor9('卡片', avatarCreator, controllers.avatar));
      rows.push(createRowFor9('基本信息', textCreator, controllers.info));
      rows.push(createRowFor9('名字', textCreator, controllers.info_name));
      rows.push(createRowFor9('技能条件', textCreator, controllers.skill_trigger));
      rows.push(createRowFor9('技能类型', textCreator, controllers.skill_effect));
      rows.push(createRowFor9('HP', makeInputCreator(number1Config, parseInt), controllers.hp));
      rows.push(createRowFor9('smile', makeInputCreator(number3Config, parseInt), controllers.smile));
      rows.push(createRowFor9('pure', makeInputCreator(number3Config, parseInt), controllers.pure));
      rows.push(createRowFor9('cool', makeInputCreator(number3Config, parseInt), controllers.cool));
      rows.push(createRowFor9('技能等级', skillLevelCreator, controllers.skill_level));
      rows.push(createRowFor9('使用槽数', slotCreator, controllers.slot));
      rows.push(createRowFor9('放宝石', makeButtonCreator('放宝石', function (i) {
         if (controller.onPutGemClicked) {
            var gemKey = controller.onPutGemClicked(i);
            if (LLConst.GemType[gemKey] !== undefined) {
               controllers.gem_list.cells[i].add(gemKey);
            }
         }
      }), controllers.put_gem));
      rows.push(createRowFor9('圆宝石', normalGemListCreator, controllers.gem_list, (c) => c.onListChange = updateSlot));
      rows.push(createRowFor9('换位', makeSwapCreator(controller), {}));
      rows.push(createRowFor9('属性强度', textCreator, controllers.str_attr));
      rows.push(createRowFor9('技能强度（理论）', textWithTooltipCreator, controllers.str_skill_theory));
      rows.push(createRowFor9('卡强度（理论）', textWithColorCreator, controllers.str_card_theory));
      rows.push(createRowFor9('异色异团惩罚', textCreator, controllers.str_debuff));
      rows.push(createRowFor9('实际强度（理论）', textWithColorCreator, controllers.str_total_theory));
      rows.push(createRowFor9('技能发动次数（模拟）', textCreator, controllers.skill_active_count_sim));
      rows.push(createRowFor9('技能发动条件达成次数（模拟）', textCreator, controllers.skill_active_chance_sim));
      rows.push(createRowFor9('技能哑火次数（模拟）', textCreator, controllers.skill_active_no_effect_sim));
      rows.push(createRowFor9('技能半哑火次数（模拟）', textCreator, controllers.skill_active_half_effect_sim));
      rows.push(createRowFor9('回复', textCreator, controllers.heal));

      controllers.info.toggleFold();
      controllers.skill_active_count_sim.toggleFold();

      controller.putMember = function(i, member) {
         if (!member) member = {};
         for (var k in controllers) {
            if (controllers[k].setByMember) {
               controllers[k].setByMember(i, member);
            }
         }
         controllers.avatar.cells[i].update(member.cardid, member.mezame);
         var cardid = controllers.avatar.cells[i].getCardId();
         var isMezame = controllers.avatar.cells[i].getMezame();
         var cardbrief = undefined;
         if (cardid) {
            cardbrief = ((LLCardData && LLCardData.getCachedBriefData()) || {})[cardid];
         }
         cardsBrief[i] = cardbrief;
         if (cardbrief) {
            controllers.info.cells[i].set(cardbrief.attribute);
            controllers.info_name.cells[i].set(LLConst.Member.getMemberName(cardbrief.typeid, true));
            controllers.skill_trigger.cells[i].set(LLConst.getSkillTriggerText(cardbrief.triggertype));
            controllers.skill_effect.cells[i].set(LLConst.getSkillEffectText(cardbrief.skilleffect));
            if (member.hp === undefined) {
               controllers.hp.cells[i].set(isMezame ? cardbrief.hp+1 : cardbrief.hp);
            }
            controllers.gem_list.cells[i].setAttributes(cardbrief.attribute);
         } else {
            controllers.info.cells[i].reset();
            controllers.info_name.cells[i].reset();
            controllers.skill_trigger.cells[i].reset();
            controllers.skill_effect.cells[i].reset();
            controllers.gem_list.cells[i].setAttributes('');
         }
         if (member.maxcost !== undefined) {
            controllers.slot.cells[i].setMaxSlot(parseInt(member.maxcost));
         } else if (cardbrief && cardbrief.rarity) {
            controllers.slot.cells[i].setMaxSlot(LLConst.getDefaultMinSlot(cardbrief.rarity));
         }
         if (i == 4 && controller.onCenterChanged) controller.onCenterChanged();
      };
      controller.setMember = controller.putMember;
      controller.setMembers = makeSet9Function(controller.setMember);
      controller.getMember = function(i) {
         var retMember = {};
         for (var k in controllers) {
            if (controllers[k].setToMember) {
               controllers[k].setToMember(i, retMember);
            }
         }
         retMember.cardid = controllers.avatar.cells[i].getCardId();
         retMember.mezame = controllers.avatar.cells[i].getMezame();
         retMember.maxcost = controllers.slot.cells[i].getMaxSlot();
         return retMember;
      };
      controller.getMembers = makeGet9Function(controller.getMember);
      controller.setMemberGem = function(i, gems) {
         /** @type {string[]} */
         var gemList = [];
         for (var j = 0; j < gems.length; j++) {
            var curGem = gems[j];
            gemList.push(LLConst.Gem.getNormalGemMeta(curGem.getNormalGemType()).key);
         }
         controllers.gem_list.cells[i].set(gemList);
      };
      controller.getCardId = function(i) { return controllers.avatar.cells[i].getCardId(); };
      controller.getCardIds = makeGet9Function(controller.getCardId);
      controller.getWeight = function(i) { return controllers.weight.cells[i].get(); };
      controller.getWeights = makeGet9Function(controller.getWeight);
      controller.setWeight = function(i, w) { controllers.weight.cells[i].set(w); };
      controller.setWeights = makeSet9Function(controller.setWeight);
      controller.setStrengthAttribute = function(i, str) { controllers.str_attr.cells[i].set(str); };
      controller.setStrengthAttributes = makeSet9Function(controller.setStrengthAttribute);
      controller.setStrengthDebuff = function(i, str) { controllers.str_debuff.cells[i].set(-str); };
      controller.setStrengthDebuffs = makeSet9Function(controller.setStrengthDebuff);
      controller.setStrengthCardTheories = makeHighlightMinFunction(controllers.str_card_theory.cells);
      controller.setStrengthTotalTheories = makeHighlightMinFunction(controllers.str_total_theory.cells);
      controller.setStrengthSkillTheory = function(i, str, strengthSupported) {
         controllers.str_skill_theory.cells[i].set(str);
         controllers.str_skill_theory.cells[i].setTooltip(strengthSupported ? undefined : '该技能暂不支持理论强度计算，仅支持模拟');
      };
      controller.setSkillActiveCountSim = function(i, count) { controllers.skill_active_count_sim.cells[i].set(count === undefined ? '' : LLUnit.numberToString(count, 2)); };
      controller.setSkillActiveCountSims = makeSet9Function(controller.setSkillActiveCountSim);
      controller.setSkillActiveChanceSim = function(i, count) { controllers.skill_active_chance_sim.cells[i].set(count === undefined ? '' : LLUnit.numberToString(count, 2)); };
      controller.setSkillActiveChanceSims = makeSet9Function(controller.setSkillActiveChanceSim);
      controller.setSkillActiveNoEffectSim = function(i, count) { controllers.skill_active_no_effect_sim.cells[i].set(count === undefined ? '' : LLUnit.numberToString(count, 2)); };
      controller.setSkillActiveNoEffectSims = makeSet9Function(controller.setSkillActiveNoEffectSim);
      controller.setSkillActiveHalfEffectSim = function(i, count) { controllers.skill_active_half_effect_sim.cells[i].set(count === undefined ? '' : LLUnit.numberToString(count, 2)); };
      controller.setSkillActiveHalfEffectSims = makeSet9Function(controller.setSkillActiveHalfEffectSim);
      controller.setHeal = function(i, heal) { controllers.heal.cells[i].set(heal); };

      var swapper = new LLSwapper();
      controller.setSwapper = function(sw) { swapper = sw; };
      controller.getSwapper = function() { return swapper; };
      controller.setMapAttribute = function (mapAttr) { controllers.gem_list.cells.forEach(cell => cell.setAttributes(undefined, mapAttr)); };
      controller.isAllMembersPresent = function () {
         var cardIds = controller.getCardIds();
         for (var i = 0; i < cardIds.length; i++) {
            if (!cardIds[i]) return false;
         }
         return true;
      };

      controller.saveData = controller.getMembers;
      controller.loadData = function (members) {
         LLSaveData.normalizeMemberGemList(members);
         controller.setMembers(members);
      };
      return createElement('table', {'className': 'table table-bordered table-hover table-condensed team-table'}, [
         createElement('tbody', undefined, rows)
      ]);
   }

   /**
    * @constructor
    * @param {LLH.Component.HTMLElementOrId} id 
    * @param {LLH.Layout.Team.LLTeamComponent_Options} callbacks 
    * @this {LLH.Layout.Team.LLTeamComponent}
    */
   function LLTeamComponent_cls(id, callbacks) {
      var element = LLUnit.getElement(id);
      element.appendChild(createTeamTable(this));
      this.onPutCardClicked = callbacks && callbacks.onPutCardClicked;
      this.onPutGemClicked = callbacks && callbacks.onPutGemClicked;
      this.onCenterChanged = callbacks && callbacks.onCenterChanged;
   }
   /** @type {typeof LLH.Layout.Team.LLTeamComponent} */
   var cls = LLTeamComponent_cls;
   var proto = cls.prototype;
   LLSaveLoadJsonMixin(proto);

   proto.setResult = function (result) {
      var cardStrengthList = [], totalStrengthList = [];
      for (var i=0;i<9;i++){
         var curCardStrength = result.attrStrength[i]+result.avgSkills[i].strength;
         var curStrength = curCardStrength - result.attrDebuff[i];
         cardStrengthList.push(curCardStrength);
         totalStrengthList.push(curStrength);
         this.setStrengthSkillTheory(i, result.avgSkills[i].strength, LLUnit.isStrengthSupported(result.members[i].card));
         this.setHeal(i, LLUnit.healNumberToString(result.avgSkills[i].averageHeal));
      }

      this.setStrengthCardTheories(cardStrengthList);
      this.setStrengthTotalTheories(totalStrengthList);
      this.setSkillActiveCountSims(result.averageSkillsActiveCount);
      this.setSkillActiveChanceSims(result.averageSkillsActiveChanceCount);
      this.setSkillActiveNoEffectSims(result.averageSkillsActiveNoEffectCount);
      this.setSkillActiveHalfEffectSims(result.averageSkillsActiveHalfEffectCount);
   };
   return cls;
})();

var LLCSkillComponent = (function () {
   var createElement = LLUnit.createElement;
   var defaultCSkill = {
      'attribute': 'smile',
      'Cskillattribute': 'smile',
      'Cskillpercentage': 0,
      'Csecondskilllimit': LLConst.GROUP_UNKNOWN,
      'Csecondskillattribute': 0
   };
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
      var ret = [];
      var groups = LLConst.getCSkillGroups();
      for (var i = 0; i < groups.length; i++) {
         ret.push({'value': groups[i], 'text': LLConst.Group.getGroupName(groups[i])});
      }
      return ret;
   };

   function copyCSkill(cFrom, cTo) {
      cTo.attribute = cFrom.attribute;
      cTo.Cskillattribute = cFrom.Cskillattribute;
      cTo.Cskillpercentage = cFrom.Cskillpercentage;
      cTo.Csecondskilllimit = cFrom.Csecondskilllimit;
      cTo.Csecondskillattribute = cFrom.Csecondskillattribute;
   }
   // controller
   // {
   //    setCSkill: function(cskill)
   //    getCSkill: function()
   //    setMapColor: function(color)
   // }
   function createTextDisplay(controller, title) {
      var textElement = createElement('span', {'innerHTML': title + 'N/A'});
      var cskill = {};
      copyCSkill(defaultCSkill, cskill);
      controller.setCSkill = function(cs) {
         if (cs.attribute) {
            textElement.innerHTML = title + LLUnit.getCardCSkillText(cs, false);
            copyCSkill(cs, cskill);
         } else {
            textElement.innerHTML = title + 'N/A';
            copyCSkill(defaultCSkill, cskill);
         }
      };
      controller.getCSkill = function() {
         return cskill;
      };
      controller.setMapColor = function(color) {}; // do nothing
      return textElement;
   }
   // controller
   // {
   //    setCSkill: function(cskill)
   //    getCSkill: function()
   //    setMapColor: function(color)
   // }
   function createEditable(controller, title) {
      var selectClass = {'className': 'form-control no-padding'};
      var addToColorComp = LLUnit.createColorSelectComponent(undefined, selectClass);
      var addFromColorComp = LLUnit.createColorSelectComponent(undefined, selectClass);
      var majorPercentageComp = new LLSelectComponent(createElement('select', selectClass));
      majorPercentageComp.setOptions(majorPercentageSelectOptions);
      majorPercentageComp.set('0');
      var secondPercentageComp = new LLSelectComponent(createElement('select', selectClass));
      secondPercentageComp.setOptions(secondPercentageSelectOptions);
      secondPercentageComp.set('0');
      var secondLimitComp = new LLSelectComponent(createElement('select', selectClass));
      secondLimitComp.setOptions(getSecondLimitSelectOptions());
      var secondColorElement = createElement('span', {'innerHTML': '歌曲'});
      addToColorComp.onValueChange = function(v) {
         secondColorElement.innerHTML = v;
      };
      controller.setCSkill = function(cs) {
         addToColorComp.set(cs.attribute || 'smile');
         secondColorElement.innerHTML = cs.attribute || 'smile';
         addFromColorComp.set(cs.Cskillattribute || 'smile');
         majorPercentageComp.set(cs.Cskillpercentage || '0');
         if (cs.Csecondskilllimit) {
            secondLimitComp.set(cs.Csecondskilllimit);
         }
         secondPercentageComp.set(cs.Csecondskillattribute || '0');
      };
      controller.getCSkill = function() {
         return {
            'attribute': addToColorComp.get(),
            'Cskillattribute': addFromColorComp.get(),
            'Cskillpercentage': parseInt(majorPercentageComp.get()),
            'Csecondskilllimit': parseInt(secondLimitComp.get()),
            'Csecondskillattribute': parseInt(secondPercentageComp.get())
         };
      };
      controller.setMapColor = function(color) {
         if (addFromColorComp.get() == addToColorComp.get()) {
            addFromColorComp.set(color);
         }
         addToColorComp.set(color);
         secondColorElement.innerHTML = color;
      };
      return createElement('div', {'className': 'form-inline'}, [
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
      ]);
   }
   // LLCSkillComponent
   // {
   //    setCSkill: function(cskill)
   //    getCSkill: function()
   //    setMapColor: function(color)
   // }
   /**
    * @constructor
    * @param {string | HTMLElement} id 
    * @param {{editable?: boolean, title?: string}} [options] editable default false, title default '主唱技能'
    */
   function LLCSkillComponent_cls(id, options) {
      var element = LLUnit.getElement(id);
      var opt = options || {};
      var editable = opt.editable || false;
      var title = opt.title || '主唱技能';
      title = title + '：';
      var innerElement = (editable ? createEditable(this, title) : createTextDisplay(this, title));
      element.appendChild(innerElement);
   }

   return LLCSkillComponent_cls;
})();

var LLUnitResultComponent = (function () {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;

   /**
    * @typedef {Object} LLUnitResultComponent_ResultController
    * @property {function(LLTeam): void} update
    * @property {function(any): void} updateError
    */

   /**
    * @param {LLUnitResultComponent_ResultController} controller
    * @returns {HTMLElement}
    */
   function createAttributeResult(controller) {
      var resultSmile = createElement('td');
      var resultPure = createElement('td');
      var resultCool = createElement('td');

      controller.update = function (team) {
         resultSmile.innerHTML = team.finalAttr.smile + ' (+' + team.bonusAttr.smile + ')';
         resultPure.innerHTML = team.finalAttr.pure + ' (+' + team.bonusAttr.pure + ')';
         resultCool.innerHTML = team.finalAttr.cool + ' (+' + team.bonusAttr.cool + ')';
      };

      controller.updateError = function (e) {
         resultSmile.innerHTML = 'error';
         resultPure.innerHTML = 'error';
         resultCool.innerHTML = 'error';
      };

      return createElement('table', {'border': '1'},
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
      );
   }

   /**
    * 
    * @param {LLUnitResultComponent_ResultController} controller 
    * @param {string} label 
    * @param {function(LLTeam): (string|HTMLElement)} callback Callback to fetch result from team
    * @returns {HTMLElement}
    */
   function createScalarResult(controller, label, callback) {
      var resultElement = createElement('nospan');
      controller.update = function (team) {
         updateSubElements(resultElement, callback(team), true);
      };
      controller.updateError = function (e) {
         updateSubElements(resultElement, 'error: ' + e, true);
      };

      return createElement('div', undefined, [
         label + '：',
         resultElement
      ]);
   }

   /**
    * @param {LLUnitResultComponent_ResultController} controller 
    * @returns {HTMLElement}
    */
   function createMicResult(controller) {
      var resultElement = createElement('div');
      var comp = new LLMicDisplayComponent(resultElement);
      controller.update = function (team) {
         team.calculateMic();
         comp.set(team.micNumber, team.equivalentURLevel);
      };
      controller.updateError = function (e) {
         comp.set(0, 0);
      };

      return resultElement;
   }

   /**
    * @constructor
    * @param {string | HTMLElement} id 
    */
   function LLUnitResultComponent_cls(id) {
      /** @type {LLUnitResultComponent_ResultController[]} */
      var resultsController = [];
      /** @type {HTMLElement[]} */
      var resultsElement = [];
      var container = LLUnit.getElement(id);
      var resultContainer = createElement('div', {'style': {'display': 'none'}});
      var errorContainer = createElement('div', {'style': {'display': 'none', 'color': 'red'}});

      /** @returns {LLUnitResultComponent_ResultController} */
      function addResultController() {
         /** @type {LLUnitResultComponent_ResultController} */
         var controller = {};
         resultsController.push(controller);
         return controller;
      }
      resultsElement.push(createAttributeResult(addResultController()));
      resultsElement.push(createScalarResult(addResultController(), '卡组HP', (team) => team.totalHP.toFixed()));
      resultsElement.push(createScalarResult(addResultController(), '卡组强度', (team) => team.totalStrength + ' (属性 ' + team.totalAttrStrength + ' + 技能 ' + team.totalSkillStrength + ')'));
      resultsElement.push(createMicResult(addResultController()));
      resultsElement.push(createScalarResult(addResultController(), '期望得分', (team) => team.naiveExpection !== undefined ? team.naiveExpection.toFixed() : team.averageScore.toFixed()));
      resultsElement.push(createScalarResult(addResultController(), '期望回复', (team) => LLUnit.healNumberToString(team.averageHeal)));
      resultsElement.push(createScalarResult(addResultController(), '期望判定覆盖率(模拟)', (team) => LLUnit.numberToPercentString(team.averageAccuracyNCoverage)));

      /**
       * @param {function(LLTeam): void} team 
       */
      this.showResult = function (team) {
         for (var i = 0; i < resultsController.length; i++) {
            try {
               resultsController[i].update(team);
            } catch (e) {
               resultsController[i].updateError(e);
               console.error(e);
            }
         }
         resultContainer.style.display = '';
         resultContainer.scrollIntoView();
      };

      /**
       * @param {string} errorMessage
       */
      this.showError = function (errorMessage) {
         updateSubElements(errorContainer, errorMessage, true);
         errorContainer.style.display = '';
         errorContainer.scrollIntoView();
      };

      this.hideError = function () {
         errorContainer.style.display = 'none';
      };

      updateSubElements(resultContainer, resultsElement);
      updateSubElements(container, [errorContainer, resultContainer]);
   }
   
   return LLUnitResultComponent_cls;
})();

/**
 * @typedef LLSongSelectorComponent_SaveDataType
 * 
 */
var LLSongSelectorComponent = (function () {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;
   var createFormInlineGroup = LLUnit.createFormInlineGroup;

   /** @returns {HTMLElement} */
   function createFormSelect() {
      return createElement('select', {'className': 'form-control no-padding'});
   }

   /**
    * @param {number} defaultValue 
    * @returns {HTMLElement}
    */
   function createFormNumber(defaultValue) {
      return createElement('input', {'className': 'form-control small-padding num-size-4', 'type': 'number', 'value': defaultValue});
   }

   /**
    * @constructor
    * @param {string | HTMLElement} id 
    * @param {Object} songData
    */
   function LLSongSelectorComponent_cls(id, songData) {
      var container = LLUnit.getElement(id);
      var me = this;

      var songSearch = createElement('input', {'type': 'text', 'className': 'form-control small-padding'});
      var mapCombo = createFormNumber(300);
      var mapPerfect = createFormNumber(285);
      var mapTime = createFormNumber(100);
      var mapStarPerfect = createFormNumber(47);
      var buffTapUp = createFormNumber(0);
      var buffSkillUp = createFormNumber(0);

      /** @type {LLSongSelector_CompMapping} */
      var compMapping = {
         'diffchoice': createFormSelect(),
         'songchoice': createFormSelect(),
         'songatt': createFormSelect(),
         'songunit': createFormSelect(),
         'songsearch': songSearch,
         'songdiff': createFormSelect(),
         'songac': createFormSelect(),
         'songswing': createFormSelect(),
         'songstardiff': createFormSelect(),
         'map': createFormSelect()
      };

      updateSubElements(container, [
         createFormInlineGroup('搜索', songSearch),
         createFormInlineGroup('筛选', [compMapping.songdiff, compMapping.songatt, compMapping.songunit, compMapping.songswing, compMapping.songac, compMapping.songstardiff]),
         createFormInlineGroup('歌曲', compMapping.songchoice),
         createFormInlineGroup('谱面', compMapping.diffchoice),
         createFormInlineGroup('图属性', compMapping.map),
         createFormInlineGroup('总combo数', mapCombo),
         createFormInlineGroup('perfect数', mapPerfect),
         createFormInlineGroup('时间', [mapTime, '秒（从人物出现到最后一个note被击打的时间，不是歌曲长度。部分谱面无长度数据，默认值为110秒）']),
         createFormInlineGroup('星星perfect数', mapStarPerfect),
         createFormInlineGroup('点击得分增加', [buffTapUp, '%']),
         createFormInlineGroup('技能发动率增加', [buffSkillUp, '%'])
      ], true);

      /** @type {LLCSkillComponent} */
      var comp_friendCSkill = undefined;

      var selector = new LLSongSelector(songData, true, compMapping);
      selector.onSongSettingChange = function (songSettingId) {
         /** @type {LLH.API.SongSettingDataType} */
         var songSetting = undefined;
         if (songSettingId) {
            songSetting = selector.songSettings[songSettingId];
            var combo = parseInt(songSetting.combo || 0)
            mapCombo.value = combo;
            mapPerfect.value = parseInt(combo * 19/20);
            mapTime.value = (parseInt(songSetting.time || 0) || 110);
            mapStarPerfect.value = parseInt(songSetting.star || 0);
         }
         if (me.onSongSettingChange) me.onSongSettingChange(songSettingId, songSetting);
      };
      selector.onSongColorChange = function (attr) {
         if (comp_friendCSkill) comp_friendCSkill.setMapColor(attr);
         if (me.onSongColorChange) me.onSongColorChange(attr);
      };

      /** @param {0 | 1} language */
      this.setLanguage = function (language) {
         selector.setLanguage(language);
      };
      /** @param {LLCSkillComponent} comp */
      this.setFriendCSkillComponent = function (comp) {
         comp_friendCSkill = comp;
      };
      /** @returns {LLH.API.SongDataType} */
      this.getSelectedSong = function () {
         return selector.getSelectedSong();
      };
      /** @returns {LLH.API.SongSettingDataType} */
      this.getSelectedSongSetting = function () {
         return selector.getSelectedSongSetting();
      };
      /** @returns {string} */
      this.getSongAttribute = function () {
         return compMapping.map.value;
      };

      /**
       * @param {string[9] | number[9]} [customWeights] Float
       * @returns {LLMap}
       */
      this.getMap = function (customWeights) {
         /** @type {LLH.API.SongSettingDataType} */
         var songSetting = selector.getSelectedSongSetting();
         var llmap = new LLMap({
            'song': selector.getSelectedSong(),
            'songSetting': songSetting,
            'friendCSkill': (comp_friendCSkill ? comp_friendCSkill.getCSkill() : undefined)
         });
         llmap.attribute = compMapping.map.value;
         llmap.setSongDifficultyData(parseInt(mapCombo.value), parseInt(mapStarPerfect.value), parseInt(mapTime.value), parseInt(mapPerfect.value), parseInt(mapStarPerfect.value));
         llmap.setMapBuff(parseFloat(buffTapUp.value), parseFloat(buffSkillUp.value));
         llmap.setWeights(customWeights || songSetting.positionweight);
         return llmap;
      };

      /** @param {LLSongSelectorComponent_SaveDataType} data */
      this.loadData = function (data) {
         selector.deserialize(data);
      };
      /** @returns {LLSongSelectorComponent_SaveDataType} */
      this.saveData = function () {
         return selector.serialize();
      };
   }

   LLSaveLoadJsonMixin(LLSongSelectorComponent_cls.prototype);
   return LLSongSelectorComponent_cls;
})();

var LLGemSelectorComponent = (function () {
   var createElement = LLUnit.createElement;
   var updateSubElements = LLUnit.updateSubElements;
   var createFormInlineGroup = LLUnit.createFormInlineGroup;

   var SEL_ID_GEM_CHOICE = 'gem_choice';
   var SEL_ID_GEM_TYPE = 'gem_type';
   var GEM_GROUP_NORMAL_CATEGORY = 0;
   var GEM_GROUP_NORMAL = 1;
   var GEM_GROUP_LA = 2;

   /** @returns {HTMLElement} */
   function createFormSelect() {
      return createElement('select', {'className': 'form-control no-padding'});
   }

   /** @param {{set: (data: string | LLH.API.SisDataType) => void}} controller */
   function renderGemDetail(controller) {
      var container = createElement('div');
      controller.set = function (data) {
         if (typeof(data) == 'string') {
            container.innerHTML = '';
         } else {
            var elements = [LLConst.Gem.getGemFullDescription(data)];
            if (data.level_up_skill_data) {
               var nextData = data.level_up_skill_data;
               elements.push(
                  createElement('br'),
                  createElement('b', undefined, '可升级为：'),
                  createElement('br'),
                  createElement('span', {'style': {'color': LLConst.Gem.getGemColor(nextData)}}, LLConst.Gem.getGemDescription(nextData)),
                  createElement('br'),
                  LLConst.Gem.getGemFullDescription(nextData)
               );
            }
            updateSubElements(container, elements, true);
         }
      }
      return container;
   }

   /** @param {LLH.API.SisDataType} data */
   function renderGemSeriesRow(data) {
      return createElement('tr', undefined, [
         createElement('td', {'style': {'color': LLConst.Gem.getGemColor(data)}}, LLConst.Gem.getGemDescription(data)),
         createElement('td', undefined, LLConst.Gem.getGemFullDescription(data))
      ]);
   }

   /** @param {{set: (data: string | LLH.API.SisDataType) => void}} controller */
   function renderGemSeries(controller) {
      /** @type {LLH.API.SisDataType[]} */
      var seriesData = [];
      /** @type {HTMLElement[]} */
      var seriesRows = [];
      var focusedIndex = -1;
      var headerRow = createElement('tr', undefined, [
         createElement('th', {'style': {'width': '50%'}}, '宝石'),
         createElement('th', undefined, '描述')
      ]);
      var tbody = createElement('tbody', undefined, [headerRow]);
      var table = createElement('table', {'className': 'table table-bordered table-hover table-condensed gem-series', 'style': {'display': 'none'}}, tbody);
      controller.set = function (data) {
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
               seriesRows = [renderGemSeriesRow(curData)];
               while (curData.level_up_skill_data) {
                  curData = curData.level_up_skill_data;
                  seriesData.push(curData);
                  seriesRows.push(renderGemSeriesRow(curData));
               }
               for (i = 0; i < seriesData.length; i++) {
                  if (seriesData[i] === data) {
                     seriesRows[i].className = 'focused';
                     focusedIndex = i;
                     break;
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
            }
            table.style.display = '';
         }
      };
      return table;
   }

   /**
    * @constructor
    * @param {string | HTMLElement} id 
    * @param {LLH.Selector.LLGemSelectorComponent_Options} options
    * @this {LLH.Selector.LLGemSelectorComponent}
    */
   function LLGemSelectorComponent_cls(id, options) {
      LLFiltersComponent.call(this);
      var container = LLUnit.getElement(id);
      var me = this;
      if (!options) options = {};
      this.gemData = undefined;
      this.includeNormalGemCategory = options.includeNormalGemCategory || false;
      this.includeNormalGem = options.includeNormalGem || false;
      this.includeLAGem = options.includeLAGem || false;

      var gemChoice = createFormSelect();
      var gemType = createFormSelect();
      this.addFilterable(SEL_ID_GEM_CHOICE, new LLSelectComponent(gemChoice));
      this.addFilterable(SEL_ID_GEM_TYPE, new LLSelectComponent(gemType));
      this.setFilterOptionGroupCallback(SEL_ID_GEM_CHOICE, () => parseInt(me.getComponent(SEL_ID_GEM_TYPE).get()), [SEL_ID_GEM_TYPE]);

      updateSubElements(container, [
         createFormInlineGroup('筛选条件：', gemType),
         createFormInlineGroup('宝石：', gemChoice)
      ], true);

      var detailController = undefined;
      var seriesController = undefined;
      if (options.includeLAGem || options.includeNormalGem) {
         detailController = {};
         seriesController = {};
         updateSubElements(container, [
            createElement('h3', undefined, '详细信息'),
            renderGemDetail(detailController),
            createElement('h3', undefined, '升级序列'),
            renderGemSeries(seriesController)
         ], false);
      }

      /**
       * @param {{set: (data: string | LLH.API.SisDataType) => void}} controller
       * @param {string} gemId
       */
      var setDetail = function (controller, gemId) {
         if (controller && controller.set) {
            if (options.gemData && options.gemData[gemId]) {
               controller.set(options.gemData[gemId]);
            } else {
               controller.set(gemId);
            }
         }
      };

      this.onValueChange = function (name, newValue) {
         if (name == SEL_ID_GEM_CHOICE) {
            setDetail(detailController, newValue);
            setDetail(seriesController, newValue);
         }
      };

      this.setGemData(options.gemData);
   }

   /** @type {typeof LLH.Selector.LLGemSelectorComponent} */
   var cls = LLGemSelectorComponent_cls;
   LLClassUtil.setSuper(cls, LLFiltersComponent);
   var proto = cls.prototype;

   /** @this {LLH.Selector.LLGemSelectorComponent} */
   proto.setGemData = function (gemData) {
      if (gemData) {
         LLConst.Gem.postProcessGemData(gemData);
      }

      /** @type {LLH.Component.LLSelectComponent_OptionDef[][]} */
      var gemOptionGroups = [];
      /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
      var gemTypeOptions = [];
      var i;
      var me = this;

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
         gemOptionGroups.push(gemNormalCatOptions);
         gemTypeOptions.push({'value': GEM_GROUP_NORMAL_CATEGORY.toFixed(), 'text': '普通宝石（大类）'});
      } else {
         gemOptionGroups.push([]);
      }
      if (gemData && (this.includeNormalGem || this.includeLAGem)) {
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var gemNormalOptions = [{'value': '', 'text': '选择宝石'}];
         /** @type {LLH.Component.LLSelectComponent_OptionDef[]} */
         var gemLAOptions = [{'value': '', 'text': '选择宝石'}];
         var gemDataKeys = Object.keys(gemData).sort((a, b) => parseInt(a) - parseInt(b));
         for (i = 0; i < gemDataKeys.length; i++) {
            var curKey = gemDataKeys[i];
            var curGemData = gemData[curKey];
            if (curGemData.type == LLConst.SIS_TYPE_NORMAL) {
               if (this.includeNormalGem) {
                  gemNormalOptions.push({'value': curKey, 'text': LLConst.Gem.getGemDescription(curGemData), 'color': LLConst.Gem.getGemColor(curGemData)});
               }
            } else if (curGemData.type == LLConst.SIS_TYPE_LIVE_ARENA) {
               if (this.includeLAGem) {
                  gemLAOptions.push({'value': curKey, 'text': LLConst.Gem.getGemDescription(curGemData), 'color': LLConst.Gem.getGemColor(curGemData)});
               }
            }
         }
         if (this.includeNormalGem) {
            gemOptionGroups.push(gemNormalOptions);
            gemTypeOptions.push({'value': GEM_GROUP_NORMAL.toFixed(), 'text': '普通宝石'});
         } else {
            gemOptionGroups.push([]);
         }
         if (this.includeLAGem) {
            gemOptionGroups.push(gemLAOptions);
            gemTypeOptions.push({'value': GEM_GROUP_LA.toFixed(), 'text': '演唱会竞技场宝石'});
         }
      } else {
         gemOptionGroups.push([], []);
      }
      this.setFilterOptions(SEL_ID_GEM_TYPE, gemTypeOptions);
      this.setFilterOptionGroups(SEL_ID_GEM_CHOICE, gemOptionGroups);

      this.setFreezed(false);
      this.handleFilters();
   };
   proto.getGemId = function () {
      return this.getComponent(SEL_ID_GEM_CHOICE).get();
   };
   return cls;
})();

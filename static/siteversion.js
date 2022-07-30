/*
 * manage site version
 */

var LLSiteVersion = (function(){
   var VISITED_VERSION_KEY = 'llhelper_visited_version__';
   function getVisitedVersion() {
      var version = 0;
      try {
         version = parseInt(localStorage.getItem(VISITED_VERSION_KEY) || 0);
      } catch (e) {
         console.error(e);
      }
      return version;
   }

   function getCurrentVersion() {
      var js = document.scripts || [];
      var url = js[js.length - 1].src || '';
      if (url) {
         var pos = url.lastIndexOf('v=');
         var endPos = url.indexOf('&', pos);
         if (endPos < 0) {
            endPos = url.length;
         }
         return parseInt(url.substring(pos+2, endPos) || 0);
      }
      return 0;
   }

   var ret = {
      'current_version': getCurrentVersion(),
      'visited_version': getVisitedVersion(),
      'update': function () {
         if (ret.current_version === undefined) {
            return;
         }
         try {
            localStorage.setItem(VISITED_VERSION_KEY, ret.current_version);
            ret.visited_version = ret.current_version;
         } catch (e) {
            console.error(e);
         }
      },
      'check': function (version) {
         if (version !== undefined) {
            ret.current_version = parseInt(version);
         }
         if (ret.current_version !== undefined && ret.visited_version < ret.current_version) {
            document.getElementById('recent_updates').innerHTML = '近期更新 <span class="badge" style="background-color:#f33">1</span>';
         } else {
            document.getElementById('recent_updates').innerHTML = '近期更新';
         }
      } 
   };

   return ret;
})();


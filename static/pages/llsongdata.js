/** @param {LLH.Depends.Promise<void>} loadDeferred */
function renderPage(loadDeferred) {
    LLSongData.briefKeys.push('bpm');
    LLSongData.briefKeys.push('totaltime');
    /** @type {LLH.Selector.LLSongSelectorComponent} */
    var comp_songselector = undefined;

    /**
     * @param {LLH.API.SongDictDataType} songData 
     */
    function init(songData) {
       comp_songselector = new LLSongSelectorComponent('song_filter', {'songs': songData, 'excludeDefaultSong': true});
       comp_songselector.onSongSettingChange = applysongdata;
 
       var comp_language = new LLLanguageComponent('language');
       comp_language.registerLanguageChange(comp_songselector);
 
       // done
       document.getElementById('loadingbox').style.display = 'none';
    }

    LLDepends.whenAll(LLSongData.getAllBriefData(), loadDeferred).then(
        init,
        defaultHandleFailedRequest
    );
    
    function kizuna(combo){
        var result = 0
        for (var i = 1; i <= parseInt(combo/10); i++){
            if (i % 10 == 0)
                result += 10
            else if (i % 5 == 0)
                result += 5
            else if (i > 20)
                result += 2
            else
                result += 1
        }
        return result
    }
    
    function combomulti(cb){
        if (cb <= 50)
           return 1
         else if (cb <= 100)
             return (1.1*(cb-50)+50.0)/cb
         else if (cb <= 200)
           return (1.15*(cb-100)+105.0)/cb
         else if (cb <= 400)
           return (1.2*(cb-200)+220.0)/cb
         else if (cb <= 600)
           return (1.25*(cb-400)+460.0)/cb
       else if (cb <= 800)
           return (1.3*(cb-600)+710.0)/cb
       else
           return (1.35*(cb-800)+970)/cb
    }
 
    /**
     * @param {string} songSettingId 
     * @param {LLH.Internal.ProcessedSongSettingDataType} curSongSetting 
     * @returns 
     */
    function applysongdata(songSettingId, curSongSetting) {
       if (songSettingId == '') return;
 
       var curSong = comp_songselector.getSelectedSong();
 
       var songInfoList = ['attribute', 'totaltime', 'bpm', 'name', 'jpname'];
       var songSettingInfoList = [
         'combo', 'time', 'stardifficulty', 'star', 'cscore', 'bscore', 'ascore', 'sscore',
         'slider', 'swing', 'swingslider'
       ];
       var coloredList = ['attribute', 'name', 'jpname'];
       for (var i in songInfoList) {
          document.getElementById(songInfoList[i]).innerHTML = curSong[songInfoList[i]];
       }
       for (var i in songSettingInfoList) {
          var d = curSongSetting[songSettingInfoList[i]];
          document.getElementById(songSettingInfoList[i]).innerHTML = (d === undefined ? '?' : d);
       }
       for (var i in coloredList) {
          document.getElementById(coloredList[i]).style.color = LLConst.Common.getAttributeColor(curSong.attribute);
       }
 
       if (curSong['jpname'] == curSong['name']){
          document.getElementById("name").style.display = "none"
          document.getElementById("cnametag").style.display = "none"
       }
       else{
          document.getElementById("name").style.display = ""
          document.getElementById("cnametag").style.display = ""
       }
 
       var totalweight = 0;
       var weights = curSongSetting.positionweight;
       var c = parseInt(curSongSetting.combo);
       var hasNoteData = (weights !== undefined);
       var isRandom = (curSongSetting.difficulty == LLConst.SONG_DIFFICULTY_RANDOM);
       for (var i = 0; i < 9; i++) {
          var showNoteInfo = (hasNoteData && !isRandom);
          document.getElementById('positionnote' + i).innerHTML = (showNoteInfo ? curSongSetting.positionnote[i] : '?');
          document.getElementById('positionslider' + i).innerHTML = (showNoteInfo ? curSongSetting.positionslider[i] : '?');
          document.getElementById('positionswing' + i).innerHTML = (showNoteInfo ? curSongSetting.positionswing[i] : '?');
          document.getElementById('positionswingslider' + i).innerHTML = (showNoteInfo ? curSongSetting.positionswingslider[i] : '?');
          document.getElementById('positionweight' + i).innerHTML = (showNoteInfo ? weights[i] : '?');
          document.getElementById("positionweight" + i).style.background = ""
          document.getElementById("positionweight" + i).style.color = ""
          if (hasNoteData) {
             totalweight += parseFloat(weights[i]);
          }
       }
       var sl = (totalweight-c)*100/0.25/c;
       document.getElementById('noteweight').innerHTML = (hasNoteData ? totalweight : '?');
       for (var i = 0; i < 9; i++) {
          if (hasNoteData && !isRandom) {
             var p = parseFloat(weights[i]);
             var percentage = p/(c*(1+0.0025*sl));
             document.getElementById("positionmulti"+i).innerHTML = String((10*percentage).toFixed(3))+"%";
          } else {
             document.getElementById("positionmulti"+i).innerHTML = '?';
          }
       }
       //其他信息
       document.getElementById("kizunaget").innerHTML = kizuna(c);
       document.getElementById("combomulti").innerHTML = combomulti(c).toFixed(3);
       document.getElementById("scoreperstrength").innerHTML = (hasNoteData ? (1.1*1.1/80*combomulti(c)*totalweight).toFixed(3) : '?');
 
       //高亮低权重位置
       if (hasNoteData && !isRandom) {
          var we = [];
          for (var i = 0; i < 9; i++) {
             if (i != 4) we.push([i, weights[i]]);
          }
          we.sort(function (a, b) { return a[1] - b[1]; });
          var highlights = [["#f2dede", "#a94442"], ["#fcf8e3", "#8a6d3b"], ["#ffffcc", "#a0a003"]];
          for (var i = 0; i < highlights.length; i++) {
             document.getElementById("positionweight"+we[i][0]).style.background = highlights[i][0];
             document.getElementById("positionweight"+we[i][0]).style.color = highlights[i][1];
          }
       }
    }
}

# -*- coding: utf-8 -*-
import json
import os
import hashlib
import sqlite3
import re
import gzip

livejpdbpath = 'livenewjp.db_'
livecndbpath = 'livecn.db_'
json_file = 'newsongsjson.txt'
songs = json.loads(open(json_file, 'rb').read())
livejsonpath = 'livejson/'

song_count_in_db = 0
song_count_in_json = len(songs)
song_count_new = 0

attribute = ['','smile', 'pure', 'cool', '', 'all']
difficulty = ['' ,'easy', 'normal', 'hard', 'expert', 'random', 'master']
live_setting_query_str = (
'SELECT live_setting_m.live_setting_id,'  # 0
' live_setting_m.difficulty,'
' live_setting_m.stage_level,'
' live_setting_m.attribute_icon_id,'
' live_setting_m.notes_setting_asset,'
' live_setting_m.c_rank_score,' # 5
' live_setting_m.b_rank_score,'
' live_setting_m.a_rank_score,'
' live_setting_m.s_rank_score,'
' live_setting_m.s_rank_combo,'
' live_setting_m.ac_flag as is_ac,' # 10
' live_setting_m.swing_flag as is_swing '
'FROM live_setting_m '
'WHERE live_track_id = %s;'
)

if __name__ == "__main__":
	print('Updating songs json: %s ...' % json_file)
	jpdbconn = sqlite3.connect(livejpdbpath)
	cndbconn = sqlite3.connect(livecndbpath)
	jptc = jpdbconn.execute('SELECT live_track_id,name,member_category FROM live_track_m;')
	jptmp = jptc.fetchone()
	while jptmp:
		song_count_in_db += 1
		song_id = jptmp[0]
		song_key = str(song_id)
		if song_key not in songs:
			print('New song %d' % song_id)
			song_count_new += 1
			songs[song_key] = {}
			song = songs[song_key]
			song['type'] = ''
			song['bpm'] = 0
			song['name'] = jptmp[1]
			#song['cnhave'] = 0
		song = songs[song_key]
		song['jpname'] = jptmp[1]
		song['id'] = song_id
		song['group'] = jptmp[2]
		if jptmp[2] == 1:
			song['muse'] = 1
			song['aqours'] = 0
		elif jptmp[2] == 2:
			song['muse'] = 0
			song['aqours'] = 1
		elif jptmp[2] == 3:
			song['niji'] = 1
		if ('totaltime' not in song) or song['totaltime'] == 0:
			livetime = jpdbconn.execute('SELECT live_time from live_time_m WHERE live_track_id = %s;' % song_id)
			livetimerow = livetime.fetchone()
			if livetimerow:
				song['totaltime'] = str(livetimerow[0])
			else:
				song['totaltime'] = 0
		livesetting = jpdbconn.execute(live_setting_query_str % song_key)
		livetmp = livesetting.fetchone()
		while livetmp:
			liveSettingId = str(livetmp[0])
			if 'settings' not in song:
				song['settings'] = {}
			if liveSettingId not in song['settings']:
				song['settings'][liveSettingId] = {}
			liveSetting = song['settings'][liveSettingId]
			liveSetting['liveid'] = liveSettingId
			liveSetting['difficulty'] = livetmp[1]
			liveSetting['stardifficulty'] = livetmp[2]
			liveSetting['combo'] = livetmp[9]
			liveSetting['cscore'] = livetmp[5]
			liveSetting['bscore'] = livetmp[6]
			liveSetting['ascore'] = livetmp[7]
			liveSetting['sscore'] = livetmp[8]
			liveSetting['jsonpath'] = livetmp[4]
			liveSetting['isac'] = livetmp[10]
			liveSetting['isswing'] = livetmp[11]
			song['attribute'] = attribute[livetmp[3]]
			livetmp = livesetting.fetchone()

		jptmp = jptc.fetchone()


	output = open(json_file, 'w')
	json.dump(songs, output, sort_keys=True)
	output.close()

	print('Updated %s , song count = %d (old %d, new %d, db %d)' % (json_file, len(songs), song_count_in_json, song_count_new, song_count_in_db))

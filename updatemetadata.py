# -*- coding: utf-8 -*-
import argparse
import sqlite3
import sys
from lib.JsonUtil import JsonFile
from lib.Translator import Translator

if sys.version[0] == '2':
    reload(sys)
    sys.setdefaultencoding('utf-8')

translate_cn_file = 'translate-cn.properties'
translate_missing_file = 'translate-missing.properties'

jpdbpath = 'unitnewjp.db_'

def translateCn(cur_data, key, translator):
    cur_data[key] = cur_data[key].replace('<br>', ' ')
    jp_text = cur_data[key]
    cn_text = translator.translate(jp_text)
    if jp_text and cn_text:
        cur_data['cn' + key] = cn_text

def commonHandleMetadataArray(dbconn, metadata, json_key, main_query):
    if json_key not in metadata:
        count_before = 0
    else:
        count_before = len(metadata[json_key])
    new_arr = []

    query = dbconn.execute(main_query)
    row = query.fetchone()
    while row:
        cur_id = row[0]
        new_arr.append(cur_id)

        row = query.fetchone()

    metadata[json_key] = new_arr

    print('%s : before %d, after %d' % (json_key, count_before, len(metadata[json_key])))

def commonHandleMetadataTable(dbconn, metadata, json_key, main_query, row_handler, translator):
    count_new = 0
    count_row = 0
    if json_key not in metadata:
        metadata[json_key] = {}
    mdata = metadata[json_key]
    count_before = len(mdata)

    query = dbconn.execute(main_query)
    row = query.fetchone()
    while row:
        count_row += 1
        cur_id = row[0]
        cur_name = row[1]
        if str(cur_id) not in mdata:
            print('New %s %d : %s' % (json_key, cur_id, cur_name))
            count_new += 1
            mdata[str(cur_id)] = {}
        cur_data = mdata[str(cur_id)]
        row_handler(dbconn, cur_data, row, translator)

        row = query.fetchone()

    print('%s : before %d, after %d, db %d, new %d' % (json_key, count_before, len(mdata), count_row, count_new))

def handleAlbum(dbconn, cur_data, row, translator):
    cur_data['name'] = row[1]
    translateCn(cur_data, 'name', translator)

def handleMemberTag(dbconn, cur_data, row, translator):
    cur_data['name'] = row[1]
    translateCn(cur_data, 'name', translator)
    unit_arr = []
    rel_query = dbconn.execute('SELECT unit_type_id from unit_type_member_tag_m WHERE member_tag_id = %d;' % row[0])
    rel_row = rel_query.fetchone()
    while rel_row:
        unit_arr.append(rel_row[0])
        rel_row = rel_query.fetchone()
    cur_data['members'] = unit_arr

def handleUnitType(dbconn, cur_data, row, translator):
    cur_data['name'] = row[1]
    translateCn(cur_data, 'name', translator)
    if row[2]:
        cur_data['color'] = row[2]
    if row[3]:
        cur_data['background_color'] = row[3]

def parseArgs():
    parser = argparse.ArgumentParser('Update metadata')
    parser.add_argument('-d', action='store_true', help='dump strings that need translate', dest='dump_missing')
    return parser.parse_args()

if __name__ == "__main__":
    args = parseArgs()

    json_file = JsonFile('metadata.txt')
    print('Updating metadata json: %s ...' % json_file)
    metadata = json_file.load()
    translator = Translator(translate_cn_file)
    jpdbconn = sqlite3.connect(jpdbpath)

    # album
    commonHandleMetadataTable(jpdbconn, metadata, 'album', 'SELECT album_series_id, name FROM album_series_m;', handleAlbum, translator)

    # member tag
    commonHandleMetadataTable(jpdbconn, metadata, 'member_tag', 'SELECT member_tag_id, name FROM member_tag_m;', handleMemberTag, translator)

    # unit type
    commonHandleMetadataTable(jpdbconn, metadata, 'unit_type', 'SELECT unit_type_id, name, original_attribute_id, background_color FROM unit_type_m;', handleUnitType, translator)

    # cskill types
    commonHandleMetadataArray(jpdbconn, metadata, 'cskill_groups', 'SELECT member_tag_id FROM unit_leader_skill_extra_m GROUP BY member_tag_id;')

    json_file.save(metadata)
    print('Updated %s' % json_file)

    if args.dump_missing:
        translator.exportMissing(translate_missing_file)
        print('Exported missing translator text to %s' % translate_missing_file)

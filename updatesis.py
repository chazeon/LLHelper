# -*- coding: utf-8 -*-
import argparse
from lib.JsonUtil import JsonFile
from lib.PrintLogger import PrintLogger
from lib.DbUtil import connectUnitDb, queryTableCols
from lib.Translator import Translator

def parseArgs():
    parser = argparse.ArgumentParser('Update sisdata')
    parser.add_argument('-d', action='store_true', help='dump strings that need translate', dest='dump_missing')
    return parser.parse_args()

def main():
    args = parseArgs()
    logger = PrintLogger()
    jsonFile = JsonFile('sisdata.json', logger)
    translator = Translator('translate-cn.properties')
    logger.info('Updating sis data: %s' % jsonFile)

    sisData = jsonFile.load()
    unitConn = connectUnitDb()
    sisCountInData = len(sisData)
    sisCountInDb = 0
    sisCountNew = 0

    sisTableCols = [
        'unit_removable_skill_id', 'name', 'skill_type', 'level', 'size',
        'effect_range', 'effect_type', 'effect_value', 'fixed_value_flag', 'target_reference_type',
        'target_type', 'trigger_reference_type', 'trigger_type', 'sub_skill_id'
    ]
    sisCursor = queryTableCols(unitConn, 'unit_removable_skill_m', sisTableCols)
    sisRow = sisCursor.fetchone()
    while sisRow:
        sisCountInDb += 1

        sisId = str(sisRow[0])
        sisName = sisRow[1]
        sisItem = None
        if sisId not in sisData:
            logger.info('New sis %s: %s' % (sisId, sisName))
            sisItem = {'id': sisId}
            sisCountNew += 1
            sisData[sisId] = sisItem
        else:
            sisItem = sisData[sisId]
        
        sisType = sisRow[2] # skill_type
        sisItem['jpname'] = sisName
        cnname = translator.translate(sisName)
        if cnname is not None:
            sisItem['cnname'] = cnname
        sisItem['type'] = sisType
        if sisRow[3] != 0:
            sisItem['level'] = sisRow[3]
        sisItem['size'] = sisRow[4]
        if sisType == 1: # normal gem
            sisItem['range'] = sisRow[5]
        sisItem['effect_type'] = sisRow[6]
        if sisRow[6] >= 1 and sisRow[6] <= 3:
            sisItem['color'] = sisRow[6]
        sisItem['effect_value'] = sisRow[7]
        if sisRow[8] != 0:
            sisItem['fixed'] = sisRow[8]

        if sisRow[9] == 1: # target reference by attribute
            sisItem['grade'] = sisRow[10]
        elif sisRow[9] == 2: # target reference by member
            sisItem['member'] = sisRow[10]
        elif sisRow[9] == 3: # target reference by grade
            sisItem['color'] = sisRow[10]

        if sisRow[11] == 4: # trigger reference by group
            sisItem['group'] = sisRow[12]
        elif sisRow[11] != 0:
            sisItem['trigger_ref'] = sisRow[11]
            sisItem['trigger_value'] = sisRow[12]
        
        if sisRow[13]:
            sisItem['sub_skill'] = sisRow[13]

        sisRow = sisCursor.fetchone()
    sisCursor.close()

    sisLiveEffectCols = ['unit_removable_skill_id', 'effect_type', 'effect_interval']
    sisCursor = queryTableCols(unitConn, 'unit_removable_skill_live_effect_m', sisLiveEffectCols)
    sisRow = sisCursor.fetchone()
    while sisRow:
        sisId = str(sisRow[0])
        if sisId in sisData:
            sisItem = sisData[sisId]
            sisItem['live_effect_type'] = sisRow[1]
            if sisRow[2]:
                sisItem['live_effect_interval'] = sisRow[2]

        sisRow = sisCursor.fetchone()

    sisLevelUpCols = ['unit_removable_skill_id', 'next_unit_removable_skill_id']
    sisCursor = queryTableCols(unitConn, 'unit_removable_skill_exchange_m', sisLevelUpCols)
    sisRow = sisCursor.fetchone()
    while sisRow:
        sisId = str(sisRow[0])
        if sisId in sisData:
            sisItem = sisData[sisId]
            sisItem['level_up_skill'] = sisRow[1]

        sisRow = sisCursor.fetchone()

    unitConn.close()
    jsonFile.save(sisData)

    logger.info('Updated %s: sis count = %s (old %s, new %s, db %s)' % (jsonFile, len(sisData), sisCountInData, sisCountNew, sisCountInDb))

    if args.dump_missing:
        missing_file = 'translate-missing.properties'
        translator.exportMissing(missing_file)
        logger.info('Updated %s' % missing_file)


if __name__ == '__main__':
    main()

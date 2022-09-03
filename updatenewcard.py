# -*- coding: utf-8 -*-
import os
import sqlite3
from lib.JsonUtil import JsonFile
from lib.DbUtil import connectUnitDb

cndbpath = 'unitcn.db_'

attribute = ['','smile', 'pure', 'cool', '', 'all']
rarity = ['','N','R','SR','UR','SSR']

unit_column_str = (
' unit_m.unit_number,'  # 0
' unit_m.unit_type_id,'
' unit_m.eponym,'
' unit_m.name,'
' unit_m.normal_card_id,'
' unit_m.rank_max_card_id,'  # 5
' unit_m.rarity,'
' unit_m.attribute_id,'
' unit_m.default_unit_skill_id,'
' unit_m.default_leader_skill_id,'
' unit_rarity_m.before_level_max,'   # 10
' unit_m.default_removable_skill_capacity,'
' unit_m.max_removable_skill_capacity,'
' unit_m.disable_rank_up,'
' unit_m.unit_level_up_pattern_id,'
' unit_m.hp_max,'  # 15
' unit_m.smile_max,'
' unit_m.pure_max,'
' unit_m.cool_max,'
' unit_m.album_series_id '
'FROM unit_m LEFT JOIN unit_rarity_m ON unit_m.rarity = unit_rarity_m.rarity '
)

def namechange(name):
    if name == u"南琴梨":
        return u"南小鸟"
    elif name == u"矢泽日香":
        return u"矢泽妮可"
    else:
        return name

class MinMax:
    def __init__(self):
        self.min = None
        self.max = None

    def add(self, value):
        if value:
            if self.min is None:
                self.min = value
                self.max = value
            else:
                if value < self.min:
                    self.min = value
                if value > self.max:
                    self.max = value

    def hasValue(self):
        if self.min:
            return True
        return False

    def isMinMaxSame(self):
        return self.min == self.max

    def toRange(self):
        if self.isMinMaxSame():
            if isinstance(self.min, float):
                if self.min.is_integer():
                    return int(self.min)
            return self.min
        else:
            min_str = str(self.min)
            max_str = str(self.max)
            if isinstance(self.min, float):
                if self.min.is_integer():
                    min_str = str(int(self.min))
            if isinstance(self.max, float):
                if self.max.is_integer():
                    max_str = str(int(self.max))
            return '%s~%s' % (min_str, max_str)

if __name__ == "__main__":
    json_file = JsonFile('newcardsjson.txt')
    cards = json_file.load()
    card_count_in_db = 0
    card_count_in_json = len(cards)
    card_count_new = 0

    print('Updating cards json: %s ...' % json_file)

    jpdbconn = connectUnitDb()
    has_cndb = os.path.exists(cndbpath)
    if has_cndb:
        cndbconn = sqlite3.connect(cndbpath)
    jptc = jpdbconn.execute('SELECT %s;' % unit_column_str)
    jptmp = jptc.fetchone()
    while jptmp:
        card_count_in_db += 1
        card_id = jptmp[0]
        if card_id <= 0:
            jptmp = jptc.fetchone()
            continue
        card_key = str(card_id)
        if card_key not in cards:
            print('New card %d' % card_id)
            card_count_new += 1
            cards[card_key] = {}
            card = cards[card_key]
            card['cnhave'] = 0
            card['type'] = u'卡池卡'
        skillid = jptmp[8]
        card = cards[card_key]
        card['id'] = card_id
        if has_cndb:
            cncard = cndbconn.execute('SELECT %s WHERE unit_m.unit_number = %s;' % (unit_column_str, card_key))
            cntmp = cncard.fetchone()
        else:
            cntmp = 0
        card['rarity'] = rarity[jptmp[6]]
        card['attribute'] = attribute[jptmp[7]]
        card['typeid'] = jptmp[1]
        card['jpeponym'] = jptmp[2]
        card['jpname'] = jptmp[3]
        # do not overwrite old data
        if 'eponym' not in card:
            card['eponym'] = jptmp[2]
        if 'name' not in card:
            card['name'] = jptmp[3]
        card['hp'] =  jptmp[15]-1
        card['smile2'] = jptmp[16]
        card['pure2'] = jptmp[17]
        card['cool2'] = jptmp[18]
        card['smile'] =  0
        card['pure'] = 0
        card['cool'] = 0
        card['skill'] = skillid
        card['Cskill'] = jptmp[9]
        card['support'] = 0
        card['special'] = 0
        card['minslot'] = jptmp[11]
        card['maxslot'] = jptmp[12]
        card['album'] = jptmp[19]

        #card['type'] = ''
        card['Cskillattribute'] = card['attribute']
        card['Cskillpercentage'] = 0

        if cntmp:
            card['eponym'] = cntmp[3]
            card['name'] = namechange(cntmp[4])
        if jptmp[13] > 0:
            card['support'] = 1
        if jptmp[4] == jptmp[5] and card['support'] == 0:
            card['special'] = 1
        if card['support'] == 0 and card['special'] == 0:
            patterntmp = jpdbconn.execute('SELECT smile_diff, pure_diff, cool_diff FROM unit_level_up_pattern_m WHERE unit_level_up_pattern_id = %d AND unit_level = %d;' % (jptmp[14], jptmp[10]))
            tmp = patterntmp.fetchone()
            card['smile'] = card['smile2']-tmp[0]
            card['pure'] = card['pure2']-tmp[1]
            card['cool'] = card['cool2']-tmp[2]

        #skill
        if skillid and card['support'] == 0:
            jpskilltmp = jpdbconn.execute('SELECT name,skill_effect_type,trigger_type,unit_skill_level_up_pattern_id FROM unit_skill_m WHERE unit_skill_id = '+str(skillid)+';')
            jpskill = jpskilltmp.fetchone()
            card['jpskillname'] = jpskill[0]
            # do not overwrite old data
            if 'skillname' not in card:
                card['skillname'] = jpskill[0]
            card['skilleffect'] = jpskill[1]
            card['triggertype'] = jpskill[2]
            card['skillleveluppattern'] = jpskill[3]
            if cntmp:
                cnskilltmp = cndbconn.execute('SELECT * FROM unit_skill_m WHERE unit_skill_id = '+str(skillid)+';')
                cnskill = cnskilltmp.fetchone()
                card['skillname'] = cnskill[1]
            # skill detailed effect for each level
            skilldetail = jpdbconn.execute('SELECT effect_value,discharge_time,trigger_value,activation_rate,trigger_limit FROM unit_skill_level_m WHERE unit_skill_id = '+str(skillid)+' ORDER BY skill_level ASC;')
            card['skilldetail'] = []
            tmp = skilldetail.fetchone()
            i = 0
            trigger_require_minmax = MinMax()
            score_minmax = MinMax()
            time_minmax = MinMax()
            possibility_minmax = MinMax()
            limit_minmax = MinMax()
            while tmp:
                card['skilldetail'].append({})
                card['skilldetail'][i]['score'] = tmp[0]
                card['skilldetail'][i]['time'] = tmp[1]
                card['skilldetail'][i]['require'] = tmp[2]
                card['skilldetail'][i]['possibility'] = tmp[3]
                if tmp[4]:
                    card['skilldetail'][i]['limit'] = tmp[4]
                score_minmax.add(tmp[0])
                time_minmax.add(tmp[1])
                trigger_require_minmax.add(tmp[2])
                possibility_minmax.add(tmp[3])
                limit_minmax.add(tmp[4])

                i = i + 1
                tmp = skilldetail.fetchone()

            if score_minmax.hasValue():
                card['score_range'] = score_minmax.toRange()
            if time_minmax.hasValue():
                card['time_range'] = time_minmax.toRange()
            if trigger_require_minmax.hasValue():
                card['triggerrequire'] = trigger_require_minmax.toRange()
            if possibility_minmax.hasValue():
                card['possibility_range'] = possibility_minmax.toRange()
            if limit_minmax.hasValue():
                card['limit_range'] = limit_minmax.toRange()

            triggertarget = jpdbconn.execute('SELECT trigger_target FROM unit_skill_trigger_target_m WHERE unit_skill_id = '+str(skillid)+' ORDER BY trigger_target DESC;')
            tmp = triggertarget.fetchone()
            if tmp:
                card['triggertarget'] = []
                while tmp:
                    card['triggertarget'].append(tmp[0])
                    tmp = triggertarget.fetchone()
            effecttarget = jpdbconn.execute('SELECT effect_target FROM unit_skill_effect_target_m WHERE unit_skill_id = '+str(skillid)+' ORDER BY effect_target DESC;')
            tmp = effecttarget.fetchone()
            if tmp:
                card['effecttarget'] = []
                while tmp:
                    card['effecttarget'].append(tmp[0])
                    tmp = effecttarget.fetchone()
        #leader skill
        if jptmp[9]:
            Cskilldetail = jpdbconn.execute('SELECT leader_skill_effect_type, effect_value FROM unit_leader_skill_m WHERE unit_leader_skill_id = %d;' % jptmp[9])
            cskill = Cskilldetail.fetchone()
            base =['','smile','pure','cool']
            card['Cskillpercentage'] = cskill[1]
            if cskill[0] >= 100:
                card['Cskillattribute'] = base[(cskill[0]//10)%10]
            else:
                card['Cskillattribute'] = base[cskill[0]%10]
            Csecondskilldetail = jpdbconn.execute('SELECT member_tag_id, effect_value FROM unit_leader_skill_extra_m WHERE unit_leader_skill_id = %d;' % jptmp[9])
            csecondskill = Csecondskilldetail.fetchone()
            if csecondskill:
                card['Csecondskillattribute'] = csecondskill[1]
                card['Csecondskilllimit'] = csecondskill[0]
            else:
                if 'Csecondskillattribute' in card:
                    del card['Csecondskillattribute']
                if 'Csecondskilllimit' in card:
                    del card['Csecondskilllimit']

        for delkey in ['cardpath','avatarpath','smallcardpath','navipath','cardpluspath','avatarpluspath','smallcardpluspath','navipluspath']:
            if delkey in card:
                del card[delkey]

        jptmp = jptc.fetchone()


    json_file.save(cards)

    print('Updated %s , card count = %d (old %d, new %d, db %d)' % (json_file, len(cards), card_count_in_json, card_count_new, card_count_in_db))



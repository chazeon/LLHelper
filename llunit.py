from app import *
from flask import make_response, Request
import json

def unescapeJsonStr(json_str):
    # TODO: prevent xss
    if not isinstance(json_str, str):
        json_str = str(json_str, encoding='utf-8')
    return json_str.replace('%7B', '{').replace('%22', '"').replace('%7D', '}').replace('%5B', '[').replace('%5D', ']')

@app.route("/llsaveunit/<content>", methods=['GET', 'POST'])
def llunitsave(content):
    '''
    int_element = ["smile", "pure", "cool", "kizuna", "skill", "require", "possibility"]
    float_element = ["score"]
    for i in range(0, 9):
        for key in int_element:
            member[i][key] = string.atoi(request.form.get(key+str(i)))
        for key in float_element:
            member[i][key] = string.atof(request.form.get(key+str(i)))
        member[i]["main"] = request.form.get("main"+str(i))
    '''
    response = make_response(content)
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['Content-Disposition'] = 'attachment; filename=unit.sd'
    return response

@app.route("/llsavesis/<content>", methods=['GET', 'POST'])
def llsavesis(content):
    response = make_response(content)
    response.headers['Content-Type']='application/octet-stream'
    response.headers['Content-Disposition']='attachment; filename=idolskills.sd'
    return response

@app.route("/llsavesubmembers/<content>", methods=['GET', 'POST'])
def llsubmemberssave(content):
    response = make_response(content)
    response.headers['Content-Type']='application/octet-stream'
    response.headers['Content-Disposition']='attachment; filename=submembers.sd'
    return response

@app.route("/llsaveallmembers/<content>", methods=['GET', 'POST'])
def llsaveallmembers(content):
    response = make_response(content)
    response.headers['Content-Type']='application/octet-stream'
    response.headers['Content-Disposition']='attachment; filename=submembers.sd'
    return response

@app.route("/llload/<callback>", methods=['GET', 'POST'])
def llload(callback):
    print(request.files, callback)
    for f in request.files['file']:
        return '<script>' + callback + '(' + unescapeJsonStr(f) + ');</script>'

@app.route("/llloadex/<formid>/<callback>", methods=['POST'])
def llloadex(formid, callback):
    print(request.files, formid, callback)
    for f in request.files[formid]:
        return '<script>' + callback + '(' + unescapeJsonStr(f) + ');</script>'

@app.route("/llunit", methods=['GET', 'POST'])
def llunit():
    songsjson = open('newsongsjson.txt', 'rb').read()
    cardsjson = open('oldcardsjson.txt', 'rb').read()
    result = {}
    int_element = ["smile", "pure", "cool", "kizuna", "skill", "require", "possibility"]
    float_element = ["weight", "score"]
    sel_element = ['base', 'base2', 'bonus', 'bonus2', 'map']
    sel_int = ['percentage', 'percentage2', 'combo', 'perfect', 'star', 'starperfect', 'time']
    sel_float = ['slider']
    atts = ['smile', 'pure', 'cool']
    result['calculate'] = 0
    if request.form.has_key('submit'):
        member = [{}, {}, {}, {}, {}, {}, {}, {}, {}]
        mapcenter = {}
        result['baseatt'] = {}
        result['bonusatt'] = {}
        for att in atts:
            result['baseatt'][att] = 0
            result['bonusatt'][att] = 0
        for key in sel_int:
            mapcenter[key] = string.atoi(request.form.get(key))
        for key in sel_float:
            mapcenter[key] = string.atof(request.form.get(key))
        for key in sel_element:
            mapcenter[key] = request.form.get(key)
        for i in range(0, 9):
            for key in int_element:
                member[i][key] = string.atoi(request.form.get(key + str(i)))
            for key in float_element:
                member[i][key] = string.atof(request.form.get(key + str(i)))
            member[i]["main"] = request.form.get("main" + str(i))
            # print member[i]
            for att in atts:
                result['baseatt'][att] += member[i][att]
                if att == member[i]['main']:
                    result['bonusatt'][att] += member[i]['kizuna']
        # c
        result['bonusatt'][mapcenter['bonus']] += mapcenter['percentage'] * result['baseatt'][mapcenter['base']] / 100.0
        result['bonusatt'][mapcenter['bonus2']] += mapcenter['percentage2'] * result['baseatt'][
            mapcenter['base2']] / 100.0
        result['bonusatt'][mapcenter['bonus2']] = int(round(result['bonusatt'][mapcenter['bonus2']]))
        result['calculate'] = 1
        showatt = result['bonusatt'][mapcenter['map']] + result['baseatt'][mapcenter['map']]
        combomulti = ll.cbmulti(mapcenter['combo'])
        accmulti = 0.88 + 0.12 * mapcenter['perfect'] / mapcenter['combo']
        #
        result['minscore'] = 0
        for i in range(0, 9):
            result['minscore'] += int(showatt / 80.0 * member[i]['weight'] * combomulti * accmulti * (
            1 + 0.1 * (mapcenter['map'] == member[i]['main'])))
        #
        result['maxscore'] = result['minscore']
        result['averagescore'] = result['minscore']
        result['averageheal'] = 0
        result['maxheal'] = 0
        result['accuracy'] = 0
        skillchance = [0] * 9
        averageskillscore = [0] * 9
        # except score scoring
        for i in range(0, 9):
            skill = member[i]['skill']
            if skill == 1 or skill == 11:
                skillchance[i] = mapcenter['combo'] / member[i]['require']
                result['maxscore'] += mapcenter['combo'] / member[i]['require'] * member[i]['score']
                averageskillscore[i] = mapcenter['combo'] / member[i]['require'] * member[i]['possibility'] * member[i][
                    'score'] / 100
                result['averagescore'] += mapcenter['combo'] / member[i]['require'] * member[i]['possibility'] * \
                                          member[i]['score'] / 100
            if skill == 2:
                skillchance[i] = mapcenter['perfect'] / member[i]['require']
                result['maxscore'] += mapcenter['perfect'] / member[i]['require'] * member[i]['score']
                averageskillscore[i] = mapcenter['perfect'] / member[i]['require'] * member[i]['possibility'] * \
                                       member[i]['score'] / 100
                result['averagescore'] += mapcenter['perfect'] / member[i]['require'] * member[i]['possibility'] * \
                                          member[i]['score'] / 100
            if skill == 4:
                skillchance[i] = mapcenter['time'] / member[i]['require']
                result['maxscore'] += mapcenter['time'] / member[i]['require'] * member[i]['score']
                averageskillscore[i] = mapcenter['time'] / member[i]['require'] * member[i]['possibility'] * member[i][
                    'score'] / 100
                result['averagescore'] += mapcenter['time'] / member[i]['require'] * member[i]['possibility'] * \
                                          member[i]['score'] / 100
            if skill == 7 or skill == 13:
                skillchance[i] = mapcenter['combo'] / member[i]['require']
                result['maxheal'] += mapcenter['combo'] / member[i]['require'] * member[i]['score']
                result['averageheal'] += mapcenter['combo'] / member[i]['require'] * member[i]['possibility'] * \
                                         member[i]['score'] / 100
            if skill == 8:
                skillchance[i] = mapcenter['time'] / member[i]['require']
                result['maxheal'] += mapcenter['time'] / member[i]['require'] * member[i]['score']
                result['averageheal'] += mapcenter['time'] / member[i]['require'] * member[i]['possibility'] * \
                                         member[i]['score'] / 100
            if skill == 9:
                skillchance[i] = mapcenter['perfect'] / member[i]['require']
                result['maxheal'] += mapcenter['perfect'] / member[i]['require'] * member[i]['score']
                result['averageheal'] += mapcenter['perfect'] / member[i]['require'] * member[i]['possibility'] * \
                                         member[i]['score'] / 100
            if skill == 10:
                skillchance[i] = mapcenter['starperfect'] / member[i]['require']
                result['maxscore'] += mapcenter['starperfect'] / member[i]['require'] * member[i]['score']
                averageskillscore[i] = mapcenter['starperfect'] / member[i]['require'] * member[i]['possibility'] * \
                                       member[i]['score'] / 100
                result['averagescore'] += mapcenter['starperfect'] / member[i]['require'] * member[i]['possibility'] * \
                                          member[i]['score'] / 100
        # score scoring
        finish = False
        infinite = False
        averagescoringtimes = [0] * 9
        maxscoringtimes = [0] * 9
        while not finish:
            finish = True
            for i in range(0, 9):
                if member[i]['skill'] == 3 and averagescoringtimes[i] < int(
                                result['averagescore'] / member[i]['require']):
                    remaintimes = int(result['averagescore'] / member[i]['require']) - averagescoringtimes[i]
                    averagescoringtimes[i] += remaintimes
                    averageskillscore[i] += remaintimes * member[i]['possibility'] * member[i]['score'] / 100
                    result['averagescore'] += remaintimes * member[i]['possibility'] * member[i]['score'] / 100
                    finish = False
                if not finish and result['averagescore'] > 10000000:
                    result['averagescore'] = '1000w+'
                    infinite = True
                    finish = True
                    break
        if not infinite:
            result['averagescore'] = int(result['averagescore'])
        finish = False
        infinite = False
        while not finish:
            finish = True
            for i in range(0, 9):
                if member[i]['skill'] == 3 and maxscoringtimes[i] < int(result['maxscore'] / member[i]['require']):
                    remaintimes = int(result['maxscore'] / member[i]['require']) - maxscoringtimes[i]
                    maxscoringtimes[i] += remaintimes
                    result['maxscore'] += remaintimes * member[i]['score']
                    finish = False
            if not finish and result['maxscore'] > 10000000:
                result['maxscore'] = '1000w+'
                infinite = True
                finish = True
                break
        if not infinite:
            result['maxscore'] = int(result['maxscore'])

        # simulation

        times = 10000
        simresult = [0] * times
        for t in range(0, times):
            nowscore = result['minscore']
            for i in range(0, 9):
                skill = member[i]['skill']
                if skill == 1 or skill == 2 or skill == 4 or skill == 10 or skill == 11:
                    for j in range(0, skillchance[i]):
                        if random.random() < member[i]['possibility'] / 100.0:
                            nowscore += member[i]['score']

            finish = False
            scoringtimes = [0] * 9
            while not finish:
                finish = True
                for i in range(0, 9):
                    skill = member[i]['skill']
                    if skill == 3 and scoringtimes[i] < int(nowscore / member[i]['require']):
                        remaintimes = int(nowscore / member[i]['require']) - scoringtimes[i]
                        scoringtimes[i] += remaintimes
                        for j in range(0, remaintimes):
                            if random.random() < member[i]['possibility'] / 100.0:
                                nowscore += member[i]['score']
                                finish = False

            simresult[t] = nowscore
        simresult.sort(reverse=True)
        if result['averagescore'] != 'impossible':
            result['unitstrength'] = int(result['averagescore'] * 1.0 / result['minscore'] * showatt)
            result['singlestrength'] = [0] * 9
            for i in range(0, 9):
                result['singlestrength'][i] = member[i][mapcenter['map']]
                if mapcenter['bonus'] == mapcenter['map']:
                    result['singlestrength'][i] += member[i][mapcenter['base']] * mapcenter['percentage'] / 100.0
                if mapcenter['bonus2'] == mapcenter['map']:
                    result['singlestrength'][i] += member[i][mapcenter['base2']] * mapcenter['percentage2'] / 100.0
                result['singlestrength'][i] += int(averageskillscore[i] * 1.0 / result['minscore'] * showatt)
                if member[i]['main'] != mapcenter['map']:
                    result['unitstrength'] -= int(
                        showatt * member[i]['weight'] / 11.0 / mapcenter['combo'] / (1 + 0.0025 * mapcenter['slider']))
                    result['singlestrength'][i] -= int(
                        showatt * member[i]['weight'] / 11.0 / mapcenter['combo'] / (1 + 0.0025 * mapcenter['slider']))
                else:
                    result['singlestrength'][i] += member[i]['kizuna']
                result['singlestrength'][i] = int(result['singlestrength'][i])
        # print simresult
        result['simresult'] = {1: simresult[times / 100], 2: simresult[times / 50], 5: simresult[times / 20],
                               10: simresult[times / 10], \
                               20: simresult[times / 5], 30: simresult[times * 3 / 10], 40: simresult[times * 4 / 10],
                               50: simresult[times / 2], \
                               60: simresult[times * 6 / 10], 70: simresult[times * 7 / 10],
                               80: simresult[times * 8 / 10], 90: simresult[times * 9 / 10], \
                               95: simresult[times * 95 / 100], 98: simresult[times * 98 / 100],
                               99: simresult[times * 99 / 100]}

    return render_template("llunit.html", data=result, cardsjson=cardsjson, songsjson=songsjson)

def handleLoadUnit(request):
    # type: (Request) -> str
    argv = request.args.get("unit")
    addon = ""
    if argv:
        try:
            # TODO: decouple with page
            addon = "handleLoadUnit(" + unescapeJsonStr(argv) + ");"
        except BaseException:
            pass
    return addon

@app.route("/llnewunit", methods=['GET', 'POST'])
def llnewunit():
    # 'unit' passed by llunitimport or test
    return render_template("llnewunit.html", additional_script=handleLoadUnit(request))

@app.route("/llnewunitsis", methods=['GET', 'POST'])
def llnewunitsis():
    # 'unit' passed by pll (LLProxy)
    return render_template("llnewunitsis.html", additional_script=handleLoadUnit(request))

@app.route("/llnewautounit", methods=['GET', 'POST'])
def llnewautounit():
    return render_template("llnewautounit.html")

@app.route("/llnewunitla", methods=['GET', 'POST'])
def llnewunitla():
    return render_template("llnewunitla.html", additional_script=handleLoadUnit(request))

@app.route("/llnewunit40", methods=['GET', 'POST'])
def llnewunit40():
    songsjson = open('newsongsjson.txt', 'rb').read()
    cardsjson = open('newcardsjson4.txt', 'rb').read()
    return render_template("llnewunit40.html", cardsjson = cardsjson, songsjson = songsjson)

@app.route("/llunitimport", methods=['GET', 'POST'])
def llunitimport():
    return render_template("llunitimport.html")

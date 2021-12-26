# -*- coding: utf-8 -*-
import sqlite3

def connectUnitDb():
    return sqlite3.connect('unitnewjp.db_')

def connectLiveDb():
    return sqlite3.connect('livenewjp.db_')

def queryTableCols(connection, tableName, colList):
    return connection.execute('SELECT %s FROM %s;' % (', '.join(map(lambda x: '%s.%s' % (tableName, x), colList)), tableName))

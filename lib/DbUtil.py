# -*- coding: utf-8 -*-
import sqlite3

def connectUnitDb():
    # type: () -> sqlite3.Connection
    return sqlite3.connect('unitnewjp.db_')

def connectLiveDb():
    # type: () -> sqlite3.Connection
    return sqlite3.connect('livenewjp.db_')

def queryTableColsEx(connection, tableName, colList, extra):
    # type: (sqlite3.Connection, str, list, str) -> sqlite3.Cursor
    return connection.execute('SELECT %s FROM %s %s;' % (', '.join(map(lambda x: '%s.%s' % (tableName, x), colList)), tableName, extra))

def queryTableCols(connection, tableName, colList):
    # type: (sqlite3.Connection, str, list) -> sqlite3.Cursor
    return queryTableColsEx(connection, tableName, colList, '')


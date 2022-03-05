# -*- coding: utf-8 -*-
import sqlite3

def connectUnitDb() -> sqlite3.Connection:
    return sqlite3.connect('unitnewjp.db_')

def connectLiveDb() -> sqlite3.Connection:
    return sqlite3.connect('livenewjp.db_')

def queryTableColsEx(connection: sqlite3.Connection, tableName: str, colList: list, extra: str) -> sqlite3.Cursor:
    return connection.execute('SELECT %s FROM %s %s;' % (', '.join(map(lambda x: '%s.%s' % (tableName, x), colList)), tableName, extra))

def queryTableCols(connection: sqlite3.Connection, tableName: str, colList: list) -> sqlite3.Cursor:
    return queryTableColsEx(connection, tableName, colList, '')


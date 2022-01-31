# -*- coding: utf-8 -*-
import os
import sys

class Translator(object):
    def __init__(self, translate_file):
        self.def_in_file = {} # [src_str]=dst_str
        self.missing = {} # [sub_str]=full_str
        if os.path.exists(translate_file):
            print('Found translate file: %s' % translate_file)
            self._readTranslateFile(translate_file)

    def exportMissing(self, missing_file):
        if sys.version[0] == '2':
            with open(missing_file, 'w') as fd:
                for k in self.missing.keys():
                    fd.write("# %s\n%s=%s\n" % (self.missing[k], k, k))
        else:
            with open(missing_file, 'w', encoding='utf-8') as fd:
                for k in self.missing.keys():
                    fd.write("# %s\n%s=%s\n" % (self.missing[k], k, k))

    def _readTranslateFile(self, path):
        if sys.version[0] == '2':
            with open(path, 'rb') as fd:
                lines = fd.read().decode('utf-8').splitlines()
            for line in lines:
                self._processTranslateLine(line)
        else:
            with open(path, 'r', encoding='utf-8') as fd:
                for line in fd:
                    self._processTranslateLine(line)

    def _processTranslateLine(self, line):
        line = line.rstrip('\r\n')
        if line.startswith('#'):
            return
        pos = line.find('=')
        if pos > 0:
            self.def_in_file[line[:pos]] = line[pos+1:]

    def translate(self, s):
        return self._translate(s, s)

    def _translate(self, s, origin):
        if s in self.def_in_file:
            return self.def_in_file[s]
        for i in range(len(s)-1, 0, -1):
            sub_s = s[:i]
            if sub_s in self.def_in_file:
                rhs = self._translate(s[i:], origin)
                if rhs is None:
                    return None
                return '%s%s' % (self.def_in_file[sub_s], rhs)
        
        if s not in self.missing:
            self.missing[s] = origin
        
        return None

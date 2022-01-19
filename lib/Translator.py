# -*- coding: utf-8 -*-
from ast import For
from asyncore import read
import os

class Translator(object):
    def __init__(self, translate_file):
        self.def_in_file = {} # [src_str]=dst_str
        self.missing = {} # [sub_str]=full_str
        if os.path.exists(translate_file):
            print('Found translate file: %s' % translate_file)
            with open(translate_file, 'r', encoding='utf-8') as fd:
                for line in fd:
                    line = line.rstrip('\r\n')
                    if line.startswith('#'):
                        continue
                    pos = line.find('=')
                    if pos > 0:
                        self.def_in_file[line[:pos]] = line[pos+1:]

    def exportMissing(self, missing_file):
        with open(missing_file, 'w', encoding='utf-8') as fd:
            for k in self.missing.keys():
                fd.write("# %s\n%s=%s\n" % (self.missing[k], k, k))

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

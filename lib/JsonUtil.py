# -*- coding: utf-8 -*-
import json
import os
from lib.PrintLogger import PrintLogger

class JsonFile(object):
    def __init__(self, filename, logger = None):
        self.filename = filename
        if logger is None:
            self.log = PrintLogger()
        else:
            self.log = logger

    def load(self):
        ret = {}
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'r') as f:
                    ret = json.load(f)
            except:
                self.log.error('Failed to load %s' % self.filename)
                raise
        else:
            self.log.info('Not found %s' % self.filename)

        return ret

    def save(self, data):
        self.log.info('Saving %s' % self.filename)
        with open(self.filename, 'w') as f:
            json.dump(data, f, sort_keys=True)

    def __str__(self):
        return self.filename

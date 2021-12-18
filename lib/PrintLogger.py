# -*- coding: utf-8 -*-

class PrintLogger(object):
    def myPrint(self, msg):
        print(msg)

    def error(self, msg):
        self.myPrint("Error: %s" % msg)

    def info(self, msg):
        self.myPrint(msg)


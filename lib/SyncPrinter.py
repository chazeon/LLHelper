# -*- coding: utf-8 -*-
import threading
from lib.PrintLogger import PrintLogger

class SyncPrinter(PrintLogger):
    def __init__(self):
        super(SyncPrinter, self).__init__()
        self.lock = threading.Lock()

    def myPrint(self, message):
        self.lock.acquire()
        print(message)
        self.lock.release()


import os
import sys

from paragon_jms.wsgi import application

# Add your site-packages directory to path
VENV_PATH = os.path.expanduser('~/virtualenv/paragon_jms/3.9/lib/python3.9/site-packages')
sys.path.insert(0, VENV_PATH) 
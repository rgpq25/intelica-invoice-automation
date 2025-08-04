import subprocess
import sys

try:
    import pdfkit
    import jinja2
    import pandas
    import openpyxl
    import xlsxwriter
    import xlrd
except ImportError:
    print("One or more required packages are missing. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", 'pdfkit'])
    subprocess.check_call([sys.executable, "-m", "pip", "install", 'jinja2'])
    subprocess.check_call([sys.executable, "-m", "pip", "install", 'pandas'])
    subprocess.check_call([sys.executable, "-m", "pip", "install", 'openpyxl'])
    subprocess.check_call([sys.executable, "-m", "pip", "install", 'xlsxwriter'])
    subprocess.check_call([sys.executable, "-m", "pip", "install", 'xlrd'])

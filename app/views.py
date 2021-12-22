from flask import render_template,request, url_for, jsonify, redirect, Response, send_from_directory
from app import app
from app import APP_STATIC
from app import APP_ROOT
import json
import numpy as np
import pandas as pd
import os
import re
import math

@app.route('/')
@app.route('/VIS-DSMT-app')
def index():
    return render_template('vis-dsmt.html')
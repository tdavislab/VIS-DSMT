from flask import Flask
from flask_assets import Bundle, Environment
from .. import app

bundles = {
    'js': Bundle(
        'js/d3.js',
        'js/read.js',
        'js/DMT.js',
        'js/DMT2.js',
        'js/DMT3.js',
        'js/script.js',
        output='gen/script.js'
        ),

        'css': Bundle(
        'css/style.css',
        'css/bootstrap.min.css',
        # 'css/bootstrap.css',
        output='gen/styles.css'
        )
}

assets = Environment(app)

assets.register(bundles)
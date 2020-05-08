const express = require('express')
const path = require('path');

const app = express();

// const bf = require('browserify')

app.use('/static', express.static('public'))

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/home.html'))
}).listen(3000);

console.log("Hosting local server at http://localhost:3000/")


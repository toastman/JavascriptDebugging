'use strict';

var express = require('express')
    ,request = require('request')
    ,path = require('path')
    ,publicPath = path.join(__dirname, '/public')
    ,app = express()
    ,server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000
    ,server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
    ,loremIpsum = require('lorem-ipsum');

app.use('/data', function (req, res) {
    var url = 'http://private-aa10d-global1.apiary-mock.com/poll/1';
    req.pipe(request(url)).pipe(res);
});

app.use('/text', function (req, res) {
    var letterCount = getRandomInt(2, 100);
    res.json({
        "letterCount": letterCount,
        "text": loremIpsum({ count: letterCount })
    });
});

app.use('/', express.static(publicPath));

var server = app.listen(server_port, server_ip_address, infoLog);

function infoLog() {
  var host = server.address().address,
      port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
}

// Used to get random word from LoremIpsum text
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


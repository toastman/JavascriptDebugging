var express = require('express'),
    request = require('request'),
    app = express(),
    server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080,
    server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

app.use('/data', function (req, res) {
    var url = 'http://private-aa10d-global1.apiary-mock.com/poll/1';
    req.pipe(request(url)).pipe(res);
});

var server = app.listen(server_port, server_ip_address, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

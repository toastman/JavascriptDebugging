var express = require('express'),
    request = require('request'),
    app = express(),
    appPort = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;

app.use('/data', function (req, res) {
    var url = 'http://private-aa10d-global1.apiary-mock.com/poll/1';
    req.pipe(request(url)).pipe(res);
});

app.listen(appPort, function () {
    console.log('Server is up and running on %d port', appPort);
});

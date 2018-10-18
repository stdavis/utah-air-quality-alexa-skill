var alexa = require('alexa-app');
var burnday = require('burnday');

var app = new alexa.app('utahburnday');

app.launch((req, res) => {
    return burnday('Salt Lake').then((response) => {
        res.say(`Today is a ${response.color} day in ${response.county} county`);
    }, (error) => {
        res.say(error.message);
    });
});

exports.handler = app.lambda();

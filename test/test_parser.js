var parser = require('../parser');
var expect = require('chai').expect;
var fs = require('fs');
var moment = require('moment');


describe('parser', function () {
    it('should return matching data from the CSV', function () {
        var csv = fs.readFileSync('test/data/forcast.csv', 'utf8');
        expect(parser(csv, moment('2017-04-05').toDate(), 'Salt Lake')).to.deep.equal({
            color: 'orange'
        });
        expect(parser(csv, moment('2017-04-05').toDate(), 'Utah')).to.deep.equal({
            color: 'yellow'
        });
        expect(parser(csv, moment('2017-04-05').toDate(), 'Davis')).to.deep.equal({
            color: 'green'
        });
    });
});

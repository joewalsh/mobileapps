'use strict';


const preq   = require('preq');
const assert = require('../../utils/assert.js');
const server = require('../../utils/server.js');
const headers = require('../../utils/headers.js');


describe('announcements', function() {

    this.timeout(20000);

    before(function () { return server.start(); });

    it('should respond to GET request with expected headers, incl. CORS and CSP headers', function() {
            return headers.checkHeaders(server.config.uri + 'en.wikipedia.org/v1/feed/announcements');
        });

    it('should return a valid response ', function() {
        return preq.get({ uri: server.config.uri + 'en.wikipedia.org/v1/feed/announcements' })
            .then(function(res) {
                assert.status(res, 200);
                res.body.announce.forEach(function (elem) {
                    assert.ok(elem.id, 'id should be present');
                    assert.ok(elem.type, 'type should be present');
                    assert.ok(elem.start_time, 'start_time should be present');
                    assert.ok(elem.end_time, 'end_time should be present');
                    assert.ok(elem.text, 'text should be present');
                    assert.ok(elem.action.title, 'action text should be present');
                    assert.ok(elem.action.url, 'action url should be present');
                    assert.ok(elem.caption_HTML, 'caption_HTML should be present');
                    assert.ok(elem.countries, 'countries should be present');
                });
            });
    });

    it('should return two surveys', function() {
        return preq.get({ uri: server.config.uri + 'en.wikipedia.org/v1/feed/announcements' })
            .then(function(res) {
                assert.ok(res.body.announce.length == 2);
                assert.equal(res.body.announce[0].id, 'EN1116SURVEYIOS');
                assert.equal(res.body.announce[1].id, 'EN11116SURVEYANDROID');
            });
    });
});
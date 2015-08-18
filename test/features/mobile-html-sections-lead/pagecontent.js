'use strict';

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

var assert = require('../../utils/assert.js');
var preq   = require('preq');
var server = require('../../utils/server.js');
var headers = require('../../utils/headers.js');

describe('mobile-html-sections-lead', function() {
    this.timeout(20000);

    before(function () { return server.start(); });

    it('should respond to GET request with expected headers, incl. CORS and CSP headers', function() {
        return headers.checkHeaders(server.config.uri + 'test.wikipedia.org/v1/page/mobile-html-sections-lead/Test',
            'application/json');
    });
    it('Test page should have a lead object with expected properties', function() {
        return preq.get({ uri: server.config.uri + 'test.wikipedia.org/v1/page/mobile-html-sections-lead/Test' })
            .then(function(res) {
                var lead = res.body;
                assert.deepEqual(res.status, 200);
                assert.ok(lead.lastmodified.startsWith('201'), lead.lastmodified + ' should start with 201'); // 2015-
                assert.deepEqual(lead.displaytitle, 'Test');
                assert.deepEqual(lead.protection, []);
                assert.deepEqual(lead.editable, true);
                assert.deepEqual(lead.image, {});
                assert.ok(lead.sections.length > 0, 'Expected at least one section element');
                assert.deepEqual(lead.sections[0].id, 0);
                assert.ok(lead.sections[0].text.length > 0, 'Expected text to be non-empty');
            });
    });
    it('en Main page should have a lead object with expected properties', function() {
        return preq.get({ uri: server.config.uri + 'en.wikipedia.org/v1/page/mobile-html-sections-lead/Main_Page' })
            .then(function(res) {
                var lead = res.body;
                assert.deepEqual(res.status, 200);
                assert.ok(lead.lastmodified.startsWith('201'), lead.lastmodified + ' should start with 201'); // 2015-
                assert.deepEqual(lead.displaytitle, 'Main Page');
                assert.deepEqual(lead.protection, {
                    "edit": [
                        "sysop"
                    ],
                    "move": [
                        "sysop"
                    ]
                });
                assert.deepEqual(lead.editable, false);
                assert.deepEqual(lead.image, {});
                assert.ok(lead.sections.length > 0, 'Expected at least one section element');
                assert.deepEqual(lead.sections[0].id, 0);
                assert.ok(lead.sections[0].text.length > 0, 'Expected text to be non-empty');
            });
    });
    it('Obama (redirect) should have a lead image', function() {
        return preq.get({ uri: server.config.uri + 'en.wikipedia.org/v1/page/mobile-html-sections-lead/Obama' })
            .then(function(res) {
                var lead = res.body;
                assert.deepEqual(res.status, 200);
                assert.contains(lead.image.file, "Obama");
                assert.contains(lead.image.urls["640"], "//upload.wikimedia.org/wikipedia/commons/thumb");
                assert.contains(lead.image.urls["640"], "640px-");
                assert.contains(lead.image.urls["800"], "//upload.wikimedia.org/wikipedia/commons/thumb");
                assert.contains(lead.image.urls["800"], "800px-");
                assert.contains(lead.image.urls["1024"], "//upload.wikimedia.org/wikipedia/commons/thumb");
                assert.contains(lead.image.urls["1024"], "1024px-");
            });
    });
});
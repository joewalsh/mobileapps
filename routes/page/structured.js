'use strict';

const BBPromise = require('bluebird');
const sUtil = require('../../lib/util');
const mUtil = require('../../lib/mobile-util');
const parsoid = require('../../lib/parsoid-access');
const StructuredPage = require('../../lib/structured/StructuredPage');
const api = require('../../lib/api-util');

/**
 * The main router object
 */
const router = sUtil.router();

/**
 * The main application object reported when this module is require()d
 */
let app;

function structuredPagePromiseFromHTML(app, req, res, html) {
    const meta = parsoid.getRevAndTidFromEtag(res.headers) || {};
    meta._headers = {
        'Content-Language': res.headers && res.headers['content-language'],
        Vary: res.headers && res.headers.vary
    };
    meta.baseURI = mUtil.getMetaWikiRESTBaseAPIURI(app, req);
    return BBPromise.props({
        doc: mUtil.createDocument(html)
    }).then((props) => {
        return new StructuredPage(props.doc, meta).promise;
    });
}

/**
 * @param {!Object} app the application object
 * @param {!Object} req the request object
 * @return {!promise} Returns a promise to retrieve the page content from Parsoid
 */
function structuredPagePromise(app, req) {
    return parsoid.getParsoidHtml(req)
        .then((res) => {
            return structuredPagePromiseFromHTML(app, req, res, res.body);
        });
}

function getPageSummary(req, title) {
    const path = `page/summary/${encodeURIComponent(title)}`;
    const restReq = {
        headers: {
            'accept-language': req.headers['accept-language']
        }
    };
    return api.restApiGet(req, path, restReq);
}

/**
 * GET {domain}/v1/page/metadata/{title}{/revision}{/tid}
 * Gets extended metadata for a given wiki page.
 */
router.get('/structured/:title/:revision?/:tid?', (req, res) => {
    return BBPromise.props({
        structuredPage: structuredPagePromise(app, req),
        // mw: mwapi.getMetadataForMobileHtml(req)
    }).then((response) => {
        const linkedTitles = response.structuredPage.output.linkedTitles;
        const keys = Object.keys(linkedTitles);
        for (var i = 0; i < keys.length; i++) {
            const title = keys[i];
            linkedTitles[title] = getPageSummary(req, title).then(res => {
                return res;
            }, rej => {
                return {};
            });
        }
        // response.mobileHTML.addMediaWikiMetadata(response.mw);
        return BBPromise.props(linkedTitles).then((summariesByTitle) => {
            const keys = Object.keys(linkedTitles);
            for (var i = 0; i < keys.length; i++) {
                const title = keys[i];
                const summaryResponse = summariesByTitle[title];
                if (!summaryResponse
                    || !summaryResponse.body
                    || !summaryResponse.body.wikibase_item) {
                    delete linkedTitles[title];
                    continue;
                }
                linkedTitles[title] = summaryResponse.body.wikibase_item;
            }
            return response.structuredPage;
        });
    }).then((structuredPage) => {
        res.status(200);
        mUtil.setContentType(res, mUtil.CONTENT_TYPES.structuredPage);
        mUtil.setETag(res, structuredPage.metadata.revision);
        mUtil.setLanguageHeaders(res, structuredPage.metadata._headers);
        mUtil.setContentSecurityPolicy(res, app.conf.mobile_html_csp);
        res.json(structuredPage.output).end();
        if (structuredPage.processingTime) {
            app.metrics.timing('page_structured.processing', structuredPage.processingTime);
        }
    });
});

module.exports = function(appObj) {
    app = appObj;
    return {
        path: '/page',
        api_version: 1,
        router
    };
};

/* eslint-disable max-len */

'use strict';

const assert = require('../../utils/assert');
const media = require('../../../lib/media');

const imageFigure = '<figure typeof="mw:Image"><img resource="./File:A"/></figure>';
const imageSpan = '<span typeof="mw:Image"><img resource="./File:B"/></span>';
const imageFigureInline = '<figure-inline typeof="mw:Image"><img resource="./File:C"/></figure-inline>';

const imageThumbFigure = '<figure typeof="mw:Image/Thumb"><img resource="./File:D"/></figure>';
const imageThumbSpan = '<span typeof="mw:Image/Thumb"><img resource="./File:E"/></span>';
const imageThumbFigureInline = '<figure-inline typeof="mw:Image/Thumb"><img resource="./File:F"/></figure-inline>';

const videoFigure = '<figure typeof="mw:Video"><video resource="./File:G"/></figure>';
const videoSpan = '<span typeof="mw:Video"><video resource="./File:H"/></span>';
const videoFigureInline = '<figure-inline typeof="mw:Video"><video resource="./File:I"/></figure-inline>';

const videoThumbFigure = '<figure typeof="mw:Video/Thumb"><video resource="./File:J"/></figure>';
const videoThumbSpan = '<span typeof="mw:Video/Thumb"><video resource="./File:K"/></span>';
const videoThumbFigureInline = '<figure-inline typeof="mw:Video/Thumb"><video resource="./File:L"/></figure-inline>';

const audioFigure = '<figure typeof="mw:Audio"><video resource="./File:M"/></figure>';
const audioSpan = '<span typeof="mw:Audio"><video resource="./File:N"/></span>';
const audioFigureInline = '<figure-inline typeof="mw:Audio"><video resource="./File:O"/></figure-inline>';

const noTypeFigure = '<figure><video resource="./File:P"/></figure>';
const noTypeSpan = '<span><video resource="./File:Q"/></span>';
const noTypeFigureInline = '<figure-inline><video resource="./File:R"/></figure-inline>';

const imageNoViewer = '<figure typeof="mw:Image" class="noviewer"><img resource="./File:S"/></figure>';
const imageMetadata = '<span class="metadata"><figure typeof="mw:Image"><img resource="./File:T"/></figure></span>';

const images = [imageFigure, imageSpan, imageFigureInline, imageThumbFigure, imageThumbSpan, imageThumbFigureInline];
const videos = [videoFigure, videoSpan, videoFigureInline, videoThumbFigure, videoThumbSpan, videoThumbFigureInline];
const audio = [audioFigure, audioSpan, audioFigureInline];
const validItems = images.concat(videos).concat(audio);

const noType = [noTypeFigure, noTypeSpan, noTypeFigureInline];
const blacklisted = [imageNoViewer, imageMetadata];
const invalidItems = noType.concat(blacklisted);

describe('lib:media expected items are included or excluded', () => {

    it('items should be found for expected selectors', () => {
        const page = validItems.join('');
        const result = media.getMediaItemInfoFromPage(page);
        assert.deepEqual(result.length, validItems.length);
        assert.deepEqual(result.filter(i => i.type === media.Image.name).length, images.length);
        assert.deepEqual(result.filter(i => i.type === media.Video.name).length, videos.length);
        assert.deepEqual(result.filter(i => i.type === media.Audio.name).length, audio.length);
    });

    it('items should not be found for other selectors', () => {
        const page = invalidItems.join('');
        const result = media.getMediaItemInfoFromPage(page);
        assert.deepEqual(result.length, 0);
    });

});

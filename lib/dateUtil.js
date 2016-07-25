'use strict';

var sUtil = require('../lib/util');
var HTTPError = sUtil.HTTPError;

var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

var dateUtil = {};

dateUtil.ONE_DAY = 86400000;

/**
 * Returns a String formatted in English date format.
 *
 * Example: "May 16, 2016"
 *
 * @param {Date} date date to be used
 * @return {String} formatted date string
 */
dateUtil.formatDateEnglish = function(date) {
    var year = date.getUTCFullYear().toString();
    var month = monthNames[date.getUTCMonth()];
    var day  = date.getUTCDate().toString();
    return `${month} ${day}, ${year}`;
};

/**
 * Returns a Date object with the desired date as specified in the request.
 * The expected format is "yyyy/mm/dd".
 *
 * Example: "2016/05/11"
 *
 * @param {Object} req Object (looking for params property with subproperties yyyy, mm, dd.
 * @return {Date} date object
 */
dateUtil.getRequestedDate = function(req) {
    return new Date(Date.UTC(req.params.yyyy, req.params.mm - 1, req.params.dd)); // month is 0-based
};

dateUtil.dateStringFrom = function(req) {
    return req.params.yyyy + req.params.mm + req.params.dd;
};

dateUtil.hyphenDelimitedDateString = function(req) {
    return req.params.yyyy + '-' + req.params.mm + '-' + req.params.dd;
};

dateUtil.iso8601DateFrom = function(req) {
    return req.params.yyyy + '-' + req.params.mm + '-' + req.params.dd + 'Z';
};

dateUtil.pad = function(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
};

/**
 * Returns a String formatted in ISO date format -- just the date. Timezone is UTC.
 * This is similar to Date.toISOString() but without the time and time zone portions.
 *
 * Example: "2016-05-16"
 *
 * @param {Date} date date to be used
 * @return {String} formatted date string
 */
dateUtil.formatISODate = function(date) {
    return date.getUTCFullYear() +
    '-' + dateUtil.pad(date.getUTCMonth() + 1) +
    '-' + dateUtil.pad(date.getUTCDate());
};

//Validate the input date by checking whether UTC-format constructed from the
//input components matches the values actually provided.
dateUtil.isValidDate = function(dateString, year, month, day) {
    return new Date(Date.UTC(year, month-1, day)).toISOString().split('T').shift() === dateString;
};

//Check that @param year is in the interval (2001 <= year <= (current year + 1))
dateUtil.isWithinBounds = function(year) {
    return year >= 2001 && year <= new Date().getUTCFullYear() + 1;
};

dateUtil.throwDateError = function() {
    throw new HTTPError({
        status: 404,
        type: 'not_found',
        title: 'Not found.',
        detail: 'Invalid date provided.  Please request a valid date of format yyyy\/mm\/dd'
    });
};

// Validates that the input string is a valid date in the expected format
dateUtil.validate = function(dateString) {
    var parts = dateString.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);

    try {
        if (!(dateUtil.isValidDate(dateString, year, month, day) && dateUtil.isWithinBounds(year))) {
            dateUtil.throwDateError();
        }
    } catch (error) {
        dateUtil.throwDateError();
    }
};

module.exports = dateUtil;
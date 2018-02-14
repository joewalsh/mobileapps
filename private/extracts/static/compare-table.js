'use strict';

/* global document */
/* eslint-disable no-console */
/* jshint browser: true */

function toggleShow() {
    const show = document.querySelector('#showSameCB').checked;
    const elements = document.querySelectorAll('.same');
    elements.forEach((element) => {
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#showSameCB').onchange = toggleShow;
    toggleShow();
}, false);
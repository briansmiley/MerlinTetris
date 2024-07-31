"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merlinButton = void 0;
var merlinButton = function (callback, midiCode, keyCode) {
    var button = createButton(midiCode);
    button.mousePressed(callback);
    window.addEventListener("keydown", function (event) {
        if (event.key === keyCode) {
            callback();
        }
    });
};
exports.merlinButton = merlinButton;

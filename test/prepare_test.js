"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepare_test = prepare_test;
const test_utils_1 = require("./test_utils");
async function prepare_test() {
    await (0, test_utils_1.mintToken)();
    await (0, test_utils_1.addToken)();
}

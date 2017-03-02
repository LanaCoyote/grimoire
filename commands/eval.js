const Promise = require('bluebird');

const log = require('../lib/log');
const config = require('../config.json');
const tokenRegex = new RegExp(config.token, 'g');
const MAX_LENGTH = 800;

let _;

function evaluate(message, params) {
    let outputMessage = true;
    if (params[0] === "silent") {
        outputMessage = false;
        params = params.splice(1);
    }
    let expression = params.join(' ');
    let process = {}, module = {}, config = undefined, tokenRegex = undefined; // hide the scope
    if (!outputMessage) log.info("Eval input:\n", message.content);
    try {
        let result = eval(expression.includes(';') ? expression : `(${expression})`);
        _ = result;
        result = convertResult(result);
        if (!outputMessage) return Promise.resolve(log.info("Eval result:\n", result))
            .then(() => message.delete());
        if (_ && _.then) {
            let startTime = Date.now();
            return Promise.join(
                message.edit("▶ **Input:**\n```js\n" + expression + "```\n ☑ **Output:**\n```js\n" + truncate(result.toString(), MAX_LENGTH) + "```"),
                _.catch(err => err),
                (message, outcome) => {
                    let runtime = Date.now() - startTime;
                    let header = outcome instanceof Error ? "Rejection" : "Resolution";
                    outcome = convertResult(outcome);
                    return message.edit(message.content + "\n 🕒 **" + header + ":** in " + runtime + "ms\n```js\n"
                            + truncate(outcome.toString(), MAX_LENGTH) + "```");
                });
        } else {
            return message.edit("▶ **Input:**\n```js\n" + expression + "```\n ☑ **Output:**\n```js\n" + truncate(result.toString(), MAX_LENGTH) + "```");
        }
    } catch (err) {
        return outputMessage ?
            message.edit("▶ **Input:**\n```js\n" + expression + "```\n 💔 **Error:**\n```js\n" + truncate(err.toString(), MAX_LENGTH) + "```") :
            Promise.resolve(log.error("Error in eval:", err)).then(() => message.delete());
    }
}

function convertResult(result) {
    if (typeof result === "string") return result.replace(tokenRegex, "[ CANT SHOW THAT IN A CHRISTIAN MANGA ]");
    if (result === null) return "null";
    if (result === undefined) return "undefined";
    if (typeof result === 'function') return `[function ${result.name}]`;
    if (result.toString() === '[object Object]') return weakStringify(result);
    if (Array.isArray(result)) return weakStringify(result.map(convertResult));
    if (!result.toString()) return "''";
    return result;
}

function weakStringify(obj) {
    try {
        return JSON.stringify(obj, null, 4);
    } catch (err) {
        log.error("Error stringifying eval result:", err.message);
        if (err.message.startsWith("Converting circular structure to JSON"))
            return "[object " + (obj.constructor ? obj.constructor.name : "Unknown") + ']';
        return obj;
    }
}

function truncate(str, len) {
    if (str.length < len) return str;
    return str.substr(0, len - 3) + "...";
}

module.exports = {
    alias: ['eval'],
    handler: evaluate,

    help: {
        name: "Eval",
        usage: ";eval [code]",
        description: "Evaluates JavaScript code"
    }
};
const Promise = require('bluebird');

const log = require('../lib/log');

let _;

function evaluate(message, params) {
    let outputMessage = true;
    if (params[0] === "silent") {
        outputMessage = false;
        params = params.splice(1);
    }
    let expression = params.join(' ');
    let process = {}, module = {}; // hide the scope
    if (!outputMessage) log.info("Eval input:\n", message.content);
    if (!expression.includes(';')) expression = `(${expression})`;
    try {
        let result = eval(expression);
        _ = result;
        result = convertResult(result);
        if (!outputMessage) return Promise.resolve(log.info("Eval result:\n", result))
            .then(() => message.delete());
        if (_ && _.then) {
            let startTime = Date.now();
            return Promise.join(
                message.edit("▶ **Input:**\n```js\n" + expression + "```\n ☑ **Output:**\n```js\n" + result.toString() + "```"),
                _.catch(err => err),
                (message, outcome) => {
                    let runtime = Date.now() - startTime;
                    let header = outcome instanceof Error ? "Rejection" : "Resolution";
                    outcome = convertResult(outcome);
                    return message.edit(message.content + "\n 🕒 **" + header + ":** in " + runtime + "ms\n```js\n"
                            + outcome.toString() + "```");
                });
        } else {
            return message.edit("▶ **Input:**\n```js\n" + expression + "```\n ☑ **Output:**\n```js\n" + result.toString() + "```");
        }
    } catch (err) {
        return outputMessage ?
            message.edit("▶ **Input:**\n```js\n" + expression + "```\n 💔 **Error:**\n```js\n" + err.toString() + "```") :
            Promise.resolve(log.error("Error in eval:", err)).then(() => message.delete());
    }
}

function convertResult(result) {
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
        return obj;
    }
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
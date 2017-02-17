const Promise = require('bluebird');

function evaluate(message, params) {
    let expression = params.join(' ');
    let process = {}, module = {}; // hide the scope
    try {
        let result = eval(`(${expression})`);
        if (result === null) result = "null";
        if (result === undefined) result = "undefined";
        if (typeof result === 'function') result = `[function ${result.name}]`;
        if (result.toString() === '[object Object]') result = JSON.stringify(result, null, 4);
        return message.edit("▶ **Input:**\n```js\n" + expression
            + "```\n ☑ **Output:**\n```js\n" + result.toString() + "```");
    } catch (err) {
        return message.edit("▶ **Input:**\n```js\n" + expression
            + "```\n 💔 **Error:**\n```js\n" + err.toString() + "```");
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
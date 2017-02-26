const log = require('../lib/log');

const CODEBLOCK_REGEX = /```(?:.|\n)+?```/;

function snippet(message, params) {
    let searchMessage;
    if (!params[0]) {
        searchMessage = message.channel.messages.find(messageContainsCodeblock);
        if (!searchMessage) return message.reply("Couldn't find a message with a code block!")
    } else {
        searchMessage = message.channel.messages.get(params[0]);
        if (!searchMessage) return message.reply("Could not find message at ID " + params[0]);
    }

    codeBlock = searchMessage.content.match(CODEBLOCK_REGEX);
    if (!codeBlock || !codeBlock[0]) return message.reply("That message doesn't contain a code block!");

    return message.channel.send(codeBlock[0]);
}

function messageContainsCodeblock(message) {
    return CODEBLOCK_REGEX.test(message);
}

module.exports = {
    alias: ["snip", "snippet"],
    handler: snippet
};
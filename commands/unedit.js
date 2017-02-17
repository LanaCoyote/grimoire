const Promise = require('bluebird');

const log = require('../lib/log');

function unedit(message, params) {
    let messageId = params[0];
    return getMessageToUnedit(message, messageId)
        .then(msgToUnedit => {
            let messageOptions = {};
            if (!msgToUnedit) {
                log.warn("Unedit could not find message:", messageId);
                if (messageId) messageOptions.embed = createEmbed("Could not find a message by that ID");
                else messageOptions.embed = createEmbed("Could not find a message with cached edits");
            } else {
                let edits = msgToUnedit.edits;
                if (edits.length > 3) {
                    let original = edits.pop();
                    edits = edits.slice(0, 3).concat([original]);
                }
                messageOptions.embed =
                    createEmbed(`Old versions of ${msgToUnedit.author.username}'s message`, edits, msgToUnedit);
            }

            return message.edit(message.content, messageOptions)
        });
}

function getMessageToUnedit(message, id) {
    return new Promise((ok, fail) => {
        if (id) return ok(message.channel.messages.get(id));
        else return ok(message.channel.messages.filter(msg => msg.edits.length > 1).last());
    });
}

function createEmbed(title, edits, original) {
    if (!edits) return {title, color: 0xFF0000};
    let description = edits.map((edit,idx) => {
        if (idx === edits.length - 1) return "Original Message: " + edit.content;
        return (edit.editedAt || edit.createdAt || new Date()).toISOString() + ": " + edit.content;
    }).join('\n');
    return {title, color: 0x00AAFF, description}
}

module.exports = {
    alias: ['u', 'unedit'],
    handler: unedit,

    help: {
        name: "Unedit",
        usage: ";u|;unedit [MessageId (optional)]",
        description: "Gets previous versions of an edited message"
    }
};

const log = require('../lib/log');

const CODEBLOCK_REGEX = /```(?:.|\n)+?```/;
const COUNTERPART_BLOCKS = {'}':'{', ')':'(', ']':'['};

class SnippetError extends TypeError {
    constructor(message) {
        super(message);
    }
}

function snippet(message, params) {
    let searchMessage;
    if (!params[0] || params[0] === "last") {
        if (params[0]) params.shift();
        searchMessage = message.channel.messages.filter(messageContainsCodeblock).last();
        if (!searchMessage) return message.reply("Couldn't find a message with a code block!")
    } else {
        searchMessage = message.channel.messages.get(params.shift());
        if (!searchMessage) return message.reply("Could not find message at ID " + params[0]);
    }

    codeBlock = searchMessage.content.match(CODEBLOCK_REGEX);
    if (!codeBlock || !codeBlock[0]) return message.reply("That message doesn't contain a code block!");
    try {
        let snippet = mutateSnippet(codeBlock[0], params);
        return message.channel.send(`Code Snippet by ${searchMessage.author} at ${searchMessage.createdAt.toLocaleString()}:\n${snippet}`)
            .catch(err => log.error("Error sending snippet:", err));
    } catch (err) {
        log.error("Error mutating snippet:", (err instanceof SnippetError) ? err.message : err);
        if (err instanceof SnippetError) message.reply("Snippet Error - " + err.message);
    }
}

function messageContainsCodeblock(message) {
    return CODEBLOCK_REGEX.test(message);
}

function mutateSnippet(snippet, params) {
    let mode = null;
    params.forEach((param, idx) => {
        switch (mode) {
            case "line" :
                let range = param.split('-').map(r => parseInt(r));

                if (range.length === 1 && !!range[0])   // ex: ;snippet <id> line 10
                    snippet = snippet.split('\n')[range[0]];
                else if (range.length === 2 && !!range[0] && !!range[1])    // ex: ;snippet <id> lines 1-5
                    snippet = snippet.split('\n').slice(range[0], ++range[1]).join('\n');
                else
                    throw new SnippetError("Invalid parameter for 'line': " + param);
                if (!snippet.startsWith("```")) snippet = "```\n" + snippet;
                if (!snippet.endsWith("```")) snippet = snippet + "```";
                mode = null;
                break;
            case "lang" :
                if (/\s\w+/.test(snippet.split('\n')[0])) snippet.replace("```", "```" + param + '\n');
                else snippet = ["```" + param].concat(snippet.split('\n').slice(1)).join('\n');
                mode = null;
                break;
            case "beautify" :
                if (parseInt(param)) {
                    snippet = beautify(snippet, parseInt(param));
                    break;
                } else snippet = beautify(snippet);
                // intentional fallthrough
            default :
                if (param === "line" || param === "lines") mode = "line";
                else if (param === "lang") mode = "lang";
                else if (param === "beautify") {
                    mode = "beautify";
                    if (idx === params.length - 1) snippet = beautify(snippet);
                }
                else throw new SnippetError("Unknown mutate mode specified: " + param);
        }
    });
    return snippet;
}

function beautify(snippet, indent) {
    let openBlocks = [];
    return snippet.split('\n').map(line => {
        const newBlocks = line.match(/\{|\(|\[/g) || [];
        (line.match(/}|\)|]/g) || []).forEach(closer => {
            const newBlocksIdx = newBlocks.lastIndexOf(COUNTERPART_BLOCKS[closer]);
            if (~newBlocksIdx) newBlocks.splice(newBlocksIdx, 1);
            else {
                const openBlocksIdx = openBlocks.lastIndexOf(COUNTERPART_BLOCKS[closer])
                if (~openBlocksIdx) openBlocks.splice(openBlocksIdx, 1);
            }
        });
        line = line.replace(/^\s*/, spacer(openBlocks.length * (indent || 2)));
        openBlocks = openBlocks.concat(newBlocks);
        return line;
    }).join('\n');
}

function spacer(length) {
    return new Array(length + 1).join(' ');
}

module.exports = {
    alias: ["snip", "snippet"],
    handler: snippet,

    help: {
        name: "Snippet",
        usage: ";snip | ;snippet last | <message id> [line | lines <start>[-<end>]] [lang <language>] [beautify [<indent size>]]",
        description: "Quotes and mutates a code block"
    }
};
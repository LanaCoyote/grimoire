const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');

const log = require('../../lib/log');

const SEARCH_PATH = __dirname;
let searchSources;

function loadSearchSources() {
    if (searchSources) return Promise.resolve(searchSources);

    log.debug("Loading search sources in", SEARCH_PATH, "...");
    return new Promise((ok, fail) => fs.readdir(SEARCH_PATH, (err, files) => err ? fail(err) : ok(files)))
        .map(fileToSource)
        .then(sources => sources.filter(src => !!src))
        .tap(sources => {
            searchSources = sources;
            log.debug("Loaded", sources.length, "search sources successfully!");
        });
}

function fileToSource(filename) {
    if (filename === "index.js") return;
    let splitname = filename.split('.');
    let extension = splitname.pop();
    if (splitname.length && extension !== 'js' && extension !== 'node') return;

    try {
        let searchDef = require('./' + filename);
        if (!(typeof searchDef.search === "function" && searchDef.alias.length))
            return log.error("Search definition not exported:", filename);
        return searchDef;
    } catch (err) {
        if (err.message.startsWith("Cannot find module")) return log.error("Invalid node module:", filename);
        log.error("Error loading search source:", err.stack);
    }
}

function search(message, params) {
    let sourceName;
    if (!params[0]) return help(message);
    return loadSearchSources()
        .then(sources => {
            let source = _.find(sources, src => !!~src.alias.indexOf(params[0].toLowerCase()));
            sourceName = source ? source.description || source.alias[source.alias.length - 1] : params[0];
            if (!source) return log.error("No search source found for", params[0]);
            return source.search(message, params.slice(1));
        })
        .then(result => {
            if (!result) return message.channel.sendMessage(`No search source found for ${sourceName}`);
            let searchString = params.slice(1).join(' ');
            let contentString = `Showing results from ${sourceName} for "${searchString}"`;
            return message.channel.sendEmbed(result, contentString);
        });
}

function help(message) {
    let messageString = "Usage: ;search [sourcename] [string to search...]";
    return loadSearchSources()
        .then(sources => {
            messageString += "\nAvailable Sources: " + sources
                    .map(source => {
                        let sourceString = source.alias[source.alias.length - 1];
                        if (source.alias.length > 1) sourceString += " (" + source.alias.slice(0, -1).join(' ') + ")";
                        return sourceString;
                    })
                    .join(', ');
            return message.channel.sendMessage(messageString);
        })
}

loadSearchSources();
module.exports = {
    alias: ['s', 'search'],
    handler: search,
};

const _ = require('lodash');
const Promise = require('bluebird');
const request = require('request-promise');
const RichEmbed = require('discord.js').RichEmbed;

const config = require('../../config.json');
const log = require('../../lib/log');

const API_CARDS_ROUTE = "https://netrunnerdb.com/api/2.0/public/cards";
const UI_CARD_ROUTE = "https://netrunnerdb.com/en/card/";
const TOKENS_TO_FIELDS = {
    a: "flavor",
    d: "side_code",
    e: "pack_code",
    f: "faction_code",
    i: "illustrator",
    n: "faction_cost",
    o: "cost",
    p: "strength",
    s: "keywords",
    t: "type_code",
    u: "uniqueness",
    x: "text",
    y: "quantity"
};
const MARKDOWN_TO_TAGS = {
    "**" : /<\/?strong>/g,
    ":credit:" : /\[credit]/g,
    ":recurring-credit:" : /\[recurring-credit]/g,
    ":click:" : /\[click]/g,
    ":trash:" : /\[trash]/g,
    ":subroutine:" : /\[subroutine]/g,
    ":mu:" : /\[mu]/g,
    ":link:" : /\[link]/g
};

const refreshCardCashUnload = _.debounce(unloadCache, config.cache_timeout || 1000 * 60 * 15);

let cardCache;
let cardImageURI;

class NetrunnerError extends Error {
    constructor(message, params) {
        super(message);
        this.query = params ? params.join(' ') : null;
    }
}

function getCardCache() {
    if (cardCache) return Promise.resolve(cardCache);

    log.debug("Loading cards from NetrunnerDB...");
    return request({uri: API_CARDS_ROUTE, json: true})
        .then(json => {
            log.debug("Route responded successfully. Got " + json.data.length + " cards.");
            cardImageURI = json.imageUrlTemplate;
            refreshCardCashUnload();
            return (cardCache = json);
        })
        .catch(err => {
            log.error("NetrunnerDB API request failed:", err);
            return {};
        });
}

function searchForCard(message, params) {
    let query = buildQuery(params);

    return getCardCache().then(cards => {
        return _.filter(cards.data, card => {
            for (let key in query) {
                let cardValue = card[key], compareValue = query[key];
                let compareRegex = new RegExp(compareValue.replace(' ', '\\s(.+\\s)?'), 'i');
                log.debug(compareRegex.toString());
                if (typeof cardValue === 'string') {
                    if (!compareRegex.test(cardValue)) return false;
                }
                else if (cardValue != compareValue) return false;
            }
            return true;
        });
    }).then(results => {
        let embed = new RichEmbed()
            .setAuthor("NetrunnerDB", "https://netrunnerdb.com/");

        if (!results.length) {
            return embed.setDescription("No results found for '" + params.join(' ') + "'.");
        } else if (results.length === 1) {
            embed.setTitle(results[0].title + (results[0].uniqueness ? " ♦" : ""))
                .setURL(UI_CARD_ROUTE + results[0].code)
                .setDescription(getDescription(results[0]))
                .setImage(cardImageURI.replace("{code}", results[0].code));

            if (results[0].cost) embed.addField("Cost", results[0].cost, true);
            if (results[0].faction_cost) embed.addField("Influence", results[0].faction_cost, true);
            if (results[0].influence_limit) embed.addField("Influence", results[0].influence_limit, true);
            if (results[0].minimum_deck_size) embed.addField("Deck Size", results[0].minimum_deck_size, true);
            if (results[0].base_link !== undefined) embed.addField("Base Link", results[0].base_link, true);
            if (results[0].memory_cost) embed.addField("Memory", results[0].memory_cost, true);
            if (results[0].strength) embed.addField("Strength", results[0].strength, true);
            if (results[0].trash_cost) embed.addField("Trash Cost", results[0].trash_cost, true);
            if (results[0].flavor) embed.setFooter(results[0].flavor);

            return embed;
        } else {
            embed.setTitle(results.length.toString() + " results found for '" + params.join(' ') + "'.");
            results.slice(0, 5).forEach(card => {
                embed.addField(
                    card.title + (card.uniqueness ? " ♦" : ""),
                    replaceTokens(card.text.split('\n').slice(0, 2).join('\n'))
                        + "\n[View on Netrunner DB](" + UI_CARD_ROUTE + card.code + ')');
            });
            if (results.length > 5) embed.setFooter((results.length - 5).toString() + " more results found");
            return embed;
        }
    });
}

function buildQuery(params) {
    let query = {}, currentField = "title";
    params.forEach(param => {
        if (param.includes(':')) {
            let chunks = param.split(':');
            if (!TOKENS_TO_FIELDS[chunks[0]]) throw new NetrunnerError("Unknown search flag: " + chunks[0], params);
            currentField = TOKENS_TO_FIELDS[chunks[0]];
            query[currentField] = chunks[1];
        } else {
            if (query[currentField]) query[currentField] += ' ' + param;
            else query[currentField] = param;
        }
    });
    return query;
}

function getDescription(card) {
    let descStr = capitalize(card.faction_code) + " | " + capitalize(card.type_code);
    if (card.keywords) descStr += " | " + card.keywords;
    return descStr + '\n' + replaceTokens(card.text);
}

function capitalize(word) {
    if (word === "nbn") return "NBN";
    return word[0].toUpperCase() + word.slice(1);
}

function replaceTokens(str) {
    _.each(MARKDOWN_TO_TAGS, (pattern, replacement) => {
        str = str.replace(pattern, replacement);
    });
    return str;
}

function unloadCache() {
    cardCache = {};
    log.debug("NetrunnerDB card cache unloaded");
}

module.exports = {
    alias: ["nr","nrdb","netrunner","netrunnerdb"],
    search: searchForCard,
    description: "Netrunner DB"
};


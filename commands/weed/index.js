const links = require('./links.json');
const log = require('../../lib/log');

module.exports = {
    alias: ["weed"],
    handler: message => message.edit(links[Math.floor(Math.random() * links.length)])
        .then(message => message.react(message.client.emojis.find('name','weed')))
        .catch(err => log.debug("Caught error in weed:", err.message))
};
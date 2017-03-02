const commandLoader = require('./index');

function reload(message) {
    log.info("Command reload requested");
    return commandLoader.reloadCommands(this)
        .then(() => message.reply("Commands reloaded successfully"))
        .catch(err => {
            log.error("Error reloading commands:", err);
            return message.reply("Failed to load commands!");
        });
}

module.exports = {
    alias: ["rel", "reload"],
    handler: reload,

    help: {
        name: "Reload",
        usage: ";rel | ;reload",
        description: "Reloads the command list"
    }
};

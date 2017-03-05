const Promise = require('bluebird');
const RichEmbed = require('discord.js').RichEmbed;

const nickname = require('../config.json').nickname;
const startTime = Date.now();
const MEGABYTE = 1024 * 1024

function stats(message) {
    return Promise.join(message.channel.sendEmbed(createRichEmbed(message, this)), message.delete());
}

function createRichEmbed(message, bot) {
    let mem = process.memoryUsage();
    return new RichEmbed()
        .setTitle(`Grimoire ${nickname || "of a Forgetful Mage"} - Stats`)
        .setURL("https://github.com/Lancey6/grimoire")
        .setColor(0x00FF00)
        .setThumbnail("http://img03.deviantart.net/fbf4/i/2013/155/f/9/netrunner__grimore_by_leejj-d67t9vf.jpg")
        .addField("Uptime", getUptimeSting(), true)
        .addField("Average Ping", message.client.ping.toFixed(2) + "ms", true)
        .addField("Spells Prepared", getCommandString(bot), true)
        .addField("Errors Encountered", bot.errorCount, true)
        .addField("Memory Used", Math.floor(mem.heapUsed/MEGABYTE) + "MB / "
            + Math.floor(mem.heapTotal/MEGABYTE) + "MB Allocated", true)
        .addField("Villages Destroyed", 834, true)
}

function getUptimeSting() {
    let uptime = new Date(Date.now() - startTime);
    let [seconds,minutes,hours,days] = [
        uptime.getSeconds(),
        uptime.getMinutes(),
        uptime.getUTCHours(),
        uptime.getUTCDate() - 1];
    let outstring = `${seconds} seconds`;
    if (minutes) outstring = `${minutes} minutes, ${outstring}`;
    if (hours) outstring = `${hours} hours, ${outstring}`;
    if (days) outstring = `${days} days, ${outstring}`;
    return outstring;
}

function getCommandString(bot) {
    let commandNames = bot.commands.map(cmd => cmd.help.name || cmd.alias[cmd.alias.length - 1]);
    let commandString = "";
    while (commandNames.length) {
        commandString += commandNames.splice(0, 4).join(' ');
        commandString += "\n";
    }
    return commandString;
}

module.exports = {
    alias: ["stats"],
    handler: stats,

    help: {
        name: "Stats",
        usage: ":stats",
        description: "Gets information about this bot"
    }
};

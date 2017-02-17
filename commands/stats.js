const Promise = require('bluebird');
const RichEmbed = require('discord.js').RichEmbed;

const nickname = require('../config.json').nickname;
const startTime = Date.now();

function stats(message) {
    return Promise.join(message.channel.sendEmbed(createRichEmbed(message)), message.delete());
}

function createRichEmbed(message) {
    return new RichEmbed()
        .setTitle(`Grimoire ${nickname || "of a Forgetful Mage"} - Stats`)
        .setURL("https://github.com/Lancey6/grimoire")
        .setColor(0x00FF00)
        .setThumbnail("http://img03.deviantart.net/fbf4/i/2013/155/f/9/netrunner__grimore_by_leejj-d67t9vf.jpg")
        .addField("Uptime", getUptimeSting(), true)
        .addField("Servers", message.client.guilds.size, true)
        .addField("Channels", message.client.channels.size, true)
        .addField("Average Ping", message.client.ping.toFixed(2) + "ms", true)
        .addField("Spells Prepared", getCommandString(), true)
        .addField("Errors Encountered", process.errorCount, true)
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

function getCommandString() {
    return process.commands.map(cmd => cmd.help.name || cmd.alias[cmd.alias.length - 1]).join(", ");
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

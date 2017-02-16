const Promise = require('bluebird');
const RichEmbed = require('discord.js').RichEmbed;

const startTime = Date.now();

function stats(message) {
    return Promise.join(message.channel.sendEmbed(createRichEmbed(message)), message.delete());
}

function createRichEmbed(message) {
    return new RichEmbed()
        .setTitle("Grimoire Latrans - Stats")
        .setURL("https://github.com/Lancey6/grimoire")
        .setColor(0x00FF00)
        .setImage("http://img03.deviantart.net/fbf4/i/2013/155/f/9/netrunner__grimore_by_leejj-d67t9vf.jpg")
        .setDescription(getDescription(message))
}

function getDescription(message) {
    return "**Uptime:** " + getUptimeSting() + "\n"
         + "**Servers:** " + message.client.guilds.size + "\n"
         + "**Channels:** " + message.client.channels.size + "\n"
         + "**Avgerage Ping:** " + message.client.ping + "ms\n"
         + "**Villages Destroyed:** 834";
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

module.exports = {
    alias: ["stats"],
    handler: stats,

    help: {
        name: "Stats",
        usage: ":stats",
        description: "Gets information about this bot"
    }
};

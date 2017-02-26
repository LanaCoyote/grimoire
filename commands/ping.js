
function ping(message) {
    let startTime = message.createdAt;
    return message.channel.sendMessage(`🏓 Pong!`)
        .then(reply => {
            let pingTime = Math.floor((reply.createdAt - startTime)/2);
            return reply.edit(`🏓 Pong! ${pingTime}ms`);
        });
}

module.exports = {
    alias: ["p", "ping"],
    handler: ping,

    help: {
        name: "Ping",
        usage: ":p | :ping",
        description: "Gets your ping time to discord"
    }
};

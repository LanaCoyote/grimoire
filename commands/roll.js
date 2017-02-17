const Promise = require('bluebird');
const RichEmbed = require('discord.js').RichEmbed;

const log = require('../lib/log');

const DICE_REGEX = /^(\d+)(d\d+)?(k|K\d+)?(s\d+)?(e)?$/;
const TOKEN_REGEX = /[+\-*\/]/

class DiceError extends Error {
    constructor(message, expr) {
        super(message);
        this.expr = expr;
    }
}

function roll(message, params) {
    const expression = params.join('').replace(/\s/g, '');
    try {
        const tokens = expression.split(TOKEN_REGEX).map(parseExpr);
        const finalSum = tokens.length === 1 ? tokens[0].sum : calculateFinal(expression, tokens);
        return Promise.join(
            message.channel.sendEmbed(createRichEmbed(message, finalSum, tokens, expression),
                `**${message.author.username} rolls ${expression}, and got ${finalSum}!**`),
            message.delete());
    } catch (err) {
        if (err instanceof DiceError) {
            return message.channel.sendEmbed({
                color: 0xFF0000,
                title: `Error in '${err.expr || expression}': ${err.message}`,
                description: "Usage: (count) d (sides) [k|K (keep lowest/highest n)] [s (dice pool target)] [e]"
            });
        } else {
            log.error("Roll encountered critical error:", err);
            return message.channel.sendEmbed({color: 0xFF0000, title: "An unknown error occurred"});
        }
    }
}

function parseExpr(expr) {
    let match = expr.match(DICE_REGEX);
    if (!match) throw new DiceError("Invalid expression", expr);
    let [count,sides,keep,target,explode] = match.slice(1);
    count = count ? parseInt(count) : 1;
    if (!sides) return {sum: count, expr};  // no sides, this is a constant
    if (explode && parseInt(sides.substr(1)))
        throw new DiceError("Attempted to explode a 1 sided die (this will -actually- explode)", expr);

    // roll some dice!
    for (var rolls = []; rolls.length < parseInt(count); ) {
        let result = rollDie(parseInt(sides.substr(1)));
        if (explode && result == sides.substr(1)) count++;
        rolls.push(result);
    }

    // remove unkept dice with K is enabled
    if (keep) {
        rolls.sort();
        if (keep.charAt(0) === 'K') rolls.reverse();
        rolls = rolls.slice(0, parseInt(keep.substr(1)));
    }

    // remove dice below the target for dice pools
    if (target) {
        let sum = rolls.filter(res => res >= parseInt(target.substr(1))).length;
        return {sum, rolls, expr};
    }

    return {sum: rolls.reduce((sum, n) => sum + n, 0), rolls, expr};
}

function rollDie(sides) {
    return Math.ceil(Math.random() * sides);
}

function calculateFinal(expression, tokens) {
    let curPos = 0;
    return tokens.reduce((total, token, idx) => {
        if (!idx) {
            curPos = token.expr.length;
            return token.sum;
        }
        let operator = expression.charAt(curPos);
        console.log(total, operator, token.sum);
        curPos += token.expr.length + 1;
        return {
            '+': total + token.sum,
            '-': total - token.sum,
            '*': total * token.sum,
            '/': total / token.sum
        }[operator];
    }, 0);
}

function createRichEmbed(message, finalSum, tokens, expr) {
    let embed = new RichEmbed();
    tokens.forEach(token => token.rolls && embed.addField(token.expr, `${token.sum} (${token.rolls.toString()})`, true));
    if (tokens.length > 1) embed.addField("Total", finalSum);
    return embed;
}

module.exports = {
    alias: ['r','roll'],
    handler: roll
};
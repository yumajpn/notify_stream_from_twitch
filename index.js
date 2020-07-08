'use strict';
const fs = require('fs');

// Twitch
const twitchConfig = JSON.parse(fs.readFileSync('./twitch_config.json', 'utf8'));
const TwitchClient = require('twitch');
const clientId = twitchConfig['clientId'];
const clientSecret = twitchConfig['secret'];

// Discord
const Discord = require('discord.js');
const discordConfig = JSON.parse(fs.readFileSync('./discord_config.json', 'utf8'));
const discordBotToken = discordConfig['botToken'];
const notifyTo = discordConfig['notifyTo'];

// 最後に取得した時刻を示す
var previousDate = new Date();
console.log('start at:' + `${previousDate}`);

// cron
const cron = require('node-cron');
cron.schedule('*/5 * * * *', () => {
    notifyStreamsLiveNow();
});



function notifyStreamsLiveNow() {
    console.log('invoke notify stream task.');
    const twitchClient = TwitchClient.withClientCredentials(clientId, clientSecret);
    twitchClient.kraken.streams.getStreams("", "Magic: The Gathering", "", "all", 0, 100)
        .then(streams => {
                var filtered = filterNotifiedStreams(streams);
                notifyToDiscord(filtered);
        });
}

function notifyToDiscord(streams) {
    const client = new Discord.Client();
    client.login(discordBotToken);

    client.on('ready', message => {
        const channel = client.channels.cache.get(notifyTo);
        streams.forEach(stream => {
            const url = stream.channel.url;
            channel.send(url);
        });
        previousDate = new Date();
        console.log('notified: ' + `${streams.length}`);
    });
}

function filterNotifiedStreams(streams) {
    var filtered = [];
    streams.forEach(stream => {
        var startDate = Date.parse(stream.startDate);
        if (previousDate < startDate) {
            filtered.push(stream);
        }
    });
    return filtered;
}


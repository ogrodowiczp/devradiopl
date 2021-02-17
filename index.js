const Express = require('express');
const expressApp = Express();

const Discord = require('discord.js');
const discordClient = new Discord.Client();

const { Octokit } = require("@octokit/core");
const octokitClient = new Octokit({ auth: process.env.GITHUB_PERSONAL_TOKEN });

const { commands } = require('./commands.js');
const { dayOfTheWeek } = require('./const.js');

const { AirtableWrapper } = require('./airtable.js');
let airtableClient = new AirtableWrapper();

const { Event } = require('./model.js');

let upcomingEvents = [];

discordClient.on('ready', () => {
	console.log(`Logged as: ${discordClient.user.tag}`);
});

discordClient.on('message', msg => {
	if (msg.author.bot) return;
	if (msg.content.startsWith('!') && msg.channel.id != process.env.DISCORD_CHANNEL_ID_RAMOWKA) {
		msg.channel.send(`<@${msg.author.id}> sorki, działam tylko na kanale <#${process.env.DISCORD_CHANNEL_ID_RAMOWKA}>.`);
		return;
	}
	if (msg.content.startsWith(process.env.CLUBHOUSE_ROOM_URL_PREFIX)) {
		let success = true;
		octokitClient.request(`POST /repos/${process.env.GITHUB_ISSUE_REPO_NAME}/issues`, {
			title: msg.content
		}).catch((err) => {
			msg.channel.send(`Coś poszło nie tak. Spróbuj dodać ręcznie: https://github.com/${process.env.GITHUB_ISSUE_REPO_NAME}/issues/new?assignees=&labels=&template=dodanie-spotkania.md&title=${msg.content}`);
			console.log(err);
			success = false;
		}).finally(() => {
			if (success) msg.channel.send("Wydarzenie stworzone!");
			reloadItems();
		});
		
	} else if (msg.content === commands.RAMOWKA) {
		sendUpcomingEvents(msg);
	} else if (msg.content === commands.BOT) {
		msg.channel.send('Wklej link do spotkania Clubhouse, żeby dodać spotkanie\nWpisz `!ramowka`, a powiem Ci co się kroi');
	}
});

async function sendUpcomingEvents(msg) {
	let auditions = await airtableClient.getAuditions();
	let eventsStringList = [];
	auditions.forEach(event => {
		let eventDate = new Date(event.date);
		eventsStringList.push(`**${dayOfTheWeek[eventDate.getDay()]}**, ${new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Warsaw'}).format(eventDate)}: **${event.title}** // <${event.link}>`);
	})
	let eventsText = `Kalendarz audycji: <${process.env.AIRTABLE_CALENDAR_VIEW}>\nNastępne ${eventsStringList.length} audycji (wg czasu polskiego):\n${eventsStringList.join('\n')}`;
	msg.channel.send(`${eventsText}\n<@${msg.author.id}>, po więcej zajrzyj na: ${process.env.DEVRADIOPL_HOME_PAGE}`);
}

discordClient.login(process.env.DISCORD_AUTH_KEY);

expressApp.get('/', (req, res) => {
	res.redirect(process.env.DEVRADIOPL_HOME_PAGE);
});

expressApp.listen(process.env.PORT || 8080, () => {
	console.log('Web server has started');
})

const http = require("http");
setInterval(function() {
    http.get(process.env.SELF_APP_URL);
}, 300000);
const Express = require('express');
const expressApp = Express();

const Discord = require('discord.js');
const discordClient = new Discord.Client();

const { Octokit } = require("@octokit/core");
const octokitClient = new Octokit({ auth: process.env.GITHUB_PERSONAL_TOKEN });

discordClient.on('ready', () => {
	console.log(`Logged as: ${discordClient.user.tag}`);
});

discordClient.on('message', msg => {
	if (msg.author.bot) return;
	if (msg.content.startsWith('!') && msg.channel.name != 'ramówka') {
		msg.channel.send(`<@${msg.author.id}> sorki, działam tylko na kanale <#${process.env.DISCORD_CHANNEL_ID_RAMOWKA}>.`);
		return;
	}
	if (msg.content.startsWith(process.env.CLUBHOUSE_ROOM_URL_PREFIX)) {
		let success = true;
		octokitClient.request(`POST /repos/${process.env.GITHUB_ISSUE_REPO_NAME}/issues`, {
			title: msg.content
		}).catch((err) => {
			msg.channel.send(`Cos poszło nie tak. Spróbuj dodać ręcznie: https://github.com/${process.env.GITHUB_ISSUE_REPO_NAME}/issues/new?assignees=&labels=&template=dodanie-spotkania.md&title=${msg.content}`);
			console.log(err);
			success = false;
		}).finally(() => {
			if (success) msg.channel.send("Wydarzenie stworzone!");
		});
		
	} else if (msg.content === '!ramowka') {
		msg.channel.send(`<@${msg.author.id}>, zajrzyj na: ${process.env.DEVRADIOPL_HOME_PAGE}`);
	} else if (msg.content === '!bot') {
		msg.channel.send('Wklej link do spotkania Clubhouse, żeby dodać spotkanie\nWpisz `!ramowka`, a powiem Ci co się kroi');
	}
});

discordClient.login(process.env.DISCORD_AUTH_KEY);

expressApp.get('/', (req, res) => {
	res.redirect(process.env.DEVRADIOPL_HOME_PAGE);
});

expressApp.listen(process.env.PORT || 8080, () => {
	console.log('Web server has started');
})

const http = require("http");
setInterval(function() {
    http.get("http://devradiopl.herokuapp.com");
}, 300000);
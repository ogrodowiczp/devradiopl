const Express = require('express');
const expressApp = Express();

const Discord = require('discord.js');
const discordClient = new Discord.Client();

const { commands } = require('./commands.js');
const { dayOfTheWeek } = require('./const.js');

const { AirtableWrapper } = require('./airtable.js');
let airtableClient = new AirtableWrapper();

const { Octokit } = require("@octokit/rest");
const octokitClient = new Octokit({ auth: process.env.GITHUB_PERSONAL_TOKEN });

const { loadPageContent } = require('./parser');

discordClient.on('ready', () => {
	console.log(`Logged as: ${discordClient.user.tag}`);
});

discordClient.on('message', msg => {
	if (msg.author.bot) return;
	if (msg.content.startsWith(process.env.CLUBHOUSE_ROOM_URL_PREFIX)) {
		loadPageContent(msg.content)
			.then((event) => {
				airtableClient.createAudition(event)
				.then((result) => {
					if (result.error) {
						msg.channel.send(`<@${msg.author.id}> sorki, ale się nie udało. Spróbuj dodać ręcznie: <${process.env.AIRTABLE_NEW_AUDITION_FORM}>`);
						console.log(error);
					} else {
						msg.channel.send(`<@${msg.author.id}> melduję utworzenie audycji!`);
						refreshAuditionsPage(msg);
					}
				});
			});
	} else if (msg.content === commands.RAMOWKA) {
		sendUpcomingEvents(msg);
	} else if (msg.content === commands.BOT) {
		msg.channel.send('Wklej link do spotkania Clubhouse, żeby dodać spotkanie\n'+
						'Wpisz `!ramowka`, a powiem Ci co się kroi\n'+
						'Dodaj pomysł pisząc `!idea Moj pomysl`, a zapiszemy Twój pomysł na rozwój\n'+
						'Chcesz pomóc mnie rozwijać? Daj znać!');
	} else if (msg.content.startsWith(commands.IDEA)) {
		let idea = msg.content.split(commands.IDEA)[1].trim();
		if (idea.length === 0) {
			msg.channel.send(`<@${msg.author.id}> że co, mam się domyślić co Ci chodzi po głowie?`);
		} else {
			airtableClient.saveIdea(idea, msg.author.username)
			.then((result) => {
				if (result.error) {
					msg.channel.send(`<@${msg.author.id}> sorki, ale się nie udało. Spróbuj dodać ręcznie: <${process.env.AIRTABLE_NEW_IDEA_FORM}>`);
					console.error(error);
				} else {
					msg.channel.send(`<@${msg.author.id}> wezmę sobie Twój pomysł głęboko do serduszka.`);
				}
			})
		}
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

async function refreshAuditionsPage(msg) {
	octokitClient.request(`POST /repos/${process.env.GITHUB_ISSUE_REPO_NAME}/actions/workflows/${process.env.GITHUB_WORKFLOW_ID}/dispatches`, {
		ref: 'master'
	})
	.catch((err) => {
		console.err(err);
		msg.channel.send('Nie dałem rady odświeżyć strony... :(\nTwoja audycja pojawi się w przeciągu godziny.');
	}).finally(() => {
		msg.channel.send('Stronka odświeży się w przeciągu kilku minut :)');
	});	
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
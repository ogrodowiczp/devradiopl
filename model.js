class Event {

	constructor(title, link, date) {
		this.title = title;
		this.link = link;
		this.date = date;
	}

	title;
	link;
	date;
}

module.exports = { Event };
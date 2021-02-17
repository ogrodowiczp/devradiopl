
class Event {

	constructor(title, hosts, date, description, url) {
		this.title = title;
		this.link = url;
        this.date = date;
        this.description = description;
        this.hosts = hosts;
	}

    title;
    hosts;
	link;
    date;
    description;
}

module.exports = { Event };
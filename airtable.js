const { Event } = require('./model.js');

class AirtableWrapper {

    airtableClient;

    constructor() {
        let Airtable = require('airtable');
        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: process.env.AIRTABLE_API_KEY
        });
        this.airtableClient = Airtable.base(process.env.AIRTABLE_BASE_ID);
    }

    getAuditions() {
        return new Promise(resolve => {
            let upcomingEvents = [];
            this.airtableClient('Auditions').select({
                fields: ['Audition Name', 'Time', 'Hosts', 'Description', 'URL'],
                filterByFormula: `IS_AFTER({Time},TODAY())`,
                maxRecords: 10,
                sort: [{
                    field: 'Time',
                    direction: 'asc'
                }]
            }).eachPage((records, fetchNextPage) => {
                records.forEach((record) => {
                    upcomingEvents.push(new Event(record.get('Audition Name'), record.get('URL'), record.get('Time')));
                });

                fetchNextPage();

            }, (err) => {
                resolve(upcomingEvents);
            });   
        });
    }
};

module.exports = { AirtableWrapper };

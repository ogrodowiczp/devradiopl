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
            this.airtableClient(process.env.AIRTABLE_AUDITIONS_TABLE_NAME).select({
                fields: ['Audition Name', 'Time', 'Hosts', 'Description', 'URL'],
                filterByFormula: `IS_AFTER({Time},TODAY())`,
                maxRecords: 10,
                sort: [{
                    field: 'Time',
                    direction: 'asc'
                }]
            }).eachPage((records, fetchNextPage) => {
                records.forEach((record) => {
                    upcomingEvents.push(new Event(record.get('Audition Name'), record.get('Hosts'), record.get('Time'), record.get('Description'), record.get('URL')));
                });

                fetchNextPage();

            }, (err) => {
                resolve(upcomingEvents);
            });   
        });
    }

    findAuditionByUrl(url) {
        return new Promise(resolve => {
            this.airtableClient(process.env.AIRTABLE_AUDITIONS_TABLE_NAME).select({
                fields: ['URL'],
                filterByFormula: `{URL} = '${url}'`,
                maxRecords: 1
            }).eachPage((records, fetchNextPage) => {
                resolve(records.length > 0 ? records[0].id : null);
            }, (err) => {
                if (err) {
                    console.error(err);
                    resolve(err);
                }
            });
        });
    } 

    createAudition(event) {
        return new Promise(resolve => {
            this.airtableClient(process.env.AIRTABLE_AUDITIONS_TABLE_NAME).create([{
                "fields": {
                    "Audition Name": event.title,
                    "Description": event.description,
                    "Time": event.date,
                    "URL": event.link,
                    "Hosts": event.hosts
                }
            }], (err, records) => {
                if (err) {
                    console.error(err);
                    resolve(err);
                }
                resolve(records[0]);
            })
        });
    }

    saveIdea(idea, author) {
        return new Promise(resolve => {
            this.airtableClient(process.env.AIRTABLE_IDEAS_TABLE_NAME).create([{
                "fields": {
                    "Name": idea,
                    "Author": author
                }
            }], (err, records) => {
                if (err) {
                    console.error(err);
                    resolve(err);
                }
                resolve(records[0]);
            })
        })
    }

    removeAudition(url) {
        return new Promise(resolve => {
            this.findAuditionByUrl(url)
                .then(recordId => {
                    if (!recordId) {
                        console.error(`Audition with url <<${url}>> not found!`);
                        resolve({success: false, error: 'Nie znalazłem takiej audycji'});
                        return;
                    }
                    this.airtableClient(process.env.AIRTABLE_AUDITIONS_TABLE_NAME).destroy(recordId, (err, deletedRecord) => {
                        if (err) {
                            console.error(err);
                            resolve(err);
                        } else {
                            resolve({success: true});
                        }
                    });
                });
        });
    }
};

module.exports = { AirtableWrapper };

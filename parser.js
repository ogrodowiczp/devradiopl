const parser = require('node-html-parser');
const fetch = require('node-fetch');

const { Event } = require('./model.js');

async function loadPageContent(auditionUrl) {
    return new Promise(resolve => {
        let root;
        fetch(`${auditionUrl}`)
            .then(res => res.text())
            .then(body => root = parser.parse(body))
            .then(() => extractData(root, auditionUrl))
            .then((newEvent) => {
                resolve(newEvent)
            });
    });
}

async function extractData(root, auditionUrl) {
    return new Promise(resolve => {
        const auditionInfo = root.querySelector('div.text-base');

        const title = auditionInfo.querySelector('div.mt-1').childNodes[0].rawText.trim();
        const hosts = auditionInfo.querySelector('div.mt-2').childNodes[0].rawText.replace('w/', '').trim();
        const description = auditionInfo.querySelector('div[class=mt-6]').childNodes[0].rawText.trim();
        const time = auditionInfo.querySelector('div.text-md').querySelectorAll('span');
    
        let date = time[1].rawText.trim();
        let hour = time[2].rawText.trim();

        if (!hour.includes(':')) {
            let hourParts = hour.split(' ');
            hourParts[0] += ':00';
            hour = hourParts.join(' ');
        }

        let dateString = `${date}, ${new Date().getFullYear()} ${hour}`;
        let auditionDate = new Date(Date.parse(dateString)).toUTCString();

        let newEvent = new Event(title, hosts, auditionDate, description, auditionUrl);
        resolve(newEvent);
    });
}

module.exports = { loadPageContent }
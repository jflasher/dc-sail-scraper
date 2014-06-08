'use strict';

var fs = require('fs');
var Browser = require('zombie');
var smtpSettings = require('./smtp.json');
var mailer = require('./mailer');

// How many minutes to wait between checks?
var waitMinutes = 10;

var saveLastDate = function (date) {
	lastDate = date;
	var data = { lastDate: date };
	fs.writeFile(filePath, JSON.stringify(data));
};

// Set up the local file to hold last date value
var lastDate;
var filePath = './lastDate.json';
if (fs.existsSync(filePath)) {
	var json = JSON.parse(fs.readFileSync(filePath));
	lastDate = new Date(json.lastDate);
} else {
	saveLastDate(new Date('1/1/1970'));
}
console.log(lastDate);

// Our browser for parsing
var browser = new Browser();

// Setup the mailer
mailer.setup(smtpSettings);

// The rental url
var url = 'http://dcsail.org/rental-book';

// Generic error handle
browser.on('error', function(error) {
  console.error(error);
});

var parsePage = function () {
	console.log('Checking for available boats at ' + new Date());
	browser.visit(url, function() {
		// Get all the items that could be rentable
		var items = browser.queryAll('.EventListCalendarItemDefault');
		for (var i = 0; i < items.length; i++) {
			// Check for a Flying Scot
			var text = items[i].textContent.trim();
			if (text === 'Flying Scot AM Rental' || text === 'Flying Scot PM Rental') {
				// We found a rentable FS, check to see if we already saw this rentable date
				var date = getDateFromHTML(items[i].innerHTML);
				if (dateIsNew(date)) {
					console.log('New boats available!');
					saveLastDate(date);
					// New date, send out an email!
					sendNotice();
				} else {
					console.log('No new boats available');
				}
			}
		}
	});
};

var getDateFromHTML = function (html) {
	// Hacky way to get date
	var idx = html.indexOf('SelectedDate');
	var end = html.indexOf('"', idx);
	var dateString = html.substring(idx + 13, end);
	var date = new Date(dateString);

	return date;
};

var dateIsNew = function (date) {
        console.log('current date: ' + date);
        console.log('last date: ' + lastDate);
	return date > lastDate;
};

var sendNotice = function () {
	var mailOptions = {
    from: smtpSettings.from, // sender address
    to: smtpSettings.to, // list of receivers
    subject: 'DC Sail Scraper - New boat',
    text: 'http://dcsail.org/rental-book'
	};

	// send mail with defined transport object
	mailer.send(mailOptions, function (error, response) {
    if (error){
        console.log(error);
    } else {
        console.log('Message sent: ' + response.message);
    }
	});
};

// Run initial parse and set interval
parsePage();
setInterval(function () {
	parsePage();
}, waitMinutes * 60 * 1000);
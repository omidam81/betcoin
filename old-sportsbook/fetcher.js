var optimist = require('optimist');

var App = {};

require('./init.js').run(App);

App.Services = {
    PinnacleFetcher: require('./services/pinnacle-fetcher.js').generateService(App)
};

if(optimist.default({type: "once"}).argv.type === "once") {
    App.Services.PinnacleFetcher.updateNow();
} else {
    App.Services.PinnacleFetcher.startInterval();
}
var stopJsPort = chrome.runtime.connect({name: "tabinfo"});

function kickoff() {
  // Get srayProcessed value from tabsStore
 var message = { method: 'get', parm_1: 'srayProcessed' };
  stopJsPort.postMessage(message);
  stopJsPort.onMessage.addListener(function(msg) {
    console.log("msg:");
    console.log(msg);
    var tabSrayProcessed = msg.answer;
    if (tabSrayProcessed == true) {
      console.log('reloading...');
      // Ok load the page
      location.reload();
    }
  });
}

console.log("Page location is " + location.href);
if (location.href.match(/cluckin_method/) || location.href.match(/foolish.row3.org/)) {
  // Let it go!
} else {
  window.stop();
  kickoff();
}

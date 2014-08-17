var port = chrome.runtime.connect({name: "popup_bg"});
$(function () {
  $("#ci-options input[name='cluckin_method']:radio").change(function() {
    console.log('cluck cluck');
    console.log("this.value:" + this.value);
    var message = { method: 'set', parm_1: 'cluckin_method', parm_2: this.value };
console.log("porting");
    port.postMessage(message);
console.log("posted");
    port.onMessage.addListener(function(msg) {
      console.log('hello');
      console.log(msg);
    });
  });

  // Setup selected
  var selected_cluckin_method =  null;
  var message = { method: 'get', parm_1: 'cluckin_method' };
  port.postMessage(message);
  port.onMessage.addListener(function(msg) {
    console.log("msg:");
    console.log(msg);
    selected_cluckin_method = msg.answer;
    var elem = $("#ci-options input[name='cluckin_method'][value='" + selected_cluckin_method + "']");
    console.log("elem");
    console.log(elem);
    elem.prop('checked', true);
  });
});

var popupBgPort = chrome.runtime.connect({name: "popup_bg"});
$(function () {
  $("#ci-options input[name='cluckin_method']:radio").change(function() {
    // Tell background.js that user changed radio button
    console.log("this.value:" + this.value);
    var message = { method: 'set', parm_1: 'cluckin_method', parm_2: this.value };
    popupBgPort.postMessage(message);
    popupBgPort.onMessage.addListener(function(msg) {
      console.log("msg:");
      console.log(msg);
    });
  });

  // Popup button clicked so retrieve current cluckin_method and display
  // as radio button
  var selected_cluckin_method =  null;
  var message = { method: 'get', parm_1: 'cluckin_method' };
  popupBgPort.postMessage(message);
  popupBgPort.onMessage.addListener(function(msg) {
    console.log("msg:");
    console.log(msg);
    selected_cluckin_method = msg.answer;
    var elem = $("#ci-options input[name='cluckin_method'][value='" + selected_cluckin_method + "']");
    console.log("elem");
    console.log(elem);
    elem.prop('checked', true);
  });
});

// cluckin method
cluckin_method_global = 'pdf';
// Store info about each tab
tabsStore = {};
// Parse URL so that we can get its individual components
function parseURL(url) {
  var a =  document.createElement('a');
  a.href = url;
  return {
    source: url,
    protocol: a.protocol.replace(':',''),
    host: a.hostname,
    port: a.port,
    query: a.search,
    params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
    file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
    hash: a.hash.replace('#',''),
    path: a.pathname.replace(/^([^\/])/,'/$1'),
    relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
    segments: a.pathname.replace(/^\//,'').split('/')
  };
}
function myOnUpdatedListener(tab) {
  chrome.tabs.getSelected(null, function(tab) {
    var tabId = tab.id
    //DEBUG alert("onUpdated tabId:"+tabId);
    var tabStoreObj = tabsStore[tabId];
    //DEBUG alert("onUpdated retrieved tabStoreObj:"+ tabStoreObj);
    if (typeof tabStoreObj === 'undefined') {
      tabStoreObj = new Object();
      tabsStore[tabId] = tabStoreObj;
    }
    //DEBUG alert("onUpdated tabStoreObj.srayProcessed:"+tabStoreObj.srayProcessed);
    if (tabStoreObj.srayProcessed) {
      // Processing already so ignore
      // Thus whatever change is made to url will just be what
      // chrome extension connects to
    } else {
      // Not srayProcessed yet, so at this stage url is
      // blank.html?esc_url...
      //DEBUG alert("onUpdated tabStoreObj.onCreatedCalled:"+tabStoreObj.onCreatedCalled);
      tabStoreObj.srayProcessed = true;
      // onCreated can be triggered but onUpdated also trigger
      // before onCreated is completed, thus need to handle this scenario
      if (tabStoreObj.onCreatedCalled) {
        // Let create do the magic
      } else {
        var myURL = parseURL(tab.url);
        var myURL_params_esc_url = myURL.params['esc_url'];
        var cluckin_method = myURL.params['cluckin_method'];
        //DEBUG alert("onUpdated myURL_params_esc_url:"+myURL_params_esc_url);
        //DEBUG alert("onUpdated cluckin_method:"+cluckin_method);
        var unesc_url;
        if (myURL_params_esc_url) {
          unesc_url = unescape(myURL_params_esc_url);
        }
        //DEBUG alert("onUpdated unesc_url:" + unesc_url);
        chrome.tabs.update(tab.id, { url: unesc_url });
      } 
    }
  });
};
chrome.tabs.onUpdated.addListener(myOnUpdatedListener);
function myOnCreatedListener(tab) {
  // Mark the tab has having no opener
  var tabStoreObj = tabsStore[tab.id];
  //DEBUG alert('onCreated retrieved tabStoreObj:'+tabStoreObj);
  if (typeof tabStoreObj === 'undefined') {
    tabStoreObj = new Object();
    tabsStore[tab.id] = tabStoreObj;
  }
  //DEBUG alert('onCreated prepared tabStoreObj:'+tabStoreObj);
  if (tabStoreObj.onCreatedCalled) {
    // Ignore multiple trigger
    //DEBUG alert('ignoring');
  } else {
    tabStoreObj.onCreatedCalled = true;
    //DEBUG alert("onCreated tabStoreObj.onCreatedCalled:"+tabStoreObj.onCreatedCalled);
    // openerTab undefined means the tab was opened by external app
    if (typeof tab.openerTabId === 'undefined') {
      tabStoreObj.openerTabNone = true;
      //DEBUG alert("onCreated set tab.id:"+tab.id+" openerTabNone to true");
    } else {
      tabStoreObj.openerTabNone = false;
      //DEBUG alert("onCreated set tabId:"+tab.id+" openerTabNone to false");
    }
    var myOnCreatedInterval = setInterval(function waitOnCreatedComplete() {
      //DEBUG alert("onCreated tab.url:"+tab.url);
      // Wait for tab.url to be filled in so that we can then process it
      // to determine if we should redirect to row3.org or redirect
      // to plain url based on openerTabNone
      if (tab.url)
      {
        clearInterval(myOnCreatedInterval);
        //DEBUG alert('onCreated done');
        queryInfo = new Object();
        queryInfo.active = true;
        chrome.tabs.query(queryInfo, function(result) {
          //DEBUG alert('query result:'+result.length);
          var activeTab = result[0];
          var activeTabId = activeTab.id;
          //DEBUG alert('query activeTab:'+activeTab);
          //DEBUG alert('query activeTab.url:'+activeTab.url);
          var myURL = parseURL(activeTab.url);
          var myURL_params_esc_url = myURL.params['esc_url'];
          var cluckin_method = myURL.params['cluckin_method'];
          var unesc_url;
          if (myURL_params_esc_url) {
            unesc_url = unescape(myURL_params_esc_url);
          } else {
            unesc_url = tab.url;
          }
          //DEBUG alert("query unesc_url:"+unesc_url);
          updateProperties = new Object();
          if (tabStoreObj.openerTabNone) {
            var new_url = null;
            if (cluckin_method_global == 'off') {
              new_url = unesc_url;
            } else {
              new_url = "http://row3.org?keywords="+escape(unesc_url)+"&cluckin_method="+cluckin_method_global;
            }
            //DEBUG alert("query url:"+new_url);
            updateProperties.url = new_url;
          } else {
            // There is openerTab so not opened from app thus go directly to website
            updateProperties.url = unesc_url;
          }
          // Set this because onUpdated will be triggered and we don't want it to
          // to process anything
          tabStoreObj.srayProcessed = true;
          chrome.tabs.update(activeTabId, updateProperties, function() {
            // Anything else you want to do after the tab has been updated.
          });
        });
      }
    }, 1000);
  }
}
chrome.tabs.onCreated.addListener(myOnCreatedListener);

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name == 'popup_bg') {
    port.onMessage.addListener(function(msg) {
      console.log('msg.method' + msg.method);
      console.log('msg.parm_1' + msg.parm_1);
      console.log('msg.parm_2' + msg.parm_2);
      if (msg.method == 'get') {
        if (msg.parm_1 == 'cluckin_method') {
          var answer = { answer: cluckin_method_global };
          console.log('get answer:');
          console.log(answer);
          port.postMessage(answer);
        }
      } else if (msg.method == 'set') {
        if (msg.parm_1 == 'cluckin_method') {
          cluckin_method_global = msg.parm_2;
          console.log('set cluckin_method_global:' + cluckin_method_global);
          port.postMessage({answer: 'true'});
        }
      }
    });
  } else if (port.name == 'tabinfo') {
    // Let the caller know whether this url on the tab has been sray processed
    port.onMessage.addListener(function(msg) {
      var tabId = null;
      // Need to get the tabId, so call chrome.tabs.getSelected
      chrome.tabs.getSelected(null, function(tab) {
        tabId = tab.id
        console.log('tab.id' + tab.id);
        console.log('msg.method' + msg.method);
        console.log('msg.parm_1' + msg.parm_1);
        console.log('msg.parm_2' + msg.parm_2);

        if (msg.method == 'get') {
          if (msg.parm_1 == 'srayProcessed') {
            console.log('tab_id:' + tabId);
            var srayTabObject = tabsStore[tabId];
            console.log('tabsStore[tabId]:');
            console.log(srayTabObject);
            var answer = {};
            if (srayTabObject != null) {
              answer.answer = srayTabObject.srayProcessed;
            } else {
              answer.answer = null;
            }
            console.log('get answer:');
            console.log(answer);
            port.postMessage(answer);
          }
        } else if (msg.method == 'set') {
          // We don't set tabProcessed from here BUT maybe we should!
        }
      }); 
    });
  }
});

var myOnBeforeRequestListener = function(details) {
  var tabId = details.tabId;
  var tabStoreObj = tabsStore[tabId];
  //DEBUG alert('onBeforeRequest tabId:' + tabId);
  //DEBUG alert("onBeforeRequest retrieved tabStoreObj:"+tabStoreObj);
  if (typeof tabStoreObj === 'undefined') {
    tabStoreObj = new Object();
    tabsStore[tabId] = tabStoreObj;
  }
  //DEBUG alert("onBeforeRequest prepared tabStoreObj:"+tabStoreObj);
  var srayProcessed = tabStoreObj.srayProcessed;
  //DEBUG alert('onBeforeRequest srayProcessed:' + srayProcessed);
  var srayRedirect = tabStoreObj.srayRedirect;
  //DEBUG alert('onBeforeRequest srayRedirect:' + srayRedirect);
  var onCreatedCalled = tabStoreObj.onCreatedCalled;
  //DEBUG alert('onBeforeRequest onCreatedCalled:' + onCreatedCalled);
  //DEBUG alert('onBeforeRequest details.url:' + details.url);
  //DEBUG alert('onBeforeRequest details.tabId:' + details.tabId);
  //DEBUG alert('onBeforeRequest details.requestHeaders:' + details.requestHeaders);

  // srayRedirect tells onBeforeRequest, whether it redirected url
  // to blank.html?esc_url... before
  // Similar to srayProcessed tells onUpdated whether it has
  // handled the url before
  if (!srayRedirect) {
    tabStoreObj.srayRedirect = true;
    // Temporarily redirect to blank page and detect whether
    // there is an opener, i.e., even if there is no opener then
    // the url is opened from another app, i.e., not the browser, so
    // handle url using sray, otherwise, the tab is opened from browser,
    // open as normal
    // NOTE: If we can detect whether there's opener here we won't need
    //       to use tabs.onUpdated.
    // IMPT: Remember to change to foolish.row3.org/blank.html
//    return { redirectUrl: 'http://localhost:8080/blank.html?esc_url='+escape(details.url)+'&cluckin_method='+cluckin_method_global };
    var redirectUrlStr = null;
    // Skip processing url IF:
    // - cluckin is off
    // - browser is trying to open a new page because
    //   we put in keywords into the url input, we will get something like
    //   https://www.google.co.jp/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=<keywords>
    if ((cluckin_method_global == 'off') || (details.url.match(/google\.co.*webhp.*sourceid/))) {
      redirectUrlStr = details.url;
    } else {
      // NOTE: We cannot use http://row3.org because of
      ///      redirection will will mess
      //       up url resulting in gosafe.htmlblank.html
      redirectUrlStr = 'http://foolish.row3.org:1337/blank.html?esc_url='+escape(details.url)+'&cluckin_method='+cluckin_method_global;
    }
    return { redirectUrl: redirectUrlStr };
  }
};
var filter = { urls: ["http://*/*", "https://*/*"] };
//DEBUG var filter = { urls: ["http://yaml.org/*"] };
var opt_extraInfoSpec = ['blocking'];
chrome.webRequest.onBeforeRequest.addListener(
        myOnBeforeRequestListener, filter, opt_extraInfoSpec);

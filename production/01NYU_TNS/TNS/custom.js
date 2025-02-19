(function(){
"use strict";
'use strict';

var app = angular.module('viewCustom', ['angularLoad', 'customNoSearchResults']);

// app.component('prmSearchBarAfter', {
//   template: '<search-alternatives></search-alternatives><search-bar-sub-menu></search-bar-sub-menu>'
// });

// app.component('prmViewOnlineAfter', {
//   template: '<sfxresults></sfxresults>'
// });
/* app.component('prmServiceHeaderAfter', {
  template: '<deinotice></deinotice>'
}); */
// Begin BrowZine - Primo Integration...
window.browzine = {
  api: "https://public-api.thirdiron.com/public/v1/libraries/1727", apiKey: "0778bdb6-b33e-4315-84e7-c78859ea6974", journalCoverImagesEnabled: true, journalBrowZineWebLinkTextEnabled: true, journalBrowZineWebLinkText: "View Journal Contents", articleBrowZineWebLinkTextEnabled: true, articleBrowZineWebLinkText: "View Issue Contents", articlePDFDownloadLinkEnabled: true, articlePDFDownloadLinkText: "Download PDF", articleLinkEnabled: true, articleLinkText: "Read Article", printRecordsIntegrationEnabled: true };

browzine.script = document.createElement("script");
browzine.script.src = "https://s3.amazonaws.com/browzine-adapters/primo/browzine-primo-adapter.js";
document.head.appendChild(browzine.script);

app.controller('prmSearchResultAvailabilityLineAfterController', function ($scope) {
  window.browzine.primo.searchResult($scope);
});

app.component('prmSearchResultAvailabilityLineAfter', {
  bindings: { parentCtrl: '<' },
  controller: 'prmSearchResultAvailabilityLineAfterController'
});
// ... End BrowZine - Primo Integration
app.value('customNoSearchResultsTemplateUrl', 'custom/01NYU_TNS-TNS/html/customNoSearchResults.html');
app.component('prmUserAreaExpandableAfter', {
  bindings: {},
  template: '<button id="userSnap" class="user-button sign-in-btn-ctm md-button md-primoExplore-theme md-ink-ripple"><a ng-href="https://collector.usersnap.com/a801f2b8-e10c-4646-a60b-a48cf51331cc" target="_blank">Feedback</a><div class="md-ripple-container" style=""></div></button>'
});
// Adds the chat button
(function () {
  var lc = document.createElement('script');lc.type = 'text/javascript';lc.async = 'true';
  lc.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'v2.libanswers.com/load_chat.php?hash=cbce51a8ddaa668009b16150e9f08e36';
  var s = document.getElementsByTagName('script')[0];s.parentNode.insertBefore(lc, s);
})();

// Ends the chat button

angular.module('customNoSearchResults', []).component('prmNoSearchResultAfter', {
  bindings: {
    parentCtrl: '<'
  },
  templateUrl: ['customNoSearchResultsTemplateUrl', function (customNoSearchResultsTemplateUrl) {
    return customNoSearchResultsTemplateUrl;
  }]
});
})();
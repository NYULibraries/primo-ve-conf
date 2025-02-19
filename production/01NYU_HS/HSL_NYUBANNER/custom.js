(function(){
"use strict";
'use strict';

var app = angular.module('viewCustom', ['angularLoad']);


    const STATUS_EMBED_PROD_URL =
        'https://cdn.library.nyu.edu/statuspage-embed/index.min.js';
    const scriptTag = document.createElement( 'script' );
    scriptTag.setAttribute( 'src', STATUS_EMBED_PROD_URL );
    document.body.appendChild( scriptTag )

// Begin BrowZine - Primo Integration...
  window.browzine = {
    libraryId: "3820",
    apiKey: "3bc16c6c-50ea-44a5-83cd-55c92467145a",
    journalCoverImagesEnabled: true,
    journalBrowZineWebLinkTextEnabled: true,
    journalBrowZineWebLinkText: "View Journal Contents",
    articleBrowZineWebLinkTextEnabled: true,
    articleBrowZineWebLinkText: "View Issue Contents",
    articlePDFDownloadLinkEnabled: true,
    articlePDFDownloadLinkText: "Download PDF",
    articleLinkEnabled: true,
    articleLinkText: "Read Article",
    printRecordsIntegrationEnabled: true,
    showFormatChoice: true,
    showLinkResolverLink: false,
    enableLinkOptimizer: true,
    articleRetractionWatchEnabled: true,
    articleRetractionWatchText: "Retracted Article",
    articleExpressionOfConcernEnabled: true,
    articleExpressionOfConcernText: "Expression of Concern",
    unpaywallEmailAddressKey: "enter-your-email@your-institution-domain.edu",
    articlePDFDownloadViaUnpaywallEnabled: true,
    articlePDFDownloadViaUnpaywallText: "Download PDF (via Unpaywall)",
    articleLinkViaUnpaywallEnabled: true,
    articleLinkViaUnpaywallText: "Read Article (via Unpaywall)",
    articleAcceptedManuscriptPDFViaUnpaywallEnabled: true,
    articleAcceptedManuscriptPDFViaUnpaywallText: "Download PDF (Accepted Manuscript via Unpaywall)",
    articleAcceptedManuscriptArticleLinkViaUnpaywallEnabled: true,
    articleAcceptedManuscriptArticleLinkViaUnpaywallText: "Read Article (Accepted Manuscript via Unpaywall)",
  };
  browzine.script = document.createElement("script");
  browzine.script.src = "https://s3.amazonaws.com/browzine-adapters/primo/browzine-primo-adapter.js";
  document.head.appendChild(browzine.script);
  app.controller('prmSearchResultAvailabilityLineAfterController', function($scope) {
    window.browzine.primo.searchResult($scope);
  });
  app.component('prmSearchResultAvailabilityLineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'prmSearchResultAvailabilityLineAfterController'
  });
// ... End BrowZine - Primo Integration

})();

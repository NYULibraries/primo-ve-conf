(function(){
"use strict";
'use strict';

var app = angular.module('viewCustom', ['angularLoad']);

//added for NYU banner
//const STATUS_EMBED_PROD_URL =
//    'https://cdn.library.nyu.edu/statuspage-embed/index.min.js';
//const scriptTag = document.createElement( 'script' );
//scriptTag.setAttribute( 'src', STATUS_EMBED_PROD_URL );
//document.body.appendChild( scriptTag )
// NYU banner


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

/**
   * Customize user Favorites page, Mar 2026
   */

  app.component('prmFavoritesToolBarAfter', {
    bindings: { parentCtrl: '<' },
    template: `
              
              <div layout="row">
              <div flex="0" flex-md="0" flex-lg="13" flex-xl="23" ng-class="{'flex-lgPlus-15': $ctrl.mediaQueries.lgPlus}" class="flex-xl-20 flex-md-0 flex-lg-10 flex-0"></div>
              <div flex="70" style="padding:1em;margin-bottom:14px;margin-top:.25em;font-size:1.1em;">
           
                             <p style="margin:0">
                             To pin items to your Favorites list, please sign in using the link in the upper right. 
                             Then, search the catalog for your favorite resources and look for the pin <svg id="prm_pin_cache229" style="vertical-align:middle;" width="21" height="21" viewBox="0 0 24 24" y="0" xmlns="http://www.w3.org/2000/svg" fit="" preserveAspectRatio="xMidYMid meet" focusable="false">
        <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"></path>
    </svg>
                            icon. Any pinned items will automatically appear here, and on the HSL homepage.</span>
                            
                         </md-card-title>
                     </div>
                  </div>`
                     
  });
  
})();

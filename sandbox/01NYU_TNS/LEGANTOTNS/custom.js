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
app.run(function ($templateCache) {
  $templateCache.put('primo-explore-tnsstyles/html/home_en.html', '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" />\n<md-content layout-xs="column" layout="row">\n    <div flex-xs="100" flex="50" layout="column">\n\n        <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <h2 class="md-headline">What Am I Searching?</h2>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <h3>Library Catalog</h3>\n                <p>\n                    <ul>\n                        <li>Includes books, journals, audio, video, scores, images and article-level content.</li>\n                        <li>Many items are requestable.</li>\n                        <li>While not exhaustive, a significant number of our databases can be searched at once.</li>\n                        <li>Search includes items at The New School & our partner libraries.</li>\n                    </ul>\n                </p>\n                <h3>Special Collections</h3>\n                <p>\n                    <ul>\n                        <li>Consists of rare and unique published materials, including books, magazines, journals, zines, recordings and scores.</li>\n                        <li>Search includes collections at The New School & our partner libraries.</li>\n                    </ul>\n                </p>\n                <div class="searching-card">\n                    <div>\n                        <a href="https://library.newschool.edu/faq/222184" target="_blank" class="searching-card-link">Search Tips</a>\n                    </div>\n                </div>\n            </md-card-content>\n        </md-card>\n\n      <md-card class="default-card _md md-primoExplore-theme">\n            <md-card-title>\n                <md-card-title-text>\n                    <h2 class="md-headline">Archives & Special Collections</h2>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p>The Library Catalog & Special Collection searches do not include all materials from the Archives & Special Collections.</p>\n                <p>Use the links below to fully explore their collection of primary sources and rare & unique books.</p>\n                <h3>Related Links</h3>\n                <ul class="card-list-links">\n                    <li><a href="https://archives.newschool.edu/" target="_blank" class="archives-card-link"> Archives Home</a></li>\n                    <li><a href="https://findingaids.archives.newschool.edu/" target="_blank" class="archives-card-link">Finding Aids & Collections</a></li>\n                    <li><a href="https://digitalarchives.library.newschool.edu/" target="_blank" class="archives-card-link">Digital Collections</a></li>\n                </ul>\n                <h3>Follow Us</h3>\n                <div id="archives-socials" class="social-div">\n                    <a title="The Archives On Twitter" href="https://twitter.com/TNSArchives" target="_blank">\n                        <i class="fa fa-twitter-square fa-3"></i></a>\n                    <a title="The Archives On Instagram" href="https://www.instagram.com/newschoolarchives/" target="_blank">\n                        <i class="fa fa-instagram fa-3"></i></a>\n                </div>\n            </md-card-content>\n</md-card>\n    </div>\n\n<!-- COLUMN 2 -->\n    <div flex-xs="100" flex="50" layout="column">\n\n<md-card class="default-card _md md-primoExplore-theme">\n            <md-card-title>\n                <md-card-title-text>\n                    <h2 class="md-headline">Need Help?</h2>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p><a href="https://library.newschool.edu/ask-us">Submit your question</a> or click the \'Ask Us\' button on the bottom-right to start a live chat with one of our Library staff members.</p>\n                <h3>Helpful Links</h3>\n                <ul class="card-list-links">\n                    <li><a href="https://library.newschool.edu/faq">Library FAQ</a></li>\n                    <li><a href="https://guides.library.newschool.edu/">Research Guides</a></li>\n                    <li><a href="https://www.youtube.com/channel/UC6ZYurVTUOph_tetE-DqS5Q">Video Tutorials</a></li>\n                    <li><a href="https://library.newschool.edu/consultation">Meet with your Librarian</a></li>\n                </ul>\n            </md-card-content>\n</md-card>\n\n        <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <h2 class="md-headline">The New School Libraries</h2>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p>The New School Libraries provide access to collections, services, and spaces sufficient in quality, depth, diversity, format, and currency to support the research and teaching missions of The New School.</p>\n                <h3>Related Links</h3>\n                <ul class="card-list-links">\n                    <li><a href="https://library.newschool.edu/ill">Request Inter-Library Loan</a></li>\n                    <li><a href="https://library.newschool.edu/request-purchase">Recommend a Purchase</a></li>\n                    <li><a href="http://www.worldcat.org/search?qt=worldcat_org_all">Search nearby Libraries</a></li>\n                    <li><a href="https://library.newschool.edu/my-access">My Access</a></li>\n                </ul>\n                <h3>Follow Us</h3>\n                <div id="library-socials" class="social-div">\n                    <a title="The Libraries On Instagram" href="https://www.instagram.com/newschoollibraries/" target="_blank"><i class="fa fa-instagram fa-3"></i></a>\n                    <a title="The Libraries On YouTube" href="https://www.youtube.com/channel/UC6ZYurVTUOph_tetE-DqS5Q" target="_blank"><i class="fa fa-youtube-square fa-3"></i></a> \n                </div>\n\n            </md-card-content>\n        </md-card>\n    </div>\n</md-content>\n');
  $templateCache.put('primo-explore-tnsstyles/html/home_en_US.html', '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" />\n<md-content layout-xs="column" layout="row">\n    <div flex-xs="100" flex="50" layout="column">\n\n        <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">What Am I Searching?</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <h3>Books &amp; More + Articles</h3>\n                <p>\n                    <ul>\n                        <li>Books, journals, audio, video, scores, images and article-level content</li>\n                        <li>Large amount requestable</li>\n                        <li>While not exhaustive, a significant number of our databases can be searched at once.</li>\n                    </ul>\n                </p>\n                <h3>Books &amp; More + NYU-E + Articles</h3>\n                <p><ul>\n                    <li>Broadest search</li>\n                    <li>Visit other libraries for onsite access to their electronic content</li></ul></p>\n                <div class="searching-card">\n                    <div>\n                        <a href="https://library.newschool.edu/faq/222184" target="_blank" class="searching-card-link">Search Tips</a>\n                    </div>\n                </div>\n            </md-card-content>\n        </md-card>\n\n      <md-card class="default-card _md md-primoExplore-theme">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">Archives & Special Collections</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p>The \'Books & More\' search does not include Archives & Special Collections.</p>\n                <p>Use the links below to explore their colection of primary sources and rare & unique books.</p>\n                <div class="card-link-div">\n                    <a href="https://archives.newschool.edu/" target="_blank" class="archives-card-link"> Archives Home</a>\n                    <a href="https://findingaids.archives.newschool.edu/" target="_blank" class="archives-card-link">Finding Aids & Collections</a>\n                    <a href="https://digitalarchives.library.newschool.edu/" target="_blank" class="archives-card-link">Digital Collections</a>\n                </div>\n                <div id="archives-socials" class="social-div">\n                    <a title="The Archives On Twitter" href="https://twitter.com/TNSArchives" target="_blank">\n                        <i class="fa fa-twitter-square fa-3"></i></a>\n                    <a title="The Archives On Instagram" href="https://www.instagram.com/newschoolarchives/" target="_blank">\n                        <i class="fa fa-instagram fa-3"></i></a>\n                </div>\n            </md-card-content>\n</md-card>\n\n        <!-- <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">Additional Options</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n              <p>\n                <a href="http://bobcat.library.nyu.edu/newschool" target="_blank" class="addopt-card-link">Search an older version of the catalog</a>\n              </p>\n               <p>\n                <a href="http://ill.library.nyu.edu/illiad/ZMU" target="_blank" class="addopt-card-link">Request an item from Inter-Library Loan</a>\n              </p>\n              <p>\n                <a href="http://www.worldcat.org/search?qt=worldcat_org_all" target="_blank" class="addopt-card-link">Search WorldCat for items in nearby libraries</a>\n              </p>\n             <p>\n                <a href="http://library.newschool.edu/services/request-a-purchase.php" target="_blank" class="addopt-card-link">Recommend An Item For Purchase</a>\n              </p>\n            </md-card-content>\n        </md-card> -->\n\n\n    </div>\n    <div flex-xs="100" flex="50" layout="column">\n\n    \n\n<md-card class="default-card _md md-primoExplore-theme">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">Need Help?</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p><a href="https://library.newschool.edu/ask-us">Submit you question</a> or click the \'Ask Us\' button on the bottom-right to start a live chat with one of our Library staff members.</p>\n                <h3>Helpful Links</h3>\n                <ul class="card-list-links">\n                    <li><a href="https://library.newschool.edu/faq">Library FAQ</a></li>\n                    <li><a href="https://guides.library.newschool.edu/">Research Guides</a></li>\n                    <li><a href="https://www.youtube.com/channel/UC6ZYurVTUOph_tetE-DqS5Q">Video Tutorials</a></li>\n                    <li><a href="https://library.newschool.edu/consultation">Meet with your Librarian</a></li>\n                </ul>\n            </md-card-content>\n</md-card>\n\n        <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">The New School Libraries</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p>The New School Libraries provide access to collections, services, and spaces sufficient in quality, depth, diversity, format, and currency to support the research and teaching missions of The New School.</p>\n                <h3>Related Links</h3>\n                <ul class="card-list-links">\n                    <li><a href="https://library.newschool.edu/ill">Request Inter-Library Loan</a></li>\n                    <li><a href="https://library.newschool.edu/request-purchase">Recommend a Purchase</a></li>\n                    <li><a href="http://www.worldcat.org/search?qt=worldcat_org_all">Search nearby Libraries</a></li>\n                    <li><a href="https://library.newschool.edu/my-access">My Access</a></li>\n                </ul>\n                <h3>Follow Us</h3>\n                <div id="library-socials" class="social-div">\n                    <a title="The Libraries On Twitter" href="https://twitter.com/TNSLibraries" target="_blank"><i class="fa fa-twitter-square fa-3"></i></a>\n                    <a title="The Libraries On Facebook" href="https://www.facebook.com/pages/The-New-School-Libraries-Archives/154098911288367" target="_blank"><i class="fa fa-facebook-square fa-3"></i></a>\n                    <a title="The Libraries On YouTube" href="https://www.youtube.com/playlist?list=PLWhTJDazgMDll-oUpsu8Z2wmgsJX79GvF" target="_blank"><i class="fa fa-youtube-square fa-3"></i></a> \n                </div>\n\n            </md-card-content>\n        </md-card>\n<!-- \n        <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">Follow the Archives</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p>\n            <div id="" style="text-align:left !important">\n            <a title="The Archives On Twitter" style="color: #e82e21;font-size:4em; margin-right: 0.313em;" href="https://twitter.com/TNSArchives" target="_blank"><i class="fa fa-twitter-square fa-3"></i></a>\n            <a title="The Archives On Instagram" style="color: #e82e21;font-size:4em; margin-right: 0.313em;" href="https://www.instagram.com/newschoolarchives/" target="_blank"><i class="fa fa-instagram fa-3"></i></a>\n            </div>\n                </p>\n\n            </md-card-content>\n        </md-card> -->\n\n    </div>\n</md-content>\n');
  $templateCache.put('primo-explore-tnsstyles/html/homepage_en.html', '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" />\n<md-content layout-xs="column" layout="row">\n    <div flex-xs="100" flex="50" layout="column">\n\n        <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">What Am I Searching?</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <h3>Books &amp; More + Articles</h3>\n                <p>\n                    <ul>\n                        <li>Books, journals, audio, video, scores, images and article-level content</li>\n                        <li>Large amount requestable</li>\n                        <li>While not exhaustive, a significant number of our databases can be searched at once.</li>\n                    </ul>\n                </p>\n                <h3>Books &amp; More + NYU-E + Articles</h3>\n                <p><ul>\n                    <li>Broadest search</li>\n                    <li>Visit other libraries for onsite access to their electronic content</li></ul></p>\n                <div class="searching-card">\n                    <div>\n                        <a href="https://library.newschool.edu/faq/222184" target="_blank" class="searching-card-link">Search Tips</a>\n                    </div>\n                </div>\n            </md-card-content>\n        </md-card>\n\n      <md-card class="default-card _md md-primoExplore-theme">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">Archives & Special Collections</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p>The \'Books & More\' search does not include Archives & Special Collections.</p>\n                <p>Use the links below to explore their colection of primary sources and rare & unique books.</p>\n                <div class="card-link-div">\n                    <a href="https://archives.newschool.edu/" target="_blank" class="archives-card-link"> Archives Home</a>\n                    <a href="https://findingaids.archives.newschool.edu/" target="_blank" class="archives-card-link">Finding Aids & Collections</a>\n                    <a href="https://digitalarchives.library.newschool.edu/" target="_blank" class="archives-card-link">Digital Collections</a>\n                </div>\n                <div id="archives-socials" class="social-div">\n                    <a title="The Archives On Twitter" href="https://twitter.com/TNSArchives" target="_blank">\n                        <i class="fa fa-twitter-square fa-3"></i></a>\n                    <a title="The Archives On Instagram" href="https://www.instagram.com/newschoolarchives/" target="_blank">\n                        <i class="fa fa-instagram fa-3"></i></a>\n                </div>\n            </md-card-content>\n</md-card>\n\n        <!-- <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">Additional Options</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n              <p>\n                <a href="http://bobcat.library.nyu.edu/newschool" target="_blank" class="addopt-card-link">Search an older version of the catalog</a>\n              </p>\n               <p>\n                <a href="http://ill.library.nyu.edu/illiad/ZMU" target="_blank" class="addopt-card-link">Request an item from Inter-Library Loan</a>\n              </p>\n              <p>\n                <a href="http://www.worldcat.org/search?qt=worldcat_org_all" target="_blank" class="addopt-card-link">Search WorldCat for items in nearby libraries</a>\n              </p>\n             <p>\n                <a href="http://library.newschool.edu/services/request-a-purchase.php" target="_blank" class="addopt-card-link">Recommend An Item For Purchase</a>\n              </p>\n            </md-card-content>\n        </md-card> -->\n\n\n    </div>\n    <div flex-xs="100" flex="50" layout="column">\n\n    \n\n<md-card class="default-card _md md-primoExplore-theme">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">Need Help?</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p><a href="https://library.newschool.edu/ask-us">Submit you question</a> or click the \'Ask Us\' button on the bottom-right to start a live chat with one of our Library staff members.</p>\n                <h3>Helpful Links</h3>\n                <ul class="card-list-links">\n                    <li><a href="https://library.newschool.edu/faq">Library FAQ</a></li>\n                    <li><a href="https://guides.library.newschool.edu/">Research Guides</a></li>\n                    <li><a href="https://www.youtube.com/channel/UC6ZYurVTUOph_tetE-DqS5Q">Video Tutorials</a></li>\n                    <li><a href="https://library.newschool.edu/consultation">Meet with your Librarian</a></li>\n                </ul>\n            </md-card-content>\n</md-card>\n\n        <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">The New School Libraries</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p>The New School Libraries provide access to collections, services, and spaces sufficient in quality, depth, diversity, format, and currency to support the research and teaching missions of The New School.</p>\n                <h3>Related Links</h3>\n                <ul class="card-list-links">\n                    <li><a href="https://library.newschool.edu/ill">Request Inter-Library Loan</a></li>\n                    <li><a href="https://library.newschool.edu/request-purchase">Recommend a Purchase</a></li>\n                    <li><a href="http://www.worldcat.org/search?qt=worldcat_org_all">Search nearby Libraries</a></li>\n                    <li><a href="https://library.newschool.edu/my-access">My Access</a></li>\n                </ul>\n                <h3>Follow Us</h3>\n                <div id="library-socials" class="social-div">\n                    <a title="The Libraries On Twitter" href="https://twitter.com/TNSLibraries" target="_blank"><i class="fa fa-twitter-square fa-3"></i></a>\n                    <a title="The Libraries On Facebook" href="https://www.facebook.com/pages/The-New-School-Libraries-Archives/154098911288367" target="_blank"><i class="fa fa-facebook-square fa-3"></i></a>\n                    <a title="The Libraries On YouTube" href="https://www.youtube.com/playlist?list=PLWhTJDazgMDll-oUpsu8Z2wmgsJX79GvF" target="_blank"><i class="fa fa-youtube-square fa-3"></i></a> \n                </div>\n\n            </md-card-content>\n        </md-card>\n<!-- \n        <md-card class="default-card">\n            <md-card-title>\n                <md-card-title-text>\n                    <span class="md-headline">Follow the Archives</span>\n                </md-card-title-text>\n            </md-card-title>\n            <md-card-content>\n                <p>\n            <div id="" style="text-align:left !important">\n            <a title="The Archives On Twitter" style="color: #e82e21;font-size:4em; margin-right: 0.313em;" href="https://twitter.com/TNSArchives" target="_blank"><i class="fa fa-twitter-square fa-3"></i></a>\n            <a title="The Archives On Instagram" style="color: #e82e21;font-size:4em; margin-right: 0.313em;" href="https://www.instagram.com/newschoolarchives/" target="_blank"><i class="fa fa-instagram fa-3"></i></a>\n            </div>\n                </p>\n\n            </md-card-content>\n        </md-card> -->\n\n    </div>\n</md-content>\n');
});
app.component('prmUserAreaExpandableAfter', {
  bindings: {},
  template: '<button id="userSnap" class="user-button sign-in-btn-ctm md-button md-primoExplore-theme md-ink-ripple"><a ng-href="https://collector.usersnap.com/a801f2b8-e10c-4646-a60b-a48cf51331cc" target="_blank">Feedback</a><div class="md-ripple-container" style=""></div></button>'
});
app.component('prmActionListAfter', {
  bindings: {},
  template: '<div class="bar alert-bar layout-align-center-center layout-row" layout-align="center center" style="background-color:#ffe6e6 !important;"><span class="bar-text"><b>Alert:</b> The library is migrating to new software to streamline course reserves. <a href="https://answers.library.newschool.edu/faq/409245" target="_blank">View our&nbsp;<u>FAQ</u></a> for important dates and details for Summer and Fall courses.</span></div>'
});
// Adds the chat button
(function () {
  var lc = document.createElement('script');lc.type = 'text/javascript';lc.async = 'true';
  lc.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'v2.libanswers.com/load_chat.php?hash=cbce51a8ddaa668009b16150e9f08e36';
  var s = document.getElementsByTagName('script')[0];s.parentNode.insertBefore(lc, s);
})();

// Ends the chat button

// Adds the userway button
(function () {
  var uw = document.createElement('script');uw.type = 'text/javascript';uw.async = 'true';
  uw.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'cdn.userway.org/widget.js';
  uw.setAttribute('data-account', 'kDhyiUigGS');
  var uws = document.getElementsByTagName('script')[0];uws.parentNode.insertBefore(uw, uws);
})();
//

// Ends the userway button
angular.module('customNoSearchResults', []).component('prmNoSearchResultAfter', {
  bindings: {
    parentCtrl: '<'
  },
  templateUrl: ['customNoSearchResultsTemplateUrl', function (customNoSearchResultsTemplateUrl) {
    return customNoSearchResultsTemplateUrl;
  }]
});
})();
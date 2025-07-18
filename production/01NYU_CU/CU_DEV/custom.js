(function(){
"use strict";
'use strict';

var app = angular.module('viewCustom', ['angularLoad']);
"use strict";
'use strict';

"use strict";
'use strict';

/* global angular */

// eslint-disable-next-line no-unused-vars


// ****************************************
// 01-config-helpers.js
// ****************************************

/* global window */

// eslint-disable-next-line no-unused-vars
function getCdnUrl(vid) {
    // Normalize the vid, even though it's theoretically impossible for the vid to
    // not be all uppercase already, given that Primo VE is apparently case-sensitive
    // and will not consider a vid like "01nyu_inst:nyu_dev" to be valid.
    vid = vid.toLocaleUpperCase();

    var CDN_DEV = 'https://cdn-dev.library.nyu.edu/primo-customization';
    var CDN_PROD = 'https://cdn.library.nyu.edu/primo-customization';

    var VID_DEV_SUFFIX = '_DEV';

    // Special CDN assignments based on exact vid name, not vid name pattern.
    var vidToCdnUrlMap = {
        '01NYU_INST:TESTWS01': CDN_DEV
    };

    var hostname = window.location.hostname;
    var view = parseViewDirectoryName(vid);

    var baseUrl = void 0;
    if (hostname === 'localhost') {
        baseUrl = 'http://localhost:3000/primo-customization';
    } else if (hostname === 'sandbox02-na.primo.exlibrisgroup.com') {
        baseUrl = 'https://d290kawcj1dea9.cloudfront.net/primo-customization';
    } else if (hostname === 'primo-explore-devenv') {
        // Running in the headless browser in the Docker Compose `e2e` service.
        baseUrl = 'http://cdn-server:3000/primo-customization';
    } else if (vid.endsWith(VID_DEV_SUFFIX)) {
        baseUrl = CDN_DEV;
    } else {
        // Couldn't assign CDN based on hostname or vid name pattern.
        // Check vid -> CDN map, and if that doesn't return anything, default to
        // prod CDN.
        baseUrl = vidToCdnUrlMap[vid] || CDN_PROD;
    }

    return baseUrl + '/' + view;
}

function parseViewDirectoryName(vid) {
    return vid.replaceAll(':', '-');
}

// ****************************************
// 01-config.js
// ****************************************

/* global app, console, getCdnUrl, URLSearchParams, window */

var searchParams = new URLSearchParams(window.location.search);
var vid = searchParams.get('vid');
var cdnUrl = getCdnUrl(vid);

console.log('[DEBUG] cdnUrl = ' + cdnUrl);

// All the code in our customization package is run inside an IIFE (Immediately
// Invoked Function Expression), which means any variables defined here are not
// accessible to the CDN JS code.  The only way for the CDN JS code to know the
// CDN URL without duplicating `getCdnUrl()` there is to attach it to an object
// it has access to, or to inject it in a <script> or DOM element on the page.
// We choose to attach it to the global `window` object since we are already
// allowing the Third Iron code to attach the `browzine` object to `window` for
// LibKey functionality, and it seems safe enough using the `nyulibraries`
// namespace.
window.nyulibraries = {
    cdnUrl: cdnUrl
};

// This is necessary to allow the `templateURL` method to fetch cross-domain
// from the CDN.
app.config(function ($sceDelegateProvider) {
    $sceDelegateProvider.trustedResourceUrlList(['self',
    // Keeping this here commented out as a reminder that "*" can
    // be used in domain name for wildcarding.
    // 'https://cdn*.library.nyu.edu/primo-customization/01NYU_INST-TESTWS01/**',
    cdnUrl + '/**']);
});

// ****************************************
// 02-filters.js
// ****************************************

/* global app */

app.filter('encodeURIComponent', ['$window', function ($window) {
    return $window.encodeURIComponent;
}]);

// ****************************************
// 03-inject.js
// ****************************************

/* global cdnUrl, document */

// eslint-disable-next-line no-unused-vars
function injectCDNResourceTags() {
    injectLinkTagsForCDNCustomCSS();
    injectScriptTagForCDNCustomJS();
}

function injectScriptTagForCDNCustomJS() {
    // We have decided to rename CDN custom.{css,js} files to external.{css,js}.
    // We may not be able to deploy the package and CDN code simultaneously, so
    // we are setting up a transition phase where we inject script tags for
    // both custom.js and external.js.  After the CDN has been updated with
    // new filenames, we will delete the custom.js <script> tag.s
    var scriptCustom = document.createElement('script');
    scriptCustom.setAttribute('src', cdnUrl + '/js/custom.js');
    document.body.appendChild(scriptCustom);

    var scriptExternal = document.createElement('script');
    scriptExternal.setAttribute('src', cdnUrl + '/js/external.js');
    document.body.appendChild(scriptExternal);
}

function injectLinkTagsForCDNCustomCSS() {
    ['app-colors.css',
    // We have decided to rename CDN custom.{css,js} files to external.{css,js}.
    // We may not be able to deploy the package and CDN code simultaneously, so
    // we are setting up a transition phase where we inject link tags for
    // both custom.css and external.css.  After the CDN has been updated with
    // new filenames, we will delete the custom.css <link> tag.
    'custom.css', 'external.css'].forEach(function (file) {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';

        document.head.appendChild(link);

        link.href = cdnUrl + '/css/' + file;
    });
}

// ****************************************
// 04-libkey.js
// ****************************************

/* global app, cdnUrl, console, window */

// Option 2 from:
//     https://thirdiron.atlassian.net/wiki/spaces/BrowZineAPIDocs/pages/79200260/Ex+Libris+Primo+Integration

app.controller('prmSearchResultAvailabilityLineAfterAppStoreGeneratedControllerAppStoreGeneratedAppStoreGenerated', function ($scope, $rootScope) {
    // BEGIN Generic CDN-based customization stuff moved here from autogenerated directives file.
    var vm = this;

    vm.getPnx = function () {
        try {
            return vm.parentCtrl.item.pnx;
        } catch (err) {
            console.log('prmSearchResultAvailabilityLineAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

            return null;
        }
    };

    vm.rootScope = $rootScope;
    vm.scope = $scope;
    // END Generic CDN-based customization stuff moved here from autogenerated directives file.

    // ------- BEGIN: LIBKEY CODE -------
    // Originally the only LibKey code used in this controller after the LibKey
    // configuration code was moved to the CDN was this line:
    //
    //     window.browzine.primo.searchResult( $scope );
    //
    // ...which worked fine when running normally in a browser on Mac, but more
    // often than not error'ed out when running in CircleCI.  Here's one example:
    // https://app.circleci.com/pipelines/github/NYULibraries/primo-customization/126/workflows/68978317-ffe9-43f5-b937-7fa43dc85d96/jobs/106/parallel-runs/0/steps/0-103
    //
    // The error:
    //
    //     TypeError: Cannot read properties of undefined (reading 'searchResult')
    //     at Object.<anonymous> (http://primo-explore-devenv:8003/discovery/custom/01NYU_INST-NYU_DEV/js/custom.js:100:27)
    //
    // This appears to be due to a race condition in which the `prmSearchResultAvailabilityLineAfterAppStoreGenerated`
    // components render before the 3rd party `browzine-primo-adapter.js` <script>
    // injected into <head> executes and adds `browzine` to the `window` object before
    // Primo returns search results.  This could be due to a delay in fetching
    // the script from Third Iron's hosting service, or a delay in injecting the
    // <script> tag, or both.
    //
    // Even before the LibKey configuration and <script> tag injection code was
    // moved to CDN, there were frequently e2e test failures when run in containers
    // (locally, as well as in CircleCI).  Increasing the test timeout seemed
    // to eliminate these failures.  After the code move to CDN, timeout increases
    // no longer seemed to help.
    //
    // Here we use a retry/timeout function which does continuous polling of the
    // DOM to determine when it can do its own DOM manipulations.
    // We set a limit on number of retries and duration of continuous polling,
    // to prevent wasteful infinite looping in the event of failure to load the
    // 3rd-party hosted `browzine-primo-adapter.js`.

    // Limit how long to wait for `browzine-primo-adapter.js` to 15 seconds.
    // Note that we can't use underscore numeric separators (e.g. 5_000 for 5,000) because
    // `primo-explore-devenv`'s `gulp-babel` flags it as a syntax error:
    // "Identifier directly after number"
    var TIMEOUT = 30000;

    var start = void 0;
    var numTries = 0;
    function tryBrowzinePrimoSearchResult(timeStamp) {
        numTries++;

        if (start === undefined) {
            start = timeStamp;
        }
        var elapsed = timeStamp - start;
        if (elapsed < TIMEOUT) {
            try {
                window.browzine.primo.searchResult($scope);
            } catch (error) {
                window.requestAnimationFrame(tryBrowzinePrimoSearchResult);
            }
        } else {
            console.log('window.browzine.primo.searchResult( $scope ) failed' + (' after ' + numTries + ' tries and ' + Math.floor(TIMEOUT / 1000) + ' seconds'));
        }
    }
    window.requestAnimationFrame(tryBrowzinePrimoSearchResult);
    // ------- END: LIBKEY CODE -------
});

app.component('prmSearchResultAvailabilityLineAfterAppStoreGenerated', {
    bindings: { parentCtrl: '<' },
    controller: 'prmSearchResultAvailabilityLineAfterAppStoreGeneratedControllerAppStoreGeneratedAppStoreGenerated',
    // Generic CDN-based customization stuff moved here from autogenerated directives file.
    templateUrl: cdnUrl + '/html/prm-search-result-availability-line-after.html'
});

// ****************************************
// 05-autogenerated-custom-directives.js
// ****************************************
//
// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// SEE README.MD FOR INSTRUCTIONS ON HOW TO REGENERATE THIS FILE.

/* global app, cdnUrl, console */

function generateAllPossibleCustomDirectives() {
    // ALMA-HOWOVP-AFTER
    app.component('almaHowovpAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('almaHowovpAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/alma-howovp-after.html'
    });

    // ALMA-HTGI-BACK-BUTTON-AFTER
    app.component('almaHtgiBackButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('almaHtgiBackButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/alma-htgi-back-button-after.html'
    });

    // ALMA-HTGI-SVC-AFTER
    app.component('almaHtgiSvcAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('almaHtgiSvcAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/alma-htgi-svc-after.html'
    });

    // ALMA-HTGI-TABS-AFTER
    app.component('almaHtgiTabsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('almaHtgiTabsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/alma-htgi-tabs-after.html'
    });

    // HLS-VIDEO-AFTER
    app.component('hlsVideoAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('hlsVideoAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/hls-video-after.html'
    });

    // NG-FORWARD-HACK-AFTER
    app.component('ngForwardHackAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('ngForwardHackAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/ng-forward-hack-after.html'
    });

    // PICKUP-ANYWHERE-FORM-AFTER
    app.component('pickupAnywhereFormAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('pickupAnywhereFormAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/pickup-anywhere-form-after.html'
    });

    // PRM-ACCOUNT-AFTER
    app.component('prmAccountAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAccountAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-account-after.html'
    });

    // PRM-ACCOUNT-LINKS-AFTER
    app.component('prmAccountLinksAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAccountLinksAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-account-links-after.html'
    });

    // PRM-ACCOUNT-OVERVIEW-AFTER
    app.component('prmAccountOverviewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAccountOverviewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-account-overview-after.html'
    });

    // PRM-ACTION-CONTAINER-AFTER
    app.component('prmActionContainerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmActionContainerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-action-container-after.html'
    });

    // PRM-ACTION-LIST-AFTER
    app.component('prmActionListAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmActionListAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-action-list-after.html'
    });

    // PRM-ADD-ALERT-TOAST-AFTER
    app.component('prmAddAlertToastAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAddAlertToastAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-add-alert-toast-after.html'
    });

    // PRM-ADD-QUERY-TO-SAVED-SEARCHES-AFTER
    app.component('prmAddQueryToSavedSearchesAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAddQueryToSavedSearchesAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-add-query-to-saved-searches-after.html'
    });

    // PRM-ADDITIONAL-SERVICES-AFTER
    app.component('prmAdditionalServicesAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAdditionalServicesAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-additional-services-after.html'
    });

    // PRM-ADVANCED-SEARCH-AFTER
    app.component('prmAdvancedSearchAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAdvancedSearchAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-advanced-search-after.html'
    });

    // PRM-ALMA-MASHUP-AFTER
    app.component('prmAlmaMashupAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaMashupAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-mashup-after.html'
    });

    // PRM-ALMA-MORE-INST-AFTER
    app.component('prmAlmaMoreInstAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaMoreInstAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-more-inst-after.html'
    });

    // PRM-ALMA-OTHER-MEMBERS-AFTER
    app.component('prmAlmaOtherMembersAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaOtherMembersAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-other-members-after.html'
    });

    // PRM-ALMA-OTHER-UNITS-AFTER
    app.component('prmAlmaOtherUnitsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaOtherUnitsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-other-units-after.html'
    });

    // PRM-ALMA-REPRESENTATIONS-FILTER-AFTER
    app.component('prmAlmaRepresentationsFilterAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaRepresentationsFilterAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-representations-filter-after.html'
    });

    // PRM-ALMA-VIEWER-AFTER
    app.component('prmAlmaViewerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaViewerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-viewer-after.html'
    });

    // PRM-ALMA-VIEWIT-AFTER
    app.component('prmAlmaViewitAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaViewitAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-viewit-after.html'
    });

    // PRM-ALMA-VIEWIT-ITEMS-AFTER
    app.component('prmAlmaViewitItemsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaViewitItemsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-viewit-items-after.html'
    });

    // PRM-ALPHABET-TOOLBAR-AFTER
    app.component('prmAlphabetToolbarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlphabetToolbarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alphabet-toolbar-after.html'
    });

    // PRM-ATOZ-SEARCH-BAR-AFTER
    app.component('prmAtozSearchBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAtozSearchBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-atoz-search-bar-after.html'
    });

    // PRM-AUTHENTICATION-AFTER
    app.component('prmAuthenticationAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAuthenticationAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-authentication-after.html'
    });

    // PRM-BACK-TO-LIBRARY-SEARCH-AFTER
    app.component('prmBackToLibrarySearchAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBackToLibrarySearchAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-back-to-library-search-after.html'
    });

    // PRM-BACK-TO-LIBRARY-SEARCH-BUTTON-AFTER
    app.component('prmBackToLibrarySearchButtonAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBackToLibrarySearchButtonAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-back-to-library-search-button-after.html'
    });

    // PRM-BACK-TO-SEARCH-RESULTS-BUTTON-AFTER
    app.component('prmBackToSearchResultsButtonAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBackToSearchResultsButtonAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-back-to-search-results-button-after.html'
    });

    // PRM-BANNER-CARD-CONTENT-AFTER
    app.component('prmBannerCardContentAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBannerCardContentAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-banner-card-content-after.html'
    });

    // PRM-BARCODE-SEARCH-AFTER
    app.component('prmBarcodeSearchAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBarcodeSearchAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-barcode-search-after.html'
    });

    // PRM-BLANK-ILL-AFTER
    app.component('prmBlankIllAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBlankIllAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-blank-ill-after.html'
    });

    // PRM-BLANK-PURCHASE-REQUEST-AFTER
    app.component('prmBlankPurchaseRequestAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBlankPurchaseRequestAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-blank-purchase-request-after.html'
    });

    // PRM-BREADCRUMBS-AFTER
    app.component('prmBreadcrumbsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBreadcrumbsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-breadcrumbs-after.html'
    });

    // PRM-BRIEF-RESULT-AFTER
    app.component('prmBriefResultAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-after.html'
    });

    // PRM-BRIEF-RESULT-CONTAINER-AFTER
    app.component('prmBriefResultContainerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultContainerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-container-after.html'
    });

    // PRM-BRIEF-RESULT-DELIVERY-OPTION-LINK-AFTER
    app.component('prmBriefResultDeliveryOptionLinkAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultDeliveryOptionLinkAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-delivery-option-link-after.html'
    });

    // PRM-BRIEF-RESULT-DIGITAL-BEST-OFFER-AFTER
    app.component('prmBriefResultDigitalBestOfferAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultDigitalBestOfferAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-digital-best-offer-after.html'
    });

    // PRM-BRIEF-RESULT-PHYSICAL-BEST-OFFER-AFTER
    app.component('prmBriefResultPhysicalBestOfferAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultPhysicalBestOfferAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-physical-best-offer-after.html'
    });

    // PRM-BROWSE-RESULT-AFTER
    app.component('prmBrowseResultAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBrowseResultAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-browse-result-after.html'
    });

    // PRM-BROWSE-SEARCH-AFTER
    app.component('prmBrowseSearchAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBrowseSearchAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-browse-search-after.html'
    });

    // PRM-BROWSE-SEARCH-BAR-AFTER
    app.component('prmBrowseSearchBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBrowseSearchBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-browse-search-bar-after.html'
    });

    // PRM-CHAPTERS-AND-REVIEWS-ITEM-AFTER
    app.component('prmChaptersAndReviewsItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmChaptersAndReviewsItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-chapters-and-Reviews-item-after.html'
    });

    // PRM-CHAPTERS-AND-REVIEWS-AFTER
    app.component('prmChaptersAndReviewsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmChaptersAndReviewsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-chapters-and-reviews-after.html'
    });

    // PRM-CHAPTERS-RESULTS-LINE-AFTER
    app.component('prmChaptersResultsLineAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmChaptersResultsLineAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-chapters-results-line-after.html'
    });

    // PRM-CITATION-AFTER
    app.component('prmCitationAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-after.html'
    });

    // PRM-CITATION-LINKER-AFTER
    app.component('prmCitationLinkerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationLinkerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-linker-after.html'
    });

    // PRM-CITATION-TRAILS-BREADCRUMBS-AFTER
    app.component('prmCitationTrailsBreadcrumbsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsBreadcrumbsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-breadcrumbs-after.html'
    });

    // PRM-CITATION-TRAILS-EXPAND-BUTTON-AFTER
    app.component('prmCitationTrailsExpandButtonAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsExpandButtonAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-expand-button-after.html'
    });

    // PRM-CITATION-TRAILS-FULLVIEW-LINK-AFTER
    app.component('prmCitationTrailsFullviewLinkAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsFullviewLinkAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-fullview-link-after.html'
    });

    // PRM-CITATION-TRAILS-INDICATION-AFTER
    app.component('prmCitationTrailsIndicationAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsIndicationAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-indication-after.html'
    });

    // PRM-CITATION-TRAILS-INDICATION-CONTAINER-AFTER
    app.component('prmCitationTrailsIndicationContainerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsIndicationContainerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-indication-container-after.html'
    });

    // PRM-CITATION-TRAILS-ITEM-AFTER
    app.component('prmCitationTrailsItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-item-after.html'
    });

    // PRM-COLLECTION-AFTER
    app.component('prmCollectionAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-after.html'
    });

    // PRM-COLLECTION-BREADCRUMBS-AFTER
    app.component('prmCollectionBreadcrumbsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionBreadcrumbsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-breadcrumbs-after.html'
    });

    // PRM-COLLECTION-DISCOVERY-AFTER
    app.component('prmCollectionDiscoveryAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionDiscoveryAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-discovery-after.html'
    });

    // PRM-COLLECTION-DISCOVERY-VIEW-SWITCHER-AFTER
    app.component('prmCollectionDiscoveryViewSwitcherAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionDiscoveryViewSwitcherAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-discovery-view-switcher-after.html'
    });

    // PRM-COLLECTION-GALLERY-AFTER
    app.component('prmCollectionGalleryAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionGalleryAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-gallery-after.html'
    });

    // PRM-COLLECTION-GALLERY-HEADER-AFTER
    app.component('prmCollectionGalleryHeaderAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionGalleryHeaderAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-gallery-header-after.html'
    });

    // PRM-COLLECTION-NAVIGATION-BREADCRUMBS-AFTER
    app.component('prmCollectionNavigationBreadcrumbsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionNavigationBreadcrumbsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-navigation-breadcrumbs-after.html'
    });

    // PRM-COLLECTION-NAVIGATION-BREADCRUMBS-ITEM-AFTER
    app.component('prmCollectionNavigationBreadcrumbsItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionNavigationBreadcrumbsItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-navigation-breadcrumbs-item-after.html'
    });

    // PRM-COLLECTION-SEARCH-AFTER
    app.component('prmCollectionSearchAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionSearchAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-search-after.html'
    });

    // PRM-CONTROLLED-VOCABULARY-AFTER
    app.component('prmControlledVocabularyAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmControlledVocabularyAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-controlled-vocabulary-after.html'
    });

    // PRM-COPY-CLIPBOARD-BTN-AFTER
    app.component('prmCopyClipboardBtnAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCopyClipboardBtnAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-copy-clipboard-btn-after.html'
    });

    // PRM-COPYRIGHTS-AFTER
    app.component('prmCopyrightsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCopyrightsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-copyrights-after.html'
    });

    // PRM-DATABASES-AFTER
    app.component('prmDatabasesAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDatabasesAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-databases-after.html'
    });

    // PRM-DATABASES-CATEGORIZE-AFTER
    app.component('prmDatabasesCategorizeAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDatabasesCategorizeAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-databases-categorize-after.html'
    });

    // PRM-DATABASES-FULL-VIEW-AFTER
    app.component('prmDatabasesFullViewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDatabasesFullViewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-databases-full-view-after.html'
    });

    // PRM-DATABASES-RESULTS-AFTER
    app.component('prmDatabasesResultsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDatabasesResultsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-databases-results-after.html'
    });

    // PRM-DELIVERY-REGISTRATION-AFTER
    app.component('prmDeliveryRegistrationAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDeliveryRegistrationAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-delivery-registration-after.html'
    });

    // PRM-DELIVERY-SESSION-EXPIRY-NOTIFICATION-AFTER
    app.component('prmDeliverySessionExpiryNotificationAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDeliverySessionExpiryNotificationAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-delivery-session-expiry-notification-after.html'
    });

    // PRM-DENIED-ACCESS-AFTER
    app.component('prmDeniedAccessAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDeniedAccessAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-denied-access-after.html'
    });

    // PRM-DEPOSITS-AFTER
    app.component('prmDepositsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDepositsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-deposits-after.html'
    });

    // PRM-DEPOSITS-LINK-AFTER
    app.component('prmDepositsLinkAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDepositsLinkAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-deposits-link-after.html'
    });

    // PRM-DEPOSITS-OVERVIEW-AFTER
    app.component('prmDepositsOverviewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDepositsOverviewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-deposits-overview-after.html'
    });

    // PRM-DID-U-MEAN-AFTER
    app.component('prmDidUMeanAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDidUMeanAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-did-u-mean-after.html'
    });

    // PRM-EASYBIB-AFTER
    app.component('prmEasybibAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmEasybibAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-easybib-after.html'
    });

    // PRM-EDIT-NOTIFICATION-SETTINGS-AFTER
    app.component('prmEditNotificationSettingsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmEditNotificationSettingsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-edit-notification-settings-after.html'
    });

    // PRM-ENDNOTE-AFTER
    app.component('prmEndnoteAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmEndnoteAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-endnote-after.html'
    });

    // PRM-EPUB-FOLIATE-VIEWER-AFTER
    app.component('prmEpubFoliateViewerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmEpubFoliateViewerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-epub-foliate-viewer-after.html'
    });

    // PRM-EXPLORE-FOOTER-AFTER
    app.component('prmExploreFooterAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExploreFooterAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-explore-footer-after.html'
    });

    // PRM-EXPLORE-MAIN-AFTER
    app.component('prmExploreMainAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExploreMainAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-explore-main-after.html'
    });

    // PRM-EXPORT-BIBTEX-AFTER
    app.component('prmExportBibtexAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExportBibtexAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-export-bibtex-after.html'
    });

    // PRM-EXPORT-EXCEL-AFTER
    app.component('prmExportExcelAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExportExcelAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-export-excel-after.html'
    });

    // PRM-EXPORT-RIS-AFTER
    app.component('prmExportRisAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExportRisAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-export-ris-after.html'
    });

    // PRM-FACET-AFTER
    app.component('prmFacetAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFacetAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-facet-after.html'
    });

    // PRM-FACET-EXACT-AFTER
    app.component('prmFacetExactAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFacetExactAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-facet-exact-after.html'
    });

    // PRM-FACET-RANGE-AFTER
    app.component('prmFacetRangeAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFacetRangeAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-facet-range-after.html'
    });

    // PRM-FAVORITES-AFTER
    app.component('prmFavoritesAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-after.html'
    });

    // PRM-FAVORITES-EDIT-LABELS-MENU-AFTER
    app.component('prmFavoritesEditLabelsMenuAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesEditLabelsMenuAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-edit-labels-menu-after.html'
    });

    // PRM-FAVORITES-LABELS-AFTER
    app.component('prmFavoritesLabelsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesLabelsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-labels-after.html'
    });

    // PRM-FAVORITES-RECORD-LABELS-AFTER
    app.component('prmFavoritesRecordLabelsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesRecordLabelsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-record-labels-after.html'
    });

    // PRM-FAVORITES-TOOL-BAR-AFTER
    app.component('prmFavoritesToolBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesToolBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-tool-bar-after.html'
    });

    // PRM-FAVORITES-WARNING-MESSAGE-AFTER
    app.component('prmFavoritesWarningMessageAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesWarningMessageAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-warning-message-after.html'
    });

    // PRM-FEATURED-RESULT-ITEM-AFTER
    app.component('prmFeaturedResultItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFeaturedResultItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-featured-result-item-after.html'
    });

    // PRM-FEATURED-RESULTS-AFTER
    app.component('prmFeaturedResultsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFeaturedResultsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-featured-results-after.html'
    });

    // PRM-FINES-AFTER
    app.component('prmFinesAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFinesAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-fines-after.html'
    });

    // PRM-FINES-OVERVIEW-AFTER
    app.component('prmFinesOverviewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFinesOverviewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-fines-overview-after.html'
    });

    // PRM-FULL-VIEW-AFTER
    app.component('prmFullViewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFullViewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-full-view-after.html'
    });

    // PRM-FULL-VIEW-CONT-AFTER
    app.component('prmFullViewContAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFullViewContAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-full-view-cont-after.html'
    });

    // PRM-FULL-VIEW-PAGE-AFTER
    app.component('prmFullViewPageAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFullViewPageAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-full-view-page-after.html'
    });

    // PRM-FULL-VIEW-SERVICE-CONTAINER-AFTER
    app.component('prmFullViewServiceContainerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFullViewServiceContainerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-full-view-service-container-after.html'
    });

    // PRM-GALLERY-COLLECTION-AFTER
    app.component('prmGalleryCollectionAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGalleryCollectionAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-gallery-collection-after.html'
    });

    // PRM-GALLERY-COLLECTIONS-LIST-AFTER
    app.component('prmGalleryCollectionsListAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGalleryCollectionsListAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-gallery-collections-list-after.html'
    });

    // PRM-GALLERY-ITEM-AFTER
    app.component('prmGalleryItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGalleryItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-gallery-item-after.html'
    });

    // PRM-GALLERY-ITEMS-LIST-AFTER
    app.component('prmGalleryItemsListAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGalleryItemsListAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-gallery-items-list-after.html'
    });

    // PRM-GET-IT-REQUEST-AFTER
    app.component('prmGetItRequestAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGetItRequestAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-get-it-request-after.html'
    });

    // PRM-ICON-AFTER
    app.component('prmIconAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmIconAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-icon-after.html'
    });

    // PRM-ICP-LICENSE-FOOTER-AFTER
    app.component('prmIcpLicenseFooterAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmIcpLicenseFooterAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-icp-license-footer-after.html'
    });

    // PRM-JOURNALS-AFTER
    app.component('prmJournalsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmJournalsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-journals-after.html'
    });

    // PRM-JOURNALS-FULL-VIEW-AFTER
    app.component('prmJournalsFullViewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmJournalsFullViewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-journals-full-view-after.html'
    });

    // PRM-LANGUAGE-SELECTION-AFTER
    app.component('prmLanguageSelectionAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLanguageSelectionAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-language-selection-after.html'
    });

    // PRM-LEGANTO-AFTER
    app.component('prmLegantoAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLegantoAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-leganto-after.html'
    });

    // PRM-LEGANTO-GETIT-AFTER
    app.component('prmLegantoGetitAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLegantoGetitAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-leganto-getit-after.html'
    });

    // PRM-LIBRARIES-AROUND-BAR-AFTER
    app.component('prmLibrariesAroundBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLibrariesAroundBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-libraries-around-bar-after.html'
    });

    // PRM-LIBRARY-AFTER
    app.component('prmLibraryAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLibraryAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-library-after.html'
    });

    // PRM-LIBRARY-CARD-MENU-AFTER
    app.component('prmLibraryCardMenuAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLibraryCardMenuAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-library-card-menu-after.html'
    });

    // PRM-LINKED-DATA-AFTER
    app.component('prmLinkedDataAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLinkedDataAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-linked-data-after.html'
    });

    // PRM-LINKED-DATA-CARD-AFTER
    app.component('prmLinkedDataCardAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLinkedDataCardAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-linked-data-card-after.html'
    });

    // PRM-LINKED-USER-SELECTOR-AFTER
    app.component('prmLinkedUserSelectorAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLinkedUserSelectorAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-linked-user-selector-after.html'
    });

    // PRM-LOAN-AFTER
    app.component('prmLoanAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoanAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-loan-after.html'
    });

    // PRM-LOANS-AFTER
    app.component('prmLoansAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoansAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-loans-after.html'
    });

    // PRM-LOANS-OVERVIEW-AFTER
    app.component('prmLoansOverviewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoansOverviewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-loans-overview-after.html'
    });

    // PRM-LOCATION-AFTER
    app.component('prmLocationAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-location-after.html'
    });

    // PRM-LOCATION-HOLDINGS-AFTER
    app.component('prmLocationHoldingsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationHoldingsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-location-holdings-after.html'
    });

    // PRM-LOCATION-ITEM-AFTER
    app.component('prmLocationItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-location-item-after.html'
    });

    // PRM-LOCATION-ITEMS-AFTER
    app.component('prmLocationItemsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationItemsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-location-items-after.html'
    });

    // PRM-LOCATIONS-AFTER
    app.component('prmLocationsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-locations-after.html'
    });

    // PRM-LOGIN-AFTER
    app.component('prmLoginAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-after.html'
    });

    // PRM-LOGIN-ALMA-MASHUP-AFTER
    app.component('prmLoginAlmaMashupAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginAlmaMashupAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-alma-mashup-after.html'
    });

    // PRM-LOGIN-HELP-AFTER
    app.component('prmLoginHelpAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginHelpAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-help-after.html'
    });

    // PRM-LOGIN-IFRAME-AFTER
    app.component('prmLoginIframeAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginIframeAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-iframe-after.html'
    });

    // PRM-LOGIN-ITEM-AFTER
    app.component('prmLoginItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-item-after.html'
    });

    // PRM-LOGO-AFTER
    app.component('prmLogoAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLogoAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-logo-after.html'
    });

    // PRM-MAIN-MENU-AFTER
    app.component('prmMainMenuAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMainMenuAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-main-menu-after.html'
    });

    // PRM-MENDELEY-AFTER
    app.component('prmMendeleyAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMendeleyAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-mendeley-after.html'
    });

    // PRM-MENDELEY-TOAST-AFTER
    app.component('prmMendeleyToastAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMendeleyToastAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-mendeley-toast-after.html'
    });

    // PRM-MESSAGES-AND-BLOCKS-AFTER
    app.component('prmMessagesAndBlocksAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMessagesAndBlocksAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-messages-and-blocks-after.html'
    });

    // PRM-MESSAGES-AND-BLOCKS-OVERVIEW-AFTER
    app.component('prmMessagesAndBlocksOverviewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMessagesAndBlocksOverviewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-messages-and-blocks-overview-after.html'
    });

    // PRM-MORE-LIKE-THIS-AFTER
    app.component('prmMoreLikeThisAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMoreLikeThisAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-more-like-this-after.html'
    });

    // PRM-MORE-LIKE-THIS-ITEM-AFTER
    app.component('prmMoreLikeThisItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMoreLikeThisItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-more-like-this-item-after.html'
    });

    // PRM-MORE-LIKE-THIS-ITEM-INFO-AFTER
    app.component('prmMoreLikeThisItemInfoAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMoreLikeThisItemInfoAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-more-like-this-item-info-after.html'
    });

    // PRM-MULTI-SELECT-FILTER-AFTER
    app.component('prmMultiSelectFilterAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMultiSelectFilterAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-multi-select-filter-after.html'
    });

    // PRM-NEWSPAPERS-FACET-AFTER
    app.component('prmNewspapersFacetAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersFacetAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-facet-after.html'
    });

    // PRM-NEWSPAPERS-FULL-VIEW-AFTER
    app.component('prmNewspapersFullViewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersFullViewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-full-view-after.html'
    });

    // PRM-NEWSPAPERS-HOME-AFTER
    app.component('prmNewspapersHomeAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersHomeAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-home-after.html'
    });

    // PRM-NEWSPAPERS-SEARCH-BAR-AFTER
    app.component('prmNewspapersSearchBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersSearchBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-search-bar-after.html'
    });

    // PRM-NEWSPAPERS-SPOTLIGHT-AFTER
    app.component('prmNewspapersSpotlightAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersSpotlightAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-spotlight-after.html'
    });

    // PRM-NGRS-BRIEF-RESULT-LINE-AFTER
    app.component('prmNgrsBriefResultLineAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNgrsBriefResultLineAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-ngrs-brief-result-Line-after.html'
    });

    // PRM-NGRS-RESULTS-BUTTON-AFTER
    app.component('prmNgrsResultsButtonAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNgrsResultsButtonAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-ngrs-results-button-after.html'
    });

    // PRM-NO-SEARCH-RESULT-AFTER
    app.component('prmNoSearchResultAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNoSearchResultAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-no-search-result-after.html'
    });

    // PRM-OFFER-DETAILS-TILE-AFTER
    app.component('prmOfferDetailsTileAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOfferDetailsTileAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-offer-details-tile-after.html'
    });

    // PRM-OPAC-AFTER
    app.component('prmOpacAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOpacAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-opac-after.html'
    });

    // PRM-OPAC-BACK-BUTTON-AFTER
    app.component('prmOpacBackButtonAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOpacBackButtonAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-opac-back-button-after.html'
    });

    // PRM-ORGANIZATION-OR-FACET-TOGGLE-AFTER
    app.component('prmOrganizationOrFacetToggleAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOrganizationOrFacetToggleAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-organization-or-facet-toggle-after.html'
    });

    // PRM-ORGANIZATIONS-AFTER
    app.component('prmOrganizationsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOrganizationsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-organizations-after.html'
    });

    // PRM-ORGLIST-CATEGORIZE-AFTER
    app.component('prmOrglistCategorizeAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOrglistCategorizeAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-orglist-categorize-after.html'
    });

    // PRM-PAGE-NAV-MENU-AFTER
    app.component('prmPageNavMenuAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPageNavMenuAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-page-nav-menu-after.html'
    });

    // PRM-PAGING-BAR-AFTER
    app.component('prmPagingBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPagingBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-paging-bar-after.html'
    });

    // PRM-PDF-VIEWER-AFTER
    app.component('prmPdfViewerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPdfViewerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-pdf-viewer-after.html'
    });

    // PRM-PERFORMANCE-MONITOR-AFTER
    app.component('prmPerformanceMonitorAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPerformanceMonitorAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-performance-monitor-after.html'
    });

    // PRM-PERMALINK-AFTER
    app.component('prmPermalinkAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPermalinkAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-permalink-after.html'
    });

    // PRM-PERSONAL-INFO-AFTER
    app.component('prmPersonalInfoAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPersonalInfoAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-personal-info-after.html'
    });

    // PRM-PERSONAL-SETTINGS-AFTER
    app.component('prmPersonalSettingsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPersonalSettingsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-personal-settings-after.html'
    });

    // PRM-PERSONALIZATION-DIALOG-AFTER
    app.component('prmPersonalizationDialogAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPersonalizationDialogAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-personalization-dialog-after.html'
    });

    // PRM-PERSONALIZE-RESULTS-BUTTON-AFTER
    app.component('prmPersonalizeResultsButtonAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPersonalizeResultsButtonAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-personalize-results-button-after.html'
    });

    // PRM-PHYSICAL-DELIVERY-MORE-OPTION-ROW-AFTER
    app.component('prmPhysicalDeliveryMoreOptionRowAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPhysicalDeliveryMoreOptionRowAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-physical-delivery-more-option-row-after.html'
    });

    // PRM-PHYSICAL-DELIVERY-OPTIONS-AFTER
    app.component('prmPhysicalDeliveryOptionsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPhysicalDeliveryOptionsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-physical-delivery-options-after.html'
    });

    // PRM-PHYSICAL-DELIVERY-OPTIONS-TABLE-AFTER
    app.component('prmPhysicalDeliveryOptionsTableAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPhysicalDeliveryOptionsTableAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-physical-delivery-options-table-after.html'
    });

    // PRM-POPUP-MESSAGE-AFTER
    app.component('prmPopupMessageAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPopupMessageAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-popup-message-after.html'
    });

    // PRM-PRE-FILTERS-AFTER
    app.component('prmPreFiltersAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPreFiltersAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-pre-filters-after.html'
    });

    // PRM-PRINT-ITEM-AFTER
    app.component('prmPrintItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPrintItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-print-item-after.html'
    });

    // PRM-PROGRESS-BAR-AFTER
    app.component('prmProgressBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmProgressBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-progress-bar-after.html'
    });

    // PRM-PROGRESS-CHECKBOX-AFTER
    app.component('prmProgressCheckboxAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmProgressCheckboxAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-progress-checkbox-after.html'
    });

    // PRM-QR-CODE-AFTER
    app.component('prmQrCodeAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmQrCodeAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-qr-code-after.html'
    });

    // PRM-QUICK-ACCESS-AFTER
    app.component('prmQuickAccessAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmQuickAccessAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-quick-access-after.html'
    });

    // PRM-QUICK-LINK-AFTER
    app.component('prmQuickLinkAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmQuickLinkAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-quick-link-after.html'
    });

    // PRM-RAPIDO-MESSAGE-BAR-AFTER
    app.component('prmRapidoMessageBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRapidoMessageBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-rapido-message-bar-after.html'
    });

    // PRM-RAPIDO-NO-OFFER-MESSAGE-AFTER
    app.component('prmRapidoNoOfferMessageAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRapidoNoOfferMessageAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-rapido-no-offer-message-after.html'
    });

    // PRM-RECOMENDATION-ITEM-AFTER
    app.component('prmRecomendationItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRecomendationItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-recomendation-item-after.html'
    });

    // PRM-RECOMENDATIONS-AFTER
    app.component('prmRecomendationsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRecomendationsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-recomendations-after.html'
    });

    // PRM-RECORD-COLLECTION-PATHS-AFTER
    app.component('prmRecordCollectionPathsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRecordCollectionPathsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-record-collection-paths-after.html'
    });

    // PRM-REFERENCE-ENTRY-ITEM-AFTER
    app.component('prmReferenceEntryItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmReferenceEntryItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-reference-entry-item-after.html'
    });

    // PRM-REFWORKS-AFTER
    app.component('prmRefworksAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRefworksAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-refworks-after.html'
    });

    // PRM-REPORT-PROBLEM-AFTER
    app.component('prmReportProblemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmReportProblemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-report-problem-after.html'
    });

    // PRM-REQUEST-AFTER
    app.component('prmRequestAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-request-after.html'
    });

    // PRM-REQUEST-APPROVAL-AFTER
    app.component('prmRequestApprovalAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestApprovalAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-request-approval-after.html'
    });

    // PRM-REQUEST-SERVICES-AFTER
    app.component('prmRequestServicesAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestServicesAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-request-services-after.html'
    });

    // PRM-REQUESTS-AFTER
    app.component('prmRequestsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-requests-after.html'
    });

    // PRM-REQUESTS-OVERVIEW-AFTER
    app.component('prmRequestsOverviewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestsOverviewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-requests-overview-after.html'
    });

    // PRM-REQUESTS-SERVICES-OVL-AFTER
    app.component('prmRequestsServicesOvlAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestsServicesOvlAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-requests-services-ovl-after.html'
    });

    // PRM-RESOURCE-RECOMMENDER-AFTER
    app.component('prmResourceRecommenderAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmResourceRecommenderAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-resource-recommender-after.html'
    });

    // PRM-RESOURCE-RECOMMENDER-CARD-CONTENT-AFTER
    app.component('prmResourceRecommenderCardContentAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmResourceRecommenderCardContentAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-resource-recommender-card-content-after.html'
    });

    // PRM-RESOURCE-RECOMMENDER-FULL-VIEW-AFTER
    app.component('prmResourceRecommenderFullViewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmResourceRecommenderFullViewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-resource-recommender-full-view-after.html'
    });

    // PRM-RESOURCE-TYPE-FILTER-BAR-AFTER
    app.component('prmResourceTypeFilterBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmResourceTypeFilterBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-resource-type-filter-bar-after.html'
    });

    // PRM-REVIEWS-RESULTS-LINE-AFTER
    app.component('prmReviewsResultsLineAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmReviewsResultsLineAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-reviews-results-line-after.html'
    });

    // PRM-SAVE-TO-FAVORITES-BUTTON-AFTER
    app.component('prmSaveToFavoritesButtonAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSaveToFavoritesButtonAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-save-to-favorites-button-after.html'
    });

    // PRM-SAVED-QUERIES-AFTER
    app.component('prmSavedQueriesAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSavedQueriesAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-saved-queries-after.html'
    });

    // PRM-SAVED-QUERIES-LIST-AFTER
    app.component('prmSavedQueriesListAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSavedQueriesListAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-saved-queries-list-after.html'
    });

    // PRM-SAVED-QUERY-FILTER-AFTER
    app.component('prmSavedQueryFilterAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSavedQueryFilterAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-saved-query-filter-after.html'
    });

    // PRM-SAVED-SEARCHES-GROUP-ACTIONS-AFTER
    app.component('prmSavedSearchesGroupActionsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSavedSearchesGroupActionsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-saved-searches-group-actions-after.html'
    });

    // PRM-SCROLL-AFTER
    app.component('prmScrollAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmScrollAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-scroll-after.html'
    });

    // PRM-SEADRAGON-VIEWER-AFTER
    app.component('prmSeadragonViewerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSeadragonViewerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-seadragon-viewer-after.html'
    });

    // PRM-SEARCH-AFTER
    app.component('prmSearchAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-after.html'
    });

    // PRM-SEARCH-BAR-AFTER
    app.component('prmSearchBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-bar-after.html'
    });

    // PRM-SEARCH-BOOKMARK-FILTER-AFTER
    app.component('prmSearchBookmarkFilterAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchBookmarkFilterAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-bookmark-filter-after.html'
    });

    // PRM-SEARCH-ERROR-MESSAGE-AFTER
    app.component('prmSearchErrorMessageAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchErrorMessageAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-error-message-after.html'
    });

    // PRM-SEARCH-EXPLAIN-AFTER
    app.component('prmSearchExplainAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchExplainAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-explain-after.html'
    });

    // PRM-SEARCH-HISTORY-AFTER
    app.component('prmSearchHistoryAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchHistoryAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-history-after.html'
    });

    // PRM-SEARCH-RESULT-ADD-TO-FAVORITES-MENU-AFTER
    app.component('prmSearchResultAddToFavoritesMenuAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultAddToFavoritesMenuAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-add-to-favorites-menu-after.html'
    });

    // PRM-SEARCH-RESULT-FRBR-LINE-AFTER
    app.component('prmSearchResultFrbrLineAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultFrbrLineAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-frbr-line-after.html'
    });

    // PRM-SEARCH-RESULT-JOURNAL-INDICATION-LINE-AFTER
    app.component('prmSearchResultJournalIndicationLineAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultJournalIndicationLineAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-journal-indication-line-after.html'
    });

    // PRM-SEARCH-RESULT-LIST-AFTER
    app.component('prmSearchResultListAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultListAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-list-after.html'
    });

    // PRM-SEARCH-RESULT-SORT-BY-AFTER
    app.component('prmSearchResultSortByAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultSortByAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-sort-by-after.html'
    });

    // PRM-SEARCH-RESULT-THUMBNAIL-CONTAINER-AFTER
    app.component('prmSearchResultThumbnailContainerAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultThumbnailContainerAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-thumbnail-container-after.html'
    });

    // PRM-SEARCH-RESULT-TITLE-AFTER
    app.component('prmSearchResultTitleAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultTitleAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-title-after.html'
    });

    // PRM-SEARCH-RESULT-TOOL-BAR-AFTER
    app.component('prmSearchResultToolBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultToolBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-tool-bar-after.html'
    });

    // PRM-SEARCH-WITHIN-JOURNAL-AFTER
    app.component('prmSearchWithinJournalAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchWithinJournalAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-within-journal-after.html'
    });

    // PRM-SELF-REGISTRATION-AFTER
    app.component('prmSelfRegistrationAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSelfRegistrationAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-self-registration-after.html'
    });

    // PRM-SEND-EMAIL-AFTER
    app.component('prmSendEmailAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSendEmailAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-send-email-after.html'
    });

    // PRM-SERVICE-BUTTON-AFTER
    app.component('prmServiceButtonAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceButtonAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-button-after.html'
    });

    // PRM-SERVICE-DETAILS-AFTER
    app.component('prmServiceDetailsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceDetailsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-details-after.html'
    });

    // PRM-SERVICE-HEADER-AFTER
    app.component('prmServiceHeaderAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceHeaderAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-header-after.html'
    });

    // PRM-SERVICE-LINKS-AFTER
    app.component('prmServiceLinksAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceLinksAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-links-after.html'
    });

    // PRM-SERVICE-NGRS-AFTER
    app.component('prmServiceNgrsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceNgrsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-ngrs-after.html'
    });

    // PRM-SERVICE-NO-OFFER-FOUND-AFTER
    app.component('prmServiceNoOfferFoundAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceNoOfferFoundAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-no-offer-found-after.html'
    });

    // PRM-SERVICE-PHYSICAL-BEST-OFFER-AFTER
    app.component('prmServicePhysicalBestOfferAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServicePhysicalBestOfferAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-physical-best-offer-after.html'
    });

    // PRM-SERVICES-PAGE-AFTER
    app.component('prmServicesPageAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServicesPageAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-services-page-after.html'
    });

    // PRM-SHARE-AFTER
    app.component('prmShareAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmShareAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-share-after.html'
    });

    // PRM-SIGN-IN-TO-VIEW-AFTER
    app.component('prmSignInToViewAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSignInToViewAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-sign-in-to-view-after.html'
    });

    // PRM-SILENT-LOGIN-AFTER
    app.component('prmSilentLoginAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSilentLoginAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-silent-login-after.html'
    });

    // PRM-SILENT-LOGIN-ALERT-TOAST-AFTER
    app.component('prmSilentLoginAlertToastAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSilentLoginAlertToastAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-silent-login-alert-toast-after.html'
    });

    // PRM-SKIP-TO-AFTER
    app.component('prmSkipToAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSkipToAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-skip-to-after.html'
    });

    // PRM-SLIDER-FIELD-AFTER
    app.component('prmSliderFieldAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSliderFieldAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-slider-field-after.html'
    });

    // PRM-SNIPPET-AFTER
    app.component('prmSnippetAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSnippetAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-snippet-after.html'
    });

    // PRM-SOCIAL-MENU-AFTER
    app.component('prmSocialMenuAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSocialMenuAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-social-menu-after.html'
    });

    // PRM-SOURCE-RECORD-AFTER
    app.component('prmSourceRecordAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSourceRecordAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-source-record-after.html'
    });

    // PRM-STACK-MAP-AFTER
    app.component('prmStackMapAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmStackMapAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-stack-map-after.html'
    });

    // PRM-STAND-ALONE-LOGIN-AFTER
    app.component('prmStandAloneLoginAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmStandAloneLoginAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-stand-alone-login-after.html'
    });

    // PRM-SYNDETIC-UNBOUND-AFTER
    app.component('prmSyndeticUnboundAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSyndeticUnboundAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-syndetic-unbound-after.html'
    });

    // PRM-TABS-AND-SCOPES-SELECTOR-AFTER
    app.component('prmTabsAndScopesSelectorAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTabsAndScopesSelectorAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tabs-and-scopes-selector-after.html'
    });

    // PRM-TAGS-AFTER
    app.component('prmTagsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTagsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tags-after.html'
    });

    // PRM-TAGS-LIST-AFTER
    app.component('prmTagsListAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTagsListAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tags-list-after.html'
    });

    // PRM-TAGS-RESULTS-AFTER
    app.component('prmTagsResultsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTagsResultsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tags-results-after.html'
    });

    // PRM-TAGS-SEARCH-BAR-AFTER
    app.component('prmTagsSearchBarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTagsSearchBarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tags-search-bar-after.html'
    });

    // PRM-THUMBNAIL-LIST-AFTER
    app.component('prmThumbnailListAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmThumbnailListAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-thumbnail-list-after.html'
    });

    // PRM-TIMEOUT-TOAST-AFTER
    app.component('prmTimeoutToastAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTimeoutToastAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-timeout-toast-after.html'
    });

    // PRM-TIMES-CITED-AFTER
    app.component('prmTimesCitedAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTimesCitedAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-times-cited-after.html'
    });

    // PRM-TOP-BAR-BEFORE
    app.component('prmTopBarBeforeAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTopBarBeforeAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-top-bar-before.html'
    });

    // PRM-TOP-NAV-BAR-LINKS-AFTER
    app.component('prmTopNavBarLinksAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTopNavBarLinksAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-top-nav-bar-links-after.html'
    });

    // PRM-TOPBAR-AFTER
    app.component('prmTopbarAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTopbarAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-topbar-after.html'
    });

    // PRM-TREE-NAV-AFTER
    app.component('prmTreeNavAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTreeNavAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tree-nav-after.html'
    });

    // PRM-UNION-CATALOG-LOGIN-AFTER
    app.component('prmUnionCatalogLoginAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUnionCatalogLoginAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-union-catalog-login-after.html'
    });

    // PRM-UNION-CATALOG-LOGIN-INSTITUTION-ITEM-AFTER
    app.component('prmUnionCatalogLoginInstitutionItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUnionCatalogLoginInstitutionItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-union-catalog-login-institution-item-after.html'
    });

    // PRM-USAGE-METRICS-AFTER
    app.component('prmUsageMetricsAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUsageMetricsAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-usage-metrics-after.html'
    });

    // PRM-USER-AREA-AFTER
    app.component('prmUserAreaAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUserAreaAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-user-area-after.html'
    });

    // PRM-USER-AREA-EXPANDABLE-AFTER
    app.component('prmUserAreaExpandableAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUserAreaExpandableAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-user-area-expandable-after.html'
    });

    // PRM-USERNAME-PASSWORD-LOGIN-AFTER
    app.component('prmUsernamePasswordLoginAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUsernamePasswordLoginAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-username-password-login-after.html'
    });

    // PRM-VIEW-ONLINE-AFTER
    app.component('prmViewOnlineAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmViewOnlineAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-view-online-after.html'
    });

    // PRM-VIRTUAL-BROWSE-AFTER
    app.component('prmVirtualBrowseAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmVirtualBrowseAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-virtual-browse-after.html'
    });

    // PRM-VIRTUAL-BROWSE-ITEM-AFTER
    app.component('prmVirtualBrowseItemAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmVirtualBrowseItemAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-virtual-browse-item-after.html'
    });

    // PRM-VIRTUAL-BROWSE-ITEM-INFO-AFTER
    app.component('prmVirtualBrowseItemInfoAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmVirtualBrowseItemInfoAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-virtual-browse-item-info-after.html'
    });

    // PRM-VOICE-SEARCH-TOAST-AFTER
    app.component('prmVoiceSearchToastAfterAppStoreGenerated', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmVoiceSearchToastAfterAppStoreGenerated: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-voice-search-toast-after.html'
    });
}

generateAllPossibleCustomDirectives();

// ****************************************
// 06-run.js
// ****************************************

/* global app, injectCDNResourceTags */

app.run(function () {
    injectCDNResourceTags();
});

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AccountAfterController', [function () {
    var vm = this;
}]);

app.component('prmAccountAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AccountAfterController',
    template: '\n    <prm-account-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-account-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AccountLinksAfterController', [function () {
    var vm = this;
}]);

app.component('prmAccountLinksAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AccountLinksAfterController',
    template: '\n    <prm-account-links-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-account-links-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AccountOverviewAfterController', [function () {
    var vm = this;
}]);

app.component('prmAccountOverviewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AccountOverviewAfterController',
    template: '\n    <prm-account-overview-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-account-overview-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ActionContainerAfterController', [function () {
    var vm = this;
}]);

app.component('prmActionContainerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ActionContainerAfterController',
    template: '\n    <prm-action-container-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-action-container-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ActionListAfterController', [function () {
    var vm = this;
}]);

app.component('prmActionListAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ActionListAfterController',
    template: '\n    <prm-action-list-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-action-list-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AddAlertToastAfterController', [function () {
    var vm = this;
}]);

app.component('prmAddAlertToastAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AddAlertToastAfterController',
    template: '\n    <prm-add-alert-toast-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-add-alert-toast-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AddQueryToSavedSearchesAfterController', [function () {
    var vm = this;
}]);

app.component('prmAddQueryToSavedSearchesAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AddQueryToSavedSearchesAfterController',
    template: '\n    <prm-add-query-to-saved-searches-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-add-query-to-saved-searches-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AdditionalServicesAfterController', [function () {
    var vm = this;
}]);

app.component('prmAdditionalServicesAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AdditionalServicesAfterController',
    template: '\n    <prm-additional-services-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-additional-services-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AdvancedSearchAfterController', [function () {
    var vm = this;
}]);

app.component('prmAdvancedSearchAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AdvancedSearchAfterController',
    template: '\n    <prm-advanced-search-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-advanced-search-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlmaMashupAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlmaMashupAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlmaMashupAfterController',
    template: '\n    <prm-alma-mashup-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alma-mashup-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlmaMoreInstAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlmaMoreInstAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlmaMoreInstAfterController',
    template: '\n    <prm-alma-more-inst-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alma-more-inst-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlmaOtherMembersAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlmaOtherMembersAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlmaOtherMembersAfterController',
    template: '\n    <prm-alma-other-members-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alma-other-members-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlmaOtherUnitsAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlmaOtherUnitsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlmaOtherUnitsAfterController',
    template: '\n    <prm-alma-other-units-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alma-other-units-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlmaRepresentationsFilterAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlmaRepresentationsFilterAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlmaRepresentationsFilterAfterController',
    template: '\n    <prm-alma-representations-filter-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alma-representations-filter-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlmaViewerAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlmaViewerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlmaViewerAfterController',
    template: '\n    <prm-alma-viewer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alma-viewer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlmaViewitAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlmaViewitAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlmaViewitAfterController',
    template: '\n    <prm-alma-viewit-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alma-viewit-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlmaViewitItemsAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlmaViewitItemsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlmaViewitItemsAfterController',
    template: '\n    <prm-alma-viewit-items-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alma-viewit-items-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AlphabetToolbarAfterController', [function () {
    var vm = this;
}]);

app.component('prmAlphabetToolbarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AlphabetToolbarAfterController',
    template: '\n    <prm-alphabet-toolbar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-alphabet-toolbar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AtozSearchBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmAtozSearchBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AtozSearchBarAfterController',
    template: '\n    <prm-atoz-search-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-atoz-search-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('AuthenticationAfterController', [function () {
    var vm = this;
}]);

app.component('prmAuthenticationAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'AuthenticationAfterController',
    template: '\n    <prm-authentication-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-authentication-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BackToLibrarySearchAfterController', [function () {
    var vm = this;
}]);

app.component('prmBackToLibrarySearchAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BackToLibrarySearchAfterController',
    template: '\n    <prm-back-to-library-search-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-back-to-library-search-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BackToLibrarySearchButtonAfterController', [function () {
    var vm = this;
}]);

app.component('prmBackToLibrarySearchButtonAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BackToLibrarySearchButtonAfterController',
    template: '\n    <prm-back-to-library-search-button-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-back-to-library-search-button-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BackToSearchResultsButtonAfterController', [function () {
    var vm = this;
}]);

app.component('prmBackToSearchResultsButtonAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BackToSearchResultsButtonAfterController',
    template: '\n    <prm-back-to-search-results-button-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-back-to-search-results-button-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BannerCardContentAfterController', [function () {
    var vm = this;
}]);

app.component('prmBannerCardContentAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BannerCardContentAfterController',
    template: '\n    <prm-banner-card-content-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-banner-card-content-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BarcodeSearchAfterController', [function () {
    var vm = this;
}]);

app.component('prmBarcodeSearchAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BarcodeSearchAfterController',
    template: '\n    <prm-barcode-search-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-barcode-search-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BlankIllAfterController', [function () {
    var vm = this;
}]);

app.component('prmBlankIllAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BlankIllAfterController',
    template: '\n    <prm-blank-ill-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-blank-ill-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BlankPurchaseRequestAfterController', [function () {
    var vm = this;
}]);

app.component('prmBlankPurchaseRequestAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BlankPurchaseRequestAfterController',
    template: '\n    <prm-blank-purchase-request-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-blank-purchase-request-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BreadcrumbsAfterController', [function () {
    var vm = this;
}]);

app.component('prmBreadcrumbsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BreadcrumbsAfterController',
    template: '\n    <prm-breadcrumbs-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-breadcrumbs-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BriefResultAfterController', [function () {
    var vm = this;
}]);

app.component('prmBriefResultAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BriefResultAfterController',
    template: '\n    <prm-brief-result-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-brief-result-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BriefResultContainerAfterController', [function () {
    var vm = this;
}]);

app.component('prmBriefResultContainerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BriefResultContainerAfterController',
    template: '\n    <prm-brief-result-container-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-brief-result-container-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BriefResultDeliveryOptionLinkAfterController', [function () {
    var vm = this;
}]);

app.component('prmBriefResultDeliveryOptionLinkAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BriefResultDeliveryOptionLinkAfterController',
    template: '\n    <prm-brief-result-delivery-option-link-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-brief-result-delivery-option-link-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BriefResultDigitalBestOfferAfterController', [function () {
    var vm = this;
}]);

app.component('prmBriefResultDigitalBestOfferAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BriefResultDigitalBestOfferAfterController',
    template: '\n    <prm-brief-result-digital-best-offer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-brief-result-digital-best-offer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BriefResultPhysicalBestOfferAfterController', [function () {
    var vm = this;
}]);

app.component('prmBriefResultPhysicalBestOfferAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BriefResultPhysicalBestOfferAfterController',
    template: '\n    <prm-brief-result-physical-best-offer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-brief-result-physical-best-offer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BrowseResultAfterController', [function () {
    var vm = this;
}]);

app.component('prmBrowseResultAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BrowseResultAfterController',
    template: '\n    <prm-browse-result-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-browse-result-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BrowseSearchAfterController', [function () {
    var vm = this;
}]);

app.component('prmBrowseSearchAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BrowseSearchAfterController',
    template: '\n    <prm-browse-search-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-browse-search-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('BrowseSearchBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmBrowseSearchBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'BrowseSearchBarAfterController',
    template: '\n    <prm-browse-search-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-browse-search-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ChaptersAndReviewsAfterController', [function () {
    var vm = this;
}]);

app.component('prmChaptersAndReviewsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ChaptersAndReviewsAfterController',
    template: '\n    <prm-chapters-and-reviews-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-chapters-and-reviews-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ChaptersAndReviewsItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmChaptersAndReviewsItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ChaptersAndReviewsItemAfterController',
    template: '\n    <prm-chapters-and-reviews-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-chapters-and-reviews-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ChaptersResultsLineAfterController', [function () {
    var vm = this;
}]);

app.component('prmChaptersResultsLineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ChaptersResultsLineAfterController',
    template: '\n    <prm-chapters-results-line-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-chapters-results-line-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CitationAfterController', [function () {
    var vm = this;
}]);

app.component('prmCitationAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CitationAfterController',
    template: '\n    <prm-citation-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-citation-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CitationLinkerAfterController', [function () {
    var vm = this;
}]);

app.component('prmCitationLinkerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CitationLinkerAfterController',
    template: '\n    <prm-citation-linker-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-citation-linker-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CitationTrailsBreadcrumbsAfterController', [function () {
    var vm = this;
}]);

app.component('prmCitationTrailsBreadcrumbsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CitationTrailsBreadcrumbsAfterController',
    template: '\n    <prm-citation-trails-breadcrumbs-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-citation-trails-breadcrumbs-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CitationTrailsExpandButtonAfterController', [function () {
    var vm = this;
}]);

app.component('prmCitationTrailsExpandButtonAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CitationTrailsExpandButtonAfterController',
    template: '\n    <prm-citation-trails-expand-button-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-citation-trails-expand-button-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CitationTrailsFullviewLinkAfterController', [function () {
    var vm = this;
}]);

app.component('prmCitationTrailsFullviewLinkAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CitationTrailsFullviewLinkAfterController',
    template: '\n    <prm-citation-trails-fullview-link-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-citation-trails-fullview-link-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CitationTrailsIndicationAfterController', [function () {
    var vm = this;
}]);

app.component('prmCitationTrailsIndicationAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CitationTrailsIndicationAfterController',
    template: '\n    <prm-citation-trails-indication-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-citation-trails-indication-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CitationTrailsIndicationContainerAfterController', [function () {
    var vm = this;
}]);

app.component('prmCitationTrailsIndicationContainerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CitationTrailsIndicationContainerAfterController',
    template: '\n    <prm-citation-trails-indication-container-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-citation-trails-indication-container-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CitationTrailsItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmCitationTrailsItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CitationTrailsItemAfterController',
    template: '\n    <prm-citation-trails-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-citation-trails-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionAfterController',
    template: '\n    <prm-collection-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionBreadcrumbsAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionBreadcrumbsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionBreadcrumbsAfterController',
    template: '\n    <prm-collection-breadcrumbs-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-breadcrumbs-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionDiscoveryAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionDiscoveryAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionDiscoveryAfterController',
    template: '\n    <prm-collection-discovery-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-discovery-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionDiscoveryViewSwitcherAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionDiscoveryViewSwitcherAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionDiscoveryViewSwitcherAfterController',
    template: '\n    <prm-collection-discovery-view-switcher-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-discovery-view-switcher-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionGalleryAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionGalleryAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionGalleryAfterController',
    template: '\n    <prm-collection-gallery-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-gallery-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionGalleryHeaderAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionGalleryHeaderAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionGalleryHeaderAfterController',
    template: '\n    <prm-collection-gallery-header-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-gallery-header-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionNavigationBreadcrumbsAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionNavigationBreadcrumbsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionNavigationBreadcrumbsAfterController',
    template: '\n    <prm-collection-navigation-breadcrumbs-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-navigation-breadcrumbs-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionNavigationBreadcrumbsItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionNavigationBreadcrumbsItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionNavigationBreadcrumbsItemAfterController',
    template: '\n    <prm-collection-navigation-breadcrumbs-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-navigation-breadcrumbs-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CollectionSearchAfterController', [function () {
    var vm = this;
}]);

app.component('prmCollectionSearchAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CollectionSearchAfterController',
    template: '\n    <prm-collection-search-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-collection-search-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ControlledVocabularyAfterController', [function () {
    var vm = this;
}]);

app.component('prmControlledVocabularyAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ControlledVocabularyAfterController',
    template: '\n    <prm-controlled-vocabulary-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-controlled-vocabulary-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CopyClipboardBtnAfterController', [function () {
    var vm = this;
}]);

app.component('prmCopyClipboardBtnAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CopyClipboardBtnAfterController',
    template: '\n    <prm-copy-clipboard-btn-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-copy-clipboard-btn-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('CopyrightsAfterController', [function () {
    var vm = this;
}]);

app.component('prmCopyrightsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'CopyrightsAfterController',
    template: '\n    <prm-copyrights-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-copyrights-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DatabasesAfterController', [function () {
    var vm = this;
}]);

app.component('prmDatabasesAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DatabasesAfterController',
    template: '\n    <prm-databases-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-databases-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DatabasesCategorizeAfterController', [function () {
    var vm = this;
}]);

app.component('prmDatabasesCategorizeAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DatabasesCategorizeAfterController',
    template: '\n    <prm-databases-categorize-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-databases-categorize-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DatabasesFullViewAfterController', [function () {
    var vm = this;
}]);

app.component('prmDatabasesFullViewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DatabasesFullViewAfterController',
    template: '\n    <prm-databases-full-view-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-databases-full-view-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DatabasesResultsAfterController', [function () {
    var vm = this;
}]);

app.component('prmDatabasesResultsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DatabasesResultsAfterController',
    template: '\n    <prm-databases-results-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-databases-results-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DeliveryRegistrationAfterController', [function () {
    var vm = this;
}]);

app.component('prmDeliveryRegistrationAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DeliveryRegistrationAfterController',
    template: '\n    <prm-delivery-registration-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-delivery-registration-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DeliverySessionExpiryNotificationAfterController', [function () {
    var vm = this;
}]);

app.component('prmDeliverySessionExpiryNotificationAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DeliverySessionExpiryNotificationAfterController',
    template: '\n    <prm-delivery-session-expiry-notification-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-delivery-session-expiry-notification-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DeniedAccessAfterController', [function () {
    var vm = this;
}]);

app.component('prmDeniedAccessAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DeniedAccessAfterController',
    template: '\n    <prm-denied-access-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-denied-access-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DepositsAfterController', [function () {
    var vm = this;
}]);

app.component('prmDepositsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DepositsAfterController',
    template: '\n    <prm-deposits-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-deposits-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DepositsLinkAfterController', [function () {
    var vm = this;
}]);

app.component('prmDepositsLinkAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DepositsLinkAfterController',
    template: '\n    <prm-deposits-link-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-deposits-link-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DepositsOverviewAfterController', [function () {
    var vm = this;
}]);

app.component('prmDepositsOverviewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DepositsOverviewAfterController',
    template: '\n    <prm-deposits-overview-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-deposits-overview-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('DidUmeanAfterController', [function () {
    var vm = this;
}]);

app.component('prmDidUmeanAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'DidUmeanAfterController',
    template: '\n    <prm-did-umean-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-did-umean-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('EasybibAfterController', [function () {
    var vm = this;
}]);

app.component('prmEasybibAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'EasybibAfterController',
    template: '\n    <prm-easybib-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-easybib-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('EditNotificationSettingsAfterController', [function () {
    var vm = this;
}]);

app.component('prmEditNotificationSettingsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'EditNotificationSettingsAfterController',
    template: '\n    <prm-edit-notification-settings-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-edit-notification-settings-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('EndnoteAfterController', [function () {
    var vm = this;
}]);

app.component('prmEndnoteAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'EndnoteAfterController',
    template: '\n    <prm-endnote-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-endnote-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('EpubFoliateViewerAfterController', [function () {
    var vm = this;
}]);

app.component('prmEpubFoliateViewerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'EpubFoliateViewerAfterController',
    template: '\n    <prm-epub-foliate-viewer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-epub-foliate-viewer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ExploreFooterAfterController', [function () {
    var vm = this;
}]);

app.component('prmExploreFooterAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ExploreFooterAfterController',
    template: '\n    <prm-explore-footer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-explore-footer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ExploreMainAfterController', [function () {
    var vm = this;
}]);

app.component('prmExploreMainAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ExploreMainAfterController',
    template: '\n    <prm-explore-main-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-explore-main-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ExportBibtexAfterController', [function () {
    var vm = this;
}]);

app.component('prmExportBibtexAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ExportBibtexAfterController',
    template: '\n    <prm-export-bibtex-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-export-bibtex-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ExportExcelAfterController', [function () {
    var vm = this;
}]);

app.component('prmExportExcelAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ExportExcelAfterController',
    template: '\n    <prm-export-excel-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-export-excel-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ExportRisAfterController', [function () {
    var vm = this;
}]);

app.component('prmExportRisAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ExportRisAfterController',
    template: '\n    <prm-export-ris-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-export-ris-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FacetAfterController', [function () {
    var vm = this;
}]);

app.component('prmFacetAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FacetAfterController',
    template: '\n    <prm-facet-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-facet-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FacetExactAfterController', [function () {
    var vm = this;
}]);

app.component('prmFacetExactAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FacetExactAfterController',
    template: '\n    <prm-facet-exact-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-facet-exact-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FacetRangeAfterController', [function () {
    var vm = this;
}]);

app.component('prmFacetRangeAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FacetRangeAfterController',
    template: '\n    <prm-facet-range-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-facet-range-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FavoritesAfterController', [function () {
    var vm = this;
}]);

app.component('prmFavoritesAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FavoritesAfterController',
    template: '\n    <prm-favorites-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-favorites-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FavoritesEditLabelsMenuAfterController', [function () {
    var vm = this;
}]);

app.component('prmFavoritesEditLabelsMenuAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FavoritesEditLabelsMenuAfterController',
    template: '\n    <prm-favorites-edit-labels-menu-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-favorites-edit-labels-menu-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FavoritesLabelsAfterController', [function () {
    var vm = this;
}]);

app.component('prmFavoritesLabelsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FavoritesLabelsAfterController',
    template: '\n    <prm-favorites-labels-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-favorites-labels-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FavoritesRecordLabelsAfterController', [function () {
    var vm = this;
}]);

app.component('prmFavoritesRecordLabelsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FavoritesRecordLabelsAfterController',
    template: '\n    <prm-favorites-record-labels-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-favorites-record-labels-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FavoritesToolBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmFavoritesToolBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FavoritesToolBarAfterController',
    template: '\n    <prm-favorites-tool-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-favorites-tool-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FavoritesWarningMessageAfterController', [function () {
    var vm = this;
}]);

app.component('prmFavoritesWarningMessageAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FavoritesWarningMessageAfterController',
    template: '\n    <prm-favorites-warning-message-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-favorites-warning-message-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FeaturedResultItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmFeaturedResultItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FeaturedResultItemAfterController',
    template: '\n    <prm-featured-result-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-featured-result-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FeaturedResultsAfterController', [function () {
    var vm = this;
}]);

app.component('prmFeaturedResultsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FeaturedResultsAfterController',
    template: '\n    <prm-featured-results-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-featured-results-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FinesAfterController', [function () {
    var vm = this;
}]);

app.component('prmFinesAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FinesAfterController',
    template: '\n    <prm-fines-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-fines-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FinesOverviewAfterController', [function () {
    var vm = this;
}]);

app.component('prmFinesOverviewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FinesOverviewAfterController',
    template: '\n    <prm-fines-overview-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-fines-overview-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FullViewAfterController', [function () {
    var vm = this;
}]);

app.component('prmFullViewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FullViewAfterController',
    template: '\n    <prm-full-view-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-full-view-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FullViewContAfterController', [function () {
    var vm = this;
}]);

app.component('prmFullViewContAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FullViewContAfterController',
    template: '\n    <prm-full-view-cont-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-full-view-cont-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FullViewPageAfterController', [function () {
    var vm = this;
}]);

app.component('prmFullViewPageAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FullViewPageAfterController',
    template: '\n    <prm-full-view-page-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-full-view-page-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('FullViewServiceContainerAfterController', [function () {
    var vm = this;
}]);

app.component('prmFullViewServiceContainerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'FullViewServiceContainerAfterController',
    template: '\n    <prm-full-view-service-container-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-full-view-service-container-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('GalleryCollectionAfterController', [function () {
    var vm = this;
}]);

app.component('prmGalleryCollectionAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'GalleryCollectionAfterController',
    template: '\n    <prm-gallery-collection-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-gallery-collection-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('GalleryCollectionsListAfterController', [function () {
    var vm = this;
}]);

app.component('prmGalleryCollectionsListAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'GalleryCollectionsListAfterController',
    template: '\n    <prm-gallery-collections-list-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-gallery-collections-list-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('GalleryItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmGalleryItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'GalleryItemAfterController',
    template: '\n    <prm-gallery-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-gallery-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('GalleryItemsListAfterController', [function () {
    var vm = this;
}]);

app.component('prmGalleryItemsListAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'GalleryItemsListAfterController',
    template: '\n    <prm-gallery-items-list-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-gallery-items-list-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('GetItRequestAfterController', [function () {
    var vm = this;
}]);

app.component('prmGetItRequestAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'GetItRequestAfterController',
    template: '\n    <prm-get-it-request-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-get-it-request-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('IconAfterController', [function () {
    var vm = this;
}]);

app.component('prmIconAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'IconAfterController',
    template: '\n    <prm-icon-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-icon-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('IcpLicenseFooterAfterController', [function () {
    var vm = this;
}]);

app.component('prmIcpLicenseFooterAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'IcpLicenseFooterAfterController',
    template: '\n    <prm-icp-license-footer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-icp-license-footer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('JournalsAfterController', [function () {
    var vm = this;
}]);

app.component('prmJournalsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'JournalsAfterController',
    template: '\n    <prm-journals-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-journals-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('JournalsFullViewAfterController', [function () {
    var vm = this;
}]);

app.component('prmJournalsFullViewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'JournalsFullViewAfterController',
    template: '\n    <prm-journals-full-view-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-journals-full-view-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LanguageSelectionAfterController', [function () {
    var vm = this;
}]);

app.component('prmLanguageSelectionAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LanguageSelectionAfterController',
    template: '\n    <prm-language-selection-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-language-selection-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LegantoAfterController', [function () {
    var vm = this;
}]);

app.component('prmLegantoAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LegantoAfterController',
    template: '\n    <prm-leganto-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-leganto-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LegantoGetitAfterController', [function () {
    var vm = this;
}]);

app.component('prmLegantoGetitAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LegantoGetitAfterController',
    template: '\n    <prm-leganto-getit-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-leganto-getit-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LibrariesAroundBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmLibrariesAroundBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LibrariesAroundBarAfterController',
    template: '\n    <prm-libraries-around-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-libraries-around-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LibraryAfterController', [function () {
    var vm = this;
}]);

app.component('prmLibraryAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LibraryAfterController',
    template: '\n    <prm-library-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-library-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LibraryCardMenuAfterController', [function () {
    var vm = this;
}]);

app.component('prmLibraryCardMenuAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LibraryCardMenuAfterController',
    template: '\n    <prm-library-card-menu-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-library-card-menu-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LinkedDataAfterController', [function () {
    var vm = this;
}]);

app.component('prmLinkedDataAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LinkedDataAfterController',
    template: '\n    <prm-linked-data-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-linked-data-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LinkedDataCardAfterController', [function () {
    var vm = this;
}]);

app.component('prmLinkedDataCardAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LinkedDataCardAfterController',
    template: '\n    <prm-linked-data-card-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-linked-data-card-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LinkedUserSelectorAfterController', [function () {
    var vm = this;
}]);

app.component('prmLinkedUserSelectorAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LinkedUserSelectorAfterController',
    template: '\n    <prm-linked-user-selector-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-linked-user-selector-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LoanAfterController', [function () {
    var vm = this;
}]);

app.component('prmLoanAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LoanAfterController',
    template: '\n    <prm-loan-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-loan-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LoansAfterController', [function () {
    var vm = this;
}]);

app.component('prmLoansAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LoansAfterController',
    template: '\n    <prm-loans-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-loans-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LoansOverviewAfterController', [function () {
    var vm = this;
}]);

app.component('prmLoansOverviewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LoansOverviewAfterController',
    template: '\n    <prm-loans-overview-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-loans-overview-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LocationAfterController', [function () {
    var vm = this;
}]);

app.component('prmLocationAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LocationAfterController',
    template: '\n    <prm-location-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-location-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LocationHoldingsAfterController', [function () {
    var vm = this;
}]);

app.component('prmLocationHoldingsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LocationHoldingsAfterController',
    template: '\n    <prm-location-holdings-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-location-holdings-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LocationItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmLocationItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LocationItemAfterController',
    template: '\n    <prm-location-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-location-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LocationItemsAfterController', [function () {
    var vm = this;
}]);

app.component('prmLocationItemsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LocationItemsAfterController',
    template: '\n    <prm-location-items-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-location-items-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LocationsAfterController', [function () {
    var vm = this;
}]);

app.component('prmLocationsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LocationsAfterController',
    template: '\n    <prm-locations-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-locations-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LoginAfterController', [function () {
    var vm = this;
}]);

app.component('prmLoginAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LoginAfterController',
    template: '\n    <prm-login-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-login-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LoginAlmaMashupAfterController', [function () {
    var vm = this;
}]);

app.component('prmLoginAlmaMashupAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LoginAlmaMashupAfterController',
    template: '\n    <prm-login-alma-mashup-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-login-alma-mashup-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LoginHelpAfterController', [function () {
    var vm = this;
}]);

app.component('prmLoginHelpAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LoginHelpAfterController',
    template: '\n    <prm-login-help-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-login-help-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LoginIframeAfterController', [function () {
    var vm = this;
}]);

app.component('prmLoginIframeAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LoginIframeAfterController',
    template: '\n    <prm-login-iframe-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-login-iframe-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LoginItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmLoginItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LoginItemAfterController',
    template: '\n    <prm-login-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-login-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('LogoAfterController', [function () {
    var vm = this;
}]);

app.component('prmLogoAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'LogoAfterController',
    template: '\n    <prm-logo-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-logo-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MainMenuAfterController', [function () {
    var vm = this;
}]);

app.component('prmMainMenuAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MainMenuAfterController',
    template: '\n    <prm-main-menu-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-main-menu-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MendeleyAfterController', [function () {
    var vm = this;
}]);

app.component('prmMendeleyAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MendeleyAfterController',
    template: '\n    <prm-mendeley-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-mendeley-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MendeleyToastAfterController', [function () {
    var vm = this;
}]);

app.component('prmMendeleyToastAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MendeleyToastAfterController',
    template: '\n    <prm-mendeley-toast-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-mendeley-toast-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MessagesAndBlocksAfterController', [function () {
    var vm = this;
}]);

app.component('prmMessagesAndBlocksAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MessagesAndBlocksAfterController',
    template: '\n    <prm-messages-and-blocks-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-messages-and-blocks-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MessagesAndBlocksOverviewAfterController', [function () {
    var vm = this;
}]);

app.component('prmMessagesAndBlocksOverviewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MessagesAndBlocksOverviewAfterController',
    template: '\n    <prm-messages-and-blocks-overview-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-messages-and-blocks-overview-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MoreLikeThisAfterController', [function () {
    var vm = this;
}]);

app.component('prmMoreLikeThisAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MoreLikeThisAfterController',
    template: '\n    <prm-more-like-this-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-more-like-this-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MoreLikeThisItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmMoreLikeThisItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MoreLikeThisItemAfterController',
    template: '\n    <prm-more-like-this-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-more-like-this-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MoreLikeThisItemInfoAfterController', [function () {
    var vm = this;
}]);

app.component('prmMoreLikeThisItemInfoAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MoreLikeThisItemInfoAfterController',
    template: '\n    <prm-more-like-this-item-info-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-more-like-this-item-info-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('MultiSelectFilterAfterController', [function () {
    var vm = this;
}]);

app.component('prmMultiSelectFilterAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'MultiSelectFilterAfterController',
    template: '\n    <prm-multi-select-filter-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-multi-select-filter-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('NewspapersFacetAfterController', [function () {
    var vm = this;
}]);

app.component('prmNewspapersFacetAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'NewspapersFacetAfterController',
    template: '\n    <prm-newspapers-facet-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-newspapers-facet-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('NewspapersFullViewAfterController', [function () {
    var vm = this;
}]);

app.component('prmNewspapersFullViewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'NewspapersFullViewAfterController',
    template: '\n    <prm-newspapers-full-view-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-newspapers-full-view-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('NewspapersHomeAfterController', [function () {
    var vm = this;
}]);

app.component('prmNewspapersHomeAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'NewspapersHomeAfterController',
    template: '\n    <prm-newspapers-home-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-newspapers-home-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('NewspapersSearchBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmNewspapersSearchBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'NewspapersSearchBarAfterController',
    template: '\n    <prm-newspapers-search-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-newspapers-search-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('NewspapersSpotlightAfterController', [function () {
    var vm = this;
}]);

app.component('prmNewspapersSpotlightAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'NewspapersSpotlightAfterController',
    template: '\n    <prm-newspapers-spotlight-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-newspapers-spotlight-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('NgrsBriefResultLineAfterController', [function () {
    var vm = this;
}]);

app.component('prmNgrsBriefResultLineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'NgrsBriefResultLineAfterController',
    template: '\n    <prm-ngrs-brief-result-line-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-ngrs-brief-result-line-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('NgrsResultsButtonAfterController', [function () {
    var vm = this;
}]);

app.component('prmNgrsResultsButtonAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'NgrsResultsButtonAfterController',
    template: '\n    <prm-ngrs-results-button-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-ngrs-results-button-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('NoSearchResultAfterController', [function () {
    var vm = this;
}]);

app.component('prmNoSearchResultAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'NoSearchResultAfterController',
    template: '\n    <prm-no-search-result-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-no-search-result-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('OfferDetailsTileAfterController', [function () {
    var vm = this;
}]);

app.component('prmOfferDetailsTileAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'OfferDetailsTileAfterController',
    template: '\n    <prm-offer-details-tile-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-offer-details-tile-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('OpacAfterController', [function () {
    var vm = this;
}]);

app.component('prmOpacAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'OpacAfterController',
    template: '\n    <prm-opac-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-opac-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('OpacBackButtonAfterController', [function () {
    var vm = this;
}]);

app.component('prmOpacBackButtonAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'OpacBackButtonAfterController',
    template: '\n    <prm-opac-back-button-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-opac-back-button-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('OrganizationOrFacetToggleAfterController', [function () {
    var vm = this;
}]);

app.component('prmOrganizationOrFacetToggleAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'OrganizationOrFacetToggleAfterController',
    template: '\n    <prm-organization-or-facet-toggle-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-organization-or-facet-toggle-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('OrganizationsAfterController', [function () {
    var vm = this;
}]);

app.component('prmOrganizationsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'OrganizationsAfterController',
    template: '\n    <prm-organizations-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-organizations-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('OrglistCategorizeAfterController', [function () {
    var vm = this;
}]);

app.component('prmOrglistCategorizeAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'OrglistCategorizeAfterController',
    template: '\n    <prm-orglist-categorize-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-orglist-categorize-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PageNavMenuAfterController', [function () {
    var vm = this;
}]);

app.component('prmPageNavMenuAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PageNavMenuAfterController',
    template: '\n    <prm-page-nav-menu-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-page-nav-menu-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PagingBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmPagingBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PagingBarAfterController',
    template: '\n    <prm-paging-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-paging-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PdfViewerAfterController', [function () {
    var vm = this;
}]);

app.component('prmPdfViewerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PdfViewerAfterController',
    template: '\n    <prm-pdf-viewer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-pdf-viewer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PerformanceMonitorAfterController', [function () {
    var vm = this;
}]);

app.component('prmPerformanceMonitorAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PerformanceMonitorAfterController',
    template: '\n    <prm-performance-monitor-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-performance-monitor-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PermalinkAfterController', [function () {
    var vm = this;
}]);

app.component('prmPermalinkAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PermalinkAfterController',
    template: '\n    <prm-permalink-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-permalink-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PersonalInfoAfterController', [function () {
    var vm = this;
}]);

app.component('prmPersonalInfoAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PersonalInfoAfterController',
    template: '\n    <prm-personal-info-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-personal-info-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PersonalSettingsAfterController', [function () {
    var vm = this;
}]);

app.component('prmPersonalSettingsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PersonalSettingsAfterController',
    template: '\n    <prm-personal-settings-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-personal-settings-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PersonalizationDialogAfterController', [function () {
    var vm = this;
}]);

app.component('prmPersonalizationDialogAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PersonalizationDialogAfterController',
    template: '\n    <prm-personalization-dialog-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-personalization-dialog-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PersonalizeResultsButtonAfterController', [function () {
    var vm = this;
}]);

app.component('prmPersonalizeResultsButtonAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PersonalizeResultsButtonAfterController',
    template: '\n    <prm-personalize-results-button-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-personalize-results-button-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PhysicalDeliveryMoreOptionRowAfterController', [function () {
    var vm = this;
}]);

app.component('prmPhysicalDeliveryMoreOptionRowAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PhysicalDeliveryMoreOptionRowAfterController',
    template: '\n    <prm-physical-delivery-more-option-row-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-physical-delivery-more-option-row-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PhysicalDeliveryOptionsAfterController', [function () {
    var vm = this;
}]);

app.component('prmPhysicalDeliveryOptionsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PhysicalDeliveryOptionsAfterController',
    template: '\n    <prm-physical-delivery-options-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-physical-delivery-options-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PhysicalDeliveryOptionsTableAfterController', [function () {
    var vm = this;
}]);

app.component('prmPhysicalDeliveryOptionsTableAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PhysicalDeliveryOptionsTableAfterController',
    template: '\n    <prm-physical-delivery-options-table-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-physical-delivery-options-table-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PopupMessageAfterController', [function () {
    var vm = this;
}]);

app.component('prmPopupMessageAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PopupMessageAfterController',
    template: '\n    <prm-popup-message-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-popup-message-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PreFiltersAfterController', [function () {
    var vm = this;
}]);

app.component('prmPreFiltersAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PreFiltersAfterController',
    template: '\n    <prm-pre-filters-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-pre-filters-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('PrintItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmPrintItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'PrintItemAfterController',
    template: '\n    <prm-print-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-print-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ProgressBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmProgressBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ProgressBarAfterController',
    template: '\n    <prm-progress-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-progress-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ProgressCheckboxAfterController', [function () {
    var vm = this;
}]);

app.component('prmProgressCheckboxAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ProgressCheckboxAfterController',
    template: '\n    <prm-progress-checkbox-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-progress-checkbox-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('QrCodeAfterController', [function () {
    var vm = this;
}]);

app.component('prmQrCodeAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'QrCodeAfterController',
    template: '\n    <prm-qr-code-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-qr-code-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('QuickAccessAfterController', [function () {
    var vm = this;
}]);

app.component('prmQuickAccessAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'QuickAccessAfterController',
    template: '\n    <prm-quick-access-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-quick-access-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('QuickLinkAfterController', [function () {
    var vm = this;
}]);

app.component('prmQuickLinkAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'QuickLinkAfterController',
    template: '\n    <prm-quick-link-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-quick-link-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RapidoMessageBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmRapidoMessageBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RapidoMessageBarAfterController',
    template: '\n    <prm-rapido-message-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-rapido-message-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RapidoNoOfferMessageAfterController', [function () {
    var vm = this;
}]);

app.component('prmRapidoNoOfferMessageAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RapidoNoOfferMessageAfterController',
    template: '\n    <prm-rapido-no-offer-message-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-rapido-no-offer-message-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RecomendationItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmRecomendationItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RecomendationItemAfterController',
    template: '\n    <prm-recomendation-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-recomendation-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RecomendationsAfterController', [function () {
    var vm = this;
}]);

app.component('prmRecomendationsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RecomendationsAfterController',
    template: '\n    <prm-recomendations-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-recomendations-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RecordCollectionPathsAfterController', [function () {
    var vm = this;
}]);

app.component('prmRecordCollectionPathsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RecordCollectionPathsAfterController',
    template: '\n    <prm-record-collection-paths-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-record-collection-paths-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ReferenceEntryItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmReferenceEntryItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ReferenceEntryItemAfterController',
    template: '\n    <prm-reference-entry-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-reference-entry-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RefworksAfterController', [function () {
    var vm = this;
}]);

app.component('prmRefworksAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RefworksAfterController',
    template: '\n    <prm-refworks-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-refworks-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ReportProblemAfterController', [function () {
    var vm = this;
}]);

app.component('prmReportProblemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ReportProblemAfterController',
    template: '\n    <prm-report-problem-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-report-problem-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RequestAfterController', [function () {
    var vm = this;
}]);

app.component('prmRequestAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RequestAfterController',
    template: '\n    <prm-request-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-request-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RequestApprovalAfterController', [function () {
    var vm = this;
}]);

app.component('prmRequestApprovalAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RequestApprovalAfterController',
    template: '\n    <prm-request-approval-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-request-approval-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RequestServicesAfterController', [function () {
    var vm = this;
}]);

app.component('prmRequestServicesAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RequestServicesAfterController',
    template: '\n    <prm-request-services-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-request-services-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RequestsAfterController', [function () {
    var vm = this;
}]);

app.component('prmRequestsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RequestsAfterController',
    template: '\n    <prm-requests-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-requests-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RequestsOverviewAfterController', [function () {
    var vm = this;
}]);

app.component('prmRequestsOverviewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RequestsOverviewAfterController',
    template: '\n    <prm-requests-overview-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-requests-overview-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('RequestsServicesOvlAfterController', [function () {
    var vm = this;
}]);

app.component('prmRequestsServicesOvlAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'RequestsServicesOvlAfterController',
    template: '\n    <prm-requests-services-ovl-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-requests-services-ovl-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ResourceRecommenderAfterController', [function () {
    var vm = this;
}]);

app.component('prmResourceRecommenderAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ResourceRecommenderAfterController',
    template: '\n    <prm-resource-recommender-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-resource-recommender-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ResourceRecommenderCardContentAfterController', [function () {
    var vm = this;
}]);

app.component('prmResourceRecommenderCardContentAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ResourceRecommenderCardContentAfterController',
    template: '\n    <prm-resource-recommender-card-content-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-resource-recommender-card-content-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ResourceRecommenderFullViewAfterController', [function () {
    var vm = this;
}]);

app.component('prmResourceRecommenderFullViewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ResourceRecommenderFullViewAfterController',
    template: '\n    <prm-resource-recommender-full-view-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-resource-recommender-full-view-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ResourceTypeFilterBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmResourceTypeFilterBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ResourceTypeFilterBarAfterController',
    template: '\n    <prm-resource-type-filter-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-resource-type-filter-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ReviewsResultsLineAfterController', [function () {
    var vm = this;
}]);

app.component('prmReviewsResultsLineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ReviewsResultsLineAfterController',
    template: '\n    <prm-reviews-results-line-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-reviews-results-line-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SaveToFavoritesButtonAfterController', [function () {
    var vm = this;
}]);

app.component('prmSaveToFavoritesButtonAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SaveToFavoritesButtonAfterController',
    template: '\n    <prm-save-to-favorites-button-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-save-to-favorites-button-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SavedQueriesAfterController', [function () {
    var vm = this;
}]);

app.component('prmSavedQueriesAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SavedQueriesAfterController',
    template: '\n    <prm-saved-queries-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-saved-queries-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SavedQueriesListAfterController', [function () {
    var vm = this;
}]);

app.component('prmSavedQueriesListAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SavedQueriesListAfterController',
    template: '\n    <prm-saved-queries-list-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-saved-queries-list-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SavedQueryFilterAfterController', [function () {
    var vm = this;
}]);

app.component('prmSavedQueryFilterAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SavedQueryFilterAfterController',
    template: '\n    <prm-saved-query-filter-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-saved-query-filter-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SavedSearchesGroupActionsAfterController', [function () {
    var vm = this;
}]);

app.component('prmSavedSearchesGroupActionsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SavedSearchesGroupActionsAfterController',
    template: '\n    <prm-saved-searches-group-actions-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-saved-searches-group-actions-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ScrollAfterController', [function () {
    var vm = this;
}]);

app.component('prmScrollAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ScrollAfterController',
    template: '\n    <prm-scroll-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-scroll-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SeadragonViewerAfterController', [function () {
    var vm = this;
}]);

app.component('prmSeadragonViewerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SeadragonViewerAfterController',
    template: '\n    <prm-seadragon-viewer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-seadragon-viewer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchAfterController',
    template: '\n    <prm-search-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchBarAfterController',
    template: '\n    <prm-search-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchBookmarkFilterAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchBookmarkFilterAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchBookmarkFilterAfterController',
    template: '\n    <prm-search-bookmark-filter-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-bookmark-filter-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchErrorMessageAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchErrorMessageAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchErrorMessageAfterController',
    template: '\n    <prm-search-error-message-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-error-message-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchExplainAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchExplainAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchExplainAfterController',
    template: '\n    <prm-search-explain-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-explain-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchHistoryAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchHistoryAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchHistoryAfterController',
    template: '\n    <prm-search-history-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-history-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultAddToFavoritesMenuAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultAddToFavoritesMenuAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultAddToFavoritesMenuAfterController',
    template: '\n    <prm-search-result-add-to-favorites-menu-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-add-to-favorites-menu-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultAvailabilityLineAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultAvailabilityLineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultAvailabilityLineAfterController',
    template: '\n    <prm-search-result-availability-line-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-availability-line-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultFrbrLineAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultFrbrLineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultFrbrLineAfterController',
    template: '\n    <prm-search-result-frbr-line-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-frbr-line-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultJournalIndicationLineAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultJournalIndicationLineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultJournalIndicationLineAfterController',
    template: '\n    <prm-search-result-journal-indication-line-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-journal-indication-line-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultListAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultListAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultListAfterController',
    template: '\n    <prm-search-result-list-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-list-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultSortByAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultSortByAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultSortByAfterController',
    template: '\n    <prm-search-result-sort-by-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-sort-by-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultThumbnailContainerAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultThumbnailContainerAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultThumbnailContainerAfterController',
    template: '\n    <prm-search-result-thumbnail-container-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-thumbnail-container-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultTitleAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultTitleAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultTitleAfterController',
    template: '\n    <prm-search-result-title-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-title-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchResultToolBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchResultToolBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchResultToolBarAfterController',
    template: '\n    <prm-search-result-tool-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-result-tool-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SearchWithinJournalAfterController', [function () {
    var vm = this;
}]);

app.component('prmSearchWithinJournalAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SearchWithinJournalAfterController',
    template: '\n    <prm-search-within-journal-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-search-within-journal-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SelfRegistrationAfterController', [function () {
    var vm = this;
}]);

app.component('prmSelfRegistrationAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SelfRegistrationAfterController',
    template: '\n    <prm-self-registration-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-self-registration-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SendEmailAfterController', [function () {
    var vm = this;
}]);

app.component('prmSendEmailAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SendEmailAfterController',
    template: '\n    <prm-send-email-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-send-email-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ServiceButtonAfterController', [function () {
    var vm = this;
}]);

app.component('prmServiceButtonAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ServiceButtonAfterController',
    template: '\n    <prm-service-button-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-service-button-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ServiceDetailsAfterController', [function () {
    var vm = this;
}]);

app.component('prmServiceDetailsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ServiceDetailsAfterController',
    template: '\n    <prm-service-details-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-service-details-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ServiceHeaderAfterController', [function () {
    var vm = this;
}]);

app.component('prmServiceHeaderAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ServiceHeaderAfterController',
    template: '\n    <prm-service-header-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-service-header-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ServiceLinksAfterController', [function () {
    var vm = this;
}]);

app.component('prmServiceLinksAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ServiceLinksAfterController',
    template: '\n    <prm-service-links-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-service-links-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ServiceNgrsAfterController', [function () {
    var vm = this;
}]);

app.component('prmServiceNgrsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ServiceNgrsAfterController',
    template: '\n    <prm-service-ngrs-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-service-ngrs-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ServiceNoOfferFoundAfterController', [function () {
    var vm = this;
}]);

app.component('prmServiceNoOfferFoundAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ServiceNoOfferFoundAfterController',
    template: '\n    <prm-service-no-offer-found-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-service-no-offer-found-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ServicePhysicalBestOfferAfterController', [function () {
    var vm = this;
}]);

app.component('prmServicePhysicalBestOfferAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ServicePhysicalBestOfferAfterController',
    template: '\n    <prm-service-physical-best-offer-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-service-physical-best-offer-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ServicesPageAfterController', [function () {
    var vm = this;
}]);

app.component('prmServicesPageAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ServicesPageAfterController',
    template: '\n    <prm-services-page-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-services-page-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ShareAfterController', [function () {
    var vm = this;
}]);

app.component('prmShareAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ShareAfterController',
    template: '\n    <prm-share-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-share-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SignInToViewAfterController', [function () {
    var vm = this;
}]);

app.component('prmSignInToViewAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SignInToViewAfterController',
    template: '\n    <prm-sign-in-to-view-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-sign-in-to-view-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SilentLoginAfterController', [function () {
    var vm = this;
}]);

app.component('prmSilentLoginAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SilentLoginAfterController',
    template: '\n    <prm-silent-login-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-silent-login-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SilentLoginAlertToastAfterController', [function () {
    var vm = this;
}]);

app.component('prmSilentLoginAlertToastAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SilentLoginAlertToastAfterController',
    template: '\n    <prm-silent-login-alert-toast-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-silent-login-alert-toast-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SkipToAfterController', [function () {
    var vm = this;
}]);

app.component('prmSkipToAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SkipToAfterController',
    template: '\n    <prm-skip-to-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-skip-to-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SliderFieldAfterController', [function () {
    var vm = this;
}]);

app.component('prmSliderFieldAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SliderFieldAfterController',
    template: '\n    <prm-slider-field-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-slider-field-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SnippetAfterController', [function () {
    var vm = this;
}]);

app.component('prmSnippetAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SnippetAfterController',
    template: '\n    <prm-snippet-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-snippet-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SocialMenuAfterController', [function () {
    var vm = this;
}]);

app.component('prmSocialMenuAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SocialMenuAfterController',
    template: '\n    <prm-social-menu-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-social-menu-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SourceRecordAfterController', [function () {
    var vm = this;
}]);

app.component('prmSourceRecordAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SourceRecordAfterController',
    template: '\n    <prm-source-record-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-source-record-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('StackMapAfterController', [function () {
    var vm = this;
}]);

app.component('prmStackMapAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'StackMapAfterController',
    template: '\n    <prm-stack-map-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-stack-map-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('StandAloneLoginAfterController', [function () {
    var vm = this;
}]);

app.component('prmStandAloneLoginAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'StandAloneLoginAfterController',
    template: '\n    <prm-stand-alone-login-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-stand-alone-login-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('SyndeticUnboundAfterController', [function () {
    var vm = this;
}]);

app.component('prmSyndeticUnboundAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'SyndeticUnboundAfterController',
    template: '\n    <prm-syndetic-unbound-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-syndetic-unbound-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TabsAndScopesSelectorAfterController', [function () {
    var vm = this;
}]);

app.component('prmTabsAndScopesSelectorAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TabsAndScopesSelectorAfterController',
    template: '\n    <prm-tabs-and-scopes-selector-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-tabs-and-scopes-selector-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TagsAfterController', [function () {
    var vm = this;
}]);

app.component('prmTagsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TagsAfterController',
    template: '\n    <prm-tags-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-tags-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TagsListAfterController', [function () {
    var vm = this;
}]);

app.component('prmTagsListAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TagsListAfterController',
    template: '\n    <prm-tags-list-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-tags-list-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TagsResultsAfterController', [function () {
    var vm = this;
}]);

app.component('prmTagsResultsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TagsResultsAfterController',
    template: '\n    <prm-tags-results-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-tags-results-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TagsSearchBarAfterController', [function () {
    var vm = this;
}]);

app.component('prmTagsSearchBarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TagsSearchBarAfterController',
    template: '\n    <prm-tags-search-bar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-tags-search-bar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ThumbnailListAfterController', [function () {
    var vm = this;
}]);

app.component('prmThumbnailListAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ThumbnailListAfterController',
    template: '\n    <prm-thumbnail-list-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-thumbnail-list-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TimeoutToastAfterController', [function () {
    var vm = this;
}]);

app.component('prmTimeoutToastAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TimeoutToastAfterController',
    template: '\n    <prm-timeout-toast-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-timeout-toast-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TimesCitedAfterController', [function () {
    var vm = this;
}]);

app.component('prmTimesCitedAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TimesCitedAfterController',
    template: '\n    <prm-times-cited-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-times-cited-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TopNavBarLinksAfterController', [function () {
    var vm = this;
}]);

app.component('prmTopNavBarLinksAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TopNavBarLinksAfterController',
    template: '\n    <prm-top-nav-bar-links-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-top-nav-bar-links-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TopbarAfterController', [function () {
    var vm = this;
}]);

app.component('prmTopbarAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TopbarAfterController',
    template: '\n    <prm-topbar-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-topbar-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('TreeNavAfterController', [function () {
    var vm = this;
}]);

app.component('prmTreeNavAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'TreeNavAfterController',
    template: '\n    <prm-tree-nav-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-tree-nav-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('UnionCatalogLoginAfterController', [function () {
    var vm = this;
}]);

app.component('prmUnionCatalogLoginAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'UnionCatalogLoginAfterController',
    template: '\n    <prm-union-catalog-login-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-union-catalog-login-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('UnionCatalogLoginInstitutionItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmUnionCatalogLoginInstitutionItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'UnionCatalogLoginInstitutionItemAfterController',
    template: '\n    <prm-union-catalog-login-institution-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-union-catalog-login-institution-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('UsageMetricsAfterController', [function () {
    var vm = this;
}]);

app.component('prmUsageMetricsAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'UsageMetricsAfterController',
    template: '\n    <prm-usage-metrics-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-usage-metrics-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('UserAreaAfterController', [function () {
    var vm = this;
}]);

app.component('prmUserAreaAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'UserAreaAfterController',
    template: '\n    <prm-user-area-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-user-area-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('UserAreaExpandableAfterController', [function () {
    var vm = this;
}]);

app.component('prmUserAreaExpandableAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'UserAreaExpandableAfterController',
    template: '\n    <prm-user-area-expandable-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-user-area-expandable-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('UsernamePasswordLoginAfterController', [function () {
    var vm = this;
}]);

app.component('prmUsernamePasswordLoginAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'UsernamePasswordLoginAfterController',
    template: '\n    <prm-username-password-login-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-username-password-login-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('ViewOnlineAfterController', [function () {
    var vm = this;
}]);

app.component('prmViewOnlineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'ViewOnlineAfterController',
    template: '\n    <prm-view-online-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-view-online-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('VirtualBrowseAfterController', [function () {
    var vm = this;
}]);

app.component('prmVirtualBrowseAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'VirtualBrowseAfterController',
    template: '\n    <prm-virtual-browse-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-virtual-browse-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('VirtualBrowseItemAfterController', [function () {
    var vm = this;
}]);

app.component('prmVirtualBrowseItemAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'VirtualBrowseItemAfterController',
    template: '\n    <prm-virtual-browse-item-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-virtual-browse-item-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('VirtualBrowseItemInfoAfterController', [function () {
    var vm = this;
}]);

app.component('prmVirtualBrowseItemInfoAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'VirtualBrowseItemInfoAfterController',
    template: '\n    <prm-virtual-browse-item-info-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-virtual-browse-item-info-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-

//Auto generated code by primo app store DO NOT DELETE!!! -START-
/*
    hookName is a place holder with should hold the hook name not including "prm" at the beginning and in upper camel case
    e.g: for hook prmSearchBarAfter (in html prm-search-bar-after) it should be given "SearchBarAfter"
 */
app.controller('VoiceSearchToastAfterController', [function () {
    var vm = this;
}]);

app.component('prmVoiceSearchToastAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'VoiceSearchToastAfterController',
    template: '\n    <prm-voice-search-toast-after-app-store-generated parent-ctrl="$ctrl.parentCtrl"></prm-voice-search-toast-after-app-store-generated>\n'

});

//Auto generated code by primo app store DO NOT DELETE!!! -END-
})();
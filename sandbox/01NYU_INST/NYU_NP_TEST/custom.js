(function(){
"use strict";
'use strict';

/* global angular */

// eslint-disable-next-line no-unused-vars
var app = angular.module('viewCustom', ['angularLoad']);

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

app.controller('prmSearchResultAvailabilityLineAfterController', function ($scope, $rootScope) {
    // BEGIN Generic CDN-based customization stuff moved here from autogenerated directives file.
    var vm = this;

    vm.getPnx = function () {
        try {
            return vm.parentCtrl.item.pnx;
        } catch (err) {
            console.log('prmSearchResultAvailabilityLineAfter: error accessing `vm.parentCtrl.item.pnx`');

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
    // This appears to be due to a race condition in which the `prmSearchResultAvailabilityLineAfter`
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

app.component('prmSearchResultAvailabilityLineAfter', {
    bindings: { parentCtrl: '<' },
    controller: 'prmSearchResultAvailabilityLineAfterController',
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
    app.component('prmAccountAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAccountAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-account-after.html'
    });

    // PRM-ACCOUNT-LINKS-AFTER
    app.component('prmAccountLinksAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAccountLinksAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-account-links-after.html'
    });

    // PRM-ACCOUNT-OVERVIEW-AFTER
    app.component('prmAccountOverviewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAccountOverviewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-account-overview-after.html'
    });

    // PRM-ACTION-CONTAINER-AFTER
    app.component('prmActionContainerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmActionContainerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-action-container-after.html'
    });

    // PRM-ACTION-LIST-AFTER
    app.component('prmActionListAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmActionListAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-action-list-after.html'
    });

    // PRM-ADD-ALERT-TOAST-AFTER
    app.component('prmAddAlertToastAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAddAlertToastAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-add-alert-toast-after.html'
    });

    // PRM-ADD-QUERY-TO-SAVED-SEARCHES-AFTER
    app.component('prmAddQueryToSavedSearchesAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAddQueryToSavedSearchesAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-add-query-to-saved-searches-after.html'
    });

    // PRM-ADDITIONAL-SERVICES-AFTER
    app.component('prmAdditionalServicesAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAdditionalServicesAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-additional-services-after.html'
    });

    // PRM-ADVANCED-SEARCH-AFTER
    app.component('prmAdvancedSearchAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAdvancedSearchAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-advanced-search-after.html'
    });

    // PRM-ALMA-MASHUP-AFTER
    app.component('prmAlmaMashupAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaMashupAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-mashup-after.html'
    });

    // PRM-ALMA-MORE-INST-AFTER
    app.component('prmAlmaMoreInstAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaMoreInstAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-more-inst-after.html'
    });

    // PRM-ALMA-OTHER-MEMBERS-AFTER
    app.component('prmAlmaOtherMembersAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaOtherMembersAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-other-members-after.html'
    });

    // PRM-ALMA-OTHER-UNITS-AFTER
    app.component('prmAlmaOtherUnitsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaOtherUnitsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-other-units-after.html'
    });

    // PRM-ALMA-REPRESENTATIONS-FILTER-AFTER
    app.component('prmAlmaRepresentationsFilterAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaRepresentationsFilterAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-representations-filter-after.html'
    });

    // PRM-ALMA-VIEWER-AFTER
    app.component('prmAlmaViewerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaViewerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-viewer-after.html'
    });

    // PRM-ALMA-VIEWIT-AFTER
    app.component('prmAlmaViewitAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaViewitAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-viewit-after.html'
    });

    // PRM-ALMA-VIEWIT-ITEMS-AFTER
    app.component('prmAlmaViewitItemsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlmaViewitItemsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alma-viewit-items-after.html'
    });

    // PRM-ALPHABET-TOOLBAR-AFTER
    app.component('prmAlphabetToolbarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAlphabetToolbarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-alphabet-toolbar-after.html'
    });

    // PRM-ATOZ-SEARCH-BAR-AFTER
    app.component('prmAtozSearchBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAtozSearchBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-atoz-search-bar-after.html'
    });

    // PRM-AUTHENTICATION-AFTER
    app.component('prmAuthenticationAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmAuthenticationAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-authentication-after.html'
    });

    // PRM-BACK-TO-LIBRARY-SEARCH-AFTER
    app.component('prmBackToLibrarySearchAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBackToLibrarySearchAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-back-to-library-search-after.html'
    });

    // PRM-BACK-TO-LIBRARY-SEARCH-BUTTON-AFTER
    app.component('prmBackToLibrarySearchButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBackToLibrarySearchButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-back-to-library-search-button-after.html'
    });

    // PRM-BACK-TO-SEARCH-RESULTS-BUTTON-AFTER
    app.component('prmBackToSearchResultsButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBackToSearchResultsButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-back-to-search-results-button-after.html'
    });

    // PRM-BANNER-CARD-CONTENT-AFTER
    app.component('prmBannerCardContentAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBannerCardContentAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-banner-card-content-after.html'
    });

    // PRM-BARCODE-SEARCH-AFTER
    app.component('prmBarcodeSearchAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBarcodeSearchAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-barcode-search-after.html'
    });

    // PRM-BLANK-ILL-AFTER
    app.component('prmBlankIllAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBlankIllAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-blank-ill-after.html'
    });

    // PRM-BLANK-PURCHASE-REQUEST-AFTER
    app.component('prmBlankPurchaseRequestAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBlankPurchaseRequestAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-blank-purchase-request-after.html'
    });

    // PRM-BREADCRUMBS-AFTER
    app.component('prmBreadcrumbsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBreadcrumbsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-breadcrumbs-after.html'
    });

    // PRM-BRIEF-RESULT-AFTER
    app.component('prmBriefResultAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-after.html'
    });

    // PRM-BRIEF-RESULT-CONTAINER-AFTER
    app.component('prmBriefResultContainerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultContainerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-container-after.html'
    });

    // PRM-BRIEF-RESULT-DELIVERY-OPTION-LINK-AFTER
    app.component('prmBriefResultDeliveryOptionLinkAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultDeliveryOptionLinkAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-delivery-option-link-after.html'
    });

    // PRM-BRIEF-RESULT-DIGITAL-BEST-OFFER-AFTER
    app.component('prmBriefResultDigitalBestOfferAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultDigitalBestOfferAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-digital-best-offer-after.html'
    });

    // PRM-BRIEF-RESULT-PHYSICAL-BEST-OFFER-AFTER
    app.component('prmBriefResultPhysicalBestOfferAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBriefResultPhysicalBestOfferAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-brief-result-physical-best-offer-after.html'
    });

    // PRM-BROWSE-RESULT-AFTER
    app.component('prmBrowseResultAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBrowseResultAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-browse-result-after.html'
    });

    // PRM-BROWSE-SEARCH-AFTER
    app.component('prmBrowseSearchAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBrowseSearchAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-browse-search-after.html'
    });

    // PRM-BROWSE-SEARCH-BAR-AFTER
    app.component('prmBrowseSearchBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmBrowseSearchBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-browse-search-bar-after.html'
    });

    // PRM-CHAPTERS-AND-REVIEWS-ITEM-AFTER
    app.component('prmChaptersAndReviewsItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmChaptersAndReviewsItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-chapters-and-Reviews-item-after.html'
    });

    // PRM-CHAPTERS-AND-REVIEWS-AFTER
    app.component('prmChaptersAndReviewsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmChaptersAndReviewsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-chapters-and-reviews-after.html'
    });

    // PRM-CHAPTERS-RESULTS-LINE-AFTER
    app.component('prmChaptersResultsLineAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmChaptersResultsLineAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-chapters-results-line-after.html'
    });

    // PRM-CITATION-AFTER
    app.component('prmCitationAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-after.html'
    });

    // PRM-CITATION-LINKER-AFTER
    app.component('prmCitationLinkerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationLinkerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-linker-after.html'
    });

    // PRM-CITATION-TRAILS-BREADCRUMBS-AFTER
    app.component('prmCitationTrailsBreadcrumbsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsBreadcrumbsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-breadcrumbs-after.html'
    });

    // PRM-CITATION-TRAILS-EXPAND-BUTTON-AFTER
    app.component('prmCitationTrailsExpandButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsExpandButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-expand-button-after.html'
    });

    // PRM-CITATION-TRAILS-FULLVIEW-LINK-AFTER
    app.component('prmCitationTrailsFullviewLinkAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsFullviewLinkAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-fullview-link-after.html'
    });

    // PRM-CITATION-TRAILS-INDICATION-AFTER
    app.component('prmCitationTrailsIndicationAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsIndicationAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-indication-after.html'
    });

    // PRM-CITATION-TRAILS-INDICATION-CONTAINER-AFTER
    app.component('prmCitationTrailsIndicationContainerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsIndicationContainerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-indication-container-after.html'
    });

    // PRM-CITATION-TRAILS-ITEM-AFTER
    app.component('prmCitationTrailsItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCitationTrailsItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-citation-trails-item-after.html'
    });

    // PRM-COLLECTION-AFTER
    app.component('prmCollectionAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-after.html'
    });

    // PRM-COLLECTION-BREADCRUMBS-AFTER
    app.component('prmCollectionBreadcrumbsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionBreadcrumbsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-breadcrumbs-after.html'
    });

    // PRM-COLLECTION-DISCOVERY-AFTER
    app.component('prmCollectionDiscoveryAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionDiscoveryAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-discovery-after.html'
    });

    // PRM-COLLECTION-DISCOVERY-VIEW-SWITCHER-AFTER
    app.component('prmCollectionDiscoveryViewSwitcherAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionDiscoveryViewSwitcherAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-discovery-view-switcher-after.html'
    });

    // PRM-COLLECTION-GALLERY-AFTER
    app.component('prmCollectionGalleryAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionGalleryAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-gallery-after.html'
    });

    // PRM-COLLECTION-GALLERY-HEADER-AFTER
    app.component('prmCollectionGalleryHeaderAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionGalleryHeaderAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-gallery-header-after.html'
    });

    // PRM-COLLECTION-NAVIGATION-BREADCRUMBS-AFTER
    app.component('prmCollectionNavigationBreadcrumbsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionNavigationBreadcrumbsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-navigation-breadcrumbs-after.html'
    });

    // PRM-COLLECTION-NAVIGATION-BREADCRUMBS-ITEM-AFTER
    app.component('prmCollectionNavigationBreadcrumbsItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionNavigationBreadcrumbsItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-navigation-breadcrumbs-item-after.html'
    });

    // PRM-COLLECTION-SEARCH-AFTER
    app.component('prmCollectionSearchAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCollectionSearchAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-collection-search-after.html'
    });

    // PRM-CONTROLLED-VOCABULARY-AFTER
    app.component('prmControlledVocabularyAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmControlledVocabularyAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-controlled-vocabulary-after.html'
    });

    // PRM-COPY-CLIPBOARD-BTN-AFTER
    app.component('prmCopyClipboardBtnAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCopyClipboardBtnAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-copy-clipboard-btn-after.html'
    });

    // PRM-COPYRIGHTS-AFTER
    app.component('prmCopyrightsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmCopyrightsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-copyrights-after.html'
    });

    // PRM-DATABASES-AFTER
    app.component('prmDatabasesAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDatabasesAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-databases-after.html'
    });

    // PRM-DATABASES-CATEGORIZE-AFTER
    app.component('prmDatabasesCategorizeAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDatabasesCategorizeAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-databases-categorize-after.html'
    });

    // PRM-DATABASES-FULL-VIEW-AFTER
    app.component('prmDatabasesFullViewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDatabasesFullViewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-databases-full-view-after.html'
    });

    // PRM-DATABASES-RESULTS-AFTER
    app.component('prmDatabasesResultsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDatabasesResultsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-databases-results-after.html'
    });

    // PRM-DELIVERY-REGISTRATION-AFTER
    app.component('prmDeliveryRegistrationAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDeliveryRegistrationAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-delivery-registration-after.html'
    });

    // PRM-DELIVERY-SESSION-EXPIRY-NOTIFICATION-AFTER
    app.component('prmDeliverySessionExpiryNotificationAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDeliverySessionExpiryNotificationAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-delivery-session-expiry-notification-after.html'
    });

    // PRM-DENIED-ACCESS-AFTER
    app.component('prmDeniedAccessAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDeniedAccessAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-denied-access-after.html'
    });

    // PRM-DEPOSITS-AFTER
    app.component('prmDepositsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDepositsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-deposits-after.html'
    });

    // PRM-DEPOSITS-LINK-AFTER
    app.component('prmDepositsLinkAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDepositsLinkAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-deposits-link-after.html'
    });

    // PRM-DEPOSITS-OVERVIEW-AFTER
    app.component('prmDepositsOverviewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDepositsOverviewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-deposits-overview-after.html'
    });

    // PRM-DID-U-MEAN-AFTER
    app.component('prmDidUMeanAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmDidUMeanAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-did-u-mean-after.html'
    });

    // PRM-EASYBIB-AFTER
    app.component('prmEasybibAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmEasybibAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-easybib-after.html'
    });

    // PRM-EDIT-NOTIFICATION-SETTINGS-AFTER
    app.component('prmEditNotificationSettingsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmEditNotificationSettingsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-edit-notification-settings-after.html'
    });

    // PRM-ENDNOTE-AFTER
    app.component('prmEndnoteAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmEndnoteAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-endnote-after.html'
    });

    // PRM-EPUB-FOLIATE-VIEWER-AFTER
    app.component('prmEpubFoliateViewerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmEpubFoliateViewerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-epub-foliate-viewer-after.html'
    });

    // PRM-EXPLORE-FOOTER-AFTER
    app.component('prmExploreFooterAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExploreFooterAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-explore-footer-after.html'
    });

    // PRM-EXPLORE-MAIN-AFTER
    app.component('prmExploreMainAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExploreMainAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-explore-main-after.html'
    });

    // PRM-EXPORT-BIBTEX-AFTER
    app.component('prmExportBibtexAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExportBibtexAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-export-bibtex-after.html'
    });

    // PRM-EXPORT-EXCEL-AFTER
    app.component('prmExportExcelAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExportExcelAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-export-excel-after.html'
    });

    // PRM-EXPORT-RIS-AFTER
    app.component('prmExportRisAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmExportRisAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-export-ris-after.html'
    });

    // PRM-FACET-AFTER
    app.component('prmFacetAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFacetAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-facet-after.html'
    });

    // PRM-FACET-EXACT-AFTER
    app.component('prmFacetExactAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFacetExactAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-facet-exact-after.html'
    });

    // PRM-FACET-RANGE-AFTER
    app.component('prmFacetRangeAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFacetRangeAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-facet-range-after.html'
    });

    // PRM-FAVORITES-AFTER
    app.component('prmFavoritesAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-after.html'
    });

    // PRM-FAVORITES-EDIT-LABELS-MENU-AFTER
    app.component('prmFavoritesEditLabelsMenuAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesEditLabelsMenuAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-edit-labels-menu-after.html'
    });

    // PRM-FAVORITES-LABELS-AFTER
    app.component('prmFavoritesLabelsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesLabelsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-labels-after.html'
    });

    // PRM-FAVORITES-RECORD-LABELS-AFTER
    app.component('prmFavoritesRecordLabelsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesRecordLabelsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-record-labels-after.html'
    });

    // PRM-FAVORITES-TOOL-BAR-AFTER
    app.component('prmFavoritesToolBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFavoritesToolBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-favorites-tool-bar-after.html'
    });

    // PRM-FAVORITES-WARNING-MESSAGE-AFTER
    app.component('prmFavoritesWarningMessageAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
             �����\>�\"���P�h �/�o�9���J죴��v�Z�k��PM塩���8
N�u ,v��8���t=�[����O��{r�1>~\�Å!�^)N���%���o��y�Vo͑uW3��p�D����7Au@�آ���lX1ɪ)�����/g9�V�ޘ0R�͙��&>z�$p���7�e����Y/�-I�qGr��{����ȿ�OO�Nb�1�r��Nh�����-I�Ύ�(5 �q� "�,-�����~���si	u�:�A�����7�n�7�����^����)���?��G_�4G�r��E�k���v,�����r�qmo�^'�d��c8w$ns7˸��8h�=�n����?�ַ�ku��.l{ ��?���]�١�{�|�z�(Y�C����������G\�Q>�������噤��#/��SE���Zt��>��m��mxF2���y�u�e�*��	
~�R}�g�� �l��8R,�۩;*���h"L&�!`K��[��Mu5EC�#�림bk��b�W�k����1uQ�y��M�;�A,�b���9�Ѹ:�\�Gl��!��5���
�{-����PZ�( ==Oh�L�(Yn�@�?�.&�?^�]�OJ�)�΄�A�o,0�
���������L��E��m�T/��+߹;��ץ����nsմj�td�3�ʠt�i��f\-�F�#��kzD/;GAPx��i|��?��\�~7�L��֜��xM���Z��t P�KI�.�H�K{�Ew�K�z��@j		���2P�9�������8{X�H�ϻJ��	�7A���n�ѹ"�1tV����'�<�C{��y��v*�����p��G6���.Q��o0�=]bF�!a~55 ��?�/�w��m'�'A��_<f�����ֶ���I�K���c��>YN�-ʗ�?������]��Ev�X��j���9����+�����+��m|����Z�'6�,��%��|D�B ����P:,:2+s.YA�[W����]���2	"�wv(W(؜�,@5
$c���q��Q��s㟯�xˠY�9n�Q�H#-�٭�-4y�h����7� X��9_Փ���n��}`Ku��<���=����-G{U�x-��t!h���iR�&Z�4�o�>�X6E[ ���~�7�]ȹ-���Ⱥz	-<řu�S���3�Q������A��2�?��w( gz�v�:�~�L��mcq�~���j����|9�����U�>ں�ik�gw	I��Y�2!��q�̇��ZyMI0Zd�\h�.�����n��hr����ݾ0���ыf��?��v_��h�:q���#�^a�e4���o�w
hA�5�RHb��D}���{�l���9ˌ�, m�|1`Q�����q�����,���	�ƞ��2 ����&��VA�+����\�f�U��tܹ-Z�$���:`��)����L���o˩������pv��:�����>��ړ�|�\�����d_0��:g��N�kV��3=�-B��l����7`W�S��"�}��T������`®9�;P�JH�o��&+�	��%�l�%G `�6��q�?��}��sV�n�4��y��0�<������፭:�<�;W�a�N����0��RÄ(j������mG��D+�9�����1�s\(BY���.
pp��O�+.�2�ѧ�A�vj_(?��H#�N�(E�Xe�7��IJ$��=�v���dT��u�������fh�a�_<������o'�/�گ�U��S��ݼ�_��J�l�x�9d2J�$< -��r*�6����8�>�߂ڦ��JX�������װ'$�W���"R7���ˀg*�| �Hm�����o���AaSu�'IZ1^�Ψٰɀ�8QըEg�or(�8���0mTc%����N�\<C��2;�v�rVcq/뛶�%�~�m�"��+���!}�*3X��xT�b����;Ur��iq�	$`��Xl�^9��}���̲׿��w̶��C�j�e,��2�����s���/$$=��6"VU�j�B��ʬB�c��hu�6��;�r�&���9�P��`�����z��ñ6�I�*G;��^���V�b�� f_2�?�l���9Gy�M~Ǡn�w�����9���`6��
*��*dL�j�뷊-��[Z��{K�W��;��_��Y\�-�A)���V�Spb�v��vOa]Zi��h�(���c��H�>���p�T+�ɭ��]0x�E��@��}Y�r,/��R�Fe%��̚�(�8b-���N���4�ci���A���n��m���#Ȉ���֍��[��q�_��~��n[�>ʺ;�d=�0C�����j�A�VA�kփB���t�/g`i	�5��7|]��cN_�>����*Ʃ�t�gGJmFRkW�6^A�n䭎kh�5��Ϊ��de鬖��Q�;K&_��]��w�����C&�8��
h���������X�x&%���M�@�+ķ��X�w���KXx�TN+c��Ϳ�nrս�"D.#�n�Y.�l����J�m�73�*R��!O�Hm��b�/��.���G��n/�� �y"�J*;pV�'��1��y��h�Wx��-�iI��+i�Y��&�	g�/�t���@<AB�;�LLS�r�N޺��Y�2�IO7�8
�܌�uo����*�G�/�xN��e�g#Q���=>�3��;=ne'��Hcj�̧{��1%�6�.��tO]��*i��	�����^`)i��b�                  console.log('prmFinesOverviewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-fines-overview-after.html'
    });

    // PRM-FULL-VIEW-AFTER
    app.component('prmFullViewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFullViewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-full-view-after.html'
    });

    // PRM-FULL-VIEW-CONT-AFTER
    app.component('prmFullViewContAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFullViewContAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-full-view-cont-after.html'
    });

    // PRM-FULL-VIEW-PAGE-AFTER
    app.component('prmFullViewPageAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFullViewPageAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-full-view-page-after.html'
    });

    // PRM-FULL-VIEW-SERVICE-CONTAINER-AFTER
    app.component('prmFullViewServiceContainerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmFullViewServiceContainerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-full-view-service-container-after.html'
    });

    // PRM-GALLERY-COLLECTION-AFTER
    app.component('prmGalleryCollectionAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGalleryCollectionAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-gallery-collection-after.html'
    });

    // PRM-GALLERY-COLLECTIONS-LIST-AFTER
    app.component('prmGalleryCollectionsListAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGalleryCollectionsListAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-gallery-collections-list-after.html'
    });

    // PRM-GALLERY-ITEM-AFTER
    app.component('prmGalleryItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGalleryItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-gallery-item-after.html'
    });

    // PRM-GALLERY-ITEMS-LIST-AFTER
    app.component('prmGalleryItemsListAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGalleryItemsListAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-gallery-items-list-after.html'
    });

    // PRM-GET-IT-REQUEST-AFTER
    app.component('prmGetItRequestAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmGetItRequestAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-get-it-request-after.html'
    });

    // PRM-ICON-AFTER
    app.component('prmIconAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmIconAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-icon-after.html'
    });

    // PRM-ICP-LICENSE-FOOTER-AFTER
    app.component('prmIcpLicenseFooterAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmIcpLicenseFooterAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-icp-license-footer-after.html'
    });

    // PRM-JOURNALS-AFTER
    app.component('prmJournalsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmJournalsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-journals-after.html'
    });

    // PRM-JOURNALS-FULL-VIEW-AFTER
    app.component('prmJournalsFullViewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmJournalsFullViewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-journals-full-view-after.html'
    });

    // PRM-LANGUAGE-SELECTION-AFTER
    app.component('prmLanguageSelectionAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLanguageSelectionAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-language-selection-after.html'
    });

    // PRM-LEGANTO-AFTER
    app.component('prmLegantoAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLegantoAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-leganto-after.html'
    });

    // PRM-LEGANTO-GETIT-AFTER
    app.component('prmLegantoGetitAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLegantoGetitAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-leganto-getit-after.html'
    });

    // PRM-LIBRARIES-AROUND-BAR-AFTER
    app.component('prmLibrariesAroundBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLibrariesAroundBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-libraries-around-bar-after.html'
    });

    // PRM-LIBRARY-AFTER
    app.component('prmLibraryAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLibraryAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-library-after.html'
    });

    // PRM-LIBRARY-CARD-MENU-AFTER
    app.component('prmLibraryCardMenuAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLibraryCardMenuAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-library-card-menu-after.html'
    });

    // PRM-LINKED-DATA-AFTER
    app.component('prmLinkedDataAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLinkedDataAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-linked-data-after.html'
    });

    // PRM-LINKED-DATA-CARD-AFTER
    app.component('prmLinkedDataCardAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLinkedDataCardAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-linked-data-card-after.html'
    });

    // PRM-LINKED-USER-SELECTOR-AFTER
    app.component('prmLinkedUserSelectorAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLinkedUserSelectorAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-linked-user-selector-after.html'
    });

    // PRM-LOAN-AFTER
    app.component('prmLoanAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoanAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-loan-after.html'
    });

    // PRM-LOANS-AFTER
    app.component('prmLoansAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoansAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-loans-after.html'
    });

    // PRM-LOANS-OVERVIEW-AFTER
    app.component('prmLoansOverviewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoansOverviewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-loans-overview-after.html'
    });

    // PRM-LOCATION-AFTER
    app.component('prmLocationAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-location-after.html'
    });

    // PRM-LOCATION-HOLDINGS-AFTER
    app.component('prmLocationHoldingsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationHoldingsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-location-holdings-after.html'
    });

    // PRM-LOCATION-ITEM-AFTER
    app.component('prmLocationItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-location-item-after.html'
    });

    // PRM-LOCATION-ITEMS-AFTER
    app.component('prmLocationItemsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationItemsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-location-items-after.html'
    });

    // PRM-LOCATIONS-AFTER
    app.component('prmLocationsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLocationsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-locations-after.html'
    });

    // PRM-LOGIN-AFTER
    app.component('prmLoginAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-after.html'
    });

    // PRM-LOGIN-ALMA-MASHUP-AFTER
    app.component('prmLoginAlmaMashupAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginAlmaMashupAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-alma-mashup-after.html'
    });

    // PRM-LOGIN-HELP-AFTER
    app.component('prmLoginHelpAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginHelpAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-help-after.html'
    });

    // PRM-LOGIN-IFRAME-AFTER
    app.component('prmLoginIframeAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginIframeAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-iframe-after.html'
    });

    // PRM-LOGIN-ITEM-AFTER
    app.component('prmLoginItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLoginItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-login-item-after.html'
    });

    // PRM-LOGO-AFTER
    app.component('prmLogoAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmLogoAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-logo-after.html'
    });

    // PRM-MAIN-MENU-AFTER
    app.component('prmMainMenuAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMainMenuAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-main-menu-after.html'
    });

    // PRM-MENDELEY-AFTER
    app.component('prmMendeleyAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMendeleyAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-mendeley-after.html'
    });

    // PRM-MENDELEY-TOAST-AFTER
    app.component('prmMendeleyToastAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMendeleyToastAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-mendeley-toast-after.html'
    });

    // PRM-MESSAGES-AND-BLOCKS-AFTER
    app.component('prmMessagesAndBlocksAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMessagesAndBlocksAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-messages-and-blocks-after.html'
    });

    // PRM-MESSAGES-AND-BLOCKS-OVERVIEW-AFTER
    app.component('prmMessagesAndBlocksOverviewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMessagesAndBlocksOverviewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-messages-and-blocks-overview-after.html'
    });

    // PRM-MORE-LIKE-THIS-AFTER
    app.component('prmMoreLikeThisAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMoreLikeThisAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-more-like-this-after.html'
    });

    // PRM-MORE-LIKE-THIS-ITEM-AFTER
    app.component('prmMoreLikeThisItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMoreLikeThisItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-more-like-this-item-after.html'
    });

    // PRM-MORE-LIKE-THIS-ITEM-INFO-AFTER
    app.component('prmMoreLikeThisItemInfoAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMoreLikeThisItemInfoAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-more-like-this-item-info-after.html'
    });

    // PRM-MULTI-SELECT-FILTER-AFTER
    app.component('prmMultiSelectFilterAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmMultiSelectFilterAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-multi-select-filter-after.html'
    });

    // PRM-NEWSPAPERS-FACET-AFTER
    app.component('prmNewspapersFacetAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersFacetAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-facet-after.html'
    });

    // PRM-NEWSPAPERS-FULL-VIEW-AFTER
    app.component('prmNewspapersFullViewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersFullViewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-full-view-after.html'
    });

    // PRM-NEWSPAPERS-HOME-AFTER
    app.component('prmNewspapersHomeAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersHomeAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-home-after.html'
    });

    // PRM-NEWSPAPERS-SEARCH-BAR-AFTER
    app.component('prmNewspapersSearchBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersSearchBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-search-bar-after.html'
    });

    // PRM-NEWSPAPERS-SPOTLIGHT-AFTER
    app.component('prmNewspapersSpotlightAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNewspapersSpotlightAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-newspapers-spotlight-after.html'
    });

    // PRM-NGRS-BRIEF-RESULT-LINE-AFTER
    app.component('prmNgrsBriefResultLineAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNgrsBriefResultLineAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-ngrs-brief-result-Line-after.html'
    });

    // PRM-NGRS-RESULTS-BUTTON-AFTER
    app.component('prmNgrsResultsButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNgrsResultsButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-ngrs-results-button-after.html'
    });

    // PRM-NO-SEARCH-RESULT-AFTER
    app.component('prmNoSearchResultAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmNoSearchResultAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-no-search-result-after.html'
    });

    // PRM-OFFER-DETAILS-TILE-AFTER
    app.component('prmOfferDetailsTileAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOfferDetailsTileAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-offer-details-tile-after.html'
    });

    // PRM-OPAC-AFTER
    app.component('prmOpacAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOpacAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-opac-after.html'
    });

    // PRM-OPAC-BACK-BUTTON-AFTER
    app.component('prmOpacBackButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOpacBackButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-opac-back-button-after.html'
    });

    // PRM-ORGANIZATION-OR-FACET-TOGGLE-AFTER
    app.component('prmOrganizationOrFacetToggleAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOrganizationOrFacetToggleAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-organization-or-facet-toggle-after.html'
    });

    // PRM-ORGANIZATIONS-AFTER
    app.component('prmOrganizationsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOrganizationsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-organizations-after.html'
    });

    // PRM-ORGLIST-CATEGORIZE-AFTER
    app.component('prmOrglistCategorizeAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmOrglistCategorizeAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-orglist-categorize-after.html'
    });

    // PRM-PAGE-NAV-MENU-AFTER
    app.component('prmPageNavMenuAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPageNavMenuAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-page-nav-menu-after.html'
    });

    // PRM-PAGING-BAR-AFTER
    app.component('prmPagingBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPagingBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-paging-bar-after.html'
    });

    // PRM-PDF-VIEWER-AFTER
    app.component('prmPdfViewerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPdfViewerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-pdf-viewer-after.html'
    });

    // PRM-PERFORMANCE-MONITOR-AFTER
    app.component('prmPerformanceMonitorAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPerformanceMonitorAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-performance-monitor-after.html'
    });

    // PRM-PERMALINK-AFTER
    app.component('prmPermalinkAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPermalinkAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-permalink-after.html'
    });

    // PRM-PERSONAL-INFO-AFTER
    app.component('prmPersonalInfoAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPersonalInfoAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-personal-info-after.html'
    });

    // PRM-PERSONAL-SETTINGS-AFTER
    app.component('prmPersonalSettingsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPersonalSettingsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-personal-settings-after.html'
    });

    // PRM-PERSONALIZATION-DIALOG-AFTER
    app.component('prmPersonalizationDialogAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPersonalizationDialogAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-personalization-dialog-after.html'
    });

    // PRM-PERSONALIZE-RESULTS-BUTTON-AFTER
    app.component('prmPersonalizeResultsButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPersonalizeResultsButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-personalize-results-button-after.html'
    });

    // PRM-PHYSICAL-DELIVERY-MORE-OPTION-ROW-AFTER
    app.component('prmPhysicalDeliveryMoreOptionRowAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPhysicalDeliveryMoreOptionRowAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-physical-delivery-more-option-row-after.html'
    });

    // PRM-PHYSICAL-DELIVERY-OPTIONS-AFTER
    app.component('prmPhysicalDeliveryOptionsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPhysicalDeliveryOptionsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-physical-delivery-options-after.html'
    });

    // PRM-PHYSICAL-DELIVERY-OPTIONS-TABLE-AFTER
    app.component('prmPhysicalDeliveryOptionsTableAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPhysicalDeliveryOptionsTableAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-physical-delivery-options-table-after.html'
    });

    // PRM-POPUP-MESSAGE-AFTER
    app.component('prmPopupMessageAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPopupMessageAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-popup-message-after.html'
    });

    // PRM-PRE-FILTERS-AFTER
    app.component('prmPreFiltersAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPreFiltersAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-pre-filters-after.html'
    });

    // PRM-PRINT-ITEM-AFTER
    app.component('prmPrintItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmPrintItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-print-item-after.html'
    });

    // PRM-PROGRESS-BAR-AFTER
    app.component('prmProgressBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmProgressBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-progress-bar-after.html'
    });

    // PRM-PROGRESS-CHECKBOX-AFTER
    app.component('prmProgressCheckboxAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmProgressCheckboxAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-progress-checkbox-after.html'
    });

    // PRM-QR-CODE-AFTER
    app.component('prmQrCodeAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmQrCodeAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-qr-code-after.html'
    });

    // PRM-QUICK-ACCESS-AFTER
    app.component('prmQuickAccessAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmQuickAccessAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-quick-access-after.html'
    });

    // PRM-QUICK-LINK-AFTER
    app.component('prmQuickLinkAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmQuickLinkAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-quick-link-after.html'
    });

    // PRM-RAPIDO-MESSAGE-BAR-AFTER
    app.component('prmRapidoMessageBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRapidoMessageBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-rapido-message-bar-after.html'
    });

    // PRM-RAPIDO-NO-OFFER-MESSAGE-AFTER
    app.component('prmRapidoNoOfferMessageAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRapidoNoOfferMessageAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-rapido-no-offer-message-after.html'
    });

    // PRM-RECOMENDATION-ITEM-AFTER
    app.component('prmRecomendationItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRecomendationItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-recomendation-item-after.html'
    });

    // PRM-RECOMENDATIONS-AFTER
    app.component('prmRecomendationsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRecomendationsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-recomendations-after.html'
    });

    // PRM-RECORD-COLLECTION-PATHS-AFTER
    app.component('prmRecordCollectionPathsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRecordCollectionPathsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-record-collection-paths-after.html'
    });

    // PRM-REFERENCE-ENTRY-ITEM-AFTER
    app.component('prmReferenceEntryItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmReferenceEntryItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-reference-entry-item-after.html'
    });

    // PRM-REFWORKS-AFTER
    app.component('prmRefworksAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRefworksAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-refworks-after.html'
    });

    // PRM-REPORT-PROBLEM-AFTER
    app.component('prmReportProblemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmReportProblemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-report-problem-after.html'
    });

    // PRM-REQUEST-AFTER
    app.component('prmRequestAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-request-after.html'
    });

    // PRM-REQUEST-APPROVAL-AFTER
    app.component('prmRequestApprovalAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestApprovalAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-request-approval-after.html'
    });

    // PRM-REQUEST-SERVICES-AFTER
    app.component('prmRequestServicesAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestServicesAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-request-services-after.html'
    });

    // PRM-REQUESTS-AFTER
    app.component('prmRequestsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-requests-after.html'
    });

    // PRM-REQUESTS-OVERVIEW-AFTER
    app.component('prmRequestsOverviewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestsOverviewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-requests-overview-after.html'
    });

    // PRM-REQUESTS-SERVICES-OVL-AFTER
    app.component('prmRequestsServicesOvlAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmRequestsServicesOvlAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-requests-services-ovl-after.html'
    });

    // PRM-RESOURCE-RECOMMENDER-AFTER
    app.component('prmResourceRecommenderAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmResourceRecommenderAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-resource-recommender-after.html'
    });

    // PRM-RESOURCE-RECOMMENDER-CARD-CONTENT-AFTER
    app.component('prmResourceRecommenderCardContentAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmResourceRecommenderCardContentAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-resource-recommender-card-content-after.html'
    });

    // PRM-RESOURCE-RECOMMENDER-FULL-VIEW-AFTER
    app.component('prmResourceRecommenderFullViewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmResourceRecommenderFullViewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-resource-recommender-full-view-after.html'
    });

    // PRM-RESOURCE-TYPE-FILTER-BAR-AFTER
    app.component('prmResourceTypeFilterBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmResourceTypeFilterBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-resource-type-filter-bar-after.html'
    });

    // PRM-REVIEWS-RESULTS-LINE-AFTER
    app.component('prmReviewsResultsLineAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmReviewsResultsLineAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-reviews-results-line-after.html'
    });

    // PRM-SAVE-TO-FAVORITES-BUTTON-AFTER
    app.component('prmSaveToFavoritesButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSaveToFavoritesButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-save-to-favorites-button-after.html'
    });

    // PRM-SAVED-QUERIES-AFTER
    app.component('prmSavedQueriesAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSavedQueriesAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-saved-queries-after.html'
    });

    // PRM-SAVED-QUERIES-LIST-AFTER
    app.component('prmSavedQueriesListAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSavedQueriesListAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-saved-queries-list-after.html'
    });

    // PRM-SAVED-QUERY-FILTER-AFTER
    app.component('prmSavedQueryFilterAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSavedQueryFilterAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-saved-query-filter-after.html'
    });

    // PRM-SAVED-SEARCHES-GROUP-ACTIONS-AFTER
    app.component('prmSavedSearchesGroupActionsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSavedSearchesGroupActionsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-saved-searches-group-actions-after.html'
    });

    // PRM-SCROLL-AFTER
    app.component('prmScrollAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmScrollAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-scroll-after.html'
    });

    // PRM-SEADRAGON-VIEWER-AFTER
    app.component('prmSeadragonViewerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSeadragonViewerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-seadragon-viewer-after.html'
    });

    // PRM-SEARCH-AFTER
    app.component('prmSearchAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-after.html'
    });

    // PRM-SEARCH-BAR-AFTER
    app.component('prmSearchBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-bar-after.html'
    });

    // PRM-SEARCH-BOOKMARK-FILTER-AFTER
    app.component('prmSearchBookmarkFilterAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchBookmarkFilterAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-bookmark-filter-after.html'
    });

    // PRM-SEARCH-ERROR-MESSAGE-AFTER
    app.component('prmSearchErrorMessageAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchErrorMessageAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-error-message-after.html'
    });

    // PRM-SEARCH-EXPLAIN-AFTER
    app.component('prmSearchExplainAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchExplainAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-explain-after.html'
    });

    // PRM-SEARCH-HISTORY-AFTER
    app.component('prmSearchHistoryAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchHistoryAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-history-after.html'
    });

    // PRM-SEARCH-RESULT-ADD-TO-FAVORITES-MENU-AFTER
    app.component('prmSearchResultAddToFavoritesMenuAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultAddToFavoritesMenuAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-add-to-favorites-menu-after.html'
    });

    // PRM-SEARCH-RESULT-FRBR-LINE-AFTER
    app.component('prmSearchResultFrbrLineAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultFrbrLineAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-frbr-line-after.html'
    });

    // PRM-SEARCH-RESULT-JOURNAL-INDICATION-LINE-AFTER
    app.component('prmSearchResultJournalIndicationLineAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultJournalIndicationLineAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-journal-indication-line-after.html'
    });

    // PRM-SEARCH-RESULT-LIST-AFTER
    app.component('prmSearchResultListAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultListAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-list-after.html'
    });

    // PRM-SEARCH-RESULT-SORT-BY-AFTER
    app.component('prmSearchResultSortByAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultSortByAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-sort-by-after.html'
    });

    // PRM-SEARCH-RESULT-THUMBNAIL-CONTAINER-AFTER
    app.component('prmSearchResultThumbnailContainerAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultThumbnailContainerAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-thumbnail-container-after.html'
    });

    // PRM-SEARCH-RESULT-TITLE-AFTER
    app.component('prmSearchResultTitleAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultTitleAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-title-after.html'
    });

    // PRM-SEARCH-RESULT-TOOL-BAR-AFTER
    app.component('prmSearchResultToolBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchResultToolBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-result-tool-bar-after.html'
    });

    // PRM-SEARCH-WITHIN-JOURNAL-AFTER
    app.component('prmSearchWithinJournalAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSearchWithinJournalAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-search-within-journal-after.html'
    });

    // PRM-SELF-REGISTRATION-AFTER
    app.component('prmSelfRegistrationAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSelfRegistrationAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-self-registration-after.html'
    });

    // PRM-SEND-EMAIL-AFTER
    app.component('prmSendEmailAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSendEmailAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-send-email-after.html'
    });

    // PRM-SERVICE-BUTTON-AFTER
    app.component('prmServiceButtonAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceButtonAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-button-after.html'
    });

    // PRM-SERVICE-DETAILS-AFTER
    app.component('prmServiceDetailsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceDetailsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-details-after.html'
    });

    // PRM-SERVICE-HEADER-AFTER
    app.component('prmServiceHeaderAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceHeaderAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-header-after.html'
    });

    // PRM-SERVICE-LINKS-AFTER
    app.component('prmServiceLinksAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceLinksAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-links-after.html'
    });

    // PRM-SERVICE-NGRS-AFTER
    app.component('prmServiceNgrsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceNgrsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-ngrs-after.html'
    });

    // PRM-SERVICE-NO-OFFER-FOUND-AFTER
    app.component('prmServiceNoOfferFoundAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServiceNoOfferFoundAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-no-offer-found-after.html'
    });

    // PRM-SERVICE-PHYSICAL-BEST-OFFER-AFTER
    app.component('prmServicePhysicalBestOfferAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServicePhysicalBestOfferAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-service-physical-best-offer-after.html'
    });

    // PRM-SERVICES-PAGE-AFTER
    app.component('prmServicesPageAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmServicesPageAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-services-page-after.html'
    });

    // PRM-SHARE-AFTER
    app.component('prmShareAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmShareAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-share-after.html'
    });

    // PRM-SIGN-IN-TO-VIEW-AFTER
    app.component('prmSignInToViewAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSignInToViewAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-sign-in-to-view-after.html'
    });

    // PRM-SILENT-LOGIN-AFTER
    app.component('prmSilentLoginAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSilentLoginAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-silent-login-after.html'
    });

    // PRM-SILENT-LOGIN-ALERT-TOAST-AFTER
    app.component('prmSilentLoginAlertToastAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSilentLoginAlertToastAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-silent-login-alert-toast-after.html'
    });

    // PRM-SKIP-TO-AFTER
    app.component('prmSkipToAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSkipToAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-skip-to-after.html'
    });

    // PRM-SLIDER-FIELD-AFTER
    app.component('prmSliderFieldAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSliderFieldAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-slider-field-after.html'
    });

    // PRM-SNIPPET-AFTER
    app.component('prmSnippetAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSnippetAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-snippet-after.html'
    });

    // PRM-SOCIAL-MENU-AFTER
    app.component('prmSocialMenuAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSocialMenuAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-social-menu-after.html'
    });

    // PRM-SOURCE-RECORD-AFTER
    app.component('prmSourceRecordAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSourceRecordAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-source-record-after.html'
    });

    // PRM-STACK-MAP-AFTER
    app.component('prmStackMapAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmStackMapAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-stack-map-after.html'
    });

    // PRM-STAND-ALONE-LOGIN-AFTER
    app.component('prmStandAloneLoginAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmStandAloneLoginAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-stand-alone-login-after.html'
    });

    // PRM-SYNDETIC-UNBOUND-AFTER
    app.component('prmSyndeticUnboundAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmSyndeticUnboundAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-syndetic-unbound-after.html'
    });

    // PRM-TABS-AND-SCOPES-SELECTOR-AFTER
    app.component('prmTabsAndScopesSelectorAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTabsAndScopesSelectorAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tabs-and-scopes-selector-after.html'
    });

    // PRM-TAGS-AFTER
    app.component('prmTagsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTagsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tags-after.html'
    });

    // PRM-TAGS-LIST-AFTER
    app.component('prmTagsListAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTagsListAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tags-list-after.html'
    });

    // PRM-TAGS-RESULTS-AFTER
    app.component('prmTagsResultsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTagsResultsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tags-results-after.html'
    });

    // PRM-TAGS-SEARCH-BAR-AFTER
    app.component('prmTagsSearchBarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTagsSearchBarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tags-search-bar-after.html'
    });

    // PRM-THUMBNAIL-LIST-AFTER
    app.component('prmThumbnailListAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmThumbnailListAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-thumbnail-list-after.html'
    });

    // PRM-TIMEOUT-TOAST-AFTER
    app.component('prmTimeoutToastAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTimeoutToastAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-timeout-toast-after.html'
    });

    // PRM-TIMES-CITED-AFTER
    app.component('prmTimesCitedAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTimesCitedAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-times-cited-after.html'
    });

    // PRM-TOP-BAR-BEFORE
    app.component('prmTopBarBefore', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTopBarBefore: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-top-bar-before.html'
    });

    // PRM-TOP-NAV-BAR-LINKS-AFTER
    app.component('prmTopNavBarLinksAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTopNavBarLinksAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-top-nav-bar-links-after.html'
    });

    // PRM-TOPBAR-AFTER
    app.component('prmTopbarAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTopbarAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-topbar-after.html'
    });

    // PRM-TREE-NAV-AFTER
    app.component('prmTreeNavAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmTreeNavAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-tree-nav-after.html'
    });

    // PRM-UNION-CATALOG-LOGIN-AFTER
    app.component('prmUnionCatalogLoginAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUnionCatalogLoginAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-union-catalog-login-after.html'
    });

    // PRM-UNION-CATALOG-LOGIN-INSTITUTION-ITEM-AFTER
    app.component('prmUnionCatalogLoginInstitutionItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUnionCatalogLoginInstitutionItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-union-catalog-login-institution-item-after.html'
    });

    // PRM-USAGE-METRICS-AFTER
    app.component('prmUsageMetricsAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUsageMetricsAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-usage-metrics-after.html'
    });

    // PRM-USER-AREA-AFTER
    app.component('prmUserAreaAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUserAreaAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-user-area-after.html'
    });

    // PRM-USER-AREA-EXPANDABLE-AFTER
    app.component('prmUserAreaExpandableAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUserAreaExpandableAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-user-area-expandable-after.html'
    });

    // PRM-USERNAME-PASSWORD-LOGIN-AFTER
    app.component('prmUsernamePasswordLoginAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmUsernamePasswordLoginAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-username-password-login-after.html'
    });

    // PRM-VIEW-ONLINE-AFTER
    app.component('prmViewOnlineAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmViewOnlineAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-view-online-after.html'
    });

    // PRM-VIRTUAL-BROWSE-AFTER
    app.component('prmVirtualBrowseAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmVirtualBrowseAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-virtual-browse-after.html'
    });

    // PRM-VIRTUAL-BROWSE-ITEM-AFTER
    app.component('prmVirtualBrowseItemAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmVirtualBrowseItemAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-virtual-browse-item-after.html'
    });

    // PRM-VIRTUAL-BROWSE-ITEM-INFO-AFTER
    app.component('prmVirtualBrowseItemInfoAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmVirtualBrowseItemInfoAfter: error accessing `vm.parentCtrl.item.pnx`');

                    return null;
                }
            };

            vm.rootScope = $rootScope;
            vm.scope = $scope;
        },
        templateUrl: cdnUrl + '/html/prm-virtual-browse-item-info-after.html'
    });

    // PRM-VOICE-SEARCH-TOAST-AFTER
    app.component('prmVoiceSearchToastAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope, $rootScope) {
            var vm = this;

            vm.getPnx = function () {
                try {
                    return vm.parentCtrl.item.pnx;
                } catch (err) {
                    console.log('prmVoiceSearchToastAfter: error accessing `vm.parentCtrl.item.pnx`');

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
})();
(function () {
    "use strict";
    'use strict';


    var app = angular.module('viewCustom', ['angularLoad']);

    /****************************************************************************************************/

        /*In case of CENTRAL_PACKAGE - comment out the below line to replace the other module definition*/

        /*var app = angular.module('centralCustom', ['angularLoad']);*/

    /****************************************************************************************************/

/*
javascript:function o(){window.open(location.href+'&showPnx=true',"PNXRecord")};o()
*/

app.component('dltsSwitchAdvSearchComponent', {
  bindings: {parentCtrl: '<'},
  controller: 'dltsSwitchAdvSearchComponentController',
  template: '<div layout="row" layout-align="center center" style="{{$ctrl.getval(2)}}">' + 

               '<md-card flex="35" layout-align="center center" >' + 
                '<md-card-title>' +
                  '<a href="{{$ctrl.getval(1)}}" target="_blank" rel="noopener noreferrer">Perform this search in NYU\'s main catalog.</a>' + 
                '</md-card-title>' + 
              '</md-card>' + 
            '</div>'
});

app.component('prmAdvancedSearchAfter', {
  bindings: {parentCtrl: '<'},
  template: '<dlts-switch-adv-search-component parent-ctrl="$ctrl.parentCtrl"></dlts-switch-adv-search-component>'   
});

app.controller('dltsSwitchAdvSearchComponentController', [function () {
  var vm = this;
  vm.getval = getval;
  function getval(v) {
    if (v == 1) {
      var newtaburl = location.href.replace(/[&]tab=[^&]*/,'&tab=Unified_Slot');
      var newscopeurl = newtaburl.replace(/[&]search_scope=[^&]*/,'&search_scope=DiscoveryNetwork');
      return newscopeurl.replace(/[&]vid=01NYU_INST:HIDVL/,'&vid=01NYU_INST:NYU');
    } else if (v == 2) {
      // we can use this block if we need to display this div conditionally
      //const regex1 = RegExp('query=[a-z]*,[a-z]*,', 'g');
      //var array1 = [...location.href.matchAll(regex1)];
      //return array1;
      return "";
    }
  }
}]);



/*

app.component('dltsTestComponent', {
    bindings: {parentCtrl: '<'},
    controller: 'DltsTestComponentController',
    template: '<div layout="row" layout-align="center center"><md-card flex="80"><md-card-title><span class="md-subhead">Scope: {{$ctrl.getQuery()}} </span></md-card-title></md-card></div>'
});

app.component('prmSearchBarAfter', {
    bindings: {parentCtrl: '<'},
    template: '<dlts-test-component parent-ctrl="$ctrl.parentCtrl"></dlts-test-component>'   
});

app.controller('DltsTestComponentController', [function () {
        var vm = this;
        vm.getQuery = getQuery;
        function getQuery() {
            return vm.parentCtrl.mainSearchField + "more";
        }
    }]);
    

*/


/*
app.component('dltsViewerComponent', {
    bindings: {parentCtrl: '<'},
    controller: 'DltsViewerComponentController',
    template: '<div layout="row" layout-align="center center">' +
              '<md-card flex="80">' +
              '<iframe src="https://sites.dlib.nyu.edu/media/clip/jwstqqf4_clip/mode/embed">' +
              '<span>Scope: {{$ctrl.getHandle()}} </span>' +
              '</md-card>' +
              '</div>'
});

app.component('prmViewOnlineAfter', {
    bindings: {parentCtrl: '<'},
    template: '<dlts-viewer-component parent-ctrl="$ctrl.parentCtrl"></dlts-viewer-component>'   
});

app.controller('DltsViewerComponentController', [function () {
        var vm = this;
        vm.getHandle = getHandle;
        function getQuery() {
            return vm.parentCtrl.item.linkElement.links[0].link;
        }
    }]);

*/



})();

   

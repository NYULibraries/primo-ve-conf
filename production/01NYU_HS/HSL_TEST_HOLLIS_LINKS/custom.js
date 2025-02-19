(function(){
"use strict";
'use strict';

var app = angular.module('viewCustom', ['angularLoad']);


app.component('hollisBackLinksComponent', {
  bindings: {parentCtrl: '<'},
  controller: 'hollisBackLinksComponentController',
  template: '<div layout="row" class="itemlinks" style="{{$ctrl.getval(1)}}">' + 
              '<md-card>' + 
              '<md-card-title>' + 
                  '<a class="arrow-link md-primoExplore-theme" href="{{$ctrl.getval(2)}}" target="_blank" rel="noopener noreferrer">{{$ctrl.getval(3)}}' + 
                    '<prm-icon external-link icon-type="svg" svg-icon-set="primo-ui" icon-definition="open-in-new">' + 
                      '<md-icon md-svg-icon="primo-ui:open-in-new" role="presentation" class="md-primoExplore-theme"></md-icon>' + 
                    '</prm-icon>' + 
                    '<prm-icon link-arrow icon-type="svg" svg-icon-set="primo-ui" icon-definition="chevron-right">' + 
                      '<md-icon md-svg-icon="primo-ui:chevron-right" role="presentation" class="md-primoExplore-theme"></md-icon>' + 
                    '</prm-icon>' + 
                  '</a>' +
              '</md-card-title>' + 
              '</md-card>' + 
            '</div>'
});

app.component('prmServiceLinksAfter', {
  bindings: {parentCtrl: '<'},
  template: '<hollis-back-links-component  parent-ctrl="$ctrl.parentCtrl"></hollis-back-links-component>'   
});

app.controller('hollisBackLinksComponentController', [function () {
  var vm = this;
  const regex2 = RegExp('http[^"]*','i');
  const regex3 = RegExp('Hollis[^<]*','i');
  vm.getval = getval;
  function getval(v) {
    var lds01link0 = vm.parentCtrl.item.pnx.display.lds01[0];
    if (v == 1) {
      // we can use this block if we need to display this div conditionally
      return "true";
    } else if (v == 2) {
      var linkurl = regex2.exec(lds01link0)[0];
      return  linkurl;
    } else if (v == 3) {
      var linktext = regex3.exec(lds01link0)[0];
      return  linktext;
    }
  }
}]);





"use strict";
'use strict';
})();

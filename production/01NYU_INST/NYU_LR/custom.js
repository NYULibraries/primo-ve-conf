(function () {
    "use strict";
    'use strict';


    var app = angular.module('viewCustom', ['angularLoad']);

    /****************************************************************************************************/

        /*In case of CENTRAL_PACKAGE - comment out the below line to replace the other module definition*/

        /*var app = angular.module('centralCustom', ['angularLoad']);*/

    /****************************************************************************************************/




app.component('hollisBackLinksComponent', {
  bindings: {parentCtrl: '<'},
  controller: 'hollisBackLinksComponentController',
  template: '<div layout="row" class="itemlinks" style="{{$ctrl.getval(1)}}">' + 
              '<md-card>' + 
              '<md-card-title>' + 
                  '<a class="arrow-link md-primoExplore-theme" href="{{$ctrl.getval(6)}}" target="_blank" rel="noopener noreferrer">{{$ctrl.getval(7)}}' + 
                    '<prm-icon external-link icon-type="svg" svg-icon-set="primo-ui" icon-definition="open-in-new">' + 
                      '<md-icon md-svg-icon="primo-ui:open-in-new" role="presentation" class="md-primoExplore-theme"></md-icon>' + 
                    '</prm-icon>' + 
                    '<prm-icon link-arrow icon-type="svg" svg-icon-set="primo-ui" icon-definition="chevron-right">' + 
                      '<md-icon md-svg-icon="primo-ui:chevron-right" role="presentation" class="md-primoExplore-theme"></md-icon>' + 
                    '</prm-icon>' + 
                  '</a>' +
              '</md-card-title>' + 
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
              '<md-card-title>' + 
                  '<a class="arrow-link md-primoExplore-theme" href="{{$ctrl.getval(4)}}" target="_blank" rel="noopener noreferrer">{{$ctrl.getval(5)}}' + 
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

app.component('prmSearchResultAvailabilityLineAfter', {
  bindings: {parentCtrl: '<'},
  template: '<hollis-back-links-component  parent-ctrl="$ctrl.parentCtrl"></hollis-back-links-component>'   
});

app.controller('hollisBackLinksComponentController', [function () {
  var vm = this;
  vm.getval = getval;
  function getval(v) {
    var anewdurl = location.href.replace(/nyu.primo.exlibrisgroup.com/,'nyuad.primo.exlibrisgroup.com');
    var anewvurl = anewdurl.replace(/01NYU_INST:NYU_LR/,'01NYU_AD:AD');
    var anewiurl = anewvurl.replace(/01NYU_INST/,'01NYU_AD');
    var snewdurl = location.href.replace(/nyu.primo.exlibrisgroup.com/,'nyush.primo.exlibrisgroup.com');
    var snewvurl = snewdurl.replace(/01NYU_INST:NYU_LR/,'01NYU_SH:SH');
    var snewiurl = snewvurl.replace(/01NYU_INST/,'01NYU_SH');
    var nnewdurl = location.href.replace(/nyu.primo.exlibrisgroup.com/,'nyu.primo.exlibrisgroup.com');
    var nnewvurl = nnewdurl.replace(/01NYU_INST:NYU_LR/,'01NYU_NYU:NYU');
    var nnewiurl = nnewvurl.replace(/01NYU_INST/,'01NYU_INST');
    if (v == 1) {
      // we can use this block if we need to display this div conditionally
      return "";
    } else if (v == 2) {
      return  anewiurl;
    } else if (v == 3) {
      return  "Login for NYU Abu Dhabi services";
    } else if (v == 4) {
      return  snewiurl;
    } else if (v == 5) {
      return  "Login for NYU Shanghai services";
    } else if (v == 6) {
      return  snewiurl;
    } else if (v == 7) {
      return  "Login for NYU New York services";
    }
  }
}]);






})();

  

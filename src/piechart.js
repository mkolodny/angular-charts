angular.module('piechart', [])

  .constant('piechartConfig', {
    radius: 10
  })

  .controller('PiechartController', ['$scope', '$attrs', 'piechartConfig', function($scope, $attrs, piechartConfig) {
    var slices;
    var getArc = function(startAngle, endAngle) {
      function convertToRadians(angle) {
        return angle * (Math.PI / 180);
      };

      function getPointOnCircle(angle) {
        return {
          x: Math.cos(angle),
          y: Math.sin(angle)
        };
      };

      var midAngle = startAngle + (((endAngle || 360) - startAngle) / 2);

      return {
        start: getPointOnCircle(convertToRadians(startAngle)),
        mid: getPointOnCircle(convertToRadians(midAngle)),
        end: getPointOnCircle(convertToRadians(endAngle))
      };
    };

    this.slices = slices = [];

    this.addSlice = function(sliceScope) {
      var that = this;

      slices.push(sliceScope);
      sliceScope.$on('$destroy', function() {
        that.removeSlice(sliceScope);
      })

    };

    this.removeSlice = function(sliceScope) {
      slices.splice(slices.indexOf(sliceScope), 1);
      this.setArcs();
    };

    this.setArcs = function() {
      var prevStartAngle = 0;
      var totalValue = 0;

      $scope.radius = angular.isDefined($attrs.radius) ? $scope.$eval($attrs.radius) : piechartConfig.radius;

      angular.forEach(slices, function(slice) {
        totalValue += slice.value;
      });

      angular.forEach(slices, function(slice) {
        slice.arc = getArc(
          prevStartAngle,
          prevStartAngle = (prevStartAngle + (360 / (totalValue / slice.value))) % 360
        );
        slice.arc.large = slice.value > (totalValue / 2);
      });
    };
  }])

  .directive('piechart', function() {
    return {
      restrict: 'EA',
      replace: true,
      controller: 'PiechartController',
      template: ''+
        '<svg ng-attr-height="{{radius * 2 + 10}}" ng-attr-width="{{radius * 2 + 10}}">'+
            '<g ng-attr-transform="translate({{radius}}, {{radius}}), scale({{radius}})" '+
                'ng-attr-stroke-width="{{1 / radius}}" '+
                'ng-transclude>'+
            '</g>'+
        '</svg>',
      transclude: true,
      scope: {
        radius: '@'
      }
    };
  })

  .directive('piechartSlice', function() {
    return {
      restrict: 'EA',
      require: '^piechart',
      replace: true,
      templateNamespace: 'svg',
      template: ''+
        '<path ng-attr-d="M0,0l{{arc.start.x}},{{arc.start.y}}a1,1,1,{{arc.large ? 1 : 0}},1,{{arc.end.x - arc.start.x}},{{arc.end.y - arc.start.y}}Z">'+
            '<animate '+
                'attributeName="d" '+
                'ng-attr-to="M{{arc.mid.x}},{{arc.mid.y}}l{{arc.start.x}},{{arc.start.y}}a1,1,1,{{arc.large ? 1 : 0}},1,{{arc.end.x - arc.start.x}},{{arc.end.y - arc.start.y}}Z" '+
                'dur="0.25" '+
                'begin="mouseover" '+
                'fill="freeze" />'+
            '<animate '+
                'attributeName="d" '+
                'ng-attr-to="M0,0l{{arc.start.x}},{{arc.start.y}}a1,1,1,{{arc.large ? 1 : 0}},1,{{arc.end.x - arc.start.x}},{{arc.end.y - arc.start.y}}Z" '+
                'dur="0.25" '+
                'begin="mouseout" '+
                'fill="freeze" />'+
        '</path>',
      scope: {
        value: '@'
      },
      link: function(scope, element, attrs, ctrl) {
        scope.value = parseInt(scope.value, 10);
        ctrl.addSlice(scope);

        attrs.$observe('value', function(value) {
          scope.value = parseInt(value, 10);
          ctrl.setArcs();
        });
      }
    };
  });

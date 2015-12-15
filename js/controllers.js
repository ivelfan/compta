var DB_NAME = 'ComptaClient';

var app = angular.module("comptaClient", ['ngRoute']);

// Initialisation des routes
app.config( function($routeProvider) {
	$routeProvider
	// Si l'idClient est renseigné, on est en édition. Sinon création.
	.when("/client:idClient?",{
		templateUrl:"./templates/client.html",
		controller:"clients"
	})
	.when("/facture:idFacture?", {
		templateUrl: "./templates/facture.html",
		controller: "factures"
	})
	.when("/ndf:idNdf?",{
		templateUrl:"./templates/ndf.html",
		controller:"ndfs"
		/*
	}).when("/contact",{
		templateUrl:"./templates/contact.html",
		controller:"main"*/
	}).otherwise( {
		redirectTo:"/"
		});
});

app.run(function($location) {
	console.log("init");
	$location.url("");
});

// Controleurs
app.controller("main", function($scope, $location, $rootScope, $routeParams) {
	function init() {
		$scope.clients = db.clients;
	}

	init();

	$scope.$on('reinit', function (event, args) {
		console.log('reinit main controller');
		init();
	});

	// Stores route for each tab
	$scope.savedRoute = [];

	console.log("controller");
	// Init tabs
	$scope.tab = 1;

	// Init form
	console.log("idclient=" + $scope.idClient);
	$scope.contact = {};

	$scope.selectedTab = function () {
		return $scope.tab;
	}

	$scope.selectTab = function(givenTab) {
		$scope.savedRoute[$scope.tab] = $location.url();
		$scope.idClient = undefined;
		$scope.tab = givenTab;
		// Restore previous route (if exists)
		var previousRoute = $scope.savedRoute[$scope.tab]
		if (previousRoute) {
			console.log("on a trouve "+previousRoute);
			$location.url(previousRoute);
		} else {
			$location.url("");
		}
	}

	// Keep here, in main scope, all selected items
	$scope.selectedFacture = -1;
	$scope.selectedClient = -1;
	$scope.selectedNdf = -1;
});

function persistDb() {
	localStorage.setItem(DB_NAME, JSON.stringify(db));
}

function restoreDb() {
	var temp= JSON.parse(localStorage.getItem(DB_NAME));
	if (temp !== undefined && temp != null) {
		dbEngine.importDb(temp);
	}
}

function exportDb() {
	openFile('text/attachment', db, 'data.txt');
}

function retrieveDate(field) {
	if (field && field.getTime()) {
		return field.getTime();
	} else {
		return undefined;
	}
}

// Intégration du datepicker de jQuery UI
// A la mise à jour, on alimente une propriété dans le même scope avec le nom
// <name>Time qui contient l'objet Date. Alors que la propriété bindée contient
// la chaîne affichée (=date formatée).
app.directive('datePicker', function($filter) {
	return {
		restrict: "A",
		require : "ngModel",
		link: function (scope, element, attrs, ngModelCtrl) {
			var ngModelName = scope.$eval(attrs.ngModel);
			var initDate = getValue(scope, attrs.ngModel+'Time');
			element.datepicker({
				dateFormat:'dd/mm/yy',
				// onClose better than onSelect, because it concerns both click and key edition
				onClose: function (formattedDate) {
					var val = element.datepicker('getDate');
					initTimeField(val);
					ngModelCtrl.$setViewValue(formattedDate);
                },
			});
			function initTimeField(val) {
				var timeAtt = attrs.ngModel + 'Time';
				setValue(scope, timeAtt, val);
			}
			// Init two fields: model and view
			element.datepicker('setDate', initDate);
			ngModelCtrl.$setViewValue($filter('date')(initDate, 'dd/MM/yy'));
		}
	};
});

// JQueryUI can't parse date format without day (see this: http://bugs.jqueryui.com/ticket/8510)
// So we use an alternate plugin 'MonthPicker', which usage differs slightly about method/parameter names, but works great.
app.directive('monthPicker', function($filter) {
	return {
		restrict: "A",
		require : "ngModel",
		link: function (scope, element, attrs, ngModelCtrl) {
			var ngModelName = scope.$eval(attrs.ngModel);
			var initDate = getValue(scope, attrs.ngModel+'Time');
			element.MonthPicker({
				Button: false,
				MonthFormat:"MM yy",
				SelectedMonth:initDate, // Init date at first view
				OnAfterChooseMonth: function (date) {
					initTimeField(date);
					console.log('on sort de onselect' + date);
				}
			});
			function initTimeField(val) {
				var timeAtt = attrs.ngModel + 'Time';
				setValue(scope, timeAtt, val);
			}
			// Init two fields: model and view
			ngModelCtrl.$setViewValue($filter('date')(initDate, 'MMMM yy'));
		}
	};
});



app.directive('numeric', function () {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			model: '=ngModel',
		},
		link: function (scope, element, attrs) {
			scope.$watch(attrs.ngModel, function () {
				if (!scope.model) {
					// inits with default val
					scope.model = 0;
				} else if (scope.model && typeof scope.model === 'string') {
					// console.log('value changed, new value is: ' + (typeof scope.model));
					scope.model = parseFloat(scope.model);
					// console.log('value changed, new value is: ' + (typeof scope.model));
				}
			});
		}
	};
});

app.filter("toArray", function(){
	return function(obj) {
		var result = [];
		angular.forEach(obj, function(val, key) {
			result.push(val);
		});
		return result;
	};
});

function analyse(scope, expr) {
	// If attribute is nested inside other container
	if (expr.indexOf(".") != -1) {
		var objAttributes = expr.split(".");
		var lastAttribute = objAttributes.pop();
		var partialObjString = objAttributes.join(".");
		var partialObj = eval("scope." + partialObjString);

		return {scope:partialObj, idx:lastAttribute};
	} else {
		return {scope:scope, idx:expr};
	}

}
function getValue(scope, expr) {
	var an = analyse(scope, expr);
	if (an.scope === undefined) {
		return '';
	}
	return an.scope[an.idx];
}
function setValue(scope, expr, val) {
	var an = analyse(scope, expr);
	an.scope[an.idx] = val;
}
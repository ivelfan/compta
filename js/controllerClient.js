app.controller("clients", function($scope, $location, $routeParams, $rootScope, $filter) {

	// Get back idClient from URL parameters
	$scope.idClient = $routeParams.idClient;

	$scope.selClient = function(id) {
		if (arguments.length == 0) {
			return $rootScope.selectedClient;
		}
		$rootScope.selectedClient = id;
        if (id == -1) {
        	$scope.idClient = -1;
            hidePopup();
        } else {
            preparePopup();
			$location.url("client" + id);
        }
	};

	/** Update current GUI elements **/
	$scope.updateContacts = function(idClient) {
		var listeContacts = [];
		var dbContacts = db.clients[idClient].contacts;
		for (var i=0;i<dbContacts.length;i++) {
            var idContact = dbContacts[i];
			listeContacts.push(db.contacts[idContact]);
		}
		$scope.contacts = listeContacts;
	};

	if ($scope.idClient) {
		var client = db.clients[$scope.idClient];
		// Create a copy ot keep original safe
		$scope.client = angular.copy(client);
		if (client) {
			$scope.contact = {};
			$scope.updateContacts($scope.idClient);
			$scope.idContact = -1;
			//$scope.idContact = $scope.contact.id;
		}
    }

    $scope.createClient = function() {
		preparePopup();
		$location.url("client");
	};


	$scope.isVisibleContact = function() {
		return $scope.idContact != -1;
	};

	$scope.openContact = function(idContact) {
		$scope.contact = angular.copy(db.contacts[idContact]);
		$scope.idContact = idContact;
	};

	$scope.creerContact = function() {
		$scope.contact = {};
		$scope.idContact = undefined;
	};

	$scope.submitClient = function() {
		var client = $scope.client;
		dbEngine.persistClient(client);

		// Now, we have to quit this page, and go back to main menu
		$scope.selClient(-1);
		$location.url("");
	};

	$scope.submitContact = function() {
		var contact = $scope.contact;
		var idClient = $scope.idClient;
		if (contact.id !== undefined) {
			// Contact already exist : we just update it
			dbEngine.persistContact(contact);
			//console.log('Mise a jour de '+contact);
		} else {
			dbEngine.addContact(db.clients[idClient], contact);
			//console.log('On vient de créer le contact'+contact+' sur le client '+idClient);
            $scope.client.contacts.push(contact.id);
        }
		$scope.updateContacts(idClient);
		// Hide contact edition
		$scope.idContact = -1;
	};

	$scope.deleteClient = function(idClient) {
		// Consistent checked
		var consistent = true;
		for (key in db.factures) {
			var fac = db.factures[key];
			if (fac.idClient == idClient) {
				consistent = false;
			}
		}
		if (!consistent) {
			alert('Impossible de supprimer ce client, car une facture le concerne.');
		} else {
			if (confirm("Etes vous sûr de supprimer ce client ?")) {
				dbEngine.removeClient(idClient);
				if ($scope.selectedClient == idClient) {
					$location.url("");
				}
			}
		}
	};

	// Return money for a given client
    $scope.getMoney = function(id) {
        var nbFac = 0;
        var money = 0;
        var factures = dbEngine.getClientFactures(id);
        factures.forEach(function (fac) {
            nbFac++;
            money += fac.montantTTC;
        });
        return { nbFac:nbFac, money:money };
    };

    // Return number of "factures" and money
    $scope.getFactureDisplay = function(id) {
        var res = $scope.getMoney(id);

        var result = "-";
        if (res.nbFac != 0) {
            result = res.nbFac + " ("+$filter('currency')(res.money)+")";
        }
        return result;
    };

	$scope.getClientPaymentDuration = function(id) {
		var factures = dbEngine.getClientFactures(id);
		var sum = 0;
		factures.forEach(function (fac) {
			if (fac.datePaie) {
				var dateRemiseFacture = new Date(fac.dateDebut);
				var dateFinMois = lastDayOfMonth(dateRemiseFacture);
				var delai = ecartJours(dateFinMois, new Date(fac.datePaie));
				sum += delai;
			}
		});
		// Calculate the average
		if (factures.length == 0) {
			return "-";
		}
		var avg = parseInt(sum / factures.length, 10);
		return avg+" jours";
	};

	$scope.deleteContact = function(id) {
		if (confirm($filter('i18n')("confirm.removeContact"))) {
			var idClient = $scope.client.id;
			dbEngine.removeContact(idClient, id);
            // Update current model
            var idx = $scope.client.contacts.indexOf(id);
			$scope.client.contacts.splice(idx, 1);
			// Update GUI
			$scope.updateContacts(idClient);
		}
	}

});

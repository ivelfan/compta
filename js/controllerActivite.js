// Contr�leur de l'onglet "Activit�": statistiques sur les donn�es
app.controller("activite", function($scope, $location, $rootScope) {/**
 * Created by Tchegito on 15/11/2016.
 */

    $scope.calculeConges = function() {
        // Date de d�but de prise en compte
        var dateDebut = createDate(2015, 9 - 1, 15);
        // On it�re sur toutes les factures et on somme les jours travaill�s
        var joursParMois = {};
        var joursOuvresParMois = {};
        var nbJoursOuvres;
        for (key in db.factures) {
            var fac = db.factures[key];
            var d1 = new Date(fac.dateDebut);
            var d2 = new Date(fac.dateFin);
            var idMois = dateMoisToStringShort(d2);
            var nbJours = joursParMois[idMois];
            if (!nbJours) {
                nbJours = 0;
            }
            // On somme les jours de chaque ligne de facture
            fac.lignes.forEach(function (l) {
                nbJours += parseInt(l.qte, 10);
            });
            joursParMois[idMois] = nbJours;

            // Jours ouvr�s (si non encore calcul�)
            if (!joursOuvresParMois[idMois]) {
                var debutMois = firstDayOfMonth(d2);
                var finMois = lastDayOfMonth(d2);
                nbJoursOuvres = ecartJoursOuvres(debutMois, finMois);
                console.log("mois "+dateToStringShort(debutMois) + " � "+dateToStringShort(finMois)+ " pour "+idMois+" ==> "+nbJoursOuvres);
                joursOuvresParMois[idMois] = nbJoursOuvres;
            }
        }
        // On calcule le nombre de jours ouvr�s pour chaque mois au passage
        var nbConges = 0;
        for (key in joursParMois) {
            nbConges += joursOuvresParMois[key] - joursParMois[key];
            console.log(key + " ==> " + joursParMois[key] + " / " + joursOuvresParMois[key]);
        }
        console.log("conges="+nbConges+" jours");
        return nbConges;
    }
});
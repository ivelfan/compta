
var db = {
	clients: {},
	contacts: {},
	factures: {},
	ndfs: {},
	idClient: 0,
	idContact: 0,
	idFacture: 0,
	idNdf: 0
}

var dbEngine = {
	persistClient: function(client) {	// On r�cup�re un client tout bien renseign�, il ne manque plus que l'ID
		var c;
		if (client.id === undefined) {
			c = new dataClient(client.nom, client.adresse, client.recitXP);
			c.id = db.idClient++;
			client.id = c.id;
		} else {
			c = client;
		}
		db.clients[c.id] = c;
	},
	persistContact: function(contact) {
		var c;
		if (contact.id === undefined) {
			c = new dataContact(contact.nom, contact.prenom, contact.tel, contact.mail, contact.info);
			c.id = db.idContact++;
			contact.id = c.id;
		} else {
			c = contact;
		}
		db.contacts[c.id] = c;
	},
	addContact: function (client, contact) {
		//obj.fkClient = this;
		this.persistContact(contact);
		client.contacts.push(contact.id);
		db.contacts[contact.id] = contact;
	},
	persistFacture: function (facture) {
		var f = facture;
		if (facture.id === undefined) {
			f = new dataFacture(facture.idClient, facture.montantHT, facture.tva, facture.montantTTC,
				facture.dateDebut, facture.dateFin, facture.paye, facture.datePaie);
			f.id = db.idFacture++;
		}
		f.lignes = facture.lignes;
		db.factures[f.id] = f;
	},
	// Replace current DB by given one, and update counters
	persistNdf: function (ndf) {
		var n = ndf;
		if (ndf.id === undefined) {
			n = new dataNdf(ndf.dateMois, ndf.montantTTC);
			n.id = db.idNdf++;
		}
		n.lignes = ndf.lignes;
		db.ndfs[n.id] = n;
	},
	// Replace current DB by given one, and update counters
	importDb: function (loadedDb) {
		db = loadedDb;
		/* Legacy code
		if (confirm("on deduit les id ?")) {
			db.idClient = Object.size(db.clients);
			db.idContact = Object.size(db.contacts);
			db.idFacture = Object.size(db.factures);
			db.idNdf = Object.size(db.ndfs);
		}
		if (db.ndfs === undefined) {
			db.ndfs = {};
		}*/
		// Be sure that every data is in an object, and not an array
		db.clients = sanitizeObj(db.clients);
		db.factures = sanitizeObj(db.factures);
		db.ndfs = sanitizeObj(db.ndfs);
		db.contacts = sanitizeObj(db.contacts);
		sanitizeIds();
	},
	removeNdf: function (id) {
		delete db.ndfs[id];
	},
	removeFacture: function (id) {
		delete db.factures[id];
	},
	removeClient: function (id) {
		delete db.clients[id];
	},
	removeContact: function (id) {
		delete db.contacts[id];
	}
}

// Check if IDs are well assigned. These IDs indicates the next PK for each category of saved data.
function sanitizeIds() {
	setIds(db.clients, "idClient");
	setIds(db.factures, "idFacture");
	setIds(db.ndfs, "idNdf");
	setIds(db.contacts, "idContact");

	function setIds(collection, idName) {
		if (db[idName] === undefined || db[idName] == null) {
			db[idName] = findMax(collection)+1;
		}
	}
}


function findMax(collection) {
	var max = 0;
	for (var key in collection) {
		max = Math.max(collection[key].id, max);
	}
	return max;
}

var dataClient = function(nom, adresse, recitXP) {
	this.nom = nom;
	this.adresse = adresse;
	this.recitXP = recitXP;
	this.contacts = [];
}


var dataContact = function(nom, prenom, tel, mail, info) {
	this.nom = nom;
	this.prenom = prenom;
	this.tel = tel;
	this.mail = mail;
	this.info = info;
}

var dataFacture = function(idClient, montantHT, tva, montantTTC, dateDebut, dateFin, paye, datePaiement, lignes) {
	this.idClient = idClient;
	this.montantHT = montantHT;
	this.tva = tva;
	this.paye = paye;
	this.datePaie = datePaiement;
	this.montantTTC = montantTTC;
	// These fields are a <date>.getTime() result (=ms since 1970). Because JSON can't encode/decode Date correctly
	this.dateDebut = dateDebut;
	this.dateFin = dateFin;
	if (lignes === undefined) {
		this.lignes = [];
	}else {
		this.lignes = lignes;
	}
	this.addLigne = function(ligne) {
		this.lignes.push(ligne);
	};
}

var dataLigneFacture = function(fkFacture, prixUnitaire, quantite, totalHT, descriptif) {
	this.fkFacture = fkFacture;
	this.pu = prixUnitaire;
	this.qte = quantite;
	this.totalHT = totalHT;
	this.descriptif = descriptif;
}


// Note de frais
var dataNdf = function(dateMois, montantTTC, lignes) {
	this.dateMois = dateMois;
	this.montantTTC = montantTTC;
	if (lignes === undefined) {
		this.lignes = [];
	}else {
		this.lignes = lignes;
	}
}

var dataLigneNdf = function(fkNdf, dateNote, descriptif, tva55, tva10, tva20, ttc) {
	this.fkNdf = fkNdf;
	this.dateNote = dateNote;
	this.descriptif = descriptif;
	this.ttc = ttc;
	this.tva55 = tva55;
	this.tva10 = tva10;
	this.tva20 = tva10;
}
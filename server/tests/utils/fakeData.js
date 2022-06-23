const faker = require("@faker-js/faker").faker;
const { merge } = require("lodash");
const { Cfa, Ufa, Voeu, User, Mef, Log } = require("../../src/common/model");
const { createUAI } = require("../../src/common/utils/validationUtils");
const { Csaio, Dossier } = require("../../src/common/model/index.js");

module.exports = {
  insertUser: (custom = {}) => {
    return User.create(
      merge(
        {},
        {
          username: faker.internet.userName(),
          email: faker.internet.email(),
          emails: [],
        },
        custom
      )
    );
  },
  insertCfa: (custom = {}) => {
    const username = custom.username || custom.siret || faker.helpers.replaceSymbols("#########00015");

    return Cfa.create(
      merge(
        {},
        {
          username,
          siret: username,
          email: faker.internet.email(),
          emails: [],
          raison_sociale: faker.company.companyName(),
          academie: { code: "11", nom: "Île-de-France" },
        },
        custom
      )
    );
  },
  insertCsaio: (custom = {}) => {
    return Csaio.create(
      merge(
        {},
        {
          username: faker.internet.userName(),
          email: faker.internet.email(),
          emails: [],
          region: { code: "11", nom: "Île-de-France" },
        },
        custom
      )
    );
  },
  insertUfa: (custom = {}) => {
    return Ufa.create(
      merge(
        {},
        {
          uai: custom.uai,
          libelle_type_etablissement: faker.company.companySuffix(),
          libelle_etablissement: faker.company.companyName(),
          adresse: faker.address.streetName(),
          cp: faker.address.zipCode(),
          commune: faker.address.cityName(),
        },
        custom
      )
    );
  },
  insertVoeu: (custom = {}) => {
    return Voeu.create(
      merge(
        {},
        {
          statut: "valide",
          academie: { code: "11", nom: "Île-de-France" },
          apprenant: {
            ine: faker.helpers.replaceSymbols("#########??"),
            nom: "Dupont",
            prenom: "Robert",
            telephone_personnel: "0112345678",
            telephone_portable: "0612345678",
            adresse: {
              ligne_1: "36 rue des lilas",
              code_postal: "75019",
              ville: "Paris",
              pays: "FRANCE",
            },
          },
          responsable: {
            telephone_1: "0112345678",
            email_1: "test1@apprentissage.beta.gouv.fr",
          },
          formation: {
            code_affelnet: faker.helpers.replaceSymbols("#?######"),
            code_formation_diplome: faker.helpers.replaceSymbols("#######"),
            mef: "2472521431",
            libelle: "1CAP2  CUISINE",
          },
          etablissement_origine: {
            uai: createUAI(faker.helpers.replaceSymbols("075####")),
            nom: "LYCEE SAS",
          },
          etablissement_accueil: {
            uai: createUAI(faker.helpers.replaceSymbols("075####")),
          },
          _meta: {
            import_dates: [new Date()],
            adresse: "36 rue des lilas 75019 Paris FRANCE",
            anomalies: [],
          },
        },
        custom
      )
    );
  },
  insertMef: (custom = {}) => {
    return Mef.create(
      merge(
        {},
        {
          mef: "2472521431",
          libelle_long: "2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.",
          code_formation_diplome: "40025214",
        },
        custom
      )
    );
  },
  insertLog: (custom = {}) => {
    return Log.create(
      merge(
        {},
        {
          name: "voeux-affelnet",
          time: new Date(),
          level: 30,
          msg: "test",
        },
        custom
      )
    );
  },
  insertDossier: (custom = {}) => {
    const firstName = faker.name.firstName().toUpperCase();
    const lastName = faker.name.lastName().toUpperCase();

    return Dossier.create(
      merge(
        {},
        {
          dossier_id: "621d4f652b8e994d7a1794ec",
          _meta: { nom_complet: `${firstName} ${lastName}` },
          email_contact: faker.internet.email(),
          annee_formation: 1,
          contrat_date_debut: new Date(),
          contrat_date_fin: new Date(),
          nom_apprenant: lastName,
          prenom_apprenant: firstName,
          statut: "apprenti",
          formation_cfd: faker.helpers.replaceSymbols("##?####"),
          uai_etablissement: faker.helpers.replaceSymbols("#######?"),
          academie: { code: "01", nom: "Paris" },
        },
        custom
      )
    );
  },
};

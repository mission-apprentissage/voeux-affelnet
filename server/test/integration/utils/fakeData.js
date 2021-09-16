const faker = require("faker");
const { merge } = require("lodash");
const { Cfa, Voeu, User, Mef, Log } = require("../../../src/common/model");

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
    let username = custom.username || faker.helpers.replaceSymbols("#######?");

    return Cfa.create(
      merge(
        {},
        {
          username,
          email: faker.internet.email(),
          emails: [],
          siret: faker.helpers.replaceSymbols("#########00015"),
          uai: username,
          raison_sociale: faker.company.companyName(),
          academie: { code: "11", nom: "Île-de-France" },
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
            ine: "111111111HA",
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
            uai: "3319338X",
            nom: "LYCEE SAS",
          },
          etablissement_accueil: {
            uai: "420953X",
          },
          _meta: {
            import_dates: [new Date()],
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
};

const faker = require("@faker-js/faker/locale/fr").faker;
const { merge } = require("lodash");
const { Cfa, Ufa, Voeu, User, Mef, Log } = require("../../src/common/model");
const { createUAI } = require("../../src/common/utils/validationUtils");
const { Csaio, Dossier } = require("../../src/common/model/index.js");

function createUsername() {
  return faker.internet.userName().toLowerCase();
}

function createEmail() {
  return faker.internet.email().toLowerCase();
}

module.exports = {
  createUsername,
  createEmail,
  insertUser: (custom = {}) => {
    return User.create(
      merge(
        {},
        {
          username: createUsername(),
          email: createEmail(),
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
          email: createEmail(),
          emails: [],
          raison_sociale: faker.company.companyName(),
          academie: { code: "01", nom: "Paris" },
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
          username: createUsername(),
          email: createEmail(),
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
          adresse: faker.address.street(),
          cp: faker.address.zipCode(),
          commune: faker.address.cityName(),
        },
        custom
      )
    );
  },
  insertVoeu: (custom = {}) => {
    const street = faker.address.streetAddress();
    const codePostal = faker.address.zipCode();
    const cityName = faker.address.cityName();

    return Voeu.create(
      merge(
        {},
        {
          statut: "valide",
          academie: { code: "01", nom: "Paris" },
          apprenant: {
            ine: faker.helpers.replaceSymbols("#########??"),
            nom: faker.name.lastName(),
            prenom: faker.name.firstName(),
            telephone_personnel: faker.helpers.replaceSymbols("##########"),
            telephone_portable: faker.helpers.replaceSymbols("##########"),
            adresse: {
              ligne_1: street,
              code_postal: codePostal,
              ville: cityName,
              pays: "FRANCE",
            },
          },
          responsable: {
            telephone_1: faker.helpers.replaceSymbols("##########"),
            email_1: createEmail(),
          },
          formation: {
            code_affelnet: faker.helpers.replaceSymbols("#?######"),
            code_formation_diplome: faker.helpers.replaceSymbols("#######"),
            mef: faker.helpers.replaceSymbols("##########"),
            libelle: "1CAP2  CUISINE",
            cle_ministere_educatif: faker.helpers
              .replaceSymbols("######?################################-#####_L##")
              .replace(/_/g, "#"),
          },
          etablissement_origine: {
            uai: createUAI(faker.helpers.replaceSymbols("075####")),
            nom: faker.company.companyName(),
            ville: faker.address.cityName(),
          },
          etablissement_accueil: {
            uai: createUAI(faker.helpers.replaceSymbols("075####")),
            nom: faker.company.companyName(),
            ville: faker.address.cityName(),
          },
          _meta: {
            import_dates: [new Date()],
            adresse: `${street} ${codePostal} ${cityName}`,
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
          mef: faker.helpers.replaceSymbols("#########"),
          libelle_long: "2NDPRO MAINT.VEHIC.OPTA VOIT.PARTICUL.",
          code_formation_diplome: faker.helpers.replaceSymbols("########"),
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
          email_contact: createEmail(),
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

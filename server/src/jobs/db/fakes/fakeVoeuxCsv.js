const faker = require("faker/locale/fr");
const { Readable } = require("stream");
const { oleoduc, transformIntoCSV } = require("oleoduc");

function newLine(custom = {}) {
  return {
    "Académie possédant le dossier élève": "Aix-Marseille",
    INE: faker.helpers.replaceSymbols("#########??"),
    "Nom de l'élève": faker.name.lastName(),
    "Prénom 1": faker.name.firstName(),
    "Prénom 2": faker.name.firstName(),
    "Prénom 3": faker.name.firstName(),
    "Adresse de l'élève 1": faker.address.streetAddress(),
    "Adresse de l'élève 2": "",
    "Adresse de l'élève 3": "",
    "Adresse de l'élève 4": "",
    "Code postal": faker.address.zipCode(),
    VILLE: faker.address.city(),
    PAYS: "FRANCE",
    "Téléphone personnel": faker.phone.phoneNumber("06########"),
    "Téléphone professionnel": "",
    "Téléphone portable": faker.phone.phoneNumber("06########"),
    "Téléphone responsable 1": faker.phone.phoneNumber("01########"),
    "Téléphone responsable 2": "",
    "Mail responsable 1": faker.internet.email(),
    "Mail responsable 2": "",
    "Mnémonique MEF origine de l'élève": "DIMA",
    "Code Spécialité du MEF origine de l'élève": "99999",
    "Libellé formation origine de l'élève": "3EME PREPA PRO",
    "Code Option 1 d'origine de l'élève": "SES",
    "Libellé  Option 1 d'origine de l'élève": "SCIENCES ECONOMIQUES ET SOCIALES",
    "Code Option 2 d'origine de l'élève": "MP-SC",
    "Libellé Option 2 d'origine de l'élève": "METHODES ET PRATIQUES SCIENTIFIQUES",
    "Code LV1 d'origine de l'élève": "AGL1",
    "Libellé LV1 origine de l'élève": "ANGLAIS LV1",
    "Code LV2 d'origine de l'élève": "ESP2",
    "Libellé LV2 origine de l'élève": "ESPAGNOL LV2",
    "Code UAI étab. origine": faker.helpers.replaceSymbols("#######?"),
    "Type étab. origine": "LYCEE",
    "Libellé étab. origine": faker.company.companyName(),
    "Ville étab. origine": faker.address.city(),
    "Code UAI CIO origine": faker.helpers.replaceSymbols("#######?"),
    "Libellé CIO origine": `CIO ${faker.company.companyName()}`,
    "Rang du voeu": "1",
    "Code offre de formation (vœu)": faker.helpers.replaceSymbols("?#######"),
    "Code MEF": faker.helpers.replaceSymbols("##########"),
    "Avec barème ?": "Non",
    "Mnémonique MEF de l'offre de formation": "1CAP2",
    "Code spécialité de l'offre de formation": faker.helpers.replaceSymbols("#####"),
    "Libellé formation": "1CAP2  CUISINE",
    "Code Enseignement Optionnel": "1CAP2  METIERS DE LA COIFFURE",
    "Libellé Enseignement Optionnel": "",
    "Dossier de candidature en internat demandé ?": "Non",
    "Code LV1 demandée": "AGL1",
    "Libellé  LV1 demandée": "ANGLAIS LV1",
    "Code LV2 demandée": "ESP2",
    "Libellé LV2 demandée": "ESPAGNOL LV2",
    "Code UAI étab. Accueil": faker.helpers.replaceSymbols("#######?"),
    "Type étab. Accueil": "LP",
    "Libellé établissement Accueil": faker.company.companyName(),
    "Ville étab. Accueil": faker.address.city(),
    ...custom,
  };
}

function fakeVoeuxCsv(values, options = {}) {
  const limit = options.limit || 100;

  let cpt = 0;
  const source = new Readable({
    objectMode: true,
    read() {
      if (++cpt > limit) {
        return this.push(null);
      }

      return this.push(newLine(values));
    },
  });

  return oleoduc(source, transformIntoCSV({ separator: ";" }));
}

module.exports = { fakeVoeuxCsv };

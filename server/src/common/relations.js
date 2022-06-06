const { getFromStorage } = require("./utils/ovhUtils");
const { oleoduc, writeData, accumulateData, compose, transformData } = require("oleoduc");
const { parseCsv } = require("./utils/csvUtils");
const { isUAIValid } = require("./utils/validationUtils");
const logger = require("./logger");
const { isSiretValid } = require("./utils/validationUtils.js");

const transformUfaStream = (data) => {
  return {
    uai: data["UAI"],
    libelle_type_etablissement: data["LIBELLE_TYPE_ETABLISSEMENT"],
    libelle_etablissement: data["LIBELLE_ETABLISSEMENT"],
    adresse: data["ADRESSE"],
    cp: data["CP"],
    commune: data["COMMUNE"],
    telephone: data["TELEPHONE"],
    mel: data["MEL"],
    academie: data["ACADEMIE"],
    ministere: data["MINISTERE"],
    public_prive: data["PUBLIC_PRIVE"],
    type_contrat: data["TYPE_CONTRAT"],
    code_type_etablissement: data["CODE_TYPE_ETABLISSEMENT"],
    code_nature: data["CODE_NATURE"],
    code_district: data["CODE_DISTRICT"],
    code_bassin: data["CODE_BASSIN"],
    cio: data["CIO"],
    internat: data["INTERNAT"],
    reseau_ambition_reussite: data["RESEAU_AMBITION_REUSSITE"],
    mnemonique: data["MNEMONIQUE"],
    code_specialite: data["CODE_SPECIALITE"],
    libelle_ban: data["LIBELLE_BAN"],
    code_mef: data["CODE_MEF"],
    code_voie: data["CODE_VOIE"],
    libelle_voie: data["LIBELLE_VOIE"],
    saisie_possible_3eme: data["SAISIE_POSSIBLE_3EME"],
    saisie_resrevee_segpa: data["SAISIE_RESREVEE_SEGPA"],
    saisie_possible_2de: data["SAISIE_POSSIBLE_2DE"],
    visible_portail: data["VISIBLE_PORTAIL"],
    libelle_formation: data["LIBELLE_FORMATION"],
    url_onisep_formation: data["URL_ONISEP_FORMATION"],
    // libelle_etablissement: data["LIBELLE_ETABLISSEMENT"],
    url_onisep_etablissement: data["URL_ONISEP_ETABLISSEMENT"],
    libelle_ville: data["LIBELLE_VILLE"],
    campus_metier: data["CAMPUS_METIER"],
    modalites_particulieres: data["MODALITES_PARTICULIERES"],
    coordonnees_gps_latitude: data["COORDONNEES_GPS_LATITUDE"],
    coordonnees_gps_longitude: data["COORDONNEES_GPS_LONGITUDE"],
    cle_ministere_educatif: data["CLE_MINISTERE_EDUCATIF"],
    siret_uai_gestionnaire: data["SIRET_UAI_GESTIONNAIRE"],
  };
};

async function getDefaultUfaStream() {
  const stream = await getFromStorage("AFFELNET-LYCEE-2022-OF_apprentissage-02-05-2022.csv");

  return compose(stream, parseCsv(), transformData(transformUfaStream));
}

async function loadRelations(csv) {
  const stream = csv ? compose(csv, parseCsv()) : await getDefaultUfaStream();

  let relations;
  await oleoduc(
    stream,
    accumulateData(
      (acc, data) => {
        let siret = data.siret_uai_gestionnaire;
        siret = isSiretValid(siret) ? siret : "INCONNU";

        if (!acc[siret]) {
          acc[siret] = [];
        }

        const uai = data.uai;
        if (!isUAIValid(uai)) {
          isUAIValid(uai);
          logger.warn(`L'UAI de la relation est invalide ${uai}`);
        } else if (!acc[siret].includes(uai)) {
          acc[siret].push(uai);
        }
        return acc;
      },
      { accumulator: {} }
    ),
    writeData((acc) => {
      relations = acc;
    })
  );

  return relations;
}

module.exports = { loadRelations, transformUfaStream, getDefaultUfaStream };

const { oleoduc, filterData, writeData, transformData, compose } = require("oleoduc");
const Joi = require("@hapi/joi");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Formation } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");

const schema = Joi.object({
  uai: Joi.string().required(),
}).unknown();

const transformFormateurStream = (data) => {
  return {
    id: `${data["ACADEMIE"]}/${data["CODE_OFFRE"]}`,
    academie: data["ACADEMIE"],
    code_offre: data["CODE_OFFRE"],
    cle_ministere_educatif: data["CLE_MINISTERE_EDUCATIF"],
    uai: data["UAI"],
    libelle_type_etablissement: data["LIBELLE_TYPE_ETABLISSEMENT"],
    libelle_etablissement: data["LIBELLE_ETABLISSEMENT"],
    adresse: data["ADRESSE"],
    cp: data["CP"],
    commune: data["COMMUNE"],
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
    url_onisep_etablissement: data["URL_ONISEP_ETABLISSEMENT"],
    libelle_ville: data["LIBELLE_VILLE"],
    campus_metier: data["CAMPUS_METIER"],
    modalites_particulieres: data["MODALITES_PARTICULIERES"],
    coordonnees_gps_latitude: data["COORDONNEES_GPS_LATITUDE"],
    coordonnees_gps_longitude: data["COORDONNEES_GPS_LONGITUDE"],
    siret_uai_gestionnaire: data["SIRET_UAI_GESTIONNAIRE"],
    integree_catalogue: data["INTEGREE_CATALOGUE"],
    uai_formateur: data["UAI_FORMATEUR"],
    uai_responsable: data["UAI_RESPONSABLE"],
  };
};

async function importFormations(formationsCsv) {
  const stream = compose(
    formationsCsv,
    parseCsv({
      on_record: (record) => omitEmpty(record),
    }),
    transformData(transformFormateurStream)
  );

  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  await Formation.deleteMany({});

  await oleoduc(
    stream,
    filterData(async (json) => {
      stats.total++;
      const { error } = schema.validate(json, { abortEarly: false });
      if (!error) {
        return true;
      }

      stats.invalid++;
      logger.warn(`La formation ${json.id} est invalide`, error);
      return false;
    }),
    writeData(
      async (data) => {
        try {
          await Formation.create(data);
          stats.created++;
          logger.info(`Formation ${data.id} created`);
        } catch (error) {
          stats.failed++;
          logger.error(`Impossible de traiter la formation ${data.id}`, error);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importFormations;

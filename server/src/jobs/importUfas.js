const { oleoduc, filterData, writeData, transformData, compose } = require("oleoduc");
const Joi = require("@hapi/joi");

const { omitEmpty } = require("../common/utils/objectUtils");
const logger = require("../common/logger");
const { Ufa } = require("../common/model");
const { parseCsv } = require("../common/utils/csvUtils");
const { getFromStorage } = require("../common/utils/ovhUtils.js");

const schema = Joi.object({
  uai: Joi.string().required(),
}).unknown();

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
  const stream = await getFromStorage("AFFELNET-LYCEE-2022-OF_apprentissage-07-06-2022.csv");

  return compose(stream, parseCsv(), transformData(transformUfaStream));
}

async function importUfas(ufaCsv) {
  console.log("stream", ufaCsv);
  const stream = ufaCsv
    ? compose(
        ufaCsv,
        parseCsv({
          on_record: (record) => omitEmpty(record),
        }),
        transformData(transformUfaStream)
      )
    : await getDefaultUfaStream();

  // const referentielApi = options.referentielApi || new ReferentielApi();
  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    invalid: 0,
    failed: 0,
  };

  console.log("reading stream");
  await oleoduc(
    stream,
    filterData(async (json) => {
      console.log({ json });
      stats.total++;
      const { error } = schema.validate(json, { abortEarly: false });
      if (!error) {
        return true;
      }

      stats.invalid++;
      logger.warn(`Le ufa ${json.uai} est invalide`, error);
      return false;
    }),
    writeData(
      async ({ uai, ...data }) => {
        try {
          const res = await Ufa.updateOne(
            { uai },
            {
              $setOnInsert: {
                uai,
              },
              $set: {
                ...data,
              },
            },
            { upsert: true, setDefaultsOnInsert: true, runValidators: true }
          );

          if (res.upsertedCount) {
            stats.created++;
            logger.info(`Ufa ${uai} created`);
          } else if (res.modifiedCount) {
            stats.updated++;
            logger.info(`Ufa ${uai} updated`);
          } else {
            logger.trace(`Ufa ${uai} déjà à jour`);
          }
        } catch (e) {
          stats.failed++;
          logger.error(`Impossible de traiter le ufa ${uai}`, e);
        }
      },
      { parallel: 10 }
    )
  );

  return stats;
}

module.exports = importUfas;

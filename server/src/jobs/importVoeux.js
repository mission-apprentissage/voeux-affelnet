const { oleoduc, transformData, writeData } = require("oleoduc");
const Joi = require("@hapi/joi");
const { pickBy, isEmpty, uniqBy } = require("lodash");
const { intersection, sortedUniq, omit } = require("lodash");
const { diff } = require("deep-object-diff");
const { Voeu, Mef } = require("../common/model");
const logger = require("../common/logger");
const { findAcademieByName } = require("../common/academies");
const { deepOmitEmpty, trimValues, flattenObject } = require("../common/utils/objectUtils");
const { parseCsv } = require("../common/utils/csvUtils");
const { markVoeuxAsAvailable } = require("../common/actions/markVoeuxAsAvailable.js");

const schema = Joi.object({
  academie: Joi.object({
    code: Joi.string().required(),
    nom: Joi.string().required(),
  }).required(),
  apprenant: Joi.object({
    ine: Joi.string().required(),
    nom: Joi.string().required(),
    prenom: Joi.string().required(),
    telephone_personnel: Joi.string().pattern(/^[0-9]+$/),
    telephone_portable: Joi.string().pattern(/^[0-9]+$/),
    adresse: {
      ligne_1: Joi.string(),
      ligne_2: Joi.string(),
      ligne_3: Joi.string(),
      ligne_4: Joi.string(),
      code_postal: Joi.string().required(),
      ville: Joi.string().required(),
      pays: Joi.string().required(),
    },
  }).required(),
  responsable: Joi.object({
    telephone_1: Joi.string()
      .pattern(/^[0-9]+$/)
      .optional(),
    telephone_2: Joi.string()
      .pattern(/^[0-9]+$/)
      .optional(),
    email_1: Joi.string().email(),
    email_2: Joi.string().email(),
  }),
  formation: Joi.object({
    code_affelnet: Joi.string().required(),
    code_formation_diplome: Joi.string().pattern(/^[0-9]{8}$/),
    mef: Joi.string().pattern(/^[0-9]{10}$/),
    libelle: Joi.string(),
    cle_ministere_educatif: Joi.string(),
  })
    .or("mef", "libelle", "code_formation_diplome")
    .required(),
  etablissement_origine: Joi.object({
    uai: Joi.string()
      .pattern(/^[0-9]{7}[A-Z]{1}$/)
      .required(),
    nom: Joi.string().required(),
    ville: Joi.string(),
    cio: Joi.string(),
  }),
  etablissement_accueil: Joi.object({
    uai: Joi.string()
      .pattern(/^[0-9]{7}[A-Z]{1}$/)
      .required(),
    nom: Joi.string().required(),
    ville: Joi.string(),
    cio: Joi.string(),
  }).required(),
});

function fixCodePostal(code) {
  return code && code.length === 4 ? `0${code}` : code;
}

function fixPhoneNumber(phone) {
  return phone ? phone.replace(/^\+[0-9]{2}/, "0").replace(/ /, "") : phone;
}

async function findFormationDiplome(code) {
  const mef = (code || "").substring(0, 10);
  return Mef.findOne({ mef });
}

function buildAdresseLibelle(adresse) {
  return `${adresse.ligne_1} ${adresse.ligne_2} ${adresse.ligne_3} ${adresse.ligne_4} ${adresse.code_postal} ${adresse.ville} ${adresse.pays}`
    .replace(/undefined/g, "")
    .replace(/\s\s+/g, " ")
    .trim();
}

function parseVoeuxCsv(source) {
  return oleoduc(
    source,
    parseCsv({
      quote: '"',
      on_record: (record) => {
        const filtered = pickBy(record, (v) => !isEmpty(v) && v !== "-");
        return trimValues(filtered);
      },
    }),
    transformData(async (line) => {
      const { mef, code_formation_diplome } = (await findFormationDiplome(line["Code MEF"])) || {};
      const academie = findAcademieByName(line["Acad??mie poss??dant le dossier ??l??ve"]);

      return deepOmitEmpty({
        ...(academie
          ? {
              academie: {
                code: academie.code,
                nom: academie.nom,
              },
            }
          : {}),
        apprenant: {
          ine: line["INE"],
          nom: line["Nom de l'??l??ve"],
          prenom: line["Pr??nom 1"],
          telephone_personnel: fixPhoneNumber(line["T??l??phone personnel"]),
          telephone_portable: fixPhoneNumber(line["T??l??phone portable"]),
          adresse: {
            ligne_1: line["Adresse de l'??l??ve - Ligne 1"],
            ligne_2: line["Adresse de l'??l??ve - Ligne 2"],
            ligne_3: line["Adresse de l'??l??ve - Ligne 3"],
            ligne_4: line["Adresse de l'??l??ve - Ligne 4"],
            code_postal: fixCodePostal(line["Code postal"]),
            ville: line["VILLE"],
            pays: line["PAYS"],
          },
        },
        responsable: {
          telephone_1: fixPhoneNumber(line["T??l??phone responsable 1"]),
          telephone_2: fixPhoneNumber(line["T??l??phone responsable 2"]),
          email_1: line["Mail responsable 1"],
          email_2: line["Mail responsable 2"],
        },
        formation: {
          code_affelnet: line["Code offre de formation (v??u)"],
          mef,
          code_formation_diplome,
          libelle: line["Libell?? formation"],
          cle_ministere_educatif: line["cl?? minist??re ??ducatif"],
        },
        etablissement_origine: {
          uai: line["Code UAI ??tab. origine"]?.toUpperCase(),
          nom: `${line["Type ??tab. origine"] || ""} ${line["Libell?? ??tab. origine"] || ""}`.trim(),
          ville: line["Ville ??tab. origine"],
          cio: line["Code UAI CIO origine"],
        },
        etablissement_accueil: {
          uai: line["Code UAI ??tab. Accueil"]?.toUpperCase(),
          nom: `${line["Type ??tab. Accueil"] || ""} ${line["Libell?? ??tablissement Accueil"] || ""}`.trim(),
          ville: line["Ville ??tab. Accueil"],
          cio: line["UAI CIO de l'??tablissement d'accueil"],
        },
      });
    }),
    { promisify: false }
  );
}

async function validate(data) {
  try {
    await schema.validateAsync(data, { abortEarly: false });
    return [];
  } catch (e) {
    return e.details.map((d) => {
      return { path: d.path.join("."), type: d.type };
    }, []);
  }
}

function hasAnomaliesOnMandatoryFields(anomalies) {
  return (
    intersection(
      anomalies.flatMap((d) => d.path),
      [
        "academie",
        "apprenant.ine",
        "apprenant.nom",
        "apprenant.prenom",
        "formation.code_affelnet",
        "formation.code_formation_diplome",
        "etablissement_accueil.uai",
      ]
    ).length > 0
  );
}

async function importVoeux(voeuxCsvStream, options = {}) {
  const stats = {
    total: 0,
    created: 0,
    invalid: 0,
    failed: 0,
    deleted: 0,
    updated: 0,
  };
  const manquantes = [];
  const updatedFields = new Set();
  const importDate = options.importDate || new Date();

  await oleoduc(
    parseVoeuxCsv(voeuxCsvStream),
    writeData(
      async (data) => {
        stats.total++;
        try {
          const anomalies = await validate(data);
          if (hasAnomaliesOnMandatoryFields(anomalies)) {
            logger.error(`Voeu invalide`, {
              line: stats.total,
              "apprenant.ine": data.apprenant?.ine,
              "formation.code_affelnet": data.formation?.code_affelnet,
              anomalies,
            });
            stats.invalid++;
            return;
          }

          const query = {
            "academie.code": data.academie.code,
            "apprenant.ine": data.apprenant.ine,
            "formation.code_affelnet": data.formation.code_affelnet,
          };
          const previous = await Voeu.findOne(query, { _id: 0, __v: 0 }).lean();
          const differences = diff(flattenObject(omit(previous, ["_meta"])), flattenObject(data));
          const etablissementAccueilUAI = data.etablissement_accueil.uai;

          const res = await Voeu.replaceOne(
            query,
            {
              ...data,
              _meta: {
                anomalies: anomalies,
                adresse: buildAdresseLibelle(data.apprenant.adresse),
                import_dates: uniqBy([...(previous?._meta.import_dates || []), importDate], (date) => date.getTime()),
              },
            },
            { upsert: true }
          );

          if (res.upsertedCount) {
            logger.info(`Voeu ajout??`, {
              query,
              etablissement_accueil: etablissementAccueilUAI,
            });
            stats.created++;
          }

          if (!isEmpty(differences)) {
            if (res.modifiedCount) {
              stats.updated++;
              Object.keys(differences).forEach((key) => updatedFields.add(key));
            }

            await markVoeuxAsAvailable(etablissementAccueilUAI, importDate);
          }
        } catch (e) {
          logger.error(`Import du voeu impossible`, stats.total, e);
          stats.failed++;
        }
      },
      { parallel: 10 }
    )
  );

  const { deletedCount } = await Voeu.deleteMany({ "_meta.import_dates": { $nin: [importDate] } });
  stats.deleted = deletedCount;

  if (manquantes.length > 0) {
    logger.warn(
      `Certains ??tablissements d'accueil des voeux ne sont pas pr??sents dans la base CFA ${JSON.stringify(
        uniqBy(manquantes, (m) => m.uai)
      )}`
    );
  }

  return {
    ...stats,
    updated_fields: sortedUniq([...updatedFields]),
  };
}

module.exports = importVoeux;

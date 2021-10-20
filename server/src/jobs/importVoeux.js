const { oleoduc, transformData, writeData } = require("oleoduc");
const Joi = require("@hapi/joi");
const { pickBy, isEmpty, uniqBy } = require("lodash");
const { intersection, sortedUniq, omit } = require("lodash");
const { diff } = require("deep-object-diff");
const { Voeu, Cfa, Mef } = require("../common/model");
const logger = require("../common/logger");
const { findAcademieByName } = require("../common/academies");
const { deepOmitEmpty, trimValues, flattenObject } = require("../common/utils/objectUtils");
const { parseCsv } = require("../common/utils/csvUtils");

let schema = Joi.object({
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
  })
    .or("mef", "libelle", "code_formation_diplome")
    .required(),
  etablissement_origine: Joi.object({
    uai: Joi.string()
      .pattern(/^[0-9]{7}[A-Z]{1}$/)
      .required(),
    nom: Joi.string().required(),
    ville: Joi.string(),
  }),
  etablissement_accueil: Joi.object({
    uai: Joi.string()
      .pattern(/^[0-9]{7}[A-Z]{1}$/)
      .required(),
    nom: Joi.string().required(),
    ville: Joi.string(),
  }).required(),
});

function fixCodePostal(code) {
  return code && code.length === 4 ? `0${code}` : code;
}

function fixPhoneNumber(phone) {
  return phone ? phone.replace(/^\+[0-9]{2}/, "0").replace(/ /, "") : phone;
}

async function findFormationDiplome(code) {
  let mef = (code || "").substring(0, 10);
  return Mef.findOne({ mef });
}

function parseVoeuxCsv(source) {
  return oleoduc(
    source,
    parseCsv({
      quote: '"',
      on_record: (record) => {
        let filtered = pickBy(record, (v) => !isEmpty(v) && v !== "-");
        return trimValues(filtered);
      },
    }),
    transformData(async (line) => {
      let { mef, code_formation_diplome } = (await findFormationDiplome(line["Code MEF"])) || {};
      let academie = findAcademieByName(line["Académie possédant le dossier élève"]);

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
          nom: line["Nom de l'élève"],
          prenom: line["Prénom 1"],
          telephone_personnel: fixPhoneNumber(line["Téléphone personnel"]),
          telephone_portable: fixPhoneNumber(line["Téléphone portable"]),
          adresse: {
            ligne_1: line["Adresse de l'élève - Ligne 1"],
            ligne_2: line["Adresse de l'élève - Ligne 2"],
            ligne_3: line["Adresse de l'élève - Ligne 3"],
            ligne_4: line["Adresse de l'élève - Ligne 4"],
            code_postal: fixCodePostal(line["Code postal"]),
            ville: line["VILLE"],
            pays: line["PAYS"],
          },
        },
        responsable: {
          telephone_1: fixPhoneNumber(line["Téléphone responsable 1"]),
          telephone_2: fixPhoneNumber(line["Téléphone responsable 2"]),
          email_1: line["Mail responsable 1"],
          email_2: line["Mail responsable 2"],
        },
        formation: {
          code_affelnet: line["Code offre de formation (vœu)"],
          mef,
          code_formation_diplome,
          libelle: line["Libellé formation"],
        },
        etablissement_origine: {
          uai: line["Code UAI étab. origine"],
          nom: `${line["Type étab. origine"] || ""} ${line["Libellé étab. origine"] || ""}`.trim(),
          ville: line["Ville étab. origine"],
        },
        etablissement_accueil: {
          uai: line["Code UAI étab. Accueil"],
          nom: `${line["Type étab. Accueil"] || ""} ${line["Libellé établissement Accueil"] || ""}`.trim(),
          ville: line["Ville étab. Accueil"],
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

function updateCfa(uai, importDate) {
  return Cfa.updateOne(
    { uai },
    {
      $set: {
        voeux_date: importDate,
      },
    }
  );
}

async function importVoeux(voeuxCsvStream, options = {}) {
  let stats = {
    total: 0,
    created: 0,
    invalid: 0,
    failed: 0,
    deleted: 0,
    updated: 0,
  };
  let updatedFields = new Set();
  let importDate = options.importDate || new Date();

  await oleoduc(
    parseVoeuxCsv(voeuxCsvStream),
    writeData(async (data) => {
      stats.total++;

      let anomalies = await validate(data);
      if (hasAnomaliesOnMandatoryFields(anomalies)) {
        logger.error(`Voeu invalide`, {
          line: stats.total,
          anomalies,
        });
        stats.invalid++;
        return;
      }

      try {
        let query = {
          "academie.code": data.academie.code,
          "apprenant.ine": data.apprenant.ine,
          "formation.code_affelnet": data.formation.code_affelnet,
        };
        let selector = `${stats.total}/${Object.values(query).join("/")}`;
        let previous = await Voeu.findOne(query, { _id: 0, __v: 0 }).lean();
        let differences = diff(flattenObject(omit(previous, ["_meta"])), flattenObject(data));

        let res = await Voeu.replaceOne(
          query,
          {
            ...data,
            _meta: {
              anomalies: anomalies,
              import_dates: uniqBy([...(previous?._meta.import_dates || []), importDate], (date) => date.getTime()),
            },
          },
          { upsert: true }
        );

        if (res.upserted && res.upserted.length) {
          logger.info(`Voeu ${selector} ajouté`);
          stats.created++;
        }

        if (!isEmpty(differences)) {
          if (res.nModified) {
            stats.updated++;
            Object.keys(differences).forEach((key) => updatedFields.add(key));
          }
          await updateCfa(data.etablissement_accueil.uai, importDate);
        }
      } catch (e) {
        logger.error(`Import du voeu impossible`, stats.total, e);
        stats.failed++;
      }
    })
  );

  let { deletedCount } = await Voeu.deleteMany({ "_meta.import_dates": { $nin: [importDate] } });
  stats.deleted = deletedCount;

  return {
    ...stats,
    updated_fields: sortedUniq([...updatedFields]),
  };
}

module.exports = importVoeux;

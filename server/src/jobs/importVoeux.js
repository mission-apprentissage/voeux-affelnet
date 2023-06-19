const { oleoduc, transformData, writeData } = require("oleoduc");
const Joi = require("@hapi/joi");
const { pickBy, isEmpty, uniqBy, pick } = require("lodash");
const { intersection, sortedUniq, omit } = require("lodash");
const { diff } = require("deep-object-diff");
const { Voeu, Mef } = require("../common/model");
const logger = require("../common/logger");
const { findAcademieByName } = require("../common/academies");
const { deepOmitEmpty, trimValues, flattenObject } = require("../common/utils/objectUtils");
const { parseCsv } = require("../common/utils/csvUtils");
const { markVoeuxAsAvailable } = require("../common/actions/markVoeuxAsAvailable.js");
const { findAcademieByUai } = require("../common/academies.js");
const { uaiFormat, siretFormat, mef10Format, cfdFormat } = require("../common/utils/format");
const { getSiretGestionnaireFromCleMinistereEducatif } = require("../common/utils/cleMinistereEducatifUtils");
const { catalogue } = require("./utils/catalogue");
const { saveListAvailable, saveUpdatedListAvailable } = require("../common/actions/history/formateur");
const { referentiel } = require("./utils/referentiel");

const academieValidationSchema = Joi.object({
  code: Joi.string().required(),
  nom: Joi.string().required(),
}).required();

const schema = Joi.object({
  academie: academieValidationSchema,
  apprenant: Joi.object({
    ine: Joi.string().required(),
    nom: Joi.string().required(),
    prenom: Joi.string().required(),
    telephone_personnel: Joi.string().pattern(/^[0-9]+$/),
    telephone_portable: Joi.string().pattern(/^[0-9]+$/),
    adresse: {
      libelle: Joi.string().required(),
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
    code_formation_diplome: Joi.string().pattern(cfdFormat),
    mef: Joi.string().pattern(mef10Format),
    libelle: Joi.string(),
    cle_ministere_educatif: Joi.string(),
  })
    .or("mef", "libelle", "code_formation_diplome")
    .required(),
  etablissement_origine: Joi.object({
    uai: Joi.string().pattern(uaiFormat).required(),
    nom: Joi.string().required(),
    ville: Joi.string(),
    cio: Joi.string(),
    academie: academieValidationSchema,
  }),
  etablissement_accueil: Joi.object({
    uai: Joi.string().pattern(uaiFormat).required(),
    nom: Joi.string().required(),
    ville: Joi.string(),
    cio: Joi.string(),
    academie: academieValidationSchema,
  }).required(),
  etablissement_formateur: Joi.object({
    uai: Joi.string().pattern(uaiFormat),
  }).required(),
  etablissement_gestionnaire: Joi.object({
    siret: Joi.string().pattern(siretFormat),
  }).required(),
});

const fixCodePostal = (code) => {
  return code && code.length === 4 ? `0${code}` : code;
};

const fixPhoneNumber = (phone) => {
  return phone ? phone.replace(/^\+[0-9]{2}/, "0").replace(/ /, "") : phone;
};

const findFormationDiplome = async (code) => {
  const mef = (code || "").substring(0, 10);
  return Mef.findOne({ mef });
};

const buildAdresseLibelle = (line) => {
  return [
    line["Adresse de l'élève - Ligne 1"],
    line["Adresse de l'élève - Ligne 2"],
    line["Adresse de l'élève - Ligne 3"],
    line["Adresse de l'élève - Ligne 4"],
    fixCodePostal(line["Code postal"]),
    line["VILLE"],
    line["PAYS"],
  ]
    .filter((s) => s)
    .join(" ")
    .replace(/\s\s+/g, " ")
    .trim();
};

const pickAcademie = (academie) => {
  const res = pick(academie, ["code", "nom"]);
  return isEmpty(res) ? null : res;
};

const parseVoeuxCsv = async (source) => {
  const { findFormateurUai, findGestionnaireSiretAndEmail } = await catalogue();
  const { findSiretResponsableReferentiel } = await referentiel();

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
      const uaiEtablissementOrigine = line["Code UAI étab. origine"]?.toUpperCase();
      const uaiEtablissementAccueil = line["Code UAI étab. Accueil"]?.toUpperCase();
      const uaiCIO = line["Code UAI CIO origine"]?.toUpperCase();
      const academieDuVoeu = pickAcademie(findAcademieByName(line["Académie possédant le dossier élève"]));
      const academieOrigine = pickAcademie(findAcademieByUai(uaiCIO || uaiEtablissementOrigine));
      const academieAccueil = pickAcademie(findAcademieByUai(uaiEtablissementAccueil));

      const siretGestionnaireFromLine = getSiretGestionnaireFromCleMinistereEducatif(
        line["clé ministère éducatif"],
        line["SIRET UAI gestionnaire"]
      );

      const siretGestionnaire = siretGestionnaireFromLine?.length
        ? siretGestionnaireFromLine
        : await findGestionnaireSiretAndEmail({
            uai: uaiEtablissementAccueil,
            siretGestionnaire: siretGestionnaireFromLine,
            cleMinistereEducatif: line["clé ministère éducatif"],
          })?.formations?.[0]?.etablissement_gestionnaire_siret;

      const uaiFormateur =
        (
          await findFormateurUai({
            uai: uaiEtablissementAccueil,
            cleMinistereEducatif: line["clé ministère éducatif"],
            siretGestionnaire: siretGestionnaire,
          })
        )?.formations?.[0]?.etablissement_formateur_uai ?? uaiEtablissementAccueil;

      return deepOmitEmpty({
        academie: academieDuVoeu,
        apprenant: {
          ine: line["INE"],
          nom: line["Nom de l'élève"],
          prenom: line["Prénom 1"],
          telephone_personnel: fixPhoneNumber(line["Téléphone personnel"]),
          telephone_portable: fixPhoneNumber(line["Téléphone portable"]),
          adresse: {
            libelle: buildAdresseLibelle(line),
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
          cle_ministere_educatif: line["clé ministère éducatif"],
        },
        etablissement_origine: {
          uai: uaiEtablissementOrigine,
          nom: `${line["Type étab. origine"] || ""} ${line["Libellé étab. origine"] || ""}`.trim(),
          ville: line["Ville étab. origine"],
          cio: uaiCIO,
          academie: academieOrigine || academieDuVoeu,
        },
        etablissement_accueil: {
          uai: uaiEtablissementAccueil,
          nom: `${line["Type étab. Accueil"] || ""} ${line["Libellé établissement Accueil"] || ""}`.trim(),
          ville: line["Ville étab. Accueil"],
          cio: line["UAI CIO de l'établissement d'accueil"],
          academie: academieAccueil || academieDuVoeu,
        },
        etablissement_formateur: {
          uai: uaiFormateur,
        },
        etablissement_gestionnaire: {
          siret: siretGestionnaire ?? (await findSiretResponsableReferentiel(uaiFormateur)),
        },
      });
    }),
    { promisify: false }
  );
};

const validate = async (data) => {
  try {
    await schema.validateAsync(data, { abortEarly: false });
    return [];
  } catch (e) {
    return e.details.map((d) => {
      return { path: d.path.join("."), type: d.type };
    }, []);
  }
};

const hasAnomaliesOnMandatoryFields = (anomalies) => {
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
        "etablissement_formateur.uai",
        "etablissement_gestionnaire.siret",
      ]
    ).length > 0
  );
};

const importVoeux = async (voeuxCsvStream, options = {}) => {
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

  logger.info(`Import des listes de candidats...`);

  const relations = new Set();

  await oleoduc(
    await (async () => await parseVoeuxCsv(voeuxCsvStream))(),
    writeData(
      async (data) => {
        const key = JSON.stringify({
          siret: data.etablissement_gestionnaire.siret,
          uai: data.etablissement_formateur.uai,
        });

        stats.total++;
        try {
          const anomalies = await validate(data);
          if (hasAnomaliesOnMandatoryFields(anomalies)) {
            logger.warn(`Voeu invalide`, {
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

          const res = await Voeu.replaceOne(
            query,
            {
              ...data,
              _meta: {
                anomalies,
                jeune_uniquement_en_apprentissage: previous?._meta.jeune_uniquement_en_apprentissage || false,
                //uniqBy([...(previous?._meta.import_dates || []), importDate], (date) => date.getTime()),
                import_dates: Object.keys(differences).length
                  ? uniqBy([...(previous?._meta.import_dates || []), importDate], (date) => date.getTime())
                  : previous?._meta.import_dates,
              },
            },
            { upsert: true }
          );

          if (res.upsertedCount) {
            logger.debug(`Voeu ajouté`, {
              query,
              etablissement_accueil: data.etablissement_accueil.uai,
            });
            stats.created++;
          }

          if (!isEmpty(differences)) {
            if (!relations.has(key)) {
              relations.add(key);
            }

            if (res.modifiedCount) {
              stats.updated++;
              Object.keys(differences).forEach((key) => updatedFields.add(key));
            }

            await markVoeuxAsAvailable(
              { siret: data.etablissement_gestionnaire.siret, uai: data.etablissement_formateur.uai },
              importDate
            );
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
      `Certains établissements d'accueil des voeux ne sont pas présents dans la base CFA ${JSON.stringify(
        uniqBy(manquantes, (m) => m.uai)
      )}`
    );
  }

  await Promise.all(
    [...relations].map(async (relation) => {
      const { siret, uai } = JSON.parse(relation);

      const nombre_voeux = await Voeu.countDocuments({
        "etablissement_formateur.uai": uai,
        "etablissement_gestionnaire.siret": siret,
      });

      if (
        await Voeu.countDocuments({
          "etablissement_formateur.uai": uai,
          "etablissement_gestionnaire.siret": siret,
          "_meta.import_dates": { $nin: [importDate] },
        })
      ) {
        return await saveUpdatedListAvailable({ uai, siret, nombre_voeux });
      } else {
        return await saveListAvailable({ uai, siret, nombre_voeux });
      }
    })
  );

  return {
    ...stats,
    updated_fields: sortedUniq([...updatedFields]),
  };
};

module.exports = importVoeux;

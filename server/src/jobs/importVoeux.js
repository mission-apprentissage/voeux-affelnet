const { oleoduc, transformData, writeData } = require("oleoduc");
const Joi = require("@hapi/joi");
const { isEmpty, uniqBy, pick } = require("lodash");
const { intersection, sortedUniq, omit } = require("lodash");
const { diff } = require("deep-object-diff");
const { Voeu, Mef, Etablissement, Formation } = require("../common/model");
const logger = require("../common/logger");
const { findAcademieByName } = require("../common/academies");
const { deepOmitEmpty, flattenObject } = require("../common/utils/objectUtils");

const { findAcademieByUai } = require("../common/academies.js");
const { siretFormat, uaiFormat, mef10Format, cfdFormat } = require("../common/utils/format");
const { catalogue } = require("./utils/catalogue");
const { saveListAvailable, saveUpdatedListAvailable } = require("../common/actions/history/relation");
const { fixExtractionVoeux } = require("./utils/extractionVoeux.js");
const {
  getSiretFormateurFromCleMinistereEducatif,
  getSiretResponsableFromCleMinistereEducatif,
} = require("../common/utils/cleMinistereEducatifUtils.js");

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
    affelnet_id: Joi.string(),
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
    siret: Joi.string().pattern(siretFormat),
  }).required(),
  etablissement_responsable: Joi.object({
    uai: Joi.string().pattern(uaiFormat),
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

const parseVoeuxCsv = async (sourceCsv, overwriteCsv) => {
  const { findFormation } = await catalogue();

  return oleoduc(
    // sourceCsv,
    // parseCsv({
    //   quote: '"',
    //   on_record: (record) => {
    //     const filtered = pickBy(record, (v) => !isEmpty(v) && v !== "-");
    //     return trimValues(filtered);
    //   },
    // }),
    await fixExtractionVoeux(sourceCsv, overwriteCsv),

    transformData(async (line) => {
      // logger.info({ line });
      const { mef, code_formation_diplome } = (await findFormationDiplome(line["Code MEF"])) || {};
      const uaiEtablissementOrigine = line["Code UAI étab. origine"]?.toUpperCase();
      const uaiEtablissementAccueil = line["Code UAI étab. Accueil"]?.toUpperCase();
      const cle_ministere_educatif = line["clé ministère éducatif"]?.toUpperCase();

      const uaiEtablissementResponsable = line["UAI Établissement responsable"]?.toUpperCase();
      const uaiEtablissementFormateur = line["UAI Établissement formateur"]?.toUpperCase();

      const siretEtablissementResponsable = getSiretResponsableFromCleMinistereEducatif(
        cle_ministere_educatif,
        line["SIRET UAI gestionnaire"]?.toUpperCase()
      );
      const siretEtablissementFormateur = getSiretFormateurFromCleMinistereEducatif(
        cle_ministere_educatif,
        line["SIRET UAI formateur"]?.toUpperCase()
      );

      const uaiCIO = line["Code UAI CIO origine"]?.toUpperCase();
      const academieDuVoeu = pickAcademie(
        findAcademieByName(line["Académie possédant le dossier élève et l'offre de formation"])
      );
      const academieOrigine = pickAcademie(findAcademieByUai(uaiCIO || uaiEtablissementOrigine));
      const academieAccueil = pickAcademie(findAcademieByUai(uaiEtablissementAccueil));

      let siretResponsable = siretEtablissementResponsable;
      let siretFormateur = siretEtablissementFormateur;
      let uaiResponsable = uaiEtablissementResponsable;
      let uaiFormateur = uaiEtablissementFormateur;

      const academie = academieDuVoeu?.nom.toUpperCase();
      const code_offre = line["Code offre de formation (vœu)"];
      const affelnet_id = `${academie}/${code_offre}`;

      if (
        (!siretResponsable || !siretFormateur || !uaiResponsable || !uaiFormateur) &&
        (affelnet_id || cle_ministere_educatif)
      ) {
        let formation;

        if (cle_ministere_educatif?.length) {
          formation = await findFormation({ published: true, cle_ministere_educatif });
        }

        if (!formation) {
          formation = await findFormation({ published: true, affelnet_id });
        }

        if (!formation) {
          formation = await findFormation({ affelnet_id });
        }

        if (formation) {
          siretResponsable ??= formation.etablissement_gestionnaire_siret;
          uaiResponsable ??= formation.etablissement_gestionnaire_uai;
          siretFormateur ??= formation.etablissement_formateur_siret;
          uaiFormateur ??= formation.etablissement_formateur_uai;
        }
      }

      if (!uaiResponsable || !uaiFormateur) {
        const responsable = await Etablissement.findOne({ siret: siretResponsable }).lean();
        const formateur = await Etablissement.findOne({ siret: siretFormateur }).lean();

        // siretResponsable ??= responsable?.siret;
        uaiResponsable ??= responsable?.uai;
        // siretFormateur ??= formateur?.siret;
        uaiFormateur ??= formateur?.uai;
      }

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
          affelnet_id,
          code_affelnet: code_offre,
          mef,
          code_formation_diplome,
          libelle: line["Libellé formation"],
          cle_ministere_educatif,
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
          siret: siretFormateur,
          uai: uaiFormateur,
        },
        etablissement_responsable: {
          siret: siretResponsable,
          uai: uaiResponsable,
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
  // if (anomalies.length !== 0) {
  //   console.log("Anomalies detected:", anomalies);
  // }
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
        // "etablissement_formateur.uai",
        // "etablissement_responsable.uai",
        "etablissement_formateur.siret",
        "etablissement_responsable.siret",
      ]
    ).length > 0
  );
};

// IMPORTANT : Lancer importMefs avant
const importVoeux = async (voeuxCsvStream, overwriteFile, options = {}) => {
  const stats = {
    total: 0,
    created: 0,
    invalid: 0,
    failed: 0,
    ignored: 0,
    deleted: 0,
    updated: 0,
  };
  const manquantes = [];
  const updatedFields = new Set();
  const importDate = options.importDate || new Date();

  logger.info(`Import des listes de candidats...`);

  const relations = new Set();
  const ids = new Set();

  await oleoduc(
    await (async () => await parseVoeuxCsv(voeuxCsvStream, overwriteFile))(),
    writeData(
      async (data) => {
        const key = JSON.stringify({
          siret_responsable: data.etablissement_responsable.siret,
          siret_formateur: data.etablissement_formateur.siret,
        });

        console.log(stats.total, data.formation.affelnet_id);

        stats.total++;
        const anomalies = await validate(data);
        const query = {
          "academie.code": data.academie?.code,
          "apprenant.ine": data.apprenant.ine,
          "formation.code_affelnet": data.formation.code_affelnet,
        };

        if ((await Formation.findOne({ id: data.formation.affelnet_id }))?.capacite === "0") {
          logger.warn(`La candidature est affectée à une formation sans capacité d'affectation, on l'ignore`, {
            query,
          });
          stats.ignored++;
          return;
        }

        if (hasAnomaliesOnMandatoryFields(anomalies)) {
          logger.warn(`Voeu invalide`, {
            line: stats.total,
            ...query,
            anomalies,
          });
          stats.invalid++;
          return;
        }

        try {
          const previous = await Voeu.findOne(query, { __v: 0 }).lean();
          const differences = diff(flattenObject(omit(previous, ["_meta", "_id"])), flattenObject(data));

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
            logger.info(`Voeu ajouté`, {
              query,
            });
            stats.created++;
          }

          if (!isEmpty(differences)) {
            if (!relations.has(key)) {
              relations.add(key);
            }

            if (res.modifiedCount) {
              logger.info(`Voeu modifié`, {
                query,
                differences,
              });
              stats.updated++;
              Object.keys(differences).forEach((key) => updatedFields.add(key));
            }
          }

          ids.add((await Voeu.findOne(query, { _id: 1 }).lean())._id);
        } catch (e) {
          logger.error(
            `Import du voeu impossible`,
            {
              query,
            },
            e
          );
          stats.failed++;
        }
      },
      { parallel: 50 }
    )
  );

  // const { deletedCount } = await Voeu.deleteMany({ "_meta.import_dates": { $nin: [importDate] } });
  const { deletedCount } = await Voeu.deleteMany({ _id: { $nin: [...ids] } });
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
      const { siret_responsable, siret_formateur } = JSON.parse(relation);

      const nombre_voeux = await Voeu.countDocuments({
        "etablissement_responsable.siret": siret_responsable,
        "etablissement_formateur.siret": siret_formateur,
      });

      if (
        await Voeu.countDocuments({
          "etablissement_responsable.siret": siret_responsable,
          "etablissement_formateur.siret": siret_formateur,
          "_meta.import_dates": { $in: [importDate] },
        })
      ) {
        if (
          await Voeu.countDocuments({
            "etablissement_responsable.siret": siret_responsable,
            "etablissement_formateur.siret": siret_formateur,
            "_meta.import_dates": { $nin: [importDate] },
          })
        ) {
          return await saveUpdatedListAvailable({ siret_responsable, siret_formateur, nombre_voeux });
        } else {
          return await saveListAvailable({ siret_responsable, siret_formateur, nombre_voeux });
        }
      }
    })
  );

  return {
    ...stats,
    updated_fields: sortedUniq([...updatedFields]),
  };
};

module.exports = importVoeux;

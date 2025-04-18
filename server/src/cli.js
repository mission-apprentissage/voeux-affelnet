require("dotenv").config();
const { program: cli } = require("commander");
const { oleoduc, transformData, filterData, transformIntoCSV, writeToStdout, flattenArray } = require("oleoduc");
const { createReadStream, createWriteStream } = require("fs");
const { Readable } = require("stream");
const { runScript } = require("./jobs/utils/runScript");
const logger = require("./common/logger");
const { confirm } = require("./common/actions/confirm");
const importMefs = require("./jobs/importMefs");
const importVoeux = require("./jobs/importVoeux");
const sendConfirmationEmails = require("./jobs/sendConfirmationEmails");
const sendActivationEmails = require("./jobs/sendActivationEmails");
const sendNotificationEmails = require("./jobs/sendNotificationEmails");
const sendUpdateEmails = require("./jobs/sendUpdateEmails");
const { importEtablissements } = require("./jobs/importEtablissements");
const { cleanEtablissements } = require("./jobs/cleanEtablissements");
const { importEtablissementsRelations } = require("./jobs/importEtablissementsRelations");
const importFormations = require("./jobs/importFormations");
const computeStats = require("./jobs/computeStats");
const exportResponsables = require("./jobs/exportResponsables");
const buildRelationCsv = require("./jobs/buildRelationCsv");
const { createAdmin } = require("./jobs/createAdmin");
const { createAcademie } = require("./jobs/createAcademie");
const { injectDataset } = require("../tests/dataset/injectDataset");
const { Etablissement } = require("./common/model");
const CatalogueApi = require("./common/api/CatalogueApi");
// const { importDossiers } = require("./jobs/importDossiers");
// const { createCsaio } = require("./jobs/createCsaio");
// const { importJeunesUniquementEnApprentissage } = require("./jobs/importJeunesUniquementEnApprentissage");
// const { asArray } = require("./common/utils/stringUtils");
const { getLatestImportDate } = require("./common/actions/getLatestImportDate");
// const { findAcademieByCode } = require("./common/academies");
const { createActionToken } = require("./common/utils/jwtUtils");
const config = require("./config");
const { activateDelegues } = require("./jobs/activateDelegues");

process.on("unhandledRejection", (e) => console.log(e));
process.on("uncaughtException", (e) => console.log(e));
process.stdout.on("error", function (err) {
  if (err.code === "EPIPE") {
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
});

cli
  .command("importMefs")
  .description("Importe les referentiels de données")
  .action(() => {
    runScript(() => {
      return importMefs();
    });
  });

cli
  .command("buildRelationCsv")
  .description("Permet de créer le fichier des CFA")
  .option("--affelnet <affelnet>", "Le fichier CSV contentant l'offre de formation Affelnet", createReadStream)
  .option(
    "--overwrite <affelnetOverwrite>",
    "Le fichier CSV contentant l'offre de formation corrigée Affelnet",
    createReadStream
  )
  .option(
    "--additionalRelations <additionalRelations>",
    "Le fichier CSV contenant les relations complémentaires",
    createReadStream
  )
  .option(
    "--outRelations <outputRelationsFile",
    "Fichier cible dans lequel sera stocké l'export (défaut: stdout)",
    createWriteStream
  )
  .option(
    "--outInvalids <outputInvalidsFile>",
    "Fichier cible dans lequel sera stocké l'export (défaut: stdout)",
    createWriteStream
  )
  .action(({ outRelations, outInvalids, ...rest }) => {
    runScript(() => {
      const outputRelations = outRelations || writeToStdout();
      const outputInvalids = outInvalids || writeToStdout();

      return buildRelationCsv({ outputRelations, outputInvalids }, rest);
    });
  });

cli
  .command("importEtablissements <relationCsv>")
  .description(
    "Créé les comptes des établissements à partir d'un fichier csv des relations avec les colonnes suivantes : 'uai_responsable,email,uai_formateurs'"
  )
  .action(async (relationCsv) => {
    await runScript(() => {
      const input = relationCsv ? createReadStream(relationCsv) : process.stdin;

      return importEtablissements(input);
    });

    logger.warn(
      "[IMPORTANT] Vous pouvez désormais appeler le script cleanEtablissements pour nettoyer la base des entités n'existant pas dans le fichier des relations"
    );
  });

cli
  .command("cleanEtablissements <relationCsv>")
  .description("Supprime les responsables n'apparaissant pas dans le fichier des relations")
  .option("--proceed", "Permet d'applique la suppression", false)
  .action((relationCsv, options) => {
    runScript(() => {
      const input = relationCsv ? createReadStream(relationCsv) : process.stdin;

      return cleanEtablissements(input, options);
    });
  });

// cli
//   .command("importResponsables <relationsCsv> <responsableOverwriteCsv>")
//   .description(
//     "Créé les comptes des responsables à partir du fichier des relations, au format csv, avec les colonnes suivantes : 'siret,email,etablissements'"
//   )
//   .action((relationsCsv, responsableOverwriteCsv) => {
//     runScript(() => {
//       const responsableInput = relationsCsv ? createReadStream(relationsCsv) : null;
//       const responsableOverwriteInput = responsableOverwriteCsv ? createReadStream(responsableOverwriteCsv) : null;

//       // console.log("responsableInput", responsableInput);
//       // console.log("responsableOverwriteInput", responsableOverwriteInput);

//       return importResponsables(responsableInput, responsableOverwriteInput);
//     });
//   });

// cli
//   .command("importEtablissementsResponsables <responsableCsv>")
//   .description(
//     "Créé les comptes des responsables à partir d'un fichier csv avec les colonnes suivantes : 'siret,email,etablissements'"
//   )
//   .action((responsableCsv) => {
//     runScript(() => {
//       const input = responsableCsv ? createReadStream(responsableCsv) : process.stdin;

//       return importEtablissementsResponsables(input);
//     });
//   });

// cli
//   .command("cleanResponsables <responsableCsv>")
//   .description("Supprime les responsables n'apparaissant pas dans le fichier des relations")
//   .option("--proceed", "Permet d'applique la suppression", false)
//   .action((responsableCsv, options) => {
//     runScript(() => {
//       const input = responsableCsv ? createReadStream(responsableCsv) : process.stdin;

//       return cleanResponsables(input, options);
//     });
//   });

// cli
//   .command("importFormateurs <relationsCsv> <formateurOverwriteCsv>")
//   .description(
//     "Créé les comptes des formateurs à partir du fichier des relations <relationsCsv>, au format csv, avec les colonnes suivantes : 'siret,email,etablissements'"
//   )
//   .action((relationsCsv, formateurOverwriteCsv) => {
//     runScript(() => {
//       const formateurInput = relationsCsv ? createReadStream(relationsCsv) : null;
//       const formateurOverwriteInput = formateurOverwriteCsv ? createReadStream(formateurOverwriteCsv) : null;

//       // console.log("formateurInput", formateurInput);
//       // console.log("formateurOverwriteInput", formateurOverwriteInput);

//       return importFormateurs(formateurInput, formateurOverwriteInput);
//     });
//   });

// cli
//   .command("importEtablissementsFormateurs <formateurCsv>")
//   .description(
//     "Créé les comptes des formateurs à partir d'un fichier csv avec les colonnes suivantes : 'siret,email,etablissements'"
//   )
//   .action((formateurCsv) => {
//     runScript(() => {
//       const input = formateurCsv ? createReadStream(formateurCsv) : process.stdin;

//       return importEtablissementsFormateurs(input);
//     });
//   });
// cli
//   .command("cleanFormateurs <formateurCsv>")
//   .description("Supprime les formateurs n'apparaissant pas dans le fichier des relations")
//   .option("--proceed", "Permet d'applique la suppression", false)
//   .action((responsableCsv, options) => {
//     runScript(() => {
//       const input = responsableCsv ? createReadStream(responsableCsv) : process.stdin;

//       return cleanFormateurs(input, options);
//     });
//   });

// cli
//   .command("importRelations <relationsCsv> <responsablesOverwriteCsv> <formateursOverwriteCsv>")
//   .description("Importe les relations")
//   .action((relationsCsv, responsablesOverwriteCsv, formateursOverwriteCsv) => {
//     runScript(() => {
//       const relationsInput = relationsCsv ? createReadStream(relationsCsv) : null;
//       const responsablesOverwriteInput = responsablesOverwriteCsv ? createReadStream(responsablesOverwriteCsv) : null;
//       const formateursOverwriteInput = formateursOverwriteCsv ? createReadStream(formateursOverwriteCsv) : null;

//       return importRelations(relationsInput, responsablesOverwriteInput, formateursOverwriteInput);
//     });
//   });

cli
  .command("importEtablissementsRelations <relationsCsv>")
  .description("Importe les relations entre établissements")
  .action((relationsCsv) => {
    runScript(() => {
      const relationsInput = relationsCsv ? createReadStream(relationsCsv) : null;

      return importEtablissementsRelations(relationsInput);
    });
  });

cli
  .command("importFormations <formationCsv>")
  .description("Importe les formations depuis le fichier transmis par Affelnet")
  .action((formationCsv) => {
    runScript(() => {
      const input = formationCsv ? createReadStream(formationCsv) : null;

      return importFormations(input);
    });
  });

cli
  .command("activateDelegues")
  .description("Active les relations non confirmées et non supprimées pour les délégués")
  .option("--proceed", "Permet d'appliquer l'activation", false)
  .action((options) => {
    runScript(() => {
      return activateDelegues(options);
    });
  });

cli
  .command("sendConfirmationEmails")
  .option("--username <username>", "Permet d'envoyer l'email à un seul CFA")
  .option("--type <type>", "Permet de n'envoyer les emails qu'à un seul type d'utilisateur")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .option("--skip <skip>", "Nombre d'éléments à ignorer en début de liste (défaut: 0)", parseInt)
  .option("--force", "Ignore les règles d'envoi habituelles", false)
  .option("--proceed", "Procède à l'envoi des courriers", false)
  .action((options) => {
    runScript(({ sendEmail, resendEmail }) => {
      return sendConfirmationEmails({ sendEmail, resendEmail }, options);
    });
  });

// cli
//   .command("resendConfirmationEmails")
//   .option("--username <username>", "Permet d'envoyer l'email à un seul CFA")
//   .option("--retry", "Renvoie les emails en erreur", false)
//   .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
//   .option("--max <max>", "Nombre de relances maximum", parseInt)
//   .action((options) => {
//     runScript(({ resendEmail }) => {
//       return resendConfirmationEmails(resendEmail, options);
//     });
//   });

cli
  .command("sendActivationEmails")
  .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
  .option("--type <type>", "Permet de n'envoyer les emails qu'à un seul type d'utilisateur")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .option("--skip <skip>", "Nombre d'éléments à ignorer en début de liste (défaut: 0)", parseInt)
  .option("--force", "Ignore les règles d'envoi habituelles", false)
  .option("--proceed", "Procède à l'envoi des courriers", false)
  .action((options) => {
    runScript(({ sendEmail, resendEmail }) => {
      return sendActivationEmails({ sendEmail, resendEmail }, options);
    });
  });

// cli
//   .command("resendActivationEmails")
//   .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
//   .option("--retry", "Renvoie les emails en erreur", false)
//   .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
//   .option("--max <max>", "Nombre de relances maximum", parseInt)
//   .action((options) => {
//     runScript(({ resendEmail }) => {
//       return resendActivationEmails(resendEmail, options);
//     });
//   });

cli
  .command("sendNotificationEmails")
  .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
  .option("--type <type>", "Permet de n'envoyer les emails qu'à un seul type d'utilisateur")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .option("--skip <skip>", "Nombre d'éléments à ignorer en début de liste (défaut: 0)", parseInt)
  .option("--force", "Ignore les règles d'envoi habituelles", false)
  .option("--proceed", "Procède à l'envoi des courriers", false)
  .action((options) => {
    runScript(({ sendEmail, resendEmail }) => {
      return sendNotificationEmails({ sendEmail, resendEmail }, options);
    });
  });

// cli
//   .command("resendNotificationEmails")
//   .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
//   .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
//   .option("--force", "Ignore les règles d'envoi habituelles")
//   .option("--retry", "Renvoie les emails en erreur", false)
//   .option("--max <max>", "Nombre de relances maximum", parseInt)
//   .action((options) => {
//     runScript(({ resendEmail }) => {
//       return resendNotificationEmails(resendEmail, options);
//     });
//   });

cli
  .command("sendUpdateEmails")
  .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
  .option("--type <type>", "Permet de n'envoyer les emails qu'à un seul type d'utilisateur")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .option("--skip <skip>", "Nombre d'éléments à ignorer en début de liste (défaut: 0)", parseInt)
  .option("--force", "Ignore les règles d'envoi habituelles")
  .option("--force", "Ignore les règles d'envoi habituelles", false)
  .option("--proceed", "Procède à l'envoi des courriers", false)
  .action((options) => {
    runScript(({ sendEmail, resendEmail }) => {
      return sendUpdateEmails({ sendEmail, resendEmail }, options);
    });
  });

// cli
//   .command("resendUpdateEmails")
//   .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
//   .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
//   .option("--force", "Ignore les règles d'envoi habituelles")
//   .option("--retry", "Renvoie les emails en erreur", false)
//   .option("--max <max>", "Nombre de relances maximum", parseInt)
//   .action((options) => {
//     runScript(({ resendEmail }) => {
//       return resendUpdateEmails(resendEmail, options);
//     });
//   });

cli
  .command("importVoeux")
  .description("Importe les voeux depuis le fichier d'extraction des voeux AFFELNET")
  .argument("<file>", "Le fichier CSV contentant les voeux ")
  .argument("[overwriteFile]", "Le fichier CSV écrasant les offres de formation")
  .option("--refresh", "Permet de réimporter le fichier sans ajouter de date d'import", false)
  .action((file, overwriteFile, options) => {
    runScript(async () => {
      const inputFile = file ? createReadStream(file, { encoding: "UTF-8" }) : null;
      const inputOverwriteFile = overwriteFile ? createReadStream(overwriteFile, { encoding: "UTF-8" }) : null;

      let importDate = new Date();
      if (options.refresh) {
        importDate = await getLatestImportDate();
      }

      return importVoeux(inputFile, inputOverwriteFile, { importDate });
    });
  });

cli
  .command("createAdmin")
  .argument("<username>", "Le nom de l'utilisateur")
  .argument("<email>", "Le email de l'utilisateur")
  .action((username, email, academie) => {
    runScript(() => {
      return createAdmin(username, email, academie);
    });
  });

cli
  .command("createAcademie")
  .argument("<username>", "Le nom de l'utilisateur")
  .argument("<email>", "Le email de l'utilisateur")
  .argument("[academie]", "Le code d'une académie ou plusieurs académies séparées par des virgules ex: 01,14")
  .action((username, email, academie) => {
    runScript(() => {
      return createAcademie(username, email, academie);
    });
  });

// cli
//   .command("createCsaio")
//   .argument("<username>", "Le nom de l'utilisateur")
//   .argument("<email>", "Le email de l'utilisateur")
//   .argument("<academies>", "La liste des codes des académies", asArray)
//   .action((username, email, academies) => {
//     runScript(() => {
//       return createCsaio(username, email, academies.map(findAcademieByCode));
//     });
//   });

cli
  .command("confirmResponsable")
  .description("Permet de confirmer manuellement un CFA")
  .arguments("<siret> <email>")
  .option("--force", "Ecrase les données déjà confirmées")
  .action((siret, email, { force }) => {
    runScript(() => {
      return confirm(siret, email, { force });
    });
  });

cli
  .command("unsubscribeUser")
  .arguments("<username>")
  .action((username) => {
    runScript(async ({ users }) => {
      await users.unsubscribe(username);
      logger.info(`User ${username} unsubscribed`);
    });
  });

cli
  .command("exportResponsables")
  .option("--filter <filter>", "Filtre au format json", JSON.parse)
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (défaut: stdout)", createWriteStream)
  .action(({ out, filter }) => {
    runScript(() => {
      const output = out || writeToStdout();

      return exportResponsables(output, { filter });
    });
  });

// cli
//   .command("exportStatutVoeux")
//   .option("--filter <filter>", "Filtre au format json", JSON.parse)
//   .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (défaut: stdout)", createWriteStream)
//   .action(({ out, filter }) => {
//     runScript(() => {
//       const output = out || writeToStdout();

//       return exportStatutVoeux(output, { filter });
//     });
//   });

cli.command("computeStats").action(() => {
  runScript(() => {
    return computeStats();
  });
});

cli
  .command("injectDataset")
  .option("--mef", "Importe les mefs")
  .option("--responsable", "Ajoute un responsable")
  .option("--admin", "Ajoute un administrateur")
  .option("--csaio", "Ajoute un utilisateur csasio et des dossiers du tableau de bord")
  .action((options) => {
    runScript((actions) => {
      return injectDataset(actions, options);
    });
  });

cli
  .command("getFormateurEmails")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (défaut: stdout)", createWriteStream)
  .action(({ out }) => {
    runScript(async () => {
      const output = out || writeToStdout();
      const catalogueApi = new CatalogueApi();

      const getEmailsFormateurFromUai = async (uai) => {
        const result = await catalogueApi.getFormations(
          {
            published: true,
            etablissement_formateur_uai: uai,
          },
          {
            limit: 250,
            select: {
              etablissement_formateur_courriel: 1,
            },
          }
        );

        return [
          ...new Set(
            result.formations?.flatMap((formation) => formation.etablissement_formateur_courriel?.split("##"))
          ),
        ].filter((courriel) => !!courriel);
      };

      return await oleoduc(
        Etablissement.aggregate([
          { $unwind: "$etablissements_formateur" },
          { $project: { uai: "$etablissements_formateur.uai" } },
        ]).cursor(),
        transformData((etablissement) => etablissement.uai),
        transformData(async (uai) => await getEmailsFormateurFromUai(uai)),
        flattenArray(),
        filterData((email) => !!email && email.length),
        transformData(
          async (email) => {
            return {
              email,
            };
          },
          { parallel: 10 }
        ),
        transformIntoCSV(),
        output
      );
    });
  });

cli
  .command("getResponsableEmails")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (défaut: stdout)", createWriteStream)
  .action(({ out }) => {
    runScript(async () => {
      const output = out || writeToStdout();

      // Récupération des adresses emails des CFAs responsables
      // TODO :
      const etablissement_responsable_emails = await Etablissement.distinct("email");

      const source = Readable.from(etablissement_responsable_emails);

      return oleoduc(
        source,

        transformData(
          async (email) => {
            return {
              email,
            };
          },
          { parallel: 10 }
        ),
        transformIntoCSV(),
        output
      );
    });
  });

// cli
//   .command("importDossiers")
//   .option("--file <file>", "Fichier json contenant les dossiers du tableau de bord", createReadStream)
//   .description("Importe les dossiers du tableau de bord")
//   .action(({ file }) => {
//     runScript(() => {
//       return importDossiers({ input: file });
//     });
//   });

// cli
//   .command("importJeunesUniquementEnApprentissage")
//   .argument("<file>", "Le fichier CSV contentant les INE  (default: stdin)")
//   .description("Ajoute une meta pour les jeunes ayant formulés des voeux uniquement en apprentissage")
//   .action((file) => {
//     runScript(() => {
//       const input = file ? createReadStream(file, { encoding: "UTF-8" }) : process.stdin;

//       return importJeunesUniquementEnApprentissage(input);
//     });
//   });

cli
  .command("generateActionToken")
  .arguments("<username>")
  .action((username) => {
    runScript(() => {
      logger.info("Génération d'un token pour l'utilisateur", username);

      const token = createActionToken(username);

      logger.info("Token généré", token);
    });
  });

cli.command("healthcheck").action(() => {
  logger.info("config", config);
});

cli.parse(process.argv);

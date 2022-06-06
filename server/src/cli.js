require("dotenv").config();
const { program: cli } = require("commander");
const { oleoduc, transformData, filterData, transformIntoCSV, writeToStdout, flattenArray } = require("oleoduc");
const { Readable } = require("stream");
const { createReadStream, createWriteStream } = require("fs");
const { runScript } = require("./jobs/utils/runScript");
const logger = require("./common/logger");
const { confirm } = require("./common/actions/confirm");
const importMefs = require("./jobs/importMefs");
const importVoeux = require("./jobs/importVoeux");
const sendConfirmationEmails = require("./jobs/sendConfirmationEmails");
const resendConfirmationEmails = require("./jobs/resendConfirmationEmails");
const sendActivationEmails = require("./jobs/sendActivationEmails");
const resendActivationEmails = require("./jobs/resendActivationEmails");
const sendNotificationEmails = require("./jobs/sendNotificationEmails");
const resendNotificationEmails = require("./jobs/resendNotificationEmails");
const importCfas = require("./jobs/importCfas");
const importUfas = require("./jobs/importUfas");
const computeStats = require("./jobs/computeStats");
const exportCfas = require("./jobs/exportCfas");
const buildCfaCsv = require("./jobs/buildCfaCsv");
const createUser = require("./jobs/createUser");
const { DateTime } = require("luxon");
const migrate = require("./jobs/migrate");
const { injectDataset } = require("../tests/dataset/injectDataset");
const Cfa = require("./common/model/Cfa");
const CatalogueApi = require("./common/api/CatalogueApi");

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
  .command("buildCfaCsv")
  .description("Permet de créer le fichier des CFA à partir de l'offre de formation d'Affelnet")
  .option(
    "--offreDeFormationCsv <offreDeFormationCsv>",
    "Le fichier CSV contentant l'offre de formation Affelnet",
    createReadStream
  )
  .option("--relationsCsv <relationsCsv>", "Le fichier CSV contentant les relations complémentaires", createReadStream)
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action(({ out, ...rest }) => {
    runScript(() => {
      const output = out || writeToStdout();

      return buildCfaCsv(output, rest);
    });
  });

cli
  .command("importCfas <cfaCsv>")
  .description("Créé les comptes des CFA à partir d'un fichier csv avec les colonnes suivantes : 'siret,email'")
  .action((cfaCsv) => {
    runScript(() => {
      const input = cfaCsv ? createReadStream(cfaCsv) : process.stdin;

      return importCfas(input);
    });
  });

cli
  .command("importUfas [<ufaCsv>]")
  .description("Importe les UFA depuis le fichier transmis par Affelnet")
  .action((ufaCsv) => {
    runScript(() => {
      const input = ufaCsv ? createReadStream(ufaCsv) : null;

      return importUfas(input);
    });
  });

cli
  .command("sendConfirmationEmails")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .action((options) => {
    runScript(({ sendEmail }) => {
      return sendConfirmationEmails(sendEmail, options);
    });
  });

cli
  .command("resendConfirmationEmails")
  .option("--username <username>", "Permet d'envoyer l'email à un seul CFA")
  .option("--retry", "Renvoie les emails en erreur", false)
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .option("--max <max>", "Nombre de relances maximum", parseInt)
  .action((options) => {
    runScript(({ resendEmail }) => {
      return resendConfirmationEmails(resendEmail, options);
    });
  });

cli
  .command("importVoeux")
  .description("Importe les voeux depuis le fichier d'extraction des voeux AFFELNET")
  .argument("<file>", "Le fichier CSV contentant les voeux  (default: stdin)")
  .option("--importDate <importDate>", "Permet de définir manuellement (ISO 8601) la date d'import", (value) => {
    const importDate = DateTime.fromISO(value);
    if (!importDate.isValid) {
      throw new Error(`Invalid date ${value}`);
    }
    return importDate.toJSDate();
  })
  .action((file, options) => {
    runScript(async () => {
      const input = file ? createReadStream(file, { encoding: "UTF-8" }) : process.stdin;

      return importVoeux(input, options);
    });
  });

cli
  .command("sendActivationEmails")
  .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .action((options) => {
    runScript(({ sendEmail }) => {
      return sendActivationEmails(sendEmail, options);
    });
  });

cli
  .command("resendActivationEmails")
  .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
  .option("--retry", "Renvoie les emails en erreur", false)
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .option("--max <max>", "Nombre de relances maximum", parseInt)
  .action((options) => {
    runScript(({ resendEmail }) => {
      return resendActivationEmails(resendEmail, options);
    });
  });

cli
  .command("sendNotificationEmails")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .action((options) => {
    runScript(({ sendEmail }) => {
      return sendNotificationEmails(sendEmail, options);
    });
  });

cli
  .command("resendNotificationEmails")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .action((options) => {
    runScript(({ resendEmail }) => {
      return resendNotificationEmails(resendEmail, options);
    });
  });

cli
  .command("createUser")
  .arguments("<username> <email>")
  .option("--admin")
  .action((username, email, options) => {
    runScript(() => {
      return createUser(username, email, options);
    });
  });

cli
  .command("confirmCfa")
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
  .command("exportCfas")
  .option("--filter <filter>", "Filtre au format json", JSON.parse)
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action(({ out, filter }) => {
    runScript(() => {
      const output = out || writeToStdout();

      return exportCfas(output, { filter });
    });
  });

cli.command("computeStats").action(() => {
  runScript(() => {
    return computeStats();
  });
});

cli.command("migrate").action(() => {
  runScript(() => {
    return migrate();
  });
});

cli
  .command("injectDataset")
  .option("--mef", "Import les mefs")
  .option("--admin", "Ajout un administrateur")
  .action((options) => {
    runScript((actions) => {
      return injectDataset(actions, options);
    });
  });

cli
  .command("getFormateurEmails")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
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
        Cfa.aggregate([{ $unwind: "$etablissements" }, { $project: { uai: "$etablissements.uai" } }]).cursor(),
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
  .command("getGestionnaireEmails")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action(({ out }) => {
    runScript(async () => {
      const output = out || writeToStdout();

      // Récupération des adresses emails des CFAs gestionnaires
      const etablissement_gestionnaire_emails = await Cfa.distinct("email");

      const source = Readable.from(etablissement_gestionnaire_emails);

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

cli.parse(process.argv);

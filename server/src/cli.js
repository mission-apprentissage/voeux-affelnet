require("dotenv").config();
const { program: cli } = require("commander");
const { writeToStdout } = require("oleoduc");
const { createReadStream, createWriteStream } = require("fs");
const { runScript } = require("./jobs/utils/jobWrapper");
const logger = require("./common/logger");
const importMefs = require("./jobs/importMefs");
const importVoeux = require("./jobs/importVoeux");
const sendConfirmationEmails = require("./jobs/sendConfirmationEmails");
const resendConfirmationEmails = require("./jobs/resendConfirmationEmails");
const sendActivationEmails = require("./jobs/sendActivationEmails");
const resendActivationEmails = require("./jobs/resendActivationEmails");
const sendNotificationEmails = require("./jobs/sendNotificationEmails");
const resendNotificationEmails = require("./jobs/resendNotificationEmails");
const importCfas = require("./jobs/importCfas");
const computeStats = require("./jobs/computeStats");
const exportCfas = require("./jobs/exportCfas");
const exportCfasInconnus = require("./jobs/exportCfasInconnus");
const createUser = require("./jobs/createUser");
const createCfa = require("./jobs/createCfa");
const { DateTime } = require("luxon");

process.on("unhandledRejection", (e) => console.log(e));
process.on("uncaughtException", (e) => console.log(e));
process.stdout.on("error", function (err) {
  if (err.code === "EPIPE") {
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
});

cli
  .command("importCfas <cfaCsv>")
  .description(
    "Créé les comptes des CFA à partir d'un fichier csv avec les colonnes suivantes :" +
      "'siret,raison_sociale,email_directeur,email_contact'"
  )
  .requiredOption(
    "--relations <relationsCsv>",
    "Le csv contenant la liste des uai d'accueil et leur siret gestionnaire :" + "'UAI,SIRET_UAI_GESTIONNAIRE'",
    createReadStream
  )
  .action((cfaCsv, { relationsCsv }) => {
    runScript(() => {
      let input = cfaCsv ? createReadStream(cfaCsv) : process.stdin;

      return importCfas(input, relationsCsv);
    });
  });

cli
  .command("sendConfirmationEmails")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .action((options) => {
    runScript(({ emails }) => {
      return sendConfirmationEmails(emails, options);
    });
  });

cli
  .command("resendConfirmationEmails")
  .option("--uai <uai>", "Permet d'envoyer l'email à un seul CFA")
  .option("--retry", "Renvoie les emails en erreur", false)
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .option("--max <max>", "Nombre de relances maximum", parseInt)
  .action((options) => {
    runScript(({ emails }) => {
      return resendConfirmationEmails(emails, options);
    });
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
  .command("importVoeux")
  .option("--importDate <importDate>", "Permet de définir manuellement (ISO 8601) la date d'import", (value) => {
    let importDate = DateTime.fromISO(value);
    if (!importDate.isValid) {
      throw new Error(`Invalid date ${value}`);
    }
    return importDate.toJSDate();
  })
  .arguments("<file>")
  .description("Importe les voeux depuis le fichier d'extraction des voeux AFFELNET", {
    file: "Le fichier CSV contentant les voeux  (default: stdin)",
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
    runScript(({ emails }) => {
      return sendActivationEmails(emails, options);
    });
  });

cli
  .command("resendActivationEmails")
  .option("--username <username>", "Permet d'envoyer l'email à un seul utilisateur")
  .option("--retry", "Renvoie les emails en erreur", false)
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .option("--max <max>", "Nombre de relances maximum", parseInt)
  .action((options) => {
    runScript(({ emails }) => {
      return resendActivationEmails(emails, options);
    });
  });

cli
  .command("sendNotificationEmails")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .action((options) => {
    runScript(({ emails }) => {
      return sendNotificationEmails(emails, options);
    });
  });

cli
  .command("resendNotificationEmails")
  .option("--limit <limit>", "Nombre maximum d'emails envoyés (défaut: 0)", parseInt)
  .action((options) => {
    runScript(({ emails }) => {
      return resendNotificationEmails(emails, options);
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
  .command("createCfa")
  .arguments("<username> <email>")
  .description("Permet de créer un CFA sans passer par l'import des CFA")
  .requiredOption("--academie <academie>")
  .option("--raison_sociale <raison_sociale>")
  .option("--siret <siret>")
  .action((username, email, options) => {
    runScript(() => {
      let { academie, ...rest } = options;
      return createCfa(username, email, academie, rest);
    });
  });

cli
  .command("confirmCfa")
  .description("Permet de confirmer manuellement un CFA")
  .arguments("<siret> <email>")
  .option("--force", "Ecrase les données déjà confirmées")
  .action((siret, email, { force }) => {
    runScript(({ cfas }) => {
      return cfas.confirm(siret, email, { force });
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
      let output = out || writeToStdout();

      return exportCfas(output, { filter });
    });
  });

cli
  .command("exportCfasInconnus")
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action(({ out, filter }) => {
    runScript(() => {
      let output = out || writeToStdout();

      return exportCfasInconnus(output, { filter });
    });
  });

cli.command("computeStats").action(() => {
  runScript(() => {
    return computeStats();
  });
});

cli.command("db", "Commande pour manipuler la base de données", { executableFile: "jobs/db/dbCli.js" });

cli.parse(process.argv);

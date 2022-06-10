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
const { exportStatutVoeux } = require("./jobs/exportStatutVoeux");
const createUser = require("./jobs/createUser");
const { DateTime } = require("luxon");
const migrate = require("./jobs/migrate");
const { injectDataset } = require("../tests/dataset/injectDataset");
const TableauDeBordApi = require("./common/api/TableauDeBordApi");
const { Cfa } = require("./common/model");
const { uniq } = require("lodash");
const CatalogueApi = require("./common/api/CatalogueApi.js");
const mongoose = require("mongoose");
const importDossiers = require("./jobs/importDossiers.js");
const exportCroisement = require("./jobs/exportCroisement.js");

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
  .description("Permet de créer le fichier des CFA")
  .option("--affelnet <affelnet>", "Le fichier CSV contentant l'offre de formation Affelnet", createReadStream)
  .option("--relations <relations>", "Le fichier CSV contenant les relations complémentaires", createReadStream)
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
  .option("--retry", "Renvoie les emails en erreur", false)
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

cli
  .command("exportStatutVoeux")
  .option("--filter <filter>", "Filtre au format json", JSON.parse)
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action(({ out, filter }) => {
    runScript(() => {
      const output = out || writeToStdout();

      return exportStatutVoeux(output, { filter });
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

cli
  .command("croisementVoeuxTdb")
  .option("--legacy", "Utilise le format des CFA de 2021", false)
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action((options) => {
    runScript(async () => {
      const tableauDeBordApi = new TableauDeBordApi();
      const output = options.out || writeToStdout();
      const db = mongoose.connection;
      const uaiMapper = {
        //CDVL
        "0451694X": ["0451246K"],
        "0410036S": ["0451708M"],
        "0371211R": ["0451708M"],
        "0180571Y": ["0180571Y"],
        "0371711J": ["0371409F"],
        "0410854F": ["0280944Z"],
        "0410855G": ["0280944Z"],
        "0360686A": ["0280944Z"],
        "0280946B": ["0280944Z"],
        "0280947C": ["0280944Z"],
        "0280942X": ["0280944Z"],
        "0180758B": ["0280944Z"],
        "0411045N": ["0410018X"],
        "0180847Y": ["0180847Y"],
        //H2F
        "0601162M": ["0597090L"],
        "0595846J": ["0595846J"],
        "0602183X": ["0602183X"],
        "0602182W": ["0602182W"],
        "0590189K": ["0596792M"],
        "0590187H": ["0596792M"],
        "0597058B": ["0596792M"],
        "0620011A": ["0624250H", "0596792M"],
        "0622099V": ["0596792M"],
        "0623105N": ["0623105N"],
        "0620131F": ["0596792M"],
        "0620018H": ["0596792M"],
        "0622807P": ["0623465E", "0596792M"],
        "0620192X": ["0596792M"],
        "0622801H": ["0624092L", "0596792M"],
        "0133535X": ["0601613C"],
        "0400786M": ["0601613C"],
        "0942024P": ["0601613C"],
        "0501793C": ["0601613C"],
        "0601575L": ["0595689N"],
        "0711439D": ["0595689N"],
        "0595124Z": ["0595689N"],
        "0593257V": ["0595689N"],
        "0596322B": [],
        "0595689N": ["0595689N"],
        "0595119U": [],
        "0595121W": ["0595121W"],
        "0623276Z": ["0595689N"],
        "0623280D": ["0595689N"],
        "0624473A": ["0593321P"],
        "0021502X": ["0596997K"],
        "0595821G": ["0596997K"],
        "0624373S": [],
        "0624412J": [],
        "0624100V": [],
        "0623631K": ["0596997K"],
        "0623801V": [],
        "0595778K": ["0595778K"],
        "0596791L": ["0596791L"],
        "0597237W": ["0597237W"],
        "0021740F": ["0601500E"],
        "0021796S": ["0601500E"],
        "0601484M": ["0601500E"],
        "0596406T": ["0596406T"],
        "0021923E": [],
        "0022041H": ["0022041H"],
        "0801999N": ["0801999N"],
        "0801997L": ["0801328J"],
        "0596318X": ["0602089V"],
        "0596316V": ["0596316V"],
        "0596328H": ["0596328H"],
        "0596315U": ["0602089V"],
        "0595820F": ["0595771C"],
        "0624184L": [],
        "0624499D": ["0624499D"],
        "0772824B": ["0772824B"],
      };

      const { cfas } = await tableauDeBordApi.getCfas({}, { limit: 10000 });
      const tdb = uniq([...cfas.map((l) => l.uai)]);
      function existsInTableauDeBord(uai) {
        let uais = [uai, ...(uaiMapper[uai] || [])];
        return uais.find((u) => tdb.includes(u));
      }

      const res = await Promise.all([
        db.collection("users").find({ type: "Cfa" }).stream(), //legacy
        Cfa.aggregate([
          { $unwind: "$etablissements" },
          { $project: { uai: "$etablissements.uai", academie: "$academie" } },
        ]).cursor(),
      ]);

      return oleoduc(
        options.legacy ? res[0] : res[1],
        transformData(({ uai, academie }) => {
          return {
            uai,
            Académie: academie.nom,
            "Présent de le tableau de bord": existsInTableauDeBord(uai) ? "Oui" : "Non",
          };
        }),
        transformIntoCSV(),
        output
      );
    });
  });

cli
  .command("importDossiers")
  .argument("<file>", "L'export du tdb")
  .description("Importe les dossiers du tableau de bord")
  .action((file) => {
    runScript(() => {
      const input = file ? createReadStream(file, { encoding: "UTF-8" }) : process.stdin;

      return importDossiers(input);
    });
  });

cli
  .command("exportCroisement")
  .option("--mapping <mapping>", "Le fichier contenant le mapping entre UAI et UAI gestionnaire", createReadStream)
  .option("--out <out>", "Fichier cible dans lequel sera stocké l'export (defaut: stdout)", createWriteStream)
  .action(({ out = writeToStdout(), ...rest }) => {
    runScript(async () => {
      return exportCroisement(out, rest);
    });
  });

cli.parse(process.argv);

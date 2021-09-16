const { program: cli } = require("commander");
const { runScript, question } = require("../utils/jobWrapper");
const migrate = require("./migrate");
const clear = require("./clear");
const injectDataset = require("./injectDataset");

cli
  .command("clear")
  .description("Supprime toutes les données de la base")
  .action(async () => {
    let shouldDelete = await question("Voulez-vous supprimer toutes les données de la base ?");
    if (shouldDelete) {
      runScript(async ({ users }) => {
        return clear(users);
      });
    }
  });

cli
  .command("injectDataset")
  .option("--limit <limit>", "Nombre de voeux")
  .action((options) => {
    runScript(({ emails }) => {
      return injectDataset(emails, options);
    });
  });

cli.command("migrate").action(() => {
  runScript((components) => {
    return migrate(components);
  });
});

cli.parse(process.argv);

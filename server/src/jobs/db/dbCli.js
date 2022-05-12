const { program: cli } = require("commander");
const { runScript } = require("../utils/jobWrapper");
const migrate = require("./migrate");
const injectDataset = require("./injectDataset");

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

const { program: cli } = require("commander");
const { runScript } = require("../utils/runScript");
const migrate = require("./migrate");
const { injectDataset } = require("./injectDataset");

cli
  .command("injectDataset")
  .option("--limit <limit>", "Nombre de voeux")
  .action((options) => {
    runScript(({ sendEmail }) => {
      return injectDataset(sendEmail, options);
    });
  });

cli.command("migrate").action(() => {
  runScript(() => {
    return migrate();
  });
});

cli.parse(process.argv);

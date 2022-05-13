const { program: cli } = require("commander");
const { runScript } = require("../utils/runScript");
const migrate = require("./migrate");
const { injectDataset } = require("./injectDataset");

cli.command("injectDataset").action(() => {
  runScript(({ sendEmail }) => {
    return injectDataset(sendEmail);
  });
});

cli.command("migrate").action(() => {
  runScript(() => {
    return migrate();
  });
});

cli.parse(process.argv);

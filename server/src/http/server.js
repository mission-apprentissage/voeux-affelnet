const express = require("express");
const bodyParser = require("body-parser");
const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");

module.exports = async (components) => {
  const app = express();

  app.use(bodyParser.json());
  app.use(logMiddleware());
  app.use(require("./routes/loginRoutes")(components));
  app.use(require("./routes/activationRoutes")(components));
  app.use(require("./routes/cfas/confirmationRoutes")(components));
  app.use(require("./routes/cfas/fichiersRoutes")(components));
  app.use(require("./routes/passwordRoutes")(components));
  app.use(require("./routes/emailsRoutes")(components));
  app.use(require("./routes/healthcheckRoutes")(components));
  app.use(require("./routes/statsRoutes")(components));
  app.use(require("./routes/adminRoutes")(components));

  app.use(errorMiddleware());
  app.use((req, res) => {
    res.status(404);
    res.json({});
  });

  return app;
};

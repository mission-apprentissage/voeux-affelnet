const express = require("express");
const bodyParser = require("body-parser");
const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const passport = require("passport");

module.exports = async (actions) => {
  const app = express();

  app.use(bodyParser.json());
  app.use(logMiddleware());
  app.use(passport.initialize());
  app.use(require("./routes/loginRoutes")(actions));
  app.use(require("./routes/activationRoutes")(actions));
  app.use(require("./routes/confirmationRoutes")(actions));
  app.use(require("./routes/gestionnairesRoutes.js")(actions));
  app.use(require("./routes/formateursRoutes.js")(actions));
  app.use(require("./routes/csaioRoutes.js")(actions));
  app.use(require("./routes/passwordRoutes")(actions));
  app.use(require("./routes/emailsRoutes")(actions));
  app.use(require("./routes/healthcheckRoutes")(actions));
  app.use(require("./routes/relationRoutes")(actions));
  app.use(require("./routes/statsRoutes")(actions));
  app.use(require("./routes/adminRoutes")(actions));

  app.use(errorMiddleware());
  app.use((req, res) => {
    res.status(404);
    res.json({});
  });

  return app;
};

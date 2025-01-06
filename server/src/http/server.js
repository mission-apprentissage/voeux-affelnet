const express = require("express");
const compression = require("compression");
const bodyParser = require("body-parser");
const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
// const corsMiddleware = require("./middlewares/corsMiddleware");
const passport = require("passport");

module.exports = async (actions) => {
  const app = express();

  app.use(compression());
  app.use(bodyParser.json());
  app.use(logMiddleware());
  // app.use(corsMiddleware());
  app.use(passport.initialize());
  app.use(require("./routes/loginRoutes")(actions));
  app.use(require("./routes/activationRoutes")(actions));
  app.use(require("./routes/confirmationRoutes")(actions));
  app.use(require("./routes/responsablesRoutes.js")(actions));
  app.use(require("./routes/deleguesRoutes.js")(actions));
  // app.use(require("./routes/csaioRoutes.js")(actions));
  app.use(require("./routes/passwordRoutes")(actions));
  app.use(require("./routes/emailsRoutes")(actions));
  app.use(require("./routes/healthcheckRoutes")(actions));
  // app.use(require("./routes/relationRoutes.js.DEPRECATED")(actions));
  app.use(require("./routes/statsRoutes")(actions));
  app.use(require("./routes/alertRoutes")(actions));
  app.use(require("./routes/adminRoutes")(actions));
  app.use(require("./routes/constantRoutes")(actions));

  app.use(errorMiddleware());
  app.use((req, res) => {
    res.status(404);
    res.json({});
  });

  return app;
};

const express = require("express");
const config = require("../../config");
const passport = require("passport");
const Joi = require("@hapi/joi");
const Boom = require("boom");
const { unsubscribe } = require("../../common/users");
const { Strategy: LocalAPIKeyStrategy } = require("passport-localapikey");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { sendHTML } = require("../utils/httpUtils");

function checkWebhookKey() {
  passport.use(
    new LocalAPIKeyStrategy(
      {
        apiKeyField: "webhookKey",
      },
      async (apiKey, done) => {
        return done(null, config.smtp.webhookKey === apiKey ? { apiKey } : false);
      }
    )
  );

  return passport.authenticate("localapikey", { session: false, failWithError: true });
}

module.exports = ({ sender }) => {
  const router = express.Router(); // eslint-disable-line new-cap

  async function checkEmailToken(req, res, next) {
    let { token } = req.params;
    if (!(await sender.exists(token))) {
      return next(Boom.notFound());
    }

    next();
  }

  router.get(
    "/api/emails/:token/preview",
    checkEmailToken,
    tryCatch(async (req, res) => {
      let { token } = req.params;

      let html = await sender.render(token);

      return sendHTML(html, res);
    })
  );

  router.get(
    "/api/emails/:token/markAsOpened",
    tryCatch(async (req, res) => {
      let { token } = req.params;

      sender.markAsOpened(token);

      res.writeHead(200, { "Content-Type": "image/gif" });
      res.end(Buffer.from("R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64"), "binary");
    })
  );

  router.post(
    "/api/emails/webhook",
    checkWebhookKey(),
    tryCatch(async (req, res) => {
      let parameters = await Joi.object({
        event: Joi.string().required(), //https://developers.sendinblue.com/docs/transactional-webhooks
        "message-id": Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.body, { abortEarly: false });

      if (parameters.event === "delivered") {
        sender.markAsDelivered(parameters["message-id"]);
      } else {
        sender.markAsFailed(parameters["message-id"], parameters.event);
      }

      return res.json({});
    })
  );

  router.get(
    "/api/emails/:token/unsubscribe",
    checkEmailToken,
    tryCatch(async (req, res) => {
      let { token } = req.params;

      await unsubscribe(token);

      res.set("Content-Type", "text/html");
      res.send(
        Buffer.from(`<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Désinscription</title>
    </head>
    <body>
        <div class="sib-container rounded ui-sortable" style="position: relative; max-width: 540px; margin: 0px auto; text-align: left; background: rgb(252, 252, 252); padding: 40px 20px 20px; line-height: 150%; border-radius: 4px; border-width: 0px !important; border-color: transparent !important;">
            <div class="header" style="padding: 0px 20px;">
                <h1 class="title editable" data-editfield="newsletter_name" contenteditable="true" style="font-weight: normal; text-align: center; font-size: 25px; margin-bottom: 5px; padding: 0px; margin-top: 0px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: rgb(35, 35, 35);">Désinscription</h1>
            </div>
             <div class="innercontainer rounded2 email-wrapper" style="border-radius: 10px; padding: 10px; background: rgb(241, 241, 241);">
                <div class="description editable" data-editfield="newsletter_description" contenteditable="true" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: rgb(52, 52, 52); padding: 0px 20px 15px; text-align: center">Vous êtes désinscrit.</div>
            </div>
        </div>

    </body>
</html>
`)
      );
    })
  );

  return router;
};

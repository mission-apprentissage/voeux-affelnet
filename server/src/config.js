const env = require("env-var");

module.exports = {
  env: env.get("VOEUX_AFFELNET_ENV").default("local").asString(),
  publicUrl: env.get("VOEUX_AFFELNET_PUBLIC_URL").default("http://localhost").asString(),
  mongodb: {
    uri: env
      .get("VOEUX_AFFELNET_MONGODB_URI")
      .default("mongodb://127.0.0.1:27017/voeux_affelnet?retryWrites=true&w=majority")
      .asString(),
  },
  auth: {
    passwordHashRounds: env.get("VOEUX_AFFELNET_AUTH_PASSWORD_HASH_ROUNDS").default(1001).asInt(),
    apiToken: {
      jwtSecret: env.get("VOEUX_AFFELNET_AUTH_API_TOKEN_JWT_SECRET").default("1234").asString(),
      expiresIn: "24h",
    },
    actionToken: {
      jwtSecret: env.get("VOEUX_AFFELNET_AUTH_ACTION_TOKEN_JWT_SECRET").default("45678").asString(),
      expiresIn: "90 days",
    },
    resetPasswordToken: {
      jwtSecret: env.get("VOEUX_AFFELNET_AUTH_RESET_PASSWORD_TOKEN_JWT_SECRET").default("91011").asString(),
      expiresIn: "1h",
    },
  },
  log: {
    level: env.get("VOEUX_AFFELNET_LOG_LEVEL").default("info").asString(),
    format: env.get("VOEUX_AFFELNET_LOG_FORMAT").default("pretty").asString(),
    destinations: env.get("VOEUX_AFFELNET_LOG_DESTINATIONS").default("stdout").asString(),
  },
  catalog: {
    endpoint: env
      .get("VOEUX_AFFELNET_CATALOGUE_ENDPOINT")
      .default("https://catalogue.apprentissage.education.gouv.fr/api")
      .asString(),
    username: env.get("VOEUX_AFFELNET_CATALOGUE_USERNAME").asString(),
    password: env.get("VOEUX_AFFELNET_CATALOGUE_PASSWORD").asString(),
  },
  tableauDeBord: {
    username: env.get("VOEUX_AFFELNET_TDB_USERNAME").asString(),
    password: env.get("VOEUX_AFFELNET_TDB_PASSWORD").asString(),
  },
  slackWebhookUrl: env.get("VOEUX_AFFELNET_SLACK_WEBHOOK_URL").asString(),
  outputDir: env.get("VOEUX_AFFELNET_OUTPUT_DIR").default(".local/output").asString(),
  smtp: {
    host: env.get("VOEUX_AFFELNET_SMTP_HOST").default("localhost").asString(),
    port: env.get("VOEUX_AFFELNET_SMTP_PORT").default("1025").asString(),
    secure: env.get("VOEUX_AFFELNET_SMTP_SECURE").default("false").asBoolStrict(),
    webhookKey: env.get("VOEUX_AFFELNET_SMTP_WEBHOOK_KEY").default("1234").asString(),
    auth: {
      user: env.get("VOEUX_AFFELNET_SMTP_AUTH_USER").asString(),
      pass: env.get("VOEUX_AFFELNET_SMTP_AUTH_PASS").asString(),
    },
  },
  sentry: {
    dsn: env.get("VOEUX_AFFELNET_SENTRY_DSN").asString(),
  },
  ovh: {
    storage: {
      uri: env.get("VOEUX_AFFELNET_OVH_STORAGE_URI").asString(),
      storageName: env.get("VOEUX_AFFELNET_OVH_STORAGE_NAME").default("mna-voeux-affelnet").asString(),
    },
  },
};

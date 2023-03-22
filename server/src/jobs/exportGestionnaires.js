const { Gestionnaire } = require("../common/model");
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { encodeStream } = require("iconv-lite");
const { ouiNon, date } = require("../common/utils/csvUtils.js");

const errorMapper = {
  blocked: "Spam",
  complaint: "Plainte",
  fatal: "Erreur technique ou email invalide",
  hard_bounce: "Boîte mail inopérante",
  invalid_email: "Email invalide",
  soft_bounce: "Boîte mail pleine",
  unsubscribe: "Désinscrit",
};

const lastSentEmail = (data) => {
  const emails = data.emails
    ?.map((email) => ({
      ...email,
      templateName: email.templateName,
      lastSentDate: email.sendDates[email.sendDates.length - 1],
    }))
    .sort((a, b) => a.lastSentDate - b.lastSentDate);
  return emails[data.emails.length - 1];
};

async function exportGestionnaires(output, options = {}) {
  const columns = options.columns || {};
  await oleoduc(
    Gestionnaire.find(options.filter || {}).cursor(),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        siret: (data) => data.siret,
        etablissements: (data) => data.etablissements.map((etablissement) => etablissement.uai).join(", "),
        raison_sociale: (data) => data.raison_sociale,
        academie: (data) => data.academie?.nom,
        email: (data) => data.email,
        erreur: (data) => {
          const error = data.unsubscribe ? "unsubscribe" : data.emails.find((e) => e.error)?.error?.type;
          return errorMapper[error];
        },
        voeux: (data) => ouiNon(data.etablissements.find((e) => e.voeux_date)),
        dernier_email: (data) => lastSentEmail(data)?.templateName,
        dernier_email_date: (data) => date(lastSentEmail(data)?.lastSentDate),
        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = exportGestionnaires;

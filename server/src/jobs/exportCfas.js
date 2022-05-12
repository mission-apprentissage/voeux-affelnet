const { Cfa } = require("../common/model");
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { encodeStream } = require("iconv-lite");

const errorMapper = {
  blocked: "Spam",
  complaint: "Plainte",
  fatal: "Erreur technique ou email invalide",
  hard_bounce: "Boîte mail inopérante",
  invalid_email: "Email invalide",
  soft_bounce: "Boîte mail pleine",
  unsubscribe: "Désinscrit",
};

async function exportCfas(output, options = {}) {
  let columns = options.columns || {};
  await oleoduc(
    Cfa.find(options.filter || {}).cursor(),
    transformIntoCSV({
      mapper: (v) => `"${v || ""}"`,
      columns: {
        siret: (data) => data.siret,
        raison_sociale: (data) => data.raison_sociale,
        academie: (data) => data.academie?.nom,
        email: (data) => data.email,
        erreur: (data) => {
          let error = data.unsubscribe ? "unsubscribe" : data.emails.find((e) => e.error)?.error?.type;
          return errorMapper[error];
        },
        voeux: (data) => (data.voeux_date ? "Oui" : "Non"),
        ...columns,
      },
    }),
    encodeStream("UTF-8"),
    output
  );
}

module.exports = exportCfas;

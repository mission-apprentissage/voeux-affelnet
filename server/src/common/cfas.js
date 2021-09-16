const Boom = require("boom");
const { oleoduc, transformData, transformIntoCSV } = require("oleoduc");
const { Voeu, Cfa } = require("./model");

module.exports = () => {
  return {
    async confirm(uai, email, options = {}) {
      let cfa = await Cfa.findOne({ uai });

      if (!email || (!options.force && cfa.statut !== "en attente")) {
        throw Boom.badRequest(`Une confirmation a déjà été enregistrée pour le cfa ${uai}`);
      }

      return Cfa.findOneAndUpdate(
        { uai },
        {
          $set: {
            statut: "confirmé",
            email,
          },
          ...(cfa.email !== email ? { $addToSet: { contacts: cfa.email } } : {}),
        },
        { new: true }
      ).lean();
    },
    async changeEmail(uai, newEmail) {
      return Cfa.findOneAndUpdate(
        { uai },
        {
          $set: {
            email: newEmail,
          },
        },
        { new: true }
      ).lean();
    },
    async markAsNonConcerne(uai) {
      return Cfa.findOneAndUpdate(
        { uai },
        {
          $set: {
            statut: "non concerné",
          },
        },
        { new: true }
      ).lean();
    },
    async cancelUnsubscription(uai) {
      return Cfa.findOneAndUpdate(
        { uai },
        {
          $set: {
            unsubscribe: false,
          },
        },
        { new: true }
      ).lean();
    },
    voeuxCsvStream(uai) {
      return oleoduc(
        Voeu.find({ "etablissement_accueil.uai": uai }).lean().cursor(),
        transformData((voeu) => {
          return {
            INE_APPRENANT: voeu.apprenant.ine,
            NOM_APPRENANT: voeu.apprenant.nom,
            PRENOM_APPRENANT: voeu.apprenant.prenom,
            ADRESSE1_APPR: voeu.apprenant.adresse.ligne_1,
            ADRESSE2_APPR: voeu.apprenant.adresse.ligne_2,
            ADRESSE3_APPR: voeu.apprenant.adresse.ligne_3,
            ADRESSE4_APPR: voeu.apprenant.adresse.ligne_4,
            CP_APPR: voeu.apprenant.adresse.code_postal,
            VILLE_APPR: voeu.apprenant.adresse.ville,
            ID_PAYS: voeu.apprenant.adresse.pays,
            TEL1_APPR: voeu.apprenant.telephone_personnel,
            TEL2_APPR: voeu.apprenant.telephone_portable,
            NOM_REP_LEGAL: voeu.apprenant.nom,
            TEL1_REP_LEGAL: voeu.responsable?.telephone_1,
            TEL2_REP_LEGAL: voeu.responsable?.telephone_2,
            EMAIL1_REP_LEGAL: voeu.responsable?.email_1,
            EMAIL2_REP_LEGAL: voeu.responsable?.email_2,
            ID_FORMATION_SOUHAIT1: voeu.formation.code_formation_diplome,
            LIBELLE_FORMATION_SOUHAIT1: voeu.formation.libelle,
            CODE_MEF_10_FORMATION_SOUHAIT1: voeu.formation.mef,
            ID_ETABLISSEMENT_ORIGINE: voeu.etablissement_origine?.uai,
            NOM_ETAB_ORIGINE: voeu.etablissement_origine?.nom,
          };
        }),
        transformIntoCSV({ mapper: (v) => `"${v || ""}"` }),
        { promisify: false }
      );
    },
    markVoeuxAsDownloaded(uai, options = {}) {
      return Cfa.updateOne(
        { uai },
        {
          $push: {
            voeux_telechargements: {
              $each: [{ date: new Date(), ...options }],
              $slice: 100,
            },
          },
        }
      ).exec();
    },
  };
};

const { USER_STATUS } = require("../src/common/constants/UserStatus");
const { USER_TYPE } = require("../src/common/constants/UserType");

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db) {
    // Suppression des données de la campagne précédente
    await db.collection("formations").deleteMany({});
    await db.collection("logs").deleteMany({});
    await db.collection("voeux").deleteMany({});
    await db.collection("relations").deleteMany({});

    // Mise à jour des utilisateurs admin vers le nouveau modèle.
    await db.collection("users").updateMany({ type: { $exists: false } }, { $set: { type: USER_TYPE.ADMIN } });
    await db.collection("users").updateMany({}, { $unset: { isAdmin: "" } });

    // Suppression des emails envoyés à la campagne précédente.
    await db.collection("users").updateMany({}, { $set: { emails: [] } });

    // Suppression des entrées d'historique de la campagne précédente.
    await db.collection("users").updateMany({}, { $set: { histories: [] } });
    // await db.collection("relations").deleteMany({}); // DONE during importEtablissementRelations

    // Mise à jour des utilisateurs responsable vers le nouveau modèle.
    await db.collection("users").updateMany({ type: "Responsable" }, { $set: { type: USER_TYPE.ETABLISSEMENT } });
    await db
      .collection("users")
      .updateMany(
        { type: USER_TYPE.ETABLISSEMENT },
        { $set: { statut: USER_STATUS.EN_ATTENTE }, $unset: { password: 1 } }
      );

    // Suppression des formateurs
    await db.collection("users").deleteMany({ type: "Formateur" });

    // Réinitialisation de l'activation des comptes délégués
    await db
      .collection("users")
      .updateMany({ type: USER_TYPE.DELEGUE }, { $set: { statut: USER_STATUS.CONFIRME }, $unset: { password: 1 } });

    // Suppression des délégations désactivées.
    await db.collection("users").updateMany(
      { type: USER_TYPE.DELEGUE, relations: { $elemMatch: { active: false } } },
      {
        $pull: {
          relations: { active: false },
        },
      }
    );

    // Désactivation des délégations de la campagne précédente.
    await db.collection("users").updateMany(
      { type: USER_TYPE.DELEGUE, "relations.0": { $exists: true } },
      {
        $set: {
          "relations.$[].active": false,
        },
      }
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down() {},
};

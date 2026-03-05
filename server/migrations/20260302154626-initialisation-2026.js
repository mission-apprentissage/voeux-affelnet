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

    // Réinitialisation des relations entre établissements
    await db.collection("relations").updateMany(
      {},
      {
        $set: {
          nombre_voeux: 0,
          nombre_voeux_restant: 0,
          first_date_voeux: null,
          last_date_voeux: null,
          voeux_telechargements: [],
          "histories.$[].old": true,
        },
      }
    );

    // Réinitialisation de la confirmation des comptes responsables
    await db
      .collection("users")
      .updateMany(
        { type: USER_TYPE.ETABLISSEMENT },
        { $set: { statut: USER_STATUS.EN_ATTENTE, emails: [], "histories.$[].old": true }, $unset: { password: 1 } }
      );

    // Réinitialisation de l'activation des comptes délégués
    await db
      .collection("users")
      .updateMany(
        { type: USER_TYPE.DELEGUE },
        { $set: { statut: USER_STATUS.CONFIRME, emails: [], "histories.$[].old": true }, $unset: { password: 1 } }
      );

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

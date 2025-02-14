const assert = require("assert");
// const { DateTime } = require("luxon");
const { Etablissement } = require("../../src/common/model");
// const { date } = require("../../src/common/utils/csvUtils.js");
const { fakerFR: faker } = require("@faker-js/faker");

const { insertEtablissement, insertRelation, insertDelegue /*, insertVoeu, insertLog*/ } = require("../utils/fakeData");
const { startServer } = require("../utils/testUtils");
const { omit } = require("lodash");

describe("adminRoutes", () => {
  it("Vérifie qu'on peut obtenir la liste des établissements responsables", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    const responsable = await insertEtablissement();

    const formateur = await insertEtablissement();

    await insertRelation({
      responsable,
      formateur,
    });

    const response = await httpClient.get("/api/admin/etablissements?type=Responsable", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.etablissements.length, 1);
    assert.strictEqual(response.data.etablissements[0].siret, responsable.siret);
  });

  it("Vérifie qu'on peut obtenir la liste des établissements formateurs", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    const responsable = await insertEtablissement();

    const formateur1 = await insertEtablissement();
    const formateur2 = await insertEtablissement();

    await insertRelation({
      responsable,
      formateur: formateur1,
    });

    await insertRelation({
      responsable,
      formateur: formateur2,
    });

    const response = await httpClient.get("/api/admin/etablissements?type=Formateur", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.etablissements.length, 2);
    assert.strictEqual(response.data.etablissements[0].siret, formateur1.siret);
    assert.strictEqual(response.data.etablissements[1].siret, formateur2.siret);
  });

  it("Vérifie qu'on peut obtenir la liste des établissements responsable-formateurs", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    const responsable1 = await insertEtablissement();
    const responsable2 = await insertEtablissement();

    const formateur1 = responsable1;
    const formateur2 = await insertEtablissement();

    await insertRelation({
      responsable: responsable1,
      formateur: formateur1,
    });

    await insertRelation({
      responsable: responsable1,
      formateur: formateur2,
    });

    await insertRelation({
      responsable: responsable2,
      formateur: formateur1,
    });

    const response = await httpClient.get("/api/admin/etablissements?type=Responsable-Formateur", {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.etablissements.length, 1);
    assert.strictEqual(response.data.etablissements[0].siret, responsable1.siret);
    assert.strictEqual(response.data.etablissements[0].siret, formateur1.siret);
  });

  it("Vérifie qu'on peut obtenir la liste paginée des établissements", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });

    const total = faker.number.int({ min: 30, max: 130 });
    const items_par_page = faker.number.int({ min: 5, max: 25 });
    const page = faker.number.int({ min: 1, max: ~~(total / items_par_page) });

    console.log({ total, items_par_page, page });

    for (let i = 0; i < total; i++) {
      await insertEtablissement();
    }

    const response = await httpClient.get(
      `/api/admin/etablissements?page=${page}&items_par_page=${items_par_page}&sort=${JSON.stringify({ siret: 1 })}`,
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.etablissements.length, items_par_page);
    assert.strictEqual(response.data.pagination.total, total);
    assert.strictEqual(response.data.pagination.items_par_page, items_par_page);
    assert.strictEqual(response.data.pagination.page, page);
    assert.strictEqual(
      response.data.pagination.nombre_de_page,
      total % items_par_page ? ~~(total / items_par_page) + 1 : ~~(total / items_par_page)
    );
  });

  it("Vérifie qu'on peut filtrer les établissements > filtrage par siret ", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });

    const etablissement1 = await insertEtablissement();
    const etablissement2 = await insertEtablissement();
    const etablissement3 = await insertEtablissement();

    await insertRelation({
      responsable: etablissement1,
      formateur: etablissement2,
    });

    await insertRelation({
      responsable: etablissement2,
      formateur: etablissement3,
    });

    const response = await httpClient.get(
      `/api/admin/etablissements?text=${encodeURIComponent(etablissement1.siret)}`,
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.etablissements.length, 2);
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement1.email),
      true
    );
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement2.email),
      true
    );
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement3.email),
      false
    );
  });

  it("Vérifie qu'on peut filtrer les établissements > filtrage par adresse courriel ", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });

    const etablissement1 = await insertEtablissement();
    const etablissement2 = await insertEtablissement();
    const etablissement3 = await insertEtablissement();

    await insertRelation({
      responsable: etablissement1,
      formateur: etablissement2,
    });

    await insertRelation({
      responsable: etablissement2,
      formateur: etablissement3,
    });

    const response = await httpClient.get(
      `/api/admin/etablissements?text=${encodeURIComponent(etablissement1.email)}`,
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.etablissements.length, 2);
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement1.email),
      true
    );
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement2.email),
      true
    );
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement3.email),
      false
    );
  });

  it("Vérifie qu'on peut retrouver des établissements à partir d'un délégué", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });

    const etablissement1 = await insertEtablissement();
    const etablissement2 = await insertEtablissement();
    const etablissement3 = await insertEtablissement();

    const relation = await insertRelation({
      responsable: etablissement1,
      formateur: etablissement2,
    });

    const delegue = await insertDelegue({
      relations: [{ ...relation, active: true }],
    });

    const response = await httpClient.get(`/api/admin/etablissements?text=${encodeURIComponent(delegue.email)}`, {
      headers: {
        ...auth,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.etablissements.length, 2);
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement1.email),
      true
    );
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement2.email),
      true
    );
    assert.strictEqual(
      !!response.data.etablissements.find((etablissement) => etablissement.email == etablissement3.email),
      false
    );
  });

  //   xit("Vérifie qu'on peut exporter les responsables injoinables", async () => {
  //     const { httpClient, createAndLogUser } = await startServer();
  //     const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
  //     const sendDate = new Date();
  //     await insertResponsable({
  //       siret: "11111111100015",
  //       raison_sociale: "Organisme de formation",
  //       email: "test@apprentissage.beta.gouv.fr",
  //       emails: [
  //         {
  //           token: "TOKEN1",
  //           templateName: "activation_user",
  //           to: "test@apprentissage.beta.gouv.fr",
  //           sendDates: [sendDate],
  //           error: {
  //             type: "fatal",
  //             message: "Impossible d'envoyer l'email",
  //           },
  //         },
  //       ],
  //     });

  //     const response = await httpClient.get("/api/admin/fichiers/injoinables.csv", {
  //       headers: {
  //         ...auth,
  //       },
  //     });

  //     assert.strictEqual(response.status, 200);
  //     assert.strictEqual(
  //       response.data,
  //       `"siret";"formateurs";"raison_sociale";"academie";"email";"erreur";"voeux";"dernier_email";"dernier_email_date"
  // "11111111100015";"";"Organisme de formation";"Paris";"test@apprentissage.beta.gouv.fr";"Erreur technique ou email invalide";"Non";"activation_user";"${date(
  //         sendDate
  //       )}"
  // `
  //     );
  //   });

  //   xit("Vérifie qu'on peut exporter les responsables à relancer", async () => {
  //     const { httpClient, createAndLogUser } = await startServer();
  //     const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
  //     await insertResponsable({
  //       siret: "11111111100015",
  //       raison_sociale: "Organisme de formation",
  //       email: "test@apprentissage.beta.gouv.fr",
  //       statut: "en attente",
  //       emails: [
  //         {
  //           token: "token1",
  //           templateName: "confirmation",
  //           sendDates: ["2023-05-13T16:20:39.495Z", "2023-05-14T16:20:39.495Z"],
  //         },
  //         {
  //           token: "token2",
  //           templateName: "activation_responsable",
  //           sendDates: ["2023-05-16T16:20:39.495Z", "2023-05-18T16:20:39.495Z"],
  //         },
  //       ],
  //       formateurs: [{ siret: "0751234J", voeux_date: new Date() }],
  //     });
  //     await insertVoeu({
  //       etablissement_accueil: {
  //         siret: "0751234J",
  //       },
  //     });

  //     const response = await httpClient.get("/api/admin/fichiers/relances.csv", {
  //       headers: {
  //         ...auth,
  //       },
  //     });

  //     assert.strictEqual(response.status, 200);
  //     assert.strictEqual(
  //       response.data,
  //       `"siret";"formateurs";"raison_sociale";"academie";"email";"erreur";"voeux";"dernier_email";"dernier_email_date";"statut";"nb_voeux"
  // "11111111100015";"0751234J";"Organisme de formation";"Paris";"test@apprentissage.beta.gouv.fr";"";"Oui";"activation_responsable";"${date(
  //         new Date("2023-05-18T16:20:39.495Z")
  //       )}";"en attente";"1"
  // `
  //     );
  //   });

  //   xit("Vérifie qu'on peut exporter les établissements inconnus", async () => {
  //     const { httpClient, createAndLogUser } = await startServer();
  //     const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
  //     await insertVoeu({
  //       etablissement_accueil: {
  //         siret: "0751234J",
  //         nom: "Organisme de formation",
  //         ville: "Paris",
  //       },
  //     });

  //     const response = await httpClient.get("/api/admin/fichiers/inconnus.csv", {
  //       headers: {
  //         ...auth,
  //       },
  //     });

  //     assert.strictEqual(response.status, 200);
  //     assert.strictEqual(
  //       response.data,
  //       `"siret";"nom";"ville";"academie"
  // "0751234J";"Organisme de formation";"Paris";"Paris"
  // `
  //     );
  //   });

  //   xit("Vérifie qu'il faut être admin pour exporter", async () => {
  //     const { httpClient, createAndLogUser } = await startServer();
  //     const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

  //     const response = await httpClient.get("/api/admin/fichiers/injoinables.csv", {
  //       headers: {
  //         ...auth,
  //       },
  //     });

  //     assert.strictEqual(response.status, 403);
  //     assert.deepStrictEqual(response.data, {
  //       error: "Forbidden",
  //       message: "Forbidden",
  //       statusCode: 403,
  //     });
  //   });

  //   xit("Vérifie qu'on peut exporter le statut des téléchargements des voeux", async () => {
  //     const { httpClient, createAndLogUser } = await startServer();
  //     const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
  //     await insertResponsable({
  //       siret: "11111111100015",
  //       raison_sociale: "Organisme de formation",
  //       email: "test@apprentissage.beta.gouv.fr",
  //       statut: "activé",
  //       formateurs: [
  //         { siret: "1234567A", voeux_date: DateTime.fromISO("2023-06-15T00:00:00.000Z") },
  //         { siret: "1234567B", voeux_date: DateTime.fromISO("2023-06-10T00:00:00.000Z") },
  //         { siret: "1234567C" },
  //       ],
  //       voeux_telechargements: [
  //         {
  //           siret: "1234567A",
  //           date: DateTime.fromISO("2023-06-05T00:00:00.000Z").plus({ hours: 12 }),
  //         },
  //         {
  //           siret: "1234567A",
  //           date: DateTime.fromISO("2023-06-05T00:00:00.000Z").plus({ days: 1 }),
  //         },
  //         {
  //           siret: "1234567B",
  //           date: DateTime.fromISO("2023-06-15T00:00:00.000Z").plus({ days: 1 }),
  //         },
  //       ],
  //     });
  //     await insertVoeu({
  //       etablissement_accueil: {
  //         siret: "1234567A",
  //       },
  //       _meta: {
  //         import_dates: [DateTime.fromISO("2023-06-05T00:00:00.000Z"), DateTime.fromISO("2023-06-15T00:00:00.000Z")],
  //       },
  //     });
  //     await insertVoeu({
  //       etablissement_accueil: {
  //         siret: "1234567A",
  //       },
  //       _meta: {
  //         import_dates: [DateTime.fromISO("2023-06-05T00:00:00.000Z")],
  //       },
  //     });
  //     await insertVoeu({
  //       etablissement_accueil: {
  //         siret: "1234567A",
  //       },
  //       _meta: {
  //         import_dates: [DateTime.fromISO("2023-06-10T00:00:00.000Z"), DateTime.fromISO("2023-06-15T00:00:00.000Z")],
  //       },
  //     });

  //     await insertVoeu({
  //       etablissement_accueil: {
  //         siret: "1234567B",
  //       },
  //       _meta: {
  //         import_dates: [DateTime.fromISO("2023-06-10T00:00:00.000Z")],
  //       },
  //     });
  //     await insertVoeu({
  //       etablissement_accueil: {
  //         siret: "1234567B",
  //       },
  //       _meta: {
  //         import_dates: [DateTime.fromISO("2023-06-10T00:00:00.000Z")],
  //       },
  //     });

  //     const response = await httpClient.get("/api/admin/fichiers/statut-voeux.csv", {
  //       headers: {
  //         ...auth,
  //       },
  //     });

  //     assert.strictEqual(response.status, 200);
  //     assert.strictEqual(
  //       response.data,
  //       `"Académie";"Siret de l’organisme responsable";"Raison sociale de l’organisme responsable";"Email de contact de l’organisme responsable";"siret";"Raison sociale de l’établissement d’accueil";"Type de l'établissement d'accueil";"Statut ";"Vœux";"Nombre de vœux";"Date du dernier import de vœux";"Téléchargement";"Téléchargement effectué pour tous les établissements d’accueil liés ?";"Date du dernier téléchargement";"Nombre de vœux téléchargés au moins une fois";"Nombre de vœux jamais téléchargés";"Nombre de vœux à télécharger (nouveau+maj)"
  // "Paris";"11111111100015";"Organisme de formation";"test@apprentissage.beta.gouv.fr";"1234567A";"";"";"contact responsable confirmé";"Oui";"3";"${date(
  //         new Date("2023-06-15T00:00:00.000Z")
  //       )}";"Oui";"Oui";"${date(new Date("2023-06-06T00:00:00.000Z"))}";"2";"1";"2"
  // "Paris";"11111111100015";"Organisme de formation";"test@apprentissage.beta.gouv.fr";"1234567B";"";"";"contact responsable confirmé";"Oui";"2";"${date(
  //         new Date("2023-06-10T00:00:00.000Z")
  //       )}";"Oui";"Oui";"${date(new Date("2023-06-16T00:00:00.000Z"))}";"2";"0";"0"
  // "Paris";"11111111100015";"Organisme de formation";"test@apprentissage.beta.gouv.fr";"1234567C";"";"";"contact responsable confirmé";"Non";"0";"";"Non";"Oui";"";"0";"0";"0"
  // `
  //     );
  //   });

  // xit("Vérifie qu'on peut voir les consultations de la page stats par académie", async () => {
  //   const { httpClient, createAndLogUser } = await startServer();
  //   const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
  //   await insertLog({
  //     request: {
  //       method: "GET",
  //       url: {
  //         relative: "/api/stats/computeStats/now",
  //         path: "/api/stats/computeStats/now",
  //         parameters: {
  //           academies: "01",
  //         },
  //       },
  //     },
  //   });

  //   const response = await httpClient.get("/api/constant/academies", {
  //     headers: {
  //       ...auth,
  //     },
  //   });

  //   assert.strictEqual(response.status, 200);
  //   assert.strictEqual(response.data.length, 37);
  //   const paris = response.data.find((a) => a.code === "01");
  //   assert.deepStrictEqual(paris, {
  //     code: "01",
  //     nbConsultationStats: 1,
  //     nom: "Paris",
  //   });
  // });

  it("Vérifie qu'on peut modifier l'adresse email d'un responsable", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    const etablissement1 = await insertEtablissement({
      email: "x@organisme.com",
    });
    const etablissement2 = await insertEtablissement({
      email: "y@organisme.com",
    });

    const response = await httpClient.put(
      `/api/admin/responsables/${etablissement1.siret}/setEmail`,
      {
        email: "robert.hue@organisme.com",
      },
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    let found = await Etablissement.findOne({ username: etablissement1.username }).lean();
    assert.deepStrictEqual(found.email, "robert.hue@organisme.com");
    const ancien = found.anciens_emails[0];
    assert.deepStrictEqual(omit(ancien, ["modification_date"]), {
      email: "x@organisme.com",
      auteur: "admin",
    });
    assert.ok(ancien.modification_date);
    found = await Etablissement.findOne({ username: etablissement2.username }).lean();
    assert.deepStrictEqual(found.email, "y@organisme.com");
  });

  it("Vérifie qu'il faut être admin pour changer l'email", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const response = await httpClient.put(
      "/api/admin/responsables/11111111100006/setEmail",
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 403);
    assert.deepStrictEqual(response.data, {
      error: "Forbidden",
      message: "Forbidden",
      statusCode: 403,
    });
  });

  it.skip("Vérifie qu'on ne peut renvoyer un email de confirmation", async () => {
    const { httpClient, createAndLogUser, getEmailsSent } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    const etablissement = await insertEtablissement({
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation_responsable",
        },
      ],
    });
    await insertEtablissement({
      statut: "en attente",
      email: "test2@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation_responsable",
        },
      ],
    });

    const response = await httpClient.put(
      `/api/admin/responsables/${etablissement.siret}/resendConfirmationEmail`,
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    const sent = getEmailsSent();

    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(
      sent[0].subject,
      `[Rappel] Affelnet 2025  – Action requise pour la transmission des listes de candidats aux offres de formation en apprentissage (siret : ${etablissement.siret})`
      // "Affelnet 2025  – Action requise pour la transmission des listes de candidats aux offres de formation en apprentissage (siret : ${etablissement1.siret})"
    );
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'il faut être admin pour changer renvoyer un email de confirmation", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const etablissement = await insertEtablissement({
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN",
          templateName: "confirmation_responsable",
        },
      ],
    });

    const response = await httpClient.put(
      `/api/admin/responsables/${etablissement.siret}/resendConfirmationEmail`,
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 403);
    assert.deepStrictEqual(response.data, {
      error: "Forbidden",
      message: "Forbidden",
      statusCode: 403,
    });
  });

  it.skip("Vérifie qu'on peut renvoyer un email d'activation", async () => {
    const { httpClient, createAndLogUser, getEmailsSent } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
    const etablissement = await insertEtablissement({
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_responsable",
        },
      ],
    });
    await insertEtablissement({
      statut: "en attente",
      email: "test2@apprentissage.beta.gouv.fr",
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_responsable",
        },
      ],
    });

    const response = await httpClient.put(
      `/api/admin/responsables/${etablissement.siret}/resendActivationEmail`,
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    const sent = getEmailsSent();
    assert.strictEqual(sent.length, 1);
    assert.deepStrictEqual(sent[0].to, "test1@apprentissage.beta.gouv.fr");
    assert.deepStrictEqual(
      sent[0].subject,
      `[Rappel] Affelnet 2025  – Veuillez activer votre compte pour l'accès aux listes de candidats (siret : ${etablissement.siret})`
      // `Affelnet 2025  – Veuillez activer votre compte pour l'accès aux listes de candidats (siret : ${etablissement1.siret})`
    );
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      total: 1,
      sent: 1,
      failed: 0,
    });
  });

  it("Vérifie qu'il faut être admin pour changer renvoyer un email d'activation", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

    const etablissement = await insertEtablissement({
      statut: "en attente",
      email: "test1@apprentissage.beta.gouv.fr",
      unsubscribe: true,
      emails: [
        {
          token: "TOKEN",
          templateName: "activation_responsable",
        },
      ],
    });

    const response = await httpClient.put(
      `/api/admin/responsables/${etablissement.siret}/resendActivationEmail`,
      {},
      {
        headers: {
          ...auth,
        },
      }
    );

    assert.strictEqual(response.status, 403);
    assert.deepStrictEqual(response.data, {
      error: "Forbidden",
      message: "Forbidden",
      statusCode: 403,
    });
  });

  // xit("Vérifie qu'on peut marquer un CFA comme non concerné", async () => {
  //   const { httpClient, createAndLogUser } = await startServer();
  //   const { auth } = await createAndLogUser("admin", "password", { isAdmin: true });
  //   await insertResponsable({
  //     siret: "11111111100006",
  //     statut: "confirmé",
  //   });
  //   await insertResponsable({
  //     siret: "22222222200006",
  //     statut: "confirmé",
  //   });

  //   const response = await httpClient.put(
  //     "/api/admin/responsables/11111111100006/markAsNonConcerne",
  //     {},
  //     {
  //       headers: {
  //         ...auth,
  //       },
  //     }
  //   );

  //   assert.strictEqual(response.status, 200);
  //   assert.deepStrictEqual(response.data.statut, "non concerné");
  //   let found = await Responsable.findOne({ username: "11111111100006" });
  //   assert.deepStrictEqual(found.statut, "non concerné");
  //   found = await Responsable.findOne({ username: "22222222200006" });
  //   assert.deepStrictEqual(found.statut, "confirmé");
  // });

  // xit("Vérifie qu'il faut être admin pour le statut d'un CFA", async () => {
  //   const { httpClient, createAndLogUser } = await startServer();
  //   const { auth } = await createAndLogUser("admin", "password", { isAdmin: false });

  //   const response = await httpClient.put(
  //     "/api/admin/responsables/11111111100006/markAsNonConcerne",
  //     {},
  //     {
  //       headers: {
  //         ...auth,
  //       },
  //     }
  //   );

  //   assert.strictEqual(response.status, 403);
  //   assert.deepStrictEqual(response.data, {
  //     error: "Forbidden",
  //     message: "Forbidden",
  //     statusCode: 403,
  //   });
  // });
});

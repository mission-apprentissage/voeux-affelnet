class FakeReferentielApi {
  constructor(responses) {
    this.responses = responses;
  }

  getOrganisme(siret) {
    if (Array.isArray(this.responses)) {
      return this.responses.find((r) => r.siret === siret);
    }
    return this.responses;
  }
}

module.exports = FakeReferentielApi;

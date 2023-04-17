import * as Yup from "yup";

function equalsTo(ref, msg) {
  return this.test({
    name: "equalTo",
    exclusive: false,
    // eslint-disable-next-line no-template-curly-in-string
    message: msg || "${path} must be the same as ${reference}",
    params: {
      reference: ref.path,
    },
    test: function (value) {
      return value === this.resolve(ref);
    },
  });
}

Yup.addMethod(Yup.string, "equalsTo", equalsTo);

export { Yup };

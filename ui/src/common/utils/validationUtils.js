import { Yup } from "../Yup";

export const emailConfirmationSchema = Yup.object().shape({
  email: Yup.string()
    .email("L'adresse courriel doit être valide")
    .lowercase("L'adresse courriel ne peut contenir que des minuscules")
    .strict()
    .required("Requis"),
  email_confirmation: Yup.string()
    .email("L'adresse courriel doit être valide")
    .lowercase("L'adresse courriel ne peut contenir que des minuscules")
    .strict()
    .required("Requis")
    .equalsTo(Yup.ref("email"), "L'email doit être identique à celui saisi plus haut."),
});

export const passwordConfirmationSchema = Yup.object().shape({
  password: Yup.string()
    .required("Veuillez saisir un mot de passe")
    .matches(
      "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[ !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~])[A-Za-z\\d !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~]{8,}$",
      "Le mot de passe doit contenir au moins 8 caractères, une lettre en majuscule, un chiffre et un caractère spécial"
    ),
  password_confirmation: Yup.string()
    .required("Veuillez saisir votre mot de passe une seconde fois")
    .equalsTo(Yup.ref("password"), "Le mot de passe doit être identique à celui saisi plus haut.")
    .matches(
      "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[ !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~])[A-Za-z\\d !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~]{8,}$",
      "Le mot de passe doit contenir au moins 8 caractères, une lettre en majuscule, un chiffre et un caractère spécial"
    ),
});

/* eslint-disable no-template-curly-in-string */
import { setLocale } from "yup";

setLocale({
  mixed: {
    default: "${path} est invalide.",
    required: "${path} est un champ obligatoire",
    oneOf: "${path} doit être l'une des valeurs suivantes: ${values}",
    notOneOf: "${path} ne doit pas être l'une des valeurs suivantes: ${values}",
  },
  number: {
    min: "${path} doit être supérieure ou égale à ${min}",
    max: "${path} doit être inférieur ou égal à ${max}",
    lessThan: "${path} doit être inférieure à ${less}",
    moreThan: "${path} doit être supérieure à ${more}",
    positive: "${path} doit être un nombre positif",
    negative: "${path} doit être un nombre négatif",
    integer: "${path} doit être un entier",
  },
  string: {
    length: "${path} doit être exactement ${length} caractères",
    min: "${path} doit être au moins ${min} caractères",
    max: "${path} doit être au plus ${max} caractères",
    matches: '${path} doit correspondre à ce qui suit: "${regex}"',
    email: "L'${path} n'est pas un email valide",
    url: "${path} doit être une URL valide",
    trim: "${path} doit être une chaîne garnie",
    lowercase: "${path} doit être une chaîne en minuscule",
    uppercase: "${path} doit être une chaîne de majuscules",
  },
  date: {
    min: "${path} champ doit être au plus tard ${min}",
    max: "champ ${path} doit être au plus tôt ${max}",
  },
  object: {
    noUnknown: "champ ${path} ne peut pas avoir des clés non spécifiées dans la forme de l'objet",
  },
  array: {
    min: "champ ${path} doit avoir au moins ${min} élements",
    max: "${path} champ doit avoir inférieur ou égal à ${max} élements",
  },
});
/* eslint-enable no-template-curly-in-string */

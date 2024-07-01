import reactToText from "react-to-text";

export const setTitle = (title) => {
  // console.log(reactToText(<>{title}</>));
  document.title = `Transmission des listes de candidats Affelnet - ${reactToText(<>{title}</>)}`;
};

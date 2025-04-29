import { cloneElement } from "react";
import { Text } from "@chakra-ui/react";

export const StatutBadge = ({ statut, descriptions, short = false }) => {
  const description = descriptions?.get(statut);

  return (
    <Text as="span" title={description?.long} cursor={"help"} display="inline-flex" alignItems="baseline">
      {cloneElement(description?.icon, { fontSize: "20px", mr: "1", alignSelf: "anchor-center" })}{" "}
      {short ? (description?.short ?? statut) : statut}
    </Text>
  );
};

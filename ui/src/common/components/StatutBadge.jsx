import { Text } from "@chakra-ui/react";

export const StatutBadge = ({ statut, descriptions, short = false }) => {
  const description = descriptions?.get(statut);

  return (
    <Text as="span" title={description?.long} cursor={"help"}>
      {description?.icon} {short ? (description?.short ?? statut) : statut}
    </Text>
  );
};

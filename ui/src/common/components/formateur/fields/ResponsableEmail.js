import { Text } from "@chakra-ui/react";

export const ResponsableEmail = ({ responsable }) => {
  return <Text display={"inline"}>{responsable.email}</Text>;
};

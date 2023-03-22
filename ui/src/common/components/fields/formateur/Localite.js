import { Link, Box, Text } from "@chakra-ui/react";
import Popup from "reactjs-popup";

export const FormateurLocalite = ({ formateur }) => {
  if (!formateur) return <></>;
  return (
    <>
      <Text>{formateur.libelle_ville}</Text>{" "}
      <Popup trigger={<Link variant="popup">Détail</Link>} modal nested>
        <Box m={12} p={12} background="white" border="1px solid  ">
          Adresse : {formateur.adresse}
          <br />
          Code Postal : {formateur.cp}
          <br />
          Ville : {formateur.commune}
          <br />
        </Box>
      </Popup>
    </>
  );
};

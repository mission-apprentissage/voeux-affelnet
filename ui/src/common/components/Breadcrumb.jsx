import { Fragment } from "react";
import { Button, Stack, Text, Breadcrumb as ChakraBreadCrumb } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const noop = () => ({});

export const Breadcrumb = ({ items, ...props }) => {
  const navigate = useNavigate();

  return (
    <Stack direction="row" mt={8} mb={8} wrap={"wrap"}>
      <Button variant="slight" onClick={() => navigate("/")} px={1} height={4}>
        Accueil
      </Button>

      {items.map((item, index) => (
        <Fragment key={index}>
          <Text as="span" variant="slight" style={{ alignContent: "center" }} px={1} height={4}>
            {"/"}
          </Text>
          <Button variant="slight" onClick={() => navigate(item.url)} px={1} height={4}>
            {item.label}
          </Button>
        </Fragment>
      ))}
    </Stack>
  );
};

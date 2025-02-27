import { Fragment } from "react";
import { Button, Stack, Text, Breadcrumb as ChakraBreadCrumb, Link } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const noop = () => ({});

export const Breadcrumb = ({ items, ...props }) => {
  const navigate = useNavigate();

  return (
    <Stack direction="row" mt={8} mb={8} wrap={"wrap"}>
      <Link variant="slight" href={"/"} onClick={() => navigate("/")} px={1} height={4}>
        Accueil
      </Link>

      {items.map((item, index) => (
        <Fragment key={index}>
          <Text as="span" variant="slight" style={{ alignContent: "center" }} px={1} height={4}>
            {"/"}
          </Text>
          <Link variant="slight" href={item.url} onClick={() => navigate(item.url)} px={1} height={4}>
            {item.label}
          </Link>
        </Fragment>
      ))}
    </Stack>
  );
};

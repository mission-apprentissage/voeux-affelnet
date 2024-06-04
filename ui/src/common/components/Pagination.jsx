import { Button, Stack, Text } from "@chakra-ui/react";

const noop = () => ({});

export function Pagination({ pagination, onClick = noop }) {
  return (
    <Stack direction="row">
      <Button variant="slight" onClick={() => onClick(pagination.page - 1)} disabled={pagination.page === 1}>
        &lt; Précédent
      </Button>
      <Text variant="slight" style={{ lineHeight: "40px" }}>
        {pagination.page} / {pagination.nombre_de_page}
      </Text>
      <Button
        variant="slight"
        onClick={() => pagination.page < pagination.nombre_de_page && onClick(pagination.page + 1)}
        disabled={pagination.nombre_de_page === pagination.page}
      >
        Suivant &gt;
      </Button>
    </Stack>
  );
}

export default Pagination;

import { Icon } from "@chakra-ui/icons";

import { ReactComponent as DeleteLineIcon } from "../../assets/delete-line.svg";

export const DeleteLine = (props) => {
  return <Icon as={DeleteLineIcon} {...props} />;
};

import React from "react";
import { Icon } from "@chakra-ui/icons";

import { ReactComponent as FileLineIcon } from "../../assets/file-line.svg";

export const FileLine = (props) => {
  return <Icon as={FileLineIcon} {...props} />;
};

import React from "react";
import { Icon } from "@chakra-ui/icons";

import { ReactComponent as FileTextLineIcon } from "../../assets/file-text-line.svg";

export const FileTextLine = (props) => {
  return <Icon as={FileTextLineIcon} {...props} />;
};

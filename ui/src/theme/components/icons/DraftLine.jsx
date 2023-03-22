import React from "react";
import { Icon } from "@chakra-ui/icons";

import { ReactComponent as DraftLineIcon } from "../../assets/draft-line.svg";

export const DraftLine = (props) => {
  return <Icon as={DraftLineIcon} {...props} />;
};

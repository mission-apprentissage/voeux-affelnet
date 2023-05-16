import React from "react";
import { Icon } from "@chakra-ui/icons";

import { ReactComponent as ErrorWarningLineIcon } from "../../assets/error-warning-line.svg";

export const ErrorWarningLine = (props) => {
  return <Icon as={ErrorWarningLineIcon} {...props} />;
};

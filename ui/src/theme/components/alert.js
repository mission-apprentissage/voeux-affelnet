import { cssVar } from "@chakra-ui/styled-system";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
import { alertAnatomy } from "@chakra-ui/anatomy";

const $fg = cssVar("alert-fg");
const $bg = cssVar("alert-bg");

// const Alert = {
//   baseStyle: {
//     _focus: { boxShadow: "none", outlineColor: "none" },
//     _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
//     container: {
//       borderColor: "#000091",
//       background: "#F0F0F0",
//     },
//   },

//   variants: {
//     solid: {
//       container: {
//         [$fg.variable]: "#000091",
//         [$bg.variable]: "#F0F0F0",
//       },
//     },
//     "left-accent": {
//       container: {
//         [$fg.variable]: "#000091",
//         [$bg.variable]: "#F0F0F0",
//       },
//     },
//   },
// };

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(alertAnatomy.keys);

const baseStyle = definePartsStyle((props) => {
  const { status } = props;

  const successBase = status === "success" && {
    container: {
      [$fg.variable]: "#18753c",
      [$bg.variable]: "#F0F0F0",
    },
  };

  const warningBase = status === "warning" && {
    container: {
      [$fg.variable]: "#b34000",
      [$bg.variable]: "black",
    },
  };

  const errorBase = status === "error" && {
    container: {
      [$fg.variable]: "#ce0500",
      [$bg.variable]: "danger.500",
    },
  };

  const infoBase = status === "info" && {
    container: {
      [$fg.variable]: "#000091",
      [$bg.variable]: "#F0F0F0",
    },
  };

  return {
    ...successBase,
    ...warningBase,
    ...errorBase,
    ...infoBase,
  };
});

const Alert = defineMultiStyleConfig({ baseStyle });

export { Alert };

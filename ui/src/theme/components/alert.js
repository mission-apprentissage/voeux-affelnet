import { cssVar } from "@chakra-ui/styled-system";

const $fg = cssVar("alert-fg");
const $bg = cssVar("alert-bg");

const Alert = {
  baseStyle: {
    _focus: { boxShadow: "none", outlineColor: "none" },
    _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
    container: {
      // border: "4px solid #000091",
      background: "#F0F0F0",
    },
  },

  variants: {
    "left-accent": {
      container: {
        [$fg.variable]: "#000091",
        [$bg.variable]: "#F0F0F0",
      },
    },
  },
};

export { Alert };

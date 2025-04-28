export const commonButtonStyle = {
  borderRadius: 0,
  textTransform: "none",
  fontWeight: 400,
  _focus: { boxShadow: "none", outlineColor: "none" },
  _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
};

const Button = {
  variants: {
    unstyled: {
      ...commonButtonStyle,
    },
    secondary: {
      ...commonButtonStyle,
      bg: "white",
      color: "bluefrance",
      border: "1px solid",
      borderColor: "bluefrance",
      _hover: { bg: "#efefef" },
    },
    primary: {
      ...commonButtonStyle,
      bg: "bluefrance",
      color: "white",
      _hover: { bg: "#1212ff", _disabled: { bg: "bluefrance" } },
    },
    pill: {
      ...commonButtonStyle,
      borderRadius: 24,
      height: "auto",
      fontSize: "zeta",
      color: "bluefrance",
      px: 3,
      py: 1,
      _hover: { bg: "grey.200", textDecoration: "none" },
    },
    outlined: {
      ...commonButtonStyle,
      color: "black",
    },
    slight: {
      ...commonButtonStyle,
      fontWeight: 400,
      color: "gray.500",
      fontSize: "0.8rem",
      fontStyle: "italic",
      textDecoration: "underline",
    },
    danger: {
      ...commonButtonStyle,
      color: "redmarianne",
    },
    blue: {
      ...commonButtonStyle,
      backgroundColor: "bluefrance",
      color: "white",
      _hover: { bg: "#1212ff", _disabled: { bg: "bluefrance" } },
    },
    green: {
      ...commonButtonStyle,
      backgroundColor: "#1f8d49",
      color: "white",
      _hover: { bg: "#2ec166", _disabled: { bg: "#1f8d49" } },
    },
    red: {
      ...commonButtonStyle,
      backgroundColor: "#d64d00",
      color: "white",
      _hover: { bg: "#ff754e", _disabled: { bg: "#d64d00" } },
    },
  },
};

export { Button };

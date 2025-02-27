import { commonButtonStyle } from "./button";

const Link = {
  baseStyle: {
    _focus: { boxShadow: "none", outlineColor: "none" },
    _focusVisible: { boxShadow: "0 0 0 3px #2A7FFE", outlineColor: "#2A7FFE" },
  },
  variants: {
    card: {
      p: 8,
      bg: "#F9F8F6",
      _hover: { bg: "#eceae3", textDecoration: "none" },
      display: "block",
    },
    pill: {
      borderRadius: 24,
      fontSize: "zeta",
      color: "bluefrance",
      px: 3,
      py: 1,
      _hover: { bg: "grey.200", textDecoration: "none" },
    },
    summary: {
      fontSize: "zeta",
      _hover: { textDecoration: "none", bg: "grey.200" },
      p: 2,
    },
    action: {
      color: "grey.800",
      textDecoration: "underline",
    },
    primary: {
      ...commonButtonStyle,
      color: "bluefrance",
      border: "1px solid",
      borderColor: "bluefrance",
      bg: "white",
      padding: "8px",
      textDecoration: "none",
      _hover: { bg: "bluefrance", color: "white", textDecoration: "none" },
    },
    slight: {
      ...commonButtonStyle,
      fontWeight: 400,
      color: "#666666",
      fontSize: "0.8rem",
      fontStyle: "italic",
      textDecoration: "underline",
    },
    popup: {
      fontSize: "zeta",
      color: "grey.800",
      textDecoration: "underline",
    },
  },
};

export { Link };

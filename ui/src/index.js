import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";

import "./common/utils/setYupLocale";
import * as Sentry from "./common/sentry";

import App from "./App";

import theme from "./theme/index";
import "./index.css";

Sentry.initialize();

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <StrictMode>
    <ChakraProvider theme={theme} resetCSS>
      <App />
    </ChakraProvider>
  </StrictMode>
);

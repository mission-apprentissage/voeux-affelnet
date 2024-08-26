import { Box, Container } from "@chakra-ui/react";

import Footer from "./Footer";
import Header from "./Header";
// import { NavigationMenu } from "./NavigationMenu";

const Layout = ({ children, ...rest }) => {
  return (
    <Container maxW="full" p={0} {...rest} className="new-layout">
      <Header />
      <Box maxW={["90%", "90%", "90%", "90%", "1280px"]} margin="auto" minH={"70vh"}>
        {/* <NavigationMenu /> */}
        {children}
      </Box>
      <Footer />
    </Container>
  );
};

export default Layout;

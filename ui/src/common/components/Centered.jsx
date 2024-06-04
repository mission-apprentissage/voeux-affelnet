import styled from "styled-components";

export default styled.div.attrs(() => ({ className: "Centered" }))`
  height: 100vh;
  margin: auto;
  width: 100vw;

  > iframe {
    margin: auto;
  }
`;

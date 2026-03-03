import { render } from "@testing-library/react";
import App from "./App";

it.skip("renders learn react link", () => {
  const { getByTestId } = render(<App />);
  const app = getByTestId("app");
  expect(app).toBeInTheDocument();
});

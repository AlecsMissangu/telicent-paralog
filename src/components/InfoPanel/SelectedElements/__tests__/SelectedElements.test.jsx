import React from "react";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";

import { ElementsProvider } from "context";
import {
  LARGE_WIND_FARMS_AND_COAL_PLANT_COMPLEX_DEPENDENCIES,
  LARGE_WIND_FARM_ASSETS,
  COAL_PLANT_COMPLEX_ASSETS,
} from "mocks";
import {
  DSProvidersWrapper,
  getCreatedAssets,
  getCreatedDependencies,
  renderWithQueryClient,
} from "test-utils";

import SelectedElements from "../SelectedElements";

const renderSelectedDetails = (selected) =>
  renderWithQueryClient(
    <DSProvidersWrapper>
      <SelectedElements selectedElements={selected} onTogglePanel={jest.fn()} />
    </DSProvidersWrapper>,
    {
      wrapper: ElementsProvider,
    }
  );

const renderSelectedElementsList = async () => {
  const selectedAssets = await getCreatedAssets(
    [
      ...LARGE_WIND_FARM_ASSETS,
      ...COAL_PLANT_COMPLEX_ASSETS,
    ],
    ["E001", "E003"],
    jest.fn().mockReturnValue({
      backgroundColor: "#272727",
      color: "#F2F2F2",
      iconFallbackText: "D",
      alt: "default",
    })
  );
  const selectedDependencies = getCreatedDependencies(
    LARGE_WIND_FARMS_AND_COAL_PLANT_COMPLEX_DEPENDENCIES,
    ["E001 - E003"]
  );
  return renderSelectedDetails([...selectedAssets, ...selectedDependencies]);
};

const waitForElementDetailsToLoad = async () => {
  await waitForElementToBeRemoved(() => screen.queryAllByText("Fetching element details"));
};

describe("Selected Elements component", () => {
  test("does NOT render component when selected elements are not an array", () => {
    const { container } = renderSelectedDetails({});
    expect(container).toBeEmptyDOMElement();
  });

  test("renders message when no elements are selected", () => {
    renderSelectedDetails([]);

    expect(
      screen.getByText(/click on an asset or connection to view details/i)
    ).toBeInTheDocument();
  });

  test("does NOT render total selected when elements aren't selected", async () => {
    renderSelectedDetails([]);
    expect(screen.queryByTestId("selected-badge")).not.toBeInTheDocument();
  });

  test("renders total count of selected elements when panel in open", async () => {
    await renderSelectedElementsList();

    const selectedBadge = screen.getByTestId("selected-badge");
    expect(selectedBadge).toHaveTextContent("3");
  });

  test("renders total count when element is selected", async () => {
    const { user } = await renderSelectedElementsList();
    await waitForElementDetailsToLoad();
    await user.click(screen.getByRole("button", { name: "Best Coleman Power Station" }));

    const selectedBadge = screen.getByTestId("selected-badge");
    expect(selectedBadge).toHaveTextContent("3");
  });

  test("renders a list of selected element details", async () => {
    await renderSelectedElementsList();

    expect(
      screen.getByRole("heading", { name: "Selected Elements", level: 2 })
    ).toBeInTheDocument();

    await waitForElementDetailsToLoad();
    expect(
      screen.getByRole("heading", { name: "Best Coleman Power Station", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "West Coleman 50kV Substation", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Best Coleman Power Station - West Coleman 50kV Substation",
        level: 2,
      })
    ).toBeInTheDocument();
    expect(screen.queryAllByTestId("element-details")).toHaveLength(0);
    expect(screen.getByRole("list")).toMatchSnapshot("selected elements");
  });

  test("renders element details when a list item is clicked", async () => {
    const { user } = await renderSelectedElementsList();

    await waitForElementDetailsToLoad();
    await user.click(screen.getByRole("button", { name: "Best Coleman Power Station" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
  });

  test("renders all selected elements by click on back arrow", async () => {
    const { user } = await renderSelectedElementsList();

    await waitForElementDetailsToLoad();
    await user.click(screen.getByRole("button", { name: "Best Coleman Power Station" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "view all selected" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);

    await user.click(
      screen.getByRole("button", {
        name: "Best Coleman Power Station - West Coleman 50kV Substation",
      })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
  });

  test("renders open street view link when element has lat lng", async () => {
    const { user } = await renderSelectedElementsList();
    await waitForElementDetailsToLoad();

    await user.click(screen.getByRole("button", { name: "Best Coleman Power Station" }));
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open street view/i })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=100.123123%2C10.1233333"
    );
  });

  test("does NOT render street view link when element has no lat lng", async () => {
    const { user } = await renderSelectedElementsList();
    await waitForElementDetailsToLoad();

    await user.click(
      screen.getByRole("button", {
        name: "Best Coleman Power Station - West Coleman 50kV Substation",
      })
    );
    expect(screen.getByTestId("element-details")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open street view/i })).not.toBeInTheDocument();
  });

  test("renders element details when one element is selected", async () => {
    const selectedAssets = await getCreatedAssets(
      COAL_PLANT_COMPLEX_ASSETS,
      ["E001"],
      jest.fn().mockReturnValue({
        backgroundColor: "#272727",
        color: "#F2F2F2",
        iconFallbackText: "D",
        alt: "default",
      })
    );

    renderSelectedDetails(selectedAssets);
    await waitForElementDetailsToLoad();

    expect(screen.getByTestId("element-details")).toBeInTheDocument();
  });
});

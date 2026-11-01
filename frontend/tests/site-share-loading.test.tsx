// The share button when its library chunk fails to load (e.g. offline): the failure is reported, not left unhandled.
import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteShareButton } from "@/components/site-share-button";
import { renderWithIntl } from "./helpers/intl";

vi.mock("@aossie-org/social-share-button", () => {
  throw new Error("chunk failed to load");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SiteShareButton without its library", () => {
  it("logs the load failure and renders an inert button", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = renderWithIntl(<SiteShareButton className="share" />);

    await waitFor(() => expect(error).toHaveBeenCalledWith("Could not load the share dialog", expect.any(Error)));
    expect(container.querySelector("button.share")).not.toBeNull();
    expect(document.querySelector(".social-share-modal-overlay")).toBeNull();
  });
});

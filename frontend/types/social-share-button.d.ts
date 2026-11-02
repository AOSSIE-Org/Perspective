/** Types for the parts of `@aossie-org/social-share-button` the navbar share button uses (the package ships none) */
declare module "@aossie-org/social-share-button" {
  export interface SocialShareLabels {
    share?: string;
    close?: string;
    copy?: string;
    copied?: string;
    copyFailed?: string;
    urlLabel?: string;
  }

  export interface SocialShareOptions {
    container?: HTMLElement | string | null;
    showButton?: boolean;
    platforms?: readonly string[];
    theme?: "dark" | "light";
    labels?: SocialShareLabels;
    url?: string;
    title?: string;
  }

  export default class SocialShareButton {
    constructor(options?: SocialShareOptions);
    openModal(): void;
    closeModal(): void;
    updateOptions(options: SocialShareOptions): void;
    destroy(): void;
  }
}

interface Window {
  /** Set by `@aossie-org/social-share-button` when its script runs */
  SocialShareButton?: typeof import("@aossie-org/social-share-button").default;
}

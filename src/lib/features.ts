import { PRICES } from "./config";
import type { LoginFeature } from "./types";

export type FeatureRequirement = "membership" | "membership+hosted";

export type FeatureOption = {
  id: LoginFeature;
  title: string;
  body: string;
  requires: FeatureRequirement | null;
  priceNote?: string;
};

export const LOGIN_FEATURES: FeatureOption[] = [
  {
    id: "none",
    title: "No login",
    body: "Visitors browse the page as it is. No PageBuilder account is required to finish.",
    requires: null,
  },
  {
    id: "code",
    title: "Basic login in the files",
    body: "We add a login page to your download. You host it yourself. Membership is required, so you will need a PageBuilder account.",
    requires: "membership",
  },
  {
    id: "hosted",
    title: "PageBuilder managed login",
    body: "We run login for you. The page must be deployed on PageBuilder.",
    requires: "membership+hosted",
    priceNote: `Membership plus $${PRICES.hostedLoginUsd}/month`,
  },
];

export function featureById(id: LoginFeature): FeatureOption {
  return LOGIN_FEATURES.find((item) => item.id === id) ?? LOGIN_FEATURES[0];
}

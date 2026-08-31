"use strict";

const SELF_SERVE_EXTEND_DAYS = 3;

const CODES = {
  TRIAL_EXPIRED: "TRIAL_EXPIRED",
  TRIAL_FINISHED: "TRIAL_FINISHED",
  TENANT_UNAVAILABLE: "TENANT_UNAVAILABLE",
};

function hasUsedSelfServeExtend(tenant) {
  return Boolean(tenant?.selfServeTrialExtendedAt);
}

/**
 * Build the POS-facing payload when a cafe cannot use normal APIs.
 * First expiry (no self-extend yet) → TRIAL_EXPIRED + canSelfExtend.
 * After the free +3 days is used and expires again → TRIAL_FINISHED.
 */
function buildUnavailablePayload(tenant, { forcedExpired = false } = {}) {
  const status = forcedExpired ? "expired" : tenant.status;
  const usedExtend = hasUsedSelfServeExtend(tenant);
  const isExpired = status === "expired";

  if (isExpired && !usedExtend) {
    return {
      code: CODES.TRIAL_EXPIRED,
      canSelfExtend: true,
      selfServeExtendDays: SELF_SERVE_EXTEND_DAYS,
      message: "Your free trial has ended. Extend it by 3 days to keep using Serve.",
      cafe: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: "expired",
        trialEndsAt: tenant.trialEndsAt || null,
        selfServeTrialExtendedAt: null,
      },
    };
  }

  if (isExpired && usedExtend) {
    return {
      code: CODES.TRIAL_FINISHED,
      canSelfExtend: false,
      selfServeExtendDays: SELF_SERVE_EXTEND_DAYS,
      message:
        "Your free trial has finished. Contact Serve to activate hosting for your cafe.",
      cafe: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: "expired",
        trialEndsAt: tenant.trialEndsAt || null,
        selfServeTrialExtendedAt: tenant.selfServeTrialExtendedAt || null,
      },
    };
  }

  return {
    code: CODES.TENANT_UNAVAILABLE,
    canSelfExtend: false,
    selfServeExtendDays: SELF_SERVE_EXTEND_DAYS,
    message: `Cafe "${tenant.slug}" is not available (status: ${status}).`,
    cafe: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status,
      trialEndsAt: tenant.trialEndsAt || null,
      selfServeTrialExtendedAt: tenant.selfServeTrialExtendedAt || null,
    },
  };
}

function isTrialLifecyclePath(url) {
  const path = String(url || "");
  return (
    path.includes("/cafe/trial") ||
    path.endsWith("/cafe/trial") ||
    path.includes("/cafe/trial/")
  );
}

module.exports = {
  SELF_SERVE_EXTEND_DAYS,
  CODES,
  hasUsedSelfServeExtend,
  buildUnavailablePayload,
  isTrialLifecyclePath,
};

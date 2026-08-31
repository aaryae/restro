"use strict";

const { tenantModel } = require("../../models");
const {
  SELF_SERVE_EXTEND_DAYS,
  CODES,
  buildUnavailablePayload,
  hasUsedSelfServeExtend,
} = require("../../lib/trial-lifecycle");

function serializeTrialStatus(tenant) {
  const now = Date.now();
  const endsAt = tenant.trialEndsAt ? new Date(tenant.trialEndsAt).getTime() : null;
  const isPastEnd = endsAt != null && endsAt < now;
  const effectiveStatus =
    tenant.status === "trial" && isPastEnd ? "expired" : tenant.status;

  if (effectiveStatus === "expired") {
    return buildUnavailablePayload(
      { ...tenant, status: "expired" },
      { forcedExpired: true },
    );
  }

  return {
    code: null,
    canSelfExtend: false,
    selfServeExtendDays: SELF_SERVE_EXTEND_DAYS,
    message: null,
    cafe: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt || null,
      selfServeTrialExtendedAt: tenant.selfServeTrialExtendedAt || null,
    },
  };
}

async function loadTenantFromReq(req) {
  if (!req.tenant?.id) {
    return {
      error: {
        status: 400,
        success: false,
        message: "Cafe context is required.",
      },
    };
  }
  const tenant = await tenantModel.findByPk(req.tenant.id);
  if (!tenant) {
    return {
      error: {
        status: 404,
        success: false,
        message: "Cafe not found.",
      },
    };
  }
  return { tenant };
}

const getTrialStatus = async (req) => {
  const { tenant, error } = await loadTenantFromReq(req);
  if (error) return error;

  // Mirror middleware lazy-expire so status endpoint stays accurate.
  if (
    tenant.status === "trial" &&
    tenant.trialEndsAt &&
    new Date(tenant.trialEndsAt).getTime() < Date.now()
  ) {
    await tenant.update({ status: "expired" });
    await tenant.reload();
  }

  return {
    status: 200,
    success: true,
    message: "OK",
    data: serializeTrialStatus(tenant.toJSON ? tenant.toJSON() : tenant),
  };
};

const selfExtendTrial = async (req) => {
  const { tenant, error } = await loadTenantFromReq(req);
  if (error) return error;

  if (
    tenant.status === "trial" &&
    tenant.trialEndsAt &&
    new Date(tenant.trialEndsAt).getTime() < Date.now()
  ) {
    await tenant.update({ status: "expired" });
    await tenant.reload();
  }

  if (tenant.status === "active") {
    return {
      status: 400,
      success: false,
      message: "This cafe is already on an active plan.",
      data: { code: CODES.TENANT_UNAVAILABLE },
    };
  }

  if (tenant.status === "trial") {
    return {
      status: 400,
      success: false,
      message: "Your trial is still active.",
      data: serializeTrialStatus(tenant.toJSON ? tenant.toJSON() : tenant),
    };
  }

  if (tenant.status !== "expired") {
    const payload = buildUnavailablePayload(tenant);
    return {
      status: 403,
      success: false,
      message: payload.message,
      data: payload,
    };
  }

  if (hasUsedSelfServeExtend(tenant)) {
    const payload = buildUnavailablePayload(tenant);
    return {
      status: 403,
      success: false,
      message: payload.message,
      data: payload,
    };
  }

  const next = new Date(
    Date.now() + SELF_SERVE_EXTEND_DAYS * 24 * 60 * 60 * 1000,
  );
  const extendedAt = new Date();

  await tenant.update({
    status: "trial",
    trialEndsAt: next,
    selfServeTrialExtendedAt: extendedAt,
  });
  await tenant.reload();

  return {
    status: 200,
    success: true,
    message: `Trial extended by ${SELF_SERVE_EXTEND_DAYS} days`,
    data: {
      code: null,
      canSelfExtend: false,
      selfServeExtendDays: SELF_SERVE_EXTEND_DAYS,
      daysAdded: SELF_SERVE_EXTEND_DAYS,
      trialEndsAt: next.toISOString(),
      cafe: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt,
        selfServeTrialExtendedAt: tenant.selfServeTrialExtendedAt,
      },
    },
  };
};

module.exports = {
  getTrialStatus,
  selfExtendTrial,
};

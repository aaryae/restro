"use strict";

const { Op } = require("sequelize");
const crypto = require("crypto");
const {
  tenantModel,
  provisioningJobModel,
  platformUserModel,
  platformAuditLogModel,
  globalUsernameModel,
  sequelize,
} = require("../../models");
const { hashPassword, comparePasswords } = require("../../utils/bcrypt");
const {
  recordLoginFailure,
  clearLoginFailures,
  wrongPasswordMessage,
} = require("../../utils/loginRateLimit");
const {
  toPlatformAuthJSON,
  generateJWT,
} = require("../../helpers/jwt-helper");
const { provisionTenant } = require("../../lib/tenant-provisioner");
const { nextAvailableSlug } = require("../../lib/trial-slug");
const { validateSlug } = require("../../lib/tenant-slug");
const { RESERVED_SLUGS } = require("../../constants/tenant-constants");
const {
  PLATFORM_ROLE_LABELS,
  OPERATOR_PERMISSION_META,
  normalizePlatformRole,
  sanitizePermissions,
  permissionsForUser,
} = require("../../constants/platform-rbac");
const { createSessionLog } = require("./session-logs");
const { runWithTenantContext } = require("../../lib/tenant-context");
const { queueCafeOwnerMail } = require("../../lib/platform-cafe-mail");

const PLATFORM_PASSWORD_MIN = 10;

function clientMeta(req) {
  const ip =
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.ip ||
    null;
  return {
    ip,
    userAgent: req?.headers?.["user-agent"]
      ? String(req.headers["user-agent"]).slice(0, 200)
      : null,
  };
}

function serializeCafe(tenant, extras = {}) {
  if (!tenant) return null;
  const row = tenant.toJSON ? tenant.toJSON() : tenant;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    ownerEmail: row.ownerEmail,
    ownerPhone: row.ownerPhone,
    ownerUsername: extras.ownerUsername ?? null,
    businessType: row.businessType,
    address: row.address,
    trialEndsAt: row.trialEndsAt,
    selfServeTrialExtendedAt: row.selfServeTrialExtendedAt || null,
    statusBeforeSuspend: row.statusBeforeSuspend || null,
    activatedAt: row.activatedAt,
    hostingEndsAt: row.hostingEndsAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serializeAuditLog(log) {
  return {
    id: log.id,
    actor: log.actor?.username || "system",
    actorName: log.actor?.name || null,
    action: log.action,
    cafeName: log.tenant?.name || null,
    cafeSlug: log.tenant?.slug || null,
    meta: log.meta
      ? typeof log.meta === "string"
        ? log.meta
        : JSON.stringify(log.meta)
      : null,
    createdAt: log.createdAt,
  };
}

async function resolveOwnerUsername(tenant) {
  const schemaName = String(tenant?.schemaName || "");
  if (/^[a-z0-9_]+$/i.test(schemaName)) {
    try {
      const [rows] = await sequelize.query(
        `SELECT username FROM "${schemaName}".users WHERE "roleId" = 1 ORDER BY id ASC LIMIT 1`,
      );
      if (rows[0]?.username) return rows[0].username;
    } catch {
      // Schema may not exist yet during provisioning.
    }
  }

  const hit = await globalUsernameModel.findOne({
    where: { tenantId: tenant.id },
    attributes: ["username"],
    order: [["id", "ASC"]],
  });
  return hit?.username || null;
}

async function writeAudit({ platformUserId, tenantId, action, meta }) {
  await platformAuditLogModel.create({
    platformUserId: platformUserId || null,
    tenantId: tenantId || null,
    action,
    meta: meta || null,
  });
}

function splitName(fullName) {
  const parts = String(fullName || "Owner").trim().split(/\s+/);
  return {
    firstName: parts[0] || "Owner",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

function generateTempPassword() {
  return `Serve${crypto.randomBytes(6).toString("base64url")}!`;
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 64);
}

const login = async (req) => {
  const { username, password } = req.body || {};
  const normalized = normalizeUsername(username);
  if (!normalized || !password) {
    return {
      status: 400,
      success: false,
      message: "Username and password are required",
    };
  }

  const user = await platformUserModel.findOne({
    where: { username: normalized },
  });
  if (!user) {
    await writeAudit({
      action: "login_failed",
      meta: { username: normalized, reason: "not_found", ...clientMeta(req) },
    });
    recordLoginFailure(req);
    return {
      status: 401,
      success: false,
      message: wrongPasswordMessage(req),
    };
  }

  if (!user.isActive) {
    await writeAudit({
      platformUserId: user.id,
      action: "login_failed",
      meta: { username: normalized, reason: "inactive", ...clientMeta(req) },
    });
    return {
      status: 403,
      success: false,
      message:
        "This operator account is inactive. Contact the platform owner to reactivate it.",
    };
  }

  const ok = await comparePasswords(password, user.passwordHash);
  if (!ok) {
    await writeAudit({
      platformUserId: user.id,
      action: "login_failed",
      meta: { username: normalized, reason: "bad_password", ...clientMeta(req) },
    });
    recordLoginFailure(req);
    return {
      status: 401,
      success: false,
      message: wrongPasswordMessage(req),
    };
  }

  await writeAudit({
    platformUserId: user.id,
    action: "login",
    meta: clientMeta(req),
  });
  clearLoginFailures(req);

  return {
    status: 200,
    success: true,
    message: "Signed in successfully",
    data: toPlatformAuthJSON(user),
  };
};

const me = async (req) => {
  const platformRole =
    normalizePlatformRole(req.platformUser.platformRole) || "operator";
  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      id: req.platformUser.id,
      username: req.platformUser.username,
      name: req.platformUser.name,
      imageUrl: req.platformUser.imageUrl || null,
      platformRole,
      permissions: permissionsForUser(req.platformUser),
    },
  };
};

function serializeSelf(user) {
  const platformRole = normalizePlatformRole(user.platformRole) || "operator";
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    imageUrl: user.imageUrl || null,
    platformRole,
    permissions: permissionsForUser(user),
  };
}

/** Update the signed-in platform user's own profile (name / photo). */
const updateMe = async (req) => {
  const user = await platformUserModel.findByPk(req.platformUser.id);
  if (!user || !user.isActive) {
    return { status: 404, success: false, message: "User not found" };
  }

  const body = req.body || {};
  const updates = {};

  if (body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name || name.length < 2) {
      return {
        status: 400,
        success: false,
        message: "Name must be at least 2 characters",
      };
    }
    updates.name = name;
  }

  if (body.imageUrl !== undefined) {
    const raw = body.imageUrl;
    if (raw === null || raw === "") {
      updates.imageUrl = null;
    } else {
      const imageUrl = String(raw).trim();
      if (imageUrl.length > 500) {
        return { status: 400, success: false, message: "Invalid image URL" };
      }
      updates.imageUrl = imageUrl;
    }
  }

  if (Object.keys(updates).length === 0) {
    return {
      status: 200,
      success: true,
      message: "No changes",
      data: serializeSelf(user),
    };
  }

  await user.update(updates);
  await user.reload();

  await writeAudit({
    platformUserId: user.id,
    action: "platform_user.profile_update",
    meta: {
      fields: Object.keys(updates),
      ...clientMeta(req),
    },
  });

  return {
    status: 200,
    success: true,
    message: "Profile updated",
    data: serializeSelf(user),
  };
};

/** Change the signed-in platform user's password. */
const changeMyPassword = async (req) => {
  const user = await platformUserModel.findByPk(req.platformUser.id);
  if (!user || !user.isActive) {
    return { status: 404, success: false, message: "User not found" };
  }

  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");

  if (!currentPassword) {
    return {
      status: 400,
      success: false,
      message: "Current password is required",
    };
  }
  if (newPassword.length < PLATFORM_PASSWORD_MIN) {
    return {
      status: 400,
      success: false,
      message: `New password must be at least ${PLATFORM_PASSWORD_MIN} characters`,
    };
  }

  const ok = await comparePasswords(currentPassword, user.passwordHash);
  if (!ok) {
    return {
      status: 400,
      success: false,
      message: "Current password is incorrect",
    };
  }

  const same = await comparePasswords(newPassword, user.passwordHash);
  if (same) {
    return {
      status: 400,
      success: false,
      message: "New password must be different from the current password",
    };
  }

  await user.update({ passwordHash: await hashPassword(newPassword) });

  await writeAudit({
    platformUserId: user.id,
    action: "platform_user.password_change",
    meta: clientMeta(req),
  });

  return {
    status: 200,
    success: true,
    message: "Password changed successfully",
    data: null,
  };
};

/** Upload avatar for the signed-in platform user. */
const uploadMyAvatar = async (req) => {
  const user = await platformUserModel.findByPk(req.platformUser.id);
  if (!user || !user.isActive) {
    return { status: 404, success: false, message: "User not found" };
  }

  if (!req.file) {
    return { status: 400, success: false, message: "No file uploaded" };
  }

  const filePath = String(req.file.path || "").replace(/\\/g, "/");
  if (!filePath) {
    return { status: 500, success: false, message: "Upload failed" };
  }

  await user.update({ imageUrl: filePath });
  await user.reload();

  await writeAudit({
    platformUserId: user.id,
    action: "platform_user.avatar_upload",
    meta: { imageUrl: filePath, ...clientMeta(req) },
  });

  return {
    status: 200,
    success: true,
    message: "Photo updated",
    data: serializeSelf(user),
  };
};

const stats = async () => {
  const rows = await tenantModel.findAll({
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const byStatus = Object.fromEntries(
    rows.map((r) => [r.status, Number(r.count)]),
  );

  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      active: byStatus.active || 0,
      trial: byStatus.trial || 0,
      expired: byStatus.expired || 0,
      suspended: byStatus.suspended || 0,
      failed: byStatus.failed || 0,
      provisioning: byStatus.provisioning || 0,
      deleted: byStatus.deleted || 0,
    },
  };
};

function startOfUtcDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseDayKey(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return formatDayKey(d);
}

function buildDayKeys(days, endDate = new Date()) {
  const end = startOfUtcDay(endDate);
  const keys = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    keys.push(formatDayKey(d));
  }
  return keys;
}

function buildDayKeysBetween(fromKey, toKey) {
  const keys = [];
  const cursor = new Date(`${fromKey}T00:00:00.000Z`);
  const end = new Date(`${toKey}T00:00:00.000Z`);
  while (cursor <= end) {
    keys.push(formatDayKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

async function countByDay({ table, dateColumn, since, untilExclusive, actions }) {
  const replacements = { since, untilExclusive };
  let actionSql = "";
  if (actions?.length) {
    actionSql = ` AND action IN (${actions
      .map((_, i) => `:action${i}`)
      .join(", ")})`;
    actions.forEach((action, i) => {
      replacements[`action${i}`] = action;
    });
  }

  const [rows] = await sequelize.query(
    `
      SELECT DATE("${dateColumn}")::text AS day, COUNT(*)::int AS count
      FROM ${table}
      WHERE "${dateColumn}" >= :since
        AND "${dateColumn}" < :untilExclusive
      ${actionSql}
      GROUP BY DATE("${dateColumn}")
      ORDER BY day ASC
    `,
    { replacements },
  );

  return Object.fromEntries(
    (rows || []).map((row) => [String(row.day).slice(0, 10), Number(row.count) || 0]),
  );
}

function fillSeries(dayKeys, byDay) {
  return dayKeys.map((day) => ({ day, count: byDay[day] || 0 }));
}

function resolveTrendWindow(req) {
  const fromKey = parseDayKey(req.query.from);
  const toKey = parseDayKey(req.query.to);
  const todayKey = formatDayKey(startOfUtcDay(new Date()));

  if (fromKey || toKey) {
    let start = fromKey || toKey;
    let end = toKey || fromKey;
    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;
    }
    if (end > todayKey) end = todayKey;
    const dayKeys = buildDayKeysBetween(start, end);
    if (dayKeys.length > 366) {
      return {
        error: {
          status: 400,
          success: false,
          message: "Custom range cannot exceed 366 days",
        },
      };
    }
    const since = new Date(`${dayKeys[0]}T00:00:00.000Z`);
    const untilExclusive = new Date(`${dayKeys[dayKeys.length - 1]}T00:00:00.000Z`);
    untilExclusive.setUTCDate(untilExclusive.getUTCDate() + 1);
    return {
      dayKeys,
      since,
      untilExclusive,
      range: "custom",
      from: dayKeys[0],
      to: dayKeys[dayKeys.length - 1],
      days: dayKeys.length,
    };
  }

  const daysParam = Number(req.query.days);
  let days;
  if (Number.isFinite(daysParam) && daysParam > 0) {
    days = Math.min(366, Math.max(1, Math.floor(daysParam)));
  } else {
    const rangeRaw = String(req.query.range || "30d").trim().toLowerCase();
    days = rangeRaw === "7d" ? 7 : rangeRaw === "90d" ? 90 : 30;
  }

  const dayKeys = buildDayKeys(days);
  const since = new Date(`${dayKeys[0]}T00:00:00.000Z`);
  const untilExclusive = new Date(`${todayKey}T00:00:00.000Z`);
  untilExclusive.setUTCDate(untilExclusive.getUTCDate() + 1);

  return {
    dayKeys,
    since,
    untilExclusive,
    range: `${days}d`,
    from: dayKeys[0],
    to: dayKeys[dayKeys.length - 1],
    days: dayKeys.length,
  };
}

/** Daily trend lines for dashboard scenarios. */
const statsTrends = async (req) => {
  const window = resolveTrendWindow(req);
  if (window.error) return window.error;

  const { dayKeys, since, untilExclusive, range, from, to, days } = window;

  const [
    cafesCreated,
    activations,
    suspensions,
    extensions,
    impersonations,
    operatorsCreated,
    auditEvents,
  ] = await Promise.all([
    countByDay({
      table: "tenants",
      dateColumn: "createdAt",
      since,
      untilExclusive,
    }),
    countByDay({
      table: "platform_audit_logs",
      dateColumn: "createdAt",
      since,
      untilExclusive,
      actions: ["activate", "unsuspend"],
    }),
    countByDay({
      table: "platform_audit_logs",
      dateColumn: "createdAt",
      since,
      untilExclusive,
      actions: ["suspend"],
    }),
    countByDay({
      table: "platform_audit_logs",
      dateColumn: "createdAt",
      since,
      untilExclusive,
      actions: ["extend_trial"],
    }),
    countByDay({
      table: "platform_audit_logs",
      dateColumn: "createdAt",
      since,
      untilExclusive,
      actions: ["impersonate"],
    }),
    countByDay({
      table: "platform_audit_logs",
      dateColumn: "createdAt",
      since,
      untilExclusive,
      actions: ["platform_user.create"],
    }),
    countByDay({
      table: "platform_audit_logs",
      dateColumn: "createdAt",
      since,
      untilExclusive,
    }),
  ]);

  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      range,
      from,
      to,
      days,
      series: {
        cafesCreated: fillSeries(dayKeys, cafesCreated),
        activations: fillSeries(dayKeys, activations),
        suspensions: fillSeries(dayKeys, suspensions),
        extensions: fillSeries(dayKeys, extensions),
        impersonations: fillSeries(dayKeys, impersonations),
        operatorsCreated: fillSeries(dayKeys, operatorsCreated),
        auditEvents: fillSeries(dayKeys, auditEvents),
      },
    },
  };
};

const CAFE_SORT_FIELDS = new Set([
  "name",
  "ownerEmail",
  "status",
  "trialEndsAt",
  "createdAt",
]);

const listCafes = async (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const q = String(req.query.q || "").trim();
  const status = String(req.query.status || "").trim();
  const sortByRaw = String(req.query.sortBy || "createdAt").trim();
  const sortBy = CAFE_SORT_FIELDS.has(sortByRaw) ? sortByRaw : "createdAt";
  const sortDir =
    String(req.query.sortDir || "DESC").trim().toUpperCase() === "ASC"
      ? "ASC"
      : "DESC";

  const where = {};
  if (status && status !== "all") where.status = status;
  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { slug: { [Op.iLike]: `%${q}%` } },
      { ownerEmail: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const { rows, count } = await tenantModel.findAndCountAll({
    where,
    order: [
      [sortBy, sortDir],
      ["id", "DESC"],
    ],
    limit,
    offset,
  });

  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      items: rows.map(serializeCafe),
      pagination: { page, limit, total: count, sortBy, sortDir },
    },
  };
};

const getCafe = async (req) => {
  const tenant = await tenantModel.findByPk(req.params.id);
  if (!tenant) {
    return { status: 404, success: false, message: "Cafe not found" };
  }

  const [activityRows, ownerUsername] = await Promise.all([
    platformAuditLogModel.findAll({
      where: { tenantId: tenant.id },
      include: [
        {
          model: platformUserModel,
          as: "actor",
          attributes: ["id", "username", "name"],
          required: false,
        },
      ],
      order: [["id", "DESC"]],
      limit: 15,
    }),
    resolveOwnerUsername(tenant),
  ]);

  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      cafe: serializeCafe(tenant, { ownerUsername }),
      activity: activityRows.map(serializeAuditLog),
    },
  };
};

const createCafe = async (req) => {
  const body = req.body || {};
  const name = String(body.name || "").trim();
  const email = String(body.email || body.ownerEmail || "")
    .trim()
    .toLowerCase();
  const phone = String(body.phone || body.ownerPhone || "").trim() || null;
  const businessType = String(body.businessType || "").trim() || null;
  const address = String(body.address || "").trim() || null;
  const ownerName = String(body.ownerName || "").trim() || name;
  const status =
    String(body.status || "trial").trim().toLowerCase() === "active"
      ? "active"
      : "trial";
  const trialDays =
    status === "trial"
      ? Math.min(90, Math.max(1, Number(body.trialDays) || 14))
      : null;

  if (!name) {
    return { status: 400, success: false, message: "Cafe name is required" };
  }
  if (!email || !email.includes("@")) {
    return {
      status: 400,
      success: false,
      message: "Owner email is required",
    };
  }

  const requestedSlug = String(body.slug || "").trim().toLowerCase();
  let slug = requestedSlug;
  if (slug) {
    try {
      validateSlug(slug);
    } catch (err) {
      return { status: 400, success: false, message: err.message };
    }
    if (RESERVED_SLUGS.includes(slug)) {
      return {
        status: 400,
        success: false,
        message: `Slug "${slug}" is reserved`,
      };
    }
    const taken = await tenantModel.findOne({ where: { slug } });
    if (taken) {
      return {
        status: 409,
        success: false,
        message: `Slug "${slug}" is already taken`,
      };
    }
  } else {
    slug = await nextAvailableSlug(tenantModel, name);
  }

  const usedClientPassword = Boolean(
    body.password && String(body.password).length >= 6,
  );
  if (body.password && !usedClientPassword) {
    return {
      status: 400,
      success: false,
      message: "Password must be at least 6 characters",
    };
  }
  const ownerPassword = usedClientPassword
    ? String(body.password)
    : generateTempPassword();

  const { firstName, lastName } = splitName(ownerName);
  const ownerUsername = (
    String(body.username || "").trim() ||
    String(name).trim() ||
    "owner"
  ).slice(0, 64);

  let result;
  try {
    result = await provisionTenant({
      slug,
      name,
      email,
      password: ownerPassword,
      phone,
      firstName,
      lastName,
      username: ownerUsername,
      trialDays,
      status,
      businessType,
      address,
    });
  } catch (err) {
    return {
      status: err.status || 500,
      success: false,
      message: err.message || "Failed to create cafe",
    };
  }

  const tenant = await tenantModel.findByPk(result.tenantId);
  await writeAudit({
    platformUserId: req.platformUser.id,
    tenantId: result.tenantId,
    action: "create",
    meta: {
      slug: result.slug,
      status: result.status,
      ownerEmail: email,
    },
  });

  queueCafeOwnerMail(
    "cafe_created",
    tenant,
    {
      ownerName,
      ownerUsername,
      ownerPassword: usedClientPassword ? undefined : ownerPassword,
      passwordGenerated: !usedClientPassword,
      status: tenant.status,
    },
    req,
  );

  return {
    status: 201,
    success: true,
    message: "Cafe created",
    data: {
      cafe: serializeCafe(tenant),
      ownerUsername,
      ownerPassword: usedClientPassword ? undefined : ownerPassword,
      passwordGenerated: !usedClientPassword,
    },
  };
};

async function loadCafeOrFail(id) {
  const tenant = await tenantModel.findByPk(id);
  if (!tenant) {
    return { error: { status: 404, success: false, message: "Cafe not found" } };
  }
  return { tenant };
}

const activateCafe = async (req) => {
  const { tenant, error } = await loadCafeOrFail(req.params.id);
  if (error) return error;

  if (tenant.status === "active") {
    return {
      status: 400,
      success: false,
      message: "Cafe is already active",
    };
  }

  const previousStatus = tenant.status;
  const isUnsuspend = previousStatus === "suspended";

  if (isUnsuspend) {
    const restoreStatus =
      tenant.statusBeforeSuspend ||
      (tenant.activatedAt
        ? "active"
        : tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date()
          ? "trial"
          : tenant.trialEndsAt
            ? "expired"
            : "active");

    await tenant.update({
      status: restoreStatus,
      statusBeforeSuspend: null,
    });

    await writeAudit({
      platformUserId: req.platformUser.id,
      tenantId: tenant.id,
      action: "unsuspend",
      meta: { previousStatus, restoredStatus: restoreStatus },
    });

    await tenant.reload();
    queueCafeOwnerMail(
      "cafe_unsuspended",
      tenant,
      { restoredStatus: restoreStatus },
      req,
    );
    return {
      status: 200,
      success: true,
      message: "Cafe unsuspended",
      data: serializeCafe(tenant),
    };
  }

  await tenant.update({
    status: "active",
    activatedAt: tenant.activatedAt || new Date(),
    statusBeforeSuspend: null,
  });

  await writeAudit({
    platformUserId: req.platformUser.id,
    tenantId: tenant.id,
    action: "activate",
    meta: { previousStatus },
  });

  await tenant.reload();
  queueCafeOwnerMail("cafe_activated", tenant, {}, req);
  return {
    status: 200,
    success: true,
    message: "Cafe activated",
    data: serializeCafe(tenant),
  };
};

const suspendCafe = async (req) => {
  const { tenant, error } = await loadCafeOrFail(req.params.id);
  if (error) return error;

  if (tenant.status === "suspended") {
    return {
      status: 400,
      success: false,
      message: "Cafe is already suspended",
    };
  }

  const reason = String(req.body?.reason || "").trim();
  if (!reason) {
    return {
      status: 400,
      success: false,
      message: "Suspension notes are required",
    };
  }

  const previousStatus = tenant.status;
  await tenant.update({
    status: "suspended",
    statusBeforeSuspend: previousStatus,
  });

  await writeAudit({
    platformUserId: req.platformUser.id,
    tenantId: tenant.id,
    action: "suspend",
    meta: { previousStatus, reason },
  });

  await tenant.reload();
  queueCafeOwnerMail("cafe_suspended", tenant, { reason }, req);
  return {
    status: 200,
    success: true,
    message: "Cafe suspended",
    data: serializeCafe(tenant),
  };
};

const extendTrial = async (req) => {
  const { tenant, error } = await loadCafeOrFail(req.params.id);
  if (error) return error;

  const days = Math.min(90, Math.max(1, Number(req.body?.days) || 7));
  const base =
    tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date()
      ? new Date(tenant.trialEndsAt)
      : new Date();
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await tenant.update({
    status: tenant.status === "expired" ? "trial" : tenant.status,
    trialEndsAt: next,
  });

  await writeAudit({
    platformUserId: req.platformUser.id,
    tenantId: tenant.id,
    action: "extend_trial",
    meta: { days, trialEndsAt: next.toISOString() },
  });

  await tenant.reload();
  queueCafeOwnerMail(
    "cafe_trial_extended",
    tenant,
    { days, trialEndsAt: tenant.trialEndsAt },
    req,
  );
  return {
    status: 200,
    success: true,
    message: `Trial extended by ${days} day(s)`,
    data: serializeCafe(tenant),
  };
};

const impersonateCafe = async (req) => {
  const { tenant, error } = await loadCafeOrFail(req.params.id);
  if (error) return error;

  if (!["trial", "active"].includes(tenant.status)) {
    return {
      status: 400,
      success: false,
      message: `Cannot open POS for cafe with status "${tenant.status}"`,
    };
  }

  const [ownerRows] = await sequelize.query(
    `SELECT id, email, "roleId", username
     FROM "${tenant.schemaName}".users
     WHERE "roleId" = 1
     ORDER BY id ASC
     LIMIT 1`,
  );
  const owner = ownerRows[0];
  if (!owner) {
    return {
      status: 404,
      success: false,
      message: "Owner user not found in cafe schema",
    };
  }

  let sessionLog;
  await runWithTenantContext(
    {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        schemaName: tenant.schemaName,
        status: tenant.status,
      },
    },
    async () => {
      sessionLog = await createSessionLog({ id: owner.id }, req);
    },
  );
  const token = generateJWT(
    { id: owner.id, email: owner.email, roleId: owner.roleId },
    tenant,
    sessionLog?.id,
  );

  await writeAudit({
    platformUserId: req.platformUser.id,
    tenantId: tenant.id,
    action: "impersonate",
    meta: { ownerUserId: owner.id, username: owner.username },
  });

  const { buildPosBootstrapUrl } = require("../../lib/pos-public-url");
  const bootstrapUrl = buildPosBootstrapUrl(tenant.slug, token, req);

  return {
    status: 200,
    success: true,
    message: "Impersonation token created",
    data: {
      cafe: serializeCafe(tenant),
      pos: {
        username: owner.username,
        token,
        authHeader: `Admin ${token}`,
        tenantSlug: tenant.slug,
        url: bootstrapUrl,
      },
    },
  };
};

const listJobs = async (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const { rows, count } = await provisioningJobModel.findAndCountAll({
    include: [
      {
        model: tenantModel,
        as: "tenant",
        attributes: ["id", "name", "slug", "status"],
        required: false,
      },
    ],
    order: [["id", "DESC"]],
    limit,
    offset,
  });

  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      items: rows.map((j) => ({
        id: j.id,
        tenantId: j.tenantId,
        cafeName: j.tenant?.name || "—",
        slug: j.tenant?.slug || "—",
        status: j.status,
        errorMessage: j.errorMessage,
        startedAt: j.startedAt,
        finishedAt: j.finishedAt,
      })),
      pagination: { page, limit, total: count },
    },
  };
};

const listAuditLogs = async (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const actor = String(req.query.actor || "").trim();
  const action = String(req.query.action || "").trim();
  const cafe = String(req.query.cafe || "").trim();

  const where = {};
  // Exact action match keeps the action index usable.
  if (action) where.action = action;

  const actorInclude = {
    model: platformUserModel,
    as: "actor",
    attributes: ["id", "username", "name"],
    required: Boolean(actor),
  };
  if (actor) {
    actorInclude.where = {
      [Op.or]: [
        { username: { [Op.iLike]: `%${actor}%` } },
        { name: { [Op.iLike]: `%${actor}%` } },
      ],
    };
  }

  const tenantInclude = {
    model: tenantModel,
    as: "tenant",
    attributes: ["id", "name", "slug"],
    required: Boolean(cafe),
  };
  if (cafe) {
    tenantInclude.where = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${cafe}%` } },
        { slug: { [Op.iLike]: `%${cafe}%` } },
      ],
    };
  }

  const { rows, count } = await platformAuditLogModel.findAndCountAll({
    where,
    include: [actorInclude, tenantInclude],
    order: [["id", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      items: rows.map((log) => ({
        id: log.id,
        actor: log.actor?.username || "system",
        actorName: log.actor?.name || null,
        action: log.action,
        cafeName: log.tenant?.name || null,
        cafeSlug: log.tenant?.slug || null,
        meta: log.meta
          ? typeof log.meta === "string"
            ? log.meta
            : JSON.stringify(log.meta)
          : null,
        createdAt: log.createdAt,
      })),
      pagination: { page, limit, total: count },
    },
  };
};

/** Seed / sync platform owner from env. Requires PLATFORM_ADMIN_PASSWORD. */
const ensureSeedUser = async () => {
  const username = normalizeUsername(
    process.env.PLATFORM_ADMIN_USERNAME ||
      String(process.env.PLATFORM_ADMIN_EMAIL || "technirvana").split("@")[0] ||
      "technirvana",
  );
  const password = String(process.env.PLATFORM_ADMIN_PASSWORD || "");
  const name = process.env.PLATFORM_ADMIN_NAME || "Tech Nirvana";

  if (!password || password.length < PLATFORM_PASSWORD_MIN) {
    throw new Error(
      `PLATFORM_ADMIN_PASSWORD is required (min ${PLATFORM_PASSWORD_MIN} chars) to seed the platform owner. Do not use a documented default password.`,
    );
  }

  const existing = await platformUserModel.findOne({ where: { username } });
  if (existing) {
    const updates = {
      passwordHash: await hashPassword(password),
      name: existing.name || name,
      isActive: true,
    };
    if (!normalizePlatformRole(existing.platformRole)) {
      updates.platformRole = "owner";
      updates.permissions = [];
    }
    await existing.update(updates);
    return existing;
  }

  return platformUserModel.create({
    username,
    name,
    passwordHash: await hashPassword(password),
    platformRole: "owner",
    permissions: [],
    isActive: true,
  });
};

function serializePlatformUser(user) {
  const row = user.toJSON ? user.toJSON() : user;
  const platformRole = normalizePlatformRole(row.platformRole) || "operator";
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    imageUrl: row.imageUrl || null,
    platformRole,
    platformRoleLabel: PLATFORM_ROLE_LABELS[platformRole] || platformRole,
    permissions: permissionsForUser(row),
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function countActiveOwners(excludeId) {
  const where = {
    platformRole: "owner",
    isActive: true,
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return platformUserModel.count({ where });
}

const listPlatformUsers = async (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  const { rows, count } = await platformUserModel.findAndCountAll({
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    limit,
    offset,
  });

  return {
    status: 200,
    success: true,
    message: "OK",
    data: {
      items: rows.map(serializePlatformUser),
      permissionOptions: OPERATOR_PERMISSION_META,
      pagination: { page, limit, total: count },
    },
  };
};

const createPlatformUser = async (req) => {
  const body = req.body || {};
  const username = normalizeUsername(body.username);
  const name = String(body.name || "").trim();
  const password = String(body.password || "");
  // New accounts are operators with checkbox permissions (owners are seeded).
  const platformRole = "operator";
  const permissions = sanitizePermissions(body.permissions);

  if (!username || username.length < 3) {
    return {
      status: 400,
      success: false,
      message: "Username must be at least 3 characters (a-z, 0-9, . _ -)",
    };
  }
  if (!name) {
    return { status: 400, success: false, message: "Name is required" };
  }
  if (password.length < PLATFORM_PASSWORD_MIN) {
    return {
      status: 400,
      success: false,
      message: `Password must be at least ${PLATFORM_PASSWORD_MIN} characters`,
    };
  }
  if (!permissions.length) {
    return {
      status: 400,
      success: false,
      message: "Select at least one permission for the operator",
    };
  }

  const existing = await platformUserModel.findOne({ where: { username } });
  if (existing) {
    return {
      status: 409,
      success: false,
      message: "This username is already taken",
    };
  }

  try {
    const { claimUsername } = require("../../lib/global-username");
    await claimUsername(username, { source: "platform" });
  } catch (err) {
    return {
      status: err.status || 500,
      success: false,
      message: err.message || "Could not reserve username",
    };
  }

  const user = await platformUserModel.create({
    username,
    name,
    passwordHash: await hashPassword(password),
    platformRole,
    permissions,
    isActive: true,
  });

  await writeAudit({
    platformUserId: req.platformUser.id,
    action: "platform_user.create",
    meta: { targetUserId: user.id, username, platformRole, permissions },
  });

  return {
    status: 201,
    success: true,
    message: "Operator created",
    data: serializePlatformUser(user),
  };
};

const updatePlatformUser = async (req) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return { status: 400, success: false, message: "Invalid user id" };
  }

  const user = await platformUserModel.findByPk(id);
  if (!user) {
    return { status: 404, success: false, message: "Platform user not found" };
  }

  const body = req.body || {};
  const updates = {};
  const previous = {
    name: user.name,
    platformRole: user.platformRole,
    permissions: user.permissions,
    isActive: user.isActive,
  };

  if (body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) {
      return { status: 400, success: false, message: "Name cannot be empty" };
    }
    updates.name = name;
  }

  if (body.permissions !== undefined) {
    if (normalizePlatformRole(user.platformRole) === "owner") {
      // Owners always have all permissions; ignore checkbox payload.
      updates.permissions = [];
    } else {
      const nextPerms = sanitizePermissions(body.permissions);
      if (!nextPerms.length) {
        return {
          status: 400,
          success: false,
          message: "Select at least one permission for the operator",
        };
      }
      updates.permissions = nextPerms;
    }
  }

  if (body.isActive !== undefined) {
    updates.isActive = Boolean(body.isActive);
  }

  if (body.password !== undefined && String(body.password).length > 0) {
    if (String(body.password).length < PLATFORM_PASSWORD_MIN) {
      return {
        status: 400,
        success: false,
        message: `Password must be at least ${PLATFORM_PASSWORD_MIN} characters`,
      };
    }
    updates.passwordHash = await hashPassword(String(body.password));
  }

  const nextActive =
    updates.isActive !== undefined ? updates.isActive : user.isActive;
  const wasOwner =
    normalizePlatformRole(user.platformRole) === "owner" && user.isActive;

  if (wasOwner && nextActive === false) {
    const otherOwners = await countActiveOwners(user.id);
    if (otherOwners < 1) {
      return {
        status: 400,
        success: false,
        message: "Cannot deactivate the last Owner",
      };
    }
  }

  if (user.id === req.platformUser.id && updates.isActive === false) {
    return {
      status: 400,
      success: false,
      message: "You cannot deactivate your own account",
    };
  }

  if (Object.keys(updates).length === 0) {
    return {
      status: 200,
      success: true,
      message: "No changes",
      data: serializePlatformUser(user),
    };
  }

  await user.update(updates);
  await user.reload();

  const next = {
    name: user.name,
    platformRole: user.platformRole,
    permissions: user.permissions,
    isActive: user.isActive,
  };

  const changes = {};
  if (previous.name !== next.name) {
    changes.name = { from: previous.name, to: next.name };
  }
  if (previous.platformRole !== next.platformRole) {
    changes.platformRole = {
      from: previous.platformRole,
      to: next.platformRole,
    };
  }
  if (previous.isActive !== next.isActive) {
    changes.isActive = { from: previous.isActive, to: next.isActive };
  }
  {
    const prevPerms = Array.isArray(previous.permissions)
      ? [...previous.permissions].map(String).sort()
      : [];
    const nextPerms = Array.isArray(next.permissions)
      ? [...next.permissions].map(String).sort()
      : [];
    const same =
      prevPerms.length === nextPerms.length &&
      prevPerms.every((value, i) => value === nextPerms[i]);
    if (!same) {
      changes.permissions = {
        from: previous.permissions || [],
        to: next.permissions || [],
      };
    }
  }
  if (updates.passwordHash) {
    changes.passwordChanged = true;
  }

  const action =
    previous.isActive && updates.isActive === false
      ? "platform_user.deactivate"
      : "platform_user.update";

  await writeAudit({
    platformUserId: req.platformUser.id,
    action,
    meta: {
      targetUserId: user.id,
      username: user.username,
      name: user.name,
      changes,
    },
  });

  return {
    status: 200,
    success: true,
    message: "Operator updated",
    data: serializePlatformUser(user),
  };
};

const deletePlatformUser = async (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return { status: 400, success: false, message: "Invalid user id" };
  }

  const user = await platformUserModel.findByPk(id);
  if (!user) {
    return { status: 404, success: false, message: "Platform user not found" };
  }

  if (user.id === req.platformUser.id) {
    return {
      status: 400,
      success: false,
      message: "You cannot delete your own account",
    };
  }

  if (normalizePlatformRole(user.platformRole) === "owner") {
    return {
      status: 400,
      success: false,
      message: "Cannot delete an Owner account",
    };
  }

  const snapshot = {
    targetUserId: user.id,
    username: user.username,
    name: user.name,
  };

  await writeAudit({
    platformUserId: req.platformUser.id,
    action: "platform_user.delete",
    meta: snapshot,
  });

  await user.destroy();

  return {
    status: 200,
    success: true,
    message: "Operator deleted",
    data: { id: snapshot.targetUserId },
  };
};

module.exports = {
  login,
  me,
  updateMe,
  changeMyPassword,
  uploadMyAvatar,
  stats,
  statsTrends,
  listCafes,
  getCafe,
  createCafe,
  activateCafe,
  suspendCafe,
  extendTrial,
  impersonateCafe,
  listJobs,
  listAuditLogs,
  listPlatformUsers,
  createPlatformUser,
  updatePlatformUser,
  deletePlatformUser,
  ensureSeedUser,
};

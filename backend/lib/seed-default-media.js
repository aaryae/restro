"use strict";

const fs = require("fs/promises");
const path = require("path");
const { setTenantSearchPath } = require("./run-tenant-migrations");

const SEEDERS_ROOT = path.join(__dirname, "..", "seeders");
const RESOURCES_ROOT = path.join(__dirname, "..", "resources");

/** Stable on-disk prefix so re-seeding never duplicates binary files. */
const RESOURCE_PREFIX = "default-";

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Default Media library folders shipped with Serve.
 * Source folders live under backend/seeders/<folder>/.
 */
const DEFAULT_MEDIA_FOLDERS = [
  {
    name: "Food",
    slug: "food",
    folder: "food",
    captionPrefix: "Food — ",
  },
  {
    name: "Drinks & Coffee",
    slug: "drinks-coffee",
    folder: "drinks",
    captionPrefix: "Drinks — ",
  },
  {
    name: "Bakery",
    slug: "bakery",
    folder: "bakery",
    captionPrefix: "Bakery — ",
  },
];

function slugifyFileName(fileName) {
  const parsed = path.parse(fileName);
  const base = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${RESOURCE_PREFIX}${base}${parsed.ext.toLowerCase()}`;
}

function displayName(fileName) {
  return path.parse(fileName).name.replace(/\s+/g, " ").trim();
}

/** Human-facing library name — never the on-disk `default-…` prefix. */
function libraryName(fileName) {
  const parsed = path.parse(fileName);
  return `${displayName(fileName)}${parsed.ext.toLowerCase()}`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listImageFiles(dir) {
  try {
    const entries = await fs.readdir(dir);
    const images = [];
    for (const file of entries) {
      const full = path.join(dir, file);
      const stat = await fs.stat(full);
      if (!stat.isFile()) continue;
      const ext = path.extname(file).toLowerCase();
      if (!MIME_BY_EXT[ext]) continue;
      images.push(file);
    }
    return images.sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function ensureResourceCopy(sourcePath, targetFileName) {
  await ensureDir(RESOURCES_ROOT);
  const targetPath = path.join(RESOURCES_ROOT, targetFileName);
  try {
    await fs.access(targetPath);
  } catch {
    await fs.copyFile(sourcePath, targetPath);
  }
  const stats = await fs.stat(targetPath);
  const ext = path.extname(targetFileName).toLowerCase();
  return {
    dbPath: `resources/${targetFileName}`,
    sizeInBytes: String(stats.size),
    mimeType: MIME_BY_EXT[ext] || "application/octet-stream",
  };
}

async function ensureMediaCategory(sequelize, schemaName, { name, slug }) {
  const [existing] = await sequelize.query(
    `SELECT id FROM "${schemaName}".media_categories WHERE slug = :slug LIMIT 1`,
    { replacements: { slug } },
  );
  if (existing[0]?.id) return existing[0].id;

  const now = new Date();
  const [inserted] = await sequelize.query(
    `INSERT INTO "${schemaName}".media_categories
      (name, slug, "createdAt", "updatedAt")
     VALUES (:name, :slug, :now, :now)
     RETURNING id`,
    { replacements: { name, slug, now } },
  );
  return inserted[0].id;
}

/**
 * Copy packaged default photos into resources/ and register them in the
 * tenant Media library. Idempotent: skips categories/files already present.
 */
async function seedDefaultMedia(sequelize, schemaName, options = {}) {
  const { createdBy = null } = options;
  await setTenantSearchPath(sequelize, schemaName);

  let categoriesCreated = 0;
  let mediaCreated = 0;
  let mediaSkipped = 0;

  for (const folder of DEFAULT_MEDIA_FOLDERS) {
    const sourceDir = path.join(SEEDERS_ROOT, folder.folder);
    const files = await listImageFiles(sourceDir);
    if (!files.length) {
      console.warn(
        `[default-media] No images in seeders/${folder.folder} — skipping`,
      );
      continue;
    }

    const [before] = await sequelize.query(
      `SELECT id FROM "${schemaName}".media_categories WHERE slug = :slug LIMIT 1`,
      { replacements: { slug: folder.slug } },
    );
    const categoryId = await ensureMediaCategory(sequelize, schemaName, folder);
    if (!before.length) categoriesCreated += 1;

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetFileName = slugifyFileName(file);
      const { dbPath, sizeInBytes, mimeType } = await ensureResourceCopy(
        sourcePath,
        targetFileName,
      );

      const [existingMedia] = await sequelize.query(
        `SELECT id, name FROM "${schemaName}".media WHERE path = :path LIMIT 1`,
        { replacements: { path: dbPath } },
      );
      const title = displayName(file);
      const prettyName = libraryName(file);

      if (existingMedia.length) {
        // Older seeds stored the on-disk `default-…` filename as the display name.
        if (
          String(existingMedia[0].name || "").toLowerCase().startsWith("default-")
        ) {
          await sequelize.query(
            `UPDATE "${schemaName}".media
             SET name = :name, caption = :caption, description = :description, "updatedAt" = :now
             WHERE id = :id`,
            {
              replacements: {
                id: existingMedia[0].id,
                name: prettyName,
                caption: title,
                description: title,
                now: new Date(),
              },
            },
          );
        }
        mediaSkipped += 1;
        continue;
      }

      const now = new Date();
      await sequelize.query(
        `INSERT INTO "${schemaName}".media
          ("mediaCategoryId", name, path, caption, description,
           "sizeInBytes", "mimeType", "createdBy", "createdAt", "updatedAt")
         VALUES
          (:categoryId, :name, :path, :caption, :description,
           :sizeInBytes, :mimeType, :createdBy, :now, :now)`,
        {
          replacements: {
            categoryId,
            name: prettyName,
            path: dbPath,
            caption: title,
            description: title,
            sizeInBytes,
            mimeType,
            createdBy,
            now,
          },
        },
      );
      mediaCreated += 1;
    }
  }

  return { categoriesCreated, mediaCreated, mediaSkipped };
}

module.exports = {
  DEFAULT_MEDIA_FOLDERS,
  seedDefaultMedia,
};

/**
 * @file softDelete.js
 * @brief Helper utilities for soft-delete and metadata fields.
 *
 * Provides functions to build filters that exclude soft-deleted
 * documents and to generate metadata for create, update, and
 * soft-delete operations.
 */

/**
 * @brief Add a soft-delete filter to a query.
 *
 * Ensures that only documents where `deleted_at` is not set are
 * matched by the filter.
 *
 * @param {Object} [filter={}] Base MongoDB filter object.
 * @returns {Object} Filter extended with soft-delete condition.
 */
export function addSoftDeleteFilter(filter = {}) {
  return {
    ...filter,
    deleted_at: { $exists: false }
  };
}

/**
 * @brief Build metadata for document creation.
 *
 * Typically used when inserting new documents into collections.
 *
 * @param {{ username?: string }} [user] Authenticated user object.
 * @returns {{ created_at: Date, created_by: string }} Metadata fields.
 */
export function getCreateMetadata(user) {
  return {
    created_at: new Date(),
    created_by: user?.username || "system"
  };
}

/**
 * @brief Build metadata for document update.
 *
 * Typically used when updating existing documents.
 *
 * @param {{ username?: string }} [user] Authenticated user object.
 * @returns {{ updated_at: Date, updated_by: string }} Metadata fields.
 */
export function getUpdateMetadata(user) {
  return {
    updated_at: new Date(),
    updated_by: user?.username || "system"
  };
}

/**
 * @brief Build metadata for soft deletion.
 *
 * Sets `deleted_at` and `deleted_by` instead of removing the document.
 *
 * @param {{ username?: string }} [user] Authenticated user object.
 * @returns {{ deleted_at: Date, deleted_by: string }} Metadata fields.
 */
export function getDeleteMetadata(user) {
  return {
    deleted_at: new Date(),
    deleted_by: user?.username || "system"
  };
}


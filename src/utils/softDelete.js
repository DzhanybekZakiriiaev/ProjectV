/**
 * Adds soft-delete filter to exclude documents where deleted_at is set
 */
export function addSoftDeleteFilter(filter = {}) {
  return {
    ...filter,
    deleted_at: { $exists: false }
  };
}

/**
 * Get metadata for document creation
 */
export function getCreateMetadata(user) {
  return {
    created_at: new Date(),
    created_by: user?.username || "system"
  };
}

/**
 * Get metadata for document update
 */
export function getUpdateMetadata(user) {
  return {
    updated_at: new Date(),
    updated_by: user?.username || "system"
  };
}

/**
 * Get metadata for soft deletion
 */
export function getDeleteMetadata(user) {
  return {
    deleted_at: new Date(),
    deleted_by: user?.username || "system"
  };
}


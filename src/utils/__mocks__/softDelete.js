export const addSoftDeleteFilter = jest.fn((filter) => ({
  ...filter,
  deleted_at: { $exists: false }
}));

export const getCreateMetadata = jest.fn((user) => ({
  created_at: new Date(),
  created_by: user?.username || 'system'
}));

export const getUpdateMetadata = jest.fn((user) => ({
  updated_at: new Date(),
  updated_by: user?.username || 'system'
}));

export const getDeleteMetadata = jest.fn((user) => ({
  deleted_at: new Date(),
  deleted_by: user?.username || 'system'
}));


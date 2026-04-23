import { test, mock, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { updateCategory } from '../../../app/admin/categories/actions';
import { prisma } from '../../../lib/prisma';

describe('updateCategory action', () => {
  let originalUpdate: any;

  beforeEach(() => {
    mock.restoreAll();
    mock.method(console, 'error', () => {});
    originalUpdate = prisma.category.update;
  });

  afterEach(() => {
    // Restore the original Prisma method to avoid leaking
    Object.defineProperty(prisma.category, 'update', {
      value: originalUpdate,
      configurable: true
    });
  });

  test('returns error when prisma throws (e.g. duplicate slug)', async () => {
    // 1. Arrange
    const id = 'category-123';
    const formData = new FormData();
    formData.append('name', 'Existing Category');
    formData.append('slug', 'existing-category');

    // To mock prisma since it uses proxies:
    Object.defineProperty(prisma.category, 'update', {
      value: async () => {
        throw new Error('Unique constraint violation on slug');
      },
      configurable: true
    });

    // 2. Act
    const result = await updateCategory(id, formData);

    // 3. Assert
    assert.deepStrictEqual(result, {
      success: false,
      error: 'El slug o el nombre ya existen.'
    });
  });
});

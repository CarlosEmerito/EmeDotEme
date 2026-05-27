import { test, mock } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../../lib/prisma';
import { createCategory } from '../../../app/admin/categories/actions';

test('createCategory handles error when prisma throws', async () => {
  // Mock the Prisma create method to throw an error
  const mockCreate = mock.fn(async () => {
    throw new Error('Prisma error: Unique constraint failed');
  });

  // Replace the original with the mock
  const originalCreate = prisma.category.create;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.category.create = mockCreate as any;

  // Mock console.error to avoid noise in test output
  const originalConsoleError = console.error;
  console.error = mock.fn();

  try {
    const formData = new FormData();
    formData.append('name', 'Test Category');
    formData.append('slug', 'test-category');

    const result = await createCategory(formData);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'El slug o el nombre ya existen.');
    assert.strictEqual(mockCreate.mock.calls.length, 1);
  } finally {
    // Restore mocks
    prisma.category.create = originalCreate;
    console.error = originalConsoleError;
  }
});

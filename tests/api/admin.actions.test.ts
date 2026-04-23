import { test, mock } from 'node:test';
import assert from 'node:assert';
import { deleteArticle } from '../../app/admin/actions.ts';
import { prisma } from '../../lib/prisma.ts';

test('deleteArticle - error path', async () => {
    // Mock prisma.article.delete to throw an error
    const originalDelete = prisma.article.delete;
    prisma.article.delete = mock.fn(() => {
        throw new Error('Database connection failed');
    }) as any;

    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = mock.fn();

    try {
        const result = await deleteArticle('some-id');

        assert.deepStrictEqual(result, {
            success: false,
            error: "No se pudo borrar el artículo."
        });

        // Ensure console.error was called
        assert.strictEqual((console.error as any).mock.calls.length, 1);
    } finally {
        // Restore mocks
        prisma.article.delete = originalDelete;
        console.error = originalConsoleError;
        mock.restoreAll();
    }
});

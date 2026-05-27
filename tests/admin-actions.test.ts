/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma.ts';

test('togglePublishStatus error path', async () => {
    // Save original method
    const originalUpdate = prisma.article.update;
    let callCount = 0;

    // Mock the update method to simulate a database failure
    (prisma.article as any).update = async () => {
        callCount++;
        throw new Error('Simulated DB Error');
    };

    try {
        // Dynamically import the action to ensure it uses our mocked prisma object
        const { togglePublishStatus } = await import('../app/admin/actions.ts');

        // Execute the action
        const result = await togglePublishStatus('123', true);

        // Assert the expected error payload was returned
        assert.deepStrictEqual(result, { success: false, error: "No se pudo actualizar el estado." });
        assert.strictEqual(callCount, 1, "Expected prisma.article.update to be called exactly once");
    } finally {
        // Restore the original method
        (prisma.article as any).update = originalUpdate;
    }
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { R } = require("redbean-node");
const Monitor = require("../../server/model/monitor");

// Exercise the transition handling without sending actual notifications.
test("dependency defers failures and reconciles recovery", async () => {
    let pending = 0;
    let available = false;
    let delivered = [];
    const original = { getCell: R.getCell, exec: R.exec, available: Monitor.dependencyAvailable, send: Monitor.sendNotification };
    R.getCell = async () => pending;
    R.exec = async (_sql, params) => {
        pending = params[0];
    };
    Monitor.dependencyAvailable = async () => available;
    const monitor = { id: 10, dependencyId: 20 };
    try {
        await Monitor.sendNotification(false, monitor, { status: 0 });
        assert.equal(pending, 1);
        await Monitor.sendNotification(false, monitor, { status: 1 });
        assert.equal(pending, 0, "a recovered suppressed failure sends no recovery alert");
        await Monitor.sendNotification(false, monitor, { status: 0 });
        available = true;
        Monitor.sendNotification = async (_first, _monitor, beat) => {
            delivered.push(beat.status);
            pending = 0;
        };
        await Monitor.flushDependencyNotification(monitor, { status: 0 });
        assert.deepEqual(delivered, [0], "a persistent failure is notified after recovery");
    } finally {
        R.getCell = original.getCell;
        R.exec = original.exec;
        Monitor.dependencyAvailable = original.available;
        Monitor.sendNotification = original.send;
    }
});

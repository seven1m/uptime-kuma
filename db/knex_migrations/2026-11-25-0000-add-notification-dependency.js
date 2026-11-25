exports.up = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.integer("dependency_id").nullable().references("id").inTable("monitor").onDelete("SET NULL");
        table.integer("dependency_pending").notNullable().defaultTo(0);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.dropColumn("dependency_id");
        table.dropColumn("dependency_pending");
    });
};

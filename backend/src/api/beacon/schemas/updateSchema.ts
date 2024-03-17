import createSchema from "./createSchema";

const updateSchema = { ...createSchema };
for (const key in createSchema) {
    updateSchema[key] = createSchema[key];
    updateSchema[key].optional = { options: {} };
}
delete updateSchema.callsign;
export default updateSchema;

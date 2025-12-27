import createSchema from "./createSchema";

const updateSchema = createSchema;
for (const key in createSchema) {
  updateSchema[key] = createSchema[key];
  updateSchema[key].optional = { options: {} };
}
updateSchema.isAdmin = {
  isBoolean: { options: [] },
  optional: true,
  toBoolean: true,
  errorMessage: "isAdmin must be a boolean",
};
updateSchema.isVerified = {
  isBoolean: { options: [] },
  optional: true,
  toBoolean: true,
  errorMessage: "isVerified must be a boolean",
};
export default updateSchema;

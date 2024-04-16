import { Schema } from "express-validator";
import { Errors } from "../../errors";

const createSchema: Schema = {
    title: {
        isString: { options: [] },
        isLength: { options: { min: 1, max: 100 } },
        errorMessage: Errors.INVALID_TITLE
    },
    contentMd: {
        isString: { options: [] },
        errorMessage: Errors.INVALID_CONTENT
    },
    tags: {
        errorMessage: Errors.INVALID_TAGS,
        custom: {
            // tags should be a string array that must be parsed from JSON
            options: (tags: unknown) => {
                let parsed;

                if (typeof tags === "string") {
                    try {
                        parsed = JSON.parse(tags);
                    } catch (e) {
                        return false;
                    }

                    if (!Array.isArray(parsed)) {
                        return false;
                    }
                    for (const tag of parsed) {
                        if (
                            typeof tag !== "string" ||
                            tag.length < 1 ||
                            tag.length > 20
                        ) {
                            return false;
                        }
                    }
                    return true;
                }
            }
        }
    }
};
export default createSchema;

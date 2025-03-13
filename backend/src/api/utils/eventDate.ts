import moment from "moment";
import type { UserDoc } from "../auth/models";

// used to filter events. user isAdmin => any date, else within 7 days
export const getEventDate = ({ isAdmin }: Pick<UserDoc, "isAdmin">) => {
    return isAdmin
        ? {}
        : {
              date: {
                  $gte: moment().subtract(1, "day").toDate(),
                  $lte: moment().add(7, "days").toDate()
              }
          };
};

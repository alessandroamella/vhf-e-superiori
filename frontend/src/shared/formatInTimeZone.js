import { it } from "date-fns/locale";
import { format, toZonedTime } from "date-fns-tz";

export const formatInTimeZone = (date, tz, fmt, ...params) => {
  return format(toZonedTime(date, tz), fmt, {
    timeZone: tz,
    locale: it,
    ...params,
  });
};

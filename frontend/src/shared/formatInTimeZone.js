import { it } from "date-fns/locale";
import { format, utcToZonedTime } from "date-fns-tz";

export const formatInTimeZone = (date, tz, fmt, ...params) => {
  return format(utcToZonedTime(date, tz), fmt, {
    timeZone: tz,
    locale: it,
    ...params,
  });
};

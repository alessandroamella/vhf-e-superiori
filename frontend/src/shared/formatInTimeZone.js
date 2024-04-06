import { format, utcToZonedTime } from "date-fns-tz";
import { it } from "date-fns/locale";

export const formatInTimeZone = (date, tz, fmt, ...params) => {
  return format(utcToZonedTime(date, tz), fmt, {
    timeZone: tz,
    locale: it,
    ...params
  });
};

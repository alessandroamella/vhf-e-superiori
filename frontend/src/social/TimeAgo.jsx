import { formatDistanceToNow } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import PropTypes from "prop-types";

const TimeAgo = ({ createdAt }) => {
  // Converte la data in ora locale.
  const zonedDate = utcToZonedTime(
    new Date(createdAt),
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Calcola la differenza tra la data attuale e la data di creazione del post.
  const timeAgo = formatDistanceToNow(zonedDate, { addSuffix: false });

  // Abbreviazione delle unità di tempo
  const abbreviate = (str, full, abbr) =>
    str.replace(new RegExp(`${full}s?`, "g"), abbr);

  // Formatta la stringa in un formato abbreviato.
  const abbreviatedTimeAgo = timeAgo
    .replace("about", "")
    .replace("less than a minute ago", "1m")
    .split(" ")
    .map(word => abbreviate(word, "minute", "m"))
    .map(word => abbreviate(word, "hour", "h"))
    .map(word => abbreviate(word, "day", "g"))
    .map(word => abbreviate(word, "month", "M"))
    .map(word => abbreviate(word, "year", "a"))
    .join(" ")
    .trim(); // Rimuove eventuali spazi bianchi all'inizio o alla fine.

  return <span>{abbreviatedTimeAgo}</span>;
};
TimeAgo.propTypes = {
  createdAt: PropTypes.string.isRequired
};

export default TimeAgo;

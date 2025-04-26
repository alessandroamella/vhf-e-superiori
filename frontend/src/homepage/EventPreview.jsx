import { Button, Typography } from "@material-tailwind/react";
import { it } from "date-fns/locale";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { formatInTimeZone } from "../shared/formatInTimeZone";
import PropTypes from "prop-types";

const EventPreview = ({ event, ...props }) => {
  return (
    <div
      {...props}
      className="p-4 h-full min-h-[24rem] flex flex-col md:flex-row justify-center items-center"
    >
      {/* *          - name
       *          - description
       *          - date
       *          - joinDeadline
       *          - logoUrl
       *          - joinRequests */}

      <div className="w-full clamp flex flex-col justify-center mr-0 mb-4 md:mr-8 mb:mb-0">
        <LazyLoadImage
          className="max-h-[69vh] object-contain overflow-hidden"
          src={event.logoUrl}
          alt="Event logo"
        />
      </div>
      <div className="w-full flex flex-col items-start">
        <Typography variant="h1">{event.name}</Typography>

        <div className="text-gray-600 mt-2 mb-4">
          {formatInTimeZone(
            new Date(event.date),
            "Europe/Rome",
            "📅 dd/MM/yyyy  🕒 HH:mm",
            {
              locale: it
            }
          )}
        </div>

        {event.description && (
          <div
            className="line-clamp-5 mt-3"
            dangerouslySetInnerHTML={{
              __html: event.description
            }}
          />
        )}

        <div className="mt-5 md:ml-2 hover:animate-pulse focus:animate-ping">
          <Button>{t('view')}</Button>
        </div>
        {/* <h3 className="font-medium tracking-tight text-xl uppercase">
        </h3> */}
      </div>
    </div>
  );
};

EventPreview.propTypes = {
  event: PropTypes.object.isRequired
};

EventPreview.displayName = "EventPreview";

export default EventPreview;

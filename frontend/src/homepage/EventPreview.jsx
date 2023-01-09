import React from "react";

const EventPreview = ({ event }) => {
    return (
        <div className="border rounded p-4 min-h-[24rem] flex">
            {/* *          - name
             *          - description
             *          - date
             *          - joinDeadline
             *          - logoUrl
             *          - joinRequests */}

            <img
                className="max-h-96 object-cover overflow-hidden"
                src={event.logoUrl}
                alt="Event logo"
                loading="lazy"
            />
            <div>
                <h3 className="font-medium tracking-tight text-xl uppercase">
                    {event.name}
                </h3>
                <div dangerouslySetInnerHTML={{ __html: event.description }} />
            </div>
        </div>
    );
};

export default EventPreview;

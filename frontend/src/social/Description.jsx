import React from "react";
import ReactPlaceholder from "react-placeholder";
import "react-placeholder/lib/reactPlaceholder.css";

const Description = React.memo(({ description }) => (
  <h5 className="text-2xl font-bold tracking-tight break-normal text-ellipsis overflow-hidden w-full">
    <ReactPlaceholder
      showLoadingAnimation
      type="text"
      rows={1}
      ready={!!description}
    >
      {description}
    </ReactPlaceholder>
  </h5>
));

export default Description;

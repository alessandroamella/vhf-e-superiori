import React from "react";
import PropTypes from "prop-types";
import ReactPlaceholder from "react-placeholder";

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
Description.propTypes = {
  description: PropTypes.string
};

Description.displayName = "Description";

export default Description;

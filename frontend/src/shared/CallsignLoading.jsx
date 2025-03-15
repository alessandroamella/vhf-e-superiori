import { Badge } from "flowbite-react";
import PropTypes from "prop-types";
import ReactPlaceholder from "react-placeholder";

const CallsignLoading = ({ user, className, prefix, suffix }) => {
  return (
    <div className="flex items-center gap-2">
      <ReactPlaceholder
        showLoadingAnimation
        type="text"
        ready={!!user?.callsign}
      >
        {prefix}
        <span className={`${className || ""}`}>{user?.callsign}</span>
        {user?.isDev && (
          <Badge color="purple" className="normal-case min-w-fit">
            Dev 👨‍💻
          </Badge>
        )}
        {user?.isAdmin && (
          <Badge color="pink" className="normal-case min-w-fit">
            Admin 🛡️
          </Badge>
        )}
        {suffix}
      </ReactPlaceholder>
    </div>
  );
};

CallsignLoading.propTypes = {
  user: PropTypes.object,
  className: PropTypes.string,
  prefix: PropTypes.node,
  suffix: PropTypes.node
};

CallsignLoading.displayName = "CallsignLoading";

export default CallsignLoading;

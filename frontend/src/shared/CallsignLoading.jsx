import { Badge } from "flowbite-react";
import ReactPlaceholder from "react-placeholder";
import PropTypes from "prop-types";

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
        {user?.isDev && <Badge color="purple">Dev 👨‍💻</Badge>}
        {user?.isAdmin && <Badge color="pink">Admin 🛡️</Badge>}
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

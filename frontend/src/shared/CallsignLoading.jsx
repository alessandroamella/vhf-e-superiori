import classNames from "classnames";
import { Badge, Tooltip } from "flowbite-react";
import PropTypes from "prop-types";
import ReactPlaceholder from "react-placeholder";

const DevBadge = ({ short }) => {
  return (
    <Badge color="purple" className="normal-case min-w-fit">
      {!short && "Dev "} 👨‍💻
    </Badge>
  );
};
DevBadge.propTypes = {
  short: PropTypes.bool,
};

const AdminBadge = ({ short }) => {
  return (
    <Badge color="pink" className="normal-case min-w-fit">
      {/* Admin 🛡️ */}
      {!short && "Admin "} 🛡️
    </Badge>
  );
};
AdminBadge.propTypes = {
  short: PropTypes.bool,
};

const CallsignLoading = ({ user, className, prefix, suffix, short }) => {
  return (
    <div className="flex items-center gap-2">
      <ReactPlaceholder
        showLoadingAnimation
        type="text"
        ready={!!user?.callsign}
      >
        {prefix}
        <span className={`${className || ""}`}>{user?.callsign}</span>
        <div
          className={classNames("flex gap-2", {
            "flex-row": !short,
            "flex-col": short,
          })}
        >
          {user?.isDev &&
            (short ? (
              <Tooltip content="Developer" className="min-w-fit">
                <DevBadge short />
              </Tooltip>
            ) : (
              <DevBadge />
            ))}
          {user?.isAdmin &&
            (short ? (
              <Tooltip content="Amministatore" className="min-w-fit">
                <AdminBadge short />
              </Tooltip>
            ) : (
              <AdminBadge />
            ))}
        </div>
        {suffix}
      </ReactPlaceholder>
    </div>
  );
};

CallsignLoading.propTypes = {
  user: PropTypes.object,
  className: PropTypes.string,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  short: PropTypes.bool,
};

CallsignLoading.displayName = "CallsignLoading";

export default CallsignLoading;

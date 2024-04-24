import { Badge } from "flowbite-react";
import React from "react";
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
        {user?.isDev && <Badge color="purple">Dev 👨‍💻</Badge>}
        {user?.isAdmin && <Badge color="pink">Admin 🛡️</Badge>}
        {suffix}
      </ReactPlaceholder>
    </div>
  );
};

export default CallsignLoading;

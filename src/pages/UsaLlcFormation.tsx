import { Navigate } from "react-router-dom";

// All US LLC formation entry points now flow through the Choose State step first.
const UsaLlcFormation = () => <Navigate to="/usa-services/us-llc-formation/choose-state" replace />;

export default UsaLlcFormation;

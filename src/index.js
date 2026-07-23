import MedicalControllerMainMenu from "./menus/MedicalControllerMainMenu";
import MissionsPage from "./pages/MissionsPage";
import messages_en from "./translations/en.json";
import reducer from "./reducer";
import { ROUTE_MEDICAL_CONTROLLER_MISSIONS } from "./constants";

const DEFAULT_CONFIG = {
  translations: [{ key: "en", messages: messages_en }],
  reducers: [{ key: "medical_controller", reducer }],
  refs: [{ key: "medical_controller.route.missions", ref: ROUTE_MEDICAL_CONTROLLER_MISSIONS }],
  "core.Router": [{ path: ROUTE_MEDICAL_CONTROLLER_MISSIONS, component: MissionsPage }],
  "core.MainMenu": [MedicalControllerMainMenu],
};

export const MedicalControllerModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};

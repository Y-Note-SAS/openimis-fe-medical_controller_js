import MedicalControllerMainMenu from "./menus/MedicalControllerMainMenu";
import MedicalControllerPicker from "./pickers/MedicalControllerPicker";
import MissionsPage from "./pages/MissionsPage";
import MissionPage from "./pages/MissionPage";
import messages_en from "./translations/en.json";
import reducer from "./reducer";
import { ROUTE_MEDICAL_CONTROLLER_MISSIONS } from "./constants";

const DEFAULT_CONFIG = {
  translations: [{ key: "en", messages: messages_en }],
  reducers: [{ key: "medical_controller", reducer }],
  refs: [
    { key: "medical_controller.route.missions", ref: ROUTE_MEDICAL_CONTROLLER_MISSIONS },
    { key: "medical_controller.route.mission", ref: `${ROUTE_MEDICAL_CONTROLLER_MISSIONS}/mission` },
    { key: "medical_controller.MedicalControllerPicker", ref: MedicalControllerPicker },
    {
      key: "medical_controller.MedicalControllerPicker.projection",
      ref: ["id", "uuid", "code", "lastName", "otherNames"],
    },
  ],
  "core.Router": [
    { path: ROUTE_MEDICAL_CONTROLLER_MISSIONS, component: MissionsPage },
    { path: `${ROUTE_MEDICAL_CONTROLLER_MISSIONS}/mission/:mission_id`, component: MissionPage },
  ],
  "core.MainMenu": [MedicalControllerMainMenu],
};

export const MedicalControllerModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};

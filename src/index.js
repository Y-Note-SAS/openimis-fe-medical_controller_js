import MedicalControllerMainMenu from "./menus/MedicalControllerMainMenu";
import MedicalControllerPicker from "./pickers/MedicalControllerPicker";
import MissionCategoryPicker from "./pickers/MissionCategoryPicker";
import MissionsPage from "./pages/MissionsPage";
import MissionPage from "./pages/MissionPage";
import AuditReport from "./reports/AuditReport";
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
    { key: "medical_controller.MissionCategoryPicker", ref: MissionCategoryPicker },
  ],
  "core.Router": [
    { path: ROUTE_MEDICAL_CONTROLLER_MISSIONS, component: MissionsPage },
    { path: `${ROUTE_MEDICAL_CONTROLLER_MISSIONS}/mission/:mission_code`, component: MissionPage },
  ],
  "core.MainMenu": [MedicalControllerMainMenu],
  "reports": [
    {
      key: "medical_controller_claims_report",
      component: AuditReport,
      isValid: (values) => values.dateFrom && values.dateTo,
      getParams: (values) => ({
        date_from: values.dateFrom,
        date_to: values.dateTo,
        hflocation: values.hflocation?.code ? values.hflocation.code : 0,
        district: values.district?.code ? values.district.code : 0,
      }),
    },
  ],
};
export const MedicalControllerModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};

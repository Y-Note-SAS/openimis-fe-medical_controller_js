import { MISSION_STATUS_CLOSED, MISSION_STATUS_OPEN } from "./constants";

const MOCK_MISSIONS = [
  {
    uuid: "0098766",
    code: "0098766",
    region: { name: "Littoral" },
    district: { name: "Deido" },
    medicalController: {
      uuid: "medical-controller-1",
      code: "CM001",
      lastName: "NTSOULOUNG",
      otherNames: "NTSOUI Armel",
    },
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    status: MISSION_STATUS_OPEN,
  },
  {
    uuid: "9864556",
    code: "9864556",
    region: { name: "Extreme Nord" },
    district: { name: "Fotokol" },
    medicalController: {
      uuid: "medical-controller-2",
      code: "CM002",
      lastName: "NDONNANG",
      otherNames: "NDONL Romeo",
    },
    startDate: "2026-05-01",
    endDate: "2026-07-31",
    status: MISSION_STATUS_CLOSED,
  },
];

const filterValue = (filters, name) => {
  const filter = filters.find((item) => item.startsWith(`${name}:`) || item.startsWith(`${name}_Icontains:`));
  const value = filter?.match(/"([^"]+)"/)?.[1];
  return value ? String(value).toLowerCase() : null;
};

const applyMockFilters = (missions, filters) => {
  const code = filterValue(filters, "code");
  const controller = filterValue(filters, "medicalController_Uuid");
  const status = filterValue(filters, "status");
  const startDate = filterValue(filters, "startDate_Gte");
  const endDate = filterValue(filters, "endDate_Lte");

  return missions.filter(
    (mission) =>
      (!code || String(mission.code ?? "").toLowerCase().includes(code)) &&
      (!controller || mission.medicalController.uuid === controller) &&
      (!status || mission.status === status) &&
      (!startDate || mission.startDate >= startDate) &&
      (!endDate || mission.endDate <= endDate)
  );
};

export function fetchMedicalControllerMissions(_, filters = []) {
  return (dispatch) => {
    const missions = applyMockFilters(MOCK_MISSIONS, filters);

    dispatch({ type: "MEDICAL_CONTROLLER_MISSIONS_REQ" });
    dispatch({
      type: "MEDICAL_CONTROLLER_MISSIONS_RESP",
      payload: {
        data: {
          medicalControllerMissions: {
            edges: missions.map((mission) => ({ node: mission })),
            totalCount: missions.length,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
          },
        },
      },
      meta: { filters },
    });
  };
}

export function createMedicalControllerMission(_, payload, onSuccess) {
  return (dispatch) => {
    dispatch({ type: "MEDICAL_CONTROLLER_MISSION_CREATE_REQ" });

    // Mock: simule la création et ajoute dans la liste locale
    setTimeout(() => {
      const newMission = {
        uuid: payload.code,
        code: payload.code,
        region: { uuid: payload.regionId, name: "—" },
        district: payload.districtId ? { uuid: payload.districtId, name: "—" } : null,
        healthFacilities: (payload.healthFacilityIds ?? []).map((id) => ({ uuid: id })),
        startDate: payload.startDate ? `${payload.startDate}-01` : null,
        endDate: payload.endDate ? `${payload.endDate}-01` : null,
        status: MISSION_STATUS_OPEN,
      };

      MOCK_MISSIONS.unshift(newMission);

      dispatch({ type: "MEDICAL_CONTROLLER_MISSION_CREATE_RESP", payload: { mission: newMission } });

      if (typeof onSuccess === "function") {
        onSuccess(newMission);
      }
    }, 300);
  };
}

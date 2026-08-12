import { MISSION_STATUS_CLOSED, MISSION_STATUS_OPEN } from "./constants";

const MOCK_MISSIONS = [
  {
    uuid: "a977e005-f6f9-4d3e-9cd2-f3deb48a3483",
    code: "0098766",
    region: {code: 3, name: "Littoral" },
    district: {code: "03DEI", name: "Deido" },
    healthFacilities: [
      {code: "03DEI001", name: "Deido Hospital"},
      {code: "03DEI002", name: "Deido Health Center"},
    ],
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
        region: payload.regionId,
        district: payload.districtId,
        healthFacilities: payload.healthFacilityIds,
        startDate: payload.startDate,
        endDate: payload.endDate,
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

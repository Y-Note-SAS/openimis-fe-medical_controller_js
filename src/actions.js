import { formatMutation, graphql } from "@openimis/fe-core";
import { MISSION_STATUS_CLOSED, MISSION_STATUS_OPEN } from "./constants";
import { getFirstDayOfMonth, getLastDayOfMonth } from "./helpers/utils";

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

export function createMedicalControllerMission(mission, onSuccess) {
  return (dispatch) => {
    const payload = {
      regionId: mission.region?.id,
      districtId: mission.district?.id,
      healthFacilityIds: (mission.healthFacilities ?? []).map((hf) => hf.uuid),
      startDate: getFirstDayOfMonth(mission.startYear, mission.startMonth),
      endDate: getLastDayOfMonth(mission.endYear, mission.endMonth),
    };

    const healthFacilityIds = payload.healthFacilityIds
      .map((healthFacilityId) => `"${healthFacilityId}"`)
      .join(", ");

    const mutationInput = `
      regionId: "${payload.regionId}"
      districtId: "${payload.districtId}"
      healthFacilityIds: [${healthFacilityIds}]
      startDate: "${payload.startDate}"
      endDate: "${payload.endDate}"
    `;

    const mutation = formatMutation(
      "CreateMissionMutation",
      mutationInput,
      "CreateMissionMutation",
    );

    return dispatch(
      graphql(
        mutation.payload,
        [
          "MEDICAL_CONTROLLER_MISSION_CREATE_REQ",
          "MEDICAL_CONTROLLER_MISSION_CREATE_RESP",
          "MEDICAL_CONTROLLER_MISSION_CREATE_ERR",
        ],
        {
          clientMutationId: mutation.clientMutationId,
          clientMutationLabel: "CreateMission",
        },
      ),
    ).then((response) => {
      if (!response?.error && typeof onSuccess === "function") {
        onSuccess(response?.payload?.data?.createMission ?? payload);
      }
      return response;
    });
  };
}


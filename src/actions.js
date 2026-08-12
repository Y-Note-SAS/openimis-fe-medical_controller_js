import { formatMutation, formatPageQueryWithCount, graphql } from "@openimis/fe-core";
import { getFirstDayOfMonth, getLastDayOfMonth } from "./helpers/utils";

export function fetchMissions(filters) {
  const query = formatPageQueryWithCount(
    "missions",
    filters,
    [
      "id",
      "missionCode",
      "region { uuid, id, code, name, parent {id, uuid, code, name, type}, type }",
      "district { uuid, id, code, name, parent {id, uuid, code, name, type}, type }",
      "user { id, lastName, otherNames }",
      "startDate",
      "endDate",
      "status",
    ],
  );

  return graphql(query, "MEDICAL_CONTROLLER_MISSIONS");
}

export function createMission(mission, onSuccess) {
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


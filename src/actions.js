import { formatMutation, formatPageQueryWithCount, graphql, decodeId, fetchMutation } from "@openimis/fe-core";
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

export function createMission(mission, clientMutationLabel) {
  const mutationInput = `
      regionId: ${decodeId(mission.region.id)}
      districtId: ${decodeId(mission.district.id)}
      healthFacilityIds: [${mission.healthFacilities.map((hf) => decodeId(hf.id)).join(", ")}]
      startDate: "${getFirstDayOfMonth(mission.startYear, mission.startMonth)}"
      endDate: "${getLastDayOfMonth(mission.endYear, mission.endMonth)}"
    `;

  let mutation = formatMutation("createMission", mutationInput, clientMutationLabel);
  var requestedDateTime = new Date();

  return async (dispatch) => {
    const response = await dispatch(
      graphql(
        mutation.payload,
        [
          "MEDICAL_CONTROLLER_MISSION_CREATE_REQ",
          "MEDICAL_CONTROLLER_MISSION_CREATE_RESP",
          "MEDICAL_CONTROLLER_MISSION_CREATE_ERR",
        ],
        {
          clientMutationId: mutation.clientMutationId,
          clientMutationLabel,
          requestedDateTime,
        },
      ),
    );

    // Trigger fetching the mutation log so the action is recorded/available
    try {
      dispatch(fetchMutation(mutation.clientMutationId));
    } catch (err) {
      console.error("fetchMutation error", err);
    }

    return response;
  };
}


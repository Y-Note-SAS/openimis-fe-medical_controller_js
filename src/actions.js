import {
  formatMutation,
  formatPageQueryWithCount,
  graphql,
  decodeId,
  fetchMutation,
  formatQuery,
} from "@openimis/fe-core";
import { getFirstDayOfMonth, getLastDayOfMonth } from "./helpers/utils";

export function fetchClaimsSample(mm, healthFacilityIds, categories, missionCode) {
  const CLAIM_SAMPLE_PROJECTION = `
    uuid,
    code,
    jsonExt,
    dateTo,
    dateClaimed,
    dateProcessed,
    feedbackStatus,
    reviewStatus,
    claimed,
    approved,
    status,
    restoreId,
    healthFacility { id uuid name code },
    insuree ${mm.getProjection("insuree.InsureePicker.projection")},
  `;
  const payload = `
    query {
      claimsSample(
        healthFacilityIds: [${healthFacilityIds.map((id) => decodeId(id)).join(", ")}],
        percentageCategOne: ${categories.category1},
        percentageCategTwo: ${categories.category2},
        percentageCategThree: ${categories.category3},
        percentageCategFour: ${categories.category4},
        missionCode: "${missionCode}"
      ) {
        categoryOne{
          totalCategory
          claims{
            ${CLAIM_SAMPLE_PROJECTION}
          }
        }
        categoryTwo{
          totalCategory
          claims{
            ${CLAIM_SAMPLE_PROJECTION}
          }
        }

        categoryThree{
          totalCategory
          claims{
            ${CLAIM_SAMPLE_PROJECTION}
          }
        }

        categoryFour{
          totalCategory
          claims{
            ${CLAIM_SAMPLE_PROJECTION}
          }
        }
      }
    }
  `;

  return graphql(payload, "MEDICAL_CONTROLLER_CLAIMS_SAMPLE");
}

export function fetchMissions(filters) {
  const query = formatPageQueryWithCount(
    "missions",
    filters,
    [
      "id",
      "missionCode",
      "region { uuid, id, code, name, parent {id, uuid, code, name, type}, type }",
      "district { uuid, id, code, name, parent {id, uuid, code, name, type}, type }",
      "user { id, lastName, otherNames, username }",
      "startDate",
      "endDate",
      "status",
    ],
  );

  return graphql(query, "MEDICAL_CONTROLLER_MISSIONS");
}

export function fetchMission(mm, missionCode) {
  let projections = [
    "id",
    "missionCode",
    "user { id lastName otherNames username }",
    "healthFacilities { edges { node { id healthFacility { id uuid code name level} } } }",
    "region { uuid id code name parent {id uuid code name type} type }",
    "district { uuid id code name parent {id uuid code name type} type }",
    "startDate",
    "endDate",
    "status",
  ];

  const payload = formatPageQueryWithCount("missions", [`missionCode: "${missionCode}"`], projections);
  return graphql(payload, "MEDICAL_CONTROLLER_MISSION");
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


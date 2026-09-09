import {
  formatMutation,
  formatPageQueryWithCount,
  formatPageQuery,
  graphql,
  decodeId,
  fetchMutation,
  formatQuery,
} from "@openimis/fe-core";
import { getFirstDayOfMonth, getLastDayOfMonth } from "./helpers/utils";

export function fetchTotalSample(mm, healthFacilityIds, categories, missionCode) {
  const payload = `
    query {
      getClaimsSample(
        healthFacilityIds: [${healthFacilityIds.map((id) => decodeId(id)).join(", ")}],
        percentageCategOne: "${categories.category1}",
        percentageCategTwo: "${categories.category2}",
        percentageCategThree: "${categories.category3}",
        percentageCategFour: "${categories.category4}",
        missionCode: "${missionCode}"
      ) {
        categoryOne{ totalCategory }
        categoryTwo{ totalCategory }
        categoryThree{ totalCategory }
        categoryFour{ totalCategory }
      }
    }
  `;

  return graphql(payload, "MEDICAL_CONTROLLER_TOTAL_SAMPLE");
}

export function checkMissionAvailability(districtId, startDate, endDate) {
  const payload = `
    query {
      checkMissionAvailability(
        districtId: ${districtId},
        startDate: "${startDate}",
        endDate: "${endDate}"
      )
    }
  `;
  return graphql(payload, "MEDICAL_CONTROLLER_MISSION_AVAILABILITY");
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
      "dateCreated"
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
    "percentageOne",
    "percentageTwo",
    "percentageThree",
    "percentageFour"
  ];

  const payload = formatPageQueryWithCount("missions", [`missionCode: "${missionCode}"`], projections);
  return graphql(payload, "MEDICAL_CONTROLLER_MISSION");
}

export function fetchClaimSample(mm, missionFilters) {
  const healthFacilityIds = missionFilters?.healthFacility?.value || [];
  const missionCode = missionFilters?.missionCode?.value || "";
  const category = missionFilters?.category?.value;

  const decodedIds = healthFacilityIds.map((hf) => decodeId(hf?.id ?? hf)).join(", ");

  const payload = `
    query {
      claimsForHealthFacilities(
        healthFacilityIds: [${decodedIds}],
        missionCode: "${missionCode}"
        ${category != null ? `,category: "${category}"` : ""}
      ) {
        totalCateg1
        totalCateg2
        totalCateg3
        totalCateg4
        percentageCateg1
        percentageCateg2
        percentageCateg3
        percentageCateg4
        claims (first: 10) {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
          edges {
            node{
              claim {
                code,
                healthFacility { id uuid name code }
                uuid
                code
                jsonExt
                dateTo
                dateClaimed
                dateProcessed
                feedbackStatus
                reviewStatus
                claimed
                approved
                status
                restoreId
                insuree ${mm.getProjection("insuree.InsureePicker.projection")},
                amountAudited
                claimCategory
                audited
              }
            }
          }
        }
      }
    }
  `;

  return graphql(payload, "MEDICAL_CONTROLLER_CLAIM_SAMPLE");
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

export function fetchMissionHistory(mm, missionCode) {
  const payload = `
    query {
      missionActivityHistory(missionCode: "${missionCode}") {
        totalCount
        edges {
          node {
            action
            actionDate
            user {
              username
            }
          }
        }
      }
    }
  `;
  return graphql(payload, [
    "MEDICAL_CONTROLLER_MISSION_HISTORY_REQ",
    "MEDICAL_CONTROLLER_MISSION_HISTORY_RESP",
    "MEDICAL_CONTROLLER_MISSION_HISTORY_ERR",
  ]);
}

export function updateMission(mission, clientMutationLabel) {
  const mutationInput = `
      missionCode: "${mission.missionCode}"
      status: "C"
    `;

  let mutation = formatMutation("updateMission", mutationInput, clientMutationLabel);
  var requestedDateTime = new Date();

  return async (dispatch) => {
    const response = await dispatch(
      graphql(
        mutation.payload,
        [
          "MEDICAL_CONTROLLER_MISSION_UPDATE_REQ",
          "MEDICAL_CONTROLLER_MISSION_UPDATE_RESP",
          "MEDICAL_CONTROLLER_MISSION_UPDATE_ERR",
        ],
        {
          clientMutationId: mutation.clientMutationId,
          clientMutationLabel,
          requestedDateTime,
        },
      ),
    );

    try {
      dispatch(fetchMutation(mutation.clientMutationId));
    } catch (err) {
      console.error("fetchMutation error", err);
    }

    return response;
  };
}


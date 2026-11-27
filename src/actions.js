import {
  formatMutation,
  formatPageQueryWithCount,
  formatPageQuery,
  graphql,
  decodeId,
  fetchMutation,
  formatQuery,
  journalize,
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
        percentageCategFive: "${categories.category5}",
        missionCode: "${missionCode}"
      ) {
        categoryOne{ totalCategory }
        categoryTwo{ totalCategory }
        categoryThree{ totalCategory }
        categoryFour{ totalCategory }
        categoryFive{ totalCategory }
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

/**
 * Verifie la disponibilite des districts et des formations sanitaires sur une periode.
 *
 * Parametres envoyes au backend :
 *  - districtIds       : liste des ids (decodes) des districts selectionnes
 *  - healthFacilityIds : liste des ids (decodes) des formations sanitaires saisies
 *  - startDate         : premier jour du mois de debut (YYYY-MM-DD)
 *  - endDate           : dernier jour du mois de fin (YYYY-MM-DD)
 *
 * Reponse attendue du backend :
 *   checkHealthFacilitiesAvailability {
 *     districts { id uuid code name ... }
 *     healthFacilities { id uuid code name ... }
 *   }
 *
 * Ces deux listes representent les elements disponibles pour la periode :
 * ce sont eux qui doivent rester affiches et etre crees avec la mission.
 */
export function checkHealthFacilitiesAvailability(
  districtIds,
  healthFacilityIds,
  startDate,
  endDate,
) {
  const toIdList = (value) =>
    (Array.isArray(value) ? value : value ? [value] : [])
      .map((item) => decodeId(item?.id ?? item))
      .filter((id) => id != null);

  const districts = toIdList(districtIds);
  const healthFacilities = toIdList(healthFacilityIds);

  const payload = `
    query {
      checkMissionAvailability(
        districtIds: [${districts.join(", ")}],
        healthFacilityIds: [${healthFacilities.join(", ")}],
        startDate: "${startDate}",
        endDate: "${endDate}"
      ) {
        districtIds
        healthFacilityIds
      }
    }
  `;

  return graphql(payload, "MEDICAL_CONTROLLER_HEALTH_FACILITIES_AVAILABILITY");
}

/* Applique un traitement (ex: "rehabilitate") a une liste de claims.
*
* Mutation GraphQL envoyee :
*   mutation {
*     treatClaims(input: { action: "rehabilitate", claimIds: [138, 140] }) {
*       internalId
*       clientMutationId
*     }
*   }
*
* @param {Array<number|string>} claimIds ids internes (decodes) des claims
* @param {string} action action a appliquer ("rehabilitate")
* @param {string} clientMutationLabel libelle de la mutation
*/
export function treatClaims(claimIds, action, clientMutationLabel) {
  const ids = (Array.isArray(claimIds) ? claimIds : [claimIds])
    .map((id) => decodeId(id))
    .filter((id) => id != null);

  const mutationInput = `
      action: "${action}"
      claimIds: [${ids.join(", ")}]
    `;

  const mutation = formatMutation("treatClaims", mutationInput, clientMutationLabel);
  const requestedDateTime = new Date();

  return async (dispatch) => {
    // Ajoute immediatement l'entree au journal (statut 0 => spinner visible)
    dispatch(
      journalize({
        clientMutationId: mutation.clientMutationId,
        clientMutationLabel,
        requestDateTime: requestedDateTime,
      }),
    );

    const response = await dispatch(
      graphql(
        mutation.payload,
        [
          "MEDICAL_CONTROLLER_TREAT_CLAIMS_REQ",
          "MEDICAL_CONTROLLER_TREAT_CLAIMS_RESP",
          "MEDICAL_CONTROLLER_TREAT_CLAIMS_ERR",
        ],
        {
          clientMutationId: mutation.clientMutationId,
          clientMutationLabel,
          requestedDateTime,
        },
      ),
    );

    // Met a jour le statut de l'entree du journal (succes / erreur)
    try {
      dispatch(fetchMutation(mutation.clientMutationId));
    } catch (err) {
      console.error("fetchMutation error", err);
    }

    return response;
  };
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
      "missionDate",
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
    "missionDate",
    "status",
    "percentageOne",
    "percentageTwo",
    "percentageThree",
    "percentageFour",
    "percentageFive",
  ];

  const payload = formatPageQueryWithCount("missions", [`missionCode: "${missionCode}"`], projections);
  return graphql(payload, "MEDICAL_CONTROLLER_MISSION");
}

export function fetchClaimSample(mm, missionFilters, claimsPageInfo = {}, paginationParams = []) {
  const healthFacilityIds = missionFilters?.healthFacility?.value || [];
  const missionCode = missionFilters?.missionCode?.value || "";
  const category = missionFilters?.category?.value;
  const firstParam = paginationParams.find((param) => param.startsWith("first:"));
  const lastParam = paginationParams.find((param) => param.startsWith("last:"));
  const afterParam = paginationParams.find((param) => param.startsWith("after:"));
  const beforeParam = paginationParams.find((param) => param.startsWith("before:"));

  const pageSize = firstParam
    ? parseInt(firstParam.split(":")[1], 10)
    : lastParam
      ? parseInt(lastParam.split(":")[1], 10)
      : 10;

  const afterCursor = afterParam
    ? afterParam.replace("after:", "").trim().replace(/^"|"$/g, "")
    : claimsPageInfo?.endCursor;
  const beforeCursor = beforeParam
    ? beforeParam.replace("before:", "").trim().replace(/^"|"$/g, "")
    : claimsPageInfo?.startCursor;

  const isNextPage = !!afterParam;
  const isPreviousPage = !!beforeParam;

  const claimsPagination = isNextPage && afterCursor
    ? `first: ${pageSize}, after: "${afterCursor}"`
    : isPreviousPage && beforeCursor
      ? `last: ${pageSize}, before: "${beforeCursor}"`
      : `first: ${pageSize}`;

  const decodedIds = healthFacilityIds.map((hf) => decodeId(hf?.id ?? hf)).join(", ");

  // Filtre periode (date de visite) : bornes incluses, envoyees au back
  const dateFrom = missionFilters?.dateFrom?.value;
  const dateTo = missionFilters?.dateTo?.value;
  const claimDateFilters = [
    dateFrom ? `claim_DateClaimed_Gte: "${dateFrom}"` : null,
    dateTo ? `claim_DateClaimed_Lte: "${dateTo}"` : null,
  ].filter(Boolean);
  // tri par defaut : du plus ancien au plus recent
  const claimsArgs = [
    claimsPagination,
    ...claimDateFilters,
    'orderBy: ["claim__date_claimed"]',
  ].join(", ");
  // type de prestation (categorie 1) : services selectionnes -> codes
  const serviceValues = missionFilters?.services?.value;
  const serviceCodes = (Array.isArray(serviceValues) ? serviceValues : [])
    .map((service) => (typeof service === "string" ? service : service?.code))
    .filter(Boolean);
  const servicesArg = serviceCodes.length
    ? `, services: [${serviceCodes.map((code) => `"${code}"`).join(", ")}]`
    : "";

  const payload = `
    query {
      claimsForHealthFacilities(
        healthFacilityIds: [${decodedIds}],
        missionCode: "${missionCode}"
        ${category != null ? `,category: "${category}"` : ""}${servicesArg}
      ) {
        totalCateg1
        totalCateg2
        totalCateg3
        totalCateg4
        totalCateg5
        percentageCateg1
        percentageCateg2
        percentageCateg3
        percentageCateg4
        percentageCateg5
        allAudited
        claims (${claimsArgs}) {
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
                id
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

  return async (dispatch) => {
    dispatch({
      type: "MEDICAL_CONTROLLER_CLAIM_SAMPLE_CONTEXT",
      payload: { missionCode },
    });
    return dispatch(graphql(payload, "MEDICAL_CONTROLLER_CLAIM_SAMPLE"));
  };
}

export function createMission(mission, clientMutationLabel) {
  const mutationInput = `
      regionId: ${decodeId(mission.region.id)}
      districtId: ${decodeId(mission.district.id)}
      healthFacilityIds: [${mission.healthFacilities.map((hf) => decodeId(hf.id)).join(", ")}]
      startDate: "${getFirstDayOfMonth(mission.startYear, mission.startMonth)}"
      endDate: "${getLastDayOfMonth(mission.endYear, mission.endMonth)}"
      userIds: [${(mission.auditors ?? [])
      .map((auditor) => decodeId(auditor.interactiveId))
      .filter((id) => id != null)
      .join(", ")}]
      missionDate: "${mission.missionDate}"
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

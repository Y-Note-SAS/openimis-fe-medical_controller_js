import { formatGraphQLError, formatServerError, pageInfo, parseData } from "@openimis/fe-core";

const DEFAULT_STATE = {
  missions: {
    isFetching: false,
    isFetched: false,
    items: [],
    pageInfo: { totalCount: 0 },
    error: null,
  },
  mission: {
    isFetching: false,
    isFetched: false,
    item: null,
    error: null,
  },
  claimsSample: {
    isFetching: false,
    isFetched: false,
    item: null,
    totals: { category1: 0, category2: 0, category3: 0, category4: 0 },
    error: null,
  },
  claims: {
    fetchingClaims: false,
    fetchedClaims: false,
    errorClaims: null,
    items: [],
    pageInfo: { totalCount: 0 },
    totals: {},
    percentages: {}
  },
  missionHistory: {
    fetchingHistory: false,
    fetchedHistory: false,
    errorHistory: null,
    items: [],
    pageInfo: { totalCount: 0 },
  },
  isCreating: false,
  createError: null,
  isUpdating: false,
  updateError: null,
};

const reducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
    case "MEDICAL_CONTROLLER_MISSIONS_REQ":
      return {
        ...state,
        missions: {
          ...state.missions,
          isFetching: true,
          isFetched: false,
          error: null,
        },
      };
    case "MEDICAL_CONTROLLER_MISSIONS_RESP":
      return {
        ...state,
        missions: {
          ...state.missions,
          isFetching: false,
          isFetched: true,
          items: parseData(action.payload.data.missions),
          pageInfo: pageInfo(action.payload.data.missions),
          error: formatGraphQLError(action.payload),
        },
      };
    case "MEDICAL_CONTROLLER_MISSIONS_ERR":
      return {
        ...state,
        missions: {
          ...state.missions,
          isFetching: false,
          error: formatServerError(action.payload),
        },
      };
    case "MEDICAL_CONTROLLER_MISSION_REQ":
      return {
        ...state,
        mission: {
          ...state.mission,
          isFetching: true,
          isFetched: false,
          error: null,
        },
      };
    case "MEDICAL_CONTROLLER_MISSION_RESP":
      return {
        ...state,
        mission: {
          ...state.mission,
          isFetching: false,
          isFetched: true,
          item: action.payload?.data?.missions ? parseData(action.payload.data.missions)[0] : null,
          error: formatGraphQLError(action.payload),
        },
      };
    case "MEDICAL_CONTROLLER_MISSION_ERR":
      return {
        ...state,
        mission: {
          ...state.mission,
          isFetching: false,
          error: formatServerError(action.payload),
        },
      };
    case "MEDICAL_CONTROLLER_MISSION_CREATE_REQ":
      return { ...state, isCreating: true, createError: null };
    case "MEDICAL_CONTROLLER_MISSION_CREATE_RESP":
      return { ...state, isCreating: false, createError: null };
    case "MEDICAL_CONTROLLER_MISSION_CREATE_ERR":
      return { ...state, isCreating: false, createError: formatServerError(action.payload) };
    case "MEDICAL_CONTROLLER_CLAIM_SAMPLE_REQ":
      return {
        ...state,
        claims: {
          ...state.claims,
          fetchingClaims: true,
          fetchedClaims: false,
          errorClaims: null,
        },
      };
    case "MEDICAL_CONTROLLER_CLAIM_SAMPLE_RESP":
      const responseData = action.payload.data?.claimsForHealthFacilities;
      if (!responseData) {
        return {
          ...state,
          claims: {
            ...state.claims,
            fetchingClaims: false,
            fetchedClaims: true,
            errorClaims: formatGraphQLError(action.payload),
          },
        };
      }
      const claimsData = responseData.claims;
      return {
        ...state,
        claims: {
          ...state.claims,
          fetchingClaims: false,
          fetchedClaims: true,
          items: claimsData ? parseData(claimsData).map((item) => item.claim ?? item) : [],
          pageInfo: claimsData ? pageInfo(claimsData) : { totalCount: 0 },
          totals: {
            category1: responseData?.totalCateg1 ?? 0,
            category2: responseData?.totalCateg2 ?? 0,
            category3: responseData?.totalCateg3 ?? 0,
            category4: responseData?.totalCateg4 ?? 0,
          },
          percentages: {
            category1: responseData?.percentageCateg1,
            category2: responseData?.percentageCateg2,
            category3: responseData?.percentageCateg3,
            category4: responseData?.percentageCateg4,
          },
          errorClaims: formatGraphQLError(action.payload),
        },
      };
    case "MEDICAL_CONTROLLER_CLAIM_SAMPLE_ERR":
      return {
        ...state,
        claims: {
          ...state.claims,
          fetchingClaims: false,
          errorClaims: formatServerError(action.payload),
        },
      };
    case "MEDICAL_CONTROLLER_MISSION_UPDATE_REQ":
      return { ...state, isUpdating: true, updateError: null };
    case "MEDICAL_CONTROLLER_MISSION_UPDATE_RESP":
      return { ...state, isUpdating: false, updateError: null };
    case "MEDICAL_CONTROLLER_MISSION_UPDATE_ERR":
      return { ...state, isUpdating: false, updateError: formatServerError(action.payload) };
    case "MEDICAL_CONTROLLER_MISSION_HISTORY_REQ":
      return {
        ...state,
        missionHistory: {
          ...state.missionHistory,
          fetchingHistory: true,
          fetchedHistory: false,
          errorHistory: null,
        },
      };
    case "MEDICAL_CONTROLLER_MISSION_HISTORY_RESP":
      const historyData = action.payload.data?.missionActivityHistory;
      return {
        ...state,
        missionHistory: {
          ...state.missionHistory,
          fetchingHistory: false,
          fetchedHistory: true,
          items: historyData?.edges?.map((edge) => edge?.node) ?? [],
          pageInfo: { totalCount: historyData?.totalCount ?? 0 },
          errorHistory: formatGraphQLError(action.payload),
        },
      };
    case "MEDICAL_CONTROLLER_MISSION_HISTORY_ERR":
      return {
        ...state,
        missionHistory: {
          ...state.missionHistory,
          fetchingHistory: false,
          errorHistory: formatServerError(action.payload),
        },
      };
    default:
      return state;
  }
};

export default reducer;

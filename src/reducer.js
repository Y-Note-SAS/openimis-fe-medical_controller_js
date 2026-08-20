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
    case "MEDICAL_CONTROLLER_MISSION_UPDATE_REQ":
      return { ...state, isUpdating: true, updateError: null };
    case "MEDICAL_CONTROLLER_MISSION_UPDATE_RESP":
      return { ...state, isUpdating: false, updateError: null };
    case "MEDICAL_CONTROLLER_MISSION_UPDATE_ERR":
      return { ...state, isUpdating: false, updateError: formatServerError(action.payload) };
    default:
      return state;
  }
};

export default reducer;

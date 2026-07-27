import { formatGraphQLError, formatServerError, pageInfo, parseData } from "@openimis/fe-core";

const DEFAULT_STATE = {
  missions: {
    isFetching: false,
    isFetched: false,
    items: [],
    pageInfo: { totalCount: 0 },
    error: null,
  },
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
          items: parseData(action.payload.data.medicalControllerMissions),
          pageInfo: pageInfo(action.payload.data.medicalControllerMissions),
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
    default:
      return state;
  }
};

export default reducer;

import { ROC_ONLINE } from '../actions/main';

const initialState = {
  rocOnline: null,
};

const mainReducer = (state = initialState, action) => {
  switch (action.type) {
    case ROC_ONLINE:
      return { ...state, rocOnline: action.payload };
    default:
      return state;
  }
};

export default mainReducer;

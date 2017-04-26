import {
    GET_DB_LIST,
    SET_USER_RIGHTS,
    SET_USER_GROUPS,
    SET_DEFAULT_GROUPS,
    SET_GLOBAL_RIGHTS,
    SET_MEMBERSHIPS,
    CREATE_GROUP,
    REMOVE_GROUP,
    UPDATE_GROUP
} from '../actions/db';

const initialState = {
    dbList: [],
    userRights: [],
    userGroups: []
};

const dbReducer = (state = initialState, action) => {
    switch (action.type) {
        case `${GET_DB_LIST}_FULFILLED`:
            return Object.assign({}, state, {dbList: action.payload});
        case SET_USER_RIGHTS:
            return Object.assign({}, state, {userRights: action.payload});
        case SET_USER_GROUPS:
            return Object.assign({}, state, {userGroups: action.payload.sort(sortByName)});
        case `${CREATE_GROUP}_FULFILLED`: {
            const newGroupList = state.userGroups.slice();
            newGroupList.unshift(action.payload);
            return Object.assign({}, state, {userGroups: newGroupList});
        }
        case `${REMOVE_GROUP}_FULFILLED`: {
            const newGroupList = state.userGroups.filter(group => group.name !== action.meta);
            return Object.assign({}, state, {userGroups: newGroupList});
        }
        case `${UPDATE_GROUP}_FULFILLED`: {
            const groupName = action.payload.name;
            const index = state.userGroups.findIndex(group => group.name === groupName);
            if (index === -1) {
                throw new Error('should not happen');
            }
            const newGroupList = state.userGroups.slice();
            newGroupList[index] = action.payload;
            return Object.assign({}, state, {userGroups: newGroupList});
        }
        case `${SET_DEFAULT_GROUPS}`: {
            return Object.assign({}, state, {defaultGroups: action.payload});
        }
        case `${SET_GLOBAL_RIGHTS}`: {
            return Object.assign({}, state, {globalRights: action.payload});
        }
        case `${SET_MEMBERSHIPS}`: {
            return Object.assign({}, state, {memberships: action.payload});
        }
        default:
            return state;
    }
};

export default dbReducer;

function sortByName(group1, group2) {
    return group1.name.localeCompare(group2.name);
}

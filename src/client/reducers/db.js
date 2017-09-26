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
    userGroups: [],
    errors: {}
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
            if (action.payload.error) {
                const errors = Object.assign({}, state.errors, {
                    createGroup: action.payload.error
                });
                return Object.assign({}, state, {errors});
            }
            const newGroupList = state.userGroups.slice();
            newGroupList.unshift(action.payload);
            return Object.assign({}, state, {userGroups: newGroupList});
        }
        case `${REMOVE_GROUP}_FULFILLED`: {
            if (action.payload.error) {
                return getNewStateOnGroupError(state, action);
            }
            const newGroupList = state.userGroups.filter(group => group.name !== action.meta);
            return Object.assign({}, state, {userGroups: newGroupList});
        }
        case `${UPDATE_GROUP}_FULFILLED`: {
            if (action.payload.error) {
                return getNewStateOnGroupError(state, action);
            } else {
                if (action.payload.name !== action.meta) {
                    throw new Error('should not happen');
                }
                const index = getGroupIndex(state.userGroups, action);
                const newGroupList = state.userGroups.slice();
                newGroupList[index] = action.payload;
                newGroupList[index].success = 'Group sucessfully updated';
                newGroupList[index].error = null;
                return Object.assign({}, state, {
                    userGroups: newGroupList
                });
            }


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

function getGroupIndex(userGroups, action) {
    const index = userGroups.findIndex(group => group.name === action.meta);
    if (index === -1) {
        throw new Error('should not happen');
    }
    return index;
}

function getNewStateOnGroupError(state, action) {
    const index = getGroupIndex(state.userGroups, action);
    const newGroupList = state.userGroups.slice();
    newGroupList[index] = Object.assign({}, newGroupList[index], {error: action.payload.error, success: null});
    return Object.assign({}, state, {
        userGroups: newGroupList
    });
}

export default dbReducer;

function sortByName(group1, group2) {
    return group1.name.localeCompare(group2.name);
}

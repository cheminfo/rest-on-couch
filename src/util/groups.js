'use strict';

async function getUserGroups(ctx, user, right, groups, mine) {
  var userGroups = await ctx.getGroupsByRight(user, right);
  userGroups.push(user);
  if (groups) {
    var groupsToUse = [];
    if (!Array.isArray(groups)) {
      groups = [groups];
    }
    for (var i = 0; i < userGroups.length; i++) {
      if (groups.indexOf(userGroups[i]) >= 0) {
        groupsToUse.push(userGroups[i]);
      }
    }
    userGroups = groupsToUse;
    if (userGroups.indexOf(user) === -1 && mine) {
      userGroups.push(user);
    }
  } else if (mine) {
    userGroups = [user];
  }
  return userGroups;
}

module.exports = {
  getUserGroups,
};

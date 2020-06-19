'use strict';
// Github profile info
// {
//    provider: 'github',
//        id: 4118690,
//    displayName: 'Daniel Kostro',
//    username: 'stropitek',
//    profileUrl: 'https://github.com/stropitek',
//    emails: [ { value: 'kostro.d@gmail.com' } ],
//    _raw: '{"login":"stropitek","id":4118690,"avatar_url":"https://avatars.githubusercontent.com/u/4118690?v=3","gravatar_id":"","url":"https://api.github.com/users/stropitek","html_url":"https://github.com/stropitek","followers_url":"https://api.github.com/users/stropitek/followers","following_url":"https://api.github.com/users/stropitek/following{/other_user}","gists_url":"https://api.github.com/users/stropitek/gists{/gist_id}","starred_url":"https://api.github.com/users/stropitek/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/stropitek/subscriptions","organizations_url":"https://api.github.com/users/stropitek/orgs","repos_url":"https://api.github.com/users/stropitek/repos","events_url":"https://api.github.com/users/stropitek/events{/privacy}","received_events_url":"https://api.github.com/users/stropitek/received_events","type":"User","site_admin":false,"name":"Daniel Kostro","company":null,"blog":null,"location":"Geneva, Lausanne","email":"kostro.d@gmail.com","hireable":true,"bio":null,"public_repos":12,"public_gists":0,"followers":0,"following":0,"created_at":"2013-04-10T19:09:53Z","updated_at":"2015-03-03T15:53:48Z"}',
//    _json:
//    {
//        login: 'stropitek',
//        id: 4118690,
//        avatar_url: 'https://avatars.githubusercontent.com/u/4118690?v=3',
//        gravatar_id: '',
//        url: 'https://api.github.com/users/stropitek',
//        html_url: 'https://github.com/stropitek',
//        followers_url: 'https://api.github.com/users/stropitek/followers',
//        following_url: 'https://api.github.com/users/stropitek/following{/other_user}',
//        gists_url: 'https://api.github.com/users/stropitek/gists{/gist_id}',
//        starred_url: 'https://api.github.com/users/stropitek/starred{/owner}{/repo}',
//        subscriptions_url: 'https://api.github.com/users/stropitek/subscriptions',
//        organizations_url: 'https://api.github.com/users/stropitek/orgs',
//        repos_url: 'https://api.github.com/users/stropitek/repos',
//        events_url: 'https://api.github.com/users/stropitek/events{/privacy}',
//        received_events_url: 'https://api.github.com/users/stropitek/received_events',
//        type: 'User',
//        site_admin: false,
//        name: 'Daniel Kostro',
//        company: null,
//        blog: null,
//        location: 'Geneva, Lausanne',
//        email: 'kostro.d@gmail.com',
//        hireable: true,
//        bio: null,
//        public_repos: 12,
//        public_gists: 0,
//        followers: 0,
//        following: 0,
//        created_at: '2013-04-10T19:09:53Z',
//        updated_at: '2015-03-03T15:53:48Z'
//    }
// }

const got = require('got');
const GitHubStrategy = require('passport-github').Strategy;

const { auditLogin } = require('../../../audit/actions');

exports.init = function (passport, router, config) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackURL: config.publicAddress + config.callbackURL,
        passReqToCallback: true,
      },
      function (req, accessToken, refreshToken, profile, done) {
        // Get the user's email
        (async function () {
          const answer = (
            await got(
              `https://api.github.com/user/emails?access_token=${accessToken}`,
              {
                responseType: 'json',
                headers: {
                  'User-Agent': 'got',
                },
                throwHttpErrors: false,
              },
            )
          ).body;
          const email = answer.filter(function (val) {
            return val.primary === true;
          });
          if (email.length === 0 && answer[0] && answer[0].email) {
            profile.email = answer[0].email;
          }
          if (email[0]) profile.email = email[0].email;
          auditLogin(profile.email, true, 'github', req.ctx);
          done(null, {
            provider: 'github',
            email: profile.email,
          });
        })();
      },
    ),
  );

  router.get(
    config.loginURL,
    async (ctx, next) => {
      ctx.session.redirect = `${config.successRedirect}?${ctx.querystring}`;
      await next();
    },
    passport.authenticate('github', { scope: ['user:email'] }),
  );

  router.get(
    config.callbackURL,
    passport.authenticate('github', {
      failureRedirect: config.failureRedirect,
    }),
    (ctx) => {
      // Successful authentication, redirect home.
      if (ctx.session.redirect) {
        ctx.response.redirect(ctx.session.redirect);
      } else {
        ctx.response.redirect(config.successRedirect);
      }
    },
  );
};

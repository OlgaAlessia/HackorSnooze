"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);


/** Show submit on click of "submit" */

function navSubmitStory(evt) {
  console.debug("navSubmit", evt);
  hidePageComponents();
  putStoriesOnPage();

  $submitForm.show();
}

$body.on("click", "#nav-submit", navSubmitStory);

/** Show the Story mark as favorite on click of "star" */

function navFavorites(evt) {
  console.debug("navFavorites");
  hidePageComponents();
  putFavoritesOnPage();
}

$body.on("click", "#nav-favorites", navFavorites);

/** Show the Story create from the currentUser on click of "my stories" */

function navMyStories(evt) {
  console.debug("navMyStories");
  hidePageComponents();
  putMyStoriesOnPage();
  $myStoriesList.show();
}

$body.on("click", "#nav-my-stories", navMyStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick");
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

/** Handle click of navUserProfile button
 *
 * Show user credentials
 */

function userProfile() {
  console.debug("userProfile");
  $userProfile.empty();
  hidePageComponents();

  const $profile = generateUserProfile();
  $userProfile.append($profile);
  $userProfile.show();
}

$navUserProfile.on("click", userProfile);


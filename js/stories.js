"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */


function generateStoryMarkup(story, isTrash = false) {
  //console.debug("generateStoryMarkup", evt);
  let logIn = Boolean(currentUser);

  const hostName = story.getHostName();

  return $(`
      <li id="${story.storyId}">
        ${isTrash ? showTrash() : ''}
        ${logIn ? showStar(story.storyId) : ''}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
      <hr>
    `);
}

function showTrash() {
  return `
    <span class="trash">
      <i class="fa fa-trash"></i>
    </span>`;
}

function showStar(storyID) {
  const isFav = currentUser.isFavorite(storyID);

  const isFull = isFav ? 'fas' : 'far';

  return `
    <span class="star">
      <i class="${isFull} fa-star"></i>
    </span>`;
}


/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}


/** Handle submit form submission. */

async function submitNewStory(evt) {
  console.debug("submitNewStory", evt);
  evt.preventDefault();

  const author = $("#submit-author").val();
  const title = $("#submit-title").val();
  const url = $("#submit-url").val();
  const storyObj = {title, author, url};

  // Story.addStory retrieves the new Story info from API and returns Story instance
  // which we'll show in the page.
  const currenStory = await storyList.addStory(currentUser, storyObj);

  const $currenStory = generateStoryMarkup(currenStory);
  $allStoriesList.append($currenStory);

  $submitForm.trigger("reset");
  $submitForm.slideUp();
}

$submitForm.on("submit", submitNewStory);


/** Handle favorite story. */

async function favoriteStory(evt) {
  console.debug("favoriteStory");

  let storyId = evt.target.parentElement.parentElement.id;

  if( $(evt.target).hasClass("fas") )
  {
    // Story.deleteFavoriteStory deletes the story in the favorite
    await currentUser.removeFavorite(storyId);
    $(evt.target).toggleClass("far fas");
  }
  else {
    // Story.addFavoriteStory adds the story in the favorite
    await currentUser.addFavorite(storyId);
    $(evt.target).toggleClass("fas far");
  } 
}

$body.on("click", ".star", favoriteStory);


/** Gets list of favorite stories  from currentUser, generates their HTML, and puts on page. */

function putFavoritesOnPage() {

  console.debug("putFavoritesOnPage");
  $storiesLoadingMsg.remove();
  $favoritesList.empty();

  if (currentUser.favorites.length === 0) {
    $favoritesList.append("<h5>No favorites added.</h5>");
  } else {
    // loop through all of my stories and generate HTML for them
    for (let favorite of currentUser.favorites) {
      const $favorite = generateStoryMarkup(favorite);
      $favoritesList.append($favorite);
    }
  }
  $favoritesList.show();
}


/** Handle delete story. */

async function deleteStory(evt) {
  console.debug("deleteStory", evt);

  let storyId = evt.target.parentElement.parentElement.id;

  // Story.deleteStory cancel the Story with storyId
  await storyList.deleteStory(currentUser, storyId);

  putMyStoriesOnPage();
}

$myStoriesList.on("click", ".trash", deleteStory);


/** Gets list of stories create by user from currentUser, generates their HTML, and puts on page. */

function putMyStoriesOnPage() {
  console.debug("putMyStoriesOnPage");
  $storiesLoadingMsg.remove();
  $myStoriesList.empty();

  if (currentUser.ownStories.length === 0) {
    $myStoriesList.append("<h5>No stories added by user.</h5>");
  } else {
    // loop through all of my stories and generate HTML for them
    for (let myStory of currentUser.ownStories) {
      const $myStory = generateStoryMarkup(myStory, true);
      $myStoriesList.append($myStory);
    }
  }
  $myStoriesList.show();
}


"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    return new URL(this.url);
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }


  /** Get story data to API, makes a Story instance.
   * - user - the current instance of User who posted the story
   * - storyId - the current id of the Story
   *
   */
  static async getStoriesByAuthor(user) {
    const token = user.loginToken; 
    const username = user.username;

    const res = await axios({
      url: `${BASE_URL}/stories?username=${username}`,
      method: "GET",
      data: { token }
    });

    // turn plain old story objects from API into instances of Story class
    const stories = res.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
}



  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, {title, author, url}) {
    const token = user.loginToken; 
    const res = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: { token, story: {title, author, url}}
    });

    const story = new Story(res.data.story);
    user.ownStories.unshift(story);

    return story;
  }

  /** Delete story from the user arrays to API
   * - user - the current instance of User who posted the story
   * - storyId - the current id of the Story
   *
   */

  async deleteStory(user, storyId) {

    await axios({ url: `${BASE_URL}/stories/${storyId}`, method: "DELETE", data: { token: user.loginToken }});

    user.ownStories = user.ownStories.filter( story => story.storyId !== storyId );
    user.favorites = user.favorites.filter( story => story.storyId !== storyId );
  }

}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    try{
      const response = await axios({
        url: `${BASE_URL}/signup`,
        method: "POST",
        data: { user: { username, password, name } },
      });

      let { user } = response.data

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        response.data.token
      );
    }
    catch(error) { 
      console.error(error); 
      if(error.response.status === 409){
        alert("UserName Already Exists.");
      }
    }
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    try{
      const res = await axios({
        url: `${BASE_URL}/login`,
        method: "POST",
        data: { user: { username, password } },
      });

      let { user } = await res.data;
      
      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        res.data.token
      );
    }
    catch(error) { 
      console.error(error); 
      if(error.response.status === 401){
        alert("Invalid password.");
      }
      else if (error.response.status === 404){
        alert(`No user ${username} found.`);
      }
    }
  }


  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }


  /** Adds story to the favorite section of API, makes a Story instance, adds it to favorite list.
   * - user - the current instance of User who will post the story
   * - storyId - the current id of the Story
   *
   */
  async addOrDeleteFavoriteStory(storyId, action) {

    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: action,
      data: { token: this.loginToken }
    });

  }

  /** Remove the favorite story of API, and to favorites array.
   * - storyId - the current id of the Story
   *
   * Returns the Story instance
   */

  async addFavorite(storyId) {

    await this.addOrDeleteFavoriteStory(storyId, "POST");

    const res = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "GET",
      data: { token: this.loginToken }
    });

    const story = new Story(res.data.story);
    this.favorites.push(story);

  }

  /** Remove the favorite story of API, and to favorites array.
   * - storyId - the current id of the Story
   *
   * Returns the Story instance
   */

  async removeFavorite(storyId) {

    await this.addOrDeleteFavoriteStory(storyId, "DELETE");

    this.favorites = this.favorites.filter( story => story.storyId !== storyId );
  }


  /** Check if the story is in the array favorites
   * - storyId - the current id of the Story
   * 
   * Returns a Boolean
   */

  isFavorite(storyID){
    return this.favorites.some( story => story.storyId === storyID );
  }
}

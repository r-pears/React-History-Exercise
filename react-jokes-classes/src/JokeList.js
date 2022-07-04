import { Component } from "react";
import axios from "axios";
import Joke from "./Joke";
import "./JokeList.css";

class JokeList extends Component {
  static defaultProps = {
    numJokesToGet: 10
  };

  constructor(props) {
    super(props);

    this.state = {
      jokes: [],
    };

    this.generateNewJokes = this.generateNewJokes.bind(this);
    this.resetVotes = this.resetVotes.bind(this);
    this.toggleLock = this.toggleLock.bind(this);
    this.vote = this.vote.bind(this);
  }

  /** when component mounts, get jokes */
  componentDidMount() {
    if (this.state.jokes.length < this.props.numJokesToGet) {
      return this.getJokes();
    }
  }

  /** ar component update check how many jokes you've got and possibly get joke */
  componentDidUpdate() {
    if (this.state.jokes.length < this.props.numJokesToGet) {
      return this.getJokes();
    }
  }

  /** retrieve jokes from API */
  async getJokes() {
    try {
      // load jokes one at a time, adding not-yet-seen jokes
      let jokes = this.state.jokes;
      let jokeVotes = JSON.parse(
        window.localStorage.getItem('jokeVotes') || '{}'
      );

      let seenJokes = new Set(jokes.map(j => j.id));

      while (jokes.length < this.props.numJokesToGet) {
        let response = await axios.get(`https://icanhazdadjoke.com`, {
          headers: { Accept: 'application/json' }
        });

        let { status, ...joke } = response.data;

        if (!seenJokes.has(joke.id)) {
          seenJokes.add(joke.id);
          jokeVotes[joke.id] = jokeVotes[joke.id] || 0;
          jokes.push({ ...joke, votes: jokeVotes[joke.id], locked: false });
        } else {
          console.log('Duplicate found!');
        }
      }

      this.setState({ jokes });
      window.localStorage.setItem("jokeVotes", JSON.stringify(jokeVotes));
    } catch (error) {
      console.log(error);
    }
  }

  /** empty joke list, set to loading state, and then call getJokes */
  generateNewJokes() {
    this.setState(st => ({ jokes: st.jokes.filter(j => j.locked) }));
  }

  /** reset the vote score */
  resetVotes() {
    window.localStorage.setItem('jokeVotes', '{}');
    this.setState(st => ({
      jokes: st.jokes.map(joke => ({ ...joke, votes: 0 }))
    })); 
  }

  /** change vote for this id by delta (+1 or -1) */
  vote(id, delta) {
    let jokeVotes = JSON.parse(window.localStorage.getItem('jokeVotes'));
    jokeVotes[id] = (jokeVotes[id] || 0) + delta;
    window.localStorage.setItem('jokeVotes', JSON.stringify(jokeVotes));
    this.setState(st => ({
      jokes: st.jokes.map(joke =>
        joke.id === id ? { ...joke, votes: joke.votes + delta } : joke)
    }));
  }

  /** toggle lock */
  toggleLock(id) {
    this.setState(st => ({
      jokes: st.jokes.map(joke => (joke.id === id ? { ...joke, locked: !joke.locked } : joke))
    }));
  }

  /** render: either loading spinner or list of sorted jokes. */
  render() { 
    let sortedJokes = [...this.state.jokes].sort((a, b) => b.votes - a.votes);
    let allLocked = sortedJokes.filter(joke => joke.locked).length === this.props.numJokesToGet;

    return (
      <div className="JokeList">
        <button
          className="JokeList-getmore"
          onClick={this.generateNewJokes}
          disabled={allLocked}
        >
          Get New Jokes
        </button>

        <button
          className="JokeList-getmore"
          onClick={this.resetVotes}
        >
          Reset Vote Counts
        </button>

        {sortedJokes.map(joke => (
          <Joke 
            text={joke.joke}
            key={joke.id}
            id={joke.id}
            votes={joke.votes}
            vote={this.vote}
            locked={joke.locked}
            toggleLock={this.toggleLock}
          />
        ))}

        {sortedJokes.length < this.props.numJokesToGet && 
          <div className="loading">
            <i className="fas fa-4x fa-spinner fa-spin" />
          </div>
        }
      </div>
    );
  }
}

export default JokeList;

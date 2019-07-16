import React, { Component } from 'react';
import {AppState} from 'react-native';
import io from "socket.io-client";

import Board from './Board';
import { connect } from 'react-redux';

import { changeRole, toggleExpansion, toggleColourblind, toggleNightMode, toggleDuetTeam } from '../actions/userOptionsActions';
import { updateGame, loadGame, startNewGame, endTurn, cardClick, toggleHardMode, toggleDuet } from '../actions/gameActions';
import { socketUrl } from '../config/serverUrl';

const stateMap = (store) => {

  return store;
};

class Game extends Component
{
  constructor(props)
  {
    super(props);
    
    this.state = {
      // This is to detect when mobile devices are locked/inactive
      appState: AppState.currentState,

      // Game name from the URL
      gameName: window.location.pathname.split('/')[1],

      // Websocket to receive data from the server
      socket: io.connect(socketUrl),
    }

    this.toggleWordPack = this.toggleWordPack.bind(this);
    this.highlightIfClicked = this.highlightIfClicked.bind(this);
    this.newGame = this.newGame.bind(this);
    this.endTurn = this.endTurn.bind(this);
    this.changeRole = this.changeRole.bind(this);
    this.toggleColourblind = this.toggleColourblind.bind(this);
    this.toggleNightMode = this.toggleNightMode.bind(this);
    this.toggleHardMode = this.toggleHardMode.bind(this);
    this.toggleDuet = this.toggleDuet.bind(this);
    this.toggleDuetTeam = this.toggleDuetTeam.bind(this);
    this.loadGame = this.loadGame.bind(this);

    
    // Socket room and connection
    this.state.socket.emit('joinRoom', this.state.gameName);
    
    this.state.socket.on('updateGame', game => props.dispatch(updateGame(game)));
    
    this.loadGame(this.state.gameName);
  }

  render()
  {
    const winner = this.props.game.winner;

    const game = this.createScoreboard();

    let status;
    let playingTeam = (this.props.game.blueTurn ? 'blue' : 'red');
    let playingTeamColour = playingTeam;

    if (winner)
    {
      status = winner + ' team wins!';
    }
    else
    {
      status = (this.props.game.blueTurn ? 'Blue' : 'Red') + ' team\'s turn';
    }

    // Duet
    if(this.props.game.duetMode)
    {
      playingTeamColour = 'green';
      playingTeam = (this.props.game.duet.teamOneTurn ? 'team one' : 'team two');

      
        if(this.props.game.duet.winner === true)
        {
          status = 'You win!'
        }
        else if(this.props.game.duet.winner === false)
        {
          status = 'You lose!';
        }
        else if(this.props.game.duet.timerTokens <= 0)  
        {
          status = 'Out of turns! Sudden death!\n' +
                    game.duetScore + ' cards remaining...';
        }
        else
        {
          status = 'Team ' + (this.props.game.duet.teamOneTurn ? 'one' : 'two') + '\'s turn\n' +
                    game.duetScore + ' cards remaining...'
        }
    }

    return (
      <div className={
          (!this.props.game.duetMode && this.props.options.role === 'Spymaster' ? 'spymaster' : 'player') + // Turn off spymaster when in duet to allow clicking
          (this.props.options.colourblind ? ' colourblind' : '') + 
          (this.props.options.nightMode ? ' night-mode' : '') +
          (this.props.game.hardMode ? ' hard-mode' : '') +
          (this.props.game.duetMode ? ' duet' : '') +
          (this.props.options.duetTeamOne ? ' team-one' : ' team-two')
        } id="game">
        <div id="board">
          <div id="top-bar">
            <div id="score">
            {!this.props.game.duetMode ?
              <React.Fragment>
                <span className={game.firstTeamColour}>{game.firstTeamScore}</span>
                <span>&ndash;</span>
                <span className={game.secondTeamColour}>{game.secondTeamScore}</span>
              </React.Fragment>
              :
              this.props.game.duet.winner === null &&
              <React.Fragment>
                <span className="green">{this.props.game.duet.timerTokens} turns left</span><br />
                <span className="green">{this.props.game.duet.bystanders} errors allowed</span>
              </React.Fragment>
            }
            </div>
            <div id="status" className={playingTeamColour}>{status}</div>
            {!this.props.game.winner && this.props.game.duet.winner === null && <button id="end-turn" onClick={this.endTurn}>End {playingTeam}&apos;s turn</button>}
          </div>
          <Board
            cards={this.props.game.cards}
            cardClick={(i) => this.cardClick(i)}
          />
          <div id="bottom-bar" className={this.props.options.role === 'Spymaster' ? 'spymaster-selected' : 'player-selected'}>
            <div className="left">
              <div className="switch-input">
                <label className="switch">
                  <input type="checkbox" onChange={this.toggleColourblind} />
                  <span className="slider round"></span>
                </label>
                <div className="switch-label">Colourblind</div>
              </div>
              {/* <div className="switch-input">
                <div className="switch-label">Night Mode</div>
                <label className="switch">
                  <input type="checkbox" onChange={this.toggleColourblind} />
                  <span className="slider round"></span>
                </label>
              </div> */}
              <div className="switch-input">
                <label className="switch">
                  <input type="checkbox" onChange={this.toggleDuet} checked={!!this.props.game.duetMode}/>
                  <span className="slider round"></span>
                </label>
                <div className="switch-label">Duet</div>
              </div>
            </div>
            <div className="right">
              {!this.props.game.duetMode ?
              <React.Fragment>
              <div className="switch-input">
                <label className="switch">
                    <input type="checkbox" value={this.props.options.role === 'Spymaster' ? 'Player' : 'Spymaster'} onChange={this.changeRole} checked={this.props.options.role === 'Spymaster'} />
                  <span className="slider round"></span>
                </label>
                <div className="switch-label">Spymaster</div>
              </div>
              <div className="switch-input">
                <label className="switch">
                  <input type="checkbox" onChange={this.toggleHardMode} checked={!!this.props.game.hardMode}/>
                  <span className="slider round"></span>
                </label>
                <div className="switch-label">Hard mode</div>
              </div>
              </React.Fragment>
              :
              <React.Fragment>
              <div className="switch-input">
                <div className="switch-label">&nbsp;Team Two</div>
                <label className="switch">
                  <input type="checkbox" onChange={this.toggleDuetTeam} checked={!this.props.options.duetTeamOne}/>
                  <span className="slider round"></span>
                </label>
                <div className="switch-label">Team One</div>
              </div>
              </React.Fragment>
              }
              <button id="next-game" onClick={this.newGame}>Next game</button>
            </div>
          </div>
          <div id="expansions">
            <div id="instruction">Select your word packs</div>
            <div>
              <input id="vanilla" value="vanilla" className={"expansion" + this.highlightIfClicked('VANILLA')} type="image" src="/images/vanilla.png" alt="Base Game" onClick={this.toggleWordPack} />
              <input id="duet" value="duet" className={"expansion" + this.highlightIfClicked('DUET')} type="image" src="/images/duet.png" alt="Duet" onClick={this.toggleWordPack} />
              <input id="undercover" value="undercover" className={"expansion" + this.highlightIfClicked('UNDERCOVER')} type="image" src="/images/deep_undercover.png" alt="Deep Undercover" onClick={this.toggleWordPack} />
            </div>
            <div id="words-changed" className="hidden">Your word packs will be used in the next game</div>
          </div>
        </div>
      </div>
    );
  }

  /* Helper/dispatch functions */
  /* Client actions */
  highlightIfClicked(expansion)
  {
    // Toggle .selected class on expansion
    if(this.props.options.selectedExpansions.includes(expansion))
    {
      return ' selected';
    }
    return '';
  }

  // Score CSS classes and info
  createScoreboard()
  {
    let firstTeamColour;
    let firstTeamScore;
    let secondTeamColour;
    let secondTeamScore;
    if (this.props.game.blueTeamFirst)
    {
      firstTeamColour = 'blue';
      firstTeamScore = this.props.game.blueCards;
      secondTeamColour = 'red';
      secondTeamScore = this.props.game.redCards;
    }
    else
    {
      firstTeamColour = 'red';
      firstTeamScore = this.props.game.redCards;
      secondTeamColour = 'blue';
      secondTeamScore = this.props.game.blueCards;
    }

    // Duet
    let duetScore = this.props.game.duet.cardsLeft;

    return {firstTeamColour, firstTeamScore, secondTeamColour, secondTeamScore, duetScore};
  }

  changeRole(event)
  {
    let el = event.target;

    this.props.dispatch(changeRole(el.value))
  }

  toggleDuetTeam()
  {
    this.props.dispatch(toggleDuetTeam());
  }

  toggleColourblind()
  {
    this.props.dispatch(toggleColourblind());
  }

  toggleNightMode()
  {
    this.props.dispatch(toggleNightMode());
  }

  toggleWordPack(event)
  {
    // Add helper text
    let spiel = document.getElementById('words-changed');
    spiel.classList.remove('hidden');

    // Get the expansion clicked and obtain its value
    let el = event.target;
    this.props.dispatch(toggleExpansion(el.value.toUpperCase()));
  }
  
  /* Server actions */
  loadGame(gameName)
  {    
    this.props.dispatch(loadGame(gameName));
  }

  newGame()
  {
    startNewGame(this.props.game.gameName, this.props.options.selectedExpansions);
  }
  
  cardClick(cardIndex)
  {
    const cards = this.props.game.cards.slice();

    if (cards[cardIndex].clicked || this.props.options.role === 'Spymaster')
    {
      return;
    }

    if(this.props.game.duetMode)
    {
      if(((this.props.game.duet.teamOneTurn && !this.props.options.duetTeamOne) ||
        (!this.props.game.duet.teamOneTurn && this.props.options.duetTeamOne)) &&
          this.props.game.duet.timerTokens !== 0)
        {
          return;
        }
    }

    const teamClicked = this.props.game.blueTurn ? 'Blue' : 'Red';
    const duetTeamClicked = this.props.options.duetTeamOne ? 'One' : 'Two';

    cardClick(this.props.game.gameName, cardIndex, teamClicked, duetTeamClicked);
  }

  endTurn()
  {
    endTurn(this.props.game.gameName);
  }

  toggleHardMode()
  {
    toggleHardMode(this.props.game.gameName);
  }  

  toggleDuet()
  {
    toggleDuet(this.props.game.gameName);
  }  

  // React Native checks for when a device goes from inactive to active
  componentDidMount() {
    AppState.addEventListener('change', this.reconnectToGame);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.reconnectToGame);
  }

  reconnectToGame = (nextAppState) => {
    
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // Reconnect the sockets and load the game's current state
      this.state.socket.connect(socketUrl);
      this.loadGame(this.state.gameName);
    }
    this.setState({appState: nextAppState});
  };
}

export default connect(stateMap)(Game);
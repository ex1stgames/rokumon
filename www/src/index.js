import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import _ from 'lodash';

function Card(props) {
  const kindClass = props.kind.toLowerCase();
  const selectedClass = props.selected ? 'selected-card' : '';
  const { x, y } = coord_to_position(props.grid, props.coord);
  const styles = {
    left: x,
    top: y,
  };

  return (
    <div
      style={styles}
      className={`card ${kindClass} ${selectedClass}`}
      onClick={props.onClick}>

      <span className="card-ix">{props.ix}</span>

      {props.dice.map(d =>
        <DieOnCard color={d.color} value={d.value} />
      )}

    </div>
  )
}

function Die(props) {
  const die_char = "⚀⚁⚂⚃⚄⚅"[props.value - 1];
  const selected_clz = props.selected ? 'selected-die' : '';
  return (
    <span
      className={`die ${props.color.toLowerCase() + '-die'} ${selected_clz}`}
      onClick={props.onClick}>
      {die_char}
    </span>
  )
}

function DieOnCard(props) {
  const die_char = "⚀⚁⚂⚃⚄⚅"[props.value - 1];
  return (
    <span className={`die-on-card ${props.color.toLowerCase() + '-die-on-card'}`}>
      {die_char}
    </span>
  );
}

function DiceStock(props) {
  return (
    <div className="dice-stock">
      {props.dice.map((d, ix) =>
        <Die
          key={ix}
          color={d.color}
          value={d.value}
          selected={d === props.selectedDie}
          onClick={() => props.onClick(d)}
        />
      )}
    </div>
  )
}

class Board extends React.Component {
  render() {
    return (
      <div className="card-board">
        {this.props.cards.map((coord_card, ix) => {
          const [coord, card] = coord_card;
          return (<Card
            key={coord}
            ix={ix}
            coord={coord}
            grid={this.props.grid}
            kind={card.kind}
            dice={card.dice}
            selected={coord === this.props.selectedCard}
            onClick={() => this.props.onClick(coord)}
          />);
        }
        )}
      </div>
    );
  }
}

function History(props) {
  return (
    <div>
      History:
      <ol>
        {props.moves.map((move, ix) =>
          <li>Move {ix}: {ppMove(move)}</li>
        )}
      </ol>
    </div>
  );
}

function GameInfo(props) {
  const status = "The game is about to start";
  const sel_die = props.selectedDie;
  const selected_die_info = sel_die ? sel_die.color + sel_die.value : 'None';

  return (
    <div className="game-info">
      <div>Status: {status}</div>
      <div>To move: {props.whoMoves}</div>
      <div>Selected card: {props.selectedCardInfo}</div>
      <div>Selected die: {selected_die_info}</div>
    </div>
  );
}

class Game extends React.Component {
  constructor(props) {
    super(props);

    const game = props.game_data;
    const board = game.board;
    const player1 = game.player1;
    const player2 = game.player2;
    const player1_moves = game.player1_moves;
    const history = game.history;

    this.state = {
      board: {
        grid: board.grid,
        cards: board.cards
      },
      player1_moves,
      player1,
      player2,
      history,

      selected_card: null,
      selected_die: null,
    }
  }

  getCardAtCoord(board, target_coord) {
    const target = JSON.stringify(target_coord);
    const coord_card = board.cards.find((coord_card) => JSON.stringify(coord_card[0]) === target);
    return coord_card ? coord_card[1] : undefined;
  }

  handleDieClick(die) {
    this.setState({ selected_die: die, selected_card: null });
  }

  handleCardClick(coord) {
    if (this.state.selected_card === coord) {
      // Deselect previously selected card.
      this.setState({ selected_card: null });
    } else if (this.state.selected_die !== null) {
      // Place selected die on this card.
      const move = { kind: 'place', what: this.state.selected_die, where: coord };
      const history = this.state.history.concat([move]);
      this.applyMove(move);
      this.setState({ selected_die: null, history: history });
    } else if (this.state.selected_card !== null) {
      // Move a die from previously selected card to this one.
      const move = { kind: 'move', from: this.state.selected_card, to: coord };
      const history = this.state.history.concat([move]);
      this.applyMove(move);
      this.setState({ selected_die: null, selected_card: null, history: history });
    } else {
      // Select first card.
      this.setState({ selected_die: null, selected_card: coord });
    }
  }

  applyMove(move) {
    switch (move.kind) {
      case 'place':
        // Delete die from this player's supply.
        if (this.state.player1_moves) {
          let player1_copy = _.cloneDeep(this.state.player1);
          player1_copy.dice.splice(player1_copy.dice.findIndex(d => d === move.what), 1);
          this.setState({ player1: player1_copy });
        } else {
          let player2_copy = _.cloneDeep(this.state.player2);
          player2_copy.dice.splice(player2_copy.dice.findIndex(d => d === move.what), 1);
          this.setState({ player2: player2_copy });
        }

        // Put the die on the card.
        let board_copy = _.cloneDeep(this.state.board);
        let card = this.getCardAtCoord(board_copy, move.where);
        card.dice.push(move.what);
        this.setState({
          board: board_copy,
          player1_moves: !this.state.player1_moves
        });

        break;

      default:
        break;

    }
  }

  getMoveFromBot() {
    const move = this.props.playground.get_move();
    this.setState({ ai_says: move })
  }

  applyBotAdvice() {
    const move = this.state.ai_says;
    for (const kind in move) {
      if (kind === "Place") {
        const [what, where] = move[kind];
        // what is a coordinate
        // where is a die
      }
    }
  }

  render() {
    const who_moves = this.state.player1_moves ? this.state.player1.name : this.state.player2.name;
    const sel_card_coord = this.state.selected_card;
    const card = this.getCardAtCoord(this.state.board, sel_card_coord);
    const selected_card_info = card ? card.kind : 'None';

    return (
      <div className="game">
        <button onClick={() => this.getMoveFromBot()}>Get move</button>
        <div>AI says: {JSON.stringify(this.state.ai_says)}</div>
        <button onClick={() => this.applyBotAdvice()}>Apply bot advice</button>
        <DiceStock
          dice={this.state.player2.dice}
          selectedDie={this.state.selected_die}
          onClick={(die) => this.handleDieClick(die)}
        />
        <Board
          cards={this.state.board.cards}
          grid={this.state.board.grid}
          selectedCard={this.state.selected_card}
          onClick={(coord) => this.handleCardClick(coord)}
        />
        <DiceStock
          dice={this.state.player1.dice}
          selectedDie={this.state.selected_die}
          onClick={(die) => this.handleDieClick(die)}
        />
        <GameInfo
          whoMoves={who_moves}
          selectedCardInfo={selected_card_info}
          selectedDie={this.state.selected_die}
        />
        <History moves={this.state.history} />
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { wasm: {}, wasm_loaded: false, game: {}, playground: {} };
  }

  render() {
    return this.state.wasm_loaded
      ? <Game game_data={this.state.game} playground={this.state.playground} />
      : <span>Loading wasm...</span>;
  }

  componentDidMount() {
    this.loadWasm();
  }

  loadWasm = async () => {
    console.log("loadWasm");
    try {
      const wasm = await import('rokumon_wasm');

      // TODO: get those from UI
      const opts = wasm.Opts.new(false, true);
      let playground = wasm.Playground.new(opts);
      const game = playground.get_game();
      this.setState({ wasm, wasm_loaded: true, game, playground });

    } catch (err) {
      console.error(`Unexpected error in loadWasm. Message: ${err.message}`);
    }
  };
}


// ========================================

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

// Utils.

function ppMove(move) {
  switch (move.kind) {
    case 'place':
      return 'place ' + ppDie(move.what) + ' at card ' + JSON.stringify(move.where);
    case 'move':
      return 'move from card ' + JSON.stringify(move.from) + ' to card ' + JSON.stringify(move.to);
    default:
      return 'unknown move';
  }
}

function ppDie(die) {
  return die.color + die.value;
}

function coord_to_position(grid, coord) {
  if (grid === "Hex") {
    const scale_x = 45;
    const scale_y = 70;
    const shift_x = 20;
    const shift_y = 100;

    const q = coord.x;
    const r = coord.y;
    const sqt = Math.sqrt(3);

    return {
      x: shift_x + Math.round(scale_x * (sqt * q + sqt / 2 * r)),
      y: shift_y + Math.round(scale_y * (3 / 2 * r))
    }
  } else {
    const scale_x = 80;
    const scale_y = 100;
    const shift_x = 15;
    const shift_y = 100;

    return {
      x: shift_x + scale_x * coord.x,
      y: shift_y + scale_y * coord.y
    }
  }
}

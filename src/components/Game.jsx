import React, { useEffect, useState } from 'react';
import { generateTable, beginNextRound, determinePhaseStartActivePlayer } from '../utils/players';
import { dealPrivateCards, dealMissingCommunityCards, showDown, generateDeckOfCards, shuffle } from '../utils/cards';

const Game = () => {
  const [state, setState] = useState({
    players: [],
    activePlayerIndex: null,
    communityCards: [],
    deck: [],
    phase: 'pre-flop',
    minBet: 20,
    highBet: 20,
    betInputValue: 20,
    dealerIndex: 0,
    blindIndex: {
      small: 1,
      big: 2
    },
    numPlayersAllIn: 0,
    numPlayersFolded: 0,
    numPlayersActive: 0,
  });

  useEffect(() => {
    const initializeGame = async () => {
      try {
        const players = await generateTable();
        const initialState = {
          ...state,
          players,
          numPlayersActive: players.length,
          deck: shuffle(generateDeckOfCards()), // Ensure the deck is shuffled
        };
        const stateWithDealer = beginNextRound(initialState);
        const stateWithActivePlayer = determinePhaseStartActivePlayer(stateWithDealer);
        setState(stateWithActivePlayer);
        runGameLoop(stateWithActivePlayer);
      } catch (err) {
        console.error('Error initializing game', err);
      }
    };

    initializeGame();
  }, []);

  const runGameLoop = (currentState) => {
    setState(prevState => {
      return dealPrivateCards(currentState);
    });
  };

  return (
    <div>
      <h1>Poker Game</h1>
      {/* Render game components */}
    </div>
  );
};

export default Game;
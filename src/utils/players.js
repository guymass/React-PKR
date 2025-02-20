import uuid from 'uuid/v1';
import axios from 'axios';
import { handlePhaseShift, reconcilePot, anteUpBlinds, determineBlindIndices } from './bet.js';
import { dealMissingCommunityCards, showDown, generateDeckOfCards, shuffle, dealPrivateCards } from './cards.js';

const backendUrl = 'http://192.168.1.112:5000/api';

const generateTable = async () => {
  try {
    const usersResponse = await axios.get(`${backendUrl}/users`);
    const users = usersResponse.data;

    const tablesResponse = await axios.get(`${backendUrl}/tables`);
    const tables = tablesResponse.data;

    if (!tables || tables.length === 0) {
      throw new Error('No tables found');
    }

    const table = tables[0];

    const userTablesResponse = await axios.get(`${backendUrl}/usertables/${table.table_id}`);
    const userTables = userTablesResponse.data;

    const players = userTables.map(ut => {
      const user = users.find(u => u.user_id === ut.user_id);
      return {
        id: user.user_id,
        name: user.username,
        avatarURL: user.avatar_url || '/assets/default_avatar.svg',
        cards: [],
        chips: user.chips_balance,
        roundStartChips: user.chips_balance,
        roundEndChips: user.chips_balance,
        currentRoundChipsInvested: 0,
        showDownHand: {
          hand: [],
          descendingSortHand: [],
        },
        bet: 0,
        betReconciled: false,
        folded: false,
        allIn: false,
        robot: false,
        canRaise: true,
        stackInvestment: 0,
      };
    });

    // Ensure a minimum of two players; if not enough, add dummy computer player(s)
    while (players.length < 2) {
      const randomizedChips = Math.floor(Math.random() * (20000 - 18000)) + 18000;
      players.push({
        id: uuid(),
        name: `ComputerPlayer${players.length + 1}`,
        avatarURL: '/assets/default_avatar.svg',
        cards: [],
        chips: randomizedChips,
        roundStartChips: randomizedChips,
        roundEndChips: randomizedChips,
        currentRoundChipsInvested: 0,
        showDownHand: {
          hand: [],
          descendingSortHand: [],
        },
        bet: 0,
        betReconciled: false,
        folded: false,
        allIn: false,
        robot: true,
        canRaise: true,
        stackInvestment: 0,
      });
    }

    return players;
  } catch (err) {
    console.error('Error fetching data', err);
    throw err;
  }
};

const generatePersonality = (seed) => {
  switch (seed) {
    case (seed > 0.5):
      return 'standard';
    case (seed > 0.35):
      return 'aggressive';
    case (seed > 0):
    default:
      return 'conservative';
  }
};

const handleOverflowIndex = (currentIndex, incrementBy, arrayLength, direction) => {
  switch (direction) {
    case ('up'): {
      return (
        (currentIndex + incrementBy) % arrayLength
      );
    }
    case ('down'): {
      return (
        ((currentIndex - incrementBy) % arrayLength) + arrayLength
      );
    }
    default: throw Error("Attempted to overflow index on unfamiliar direction");
  }
};

const determinePhaseStartActivePlayer = (state, recursion = false) => {
  if (!recursion) {
    state.activePlayerIndex = handleOverflowIndex(state.blindIndex.big, 1, state.players.length, 'up');
  } else if (recursion) {
    state.activePlayerIndex = handleOverflowIndex(state.activePlayerIndex, 1, state.players.length, 'up');
  }
  if (state.players[state.activePlayerIndex].folded) {
    return determinePhaseStartActivePlayer(state, true);
  }
  if (state.players[state.activePlayerIndex].chips === 0) {
    return determinePhaseStartActivePlayer(state, true);
  }
  return state;
};

const determineNextActivePlayer = (state) => {
  state.activePlayerIndex = handleOverflowIndex(state.activePlayerIndex, 1, state.players.length, 'up');
  const activePlayer = state.players[state.activePlayerIndex];

  const allButOnePlayersAreAllIn = (state.numPlayersActive - state.numPlayersAllIn === 1);
  if (state.numPlayersActive === 1) {
    console.log("Only one player active, skipping to showdown.");
    return showDown(reconcilePot(dealMissingCommunityCards(state)));
  }
  if (activePlayer.folded) {
    console.log("Current player index is folded, going to next active player.");
    return determineNextActivePlayer(state);
  }

  if (
    allButOnePlayersAreAllIn &&
    !activePlayer.folded &&
    activePlayer.betReconciled
  ) {
    return showDown(reconcilePot(dealMissingCommunityCards(state)));
  }

  if (activePlayer.chips === 0) {
    if (state.numPlayersAllIn === state.numPlayersActive) {
      console.log("All players are all in.");
      return showDown(reconcilePot(dealMissingCommunityCards(state)));
    } else if (allButOnePlayersAreAllIn && activePlayer.allIn) {
      return showDown(reconcilePot(dealMissingCommunityCards(state)));
    } else {
      return determineNextActivePlayer(state);
    }
  }

  if (activePlayer.betReconciled) {
    console.log("Player is reconciled with pot, round betting cycle complete, proceed to next round.");
    return handlePhaseShift(state);
  }

  return state;
};

const passDealerChip = (state) => {
  state.dealerIndex = handleOverflowIndex(state.dealerIndex, 1, state.players.length, 'up');
  const nextDealer = state.players[state.dealerIndex];
  if (nextDealer.chips === 0) {
    return passDealerChip(state);
  }

  return filterBrokePlayers(state, nextDealer.name);
};

const filterBrokePlayers = (state, dealerID) => {
  state.players = state.players.filter(player => player.chips > 0);
  const newDealerIndex = state.players.findIndex(player => player.name === dealerID);
  state.dealerIndex = newDealerIndex;
  state.activePlayerIndex = newDealerIndex;
  if (state.players.length === 1) {
    return state;
  } else if (state.players.length === 2) {
    state.blindIndex.small = newDealerIndex;
    state.blindIndex.big = handleOverflowIndex(newDealerIndex, 1, state.players.length, 'up');
    state.players = anteUpBlinds(state.players, { bigBlindIndex: state.blindIndex.big, smallBlindIndex: state.blindIndex.small }, state.minBet).map(player => ({
      ...player,
      cards: [],
      showDownHand: {
        hand: [],
        descendingSortHand: [],
      },
      roundStartChips: player.chips + player.bet,
      currentRoundChipsInvested: 0,
      betReconciled: false,
      folded: false,
      allIn: false,
    }));
    state.numPlayersAllIn = 0;
    state.numPlayersFolded = 0;
    state.numPlayersActive = state.players.length;
  } else {
    const blindIndices = determineBlindIndices(newDealerIndex, state.players.length);
    state.blindIndex = {
      big: blindIndices.bigBlindIndex,
      small: blindIndices.smallBlindIndex,
    };
    state.players = anteUpBlinds(state.players, blindIndices, state.minBet).map(player => ({
      ...player,
      cards: [],
      showDownHand: {
        hand: [],
        descendingSortHand: [],
      },
      roundStartChips: player.chips + player.bet,
      currentRoundChipsInvested: 0,
      betReconciled: false,
      folded: false,
      allIn: false,
    }));
    state.numPlayersAllIn = 0;
    state.numPlayersFolded = 0;
    state.numPlayersActive = state.players.length;
  }
  return dealPrivateCards(state);
};

const beginNextRound = (state) => {
  state.communityCards = [];
  state.sidePots = [];
  state.playerHierarchy = [];
  state.showDownMessages = [];
  state.deck = shuffle(generateDeckOfCards());
  state.highBet = 20;
  state.betInputValue = 20;
  state.minBet = 20;
  const { players } = state;
  const clearPlayerCards = players.map(player => ({ ...player, cards: player.cards.map(card => {}) }));
  state.players = clearPlayerCards;
  return passDealerChip(state);
};

const checkWin = players => {
  return (players.filter(player => player.chips > 0).length === 1);
};

export { generateTable, handleOverflowIndex, determineNextActivePlayer, determinePhaseStartActivePlayer, beginNextRound, checkWin };
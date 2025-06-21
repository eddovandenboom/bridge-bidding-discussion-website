// Bridge-specific types
export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Seat = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
export type Vulnerability = 'None' | 'NS' | 'EW' | 'Both';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Hand {
  spades: Card[];
  hearts: Card[];
  diamonds: Card[];
  clubs: Card[];
}

export interface BridgeBoard {
  id: string;
  boardNumber: number;
  dealer: Seat;
  vulnerability: Vulnerability;
  hands: {
    north: Hand;
    south: Hand;
    east: Hand;
    west: Hand;
  };
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  venue?: string;
  boards: BridgeBoard[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'GUEST';
}

export interface Comment {
  id: string;
  content: string;
  boardId: string;
  userId: string;
  user: User;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}
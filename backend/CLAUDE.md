# Bridge Bidding Discussion Website - Backend

## Important Notes

### Development Server Issues
- **DO NOT** run `npm run dev` or `npm start` - the backend server is likely already running
- The backend server stays running in the background and takes a long time to start
- Always check for blank page errors before declaring work complete
- Use `ps aux | grep node` to check if backend is already running
- Use `kill -9 <pid>` to stop if needed

### Bridge Bidding Rules
- Bidding starts with the dealer, not always North
- Current seat rotation: NORTH → EAST → SOUTH → WEST
- Dealer position determines who bids first

### Recent Issues Fixed
- TypeScript interface exports don't work across modules - use local type definitions
- Poll display requires proper component structure with poll data fetching
- BiddingEntry expects both boardId and boardNumber props
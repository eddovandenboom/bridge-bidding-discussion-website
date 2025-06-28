# Bridge Bidding Discussion Website - Functional Requirements

## 1. Introduction

This document outlines the functional requirements for the Bridge Bidding Discussion Website. The application is a specialized social platform for bridge players to upload, analyze, and discuss bridge hands from tournaments. It provides tools for detailed bidding analysis, collaborative discussion, and knowledge sharing.

---

## 2. User Management & Authentication

### 2.1. User Accounts
- Users must be able to register for a new account using a username, email address, and password. Real names are not required.
- Users must be able to log in and log out of their accounts.

### 2.2. User Roles
The system supports three user roles with different levels of permissions:
- **Guest:** Unauthenticated users who can browse public content (e.g., tournaments, boards, discussions) but cannot participate.
- **User:** Authenticated users who can participate in all social features, including commenting, voting, and creating bidding sequences.
- **Admin:** Users with elevated privileges who can manage site-wide content, such as importing tournaments (via PBN files) and managing labels.

---

## 3. Core Bridge Features

### 3.1. Tournament and Board Navigation
- The main view of the application lists all available tournaments.
- Users can expand a tournament to see a preview of all the boards it contains.
- Each board preview displays summary information, such as the number of comments and polls associated with it.
- Users can select a board to open a detailed discussion view.

### 3.2. Hand Visualization and bidding system
- Use the hand viewer that is detailed on: https://www.bridgebase.com/tools/hvdoc.html
- Every user should be able to create and save bidding sequences and card plays using the hand viewer
- The user should be able to keep them personal, or to share them with the community
- It should be possible to refer to sequences/card plays that are created in the handviewer in a discussion (4.1) and polls (4.2)
    - Example 1: given the beginning of a bidding sequence, it should be possible to create a poll about what to bid next
    - Example 2: given a bidding sequence, it should be possible to vote on the lead, and given a bidding sequence and a sequence of card plays, it should be possible to vote about what is the best continuation.

### 3.3. Play Sequence Analysis
- Support the entry and analysis of the card-by-card play sequence after the auction is complete (double dummy analysis). Note: this is already part of the above hand viewer

---

## 4. Social and Discussion Features

### 4.1. Threaded Discussions
- A dedicated commenting system is available for each board.
- Users can post comments to discuss the hand, bidding, or play.
- The comment system is threaded, allowing users to reply directly to other comments, creating nested discussion threads.
- Comments display the author's username and a timestamp.

### 4.2. Polling System
- Users can create polls to survey opinions on a specific board.
- Polls are multiple-choice, allowing the creator to define several options.
- All users can vote in polls, and the results (which user voted for which option) are public.

---

## 5. Data Organization and Discovery

### 5.1. PBN Data Integration
- The system can import bridge game data from standard Portable Bridge Notation (.pbn) files.
- The application is configured to automatically fetch new tournament files from an external source (https://1011.bridge.nl/competities/) on a weekly basis.

### 5.2. Labeling System
- The system provides a set of predefined, color-coded labels for categorizing boards.
- Users can apply one or more labels to a board to tag it with concepts (e.g., "Weak Two," "Slam Try," "Defensive Problem").

### 5.3. Advanced Search and Filtering
- A powerful search and filtering tool is available to help users find specific hands.
- Users can perform a full-text search across tournament names, board details, and comment content.
- Users can filter the list of boards based on multiple criteria simultaneously:
    - Labels
    - Dealer
    - Vulnerability
    - Board number (or a range of numbers)
    - Tournament date (or a range of dates)

---

## 6. Administrator Features

### 6.1. Admin Panel
- Users with the "Admin" role have access to a dedicated administration panel.

### 6.2. Tournament Management
- Admins can manually upload a .pbn file to import a new tournament into the system.
- Admins can view statistics for and delete existing tournaments.

### 6.3. Label Management
- Admins are responsible for creating and managing the site-wide set of labels available for board categorization.
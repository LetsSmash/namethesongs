# Name the Songs

## Overview

This project is a Next.js-based web application where users can guess the titles of songs from a specific album. It leverages MusicBrainz API to fetch album data and track lists, offering a fun and interactive way for users to test their knowledge of various albums and their tracks.

### Features

- **Album Search**: Users can search for an album by name to start the game.
- **Song Guessing**: Once an album is selected, users attempt to guess the titles of tracks in that album.
- **Time Limit**: Each guessing session has a time limit, encouraging quick thinking.
- **Responsive Design**: The game is designed to be responsive, ensuring a great experience on devices of all sizes.
  
## Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

## Getting Started

To get the project up and running on your local machine, follow these steps:

1. **Clone the Repository**

```bash
git clone https://github.com/letssmash/namethesongs.git
cd namethesongs
```

2. **Install Dependencies**

```bash
npm install
# or
yarn install
```

4. **Running the Development Server**

```bash
npm run dev
# or
yarn dev
```

Navigate to `http://localhost:3000` in your browser to see the application in action.

## Usage

- **Start Game**: Enter an album name in the provided input field and submit to fetch the tracks associated with that album.
- **Guess Tracks**: Type your guesses for the song titles within the given time limit. Correct guesses will be highlighted.
- **End Game**: The game ends either when the time runs out or all songs are correctly guessed. You can also manually end the game by clicking the "Give Up" option.

## Upcoming Features
- Guess the complete Discography instead of just one Album
- Highscores (local and online)
- Speedrun Mode (Counts how fast you were)
- Multiplayer Mode (Against Friends or online)
## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## License

Distributed under the MIT License. See `LICENSE` for more information.

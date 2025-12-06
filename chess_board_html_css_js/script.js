// --- 1. CONFIGURATION & OPENINGS DATA ---
// moved to chessopenings.js

// --- 2. INITIALIZATION & State ---
var board = null;
var game = new Chess();
var currentOpeningMoves = []; // Stores the full sequence of moves (e.g., ["e4", "e5", ...])
var currentMoveIndex = -1; // Tracks the current position in the sequence

var config = {
  position: "start",
  draggable: false,
  // 👇 Local Image Path
  pieceTheme:
    "img/chesspieces/wikipedia/{piece}.png"
};
board = Chessboard("myBoard", config);

const selector = document.getElementById("openingSelector");
const pgnOutput = document.getElementById("pgn-output");

// Populate the dropdown menu
for (const name in openings) {
  const option = document.createElement("option");
  option.value = name;
  option.innerText = name;
  selector.appendChild(option);
}

// --- 3. CORE FUNCTIONS ---

function updateBoardAndNotation() {
  // Update the visual board to the game's current FEN
  board.position(game.fen());

  // Get the move history and format it for display
  const history = game.history({ verbose: true });

  // Format the PGN string for display
  let pgnString = "";
  for (let i = 0; i < history.length; i++) {
    if (i % 2 === 0) {
      // White's move
      pgnString += i / 2 + 1 + ". ";
    }
    // Highlight the last move played
    const moveClass = i === currentMoveIndex ? ' class="highlight"' : "";
    pgnString += `<span${moveClass}>${history[i].san}</span> `;
  }

  pgnOutput.innerHTML = pgnString.trim();
}

// --- 4. EVENT HANDLERS ---

// When a new opening is selected, initialize the game state
selector.addEventListener("change", () => {
  const selectedOpening = selector.value;
  currentOpeningMoves = openings[selectedOpening]
    .split(" ")
    .filter((m) => m.trim().length > 0);
  game.reset();
  currentMoveIndex = -1;
  updateBoardAndNotation();
});

// Move forward one step
document.getElementById("nextBtn").addEventListener("click", () => {
  if (currentMoveIndex < currentOpeningMoves.length - 1) {
    currentMoveIndex++;
    game.move(currentOpeningMoves[currentMoveIndex]);
    updateBoardAndNotation();
  }
});

// Move backward one step
document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentMoveIndex >= 0) {
    game.undo(); // Undo the last move
    currentMoveIndex--;
    updateBoardAndNotation();
  }
});

// Reset to start
document.getElementById("resetBtn").addEventListener("click", () => {
  game.reset();
  currentMoveIndex = -1;
  updateBoardAndNotation();
});

// Initialize the board on page load
updateBoardAndNotation();
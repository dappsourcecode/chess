// --- 1. STATE & FALLBACK DATA ---
var board = null;
var game = new Chess();
var currentOpeningMoves = [];
var currentMoveIndex = -1;
let openings = {}; // This will hold the JSON data or the fallback data

// --- 2. INITIALIZATION ---
var config = {
    position: 'start',
    draggable: false, 
    pieceTheme: 'img/chesspieces/wikipedia/{piece}.png' 
}
board = Chessboard('myBoard', config);

// UI Elements
const selector = document.getElementById('openingSelector');
const pgnOutput = document.getElementById('pgn-output');
const customContainer = document.getElementById('customInputContainer');
const pgnInput = document.getElementById('pgnInput');

// Load Data (with Fallback Logic)
async function initBoard() {
    let dataLoaded = false;
    
    try {
        const response = await fetch('openings.json');
        // Check if the response is OK (HTTP status 200)
        if (response.ok) {
            openings = await response.json();
            dataLoaded = true;
            console.log("Openings loaded successfully from openings.json.");
        } else {
            throw new Error(`Failed to fetch JSON with status: ${response.status}`);
        }
    } catch (error) {
        // If fetching or parsing fails, use the local fallback data
        console.warn("Could not load openings.json. Using local fallback data.", error);
        openings = local_openings; // from chessopenings.js
        dataLoaded = true;
    }

    // Only proceed if we have successfully loaded data (from JSON or fallback)
    if (dataLoaded) {
        // Populate Dropdown
        for (const name in openings) {
            const option = document.createElement('option');
            option.value = name;
            option.innerText = name;
            selector.appendChild(option);
        }
    }
    
    attachEventListeners();
    updateBoardAndNotation();
}

// --- 3. HELPER: PARSE PGN ---
function loadMovesFromPGN(pgnText) {
    // Use Chess.js to parse the PGN automatically
    const tempGame = new Chess();
    const valid = tempGame.load_pgn(pgnText);
    
    if (!valid) {
        // Fallback: Manually try to parse standard moves
        tempGame.reset();
        const moves = pgnText.replace(/[\d]+\./g, '').split(/\s+/);
        for(let move of moves) {
            if(move.trim()) tempGame.move(move);
        }
    }

    // Extract the clean list of moves from the temp game history
    return tempGame.history(); 
}

// --- 4. CORE FUNCTIONS ---
function updateBoardAndNotation() {
    board.position(game.fen());
    
    // Render PGN with highlight
    const history = game.history({ verbose: true });
    let pgnString = '';
    for (let i = 0; i < history.length; i++) {
        if (i % 2 === 0) pgnString += (i / 2 + 1) + '. ';
        const moveClass = (i === currentMoveIndex) ? ' class="highlight"' : '';
        pgnString += `<span${moveClass}>${history[i].san}</span> `;
    }
    pgnOutput.innerHTML = pgnString.trim() || "Start Position";
}

function speakNotation(move) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(move);
        utterance.rate = 1.0; 
        window.speechSynthesis.speak(utterance);
    }
}

// --- 5. EVENT HANDLERS ---
function attachEventListeners() {
    
    // Dropdown Change
    selector.addEventListener('change', () => {
        const val = selector.value;
        
        if (val === "custom") {
            customContainer.style.display = "block";
        } else {
            customContainer.style.display = "none";
            // Get moves from the globally loaded 'openings' object (either JSON or local)
            currentOpeningMoves = openings[val].split(" ").filter(m => m.trim().length > 0);
            game.reset();
            currentMoveIndex = -1;
            updateBoardAndNotation();
        }
    });

    // "Load Moves" Button for Custom Input
    document.getElementById('loadCustomBtn').addEventListener('click', () => {
        const text = pgnInput.value;
        if(!text.trim()) { alert("Please enter some moves first."); return; }

        const parsedMoves = loadMovesFromPGN(text);
        
        if (parsedMoves.length === 0) {
            alert("Could not parse moves. Please check notation (e.g., 'e4 e5 Nf3').");
        } else {
            currentOpeningMoves = parsedMoves;
            game.reset();
            currentMoveIndex = -1;
            updateBoardAndNotation();
        }
    });

    // Forward Button
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentMoveIndex < currentOpeningMoves.length - 1) {
            currentMoveIndex++;
            const movePlayed = currentOpeningMoves[currentMoveIndex];
            game.move(movePlayed);
            speakNotation(movePlayed);
            updateBoardAndNotation();
        }
    });

    // Back Button
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentMoveIndex >= 0) {
            game.undo();
            currentMoveIndex--;
            updateBoardAndNotation();
        }
    });

    // Reset Button
    document.getElementById('resetBtn').addEventListener('click', () => {
        game.reset();
        currentMoveIndex = -1;
        updateBoardAndNotation();
    });

    // When the browser window is resized, tell the chessboard to redraw itself
    window.addEventListener('resize', board.resize);
}

initBoard();
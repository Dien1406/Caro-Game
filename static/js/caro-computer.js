// Kết nối socket thông qua LAN
let socket = io.connect("http");

// Khai báo bảng và người chơi đầu được sử dụng "X"
let boardElement = document.getElementById("board");
let statusElement = document.getElementById("status");
let board = [];
let currentPlayer = "X";

// Tạo bảng 20x20
for (let i = 0; i < 20; i++) {
  for (let j = 0; j < 20; j++) {
    let cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", handleClick, { once: true });
    boardElement.appendChild(cell);
    board.push(cell);
  }
}

// Handle mỗi Click và xử lý logic sau mỗi lần chọn vị trí
function handleClick(e) {
  // Kiểm tra xem ô đã được đánh chưa
  if (e.target.textContent === "") {
    e.target.textContent = currentPlayer;
    e.target.classList.add(currentPlayer.toLowerCase());
    // Highlight cell sau khi đánh
    e.target.classList.add("highlight");
    let index = board.indexOf(e.target);
    if (checkWin(index, currentPlayer)) {
      setTimeout(function () {
        alert("You win!");
        resetGame();
      }, 100); // Thêm trễ 100ms
    }
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    socket.emit("move_computer", {
      index: index,
      player: e.target.textContent,
    });

    // Máy tính đánh ngay sau khi người chơi đã đánh
    const computerMove = getComputerMove();
    // Kiểm tra xem ô đã được đánh chưa
    if (board[computerMove[0] * 20 + computerMove[1]].textContent === "") {
      board[computerMove[0] * 20 + computerMove[1]].textContent = currentPlayer;
      board[computerMove[0] * 20 + computerMove[1]].classList.add(
        currentPlayer.toLowerCase()
      );
      board[computerMove[0] * 20 + computerMove[1]].classList.add("highlight"); // Highlight the cell
      if (checkWin(computerMove[0] * 20 + computerMove[1], currentPlayer)) {
        setTimeout(function () {
          alert("Computer wins!");
          resetGame();
        }, 100); // Thêm trễ 100ms
      }
      currentPlayer = currentPlayer === "X" ? "O" : "X";
    }
  }
}

socket.on("move_computer", function (data) {
  board[data.index].textContent = data.player;
  currentPlayer = data.player === "X" ? "O" : "X";
});

function checkWin(index, player) {
  let row = Math.floor(index / 20); // Lấy số hàng
  let col = index % 20; // Lấy số cột
  let directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];
  for (let [dx, dy] of directions) {
    let count = 1; // Đếm số quân liên tiếp của người chơi hiện tại
    for (let i = 1; i < 5; i++) {
      let x = row + dx * i;
      let y = col + dy * i;
      if (
        x < 0 ||
        x >= 20 ||
        y < 0 ||
        y >= 20 ||
        board[x * 20 + y].textContent !== player
      ) {
        break;
      }
      count++;
    }
    for (let i = 1; i < 5; i++) {
      let x = row - dx * i;
      let y = col - dy * i;
      if (
        x < 0 ||
        x >= 20 ||
        y < 0 ||
        y >= 20 ||
        board[x * 20 + y].textContent !== player
      ) {
        break;
      }
      count++;
    }
    if (count >= 5) {
      return true;
    }
  }
  return false;
}

// Hằng số đánh giá điểm
const MAP_SCORE_COMPUTER = new Map([
  [5, Infinity],
  [4, 10000],
  [3, 5000],
  [2, 3000],
  [1, 1000],
]);

const MAP_POINT_HUMAN = new Map([
  [4, 1000000],
  [3, 800],
  [2, 400],
  [1, 10],
  [0, 0],
]);

// Hàm đánh giá điểm cho từng vị trí trên bảng
function evaluatePosition(row, col, player) {
  const directions = [
    [0, 1], // Ngang
    [1, 0], // Dọc
    [1, 1], // Chéo phải
    [1, -1], // Chéo trái
  ];

  let maxScore = -Infinity;

  for (const [dx, dy] of directions) {
    let count = 1;

    for (let i = 1; i < 5; i++) {
      let x = row + dx * i;
      let y = col + dy * i;

      if (
        x < 0 ||
        x >= 20 ||
        y < 0 ||
        y >= 20 ||
        board[x * 20 + y].textContent !== player
      ) {
        break;
      }

      count++;
    }

    for (let i = 1; i < 5; i++) {
      let x = row - dx * i;
      let y = col - dy * i;

      if (
        x < 0 ||
        x >= 20 ||
        y < 0 ||
        y >= 20 ||
        board[x * 20 + y].textContent !== player
      ) {
        break;
      }

      count++;
    }

    maxScore = Math.max(maxScore, count);
  }

  return maxScore;
}

// Hàm kiểm tra số điểm phòng thủ
function evaluateDefensePosition(row, col, player) {
  const directions = [
    [0, 1], // Ngang
    [1, 0], // Dọc
    [1, 1], // Chéo phải
    [1, -1], // Chéo trái
  ];

  let maxScore = 0; // Đặt giá trị thấp để ưu tiên phòng thủ

  for (const [dx, dy] of directions) {
    let count = 1;

    for (let i = 1; i < 5; i++) {
      let x = row + dx * i;
      let y = col + dy * i;

      if (
        x < 0 ||
        x >= 20 ||
        y < 0 ||
        y >= 20 ||
        board[x * 20 + y].textContent !== player
      ) {
        break;
      }

      count++;
    }

    for (let i = 1; i < 5; i++) {
      let x = row - dx * i;
      let y = col - dy * i;

      if (
        x < 0 ||
        x >= 20 ||
        y < 0 ||
        y >= 20 ||
        board[x * 20 + y].textContent !== player
      ) {
        break;
      }

      count++;
    }

    maxScore = Math.max(maxScore, count);
  }

  return maxScore;
}

// Hàm lấy danh sách các điểm có điểm số cao nhất
function getBestPoints() {
  let maxAttackScore = -Infinity;
  let maxDefenseScore = -Infinity;
  let bestAttackPoints = [];
  let bestDefensePoints = [];

  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if (board[i * 20 + j].textContent === "") {
        const attackScore = evaluatePosition(i, j, "O");
        const defenseScore = evaluateDefensePosition(i, j, "X");

        if (attackScore > maxAttackScore) {
          maxAttackScore = attackScore;
          bestAttackPoints = [[i, j]];
        } else if (attackScore === maxAttackScore) {
          bestAttackPoints.push([i, j]);
        }

        if (defenseScore > maxDefenseScore) {
          maxDefenseScore = defenseScore;
          bestDefensePoints = [[i, j]];
        } else if (defenseScore === maxDefenseScore) {
          bestDefensePoints.push([i, j]);
        }
      }
    }
  }

  // Ưu tiên tấn công nếu có điểm tấn công cao hơn, ngược lại ưu tiên phòng thủ
  return maxAttackScore >= maxDefenseScore
    ? bestAttackPoints
    : bestDefensePoints;
}

// Hàm di chuyển của máy
function getComputerMove() {
  const bestPoints = getBestPoints();
  const randomIndex = Math.floor(Math.random() * bestPoints.length);
  return bestPoints[randomIndex];
}

function resetGame() {
  // Xóa tất cả các nước đi trên bảng
  for (let i = 0; i < board.length; i++) {
    board[i].textContent = "";
    // Thêm lại sự kiện click vào ô
    board[i].addEventListener("click", handleClick, { once: true });
    // Xóa các sự kiện highlight và tô màu
    board[i].classList.remove("x", "o", "highlight");
  }
  // Đặt lại người chơi hiện tại
  currentPlayer = "X";
}

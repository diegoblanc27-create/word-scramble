  // Word bank: [word, hint]. Easy to expand!
  const WORDS = [
    ["python","A popular programming language"],["browser","Chrome or Firefox is one"],["keyboard","You type on it"],
    ["internet","Global network of computers"],["github","Hosts code repositories"],["variable","Stores a value in code"],
    ["function","Reusable block of code"],["database","Organized collection of data"],["network","Connects devices together"],
    ["server","Computer that serves web pages"],["algorithm","Step-by-step problem solving"],["pixel","Smallest dot on a screen"],
    ["laptop","Portable computer"],["monitor","Displays your computer’s output"],["software","Programs, not hardware"],
    ["security","Protecting data and systems"],["download","Copy a file from the web"],["password","Secret used to log in"],
    ["developer","Someone who writes code"],["website","A collection of web pages"],["code","Instructions for a computer"]
  ];
  const ROUNDS = 10;
  const DIFFICULTIES = {
    easy: { time: 30, maxLength: 7 },
    medium: { time: 20, minLength: 7, maxLength: 9 },
    hard: { time: 12, minLength: 8 }
  };
  const $ = id => document.getElementById(id);
  let words, idx, score, streak, correct, timeLeft, timeLimit, timer, current, hinted, locked;

  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const scramble = w => { let s; do { s = shuffle(w.split("")).join(""); } while (s === w); return s; };
  const getBest = () => { try { return +localStorage.getItem("wsBest") || 0; } catch { return 0; } };
  const setBest = v => { try { localStorage.setItem("wsBest", v); } catch {} };

  function show(id) { ["start","game","end"].forEach(s => $(s).classList.toggle("hidden", s !== id)); }
  function animateTiles(effect) {
    const tiles = $("tiles");
    tiles.classList.remove("shake", "pulse");
    void tiles.offsetWidth;
    tiles.classList.add(effect);
  }

  function startGame() {
    const difficulty = DIFFICULTIES[$("difficulty").value];
    timeLimit = difficulty.time;
    words = shuffle(WORDS.filter(([word]) =>
      (!difficulty.minLength || word.length >= difficulty.minLength) &&
      (!difficulty.maxLength || word.length <= difficulty.maxLength)
    )).slice(0, ROUNDS);
    idx = 0; score = 0; streak = 0; correct = 0;
    show("game"); nextWord();
  }

  function nextWord() {
    if (idx >= ROUNDS) return endGame();
    current = words[idx]; hinted = false; locked = false; timeLeft = timeLimit;
    $("tiles").innerHTML = scramble(current[0]).split("").map(c => `<div class="tile">${c}</div>`).join("");
    $("hint").textContent = ""; $("feedback").textContent = ""; $("feedback").className = "";
    $("guess").value = ""; $("guess").disabled = false; $("hintBtn").disabled = false; $("submitBtn").disabled = false;
    $("guess").focus();
    updateHud(); startTimer();
  }

  function updateHud() {
    $("round").textContent = idx + 1; $("score").textContent = score; $("streak").textContent = streak;
    $("progress").style.width = (idx / ROUNDS * 100) + "%";
    $("timerBar").firstElementChild.style.width = (timeLeft / timeLimit * 100) + "%";
    $("timerBar").firstElementChild.style.background = timeLeft <= 5 ? "var(--bad)" : "var(--good)";
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--; updateHud();
      if (timeLeft <= 0) { clearInterval(timer); finishRound(false, true); }
    }, 1000);
  }

  function submit() {
    if (locked) return;
    const g = $("guess").value.trim().toLowerCase();
    if (!g) return;
    if (g === current[0]) finishRound(true);
    else { animateTiles("shake"); $("feedback").textContent = "Not quite, try again!"; $("feedback").className = "bad"; $("guess").select(); }
  }

  function finishRound(win, timedOut) {
    locked = true; clearInterval(timer);
    $("guess").disabled = true; $("hintBtn").disabled = true; $("submitBtn").disabled = true;
    if (win) {
      animateTiles("pulse");
      const points = 10 + timeLeft + Math.min(streak, 5) * 2 - (hinted ? 5 : 0);
      score += Math.max(points, 1); streak++; correct++;
      $("feedback").textContent = `✅ Correct! +${Math.max(points, 1)} points`; $("feedback").className = "good";
    } else {
      streak = 0;
      $("feedback").textContent = `${timedOut ? "⏰ Time’s up!" : "Skipped."} The word was “${current[0]}”.`; $("feedback").className = "bad";
    }
    idx++; updateHud();
    setTimeout(nextWord, 1600);
  }

  function endGame() {
    clearInterval(timer); show("end");
    $("finalScore").textContent = score;
    $("summary").textContent = `You solved ${correct} of ${ROUNDS} words.`;
    const best = getBest();
    if (score > best) { setBest(score); $("newBest").textContent = "🎉 New best score!"; }
    else $("newBest").textContent = `Best score: ${best}`;
    $("best").textContent = Math.max(best, score);
  }

  $("best").textContent = getBest();
  $("startBtn").onclick = startGame;
  $("againBtn").onclick = startGame;
  $("submitBtn").onclick = submit;
  $("guess").addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  $("hintBtn").onclick = () => { if (!hinted && !locked) { hinted = true; $("hint").textContent = "💡 " + current[1]; $("hintBtn").disabled = true; } };

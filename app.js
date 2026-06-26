const defaultParticipants = [
  { name: "Aka", count: 100 },
  { name: "asgard", count: 30 },
  { name: "Low_Hp_Fan", count: 12 },
];

const palette = [
  "#f4bd4f",
  "#75d7ff",
  "#ec6847",
  "#8d5adf",
  "#5de0c1",
  "#f07db5",
  "#ffd87a",
  "#55a6ff",
];

const canvas = document.querySelector("#wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.querySelector("#spinButton");
const winnerName = document.querySelector("#winnerName");
const winnerWeight = document.querySelector("#winnerWeight");
const entryForm = document.querySelector("#entryForm");
const nameInput = document.querySelector("#nameInput");
const countInput = document.querySelector("#countInput");
const bulkInput = document.querySelector("#bulkInput");
const importButton = document.querySelector("#importButton");
const sampleButton = document.querySelector("#sampleButton");
const clearButton = document.querySelector("#clearButton");
const participantList = document.querySelector("#participants");
const template = document.querySelector("#participantTemplate");
const playerCount = document.querySelector("#playerCount");
const ticketCount = document.querySelector("#ticketCount");

let participants = loadParticipants();
let rotation = -Math.PI / 2;
let isSpinning = false;

function loadParticipants() {
  const saved = localStorage.getItem("lowHpLadyParticipants");
  if (!saved) return defaultParticipants;

  try {
    const parsed = JSON.parse(saved);
    return normalizeParticipants(parsed).length ? normalizeParticipants(parsed) : defaultParticipants;
  } catch {
    return defaultParticipants;
  }
}

function normalizeParticipants(items) {
  const merged = new Map();

  for (const item of items) {
    const name = String(item.name || "").trim();
    const count = Math.max(1, Math.round(Number(item.count || 0)));
    if (!name || !Number.isFinite(count)) continue;

    const key = name.toLowerCase();
    const previous = merged.get(key);
    merged.set(key, {
      name: previous ? previous.name : name,
      count: (previous ? previous.count : 0) + count,
    });
  }

  return [...merged.values()];
}

function saveParticipants() {
  localStorage.setItem("lowHpLadyParticipants", JSON.stringify(participants));
}

function totalTickets() {
  return participants.reduce((sum, participant) => sum + participant.count, 0);
}

function drawWheel() {
  const { width, height } = canvas;
  const center = width / 2;
  const radius = width * 0.48;
  const innerRadius = width * 0.19;
  const total = totalTickets();

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation);

  if (!total) {
    drawEmptyWheel(radius, innerRadius);
    ctx.restore();
    return;
  }

  let start = 0;
  participants.forEach((participant, index) => {
    const angle = (participant.count / total) * Math.PI * 2;
    const end = start + angle;
    const color = palette[index % palette.length];

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#07060a";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start + angle * 0.48, end);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(7, 6, 10, 0.7)";
    ctx.lineWidth = 4;
    ctx.stroke();

    drawSegmentLabel(participant, start + angle / 2, radius, angle);
    start = end;
  });

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#100b16";
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffd87a";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#100b16";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#f4bd4f";
  ctx.stroke();

  ctx.fillStyle = "#fff7e9";
  ctx.font = "800 30px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LOW HP", 0, -8);
  ctx.fillStyle = "#75d7ff";
  ctx.font = "700 19px Inter, sans-serif";
  ctx.fillText("LADY", 0, 28);

  ctx.restore();
}

function drawEmptyWheel(radius, innerRadius) {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#15101f";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#f4bd4f";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#07060a";
  ctx.fill();

  ctx.fillStyle = "#fff7e9";
  ctx.font = "800 26px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Ajoute", 0, -14);
  ctx.fillText("des pseudos", 0, 20);
}

function drawSegmentLabel(participant, angle, radius, segmentAngle) {
  ctx.save();
  ctx.rotate(angle);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#110b13";
  ctx.font = `${segmentAngle < 0.2 ? "700 18px" : "800 23px"} Inter, sans-serif`;

  const available = Math.max(72, radius * 0.66);
  const label = fitText(participant.name, available);
  ctx.fillText(label, radius * 0.9, 0);

  if (segmentAngle > 0.16) {
    ctx.font = "700 15px Inter, sans-serif";
    ctx.globalAlpha = 0.78;
    ctx.fillText(`${participant.count}`, radius * 0.9, 24);
  }

  ctx.restore();
}

function fitText(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let trimmed = text;
  while (trimmed.length > 3 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

function renderParticipants() {
  participantList.textContent = "";
  const total = totalTickets();

  participants.forEach((participant, index) => {
    const node = template.content.cloneNode(true);
    const name = node.querySelector("[data-name]");
    const share = node.querySelector("[data-share]");
    const count = node.querySelector("[data-count]");
    const remove = node.querySelector("[data-remove]");

    name.textContent = participant.name;
    share.textContent = `${percentage(participant.count, total)}% de chance`;
    count.value = participant.count;

    count.addEventListener("change", () => {
      const next = Math.max(1, Math.round(Number(count.value || 1)));
      participants[index].count = next;
      update();
    });

    remove.addEventListener("click", () => {
      participants.splice(index, 1);
      update();
    });

    participantList.append(node);
  });

  playerCount.textContent = participants.length;
  ticketCount.textContent = total;
  spinButton.disabled = !participants.length || isSpinning;
}

function percentage(value, total) {
  if (!total) return "0";
  return ((value / total) * 100).toFixed(value / total < 0.1 ? 1 : 0);
}

function update() {
  participants = normalizeParticipants(participants);
  saveParticipants();
  drawWheel();
  renderParticipants();
}

function addParticipant(name, count) {
  participants.push({ name, count });
  update();
}

function parseBulk(text) {
  return text
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)(?:\s*[:;=\-]\s*|\s+)(\d+)$/);
      if (!match) return null;
      return {
        name: match[1].trim().replace(/^@/, ""),
        count: Number(match[2]),
      };
    })
    .filter(Boolean);
}

function spin() {
  if (isSpinning || !participants.length) return;

  isSpinning = true;
  spinButton.disabled = true;
  winnerName.textContent = "La roue tourne...";
  winnerWeight.textContent = "Suspense en cours.";

  const winner = pickWeightedWinner();
  const targetAngle = segmentCenterAngle(winner);
  const pointerAngle = -Math.PI / 2;
  const extraTurns = 7 + Math.random() * 2;
  const finalRotation = pointerAngle - targetAngle + extraTurns * Math.PI * 2;
  const startRotation = rotation;
  const distance = finalRotation - startRotation;
  const duration = 5200;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + distance * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    rotation = finalRotation % (Math.PI * 2);
    isSpinning = false;
    winnerName.textContent = winner.name;
    winnerWeight.textContent = `${winner.count} participation${winner.count > 1 ? "s" : ""} sur ${totalTickets()}`;
    renderParticipants();
  }

  requestAnimationFrame(animate);
}

function pickWeightedWinner() {
  const total = totalTickets();
  let ticket = Math.random() * total;

  for (const participant of participants) {
    ticket -= participant.count;
    if (ticket <= 0) return participant;
  }

  return participants[participants.length - 1];
}

function segmentCenterAngle(target) {
  const total = totalTickets();
  let start = 0;

  for (const participant of participants) {
    const angle = (participant.count / total) * Math.PI * 2;
    if (participant === target || participant.name === target.name) {
      return start + angle / 2;
    }
    start += angle;
  }

  return 0;
}

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addParticipant(nameInput.value.trim().replace(/^@/, ""), Math.round(Number(countInput.value)));
  entryForm.reset();
  nameInput.focus();
});

importButton.addEventListener("click", () => {
  const imported = parseBulk(bulkInput.value);
  if (!imported.length) return;
  participants = imported;
  winnerName.textContent = "Liste importée";
  winnerWeight.textContent = "La roue est prête.";
  update();
});

sampleButton.addEventListener("click", () => {
  bulkInput.value = "Aka: 100\nasgard: 30\nLow_Hp_Fan: 12\nBluePanther: 8";
});

clearButton.addEventListener("click", () => {
  participants = [];
  winnerName.textContent = "En attente du tirage";
  winnerWeight.textContent = "Ajoute des participants pour commencer.";
  update();
});

spinButton.addEventListener("click", spin);

update();

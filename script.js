async function fetchCryptoData() {
  const endpoint = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d";
  const tableBody = document.getElementById("coin-table-body");

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    allCoinData = data; // ✅ Fixed: Store data globally for sorting/filtering
    tableBody.innerHTML = "";

    data.forEach((coin, index) => {
      const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'green' : 'red';

      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>
            <img src="${coin.image}" alt="${coin.symbol}" class="coin-icon">
            <strong>${coin.name}</strong> <small>(${coin.symbol.toUpperCase()})</small>
          </td>
          <td>$${coin.current_price.toLocaleString()}</td>
          <td class="${priceChangeClass}">
            ${coin.price_change_percentage_24h.toFixed(2)}%
          </td>
          <td>$${coin.market_cap.toLocaleString()}</td>
          <td>$${coin.total_volume.toLocaleString()}</td>
          <td>${coin.circulating_supply.toLocaleString()} ${coin.symbol.toUpperCase()}</td>
        </tr>
      `;

      tableBody.insertAdjacentHTML("beforeend", row);
    });

    updatePortfolioUI(); // Optional: update portfolio after refresh
  } catch (error) {
    console.error("Failed to fetch crypto data:", error);
    tableBody.innerHTML = "<tr><td colspan='7'>Failed to load data. Please try again later.</td></tr>";
  }
}

fetchCryptoData();

const searchInput = document.querySelector(".search-input");
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll("#coin-table-body tr");

  rows.forEach(row => {
    const coinName = row.cells[1].innerText.toLowerCase();
    row.style.display = coinName.includes(query) ? "" : "none";
  });
});

const sortSelect = document.getElementById("sort-dropdown");
sortSelect.addEventListener("change", () => {
  const column = sortSelect.value;
  if (column) {
    sortTable(column);
  }
});

function sortTable(column, ascending = false) {
  const sorted = [...allCoinData]; // clone the array

  switch (column) {
    case "price":
      sorted.sort((a, b) => ascending ? a.current_price - b.current_price : b.current_price - a.current_price);
      break;
    case "market_cap":
      sorted.sort((a, b) => ascending ? a.market_cap - b.market_cap : b.market_cap - a.market_cap);
      break;
    case "change-24h":
      sorted.sort((a, b) => ascending ? a.price_change_percentage_24h - b.price_change_percentage_24h : b.price_change_percentage_24h - a.price_change_percentage_24h);
      break;

    default:
      return;
  }

  renderTable(sorted);
}

const filterSelect = document.getElementById("filter-dropdown");
let allCoinData = [];

filterSelect.addEventListener("change", () => {
  const selected = filterSelect.value;
  let filteredData = [...allCoinData];

  if (selected === "gainers") {
    filteredData.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  } else if (selected === "losers") {
    filteredData.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
  }

  renderTable(filteredData);
});

function renderTable(data) {
  const tableBody = document.getElementById("coin-table-body");
  tableBody.innerHTML = "";

  data.forEach((coin, index) => {
    const change = getChangeByTimeframe(coin);
    const priceChangeClass = change >= 0 ? "green" : "red";

    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>
          <img src="${coin.image}" alt="${coin.symbol}" class="coin-icon">
          <strong>${coin.name}</strong> <small>(${coin.symbol.toUpperCase()})</small>
        </td>
        <td>$${coin.current_price.toLocaleString()}</td>
        <td class="${priceChangeClass}">
          ${change.toFixed(2)}%
        </td>
        <td>$${coin.market_cap.toLocaleString()}</td>
        <td>$${coin.total_volume.toLocaleString()}</td>
        <td>${coin.circulating_supply.toLocaleString()} ${coin.symbol.toUpperCase()}</td>
      </tr>
    `;

    tableBody.innerHTML += row;
  });
}

function getChangeByTimeframe(coin) {
  switch (currentTimeframe) {
    case "1h":
      return coin.price_change_percentage_1h_in_currency;
    case "7d":
      return coin.price_change_percentage_7d_in_currency;
    case "30d":
      return coin.price_change_percentage_30d_in_currency;
    case "24h":
    default:
      return coin.price_change_percentage_24h;
  }
}

let currentTimeframe = "24h";

document.querySelectorAll(".time-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".time-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentTimeframe = btn.dataset.timeframe;
    fetchCryptoData();
  });
});

// Portfolio management
let userPortfolio = [
  { coin: 'bitcoin', symbol: 'BTC', quantity: 0.5 },
  { coin: 'ethereum', symbol: 'ETH', quantity: 3.2 },
  { coin: 'solana', symbol: 'SOL', quantity: 25 },
  { coin: 'binancecoin', symbol: 'BNB', quantity: 1.5 }
];

function addNewAsset() {
  const modal = document.createElement('div');
  modal.className = 'add-asset-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h3>Add New Asset</h3>
      <div class="form-group">
        <label for="coin-select">Select Coin</label>
        <select id="coin-select">
          <option value="">Select a coin</option>
          ${allCoinData.map(coin => `
            <option value="${coin.id}">${coin.name} (${coin.symbol.toUpperCase()})</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="quantity-input">Quantity</label>
        <input type="number" id="quantity-input" placeholder="0.00" step="0.000001" min="0">
      </div>
      <button id="add-to-portfolio" class="add-btn">Add to Portfolio</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.querySelector('.close-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  document.getElementById('add-to-portfolio').addEventListener('click', () => {
    const coinId = document.getElementById('coin-select').value;
    const quantity = parseFloat(document.getElementById('quantity-input').value);

    if (coinId && quantity > 0) {
      const selectedCoin = allCoinData.find(coin => coin.id === coinId);
      const existingCoinIndex = userPortfolio.findIndex(item => item.coin === coinId);

      if (existingCoinIndex !== -1) {
        userPortfolio[existingCoinIndex].quantity += quantity;
      } else {
        userPortfolio.push({
          coin: coinId,
          symbol: selectedCoin.symbol,
          quantity: quantity
        });
      }

      updatePortfolioUI();
      document.body.removeChild(modal);
    } else {
      alert('Please select a coin and enter a valid quantity');
    }
  });
}

function updatePortfolioUI() {
  const portfolioList = document.querySelector('.assets');
  let totalValue = 0;
  portfolioList.innerHTML = '';

  userPortfolio.forEach(portfolioItem => {
    const coinData = allCoinData.find(coin => coin.id === portfolioItem.coin);

    if (coinData) {
      const coinValue = coinData.current_price * portfolioItem.quantity;
      totalValue += coinValue;

      const changeClass = coinData.price_change_percentage_24h >= 0 ? 'green' : 'red';
      const changeSymbol = coinData.price_change_percentage_24h >= 0 ? '▲' : '▼';

      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <div class="coin-info">
          <strong>${coinData.symbol.toUpperCase()}</strong>
          <span>${portfolioItem.quantity} ${coinData.symbol.toUpperCase()}</span>
        </div>
        <div class="coin-value">
          <strong>$${coinValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
          <span class="${changeClass}">${changeSymbol} ${Math.abs(coinData.price_change_percentage_24h).toFixed(2)}%</span>
        </div>
      `;

      portfolioList.appendChild(listItem);
    }
  });

  document.querySelector('.total-value h2').textContent = `$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

document.querySelector('.add-btn').addEventListener('click', addNewAsset);

const refreshBtn = document.querySelector(".refresh-btn");

refreshBtn.addEventListener("click", async () => {
  refreshBtn.classList.add("loading");
  await fetchCryptoData();
  refreshBtn.classList.remove("loading");
});

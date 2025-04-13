async function fetchCryptoData() {
    const endpoint = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d";
    const tableBody = document.getElementById("coin-table-body");


    try {
      const res = await fetch(endpoint);
      const data = await res.json();

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
    } catch (error) {
      console.error("Failed to fetch crypto data:", error);
      tableBody.innerHTML = "<tr><td colspan='7'>Failed to load data. Please try again later.</td></tr>";
    }
  }

  fetchCryptoData();
  const searchInput = document.getElementById("search-input");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll("#coin-table-body tr");

    rows.forEach(row => {
      const coinName = row.cells[1].innerText.toLowerCase();
      if (coinName.includes(query)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });

  const sortSelect = document.getElementById("sort-dropdown");

sortSelect.addEventListener("change", () => {
  const column = sortSelect.value;
  if (column) {
    
    sortTable(column, false);
    currentSort = { column, ascending: false };
  }
});
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
      
        tableBody.innerHTML += row;
      });
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



/* ============================================================
   SAGEFARM — app.js
   UI orchestration: page routing, slider building, chart rendering,
   and per-calculator result display.
   ============================================================ */

// ── STATE ─────────────────────────────────────────────────────────────────────
let currentCalc = 'sip';
let calcMode = 'investment'; // 'investment' | 'goal'
let chartInstance = null;       // Chart.js instance

/* ============================================================
   GLOBAL RETURN ASSUMPTIONS
   Change here → updates everywhere automatically
   ============================================================ */

const ASSUMPTIONS = {

  // General calculators
  DEFAULT_RETURN_RATE: 12,

  // SWP module
  SWP_SIP_RETURN: 20,
  SWP_WITHDRAWAL_RETURN: 20,

};

// ── CALCULATOR DEFINITIONS ────────────────────────────────────────────────────
// Each entry describes title, subtitle, radio presence, and slider configs.
const calcs = {
  sip: {
    title: 'SIP Calculator',
    subtitle: 'Calculate SIP Returns and Future Value',
    hasRadio: true,
    radioLabels: ['I know investment amount', 'I know my goal amount'],
    sliders: {
      investment: [
        { id: 'monthly', label: 'Monthly Investment', prefix: '₹', min: 500, max: 100000, step: 500, default: 5000 },
        { id: 'period', label: 'Investment Period', suffix: ' years', min: 1, max: 30, step: 1, default: 10 },
        { id: 'rate', label: 'Expected Rate of Return (p.a.)', suffix: '%', min: 1, max: 30, step: 0.5, default: 12 }
      ],
      goal: [
        { id: 'goal', label: 'Target Amount', prefix: '₹', min: 100000, max: 10000000, step: 50000, default: 2000000 },
        { id: 'period', label: 'Investment Period', suffix: ' years', min: 1, max: 30, step: 1, default: 10 },
        { id: 'rate', label: 'Expected Rate of Return (p.a.)', suffix: '%', min: 1, max: 30, step: 0.5, default: 12 }
      ]
    }
  },

  lumpsum: {
    title: 'Lumpsum Calculator',
    subtitle: 'Calculate Lumpsum Returns and Future Value',
    hasRadio: true,
    radioLabels: ['I know investment amount', 'I know my goal amount'],
    sliders: {
      investment: [
        { id: 'principal', label: 'Total Investment', prefix: '₹', min: 5000, max: 5000000, step: 5000, default: 100000 },
        { id: 'period', label: 'Investment Period', suffix: ' years', min: 1, max: 30, step: 1, default: 10 },
        { id: 'rate', label: 'Expected Rate of Return (p.a.)', suffix: '%', min: 1, max: 30, step: 0.5, default: 12 }
      ],
      goal: [
        { id: 'goal', label: 'Target Amount', prefix: '₹', min: 100000, max: 50000000, step: 100000, default: 5000000 },
        { id: 'period', label: 'Investment Period', suffix: ' years', min: 1, max: 30, step: 1, default: 10 },
        { id: 'rate', label: 'Expected Rate of Return (p.a.)', suffix: '%', min: 1, max: 30, step: 0.5, default: 12 }
      ]
    }
  },

  stepup: {
    title: 'Step Up SIP Calculator',
    subtitle: 'Calculate Step Up SIP Returns',
    hasRadio: false,
    sliders: {
      investment: [
        { id: 'monthly', label: 'Monthly Investment', prefix: '₹', min: 500, max: 100000, step: 500, default: 5000 },
        { id: 'stepup', label: 'Annual Step Up', suffix: '%', min: 0, max: 50, step: 1, default: 10 },
        { id: 'period', label: 'Investment Period', suffix: ' years', min: 1, max: 30, step: 1, default: 10 },
        { id: 'rate', label: 'Expected Rate of Return (p.a.)', suffix: '%', min: 1, max: 30, step: 0.5, default: 12 }
      ]
    }
  },




  swp: {
    title: 'SWP Calculator',
    subtitle: 'SIP → Corpus → Systematic Withdrawal Plan',
    hasRadio: false,
    sliders: {
      investment: [
        { id: 'monthlySIP', label: 'Monthly SIP Amount', prefix: '₹', min: 500, max: 200000, step: 500, default: 30000 },
        { id: 'sipStepup', label: 'Annual Increase in SIP Amount', suffix: '%', min: 0, max: 50, step: 1, default: 5 },
        { id: 'sipPeriod', label: 'SIP Period', suffix: ' years', min: 1, max: 40, step: 1, default: 18 },
        { id: 'swpPeriod', label: 'SWP (Withdrawal Plan) Period', suffix: ' years', min: 1, max: 40, step: 1, default: 30 },
        { id: 'swpAmount', label: 'Initial SWP Amount (monthly)', prefix: '₹', min: 1000, max: 500000, step: 1000, default: 245000 },
        { id: 'withdrawalGrowth', label: 'Annual Increase in Withdrawal', suffix: '%', min: 0, max: 30, step: 1, default: 15 }
      ]
    }
  },

};

// ── INFO CONTENT REGISTRY ─────────────────────────────────────────────────────
const infoData = {
  sip: {
    toc: ['What is a SIP Calculator?', 'How Can It Help You?', 'How Does It Work?', 'How to Use It?', 'Benefits of SIP', 'Related Calculators'],
    related: ['Lumpsum Calculator', 'Step Up SIP Calculator', 'SWP Calculator'],
    html: `
<h2>What is a SIP Calculator?</h2>
<p>A SIP (Systematic Investment Plan) calculator is an online financial tool that estimates the future value of your monthly mutual fund investments based on an expected annual return.</p>
<h2>How Can It Help You?</h2>
<p>It helps you plan your investments by letting you visualise how small, regular contributions compound over time. You can reverse-calculate the required monthly SIP to reach a specific financial goal.</p>
<h2>How Does It Work?</h2>
<p>The calculator uses the standard SIP future value formula:</p>
<div class="formula-box">FV = P × [ (1+r)^n − 1 ] / r × (1+r)</div>
<table class="symbol-table">
  <tr><th>Symbol</th><th>Meaning</th></tr>
  <tr><td>FV</td><td>Future Value</td></tr>
  <tr><td>P</td><td>Monthly SIP amount</td></tr>
  <tr><td>r</td><td>Monthly interest rate = Annual rate ÷ 12</td></tr>
  <tr><td>n</td><td>Total months = Years × 12</td></tr>
</table>
<h2>Benefits of SIP</h2>
<ul>
  <li>Rupee Cost Averaging — buy more units when prices are low</li>
  <li>Power of Compounding — returns earn returns</li>
  <li>Disciplined investing — automated monthly deductions</li>
  <li>Flexible — start with as little as ₹500/month</li>
</ul>
<h2>Related Calculators</h2>`
  },

  lumpsum: {
    toc: ['What is Lumpsum Investment?', 'Formula Used', 'When to Choose Lumpsum?', 'Related Calculators'],
    related: ['SIP Calculator', 'Step Up SIP Calculator', 'SWP Calculator'],
    html: `
<h2>What is Lumpsum Investment?</h2>
<p>A lumpsum investment means depositing a single large amount at one time into a mutual fund, as opposed to regular monthly SIP contributions.</p>
<h2>Formula Used</h2>
<div class="formula-box">FV = P × (1 + r)^n</div>
<table class="symbol-table">
  <tr><th>Symbol</th><th>Meaning</th></tr>
  <tr><td>FV</td><td>Future Value</td></tr>
  <tr><td>P</td><td>Principal (one-time investment)</td></tr>
  <tr><td>r</td><td>Annual rate of return</td></tr>
  <tr><td>n</td><td>Investment duration in years</td></tr>
</table>
<h2>When to Choose Lumpsum?</h2>
<ul>
  <li>When you receive a windfall — bonus, inheritance, maturity proceeds</li>
  <li>During market corrections when valuations are attractive</li>
  <li>For short-term goals with a fixed horizon</li>
</ul>
<h2>Related Calculators</h2>`
  },

  stepup: {
    toc: ['What is Step Up SIP?', 'How It Accelerates Wealth', 'Example', 'Related Calculators'],
    related: ['SIP Calculator', 'Lumpsum Calculator', 'SWP Calculator'],
    html: `
<h2>What is Step Up SIP?</h2>
<p>A Step Up SIP (also called Top-Up SIP) is a plan where you increase your monthly SIP contribution by a fixed percentage every year, aligned with your annual income growth.</p>
<h2>How It Accelerates Wealth</h2>
<p>Even a 10% annual step-up can double the final corpus compared to a flat SIP over 20 years, because both the invested amount and the compounding base grow simultaneously.</p>
<h2>Example</h2>
<table class="growth-table">
  <tr><th>Year</th><th>Monthly SIP</th><th>Cumulative Invested</th></tr>
  <tr><td>1</td><td>₹5,000</td><td>₹60,000</td></tr>
  <tr><td>2</td><td>₹5,500</td><td>₹1,26,000</td></tr>
  <tr><td>5</td><td>₹7,321</td><td>₹3,97,849</td></tr>
  <tr><td>10</td><td>₹11,789</td><td>₹10,19,374</td></tr>
</table>
<h2>Related Calculators</h2>`
  },



  swp: {
    toc: ['What is SWP?', 'SIP → SWP Retirement Strategy', 'How SWP Works', 'Formula', 'Key Parameters', 'Benefits', 'Related Calculators'],
    related: ['SIP Calculator', 'Step Up SIP Calculator', 'Lumpsum Calculator'],
    html: `
<h2>What is SWP?</h2>
<p>A Systematic Withdrawal Plan (SWP) allows you to withdraw a fixed amount from your mutual fund corpus every month. It is the mirror image of a SIP — instead of investing regularly, you withdraw regularly.</p>
<h2>SIP → SWP Retirement Strategy</h2>
<p>This is the most powerful retirement planning framework. During your earning years you invest via SIP (with annual step-ups) to build a large corpus. At retirement, you switch to SWP mode, drawing a monthly income while your remaining corpus continues to earn returns.</p>
<div class="formula-box">Corpus at Retirement = StepUp_SIP(monthly, stepup%, years, rate%)</div>
<div class="formula-box">Monthly Income = SWP withdrawal, growing at withdrawal_growth% p.a.</div>
<h2>How SWP Works</h2>
<p>Each month, the fund redeems units worth the withdrawal amount from your corpus. If the fund's return exceeds the effective withdrawal rate, the corpus may actually grow over time — providing an inflation-beating pension.</p>
<h2>Formula</h2>
<p>Month-by-month simulation:</p>
<div class="formula-box">Balance(t+1) = Balance(t) × (1 + r_monthly) − Withdrawal(t)</div>
<h2>Key Parameters</h2>
<table class="symbol-table">
  <tr><th>Parameter</th><th>Description</th></tr>
  <tr><td>Monthly SIP Amount</td><td>Your SIP contribution during accumulation phase</td></tr>
  <tr><td>Annual Increase in SIP</td><td>Percentage by which SIP grows each year</td></tr>
  <tr><td>SIP Period</td><td>Years of investment before retirement</td></tr>
  <tr><td>SWP Period</td><td>Years over which you want monthly income</td></tr>
  <tr><td>Initial SWP Amount</td><td>Monthly withdrawal at retirement start</td></tr>
  <tr><td>Annual Increase in Withdrawal</td><td>Inflation-adjusted growth in withdrawals</td></tr>
</table>
<h2>Benefits of SWP</h2>
<ul>
  <li>Regular income stream — like a pension</li>
  <li>Tax-efficient — only the gains portion is taxed</li>
  <li>Corpus continues to grow between withdrawals</li>
  <li>Flexible — adjust withdrawal amount anytime</li>
  <li>Inflation protection via step-up withdrawals</li>
</ul>
<h2>Related Calculators</h2>`
  },
};

// ── PAGE NAVIGATION ────────────────────────────────────────────────────────────

function showTools() {
  document.getElementById('tools-page').style.display = 'block';
  document.getElementById('calc-page').style.display = 'none';
}

function openCalc(type) {
  currentCalc = type;
  calcMode = 'investment';

  document.getElementById('tools-page').style.display = 'none';
  document.getElementById('calc-page').style.display = 'block';

  const def = calcs[type];
  document.getElementById('breadcrumb-name').textContent = def.title;
  document.getElementById('calc-title').textContent = def.title;
  document.getElementById('calc-subtitle').textContent = def.subtitle;

  // SWP banner
  document.getElementById('swp-banner').style.display =
    (type === 'swp') ? 'flex' : 'none';

  // SWP phase table
  document.getElementById('swp-phase-table').style.display =
    (type === 'swp') ? 'block' : 'none';

  // // Top funds: show for most, hide for SWP
  // document.getElementById('top-funds-area').style.display =
  //   (type === 'swp') ? 'none' : 'block';

  // Reset monthly table
  document.getElementById('monthly-table-section').style.display = 'none';
  monthlyTableOpen = false;

  buildRadio();
  buildSliders();
  buildInfo(type);
  updateCalc();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── RADIO ──────────────────────────────────────────────────────────────────────

function buildRadio() {
  const def = calcs[currentCalc];
  const rg = document.getElementById('radio-group');
  rg.innerHTML = '';
  if (!def.hasRadio) return;

  def.radioLabels.forEach((lbl, i) => {
    const mode = (i === 0) ? 'investment' : 'goal';
    const label = document.createElement('label');
    label.innerHTML = `<input type="radio" name="calcmode" value="${mode}" ${calcMode === mode ? 'checked' : ''}> ${lbl}`;
    label.querySelector('input').addEventListener('change', () => {
      calcMode = mode;
      buildSliders();
      updateCalc();
    });
    rg.appendChild(label);
  });
}

// ── SLIDERS ────────────────────────────────────────────────────────────────────

function buildSliders() {
  const def = calcs[currentCalc];
  const modeKey = def.hasRadio ? calcMode : 'investment';
  const sliderDefs = def.sliders[modeKey] || def.sliders['investment'];

  const row = document.getElementById('sliders-row');
  row.innerHTML = '';

  // Responsive column count
  const cols = sliderDefs.length <= 3 ? 3 : (sliderDefs.length === 4 ? 4 : 3);
  row.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  sliderDefs.forEach(s => {
    const pct = ((s.default - s.min) / (s.max - s.min)) * 100;
    const disp = (s.prefix || '') + s.default.toLocaleString('en-IN') + (s.suffix || '');

    const grp = document.createElement('div');
    grp.className = 'slider-group';
    grp.innerHTML = `
  <div class="slider-label">
    <span>${s.label}</span>
    <span class="slider-value" id="sv-${s.id}">${disp}</span>
  </div>

  <div class="slider-input-wrap">

    <input
      type="range"
      id="sl-${s.id}"
      min="${s.min}"
      max="${s.max}"
      step="${s.step}"
      value="${s.default}"
      style="--pct:${pct}%"
      oninput="onSlider('${s.id}','${s.prefix || ''}','${s.suffix || ''}',this)"
    >

    <input
      type="number"
      class="manual-input"
      id="inp-${s.id}"
      min="${s.min}"
      max="${s.max}"
      step="${s.step}"
      value="${s.default}"
      oninput="onManualInput('${s.id}','${s.prefix || ''}','${s.suffix || ''}',this)"
    />

  </div>
`;
    row.appendChild(grp);
  });
}

function onSlider(id, prefix, suffix, el) {
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--pct', pct + '%');
  const valEl = document.getElementById('sv-' + id);
  valEl.textContent = prefix + parseFloat(el.value).toLocaleString('en-IN') + suffix;
  document.getElementById('inp-' + id).value = el.value;
  updateCalc();
}

function onManualInput(id, prefix, suffix, el) {

  const slider = document.getElementById('sl-' + id);

  let value = parseFloat(el.value || 0);

  if (value < parseFloat(slider.min)) {
    value = parseFloat(slider.min);
  }

  if (value > parseFloat(slider.max)) {
    value = parseFloat(slider.max);
  }

  slider.value = value;

  const pct =
    ((slider.value - slider.min) /
      (slider.max - slider.min)) * 100;

  slider.style.setProperty('--pct', pct + '%');

  const valEl = document.getElementById('sv-' + id);

  valEl.textContent =
    prefix +
    parseFloat(value).toLocaleString('en-IN') +
    suffix;

  updateCalc();
}

// ── CHART ──────────────────────────────────────────────────────────────────────

/**
 * Renders a stacked bar chart with a trend line that traces each bar's peak.
 *
 * @param {string[]} labels        - X-axis labels
 * @param {number[]} investedArr   - Stacked bar segment 1 (blue)
 * @param {number[]} returnsArr    - Stacked bar segment 2 (orange)
 * @param {number[]} [trendArr]    - Override trend data (defaults to bar peaks = totalArr)
 * @param {string}   [trendLabel]  - Legend label for trend line
 */

function buildStepUpChart(labels, withoutArr, withArr, stepupPct) {
  const ctx = document.getElementById('myChart').getContext('2d');
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }



  document.getElementById('chart-legend').innerHTML = `
  <span class="legend-item">
    <span class="legend-dot"
      style="background:#3b7dd8">
    </span>
    Without Step-Up
  </span>

  <span class="legend-item">
    <span class="legend-dot"
      style="background:#f5a623">
    </span>
    With Step-Up (${stepupPct}%)
  </span>
`;

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'With step-up of ' + stepupPct + '%',
          data: withArr,
          borderColor: '#f5a623',
          backgroundColor: 'rgba(245,166,35,0.15)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#f5a623',
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          fill: true,
          tension: 0.35,
          order: 2
        },
        {
          label: 'Without step-up',
          data: withoutArr,
          borderColor: '#3b7dd8',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#3b7dd8',
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          fill: false,
          tension: 0.35,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${formatAxis(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          grid: { color: '#f0f0f0' },
          ticks: { font: { size: 11 }, callback: v => formatAxis(v) }
        }
      }
    }
  });
}

function buildSWPChart(labels, corpusArr, withdrawnArr) {

  const ctx =
    document.getElementById('myChart')
      .getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // // SWP CHART TITLE
  // document.getElementById('chart-label').textContent =
  //   'SWP Phase: Corpus balance vs cumulative withdrawal';

  chartInstance = new Chart(ctx, {

    type: 'line',

    data: {
      labels,

      datasets: [

        // Remaining Corpus
        {
          label: 'Remaining Corpus',
          data: corpusArr,

          borderColor: '#3b7dd8',
          backgroundColor:
            'rgba(59,125,216,0.10)',

          borderWidth: 3,

          pointRadius: 4,
          pointHoverRadius: 6,

          pointBackgroundColor: '#3b7dd8',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,

          fill: true,
          tension: 0.5
        },

        // Total Withdrawn
        {
          label: 'Total Withdrawn',
          data: withdrawnArr,

          borderColor: '#f5a623',
          backgroundColor: 'transparent',

          borderWidth: 3,

          pointRadius: 4,
          pointHoverRadius: 6,

          pointBackgroundColor: '#f5a623',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,

          fill: false,
          tension: 0.45
        }
      ]
    },

    options: {

      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: 'index',
        intersect: false
      },

      plugins: {

        legend: {
          display: false
        },

        tooltip: {

          callbacks: {

            label: function (ctx) {

              return (
                ' ' +
                ctx.dataset.label +
                ': ' +
                formatTooltipValue(ctx.parsed.y)
              );
            }
          }
        }
      },

      scales: {

        x: {
          grid: {
            display: false
          },

          ticks: {
            font: {
              size: 11
            }
          }
        },

        y: {

          grid: {
            color: '#f0f0f0'
          },

          ticks: {

            font: {
              size: 11
            },

            callback: v =>
              formatAxis(v)
          }
        }
      }
    }
  });
}

function buildChart(labels, investedArr, returnsArr, trendArr, trendLabel) {
  const ctx = document.getElementById('myChart').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  document.getElementById('chart-legend').innerHTML = `
  <span class="legend-item">
    <span class="legend-dot"
      style="background:#2ec4b6">
    </span>
    Invested
  </span>

  <span class="legend-item">
    <span class="legend-dot"
      style="background:#cbf3f0">
    </span>
    Returns
  </span>
`;


  // Trend line = the exact total (bar peak) at each x position
  const totalArr = investedArr.map((v, i) => v + returnsArr[i]);
  if (!trendArr) {
    trendArr = totalArr.slice(); // copy — each point sits on bar top
    trendLabel = trendLabel || 'Trend';
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Invested',
          data: investedArr,
          backgroundColor: '#2ec4b6',
          // backgroundColor: '#18b97a',
          stack: 'stack0',
          yAxisID: 'y',
          borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 3, bottomRight: 3 },
          order: 2
        },
        {
          label: 'Returns',
          data: returnsArr,
          backgroundColor: '#cbf3f0',
          // backgroundColor: '#ffb020',
          stack: 'stack0',
          yAxisID: 'y',
          borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
          order: 2
        },
        {
          label: trendLabel || 'Trend',
          data: trendArr,
          type: 'line',
          yAxisID: 'y',   // separate axis so line is NOT stacked
          borderColor: '#e72121',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#e53935',
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          tension: 0.45,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              // Hide trend tooltip
              if (ctx.dataset.label === 'Trend') {
                return null;
              }
              return ` ${ctx.dataset.label}: ${formatTooltipValue(ctx.parsed.y)}`;
            },
            afterBody: function (items) {
              const invested =
                items.find(i => i.dataset.label === 'Invested');
              const returns =
                items.find(i => i.dataset.label === 'Returns');

              if (!invested || !returns) return '';

              const total =
                invested.parsed.y + returns.parsed.y;

              return [
                '',
                'Total Value: ' + formatTooltipValue(total)
              ];
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 11 } }
        },
        // Stacked y-axis for bars
        y: {
          stacked: true,
          grid: { color: '#f0f0f0' },
          ticks: {
            font: { size: 11 },
            callback: v => formatAxis(v)
          }
        },
        // Separate non-stacked y-axis for trend line, same scale, no labels
        // yLine: {
        //   display: false,         // hide axis ticks/labels — shares visual range
        //   stacked: false,
        //   min:     0,
        //   max:     Math.max(...totalArr) * 1.15  // match bar scale with small headroom
        // }
      }
    }
  });
}

// ── MAIN UPDATE FUNCTION ──────────────────────────────────────────────────────

function updateCalc() {
  const def = calcs[currentCalc];
  const modeKey = def.hasRadio ? calcMode : 'investment';
  const sliderDefs = def.sliders[modeKey] || def.sliders['investment'];

  // Read current slider values
  const vals = {};
  sliderDefs.forEach(s => {
    const el = document.getElementById('sl-' + s.id);
    if (el) vals[s.id] = parseFloat(el.value);
  });

  const summary = document.getElementById('results-summary');
  summary.innerHTML = '';

  let investedArr = [], returnsArr = [], labels = [];

  // ── SIP ──────────────────────────────────────────────────────────────
  if (currentCalc === 'sip') {
    const years = vals.period;
    if (calcMode === 'investment') {
      const { fv, invested, returns } = calcSIP(vals.monthly, years, vals.rate, 'investment');
      setSummary(summary, [
        { label: 'Total value', val: formatNum(fv), highlight: true },
        { label: 'Invested amount', val: formatNum(invested) },
        { label: 'Estimated returns', val: formatNum(returns) }
      ]);
      for (let y = 1; y <= years; y++) {
        const r = calcSIP(vals.monthly, y, vals.rate, 'investment');
        investedArr.push(r.invested); returnsArr.push(r.returns); labels.push(y + 'Y');
      }
      // Monthly table
      const mRows = calcSIPMonthly(vals.monthly, years, vals.rate);
      buildMonthlyTable(
        'Monthly SIP Breakdown',
        ['Month', 'Balance at Begin', 'SIP Added', 'Returns Earned', 'Balance at End'],
        mRows,
        ['month', 'balBegin', 'sipAdded', 'interest', 'balEnd'],
        ['', '', 'col-neutral', 'col-positive', 'col-positive']
      );
    } else {
      const { monthly_needed } = calcSIP(0, years, vals.rate, 'goal', vals.goal);
      setSummary(summary, [
        { label: 'Target Amount', val: formatNum(vals.goal), highlight: true },
        { label: 'Required Monthly SIP', val: formatNum(monthly_needed) },
        { label: 'Total Invested', val: formatNum(monthly_needed * years * 12) }
      ]);
      for (let y = 1; y <= years; y++) {
        const r = calcSIP(monthly_needed, y, vals.rate, 'investment');
        investedArr.push(r.invested); returnsArr.push(r.returns); labels.push(y + 'Y');
      }
      // Monthly table
      const mRows = calcSIPMonthly(monthly_needed, years, vals.rate);
      buildMonthlyTable(
        'Monthly SIP Breakdown',
        ['Month', 'Balance at Begin', 'SIP Added', 'Returns Earned', 'Balance at End'],
        mRows,
        ['month', 'balBegin', 'sipAdded', 'interest', 'balEnd'],
        ['', '', 'col-neutral', 'col-positive', 'col-positive']
      );
    }

    // ── LUMPSUM ──────────────────────────────────────────────────────────
  } else if (currentCalc === 'lumpsum') {
    const years = vals.period;
    if (calcMode === 'investment') {
      const { fv, invested, returns } = calcLumpsum(vals.principal, years, vals.rate);
      setSummary(summary, [
        { label: 'Total value', val: formatNum(fv), highlight: true },
        { label: 'Invested amount', val: formatNum(invested) },
        { label: 'Estimated returns', val: formatNum(returns) }
      ]);
      for (let y = 1; y <= years; y++) {
        const r = calcLumpsum(vals.principal, y, vals.rate);
        investedArr.push(r.invested); returnsArr.push(r.returns); labels.push(y + 'Y');
      }
      const mRows = calcLumpsumMonthly(vals.principal, years, vals.rate);
      buildMonthlyTable(
        'Monthly Lumpsum Growth',
        ['Month', 'Balance at Begin', 'Returns Earned', 'Balance at End'],
        mRows,
        ['month', 'balBegin', 'interest', 'balEnd'],
        ['', '', 'col-positive', 'col-positive']
      );
    } else {
      const { needed } = calcLumpsum(0, years, vals.rate, 'goal', vals.goal);
      setSummary(summary, [
        { label: 'Target Amount', val: formatNum(vals.goal), highlight: true },
        { label: 'Required Investment', val: formatNum(needed) }
      ]);
      for (let y = 1; y <= years; y++) {
        const r = calcLumpsum(needed, y, vals.rate);
        investedArr.push(r.invested); returnsArr.push(r.returns); labels.push(y + 'Y');
      }
      const mRows = calcLumpsumMonthly(needed, years, vals.rate);
      buildMonthlyTable(
        'Monthly Lumpsum Growth',
        ['Month', 'Balance at Begin', 'Returns Earned', 'Balance at End'],
        mRows,
        ['month', 'balBegin', 'interest', 'balEnd'],
        ['', '', 'col-positive', 'col-positive']
      );
    }

    // ── STEP UP SIP ────────────────────────────────────────────────────────
  } else if (currentCalc === 'stepup') {
    const years = vals.period;
    const { fv, invested, returns } = calcStepUpSIP(vals.monthly, vals.stepup, years, vals.rate);

    // Flat SIP comparison (no step-up)
    const flatResult = calcSIP(vals.monthly, years, vals.rate, 'investment');
    const flatFV = flatResult.fv;
    const extraPct = (((fv - flatFV) / flatFV) * 100).toFixed(1);

    // Tip: benefit at 12% step-up (only show if current stepup < 12)
    // const tipStepup = 12;
    let tipStepup = null;

    if (vals.stepup >= 0 && vals.stepup <= 4) {

      tipStepup = 8;
    }
    else if (vals.stepup >= 5 && vals.stepup <= 9) {

      tipStepup = 12;
    }
    else if (vals.stepup >= 10 && vals.stepup <= 14) {

      tipStepup = 15;
    }
    else if (vals.stepup >= 15 && vals.stepup <= 19) {

      tipStepup = 20;
    }
    else if (vals.stepup >= 20 && vals.stepup <= 24) {

      tipStepup = 25;
    }
    else if (vals.stepup >= 25 && vals.stepup <= 29) {

      tipStepup = 30;
    }
    else if (vals.stepup >= 30 && vals.stepup <= 34) {

      tipStepup = 35;
    }
    else if (vals.stepup >= 35 && vals.stepup <= 39) {

      tipStepup = 40;
    }
    else if (vals.stepup >= 40 && vals.stepup <= 44) {

      tipStepup = 45;
    }
    else if (vals.stepup >= 45 && vals.stepup <= 49) {

      tipStepup = 50;
    }
    else {

      tipStepup = null;
    }

    // const tipFV     = calcStepUpSIP(vals.monthly, tipStepup, years, vals.rate).fv;
    // const tipExtra  = tipFV - fv;
    let tipExtra = 0;

    if (tipStepup) {

      const tipFV = calcStepUpSIP(
        vals.monthly,
        tipStepup,
        years,
        vals.rate
      ).fv;

      tipExtra = tipFV - fv;
    }

    // Update chart label and legend
    document.getElementById('chart-label').textContent = 'What you get';
    document.getElementById('chart-legend').innerHTML = `
  <span class="legend-item">
    <span class="legend-dot"
      style="background:#3b7dd8;border-radius:50%;">
    </span>
    Remaining Corpus
  </span>

  <span class="legend-item">
    <span class="legend-dot"
      style="background:#f5a623;border-radius:50%;">
    </span>
    Total Withdrawn
  </span>
`;

    // Summary UI
    summary.innerHTML = `
      <div class="stepup-summary-wrap">
        <div class="stepup-summary-header">Your investment breakdown</div>

        <div class="result-row">
          <span class="result-label">Total amount invested for <strong>${years} years</strong></span>
          <span class="result-val">${formatNum(invested)}</span>
        </div>
        <div class="result-row">
          <span class="result-label">Estimated returns on investment</span>
          <span class="result-val">${formatNum(returns)}</span>
        </div>

        <div class="stepup-compare-row">
          <div class="stepup-box-flat">
            <div class="stepup-box-label">Without step-up</div>
            <div class="stepup-box-val">${formatNum(flatFV)}</div>
            <div class="stepup-box-sub">Flat ₹${vals.monthly.toLocaleString('en-IN')}/month</div>
          </div>
          <div class="stepup-box-green">
            <div class="stepup-box-label">With ${vals.stepup}% step-up</div>
            <div class="stepup-box-val-big">${formatNum(fv)}</div>
            <div class="stepup-box-extra">↗ +${extraPct}% more than flat SIP</div>
          </div>
        </div>

        ${tipStepup && tipExtra > 0 ? `
        <div class="stepup-tip-row">
          <div class="stepup-tip-text">
            💡 Earn <strong>${formatNum(Math.round(tipExtra))} more</strong> by increasing
            step-up to <strong>${tipStepup}%</strong> per year
          </div>
        </div>` : ''}
      </div>
    `;

    // Build two-line area chart
    const withStepupArr = [], withoutArr = [];
    const chartLabels = [];
    for (let y = 0; y <= years; y++) {
      chartLabels.push('Y' + y);
      withStepupArr.push(y === 0 ? 0 : calcStepUpSIP(vals.monthly, vals.stepup, y, vals.rate).fv);
      withoutArr.push(y === 0 ? 0 : calcSIP(vals.monthly, y, vals.rate, 'investment').fv);
    }
    buildStepUpChart(chartLabels, withoutArr, withStepupArr, vals.stepup);

    // Monthly table — correct step-up amounts
    const mRows = calcStepUpSIPMonthly(vals.monthly, vals.stepup, years, vals.rate);
    buildMonthlyTable(
      'Monthly Step-Up SIP Breakdown',
      ['Month', 'Balance at Begin', 'SIP Added', 'Returns Earned', 'Balance at End'],
      mRows,
      ['month', 'balBegin', 'sipAdded', 'interest', 'balEnd'],
      ['', '', 'col-neutral', 'col-positive', 'col-positive']
    );
    return;

    // ── SWP (Enhanced — SIP + SWP) ────────────────────────────────────────
  } else if (currentCalc === 'swp') {
    // const sipRate  = 20; // assumed SIP phase return
    // const swpRate  = 20;  // assumed SWP phase return
    const sipRate = ASSUMPTIONS.SWP_SIP_RETURN;
    const swpRate = ASSUMPTIONS.SWP_WITHDRAWAL_RETURN;

    const result = calcSIPthenSWP(
      vals.monthlySIP,
      vals.sipStepup,
      vals.sipPeriod,
      sipRate,
      vals.swpPeriod,
      vals.swpAmount,
      vals.withdrawalGrowth,
      swpRate
    );

    const sip = result.sip;
    const swp = result.swp;

    // Summary card
    setSummary(summary, [
      { label: 'Corpus at Retirement', val: formatNum(sip.corpus), highlight: true },
      { label: 'Total SIP Invested', val: formatNum(sip.invested) },
      { label: 'SIP Wealth Gained', val: formatNum(sip.returns) },
      { label: 'Total Withdrawn (SWP)', val: formatNum(swp.totalWithdrawn) },
      { label: 'Remaining Balance', val: formatNum(swp.finalBalance) }
    ]);

    // Phase summary table
    const tbody = document.getElementById('swp-table-body');
    tbody.innerHTML = `
      <tr><td>Duration</td><td>${vals.sipPeriod} years</td><td>${vals.swpPeriod} years</td></tr>
      <tr><td>Monthly Amount</td><td>${formatNum(vals.monthlySIP)} (starting)</td><td>${formatNum(vals.swpAmount)} (starting)</td></tr>
      <tr><td>Annual Increase</td><td>${vals.sipStepup}%</td><td>${vals.withdrawalGrowth}%</td></tr>
      <tr><td>Expected Return (p.a.)</td><td>${sipRate}%</td><td>${swpRate}%</td></tr>
      <tr><td>Total Amount</td><td>${formatNum(sip.invested)}</td><td>${formatNum(swp.totalWithdrawn)}</td></tr>
      <tr><td>Final Value</td><td>${formatNum(sip.corpus)}</td><td>${formatNum(swp.finalBalance)} (balance)</td></tr>
    `;

    // Chart: SWP phase balance decay vs withdrawn
    document.getElementById('chart-label').textContent = 'SWP Phase: Remaining Corpus vs Total Withdrawn';
    document.getElementById('chart-legend').innerHTML = `
  <span class="legend-item">
    <span class="legend-dot"
      style="background:#3b7dd8;border-radius:50%;">
    </span>
    Remaining Corpus
  </span>

  <span class="legend-item">
    <span class="legend-dot"
      style="background:#f5a623;border-radius:50%;">
    </span>
    Total Withdrawal
  </span>
`;
    // const corpusArr = [];
    // const withdrawnArr = [];

    // swp.balanceByYear.forEach((b, i) => {

    //   corpusArr.push(b);

    //   withdrawnArr.push(
    //     swp.withdrawnByYear[i] || 0
    //   );

    //   labels.push((i + 1) + 'Y');
    // });

    const corpusArr = [];
    const withdrawnArr = [];

    let cumulativeWithdrawn = 0;

    swp.balanceByYear.forEach((b, i) => {

      corpusArr.push(b);

      cumulativeWithdrawn += (
        swp.withdrawnByYear[i] || 0
      );

      withdrawnArr.push(cumulativeWithdrawn);

      labels.push((i + 1) + 'Y');
    });

    buildSWPChart(
      labels,
      corpusArr,
      withdrawnArr
    );

    // Monthly SWP breakdown table
    const mRows = calcSWPMonthly(sip.corpus, vals.swpAmount, vals.swpPeriod, swpRate, vals.withdrawalGrowth);
    buildMonthlyTable(
      'Monthly SWP Breakdown',
      ['Month', 'Balance at Begin', 'Withdrawal', 'Interest Earned', 'Balance at End'],
      mRows,
      ['month', 'balBegin', 'withdrawal', 'interest', 'balEnd'],
      ['', '', 'col-negative', 'col-positive', '']
    );
    return; // early return — chart already built
  }
  buildChart(labels, investedArr, returnsArr);
}

// ── HELPER: build result rows ──────────────────────────────────────────────────

function setSummary(container, rows) {
  container.innerHTML = rows.map(r =>
    `<div class="result-row">
       <span class="result-label">${r.label}</span>
       <span class="result-val${r.highlight ? ' highlight' : ''}">${r.val}</span>
     </div>`
  ).join('');
}

// ── INFO / TOC ─────────────────────────────────────────────────────────────────

function buildInfo(type) {
  const data = infoData[type];
  if (!data) return;

  // TOC
  const toc = document.getElementById('toc-nav');
  toc.innerHTML = `<h4>On this page</h4>`;
  data.toc.forEach((item, i) => {
    const a = document.createElement('a');
    a.href = '#info-' + i;
    a.textContent = item;
    if (i === 0) a.className = 'active';
    toc.appendChild(a);
  });

  // Divider + related links in TOC
  toc.innerHTML += `
    <div class="toc-divider"></div>
    <div class="toc-sub-title">Related</div>
    <div class="toc-sub">
      ${data.related.map(r => `<a href="#" onclick="openCalcByTitle('${r}');return false;">${r}</a>`).join('')}
    </div>`;

  // Main content
  const content = document.getElementById('info-content');
  let html = data.html;

  // Append related calc buttons at bottom
  html += `<div class="related-calcs">${data.related.map(r =>
    `<div class="related-calc-link" onclick="openCalcByTitle('${r}')">${r}</div>`
  ).join('')
    }</div>`;

  content.innerHTML = html;

  // Assign ids to h2 headings
  const h2s = content.querySelectorAll('h2');
  h2s.forEach((el, i) => { el.id = 'info-' + i; });
}

function openCalcByTitle(title) {
  const key = Object.keys(calcs).find(k => calcs[k].title === title);
  if (key) openCalc(key);
}

// ── MONTHLY TABLE ──────────────────────────────────────────────────────────────

let monthlyTableOpen = false;

// function toggleMonthlyTable() {
//   const wrap = document.getElementById('monthly-table-wrap');
//   const btn = document.getElementById('btn-toggle-table');
//   monthlyTableOpen = !monthlyTableOpen;
//   wrap.style.display = monthlyTableOpen ? 'block' : 'none';
//   btn.textContent = monthlyTableOpen ? '▲ Hide Table' : '▼ Show Table';
//   btn.classList.toggle('open', monthlyTableOpen);
// }

/**
 * Render the monthly breakdown table.
 * @param {string} title   - section heading
 * @param {string[]} heads - column header names
 * @param {Array}  rows    - array of objects with keys matching heads
 * @param {string[]} keys  - object keys to read in order
 * @param {string[]} [colorClass] - optional per-column CSS class ('col-positive','col-negative','col-neutral','')
 */
function buildMonthlyTable(title, heads, rows, keys, colorClass) {
  const section = document.getElementById('monthly-table-section');
  section.style.display = 'block';
  document.getElementById('monthly-table-wrap').style.display = 'block';
  document.getElementById('monthly-table-title').textContent = title;

  // Reset toggle state
  // monthlyTableOpen = false;
  // const wrap = document.getElementById('monthly-table-wrap');
  // const btn = document.getElementById('btn-toggle-table');
  // wrap.style.display = 'none';
  // btn.textContent = '▼ Show Table';
  // btn.classList.remove('open');

  // Header
  const thead = document.getElementById('monthly-detail-thead');
  thead.innerHTML = '<tr>' + heads.map(h => `<th>${h}</th>`).join('') + '</tr>';

  // Rows
  const tbody = document.getElementById('monthly-detail-tbody');
  // const fmtCell = (val, cls) => {
  //   const txt = typeof val === 'number' ? '₹' + val.toLocaleString('en-IN') : val;
  //   return `<td class="${cls || ''}">${txt}</td>`;
  // };
  const fmtCell = (val, cls, key) => {

    // Do NOT add ₹ for Month column
    if (key === 'month') {
      return `<td class="${cls || ''}">${val}</td>`;
    }

    const txt =
      typeof val === 'number'
        ? '₹' + val.toLocaleString('en-IN')
        : val;

    return `<td class="${cls || ''}">${txt}</td>`;
  };

  tbody.innerHTML = rows.map(row =>
    // '<tr>' + keys.map((k, i) => fmtCell(row[k], colorClass ? colorClass[i] : '')).join('') + '</tr>'
    '<tr>' + keys.map((k, i) =>
      fmtCell(
        row[k],
        colorClass ? colorClass[i] : '',
        k
      )
    ).join('') + '</tr>'
  ).join('');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
// Nothing to do on load — tools page is default.

/* ============================================================
   SAGEFARM — calculators.js
   Pure calculation functions (no DOM).
   ============================================================ */

/**
 * SIP Future Value  (investment mode)
 * Returns { fv, invested, returns }
 *
 * SIP Required  (goal mode)
 * Returns { monthly_needed }
 */

/**
 * PROFESSIONAL SIP ENGINE
 * Single source of truth:
 * same logic for summary + chart + table
 */

function calcSIP(monthly, years, rate, mode, goal) {
  const monthlyRate =
    Math.pow(1 + rate / 100, 1 / 12) - 1;

  const totalMonths = years * 12;

  // ─────────────────────────────
  // GOAL MODE
  // ─────────────────────────────
  if (mode === 'goal') {
    let low  = 0;
    let high = goal;
    let ans  = 0;
    // Binary search for accurate SIP
    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      let balance = 0;
      for (let m = 1; m <= totalMonths; m++) {
        // SIP added at BEGINNING
        balance += mid;
        // then growth
        balance *= (1 + monthlyRate);
      }
      if (balance >= goal) {
        ans = mid;
        high = mid;
      } else {
        low = mid;
      }
    }
    return {
      monthly_needed: Math.round(ans)
    };
  }

  // ─────────────────────────────
  // INVESTMENT MODE
  // ─────────────────────────────
  let balance = 0;
  for (let m = 1; m <= totalMonths; m++) {
    // SIP first
    balance += monthly;
    // then compounding
    balance *= (1 + monthlyRate);
  }

  const invested = monthly * totalMonths;

  return {
    fv: Math.round(balance),
    invested: Math.round(invested),
    returns: Math.round(balance - invested)
  };
}

/**
 * Lumpsum Future Value  (investment mode)
 * Lumpsum Required     (goal mode)
 */
/**
 * PROFESSIONAL LUMPSUM ENGINE
 * Uses monthly simulation for consistency
 */

function calcLumpsum(principal, years, rate, mode, goal) {

  const monthlyRate =
    Math.pow(1 + rate / 100, 1 / 12) - 1;

  const totalMonths = years * 12;

  // ─────────────────────────────
  // GOAL MODE
  // ─────────────────────────────
  if (mode === 'goal') {

    let low  = 0;
    let high = goal;
    let ans  = 0;

    for (let i = 0; i < 60; i++) {

      const mid = (low + high) / 2;

      let balance = mid;

      for (let m = 1; m <= totalMonths; m++) {
        balance *= (1 + monthlyRate);
      }

      if (balance >= goal) {
        ans = mid;
        high = mid;
      } else {
        low = mid;
      }
    }

    return {
      needed: Math.round(ans)
    };
  }

  // ─────────────────────────────
  // INVESTMENT MODE
  // ─────────────────────────────

  let balance = principal;

  for (let m = 1; m <= totalMonths; m++) {
    balance *= (1 + monthlyRate);
  }

  return {
    fv: Math.round(balance),
    invested: Math.round(principal),
    returns: Math.round(balance - principal)
  };
}

/**
 * Step-Up SIP
 * Increases monthly SIP by stepup% each year.
 */
/**
 * PROFESSIONAL STEP-UP SIP ENGINE
 * Single source of truth
 */

function calcStepUpSIP(monthly, stepup, years, rate) {

  const monthlyRate =
    Math.pow(1 + rate / 100, 1 / 12) - 1;

  const totalMonths = years * 12;

  let balance = 0;
  let invested = 0;

  for (let month = 1; month <= totalMonths; month++) {

    // Current year
    const currentYear =
      Math.floor((month - 1) / 12);

    // Step-up SIP amount
    const sipAmount =
      monthly * Math.pow(1 + stepup / 100, currentYear);

    // SIP added first
    balance += sipAmount;

    // investment tracking
    invested += sipAmount;

    // then growth
    balance *= (1 + monthlyRate);
  }

  return {
    fv: Math.round(balance),
    invested: Math.round(invested),
    returns: Math.round(balance - invested)
  };
}

/**
 * SWP (Systematic Withdrawal Plan)
 * Simulates month-by-month withdrawal with monthly withdrawal growth.
 *
 * @param {number} corpus          - Initial investment amount (₹)
 * @param {number} withdrawal      - Initial monthly withdrawal amount (₹)
 * @param {number} years           - Withdrawal period in years
 * @param {number} rate            - Expected annual return rate (%)
 * @param {number} withdrawalGrowth - Annual increase in withdrawal amount (%)
 *
 * Returns:
 *   { finalBalance, totalWithdrawn, corpus, monthlyWithdrawals[], balanceByYear[] }
 */
/**
 * PROFESSIONAL SWP ENGINE
 * Monthly simulation
 * Consistent with table + summary
 */

function calcSWP(
  corpus,
  withdrawal,
  years,
  rate,
  withdrawalGrowth
) {

  withdrawalGrowth = withdrawalGrowth || 0;

  const monthlyRate =
    Math.pow(1 + rate / 100, 1 / 12) - 1;

  const totalMonths = years * 12;

  let balance = corpus;

  let totalWithdrawn = 0;

  let currentWithdrawal = withdrawal;

  const balanceByYear = [];
  const withdrawnByYear = [];

  let yearlyWithdrawn = 0;

  for (let month = 1; month <= totalMonths; month++) {

    // Increase withdrawal every 12 months
    if (month > 1 && (month - 1) % 12 === 0) {

      currentWithdrawal *=
        (1 + withdrawalGrowth / 100);
    }

    // Growth first
    balance *= (1 + monthlyRate);

    // Then withdrawal
    const actualWithdrawal =
      Math.min(balance, currentWithdrawal);

    balance -= actualWithdrawal;

    totalWithdrawn += actualWithdrawal;

    yearlyWithdrawn += actualWithdrawal;

    // Store yearly snapshots
    if (month % 12 === 0 || month === totalMonths) {

      balanceByYear.push(
        Math.round(balance)
      );

      withdrawnByYear.push(
        Math.round(yearlyWithdrawn)
      );

      yearlyWithdrawn = 0;
    }

    // Corpus exhausted
    if (balance <= 0) {
      balance = 0;
      break;
    }
  }

  return {
    finalBalance: Math.round(balance),
    totalWithdrawn: Math.round(totalWithdrawn),
    corpus,
    balanceByYear,
    withdrawnByYear
  };
}

/**
 * SIP + SWP Combined Retirement Planner
 * Phase 1: SIP accumulates corpus
 * Phase 2: SWP withdraws from corpus
 *
 * @param {number} monthlySIP        - Monthly SIP amount (₹)
 * @param {number} sipStepup         - Annual increase in SIP (%)
 * @param {number} sipYears          - SIP investment period (years)
 * @param {number} sipRate           - Expected return during SIP phase (%)
 * @param {number} swpYears          - SWP withdrawal period (years)
 * @param {number} initialWithdrawal - Initial monthly withdrawal (₹)
 * @param {number} withdrawalGrowth  - Annual increase in withdrawal (%)
 * @param {number} swpRate           - Expected return during SWP phase (%)
 */
function calcSIPthenSWP(monthlySIP, sipStepup, sipYears, sipRate,
                         swpYears, initialWithdrawal, withdrawalGrowth, swpRate) {
  // Phase 1: Build corpus via Step-Up SIP
  const sipResult    = calcStepUpSIP(monthlySIP, sipStepup, sipYears, sipRate);
  const corpusAtRetire = sipResult.fv;

  // Phase 2: Withdraw via SWP
  const swpResult    = calcSWP(corpusAtRetire, initialWithdrawal, swpYears, swpRate, withdrawalGrowth);

  return {
    sip: {
      invested:  sipResult.invested,
      corpus:    corpusAtRetire,
      returns:   sipResult.returns
    },
    swp: {
      initialWithdrawal,
      finalWithdrawal:  Math.round(initialWithdrawal * Math.pow(1 + withdrawalGrowth / 100, swpYears - 1)),
      totalWithdrawn:   swpResult.totalWithdrawn,
      finalBalance:     swpResult.finalBalance,
      balanceByYear:    swpResult.balanceByYear,
      withdrawnByYear:  swpResult.withdrawnByYear
    }
  };
}

/**
 * Generate month-by-month SIP table rows.
 * Columns: Month | Balance at Begin | SIP Added | Interest Earned | Balance at End
 */
function calcSIPMonthly(monthly, years, rate) {
  const r      = Math.pow(1 + rate / 100, 1 / 12) - 1;
  const n      = years * 12;
  const rows   = [];
  let balance  = 0;

  for (let m = 1; m <= n; m++) {
    const balBegin    = balance;
    // const interest    = Math.round(balBegin * r);
    // balance           = balBegin + interest + monthly;
    // SIP added first
    balance += monthly;

    // interest after SIP
    const interest = balance * r;

    balance += interest;
    rows.push({
      month:       m,
      balBegin: Math.round(balBegin),
      sipAdded: Math.round(monthly),
      interest: Math.round(interest),
      balEnd: Math.round(balance)
    });
  }
  return rows;
}

/**
 * Generate month-by-month Lumpsum table rows.
 * Columns: Month | Balance at Begin | Interest Earned | Balance at End
 */
function calcLumpsumMonthly(principal, years, rate) {
  const r    = Math.pow(1 + rate / 100, 1 / 12) - 1;
  const n    = years * 12;
  const rows = [];
  let bal    = principal;

  for (let m = 1; m <= n; m++) {
    const balBegin = bal;
    // const interest = Math.round(balBegin * r);
    // bal            = balBegin + interest;
    const interest = bal * r;
    bal += interest;
    rows.push({
      month:    m,
      balBegin: Math.round(balBegin),
      interest: Math.round(interest),
      balEnd:   Math.round(bal)
    });
  }
  return rows;
}


/**
 * Generate month-by-month SWP table rows.
 * Columns: Month | Balance at Begin | Withdrawal | Interest Earned | Balance at End
 */
function calcSWPMonthly(
  corpus,
  withdrawal,
  years,
  rate,
  withdrawalGrowth
) {

  withdrawalGrowth = withdrawalGrowth || 0;

  const monthlyRate =
    Math.pow(1 + rate / 100, 1 / 12) - 1;

  const totalMonths = years * 12;

  const rows = [];

  let balance = corpus;

  let currentWithdrawal = withdrawal;

  for (let month = 1; month <= totalMonths; month++) {

    // Step-up withdrawal yearly
    if (month > 1 && (month - 1) % 12 === 0) {

      currentWithdrawal *=
        (1 + withdrawalGrowth / 100);
    }

    const balBegin = balance;

    // Growth first
    const interest =
      balance * monthlyRate;

    balance += interest;

    // Then withdrawal
    const actualWithdrawal =
      Math.min(balance, currentWithdrawal);

    balance -= actualWithdrawal;

    rows.push({
      month,
      balBegin: Math.round(balBegin),
      withdrawal: Math.round(actualWithdrawal),
      interest: Math.round(interest),
      balEnd: Math.max(0, Math.round(balance))
    });

    if (balance <= 0) break;
  }

  return rows;
}


/* ── NUMBER FORMATTERS ── */

function formatNum(n) {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(2)   + ' Lacs';
  if (n >= 1000)     return '₹' + (n / 1000).toFixed(1)     + 'K';
  return '₹' + n;
}

function formatAxis(n) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000)   return (n / 100000).toFixed(0)   + ' L';
  if (n >= 1000)     return (n / 1000).toFixed(0)     + 'K';
  return '' + Math.round(n);
}

function formatTooltipValue(n) {

  if (n >= 10000000)
    return '₹' + (n / 10000000).toFixed(2) + ' Cr';

  if (n >= 100000)
    return '₹' + (n / 100000).toFixed(2) + ' L';

  if (n >= 1000)
    return '₹' + (n / 1000).toFixed(2) + ' K';

  return '₹' + Number(n).toFixed(2);
}

function calcStepUpSIPMonthly(monthly, stepup, years, rate) {

  const monthlyRate =
    Math.pow(1 + rate / 100, 1 / 12) - 1;

  const totalMonths = years * 12;

  const rows = [];

  let balance = 0;

  for (let month = 1; month <= totalMonths; month++) {

    const currentYear =
      Math.floor((month - 1) / 12);

    const sipAmount =
      monthly * Math.pow(1 + stepup / 100, currentYear);

    const balBegin = balance;

    // SIP first
    balance += sipAmount;

    // growth after SIP
    const interest =
      balance * monthlyRate;

    balance += interest;

    rows.push({
      month,
      balBegin: Math.round(balBegin),
      sipAdded: Math.round(sipAmount),
      interest: Math.round(interest),
      balEnd: Math.round(balance)
    });
  }

  return rows;
}
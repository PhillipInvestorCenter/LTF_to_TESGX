// script.js
window.addEventListener('DOMContentLoaded', () => {
  // State
  let currentLtf = 0;
  let currentReturnPct = 0;

  // Format number with commas
  function formatNumberWithCommas(x) {
    const parts = x.toString().split('.');
    const integer = parts[0].replace('-', '');
    parts[0] = (x < 0 ? '-' : '') +
      integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  // Page switcher
  function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // Build deduction schedule
  function computeSchedule(ltf, taxRate) {
    const maxDeduct = Math.min(ltf, 500000);
    const sched = [];
    if (maxDeduct <= 300000) {
      sched.push({ year: 2025, base: maxDeduct, tax: maxDeduct * taxRate });
    } else {
      sched.push({ year: 2025, base: 300000, tax: 300000 * taxRate });
      const perYear = (maxDeduct - 300000) / 4;
      for (let i = 1; i <= 4; i++) {
        sched.push({
          year: 2025 + i,
          base: perYear,
          tax: perYear * taxRate
        });
      }
    }
    return sched;
  }

  // IRR via Newton’s method
  function irr(cfs, guess = 0.1) {
    let rate = guess;
    for (let i = 0; i < 100; i++) {
      let f = 0, df = 0;
      cfs.forEach((cf, t) => {
        f += cf / Math.pow(1 + rate, t);
        df += -t * cf / Math.pow(1 + rate, t + 1);
      });
      const next = rate - f / df;
      if (Math.abs(next - rate) < 1e-7) return next;
      rate = next;
    }
    return rate;
  }

  // Elements
  const saleTextEl  = document.getElementById('saleText');
  const irrTextEl   = document.getElementById('irrText');
  const tbody       = document.querySelector('#deductionTable tbody');
  const taxBracket  = document.getElementById('taxBracket');

  // Update table, sale text, IRR
  function updateResults() {
    const taxRate = parseFloat(taxBracket.value);
    const sched = computeSchedule(currentLtf, taxRate);

    // Rebuild table
    tbody.innerHTML = '';
    sched.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.year}</td>
        <td>${formatNumberWithCommas(r.base.toFixed(2))}</td>
        <td>${formatNumberWithCommas(r.tax.toFixed(2))}</td>
      `;
      tbody.appendChild(tr);
    });

    // Sale amount styling
    const saleAmt = currentLtf * (1 + currentReturnPct);
    saleTextEl.textContent =
      `ขาย LTF ได้เงิน ${formatNumberWithCommas(saleAmt.toFixed(2))} บาท`;
    saleTextEl.style.color    = '#3366cc';
    saleTextEl.style.fontSize = '1.2rem';

    // IRR styling
    const cfs = [-currentLtf, ...sched.map(r => r.tax)];
    cfs[cfs.length - 1] += currentLtf * (1 + currentReturnPct);
    const rate = irr(cfs);
    irrTextEl.textContent  = `IRR: ${(rate * 100).toFixed(2)}% ต่อปี`;
    irrTextEl.style.fontSize = '1.2rem';
    irrTextEl.style.color    = rate >= 0 ? 'green' : 'red';
  }

  // Recalculate when tax bracket changes
  taxBracket.addEventListener('change', () => {
    if (currentLtf > 0) updateResults();
  });

  // Sign buttons
  let returnSign = 1;
  const signPos = document.getElementById('signPos');
  const signNeg = document.getElementById('signNeg');
  signPos.addEventListener('click', () => {
    returnSign = 1;
    signPos.classList.add('active');
    signNeg.classList.remove('active');
  });
  signNeg.addEventListener('click', () => {
    returnSign = -1;
    signNeg.classList.add('active');
    signPos.classList.remove('active');
  });

  // Input formatting + Enter key handling
  ['ltfValue', 'returnPct'].forEach(id => {
    const inp = document.getElementById(id);
    inp.addEventListener('input', e => {
      let val = e.target.value.replace(/,/g, '');
      if (!val.match(/^[0-9]*\.?[0-9]*$/)) val = val.slice(0, -1);
      e.target.value = val ? formatNumberWithCommas(val) : '';
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('calcBtn').click();
      }
    });
    inp.addEventListener('keypress', e => {
      if (!/[0-9.]/.test(e.key)) e.preventDefault();
    });
  });

  // Main calculate
  document.getElementById('calcBtn').addEventListener('click', () => {
    const rawLtf  = document.getElementById('ltfValue').value.replace(/,/g, '');
    const rawRet  = document.getElementById('returnPct').value.replace(/,/g, '');
    const ltf     = parseFloat(rawLtf);
    const pct     = parseFloat(rawRet) / 100 * returnSign;
    if (isNaN(ltf) || isNaN(pct)) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    currentLtf = ltf;
    currentReturnPct = pct;
    showPage('page2');
    updateResults();
  });

  // Navigation & reset
  document.getElementById('nextBtn2').addEventListener('click', () => {
    document.querySelectorAll('.decision').forEach(d => d.classList.add('hidden'));
    document.getElementById('decision1').classList.remove('hidden');
    showPage('page3');
  });
  document.getElementById('restartBtn2').addEventListener('click', () => {
    document.getElementById('ltfValue').value = '';
    document.getElementById('returnPct').value = '';
    returnSign = 1;
    signPos.classList.add('active');
    signNeg.classList.remove('active');
    currentLtf = 0;
    showPage('page1');
  });
  document.getElementById('page3').addEventListener('click', e => {
    if (!e.target.matches('button[data-choice]')) return;
    const reco = document.getElementById('recoText');
    const ch   = e.target.dataset.choice;
    if (ch === 'yes1' || ch === 'no1') {
      document.getElementById('decision1').classList.add('hidden');
      if (ch === 'yes1') document.getElementById('decision3').classList.remove('hidden');
      else document.getElementById('decision2').classList.remove('hidden');
      return;
    }
    if (ch === 'yes2' || ch === 'no2') {
      document.getElementById('decision2').classList.add('hidden');
      if (ch === 'yes2') document.getElementById('decision3').classList.remove('hidden');
      else {
        reco.textContent = 'ท่านไม่จำเป็นต้องสับเปลี่ยน โดยแนะนำพิจารณาขาย LTF ออกแทน';
        reco.style.color = 'red';
        showPage('page4');
      }
      return;
    }
    if (ch === 'yes3' || ch === 'no3') {
      document.getElementById('decision3').classList.add('hidden');
      if (ch === 'yes3') {
        reco.textContent = 'ท่านสามารถสับเปลี่ยน LTF ไปเป็น TESGX ได้ในช่วง พ.ค.–มิ.ย.';
        reco.style.color   = '';
      } else {
        reco.textContent = 'ท่านไม่จำเป็นต้องสับเปลี่ยน โดยแนะนำพิจารณาขาย LTF ออกแทน';
        reco.style.color = 'red';
      }
      showPage('page4');
    }
  });
  document.getElementById('restartBtn4').addEventListener('click', () => {
    document.getElementById('ltfValue').value = '';
    document.getElementById('returnPct').value = '';
    returnSign = 1;
    signPos.classList.add('active');
    signNeg.classList.remove('active');
    currentLtf = 0;
    showPage('page1');
  });
});

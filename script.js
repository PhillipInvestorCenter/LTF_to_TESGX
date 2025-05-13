window.addEventListener('DOMContentLoaded', () => {
  // ฟอร์แมตเลขด้วย comma ทุกพัน (รองรับลบได้)
  function formatNumberWithCommas(x) {
    const parts = x.toString().split('.');
    const integer = parts[0].replace('-', '');
    parts[0] = (x < 0 ? '-' : '') +
      integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  // สลับหน้า
  function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // สร้างตารางลดหย่อน
  function computeSchedule(ltf) {
    const maxDeduct = Math.min(ltf, 500000);
    const sched = [];
    if (maxDeduct <= 300000) {
      sched.push({ year: 2025, base: maxDeduct, tax: maxDeduct * 0.3 });
    } else {
      sched.push({ year: 2025, base: 300000, tax: 300000 * 0.3 });
      const perYear = (maxDeduct - 300000) / 4;
      for (let i = 1; i <= 4; i++) {
        sched.push({
          year: 2025 + i,
          base: perYear,
          tax: perYear * 0.3
        });
      }
    }
    return sched;
  }

  // คำนวณ IRR (Newton’s method)
  function irr(cfs, guess = 0.1) {
    let rate = guess;
    for (let iter = 0; iter < 100; iter++) {
      let f = 0, df = 0;
      cfs.forEach((cf, t) => {
        f += cf / Math.pow(1 + rate, t);
        df += -t * cf / Math.pow(1 + rate, t + 1);
      });
      const newRate = rate - f / df;
      if (Math.abs(newRate - rate) < 1e-7) return newRate;
      rate = newRate;
    }
    return rate;
  }

  // เริ่มต้น returnSign และปุ่ม +/−
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

  // ฟอร์แมต input ทั้งสอง
  ['ltfValue', 'returnPct'].forEach(id => {
    const inp = document.getElementById(id);
    inp.addEventListener('input', e => {
      let val = e.target.value.replace(/,/g, '');
      if (!val.match(/^-?[0-9]*\.?[0-9]*$/)) val = val.slice(0, -1);
      e.target.value = val ? formatNumberWithCommas(val) : '';
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('calcBtn').click();
      }
    });
  });

  // ฟังก์ชันคำนวณหลัก (Page 1 → Page 2)
  function doCalculate() {
    const rawLtf = document.getElementById('ltfValue').value.replace(/,/g, '');
    const rawRet = document.getElementById('returnPct').value.replace(/,/g, '');
    const ltf = parseFloat(rawLtf);
    const returnPct = parseFloat(rawRet) / 100 * returnSign;
    if (isNaN(ltf) || isNaN(returnPct)) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    // สร้างตารางลดหย่อน
    const sched = computeSchedule(ltf);
    const tbody = document.querySelector('#deductionTable tbody');
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

    // ขาย LTF ได้เงิน (1 + returnPct)
    const saleAmt = ltf * (1 + returnPct);
    document.getElementById('saleText').textContent =
      `ขาย LTF ได้เงิน ${formatNumberWithCommas(saleAmt.toFixed(2))} บาท`;

    // คำนวณ IRR
    const cfs = [-ltf, ...sched.map(r => r.tax)];
    cfs[cfs.length - 1] += ltf * (1 + returnPct);
    const rate = irr(cfs);
    document.getElementById('irrText').textContent =
      `IRR: ${(rate * 100).toFixed(2)}% ต่อปี`;

    showPage('page2');
  }

  document.getElementById('calcBtn').addEventListener('click', doCalculate);

  // Page 2 → Page 3
  document.getElementById('nextBtn2').addEventListener('click', () => {
    document.querySelectorAll('.decision').forEach(d => d.classList.add('hidden'));
    document.getElementById('decision1').classList.remove('hidden');
    showPage('page3');
  });

  // Page 2 รีเซ็ต
  document.getElementById('restartBtn2').addEventListener('click', () => {
    document.getElementById('ltfValue').value = '';
    document.getElementById('returnPct').value = '';
    returnSign = 1;
    signPos.classList.add('active');
    signNeg.classList.remove('active');
    showPage('page1');
  });

  // Page 3 → Page 4 (คำถาม & คำแนะนำ)
  document.getElementById('page3').addEventListener('click', e => {
    if (!e.target.matches('button[data-choice]')) return;
    const reco = document.getElementById('recoText');
    const ch = e.target.dataset.choice;

    // คำถามข้อ 1
    if (ch === 'yes1' || ch === 'no1') {
      document.getElementById('decision1').classList.add('hidden');
      if (ch === 'yes1') {
        document.getElementById('decision3').classList.remove('hidden');
      } else {
        document.getElementById('decision2').classList.remove('hidden');
      }
      return;
    }

    // คำถามข้อ 2
    if (ch === 'yes2' || ch === 'no2') {
      document.getElementById('decision2').classList.add('hidden');
      if (ch === 'yes2') {
        document.getElementById('decision3').classList.remove('hidden');
      } else {
        reco.textContent = 'ท่านไม่จำเป็นต้องสับเปลี่ยน โดยแนะนำพิจารณาขาย LTF ออกแทน';
        reco.style.color = 'red';
        showPage('page4');
      }
      return;
    }

    // คำถามข้อ 3
    if (ch === 'yes3' || ch === 'no3') {
      document.getElementById('decision3').classList.add('hidden');
      if (ch === 'yes3') {
        reco.textContent = 'ท่านสามารถสับเปลี่ยน LTF ไปเป็น TESGX ได้ในช่วง พ.ค.–มิ.ย.';
        reco.style.color = '';
      } else {
        reco.textContent = 'ท่านไม่จำเป็นต้องสับเปลี่ยน โดยแนะนำพิจารณาขาย LTF ออกแทน';
        reco.style.color = 'red';
      }
      showPage('page4');
    }
  });

  // Page 4 รีเซ็ต
  document.getElementById('restartBtn4').addEventListener('click', () => {
    document.getElementById('ltfValue').value = '';
    document.getElementById('returnPct').value = '';
    returnSign = 1;
    signPos.classList.add('active');
    signNeg.classList.remove('active');
    showPage('page1');
  });
});

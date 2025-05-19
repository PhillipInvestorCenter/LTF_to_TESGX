// script.js
window.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  function showPage(id) {
    pages.forEach(p =>
      p.id === id
        ? p.classList.add('active')
        : p.classList.remove('active')
    );
  }

  // Navigation
  document.getElementById('next1').addEventListener('click', () => showPage('page2'));
  document.getElementById('ackBtn').addEventListener('click', () => showPage('page3'));
  document.getElementById('taxYes').addEventListener('click', () => showPage('page4'));
  document.getElementById('taxNo').addEventListener('click', () => showPage('page6'));
  document.getElementById('useLtfYes').addEventListener('click', () => showPage('page5'));
  document.getElementById('useLtfNo').addEventListener('click', () => showPage('page6'));

  document.getElementById('back2').addEventListener('click', () => showPage('page1'));
  document.getElementById('back3').addEventListener('click', () => showPage('page2'));
  document.getElementById('back4').addEventListener('click', () => showPage('page3'));
  document.getElementById('back5').addEventListener('click', () => showPage('page4'));

  // Accordion
  document.querySelectorAll('.info-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const open = content.classList.contains('open');
      document.querySelectorAll('.info-content').forEach(c => c.classList.remove('open'));
      if (!open) content.classList.add('open');
    });
  });

  // Page 1 calculation logic
  function formatCommas(x) {
    const parts = x.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  const ltfInput      = document.getElementById('ltfValue');
  const returnPctEl   = document.getElementById('returnPct');
  const sliderBubble  = document.getElementById('sliderBubble');
  const divYes        = document.getElementById('divYes');
  const divNo         = document.getElementById('divNo');
  const taxSavedInput = document.getElementById('taxSavedValue');
  const infoIcon      = document.getElementById('infoIcon');
  const infoText      = document.getElementById('infoText');

  const receiptPrincipal   = document.getElementById('receiptPrincipal');
  const receiptReturn      = document.getElementById('receiptReturn');
  const receiptDividend    = document.getElementById('receiptDividend');
  const receiptTaxBenefit  = document.getElementById('receiptTaxBenefit');
  const receiptTotalReturn = document.getElementById('receiptTotalReturn');

  let baseVal = 0, retPct = -30, retAmt = 0;
  let gotDividend = false, divAmt = 0, taxSavedVal = 0;

  function updatePage1() {
    baseVal = parseFloat(ltfInput.value.replace(/,/g, '')) || 0;
    retPct  = parseFloat(returnPctEl.value) || 0;
    retAmt  = baseVal * (retPct / 100);

    sliderBubble.textContent = retPct + '%';
    const pos = (retPct - +returnPctEl.min) /
                ((+returnPctEl.max - +returnPctEl.min)) * 100;
    sliderBubble.style.left = pos + '%';

    divAmt      = gotDividend ? baseVal * 0.0411 : 0;
    taxSavedVal = parseFloat(taxSavedInput.value.replace(/,/g, '')) || 0;
    const totalRet = retAmt + divAmt + taxSavedVal;

    receiptPrincipal.textContent   = formatCommas(baseVal.toFixed(2));
    receiptReturn.textContent      = formatCommas(retAmt.toFixed(2));
    receiptDividend.textContent    = formatCommas(divAmt.toFixed(2));
    receiptTaxBenefit.textContent  = formatCommas(taxSavedVal.toFixed(2));
    receiptTotalReturn.textContent = formatCommas(totalRet.toFixed(2));
    receiptTotalReturn.style.color = totalRet < 0 ? 'red' : 'green';
  }

  // Inputs
  ltfInput.addEventListener('input', e => {
    let v = e.target.value.replace(/,/g, '');
    if (!/^[0-9]*\.?[0-9]*$/.test(v)) v = v.slice(0, -1);
    e.target.value = v ? formatCommas(v) : '';
    updatePage1();
  });
  returnPctEl.addEventListener('input', updatePage1);
  divYes.addEventListener('click', () => {
    gotDividend = true;
    divYes.classList.replace('secondary','primary');
    divNo.classList.replace('primary','secondary');
    updatePage1();
  });
  divNo.addEventListener('click', () => {
    gotDividend = false;
    divNo.classList.replace('secondary','primary');
    divYes.classList.replace('primary','secondary');
    updatePage1();
  });
  taxSavedInput.addEventListener('input', e => {
    let v = e.target.value.replace(/,/g, '');
    if (!/^[0-9]*\.?[0-9]*$/.test(v)) v = v.slice(0, -1);
    e.target.value = v ? formatCommas(v) : '';
    updatePage1();
  });
  infoIcon.addEventListener('click', () => infoText.classList.toggle('hidden'));

  // Restart buttons on page5 & page6
  document.querySelectorAll('.restartBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      ltfInput.value = '';
      taxSavedInput.value = '';
      returnPctEl.value = '-30';
      gotDividend = false;
      divYes.classList.replace('primary','secondary');
      divNo.classList.replace('primary','secondary');
      infoText.classList.add('hidden');
      document.querySelectorAll('.info-content').forEach(c => c.classList.remove('open'));
      updatePage1();
      showPage('page1');
    });
  });

  // Initialize
  updatePage1();
});

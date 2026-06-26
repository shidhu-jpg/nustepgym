/* ============================================================
   script.js — NuStep Fitness Gym
   ============================================================
   HOW THIS FILE IS ORGANIZED:
   1.  NAVBAR SCROLL        — adds dark background when user scrolls
   2.  HAMBURGER MENU       — mobile menu open/close
   3.  CALCULATOR TABS      — switches between BMI/Calorie/Macro panels
   4.  UNIT TOGGLE          — Metric ↔ Imperial switch for BMI calc
   5.  BMI CALCULATOR       — formula + result display + scale pointer
   6.  BMI CATEGORY INFO    — tips text per category
   7.  CALORIE CALCULATOR   — Mifflin-St Jeor formula
   8.  TAB SWITCHER         — "Calculate Macros →" button links tabs
   9.  MACRO CALCULATOR     — protein/carb/fat split logic
   10. FORM SUBMIT          — simulated success message
   11. ERROR HELPER         — shows error in result box
   12. SCROLL ANIMATION     — fade-up effect on scroll
   ============================================================ */


/* ============================================================
   1. NAVBAR SCROLL EFFECT
   ─────────────────────────────────────────────────────────────
   Listens for page scroll. When user scrolls more than 60px,
   adds class "scrolled" to the navbar which (in style.css) gives
   it a dark frosted background.

   TO CHANGE when navbar goes dark: change 60 to any pixel value.
============================================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});


/* ============================================================
   2. HAMBURGER MENU (Mobile)
   ─────────────────────────────────────────────────────────────
   Clicking the hamburger button toggles class "open" on both
   the button itself (animates 3 lines → X) and the nav links
   (shows the dropdown menu).

   Clicking any nav link also closes the menu automatically.
============================================================ */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

/* Close mobile menu when any link inside it is clicked */
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});


/* ============================================================
   3. CALCULATOR TAB SWITCHING
   ─────────────────────────────────────────────────────────────
   When a tab button is clicked:
   1. Remove "active" from all tab buttons
   2. Remove "active" from all panels (hides them)
   3. Add "active" to the clicked button
   4. Add "active" to the matching panel (shows it)

   The matching is done via data-tab attribute:
   e.g. <button data-tab="bmi"> matches <div id="tab-bmi">

   DO NOT CHANGE this logic unless you rename the panel IDs.
============================================================ */
document.querySelectorAll('.calc-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});




/* ============================================================
   5. BMI CALCULATOR
   ─────────────────────────────────────────────────────────────
   Called when user clicks "Calculate BMI" button.

   FORMULA: BMI = weight(kg) / height(m)²
   → For imperial: converts ft+inches → metres, lbs → kg first.

   Displays:
   → Large BMI number (colour-coded)
   → Category label (Underweight / Normal / Overweight / Obese)
   → 4 personalised tips from getBMIInfo()
   → "Talk to a Trainer" button linking to contact section
   → Moves the arrow pointer on the colour scale bar

   YOU DO NOT NEED TO CHANGE this function.
   TO CHANGE tips/advice text → edit getBMIInfo() below.
============================================================ */
function calculateBMI() {
  /* ── Get height in metres from ft + inches ── */
  const ft  = parseFloat(document.getElementById('heightFt').value) || 0;
  const inc = parseFloat(document.getElementById('heightIn').value) || 0;
  if (!ft) return showError('bmiResult', 'Please enter a valid height');
  const heightM = ((ft * 12) + inc) * 0.0254;

  /* ── Get weight in kg ── */
  const weightKg = parseFloat(document.getElementById('bmiWeight').value);
  if (!weightKg || weightKg < 1) return showError('bmiResult', 'Please enter a valid weight');

  /* ── Read age and gender (used in getBMIInfo for context) ── */
  const age    = parseInt(document.getElementById('bmiAge').value);
  const gender = document.getElementById('bmiGender').value;

  /* ── Calculate BMI ── */
  const bmi = weightKg / (heightM * heightM);

  /* ── Get category, colour, and tips ── */
  const { category, color, tips } = getBMIInfo(bmi, age, gender);

  /* ── Build result HTML and inject into result box ── */
  const resultEl = document.getElementById('bmiResult');
  resultEl.innerHTML = `
    <div class="bmi-value" style="color:${color}">${bmi.toFixed(1)}</div>
    <div class="bmi-category" style="color:${color}">${category}</div>
    <div class="bmi-tips">
      ${tips.map(t => `<div class="bmi-tip"><i class="fa-solid fa-circle-arrow-right"></i><span>${t}</span></div>`).join('')}
    </div>
    <a href="#contact" class="btn btn-primary" style="margin-top:20px;justify-content:center;width:100%">
      Talk to a Trainer
    </a>
  `;

  /* ── Move the arrow pointer on the colour scale bar ── */
  const pointer = document.getElementById('scalePointer');
  pointer.style.display = 'block';

  /* Map BMI 10–40 onto 0%–100% of the bar width */
  const clampedBMI = Math.min(Math.max(bmi, 10), 40); /* Keep within 10–40 range */
  const pct = ((clampedBMI - 10) / 30) * 100;

  pointer.style.setProperty('--pos', pct + '%');
  pointer.style.left = pct + '%';
  pointer.setAttribute('data-label', 'Your BMI: ' + bmi.toFixed(1)); /* Label shown under pointer */
  pointer.style.cssText += `left:${pct}%; --pos:${pct}%`;
}


/* ============================================================
   6. BMI CATEGORY INFO
   ─────────────────────────────────────────────────────────────
   Returns category name, display colour, and 4 tip strings
   based on the calculated BMI value.

   TO CHANGE TIP TEXT: edit the strings inside the tips arrays.
   TO CHANGE COLOURS: edit the hex values (#3b82f6 etc.)
   Ranges: <18.5 = underweight, 18.5–24.9 = normal,
           25–29.9 = overweight, ≥30 = obese
============================================================ */
function getBMIInfo(bmi, age, gender) {
  if (bmi < 18.5) {
    return {
      category: 'Underweight',
      color: '#3b82f6', /* Blue */
      tips: [
        'Increase daily calorie intake with nutrient-dense foods.',
        'Focus on strength training to build lean muscle mass.',
        'Consult our diet experts for a customised meal plan.',
        'Protein target: 1.6–2.2g per kg of body weight daily.'
      ]
    };
  } else if (bmi < 25) {
    return {
      category: 'Normal Weight',
      color: '#22c55e', /* Green */
      tips: [
        'Great job! Maintain your healthy weight through regular exercise.',
        'Mix cardio and strength training for optimal fitness.',
        'Focus on body recomposition — build muscle while keeping fat low.',
        'Stay consistent with 4–5 gym sessions per week.'
      ]
    };
  } else if (bmi < 30) {
    return {
      category: 'Overweight',
      color: '#f59e0b', /* Amber */
      tips: [
        'Create a moderate calorie deficit (300–500 kcal/day).',
        'Combine cardio (3x/week) with strength training (3x/week).',
        'Reduce processed foods, sugar, and liquid calories.',
        'Track your daily food intake to stay accountable.'
      ]
    };
  } else {
    return {
      category: 'Obese',
      color: '#ef4444', /* Red */
      tips: [
        'Consult with a healthcare professional before starting.',
        'Begin with low-impact cardio: walking, cycling, swimming.',
        'Our personal trainers can design a safe beginner programme.',
        'Small changes compound — even losing 5% weight reduces health risks.'
      ]
    };
  }
}


/* ============================================================
   7. CALORIE CALCULATOR
   ─────────────────────────────────────────────────────────────
   Uses the Mifflin-St Jeor equation — the most accurate
   widely-used BMR formula:

   Male:   BMR = (10 × weight) + (6.25 × height) − (5 × age) + 5
   Female: BMR = (10 × weight) + (6.25 × height) − (5 × age) − 161

   Then multiplied by activity level to get TDEE (maintenance calories).
   Then goal adjustment added (+500 to gain, -500 to lose).

   Displays: daily calorie target, BMR, TDEE, daily protein target,
   and a button to jump to the Macro Calculator with calories pre-filled.

   DO NOT CHANGE the formula numbers — these are medically established.
   TO CHANGE the deficit/surplus amounts: edit calGoal dropdown values
   in index.html and the corresponding ±500 values.
============================================================ */
function calculateCalories() {
  const age      = parseFloat(document.getElementById('calAge').value);
  const gender   = document.getElementById('calGender').value;
  const calFt    = parseFloat(document.getElementById('calHeightFt').value) || 0;
  const calIn    = parseFloat(document.getElementById('calHeightIn').value) || 0;
  const height   = ((calFt * 12) + calIn) * 2.54; /* convert ft+in to cm */
  const weight   = parseFloat(document.getElementById('calWeight').value); /* kg */
  const activity = parseFloat(document.getElementById('calActivity').value); /* multiplier */
  const goal     = parseInt(document.getElementById('calGoal').value);       /* kcal adjustment */

  if (!age || !calFt || !weight) return showError('calResult', 'Please fill all fields');

  /* ── Mifflin-St Jeor BMR formula ── */
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const tdee   = Math.round(bmr * activity); /* Total Daily Energy Expenditure */
  const target = tdee + goal;                /* Final target after goal adjustment */
  const goalLabel = goal < 0 ? 'Lose Weight' : goal === 0 ? 'Maintain' : 'Gain Muscle';

  /* ── Build and inject result HTML ── */
  document.getElementById('calResult').innerHTML = `
    <div style="width:100%">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:0.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px">Your Daily Target (${goalLabel})</div>
        <div style="font-family:var(--font-head);font-size:4rem;font-weight:900;color:var(--red);line-height:1">${target}</div>
        <div style="font-size:0.9rem;color:var(--gray)">calories per day</div>
      </div>
      <div class="result-card"><span class="rc-label">BMR (Basal Rate)</span><span class="rc-value">${Math.round(bmr)} kcal</span></div>
      <div class="result-card"><span class="rc-label">TDEE (Maintenance)</span><span class="rc-value">${tdee} kcal</span></div>
      <!-- Protein recommendation: 2g per kg is a standard gym guideline -->
      <div class="result-card"><span class="rc-label">Protein</span><span class="rc-value">${Math.round(weight * 2)}g / day</span></div>
      <!-- Button that pre-fills the Macro tab with this calorie value -->
      <a href="#bmi" onclick="switchToMacro(${target})" class="btn btn-outline" style="width:100%;justify-content:center;margin-top:12px">
        Calculate Macros →
      </a>
    </div>
  `;
}


/* ============================================================
   8. TAB SWITCHER (from Calorie → Macro)
   ─────────────────────────────────────────────────────────────
   Called when user clicks "Calculate Macros →" in calorie results.
   Switches to the Macro tab and pre-fills the calories field.
============================================================ */
function switchToMacro(calories) {
  /* Deactivate all tabs and panels */
  document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));

  /* Activate the Macro tab */
  document.querySelector('[data-tab="macro"]').classList.add('active');
  document.getElementById('tab-macro').classList.add('active');

  /* Pre-fill the calories input */
  document.getElementById('macroCalories').value = calories;
}


/* ============================================================
   9. MACRO CALCULATOR
   ─────────────────────────────────────────────────────────────
   Calculates how many grams of protein, carbs, and fat to eat
   daily based on total calories + goal + body weight.

   Protein targets per kg body weight (well-established ranges):
   → Fat Loss:    2.4g/kg (higher protein to preserve muscle while cutting)
   → Maintenance: 1.8g/kg
   → Muscle Gain: 2.0g/kg

   Fat percentage of calories:
   → Fat Loss: 30%   → Maintenance: 30%   → Muscle Gain: 25%

   Carbs fill the remaining calories after protein and fat are set.

   Calorie values per gram:
   → Protein = 4 kcal/g
   → Carbs   = 4 kcal/g
   → Fat      = 9 kcal/g

   TO CHANGE the protein targets: edit the 2.4, 2.0, 1.8 values.
   TO CHANGE fat percentages: edit the 0.30, 0.25 values.
============================================================ */
function calculateMacros() {
  const calories = parseFloat(document.getElementById('macroCalories').value);
  const goal     = document.getElementById('macroGoal').value;      /* 'loss', 'maintain', or 'bulk' */
  const weight   = parseFloat(document.getElementById('macroWeight').value); /* kg */

  if (!calories) return showError('macroResult', 'Please enter your daily calories');

  let protein, carbs, fat;

  if (goal === 'loss') {
    /* Fat Loss: high protein (2.4g/kg), moderate fat (30%), carbs fill the rest */
    protein = weight ? Math.round(weight * 2.4) : Math.round(calories * 0.40 / 4);
    fat     = Math.round(calories * 0.30 / 9);
    carbs   = Math.round((calories - protein * 4 - fat * 9) / 4);

  } else if (goal === 'bulk') {
    /* Muscle Gain: moderate protein (2.0g/kg), lower fat (25%), more carbs for energy */
    protein = weight ? Math.round(weight * 2.0) : Math.round(calories * 0.30 / 4);
    fat     = Math.round(calories * 0.25 / 9);
    carbs   = Math.round((calories - protein * 4 - fat * 9) / 4);

  } else {
    /* Maintenance: balanced (1.8g/kg protein, 30% fat) */
    protein = weight ? Math.round(weight * 1.8) : Math.round(calories * 0.30 / 4);
    fat     = Math.round(calories * 0.30 / 9);
    carbs   = Math.round((calories - protein * 4 - fat * 9) / 4);
  }

  /* ── Calculate percentage of calories from each macro ── */
  const pPct = Math.round(protein * 4 / calories * 100); /* % of cals from protein */
  const cPct = Math.round(carbs   * 4 / calories * 100); /* % of cals from carbs */
  const fPct = Math.round(fat     * 9 / calories * 100); /* % of cals from fat */

  /* ── Build and inject result HTML ── */
  document.getElementById('macroResult').innerHTML = `
    <div style="width:100%">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:0.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px">Daily Macro Split</div>
        <div style="font-family:var(--font-head);font-size:1.1rem;font-weight:700;color:var(--gray-light)">${calories} kcal / day</div>
      </div>
      <!-- Three coloured boxes for P/C/F -->
      <div class="macro-ring-wrapper">
        <div class="macro-ring mr-protein">
          <div class="mr-val">${protein}g</div>
          <div class="mr-label">Protein<br/>${pPct}%</div>
        </div>
        <div class="macro-ring mr-carb">
          <div class="mr-val">${carbs}g</div>
          <div class="mr-label">Carbs<br/>${cPct}%</div>
        </div>
        <div class="macro-ring mr-fat">
          <div class="mr-val">${fat}g</div>
          <div class="mr-label">Fat<br/>${fPct}%</div>
        </div>
      </div>
      <!-- Detail cards showing grams → kcal conversion -->
      <div class="result-card"><span class="rc-label">Protein (${pPct}%)</span><span class="rc-value">${protein * 4} kcal</span></div>
      <div class="result-card"><span class="rc-label">Carbohydrates (${cPct}%)</span><span class="rc-value">${carbs * 4} kcal</span></div>
      <div class="result-card"><span class="rc-label">Fats (${fPct}%)</span><span class="rc-value">${fat * 9} kcal</span></div>
    </div>
  `;
}


/* ============================================================
   10. CONTACT FORM SUBMIT
   ─────────────────────────────────────────────────────────────
   Currently simulates a form submission with a 1.2s delay then
   shows a green success message. The form data is NOT actually
   sent anywhere — it's a UI demo only.

   TO MAKE THE FORM ACTUALLY WORK (send real messages):
   Option A — Formspree (free, simple):
     1. Go to formspree.io, create a form
     2. Add action="https://formspree.io/f/YOUR_ID" to <form>
     3. Remove onsubmit="submitForm(event)"
     4. Remove this entire function — Formspree handles it

   Option B — EmailJS (sends directly to your email):
     1. Go to emailjs.com, set up a service + template
     2. Replace the setTimeout block below with:
        emailjs.send('service_id', 'template_id', { name, phone })

   Option C — WhatsApp redirect:
     Replace the success logic with:
     window.open(`https://wa.me/91XXXXXXXXXX?text=Name: ${name}, Phone: ${phone}`)

   CHANGE the success message text in the div below if needed.
============================================================ */
function submitForm(e) {
  e.preventDefault(); /* Prevent default browser form submission */

  /* Validate required fields */
  const name  = document.getElementById('formName').value.trim();
  const phone = document.getElementById('formPhone').value.trim();
  if (!name || !phone) return;

  /* Show loading state on button */
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  /* Simulate a 1.2 second network delay then show success */
  setTimeout(() => {
    document.getElementById('formSuccess').style.display = 'flex'; /* Show green message */
    btn.textContent = 'Send Message';
    btn.disabled = false;
    e.target.reset(); /* Clear all form fields */

    /* Auto-hide success message after 5 seconds */
    setTimeout(() => {
      document.getElementById('formSuccess').style.display = 'none';
    }, 5000);
  }, 1200);
}


/* ============================================================
   11. ERROR DISPLAY HELPER
   ─────────────────────────────────────────────────────────────
   Replaces the content of a result box with a red error message.
   Called by calculateBMI() and calculateCalories() when inputs
   are missing or invalid.

   id  = the result box element ID (e.g. 'bmiResult')
   msg = the error text to display
============================================================ */
function showError(id, msg) {
  document.getElementById(id).innerHTML = `
    <div style="text-align:center;color:#ef4444">
      <i class="fa-solid fa-circle-exclamation" style="font-size:2rem;margin-bottom:12px;display:block"></i>
      ${msg}
    </div>
  `;
}


/* ============================================================
   12. SCROLL FADE-UP ANIMATION
   ─────────────────────────────────────────────────────────────
   Uses IntersectionObserver — a browser API that fires a callback
   whenever an element enters the viewport.

   The CSS class "fade-up" makes elements start invisible and
   slightly below their position. When this code detects that
   the element is 12% visible (threshold: 0.12), it adds class
   "visible" which triggers the CSS transition to full opacity.

   Elements observed: service cards, gallery items, pricing cards,
   testimonial cards, about section, contact section.

   TO ADD MORE ELEMENTS: add their selector to the querySelectorAll list.
   TO CHANGE TRIGGER POINT: change threshold (0 = as soon as visible,
   1 = fully visible before triggering).
============================================================ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible'); /* Triggers the fade-up CSS transition */
    }
  });
}, { threshold: 0.12 }); /* Trigger when element is 12% in view */

/* Attach the observer to all these elements */
document.querySelectorAll('.service-card, .gallery-item, .pricing-card, .testi-card, .about-grid, .contact-grid')
  .forEach(el => {
    el.classList.add('fade-up'); /* Add starting state */
    observer.observe(el);        /* Start watching it */
  });

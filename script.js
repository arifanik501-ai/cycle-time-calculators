document.addEventListener('DOMContentLoaded', () => {
    // --- STOPWATCH LOGIC ---
    const stopwatch = {
        startTime: 0,
        elapsedTime: 0,
        timerInterval: null,
        isRunning: false,
        laps: 0,

        // DOM Elements
        elements: {
            displayMin: document.getElementById('display-min'),
            displaySec: document.getElementById('display-sec'),
            displayMs: document.getElementById('display-ms'),
            secondaryTime: document.getElementById('secondary-time'),
            secondHand: document.getElementById('second-hand'),
            progressRing: document.querySelector('.progress-ring-stroke'),
            lapCounter: document.getElementById('lap-count-val'),
            btnStart: document.getElementById('btn-start'),
            btnReset: document.getElementById('btn-reset'),
            btnLap: document.getElementById('btn-lap'),
            iconStart: document.getElementById('icon-start'),
            btnUseTime: document.getElementById('btn-use-time'),
            stickyNav: document.getElementById('sticky-nav'),
            miniTime: document.getElementById('mini-time-display'),
            miniRing: document.querySelector('.mini-stroke'),
            miniBtnStart: document.getElementById('mini-btn-start'),
            miniBtnReset: document.getElementById('mini-btn-reset'),
        },

        init() {
            this.generateTicks();
            this.setupEventListeners();
            this.updateDisplay(0);
        },

        generateTicks() {
            const container = document.getElementById('ticks-container');
            for (let i = 0; i < 60; i++) {
                const tick = document.createElement('div');
                tick.classList.add('tick');
                if (i % 5 === 0) tick.classList.add('major');
                if (i % 15 === 0) tick.classList.add('quarter');
                tick.style.transform = `rotate(${i * 6}deg) translateY(-134px)`; // 142px radius - 8px padding
                container.appendChild(tick);
            }
        },

        setupEventListeners() {
            // Main Controls
            this.elements.btnStart.addEventListener('click', () => this.toggle());
            this.elements.btnReset.addEventListener('click', () => this.reset());
            this.elements.btnLap.addEventListener('click', () => this.lap());
            this.elements.btnUseTime.addEventListener('click', () => this.useTime());

            // Mini Controls
            this.elements.miniBtnStart.addEventListener('click', () => this.toggle());
            this.elements.miniBtnReset.addEventListener('click', () => this.reset());

            // Scroll for Sticky Nav
            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;
                if (scrollY > 250) {
                    this.elements.stickyNav.classList.add('visible');
                    this.elements.stickyNav.style.transform = 'translateY(0)';
                } else {
                    this.elements.stickyNav.classList.remove('visible');
                    this.elements.stickyNav.style.transform = 'translateY(-100%)';
                }
            });
        },

        toggle() {
            if (this.isRunning) {
                this.pause();
            } else {
                this.start();
            }
        },

        start() {
            if (!this.isRunning) {
                this.startTime = performance.now() - this.elapsedTime;
                this.timerInterval = requestAnimationFrame(this.update.bind(this));
                this.isRunning = true;
                this.updateControls(true);
            }
        },

        pause() {
            if (this.isRunning) {
                cancelAnimationFrame(this.timerInterval);
                this.isRunning = false;
                this.updateControls(false);
            }
        },

        reset() {
            this.pause();
            this.elapsedTime = 0;
            this.updateDisplay(0);
            this.laps = 0;
            this.elements.lapCounter.textContent = '#00';
            this.elements.btnReset.disabled = true;
            this.elements.btnLap.disabled = true;
            this.elements.btnUseTime.classList.add('hidden');

            // Reset Progress Rings
            this.elements.progressRing.style.strokeDashoffset = 917;
            this.elements.miniRing.style.strokeDashoffset = 163;
            this.elements.secondHand.style.transform = `translate(-50%, -100%) rotate(0deg)`;
        },

        lap() {
            this.laps++;
            this.elements.lapCounter.textContent = `#${this.laps.toString().padStart(2, '0')}`;
            // Could add lap recording logic here
        },

        update(currentTime) {
            this.elapsedTime = currentTime - this.startTime;
            this.updateDisplay(this.elapsedTime);

            if (this.isRunning) {
                this.timerInterval = requestAnimationFrame(this.update.bind(this));
            }
        },

        updateDisplay(time) {
            // Calculate time components
            const diffInHrs = time / 3600000;
            const hh = Math.floor(diffInHrs);

            const diffInMin = (diffInHrs - hh) * 60;
            const mm = Math.floor(diffInMin);

            const diffInSec = (diffInMin - mm) * 60;
            const ss = Math.floor(diffInSec);

            const diffInMs = (diffInSec - ss) * 100;
            const ms = Math.floor(diffInMs);

            const formattedMM = mm.toString().padStart(2, '0');
            const formattedSS = ss.toString().padStart(2, '0');
            const formattedMS = ms.toString().padStart(2, '0');

            // Update DOM
            this.elements.displayMin.textContent = formattedMM;
            this.elements.displaySec.textContent = formattedSS;
            this.elements.displayMs.textContent = formattedMS;
            this.elements.miniTime.textContent = `${formattedMM}:${formattedSS}`;

            this.elements.secondaryTime.textContent =
                `${hh.toString().padStart(2, '0')}:${formattedMM}:${formattedSS}`;

            // Update Second Hand Rotation (Continuous)
            const totalSeconds = mm * 60 + ss + ms / 100;
            const degrees = totalSeconds * 6; // 6 degrees per second
            this.elements.secondHand.style.transform = `translate(-50%, -100%) rotate(${degrees}deg)`;

            // Update Progress Ring (60s loop)
            // Circumference ~ 917.4
            const progress = (ss + ms / 100) / 60;
            const offset = 917 - (progress * 917);
            this.elements.progressRing.style.strokeDashoffset = offset;

            // Mini Ring
            const miniOffset = 163 - (progress * 163);
            this.elements.miniRing.style.strokeDashoffset = miniOffset;
        },

        updateControls(isRunning) {
            if (isRunning) {
                this.elements.iconStart.classList.replace('fa-play', 'fa-pause');
                this.elements.btnStart.classList.add('paused');
                this.elements.miniBtnStart.innerHTML = '<i class="fa-solid fa-pause"></i>';

                this.elements.btnReset.disabled = false;
                this.elements.btnLap.disabled = false;
                this.elements.btnUseTime.classList.remove('hidden');
            } else {
                this.elements.iconStart.classList.replace('fa-pause', 'fa-play');
                this.elements.btnStart.classList.remove('paused');
                this.elements.miniBtnStart.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        },

        useTime() {
            // Convert measurement to inputs
            const mm = parseInt(this.elements.displayMin.textContent);
            const ss = parseInt(this.elements.displaySec.textContent);

            // Populate Calculator Inputs
            document.getElementById('time-min').value = mm;
            document.getElementById('time-sec').value = ss;

            // Scroll to inputs
            document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth' });

            // Highlight inputs
            const row = document.querySelector('.time-inputs-row');
            row.style.borderColor = '#63B3ED';
            row.style.boxShadow = '0 0 15px rgba(99, 179, 237, 0.4)';
            setTimeout(() => {
                row.style.borderColor = '';
                row.style.boxShadow = '';
            }, 1000);
        }
    };

    // Initialize Stopwatch
    stopwatch.init();

    // --- EXISTING CALCULATOR LOGIC ---
    // DOM Elements
    const piecesInput = document.getElementById('pieces');

    // Time Inputs (Group 1)
    const timeMinInput = document.getElementById('time-min');
    const timeSecInput = document.getElementById('time-sec');

    // Downtime Inputs (Group 2)
    const downtimeMinInput = document.getElementById('downtime-min');
    const downtimeSecInput = document.getElementById('downtime-sec');
    const downtimeFreqInput = document.getElementById('downtime-freq');

    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultsArea = document.getElementById('results-area');

    // Result Elements (New 6-Card System)
    const resCycleTime = document.getElementById('res-cycle-time');
    const resCycleFormatted = document.getElementById('res-cycle-formatted');

    const res8hrOutput = document.getElementById('res-8hr-output');
    const target8hr = document.getElementById('target-8hr');

    const res11hrOutput = document.getElementById('res-11hr-output');
    const target11hr = document.getElementById('target-11hr');

    const resRateMin = document.getElementById('res-rate-min');
    const resRateHr = document.getElementById('res-rate-hr');

    const resEfficiency = document.getElementById('res-efficiency');

    const resDowntimeLoss = document.getElementById('res-downtime-loss');
    const resDowntimePieces = document.getElementById('res-downtime-pieces');

    // Constants
    const SHIFT_8_SEC = 28800; // 8 hours * 3600
    const SHIFT_11_SEC = 39600; // 11 hours * 3600

    function validateInputs() {
        const pieces = parseInt(piecesInput.value) || 0;
        if (pieces <= 0) {
            alert("Please enter a valid number of pieces produced (greater than 0).");
            return false;
        }

        // Check if at least some time is entered
        const min = parseInt(timeMinInput.value) || 0;
        const sec = parseInt(timeSecInput.value) || 0;

        if (min === 0 && sec === 0) {
            alert("Please enter the time taken (Minutes or Seconds).");
            return false;
        }

        return true;
    }

    function calculate() {
        playClickSound(); // Play sound on click
        if (!validateInputs()) return;

        // 1. Calculate Raw Cycle Time
        const pieces = parseInt(piecesInput.value);
        const timeMin = parseInt(timeMinInput.value) || 0;
        const timeSec = parseInt(timeSecInput.value) || 0;

        const totalObservedSeconds = (timeMin * 60) + timeSec;
        const rawCycleTime = totalObservedSeconds / pieces;

        // 2. Calculate Effective Cycle Time (including downtime)
        const downMin = parseInt(downtimeMinInput.value) || 0;
        const downSec = parseInt(downtimeSecInput.value) || 0;
        const downFreq = parseInt(downtimeFreqInput.value) || 0;

        let downtimePerPiece = 0;

        if (downFreq > 0 && (downMin > 0 || downSec > 0)) {
            const totalDowntimeEventSeconds = (downMin * 60) + downSec;
            downtimePerPiece = totalDowntimeEventSeconds / downFreq;
        }

        const effectiveCycleTime = rawCycleTime + downtimePerPiece;

        // 3. Projections
        const output8hr = Math.floor(SHIFT_8_SEC / effectiveCycleTime);
        const output11hr = Math.floor(SHIFT_11_SEC / effectiveCycleTime);

        // Targets (Theoretical Max with 0 Downtime)
        // Avoid division by zero if rawCycleTime is extremely small (unlikely with validation)
        const safeRawCycle = rawCycleTime > 0 ? rawCycleTime : 1;
        const targetOutput8hr = Math.floor(SHIFT_8_SEC / safeRawCycle);
        const targetOutput11hr = Math.floor(SHIFT_11_SEC / safeRawCycle);

        // 4. Update UI

        // Show Results Area first so animations work on visible elements
        resultsArea.classList.remove('hidden');

        // Activate cards for simple CSS animations if any
        document.querySelectorAll('.output-card').forEach(card => card.classList.add('active'));

        // Cycle Time
        animateValue(resCycleTime, 0, rawCycleTime, 1000, 2);
        resCycleFormatted.textContent = `${rawCycleTime.toFixed(2)}s`;

        // 8-Hour Output
        animateValue(res8hrOutput, 0, output8hr, 1200, 0);
        target8hr.textContent = targetOutput8hr.toLocaleString();

        // 11-Hour Output
        animateValue(res11hrOutput, 0, output11hr, 1400, 0);
        target11hr.textContent = targetOutput11hr.toLocaleString();

        // Production Rate
        // If effective cycle time is very high, rate is low.
        const ratePerMin = effectiveCycleTime > 0 ? (60 / effectiveCycleTime) : 0;
        const ratePerHr = effectiveCycleTime > 0 ? (3600 / effectiveCycleTime) : 0;
        animateValue(resRateMin, 0, ratePerMin, 1000, 2);
        resRateHr.textContent = Math.round(ratePerHr).toLocaleString();

        // Efficiency (OEE Estimate: Actual / Theoretical)
        // Efficiency = (Raw Cycle Time / Effective Cycle Time) * 100
        let efficiency = 0;
        if (effectiveCycleTime > 0) {
            efficiency = (rawCycleTime / effectiveCycleTime) * 100;
        }
        animateValue(resEfficiency, 0, efficiency, 1000, 2);

        // Downtime Impact
        // Calculate total minutes lost in an 8hr shift for context
        // Production Time = Output * rawCycle
        // Downtime = Total Time - Production Time
        const productionTime8hr = output8hr * rawCycleTime;
        const downtimeSeconds8hr = SHIFT_8_SEC - productionTime8hr;
        // Ensure non-negative
        const downtimeMinutes = Math.max(0, Math.round(downtimeSeconds8hr / 60));
        const piecesLost = Math.max(0, targetOutput8hr - output8hr);

        animateValue(resDowntimeLoss, 0, downtimeMinutes, 1000, 0); // Minutes lost
        resDowntimePieces.textContent = piecesLost.toLocaleString();


        // Scroll to results on mobile
        if (window.innerWidth < 600) {
            resultsArea.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function playClickSound() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        try {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    }

    function animateValue(obj, start, end, duration, decimals = 0) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function (easeOutExpo)
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const currentVal = (easeProgress * (end - start) + start);

            if (decimals === 0) {
                obj.innerHTML = Math.floor(currentVal).toLocaleString();
            } else {
                obj.innerHTML = currentVal.toFixed(decimals);
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function reset() {
        piecesInput.value = '';
        timeMinInput.value = '';
        timeSecInput.value = '';
        downtimeMinInput.value = '';
        downtimeSecInput.value = '';
        downtimeFreqInput.value = '';

        resultsArea.classList.add('hidden');
        document.querySelectorAll('.output-card').forEach(card => card.classList.remove('active'));
    }

    // Event Listeners
    if (calculateBtn) calculateBtn.addEventListener('click', calculate);
    if (resetBtn) resetBtn.addEventListener('click', reset);
});

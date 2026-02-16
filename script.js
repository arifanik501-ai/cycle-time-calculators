document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const piecesInput = document.getElementById('pieces');
    const timeMinInput = document.getElementById('time-min');
    const timeSecInput = document.getElementById('time-sec');
    const downtimeMinInput = document.getElementById('downtime-min');
    const downtimeSecInput = document.getElementById('downtime-sec');
    const downtimeFreqInput = document.getElementById('downtime-freq');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultsArea = document.getElementById('results-area');

    // Result Elements
    const resCycleTime = document.getElementById('res-cycle-time');
    const resCycleTimeFormatted = document.getElementById('res-cycle-time-formatted');
    const res8hrOutput = document.getElementById('res-8hr-output');
    const res11hrOutput = document.getElementById('res-11hr-output');
    const bar8hr = document.getElementById('bar-8hr');
    const bar11hr = document.getElementById('bar-11hr');
    const resEfficiency = document.getElementById('res-efficiency');
    const resRateHr = document.getElementById('res-rate-hr');

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
        // Logic: Effective Cycle Time = Raw Cycle Time + (Downtime Duration per Event / Downtime Frequency)
        // If Every 100 pieces (Freq), we lose 5 mins (Duration).
        // Then average downtime per piece = 5mins / 100 = 300s / 100 = 3s/piece.

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
        // Output = Total Shift Time / Effective Cycle Time
        // This implicitly handles the "proportional downtime" logic.
        // Because: Time_Total = N * Cycle + (N/Freq) * Downtime_Event
        // Time_Total = N * (Cycle + Downtime_Event/Freq)
        // N = Time_Total / (Cycle + Downtime_Event/Freq) -> Exactly what we have!

        const output8hr = Math.floor(SHIFT_8_SEC / effectiveCycleTime);
        const output11hr = Math.floor(SHIFT_11_SEC / effectiveCycleTime);

        // 4. Update UI

        // Animate Numbers
        animateValue(res8hrOutput, 0, output8hr, 1000);
        animateValue(res11hrOutput, 0, output11hr, 1000);

        resCycleTime.textContent = rawCycleTime.toFixed(2);

        // Formatted MM:SS.ms
        const displayMin = Math.floor(rawCycleTime / 60);
        const displaySec = Math.floor(rawCycleTime % 60);
        const displayMs = Math.round((rawCycleTime % 1) * 100);
        resCycleTimeFormatted.textContent = `${displayMin}:${displaySec.toString().padStart(2, '0')}.${displayMs.toString().padStart(2, '0')}`;

        // Bonus Metrics
        const pcsPerHr = 3600 / effectiveCycleTime;
        resRateHr.textContent = Math.round(pcsPerHr);

        // Efficiency: (Raw Cycle Time / Effective Cycle Time) * 100
        // Or: (Theoretical Max Output / Actual Output) ?
        // Standard OEE Efficiency usually compares Run Time / Total Time.
        // Here, Effective Cycle Time includes downtime.
        // Efficiency = (Raw Cycle Time * Output) / Total Time
        // Efficiency = (Raw Cycle Time) / (Effective Cycle Time)
        const efficiency = (rawCycleTime / effectiveCycleTime) * 100;
        resEfficiency.textContent = efficiency.toFixed(1) + '%';

        // Bars
        // Set bar width relative to a theoretical max (assuming 0 downtime) or just standard 100% capacity visual?
        // Let's make bars represent Efficiency for now, or just fill up animation.
        // Actually, let's make the bar represent the % of shift time that is EFFECTIVE production vs Downtime.
        // Which is exactly the efficiency calculated above.
        setTimeout(() => {
            bar8hr.style.width = `${efficiency}%`;
            bar11hr.style.width = `${efficiency}%`;
        }, 100);

        // Show Results Area
        resultsArea.classList.remove('hidden');

        // Scroll to results on mobile
        if (window.innerWidth < 600) {
            resultsArea.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function playClickSound() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

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
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
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
        bar8hr.style.width = '0%';
        bar11hr.style.width = '0%';
    }

    // Event Listeners
    calculateBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', reset);
});

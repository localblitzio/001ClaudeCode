class FinancialCalculator {
    constructor() {
        // Display elements
        this.mainDisplay = document.querySelector('.main-display');
        this.memoryIndicator = document.getElementById('memory-indicator');
        this.calculationMode = document.getElementById('calculation-mode');
        this.beginEndIndicator = document.getElementById('begin-end');
        this.modeIndicator = document.getElementById('mode');

        // Calculator state
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.shiftActive = false;
        this.isNewEntry = true;

        // Financial registers
        this.registers = {
            N: 0,      // Number of periods
            I: 0,      // Interest rate per year
            PV: 0,     // Present Value
            PMT: 0,    // Payment
            FV: 0,     // Future Value
            PYR: 12,   // Payments per year
            BEGIN: false // Payment timing (false = END, true = BEGIN)
        };

        // Cash flows for NPV/IRR
        this.cashFlows = [];
        this.cashFlowFrequencies = [];

        // Memory
        this.memory = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.number').forEach(button => {
            button.addEventListener('click', () => {
                if (this.shiftActive) {
                    this.handleShiftFunction(button.dataset.shift);
                } else {
                    this.appendNumber(button.dataset.primary);
                }
            });
        });

        // Operator buttons
        document.querySelectorAll('.operator-key').forEach(button => {
            button.addEventListener('click', () => {
                if (this.shiftActive) {
                    this.handleShiftFunction(button.dataset.shift);
                } else {
                    this.chooseOperation(button.dataset.primary);
                }
            });
        });

        // Financial keys
        document.querySelectorAll('.financial-key').forEach(button => {
            button.addEventListener('click', () => {
                if (this.shiftActive) {
                    this.handleShiftFunction(button.dataset.shift);
                } else {
                    this.handleFinancialKey(button.dataset.primary);
                }
            });
        });

        // Function keys
        document.querySelectorAll('.function-key').forEach(button => {
            button.addEventListener('click', () => {
                if (this.shiftActive) {
                    this.handleShiftFunction(button.dataset.shift);
                } else {
                    this.handleFunctionKey(button.dataset.primary);
                }
            });
        });

        // Shift button
        document.getElementById('shift-btn').addEventListener('click', () => {
            this.toggleShift();
        });

        // Decimal button
        document.querySelector('.decimal').addEventListener('click', () => {
            if (this.shiftActive) {
                this.factorial();
            } else {
                this.appendNumber('.');
            }
        });

        // Equals button
        document.querySelector('.equals').addEventListener('click', () => {
            if (this.shiftActive) {
                this.shiftActive = false;
                this.updateShiftIndicator();
            } else {
                this.compute();
            }
        });

        // Help toggle
        document.getElementById('help-toggle').addEventListener('click', () => {
            document.getElementById('help-panel').classList.toggle('active');
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    toggleShift() {
        this.shiftActive = !this.shiftActive;
        this.updateShiftIndicator();
    }

    updateShiftIndicator() {
        const shiftBtn = document.getElementById('shift-btn');
        if (this.shiftActive) {
            shiftBtn.classList.add('active');
        } else {
            shiftBtn.classList.remove('active');
        }
    }

    appendNumber(num) {
        if (num === '.' && this.currentValue.includes('.')) return;

        if (this.isNewEntry) {
            if (num === '.') {
                this.currentValue = '0.';
            } else {
                this.currentValue = num;
            }
            this.isNewEntry = false;
        } else {
            if (this.currentValue === '0' && num !== '.') {
                this.currentValue = num;
            } else {
                this.currentValue += num;
            }
        }
        this.updateDisplay();
    }

    chooseOperation(op) {
        if (this.previousValue !== null) {
            this.compute();
        }
        this.operation = op;
        this.previousValue = parseFloat(this.currentValue);
        this.isNewEntry = true;
    }

    compute() {
        if (this.operation === null || this.previousValue === null) return;

        const current = parseFloat(this.currentValue);
        const previous = this.previousValue;
        let result;

        switch (this.operation) {
            case '+':
                result = previous + current;
                break;
            case '-':
                result = previous - current;
                break;
            case '*':
                result = previous * current;
                break;
            case '/':
                if (current === 0) {
                    alert('Error: Division by zero');
                    this.clear();
                    return;
                }
                result = previous / current;
                break;
        }

        this.currentValue = this.formatNumber(result);
        this.operation = null;
        this.previousValue = null;
        this.isNewEntry = true;
        this.updateDisplay();
    }

    handleFunctionKey(key) {
        switch (key) {
            case 'INPUT':
                this.isNewEntry = true;
                break;
            case 'C':
                this.clear();
                break;
            case '+/-':
                this.changeSign();
                break;
            case 'RCL':
                this.recall();
                break;
        }
    }

    handleShiftFunction(func) {
        this.shiftActive = false;
        this.updateShiftIndicator();

        switch (func) {
            case 'DELETE':
                this.deleteDigit();
                break;
            case 'CLEAR ALL':
                this.clearAll();
                break;
            case '1/x':
                this.reciprocal();
                break;
            case 'CFj':
                this.addCashFlow();
                break;
            case 'NJ':
                this.setCashFlowFrequency();
                break;
            case 'P/YR':
                this.setPaymentsPerYear();
                break;
            case 'BEG/END':
                this.toggleBeginEnd();
                break;
            case 'ROUND':
                this.roundValue();
                break;
            case 'CFo':
                this.setInitialCashFlow();
                break;
            case '√x':
                this.squareRoot();
                break;
            case 'x²':
                this.square();
                break;
            case 'y^x':
                this.power();
                break;
            case 'STO':
                this.store();
                break;
            case 'x!':
                this.factorial();
                break;
            case '%CHG':
                this.percentageChange();
                break;
        }
    }

    handleFinancialKey(key) {
        const value = parseFloat(this.currentValue);

        switch (key) {
            case 'N':
                if (this.isNewEntry && this.registers.N !== 0) {
                    // Recall N
                    this.currentValue = this.formatNumber(this.registers.N);
                    this.isNewEntry = false;
                } else {
                    // Store N or compute N
                    if (!this.isNewEntry) {
                        this.registers.N = value;
                        this.isNewEntry = true;
                    } else {
                        this.computeN();
                    }
                }
                break;
            case 'I/YR':
                if (this.isNewEntry && this.registers.I !== 0) {
                    this.currentValue = this.formatNumber(this.registers.I);
                    this.isNewEntry = false;
                } else {
                    if (!this.isNewEntry) {
                        this.registers.I = value;
                        this.isNewEntry = true;
                    } else {
                        this.computeI();
                    }
                }
                break;
            case 'PV':
                if (this.isNewEntry && this.registers.PV !== 0) {
                    this.currentValue = this.formatNumber(this.registers.PV);
                    this.isNewEntry = false;
                } else {
                    if (!this.isNewEntry) {
                        this.registers.PV = value;
                        this.isNewEntry = true;
                    } else {
                        this.computePV();
                    }
                }
                break;
            case 'PMT':
                if (this.isNewEntry && this.registers.PMT !== 0) {
                    this.currentValue = this.formatNumber(this.registers.PMT);
                    this.isNewEntry = false;
                } else {
                    if (!this.isNewEntry) {
                        this.registers.PMT = value;
                        this.isNewEntry = true;
                    } else {
                        this.computePMT();
                    }
                }
                break;
            case 'FV':
                if (this.isNewEntry && this.registers.FV !== 0) {
                    this.currentValue = this.formatNumber(this.registers.FV);
                    this.isNewEntry = false;
                } else {
                    if (!this.isNewEntry) {
                        this.registers.FV = value;
                        this.isNewEntry = true;
                    } else {
                        this.computeFV();
                    }
                }
                break;
            case 'NPV':
                this.computeNPV();
                break;
            case 'IRR':
                this.computeIRR();
                break;
            case '%':
                this.percentage();
                break;
        }
        this.updateDisplay();
    }

    // TVM Calculations
    computeN() {
        const i = this.registers.I / 100 / this.registers.PYR;
        const pv = this.registers.PV;
        const pmt = this.registers.PMT;
        const fv = this.registers.FV;

        if (i === 0) {
            if (pmt === 0) {
                this.currentValue = 'Error';
                return;
            }
            this.registers.N = -(pv + fv) / pmt;
        } else {
            const type = this.registers.BEGIN ? 1 : 0;
            const num = Math.log((pmt * (1 + i * type) - fv * i) / (pmt * (1 + i * type) + pv * i));
            const den = Math.log(1 + i);
            this.registers.N = num / den;
        }

        this.currentValue = this.formatNumber(this.registers.N);
        this.isNewEntry = true;
    }

    computeI() {
        // Newton-Raphson method for solving interest rate
        const n = this.registers.N;
        const pv = this.registers.PV;
        const pmt = this.registers.PMT;
        const fv = this.registers.FV;
        const type = this.registers.BEGIN ? 1 : 0;

        let i = 0.1; // Initial guess
        const maxIterations = 100;
        const tolerance = 0.000001;

        for (let iter = 0; iter < maxIterations; iter++) {
            const f = pv * Math.pow(1 + i, n) + pmt * (1 + i * type) * ((Math.pow(1 + i, n) - 1) / i) + fv;
            const df = n * pv * Math.pow(1 + i, n - 1) +
                       pmt * (1 + i * type) * (n * Math.pow(1 + i, n - 1) * i - Math.pow(1 + i, n) + 1) / (i * i) +
                       pmt * type * ((Math.pow(1 + i, n) - 1) / i);

            const iNew = i - f / df;

            if (Math.abs(iNew - i) < tolerance) {
                i = iNew;
                break;
            }
            i = iNew;
        }

        this.registers.I = i * this.registers.PYR * 100;
        this.currentValue = this.formatNumber(this.registers.I);
        this.isNewEntry = true;
    }

    computePV() {
        const n = this.registers.N;
        const i = this.registers.I / 100 / this.registers.PYR;
        const pmt = this.registers.PMT;
        const fv = this.registers.FV;
        const type = this.registers.BEGIN ? 1 : 0;

        if (i === 0) {
            this.registers.PV = -fv - pmt * n;
        } else {
            this.registers.PV = (-fv - pmt * (1 + i * type) * ((Math.pow(1 + i, n) - 1) / i)) / Math.pow(1 + i, n);
        }

        this.currentValue = this.formatNumber(this.registers.PV);
        this.isNewEntry = true;
    }

    computePMT() {
        const n = this.registers.N;
        const i = this.registers.I / 100 / this.registers.PYR;
        const pv = this.registers.PV;
        const fv = this.registers.FV;
        const type = this.registers.BEGIN ? 1 : 0;

        if (i === 0) {
            this.registers.PMT = -(pv + fv) / n;
        } else {
            this.registers.PMT = (-fv - pv * Math.pow(1 + i, n)) / ((1 + i * type) * ((Math.pow(1 + i, n) - 1) / i));
        }

        this.currentValue = this.formatNumber(this.registers.PMT);
        this.isNewEntry = true;
    }

    computeFV() {
        const n = this.registers.N;
        const i = this.registers.I / 100 / this.registers.PYR;
        const pv = this.registers.PV;
        const pmt = this.registers.PMT;
        const type = this.registers.BEGIN ? 1 : 0;

        if (i === 0) {
            this.registers.FV = -pv - pmt * n;
        } else {
            this.registers.FV = -pv * Math.pow(1 + i, n) - pmt * (1 + i * type) * ((Math.pow(1 + i, n) - 1) / i);
        }

        this.currentValue = this.formatNumber(this.registers.FV);
        this.isNewEntry = true;
    }

    // Cash Flow Functions
    setInitialCashFlow() {
        this.cashFlows = [parseFloat(this.currentValue)];
        this.cashFlowFrequencies = [1];
        this.calculationMode.textContent = 'CF0';
        this.isNewEntry = true;
        setTimeout(() => {
            this.calculationMode.textContent = '';
        }, 2000);
    }

    addCashFlow() {
        if (this.cashFlows.length === 0) {
            alert('Please enter CF0 first (SHIFT + IRR button)');
            return;
        }
        this.cashFlows.push(parseFloat(this.currentValue));
        this.cashFlowFrequencies.push(1);
        this.calculationMode.textContent = `CF${this.cashFlows.length - 1}`;
        this.isNewEntry = true;
        setTimeout(() => {
            this.calculationMode.textContent = '';
        }, 2000);
    }

    setCashFlowFrequency() {
        if (this.cashFlows.length === 0) {
            alert('No cash flows entered');
            return;
        }
        const freq = parseInt(this.currentValue);
        this.cashFlowFrequencies[this.cashFlowFrequencies.length - 1] = freq;
        this.calculationMode.textContent = `N${this.cashFlows.length - 1}=${freq}`;
        this.isNewEntry = true;
        setTimeout(() => {
            this.calculationMode.textContent = '';
        }, 2000);
    }

    computeNPV() {
        if (this.cashFlows.length === 0) {
            alert('No cash flows entered. Use SHIFT + CFo to enter initial cash flow, then SHIFT + CFj for subsequent flows');
            return;
        }

        const rate = this.registers.I / 100 / this.registers.PYR;
        let npv = this.cashFlows[0];
        let period = 0;

        for (let i = 1; i < this.cashFlows.length; i++) {
            const freq = this.cashFlowFrequencies[i] || 1;
            for (let j = 0; j < freq; j++) {
                period++;
                npv += this.cashFlows[i] / Math.pow(1 + rate, period);
            }
        }

        this.currentValue = this.formatNumber(npv);
        this.calculationMode.textContent = 'NPV';
        this.isNewEntry = true;
        setTimeout(() => {
            this.calculationMode.textContent = '';
        }, 2000);
    }

    computeIRR() {
        if (this.cashFlows.length < 2) {
            alert('Need at least 2 cash flows for IRR calculation');
            return;
        }

        // Newton-Raphson method
        let rate = 0.1; // Initial guess
        const maxIterations = 100;
        const tolerance = 0.000001;

        for (let iter = 0; iter < maxIterations; iter++) {
            let npv = this.cashFlows[0];
            let dnpv = 0;
            let period = 0;

            for (let i = 1; i < this.cashFlows.length; i++) {
                const freq = this.cashFlowFrequencies[i] || 1;
                for (let j = 0; j < freq; j++) {
                    period++;
                    npv += this.cashFlows[i] / Math.pow(1 + rate, period);
                    dnpv -= period * this.cashFlows[i] / Math.pow(1 + rate, period + 1);
                }
            }

            if (Math.abs(npv) < tolerance) break;

            rate = rate - npv / dnpv;

            if (iter === maxIterations - 1) {
                alert('IRR calculation did not converge');
                return;
            }
        }

        this.registers.I = rate * this.registers.PYR * 100;
        this.currentValue = this.formatNumber(this.registers.I);
        this.calculationMode.textContent = 'IRR';
        this.isNewEntry = true;
        setTimeout(() => {
            this.calculationMode.textContent = '';
        }, 2000);
    }

    // Utility Functions
    clear() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.isNewEntry = true;
        this.updateDisplay();
    }

    clearAll() {
        this.clear();
        this.registers = {
            N: 0,
            I: 0,
            PV: 0,
            PMT: 0,
            FV: 0,
            PYR: 12,
            BEGIN: false
        };
        this.cashFlows = [];
        this.cashFlowFrequencies = [];
        this.memory = 0;
        this.updateMemoryIndicator();
        this.calculationMode.textContent = 'ALL CLEAR';
        setTimeout(() => {
            this.calculationMode.textContent = '';
        }, 1500);
    }

    deleteDigit() {
        if (this.currentValue.length === 1 || this.currentValue === '0') {
            this.currentValue = '0';
        } else {
            this.currentValue = this.currentValue.slice(0, -1);
        }
        this.updateDisplay();
    }

    changeSign() {
        if (this.currentValue !== '0') {
            if (this.currentValue.startsWith('-')) {
                this.currentValue = this.currentValue.substring(1);
            } else {
                this.currentValue = '-' + this.currentValue;
            }
        }
        this.updateDisplay();
    }

    store() {
        this.memory = parseFloat(this.currentValue);
        this.updateMemoryIndicator();
        this.calculationMode.textContent = 'STORED';
        this.isNewEntry = true;
        setTimeout(() => {
            this.calculationMode.textContent = '';
        }, 1500);
    }

    recall() {
        this.currentValue = this.formatNumber(this.memory);
        this.isNewEntry = false;
        this.updateDisplay();
    }

    updateMemoryIndicator() {
        if (this.memory !== 0) {
            this.memoryIndicator.textContent = 'M';
        } else {
            this.memoryIndicator.textContent = '';
        }
    }

    setPaymentsPerYear() {
        const pyr = parseFloat(this.currentValue);
        if (pyr > 0) {
            this.registers.PYR = pyr;
            this.calculationMode.textContent = `P/YR=${pyr}`;
            this.isNewEntry = true;
            setTimeout(() => {
                this.calculationMode.textContent = '';
            }, 2000);
        }
    }

    toggleBeginEnd() {
        this.registers.BEGIN = !this.registers.BEGIN;
        this.beginEndIndicator.textContent = this.registers.BEGIN ? 'BEGIN' : 'END';
    }

    roundValue() {
        const decimals = parseInt(this.currentValue);
        if (decimals >= 0 && decimals <= 10) {
            this.roundDecimals = decimals;
            this.calculationMode.textContent = `ROUND=${decimals}`;
            setTimeout(() => {
                this.calculationMode.textContent = '';
            }, 2000);
        }
    }

    // Math Functions
    reciprocal() {
        const value = parseFloat(this.currentValue);
        if (value === 0) {
            alert('Error: Division by zero');
            return;
        }
        this.currentValue = this.formatNumber(1 / value);
        this.isNewEntry = true;
        this.updateDisplay();
    }

    square() {
        const value = parseFloat(this.currentValue);
        this.currentValue = this.formatNumber(value * value);
        this.isNewEntry = true;
        this.updateDisplay();
    }

    squareRoot() {
        const value = parseFloat(this.currentValue);
        if (value < 0) {
            alert('Error: Cannot take square root of negative number');
            return;
        }
        this.currentValue = this.formatNumber(Math.sqrt(value));
        this.isNewEntry = true;
        this.updateDisplay();
    }

    power() {
        if (this.previousValue !== null) {
            const base = this.previousValue;
            const exponent = parseFloat(this.currentValue);
            this.currentValue = this.formatNumber(Math.pow(base, exponent));
            this.previousValue = null;
            this.operation = null;
        } else {
            this.previousValue = parseFloat(this.currentValue);
            this.operation = '^';
        }
        this.isNewEntry = true;
        this.updateDisplay();
    }

    factorial() {
        const n = parseInt(this.currentValue);
        if (n < 0 || n > 170) {
            alert('Error: Factorial only valid for 0 <= n <= 170');
            return;
        }
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        this.currentValue = this.formatNumber(result);
        this.isNewEntry = true;
        this.updateDisplay();
    }

    percentage() {
        if (this.previousValue !== null) {
            const base = this.previousValue;
            const percent = parseFloat(this.currentValue);
            this.currentValue = this.formatNumber(base * percent / 100);
            this.isNewEntry = true;
            this.updateDisplay();
        }
    }

    percentageChange() {
        if (this.previousValue !== null) {
            const old = this.previousValue;
            const current = parseFloat(this.currentValue);
            const change = ((current - old) / old) * 100;
            this.currentValue = this.formatNumber(change);
            this.previousValue = null;
            this.isNewEntry = true;
            this.updateDisplay();
        }
    }

    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
            return 'Error';
        }

        // Handle very large or very small numbers with scientific notation
        if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(6);
        }

        // Round to 8 decimal places to avoid floating point errors
        num = Math.round(num * 100000000) / 100000000;

        return num.toString();
    }

    updateDisplay() {
        this.mainDisplay.textContent = this.currentValue;
    }

    handleKeyboard(e) {
        if (e.key >= '0' && e.key <= '9') {
            this.appendNumber(e.key);
        } else if (e.key === '.') {
            this.appendNumber('.');
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            this.compute();
        } else if (e.key === 'Escape') {
            this.clear();
        } else if (e.key === 'Backspace') {
            this.deleteDigit();
        } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
            this.chooseOperation(e.key);
        }
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new FinancialCalculator();
});
